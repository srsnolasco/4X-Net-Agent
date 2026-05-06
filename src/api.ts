export const MCP_URL = "/mcp";

let sessionId: string | null = null;

export async function initSession(): Promise<string> {
  const response = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 0,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "pt-dashboard", version: "1.0" },
      },
    }),
  });
  
  sessionId = response.headers.get("mcp-session-id");
  if (!sessionId) {
    throw new Error("Não foi possível iniciar a sessão com o Packet Tracer");
  }
  return sessionId;
}

export async function callMcpTool(toolName: string, args: any = {}) {
  if (!sessionId) {
    await initSession();
  }
  
  const response = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "mcp-session-id": sessionId!,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
    }),
  });

  const rawText = await response.text();
  
  // O servidor MCP pode responder em formato SSE (Server-Sent Events)
  const lines = rawText.split("\n");
  let resultData = null;
  
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      try {
         resultData = JSON.parse(line.substring(6));
      } catch (e) {
        console.error("Erro no parse do JSON SSE", e);
      }
    }
  }
  
  // Se não achar a linha data:, tenta fazer parse do texto cru
  if (!resultData) {
    try {
      resultData = JSON.parse(rawText);
    } catch(e) {
      resultData = rawText;
    }
  }

  // Se der erro do lado do MCP
  if (resultData?.error) {
    throw new Error(resultData.error.message || "Erro desconhecido");
  }

  // Retorna o conteúdo de texto da resposta, se existir
  if (resultData?.result?.content?.[0]?.text) {
    return resultData.result.content[0].text;
  }

  return resultData;
}
