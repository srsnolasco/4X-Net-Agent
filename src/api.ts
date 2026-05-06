export const MCP_URL = "/mcp";

let sessionId: string | null = null;

/**
 * Extrai o JSON de dentro de uma resposta SSE (Server-Sent Events).
 * O servidor MCP retorna no formato:
 *   event: message
 *   id: ...
 *   data: {...json...}
 */
function parseSSE(rawText: string): any {
  const lines = rawText.split("\n");
  let resultData = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("data: ") || trimmed.startsWith("data:")) {
      const jsonStr = trimmed.startsWith("data: ")
        ? trimmed.substring(6)
        : trimmed.substring(5);
      try {
        resultData = JSON.parse(jsonStr);
      } catch (e) {
        console.error("Erro no parse do JSON SSE", e);
      }
    }
  }

  // Se não achou data:, tenta parse do texto inteiro
  if (!resultData) {
    try {
      resultData = JSON.parse(rawText);
    } catch (e) {
      resultData = rawText;
    }
  }

  return resultData;
}

export async function initSession(): Promise<string> {
  // 1. Envia o "initialize" e captura o session-id
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

  // Consome o body para liberar a conexão
  const rawText = await response.text();
  const parsed = parseSSE(rawText);
  console.log("[MCP] initialize response:", parsed);

  if (!sessionId) {
    // Fallback: tenta extrair de um campo no body (alguns proxies não passam headers customizados)
    console.warn("[MCP] mcp-session-id não encontrado nos headers, tentando continuar sem session...");
  }

  // 2. Envia "notifications/initialized" (obrigatório pelo protocolo MCP)
  //    Esta é uma notificação (sem id), confirma ao servidor que estamos prontos.
  const initHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
  };
  if (sessionId) {
    initHeaders["mcp-session-id"] = sessionId;
  }

  try {
    await fetch(MCP_URL, {
      method: "POST",
      headers: initHeaders,
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      }),
    });
    console.log("[MCP] notifications/initialized enviado com sucesso");
  } catch (e) {
    console.warn("[MCP] Falha ao enviar notifications/initialized (não-fatal):", e);
  }

  return sessionId || "no-session";
}

export async function callMcpTool(toolName: string, args: any = {}) {
  if (!sessionId) {
    await initSession();
  }

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
  };
  if (sessionId) {
    reqHeaders["mcp-session-id"] = sessionId;
  }

  const response = await fetch(MCP_URL, {
    method: "POST",
    headers: reqHeaders,
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

  // Se a resposta não for OK, tenta re-inicializar a sessão
  if (response.status === 400 || response.status === 404) {
    const errText = await response.text();
    console.warn(`[MCP] Sessão inválida (HTTP ${response.status}), re-inicializando...`, errText);
    sessionId = null;
    await initSession();

    // Repete a chamada com a nova sessão
    const retryHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    };
    if (sessionId) {
      retryHeaders["mcp-session-id"] = sessionId;
    }

    const retryResponse = await fetch(MCP_URL, {
      method: "POST",
      headers: retryHeaders,
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

    const retryText = await retryResponse.text();
    return processToolResponse(retryText);
  }

  const rawText = await response.text();
  return processToolResponse(rawText);
}

function processToolResponse(rawText: string): any {
  const resultData = parseSSE(rawText);

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
