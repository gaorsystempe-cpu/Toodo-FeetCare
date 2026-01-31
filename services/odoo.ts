
// Utilidad para escapar caracteres especiales de XML
const xmlEscape = (str: string) => 
  str.replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&apos;');

// Serializador XML-RPC
const serialize = (value: any): string => {
  if (value === null || value === undefined) return `<string></string>`;
  if (typeof value === 'number') return Number.isInteger(value) ? `<int>${value}</int>` : `<double>${value}</double>`;
  if (typeof value === 'string') return `<string>${xmlEscape(value)}</string>`;
  if (typeof value === 'boolean') return `<boolean>${value ? '1' : '0'}</boolean>`;
  if (Array.isArray(value)) return `<array><data>${value.map(v => `<value>${serialize(v)}</value>`).join('')}</data></array>`;
  if (typeof value === 'object') {
    if (value instanceof Date) return `<string>${value.toISOString()}</string>`;
    return `<struct>${Object.entries(value).map(([k, v]) => `<member><name>${k}</name><value>${serialize(v)}</value></member>`).join('')}</struct>`;
  }
  return `<string>${xmlEscape(String(value))}</string>`;
};

// Parser XML-RPC
const parseValue = (node: Element): any => {
  const child = node.firstElementChild;
  if (!child) return node.textContent; 
  switch (child.tagName) {
    case 'string': return child.textContent;
    case 'int': case 'i4': return parseInt(child.textContent || '0', 10);
    case 'double': return parseFloat(child.textContent || '0');
    case 'boolean': return child.textContent === '1';
    case 'array': 
      const dataNode = child.querySelector('data');
      return dataNode ? Array.from(dataNode.children).map(parseValue) : [];
    case 'struct':
      const obj: any = {};
      Array.from(child.children).forEach(member => {
        const name = member.querySelector('name')?.textContent || '';
        const valNode = member.querySelector('value');
        if (name && valNode) obj[name] = parseValue(valNode);
      });
      return obj;
    default: return child.textContent;
  }
};

export class OdooClient {
  private url: string;
  private db: string;
  
  // Proxies mejorados para Vercel
  private proxies = [
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    (url: string) => url, // Directo como último recurso
  ];

  constructor(url: string, db: string) {
    this.url = url.trim().replace(/\/+$/, ''); 
    if (!this.url.startsWith('http')) {
        this.url = 'https://' + this.url;
    }
    this.db = db.trim();
  }

  private async rpcCall(endpoint: string, method: string, params: any[]) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<methodCall>
  <methodName>${method}</methodName>
  <params>${params.map(p => `<param><value>${serialize(p)}</value></param>`).join('')}</params>
</methodCall>`.trim();

    const targetUrl = `${this.url}/xmlrpc/2/${endpoint}`;
    let lastError: any = null;

    for (const proxyFn of this.proxies) {
      try {
        const fetchUrl = proxyFn(targetUrl);
        return await this.executeFetch(fetchUrl, xml);
      } catch (error: any) {
        lastError = error;
        if (error.message.includes('Error de Odoo:')) throw error;
        console.warn(`Proxy fallido, intentando siguiente...`, error.message);
        continue; 
      }
    }

    throw new Error(`Error de conexión con Odoo: ${lastError?.message || 'CORS o Red bloqueada'}. Verifique que el servidor Odoo acepte conexiones XML-RPC.`);
  }

  private async executeFetch(url: string, xml: string) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: xml
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();
    if (!text) throw new Error("Respuesta vacía");

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    
    if (doc.querySelector('parsererror')) throw new Error("XML inválido");

    const fault = doc.querySelector('fault');
    if (fault) {
      const faultValue = fault.querySelector('value');
      const faultStruct = faultValue ? parseValue(faultValue) : { faultString: 'Error desconocido' };
      throw new Error(`Error de Odoo: ${faultStruct.faultString}`);
    }

    const paramNode = doc.querySelector('params param value');
    return paramNode ? parseValue(paramNode) : null;
  }

  async authenticate(username: string, apiKey: string): Promise<number> {
    const uid = await this.rpcCall('common', 'authenticate', [this.db, username, apiKey, {}]);
    if (uid === false || typeof uid !== 'number') {
        throw new Error("Credenciales inválidas para la DB " + this.db);
    }
    return uid;
  }

  async searchRead(uid: number, apiKey: string, model: string, domain: any[], fields: string[], options: any = {}) {
    return await this.rpcCall('object', 'execute_kw', [
        this.db, uid, apiKey, model, 'search_read', [domain], { fields, ...options }
    ]);
  }
}
