
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
  
  // Lista de proxies actualizada y optimizada para Vercel/Producción
  private proxies = [
    (url: string) => url, // Intento directo (por si el servidor soporta CORS)
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`
  ];

  constructor(url: string, db: string) {
    // Asegurar que la URL sea válida y no tenga slashes al final
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

    // Intentar con cada proxy disponible de forma secuencial
    for (const proxyFn of this.proxies) {
      try {
        const fetchUrl = proxyFn(targetUrl);
        return await this.executeFetch(fetchUrl, xml);
      } catch (error: any) {
        lastError = error;
        // Si es un error de Odoo (XML válido pero con fault), no seguir con otros proxies
        if (error.message.includes('Error de Odoo:')) {
            throw error;
        }
        console.warn(`Intento fallido con proxy ${proxyFn.name || 'actual'}, intentando el siguiente...`, error.message);
        continue; 
      }
    }

    // Si llegamos aquí, todos fallaron
    const errorMessage = lastError?.message || "Error de red";
    if (errorMessage.includes("Failed to fetch")) {
        throw new Error("No se pudo conectar con Odoo (Error de CORS/Red). Verifique que la URL de Odoo sea accesible y use HTTPS.");
    }
    throw lastError;
  }

  private async executeFetch(url: string, xml: string) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml'
      },
      body: xml
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor de Odoo o Proxy (HTTP ${response.status})`);
    }

    const text = await response.text();
    if (!text || text.trim().length === 0) {
        throw new Error("El servidor de Odoo devolvió una respuesta vacía.");
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    
    // Validar si hay error de parseo XML
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
        throw new Error("Error en el formato de respuesta del servidor (XML inválido).");
    }

    const fault = doc.querySelector('fault');
    if (fault) {
      const faultValue = fault.querySelector('value');
      const faultStruct = faultValue ? parseValue(faultValue) : { faultString: 'Error desconocido de Odoo' };
      throw new Error(`Error de Odoo: ${faultStruct.faultString}`);
    }

    const paramNode = doc.querySelector('params param value');
    return paramNode ? parseValue(paramNode) : null;
  }

  async authenticate(username: string, apiKey: string): Promise<number> {
    const uid = await this.rpcCall('common', 'authenticate', [this.db, username, apiKey, {}]);
    if (uid === false || typeof uid !== 'number') {
        throw new Error("Credenciales de Odoo inválidas para la base de datos " + this.db);
    }
    return uid;
  }

  async searchRead(uid: number, apiKey: string, model: string, domain: any[], fields: string[], options: any = {}) {
    return await this.rpcCall('object', 'execute_kw', [
        this.db, uid, apiKey, model, 'search_read', [domain], { fields, ...options }
    ]);
  }
}
