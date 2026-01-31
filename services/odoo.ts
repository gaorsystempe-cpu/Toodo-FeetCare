
export class OdooClient {
  private url: string;
  private db: string;

  constructor(url: string, db: string) {
    this.url = url.trim().replace(/\/+$/, '');
    if (!this.url.startsWith('http')) {
      this.url = 'https://' + this.url;
    }
    this.db = db.trim();
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private serialize(value: any): string {
    if (value === null || value === undefined) return '<value><string></string></value>';
    if (typeof value === 'string') return `<value><string>${this.escapeXml(value)}</string></value>`;
    if (typeof value === 'number') {
      return Number.isInteger(value) 
        ? `<value><int>${value}</int></value>` 
        : `<value><double>${value}</double></value>`;
    }
    if (typeof value === 'boolean') return `<value><boolean>${value ? '1' : '0'}</boolean></value>`;
    if (Array.isArray(value)) {
      return `<value><array><data>${value.map(v => this.serialize(v)).join('')}</data></array></value>`;
    }
    if (typeof value === 'object') {
      const members = Object.entries(value)
        .map(([k, v]) => `<member><name>${k}</name>${this.serialize(v)}</member>`)
        .join('');
      return `<value><struct>${members}</struct></value>`;
    }
    return `<value><string>${this.escapeXml(String(value))}</string></value>`;
  }

  private parseValue(element: Element): any {
    const child = element.firstElementChild;
    if (!child) return element.textContent;

    const tag = child.tagName.toLowerCase();
    switch (tag) {
      case 'string': return child.textContent || '';
      case 'int': case 'i4': return parseInt(child.textContent || '0', 10);
      case 'double': return parseFloat(child.textContent || '0');
      case 'boolean': return child.textContent === '1' || child.textContent?.toLowerCase() === 'true';
      case 'array':
        const dataNode = child.querySelector('data');
        return dataNode ? Array.from(dataNode.children).map(v => this.parseValue(v as Element)) : [];
      case 'struct':
        const obj: any = {};
        Array.from(child.children).forEach(member => {
          const name = member.querySelector('name')?.textContent;
          const valNode = member.querySelector('value');
          if (name && valNode) obj[name] = this.parseValue(valNode);
        });
        return obj;
      default: return child.textContent;
    }
  }

  private async rpcCall(service: string, method: string, params: any[]) {
    const xmlBody = `<?xml version="1.0"?>
<methodCall>
  <methodName>${method}</methodName>
  <params>
    ${params.map(p => `<param>${this.serialize(p)}</param>`).join('')}
  </params>
</methodCall>`.trim();

    const targetUrl = `${this.url}/xmlrpc/2/${service}`;
    
    try {
      // Intentamos usar el proxy local (Vercel)
      const response = await fetch('/api/odoo-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, body: xmlBody })
      });

      // Fallback a proxy público si el local no responde (entorno de desarrollo local)
      if (!response.ok && response.status === 404) {
        console.warn("Proxy local no encontrado, usando fallback público...");
        const fallbackUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        const fbResponse = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/xml' },
          body: xmlBody
        });
        return await this.handleResponse(fbResponse);
      }

      return await this.handleResponse(response);
    } catch (error: any) {
      throw new Error(`Error de conexión: ${error.message}`);
    }
  }

  private async handleResponse(response: Response) {
    const text = await response.text();
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);

    const doc = new DOMParser().parseFromString(text, 'text/xml');
    const fault = doc.querySelector('fault');
    
    if (fault) {
      const faultValue = fault.querySelector('value');
      const faultData = faultValue ? this.parseValue(faultValue) : {};
      throw new Error(`Odoo Fault: ${faultData.faultString || 'Error desconocido'}`);
    }

    const resultValue = doc.querySelector('methodResponse params param value');
    return resultValue ? this.parseValue(resultValue) : null;
  }

  async authenticate(username: string, apiKey: string): Promise<number> {
    const uid = await this.rpcCall('common', 'authenticate', [this.db, username, apiKey, {}]);
    if (uid === false || typeof uid !== 'number') {
      throw new Error("Credenciales inválidas o base de datos no encontrada.");
    }
    return uid;
  }

  async searchRead(uid: number, apiKey: string, model: string, domain: any[], fields: string[], options: any = {}) {
    return await this.rpcCall('object', 'execute_kw', [
      this.db, uid, apiKey, model, 'search_read', [domain], { fields, ...options }
    ]);
  }
}
