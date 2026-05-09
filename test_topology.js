fetch('http://localhost:39001', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "pt_query_topology",
      arguments: {}
    }
  })
}).then(r => r.json()).then(d => {
  const result = JSON.parse(d.result.content[0].text);
  console.log(JSON.stringify(result.devices[0].ports[0], null, 2));
}).catch(console.error);
