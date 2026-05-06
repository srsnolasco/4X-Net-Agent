/**
 * Script para criar R1, R2 e conectá-los via WAN (Serial) no Packet Tracer
 * Usa o servidor MCP na porta 39001
 */

const MCP_URL = "http://127.0.0.1:39001/mcp";
let sessionId = null;

async function mcpRequest(body) {
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
  };
  if (sessionId) {
    headers["mcp-session-id"] = sessionId;
  }

  const response = await fetch(MCP_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  // Captura o session-id do header
  const sid = response.headers.get("mcp-session-id");
  if (sid) sessionId = sid;

  const rawText = await response.text();

  // Tenta parsear SSE
  const lines = rawText.split("\n");
  let resultData = null;
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      try {
        resultData = JSON.parse(line.substring(6));
      } catch (e) { /* ignore */ }
    }
  }

  // Se não achou SSE, tenta JSON direto
  if (!resultData) {
    try {
      resultData = JSON.parse(rawText);
    } catch (e) {
      resultData = rawText;
    }
  }

  return resultData;
}

async function initSession() {
  console.log("🔌 Inicializando sessão MCP...");
  const result = await mcpRequest({
    jsonrpc: "2.0",
    id: 0,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "topology-script", version: "1.0" },
    },
  });
  console.log("✅ Sessão iniciada. ID:", sessionId);
  return result;
}

async function callTool(toolName, args = {}) {
  console.log(`\n⚙️  Executando: ${toolName}`, JSON.stringify(args));
  const result = await mcpRequest({
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/call",
    params: {
      name: toolName,
      arguments: args,
    },
  });

  if (result?.error) {
    console.error(`❌ Erro: ${result.error.message}`);
    return null;
  }

  const text = result?.result?.content?.[0]?.text || JSON.stringify(result);
  console.log(`📋 Resultado: ${text}`);
  return text;
}

async function main() {
  try {
    await initSession();

    // 1. Criar Roteador R1
    console.log("\n━━━ PASSO 1: Criar Roteador R1 ━━━");
    await callTool("pt_add_device", { model: "2911", name: "R1", x: 200, y: 300 });

    // 2. Criar Roteador R2
    console.log("\n━━━ PASSO 2: Criar Roteador R2 ━━━");
    await callTool("pt_add_device", { model: "2911", name: "R2", x: 500, y: 300 });

    // 3. Instalar módulo Serial (HWIC-2T) no R1 slot 0/0
    console.log("\n━━━ PASSO 3: Instalar módulo Serial no R1 ━━━");
    await callTool("pt_add_module", { device: "R1", module: "HWIC-2T", slot: "0/0" });

    // 4. Instalar módulo Serial (HWIC-2T) no R2 slot 0/0
    console.log("\n━━━ PASSO 4: Instalar módulo Serial no R2 ━━━");
    await callTool("pt_add_module", { device: "R2", module: "HWIC-2T", slot: "0/0" });

    // 5. Conectar R1 e R2 via cabo serial (WAN)
    console.log("\n━━━ PASSO 5: Conectar R1 ↔ R2 via WAN (Serial) ━━━");
    await callTool("pt_create_link", {
      device_a: "R1",
      port_a: "Serial0/0/0",
      device_b: "R2",
      port_b: "Serial0/0/0",
      cable: "serial",
    });

    // 6. Verificar topologia
    console.log("\n━━━ PASSO 6: Verificar topologia final ━━━");
    await callTool("pt_query_topology");

    console.log("\n🎉 Topologia criada com sucesso! R1 ↔ R2 via WAN Serial.");

  } catch (err) {
    console.error("💥 Erro fatal:", err.message);
  }
}

main();
