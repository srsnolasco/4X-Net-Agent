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
  },
  {
    type: "function",
    function: {
      name: "pt_run_cli_bulk",
      description: "Executa múltiplos comandos CLI em vários dispositivos de uma só vez. Ideal para configurar IPs, roteamento e VLANs em lote.",
      parameters: {
        type: "object",
        properties: {
          commands: {
            type: "array",
            description: "Lista de objetos {device, command} para executar em sequência.",
            items: {
              type: "object",
              properties: {
                device: { type: "string" },
                command: { type: "string" }
              },
              required: ["device", "command"]
            }
          }
        },
        required: ["commands"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "pt_ping",
      description: "Executa um ping entre dois dispositivos para verificar conectividade IP.",
      parameters: {
        type: "object",
        properties: {
          from_device: { type: "string", description: "Dispositivo de origem (ex: 'PC1')" },
          to_ip: { type: "string", description: "IP de destino (ex: '192.168.1.1')" }
        },
        required: ["from_device", "to_ip"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "pt_traceroute",
      description: "Executa um traceroute de um dispositivo para um IP destino.",
      parameters: {
        type: "object",
        properties: {
          from_device: { type: "string" },
          to_ip: { type: "string" }
        },
        required: ["from_device", "to_ip"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "pt_save_pkt",
      description: "Salva o arquivo .pkt do projeto no Packet Tracer.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "pt_show_running",
      description: "Mostra a configuração running-config de um dispositivo.",
      parameters: {
        type: "object",
        properties: {
          device: { type: "string", description: "Nome do dispositivo (ex: 'R1')" }
        },
        required: ["device"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "pt_inspect_ports",
      description: "Lista todas as portas de um dispositivo com status de cada interface (up/down, IP, etc).",
      parameters: {
        type: "object",
        properties: {
          device: { type: "string", description: "Nome do dispositivo (ex: 'R1')" }
        },
        required: ["device"]
      }
    }
  }
];

export const processNaturalLanguage = async (
  prompt: string, 
  apiKey: string, 
  onLog: (msg: string) => void,
  maxIterations: number = 10,
  history: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [],
  systemPrompt?: string
): Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam[]> => {
  if (!apiKey) {
    throw new Error("Chave da OpenAI ausente! Configure VITE_OPENAI_API_KEY no arquivo .env");
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true 
  });

  const defaultSystemPrompt = "v3.2 - Você é um Engenheiro de Redes Cisco Senior operando o Packet Tracer de forma automatizada. Você TEM capacidade de criar, conectar, configurar e remover dispositivos.\n\nRegras:\n1. Quando o usuário pedir para CRIAR um dispositivo (roteador, switch, PC, etc), USE pt_add_device IMEDIATAMENTE. Modelos padrão: roteadores='2911', switches='2960-24TT', PCs='PC-PT'. **REGRA CRÍTICA: Sempre que criar um roteador '2911', você DEVE obrigatoriamente incluir na MESMA RESPOSTA a ferramenta pt_add_module para instalar o módulo 'HWIC-2T' no slot '0/0'. NUNCA crie um roteador sem o módulo WAN.**\n2. Quando o usuário pedir apenas para CONECTAR dispositivos que já existem, NÃO crie dispositivos novos — só crie o link.\n3. Se uma chamada de ferramenta falhar por porta inválida ou ocupada, chame pt_query_topology para ver quais portas estão livres antes de tentar novamente.\n4. Se receber o mesmo erro 2 vezes seguidas, PARE e explique o problema ao usuário.\n5. NÃO use pt_auto_layout a menos que o usuário peça EXPLICITAMENTE para organizar o layout.\n6. Você PODE remover dispositivos (pt_delete_device) e links (pt_delete_link). Antes de remover, use pt_query_topology para confirmar os nomes.\n7. SEMPRE execute as ações pedidas. NUNCA recuse um pedido legítimo de criar, conectar ou configurar dispositivos.\n8. **GESTÃO DE BOOT E CONFIGURAÇÃO:** Dispositivos novos podem estar no 'Initial Configuration Dialog'. Se detectar isso no output (pergunta [yes/no]), envie 'no' antes de qualquer outro comando. Para CONFIGURAR interfaces ou roteamento, use SEMPRE `pt_run_cli` ou `pt_run_cli_bulk` com o parâmetro `mode='global'`. Isso garante que o comando seja executado no contexto correto (config terminal).\n9. **CONSULTAS DE TOPOLOGIA:** Sempre que o usuário fizer uma pergunta sobre qual porta está conectada a qual dispositivo, IPs, ou estado atual da rede, USE OBRIGATORIAMENTE a ferramenta `pt_query_topology` ANTES de responder. NUNCA adivinhe interfaces ou IPs.";

  const systemMessage: OpenAI.Chat.Completions.ChatCompletionMessageParam = { 
    role: "system", 
    content: systemPrompt || defaultSystemPrompt
  };

  // Montamos a lista de mensagens garantindo o system prompt no início
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = history.some(m => m.role === 'system')
    ? [...history, { role: "user", content: prompt }]
    : [systemMessage, ...history, { role: "user", content: prompt }];

  onLog("[IA] Ponderando sobre o seu pedido...");

  let wantsMore = true;
  let iterations = 0;
  while (wantsMore && iterations < maxIterations) {
    iterations++;
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", 
        messages: messages,
        tools: tools,
        tool_choice: "auto"
      });

      const msg = response.choices[0].message;
      messages.push(msg);

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        for (const toolCall of msg.tool_calls) {
          const funcName = (toolCall as any).function.name;
          const args = JSON.parse((toolCall as any).function.arguments);
          
          onLog(`[IA] Chamando ferramenta: ${funcName} (${JSON.stringify(args)})`);
          
          let resultText = "";
          try {
            const res = await callMcpTool(funcName, args);
            resultText = typeof res === 'string' ? res : JSON.stringify(res);
          } catch(e: any) {
            resultText = "Error executing tool: " + e.message;
            onLog(`[IA-ERROR] Erro na ferramenta ${funcName}: ${e.message}`);
          }
          
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: resultText
          });
        }
      } else {
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

  if (iterations >= maxIterations) {
    onLog("[WARNING] O assistente atingiu o limite máximo de ações consecutivas (loop de proteção ativado). Verifique se ocorreu algum erro que a IA não conseguiu resolver sozinha.");
  }

  return messages;
};
