
// Proxy para Odoo XML-RPC
export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, body } = req.body;

    if (!url || !body) {
      return res.status(400).json({ error: 'Missing url or body' });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Accept': 'text/xml',
      },
      body: body,
    });

    const data = await response.text();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return res.status(500).json({
      error: 'Proxy request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
