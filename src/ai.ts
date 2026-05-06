import OpenAI from "openai";
import { callMcpTool } from "./api";

// Ferramentas mapeadas para a OpenAI (as mesmas do servidor MCP)
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "pt_add_device",
      description: "Adiciona um dispositivo no Packet Tracer (Roteador, Switch, PC, etc)",
      parameters: {
        type: "object",
        properties: {
          model: { type: "string", description: "Modelo (ex: '2911', '2960-24TT', 'PC-PT')" },
          name: { type: "string", description: "Nome/label (ex: 'R1', 'SW1', 'PC1')" },
          x: { type: "number" },
          y: { type: "number" }
        },
        required: ["model", "name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "pt_add_module",
      description: "Instala um módulo extra em um dispositivo. (Ex: 'HWIC-2T' para portas seriais em roteadores).",
      parameters: {
        type: "object",
        properties: {
          device: { type: "string", description: "Alvo (ex: 'R1')" },
          module: { type: "string", description: "Módulo (ex: 'HWIC-2T')" },
          slot: { type: "string", description: "Slot (ex: '0/0', '0/1')" }
        },
        required: ["device", "module", "slot"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "pt_create_link",
      description: "Conecta dois dispositivos com um cabo.",
      parameters: {
        type: "object",
        properties: {
          device_a: { type: "string" },
          port_a: { type: "string", description: "Ex: 'Serial0/0/0' ou 'GigabitEthernet0/0'" },
          device_b: { type: "string" },
          port_b: { type: "string" },
          cable: { type: "string", description: "Valores: 'straight' (LAN), 'cross' (switch-switch), 'serial' (WAN router-router)." }
        },
        required: ["device_a", "port_a", "device_b", "port_b", "cable"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "pt_query_topology",
      description: "Verifica os dispositivos atuais no mapa e suas portas ocupadas. Muito útil para descobrir qual porta usar antes de conectar um cabo.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "pt_run_cli",
      description: "Executa comandos no terminal de um dispositivo.",
      parameters: {
        type: "object",
        properties: {
          device: { type: "string" },
          command: { type: "string", description: "O comando ou script completo a ser enviado. Ex: \\nenable\\nconf t\\n..." }
        },
        required: ["device", "command"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "pt_delete_device",
      description: "Remove/deleta um dispositivo da topologia pelo nome. Todos os links conectados a ele são removidos automaticamente.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome do dispositivo a remover (ex: 'PC1', 'R2', 'SW3')" }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "pt_delete_link",
      description: "Remove um cabo/link entre dois dispositivos.",
      parameters: {
        type: "object",
        properties: {
          device: { type: "string", description: "Nome de um dos dispositivos conectados" },
          port: { type: "string", description: "Porta do dispositivo onde o cabo está conectado (ex: 'GigabitEthernet0/0')" }
        },
        required: ["device", "port"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "pt_auto_layout",
      description: "Organiza o grid visual da topologia para que não fiquem todos os roteadores amontoados.",
      parameters: { type: "object", properties: {} }
    }
  }
];

export const processNaturalLanguage = async (
  prompt: string, 
  apiKey: string, 
  onLog: (msg: string) => void
) => {
  if (!apiKey) {
    throw new Error("Chave da OpenAI ausente! Configure VITE_OPENAI_API_KEY no arquivo .env");
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Necessário porque estamos rodando no frontend (Vite)
  });

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { 
      role: "system", 
      content: "Você é um Engenheiro de Redes Cisco Senior operando o software Packet Tracer de forma automatizada. Regras CRÍTICAS:\n1. NUNCA crie dispositivos novos se o usuário pediu apenas para conectar dispositivos existentes.\n2. Se uma chamada de ferramenta (como pt_create_link) falhar por porta inválida ou ocupada, chame pt_query_topology para ver quais portas estão livres antes de tentar novamente.\n3. Se você receber um erro 2 vezes seguidas, PARE imediatamente e explique o problema para o usuário, não fique tentando em loop.\n4. NÃO reorganize a topologia automaticamente após adicionar, remover dispositivos ou criar links. Só use pt_auto_layout quando o usuário pedir EXPLICITAMENTE para reorganizar ou organizar o layout.\n5. Você PODE remover/deletar dispositivos usando pt_delete_device e links usando pt_delete_link. Se o usuário pedir para remover algo, use essas ferramentas. Antes de remover, use pt_query_topology para confirmar os nomes exatos dos dispositivos."
    },
    { role: "user", content: prompt }
  ];

  onLog("[IA] Ponderando sobre o seu pedido...");

  let wantsMore = true;
  let iterations = 0;
  const MAX_ITERATIONS = 6;

  while (wantsMore && iterations < MAX_ITERATIONS) {
    iterations++;
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Um modelo muito rápido e eficiente para funções
        messages: messages,
        tools: tools,
        tool_choice: "auto"
      });

      const msg = response.choices[0].message;
      messages.push(msg);

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        // A IA decidiu chamar uma ou mais ferramentas do MCP
        for (const toolCall of msg.tool_calls) {
          const funcName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);
          
          onLog(`[IA] Chamando ferramenta: ${funcName} (${JSON.stringify(args)})`);
          
          let resultText = "";
          try {
            // Repassamos a ordem da IA para o nosso servidor local do Packet Tracer
            const res = await callMcpTool(funcName, args);
            resultText = typeof res === 'string' ? res : JSON.stringify(res);
          } catch(e: any) {
            resultText = "Error executing tool: " + e.message;
            onLog(`[IA-ERROR] Erro na ferramenta ${funcName}: ${e.message}`);
          }
          
          // Devolvemos o resultado da ferramenta para a IA ver
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: resultText
          });
        }
      } else {
        // A IA não chamou nenhuma ferramenta, então ela terminou
        wantsMore = false;
        if (msg.content) {
          onLog(`[IA] 🤖 ${msg.content}`);
        }
      }
    } catch (error: any) {
      wantsMore = false;
      onLog(`[ERRO NA IA] Falha de comunicação com a OpenAI: ${error.message}`);
    }
  }

  if (iterations >= MAX_ITERATIONS) {
    onLog("[WARNING] O assistente atingiu o limite máximo de ações consecutivas (loop de proteção ativado). Verifique se ocorreu algum erro que a IA não conseguiu resolver sozinha.");
  }
};
