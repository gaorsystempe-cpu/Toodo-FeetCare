// CONFIGURACIÓN PARA EXPORTAR A N8N - VERSIÓN V12 (ULTRA-RESILIENTE)
export const DAILY_WORKFLOW_JSON = {
  "name": "LemonBI - Reporte Diario v12 (Bulletproof)",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [{ "field": "cronExpression", "expression": "30 12 * * *" }]
        }
      },
      "name": "Cron - 12:30 PM",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [0, 300]
    },
    {
      "parameters": {
        "url": "https://ogopzhmsjnotuntfimpx.supabase.co/rest/v1/empresas?select=*&estado=eq.true",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "apikey", "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nb3B6aG1zam5vdHVudGZpbXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MjcwNjksImV4cCI6MjA4MTUwMzA2OX0.z9rcjc9ToplMYhLKQQl0iuKYc87hm1JAN2O1yfv3lmE" },
            { "name": "Authorization", "value": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nb3B6aG1zam5vdHVudGZpbXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MjcwNjksImV4cCI6MjA4MTUwMzA2OX0.z9rcjc9ToplMYhLKQQl0iuKYc87hm1JAN2O1yfv3lmE" }
          ]
        }
      },
      "name": "GET Empresas",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [200, 300]
    },
    {
      "parameters": { "batchSize": 1, "options": {} },
      "name": "Iterar Empresas",
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 3,
      "position": [400, 300]
    },
    {
      "parameters": {
        "jsCode": "const data = $json;\nconst date = new Date();\ndate.setDate(date.getDate() - 1);\nconst yesterdayStr = date.toISOString().split('T')[0];\n\nlet rawUrl = (data.odoo_url || '').trim();\nlet url = rawUrl.replace(/\\/+$/, '');\nif (url && !url.startsWith('http')) {\n  url = 'https://' + url;\n}\n\nreturn {\n  json: {\n    config: {\n      id: data.id,\n      url: url,\n      db: (data.odoo_db || '').trim(),\n      apiKey: (data.odoo_api_key || '').trim(),\n      username: (data.odoo_username || '').trim(),\n      empresa: data.codigo_acceso,\n      phones: (data.whatsapp_numeros || '').split(',').map(num => num.trim().replace(/\\D/g, '')).filter(num => num.length >= 9),\n      fecha: yesterdayStr\n    }\n  }\n};"
      },
      "name": "Preparar Config",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [600, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{$json.config.url}}/xmlrpc/2/common",
        "sendBody": true,
        "contentType": "raw",
        "rawContentType": "text/xml",
        "body": "<?xml version=\"1.0\"?>\n<methodCall>\n  <methodName>authenticate</methodName>\n  <params>\n    <param><value><string>{{$json.config.db}}</string></param>\n    <param><value><string>{{$json.config.username}}</string></param>\n    <param><value><string>{{$json.config.apiKey}}</string></param>\n    <param><value><struct></struct></param>\n  </params>\n</methodCall>",
        "options": { "response": { "response": { "outputFieldName": "authResponse" } } }
      },
      "name": "Odoo Auth",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [800, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{$node[\"Preparar Config\"].json.config.url}}/xmlrpc/2/object",
        "sendBody": true,
        "contentType": "raw",
        "rawContentType": "text/xml",
        "body": "<?xml version=\"1.0\"?>\n<methodCall>\n  <methodName>execute_kw</methodName>\n  <params>\n    <param><value><string>{{$node[\"Preparar Config\"].json.config.db}}</string></param>\n    <param><value><int>{{parseInt($json.authResponse.match(/<(?:int|i4)>(\\d+)<\\//)[1])}}</int></param>\n    <param><value><string>{{$node[\"Preparar Config\"].json.config.apiKey}}</string></param>\n    <param><value><string>pos.session</string></param>\n    <param><value><string>search_read</string></param>\n    <param><value><array><data>\n      <value><array><data>\n        <value><array><data><value><string>stop_at</string></value><value><string>&gt;=</string></value><value><string>{{$node[\"Preparar Config\"].json.config.fecha}} 00:00:00</string></value></data></array></value>\n        <value><array><data><value><string>stop_at</string></value><value><string>&lt;=</string></value><value><string>{{$node[\"Preparar Config\"].json.config.fecha}} 23:59:59</string></value></data></array></value>\n        <value><array><data><value><string>state</string></value><value><string>=</string></value><value><string>closed</string></value></data></array></value>\n      </data></array></value>\n    </data></array></param>\n    <param><value><struct><member><name>fields</name><value><array><data><value><string>name</string></value><value><string>cash_register_balance_end_real</string></value><value><string>cash_register_balance_start</string></value></data></array></value></member></struct></param>\n  </params>\n</methodCall>",
        "options": { "response": { "response": { "outputFieldName": "sessionsResponse" } } }
      },
      "name": "Get Sessions",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1000, 300]
    },
    {
      "parameters": {
        "jsCode": "const sessionsXml = $json.sessionsResponse || '';\nconst config = $node[\"Preparar Config\"].json.config;\n\nconst extractAll = (xml, tag) => {\n  const regex = new RegExp(`<member><name>${tag}<\\/name><value><(?:string|double|int|i4)>(.*?)<\\/`, 'g');\n  const results = []; let m;\n  while ((m = regex.exec(xml)) !== null) results.push(m[1]);\n  return results;\n};\n\nconst names = extractAll(sessionsXml, 'name');\nconst starts = extractAll(sessionsXml, 'cash_register_balance_start');\nconst ends = extractAll(sessionsXml, 'cash_register_balance_end_real');\n\nlet totalVenta = 0;\nlet detalleJson = [];\nlet msg = `📊 *REPORTE DE CAJA - LEMONBI*\\n🏢 *${config.empresa}*\\n📅 ${config.fecha}\\n\\n`;\n\nif (names.length > 0) {\n  for (let i = 0; i < names.length; i++) {\n    const s = parseFloat(starts[i] || 0);\n    const e = parseFloat(ends[i] || 0);\n    const neta = e - s;\n    totalVenta += neta;\n    detalleJson.push({ caja: names[i], apertura: s, arqueo: e, neta: neta });\n    msg += `📍 *${names[i]}*\\n   • Venta: S/ ${neta.toFixed(2)}\\n   • Arqueo: S/ ${e.toFixed(2)}\\n\\n`;\n  }\n  msg += `💰 *TOTAL VENTA NETA: S/ ${totalVenta.toFixed(2)}*`;\n} else {\n  msg += \"⚠️ No se encontraron cierres de caja para ayer.\";\n}\n\nreturn { json: { message: msg, phones: config.phones, totalVenta: totalVenta, detalleJson: detalleJson, empresa_id: config.id, fecha: config.fecha } };"
      },
      "name": "Format Report",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1200, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://ogopzhmsjnotuntfimpx.supabase.co/rest/v1/reportes_cierre",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "apikey", "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nb3B6aG1zam5vdHVudGZpbXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MjcwNjksImV4cCI6MjA4MTUwMzA2OX0.z9rcjc9ToplMYhLKQQl0iuKYc87hm1JAN2O1yfv3lmE" },
            { "name": "Authorization", "value": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nb3B6aG1zam5vdHVudGZpbXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MjcwNjksImV4cCI6MjA4MTUwMzA2OX0.z9rcjc9ToplMYhLKQQl0iuKYc87hm1JAN2O1yfv3lmE" }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            { "name": "empresa_id", "value": "={{$json.empresa_id}}" },
            { "name": "fecha_reporte", "value": "={{$json.fecha}}" },
            { "name": "total_ventas", "value": "={{$json.totalVenta}}" },
            { "name": "detalle_json", "value": "={{JSON.stringify($json.detalleJson)}}" },
            { "name": "enviado_whatsapp", "value": "true" }
          ]
        },
        "options": { "response": { "response": { "outputFieldName": "supaResponse" } } }
      },
      "name": "Guardar en Supabase",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1400, 300]
    },
    {
      "parameters": {
        "jsCode": "const phones = $node[\"Format Report\"].json.phones || [];\nconst message = $node[\"Format Report\"].json.message;\n\n// Retornamos un item por cada teléfono, inyectando el mensaje\nreturn phones.map(phone => {\n  return { json: { target_phone: phone, report_text: message } };\n});"
      },
      "name": "Split Phones (Code)",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1600, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.red51.site/message/sendText/farmacia",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            { "name": "number", "value": "={{$json.target_phone}}" },
            { "name": "text", "value": "={{$json.report_text}}" }
          ]
        }
      },
      "name": "Evolution API",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1800, 300]
    }
  ],
  "connections": {
    "Cron - 12:30 PM": { "main": [[{ "node": "GET Empresas", "type": "main", "index": 0 }]] },
    "GET Empresas": { "main": [[{ "node": "Iterar Empresas", "type": "main", "index": 0 }]] },
    "Iterar Empresas": { "main": [[{ "node": "Preparar Config", "type": "main", "index": 0 }]] },
    "Preparar Config": { "main": [[{ "node": "Odoo Auth", "type": "main", "index": 0 }]] },
    "Odoo Auth": { "main": [[{ "node": "Get Sessions", "type": "main", "index": 0 }]] },
    "Get Sessions": { "main": [[{ "node": "Format Report", "type": "main", "index": 0 }]] },
    "Format Report": { "main": [[{ "node": "Guardar en Supabase", "type": "main", "index": 0 }]] },
    "Guardar en Supabase": { "main": [[{ "node": "Split Phones (Code)", "type": "main", "index": 0 }]] },
    "Split Phones (Code)": { "main": [[{ "node": "Evolution API", "type": "main", "index": 0 }]] },
    "Evolution API": { "main": [[{ "node": "Iterar Empresas", "type": "main", "index": 0 }]] }
  }
};

export const MONTHLY_WORKFLOW_JSON = {
  "name": "LemonBI - Reporte Mensual Automatizado",
  "nodes": [
    {
      "parameters": { "rule": { "interval": [{ "field": "cronExpression", "expression": "0 8 1 * *" }] } },
      "name": "Cada día 1 - 8:00 AM",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [400, 300]
    }
  ],
  "connections": {}
};