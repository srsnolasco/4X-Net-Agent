import { useState, useEffect, useRef } from 'react';
import './App.css';
import { callMcpTool, initSession } from './api';
import { processNaturalLanguage } from './ai';
import {
  IconMap, IconAI, IconBrain, IconSettings, IconDoc, IconTrash, IconStop,
  IconWand, IconSave, IconWarn, IconTerminal, IconGlobe, IconRefresh,
  IconPlay, IconPause, IconClock,
  IconRouter, IconSwitch, IconLaptop, IconServer, IconWifi, IconPhone,
} from './Icons';

interface RegistryEntry {
  subnet: string;
  device: string;
  iface: string;
  type: string;
  ip: string;
}

function App() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Novos estados para o input de comando direto
  const [customDevice, setCustomDevice] = useState('R1');
  const [customCommand, setCustomCommand] = useState('');

  // Router B
  const [customDeviceB, setCustomDeviceB] = useState('R2');
  const [customCommandB, setCustomCommandB] = useState('');

  // Estado para o input de texto livre (Linguagem Natural / IA)
  const [naturalPrompt, setNaturalPrompt] = useState('');

  const [ptConnected, setPtConnected] = useState(false);

  // Stats simulados (poderiam vir do MCP futuramente)
  const [stats, setStats] = useState({
    devices: 0,
    links: 0,
    commands: 0,
  });

  // Lista detalhada de equipamentos
  const [deviceList, setDeviceList] = useState<any[]>([]);
  const [linkList, setLinkList] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'devices' | 'links' | 'loopbacks' | 'registry'>('devices');
  const [loopbackFilter, setLoopbackFilter] = useState('');
  const [loopbackNetFilter, setLoopbackNetFilter] = useState('');
  const [registryDevFilter, setRegistryDevFilter] = useState('');
  const [registryNetFilter, setRegistryNetFilter] = useState('');
  const [linksOrigemFilter, setLinksOrigemFilter] = useState('');
  const [linksDestinoFilter, setLinksDestinoFilter] = useState('');
  const [devNameFilter, setDevNameFilter] = useState('');
  const [devModelFilter, setDevModelFilter] = useState('');
  const [ipRegistry, setIpRegistry] = useState<RegistryEntry[]>(() =>
    JSON.parse(localStorage.getItem('pt_ip_registry') || '[]')
  );
  const [registryLoading, setRegistryLoading] = useState(false);
  const [registrySyncMsg, setRegistrySyncMsg] = useState<{text: string; ok: boolean} | null>(null);
  const [maxIterations, setMaxIterations] = useState(() => 
    JSON.parse(localStorage.getItem('pt_max_iterations') || '15')
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [showCanvasMenu, setShowCanvasMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'aba1' | 'aba2' | 'aba3'>('aba1');
  const [chatHistory, setChatHistory] = useState<any[]>(() => 
    JSON.parse(localStorage.getItem('pt_chat_history') || '[]')
  );
  const [maxMemory, setMaxMemory] = useState(() => 
    JSON.parse(localStorage.getItem('pt_max_memory') || '10')
  );
  const [showMemorySettings, setShowMemorySettings] = useState(false);

  const defaultPrompt = "v4.10 -Você é um Engenheiro de Redes Cisco Senior operando o Packet Tracer de forma automatizada. Você TEM capacidade de criar, conectar, configurar e remover dispositivos.\n\n⚠️ IMPORTANTE — IP REGISTRY: No início deste prompt há um bloco [IP REGISTRY] que lista TODAS as sub-redes atualmente configuradas. SEMPRE consulte este bloco antes de atribuir qualquer endereço IP. Nunca use uma sub-rede já listada no registry.\n\nRegras:\n1. Quando o usuário pedir para CRIAR um dispositivo (roteador, switch, PC, etc), você DEVE executar OBRIGATORIAMENTE estas 3 etapas em sequência — nenhuma pode ser pulada:\n   ETAPA 1: Chame pt_add_device com o modelo e nome do dispositivo.\n   ETAPA 2 (somente roteadores 2911): Chame pt_add_module com módulo 'HWIC-2T' no slot '0/0'. NUNCA crie um roteador sem este módulo.\n   ETAPA 3 (OBRIGATÓRIA para TODOS os dispositivos): Chame pt_run_cli no dispositivo recém-criado com o comando '\\nno\\n\\nenable\\nconfigure terminal\\nhostname <NOME>\\nend\\n' substituindo <NOME> pelo nome exato do dispositivo (ex: R1, SW1, PC1). A criação SÓ ESTÁ COMPLETA após esta etapa. O sistema aguarda o boot automaticamente.\n2. Quando o usuário pedir apenas para CONECTAR dispositivos que já existem, NÃO crie dispositivos novos — só crie o link. Para conexões ROTEADOR-ROTEADOR, siga obrigatoriamente o Protocolo de Seleção de Interface da Regra 12.\n3. Se uma chamada de ferramenta falhar por porta inválida ou ocupada, chame pt_query_topology para ver quais portas estão livres antes de tentar novamente.\n4. Se receber o mesmo erro 2 vezes seguidas, PARE e explique o problema ao usuário.\n5. NÃO use pt_auto_layout a menos que o usuário peça EXPLICITAMENTE para organizar o layout.\n6. **REMOÇÃO DE DISPOSITIVOS E LINKS — USO RESTRITO:** Chame pt_delete_device ou pt_delete_link SOMENTE quando o usuário usar palavras explícitas como 'remova', 'apague', 'delete' ou 'limpe'. NUNCA interprete pedidos de configuração, conexão ou endereçamento como autorização para remover qualquer elemento existente.\n7. SEMPRE execute as ações pedidas. Quando a tarefa for CONFIGURAR (IPs, rotas, interfaces), trabalhe sobre os dispositivos existentes — NUNCA os destrua para recriar.\n8. **GESTÃO DE BOOT E CONFIGURAÇÃO:** Dispositivos novos podem estar no 'Initial Configuration Dialog'. Se detectar isso no output (pergunta [yes/no]), envie 'no' antes de qualquer outro comando. Para CONFIGURAR interfaces ou roteamento, use SEMPRE `pt_run_cli` ou `pt_run_cli_bulk`. Isso garante que o comando seja executado no contexto correto (config terminal).\n9. **CONSULTAS DE TOPOLOGIA:** Sempre que o usuário fizer uma pergunta sobre qual porta está conectada a qual dispositivo, IPs, ou estado atual da rede, USE OBRIGATORIAMENTE a ferramenta `pt_query_topology` ANTES de responder. NUNCA adivinhe interfaces ou IPs.\n10. **PROTEÇÃO CONTRA AÇÕES DESTRUTIVAS:** Antes de executar qualquer tarefa, classifique-a:\n   - Tarefa de CONFIGURAÇÃO (IP, rota, OSPF, RIP, etc.) → PROIBIDO chamar pt_delete_device, pt_delete_link ou pt_clear_canvas. Trabalhe somente com pt_run_cli sobre o que já existe.\n   - Tarefa de CRIAÇÃO → siga a Regra 1.\n   - Tarefa de REMOÇÃO → exige palavra explícita do usuário (Regra 6).\n   Se tiver dúvida sobre a classificação, pergunte ao usuário antes de agir.\n11. **ENDEREÇAMENTO IP EM LINKS ROTEADOR-ROTEADOR — PROTOCOLO OBRIGATÓRIO:**\n   Quando o usuário pedir para configurar IPs em interfaces seriais (Serial0/x/x) ou GigabitEthernet entre roteadores, execute EXATAMENTE este protocolo de 5 passos, sem desvios:\n\n   PASSO 0 — CONSULTE O [IP REGISTRY]: Liste quais sub-redes 10.0.0.X/30 já estão em uso. A próxima sub-rede disponível é a menor da sequência (10.0.0.0/30, 10.0.0.4/30, 10.0.0.8/30...) que NÃO aparece no registry.\n\n   PASSO 1 — LEITURA DA TOPOLOGIA: Chame pt_query_topology. Identifique os enlances a configurar, as interfaces disponíveis e verifique IPs já configurados na topologia. NUNCA pule este passo.\n\n   PASSO 2 — CONSTRUÇÃO DA TABELA DE SUB-REDES EM USO: Combine o [IP REGISTRY] com os dados do PASSO 1. Monte a lista completa de sub-redes /30 já atribuídas.\n\n   PASSO 3 — PLANEJAMENTO SEM DUPLICATAS: Para cada enlace a configurar, escolha a próxima sub-rede /30 livre. Sequência padrão: 10.0.0.0/30, 10.0.0.4/30, 10.0.0.8/30, 10.0.0.12/30... Atribua .1 ao roteador de menor índice e .2 ao maior. NUNCA repita uma sub-rede já em uso.\n\n   PASSO 4 — CONFIGURAÇÃO UMA A UMA: Configure cada interface com o IP planejado no PASSO 3. Use pt_run_cli com:\n     enable\\nconfigure terminal\\ninterface <INTERFACE>\\nip address <IP> <MASK>\\n[clock rate 64000 — somente na ponta DCE, que é o roteador de menor índice]\\nno shutdown\\nend\\n\n   Confirme cada configuração antes de passar para o próximo enlace.\n\n   PASSO 5 — RELATÓRIO FINAL: Ao concluir, exiba uma tabela com todas as configurações realizadas:\n     Sub-rede      | Roteador A | Interface A | IP A        | Roteador B | Interface B | IP B\n     10.0.0.0/30  | R1         | Se0/0/0     | 10.0.0.1   | R2         | Se0/0/0     | 10.0.0.2\n     10.0.0.4/30  | R2         | Se0/0/1     | 10.0.0.5   | R3         | Se0/0/0     | 10.0.0.6\n\n   PROIBIÇÕES ABSOLUTAS durante o Protocolo de Endereçamento:\n   ❌ NUNCA chame pt_delete_device, pt_delete_link ou pt_clear_canvas\n   ❌ NUNCA recrie um dispositivo que já existe\n   ❌ NUNCA atribua uma sub-rede já presente no [IP REGISTRY] ou na tabela do PASSO 2\n   ❌ NUNCA pule o PASSO 1, mesmo que acredite saber os IPs existentes\n12. **SELEÇÃO DE INTERFACE PARA CONEXÃO ROTEADOR-ROTEADOR — PROTOCOLO DE PRIORIDADE:**\n   Toda vez que for conectar dois roteadores, execute este protocolo antes de chamar pt_create_link:\n\n   PASSO A — INSPECIONAR PORTAS DISPONÍVEIS: Chame pt_inspect_ports em AMBOS os roteadores para ver todas as interfaces livres (não conectadas) em cada um.\n\n   PASSO B — SELECIONAR INTERFACE POR ORDEM DE PRIORIDADE:\n     PRIORIDADE 1 (Serial): Se ambos os roteadores tiverem porta Serial livre (Se0/0/0, Se0/0/1, etc.) → use Serial com cable='serial'. Se o roteador não tiver módulo serial (HWIC-2T), adicione-o via pt_add_module antes de criar o link.\n     PRIORIDADE 2 (GigabitEthernet — SEM Serial disponível): Se não houver porta Serial livre em algum dos lados → use GigabitEthernet (GigabitEthernet0/0, GigabitEthernet0/1, etc.) com os parâmetros EXATOS:\n       cable='copper-cross'\n       confirm_internal_lan: true\n     ⚠️ OBRIGATÓRIO: SEMPRE passe confirm_internal_lan: true ao conectar dois roteadores via Ethernet. Sem este parâmetro a ferramenta RECUSA a conexão.\n     ⚠️ O cabo para roteador-roteador via Ethernet é SEMPRE 'copper-cross'. NUNCA use 'copper-straight' entre dois roteadores.\n     PRIORIDADE 3 (FastEthernet — último recurso): Se não houver Serial nem GigabitEthernet disponível → use FastEthernet (FastEthernet0/x) com cable='copper-cross' e confirm_internal_lan: true.\n\n   PASSO C — REGRA DE CONSISTÊNCIA DE INTERFACE: NUNCA misture tipos diferentes nos dois lados do mesmo enlace (ex: Serial num lado e GigabitEthernet no outro). As duas pontas DEVEM usar o mesmo tipo de interface.\n\n   PASSO D — INFORMAR A DECISÃO: Antes de criar o link, informe ao usuário qual interface foi escolhida e o motivo. Exemplo: 'Usando Serial pois ambos os roteadores possuem módulo HWIC-2T disponível.' ou 'Não há Serial disponível em R2 — usando GigabitEthernet0/1 com cabo copper-cross.'\n\n   PASSO E — APÓS CRIAR O LINK: Se for Serial, aplique clock rate 64000 na ponta DCE via pt_run_cli. Se for GigabitEthernet ou FastEthernet, o clock rate não é necessário — apenas configure o IP e dê no shutdown.\n\n   EXEMPLO CERTO para conexão R1↔R10 sem Serial livre:\n     pt_create_link({ device_a:'R1', port_a:'GigabitEthernet0/1', device_b:'R10', port_b:'GigabitEthernet0/0', cable:'copper-cross', confirm_internal_lan: true })\n\n   EXEMPLO ERRADO (NUNCA faça):\n     pt_create_link({ cable:'copper-straight' })  ← errado para roteador-roteador\n     pt_create_link({ cable:'cross' })             ← valor inválido\n     pt_create_link sem confirm_internal_lan: true ← a ferramenta vai recusar\n13. **INTERFACES LOOPBACK — FILA PRÉ-CALCULADA DO REGISTRY:**\n\n   ⚠️ VOCÊ NÃO ESCOLHE O IP. O app já calculou os próximos IPs disponíveis. Sua única tarefa é pegar da fila na ordem certa e executar.\n\n   ══ COMO FUNCIONA ══\n   No [IP REGISTRY] acima há uma lista chamada 'PRÓXIMOS IPs DISPONÍVEIS PARA LOOPBACK':\n     #1: 192.168.5.1/24\n     #2: 192.168.6.1/24\n     #3: 192.168.7.1/24  ... (exemplo)\n\n   Regra simples: a PRIMEIRA Loopback nova criada usa #1, a SEGUNDA usa #2, a TERCEIRA usa #3, etc.\n   NUNCA use o mesmo número da fila duas vezes.\n   NUNCA invente um IP fora desta lista.\n\n   CERTO ✓ (criar Loopback1 em R1, R2, R3 com fila acima):\n     R1 Loopback1 → #1 → 192.168.5.1/24\n     R2 Loopback1 → #2 → 192.168.6.1/24\n     R3 Loopback1 → #3 → 192.168.7.1/24\n\n   ERRADO ❌:\n     R1 Loopback1 → 192.168.5.1/24\n     R2 Loopback1 → 192.168.5.2/24  ← INVENTOU! .2 não existe na fila; a fila usa sempre .1\n     R3 Loopback1 → 192.168.5.3/24  ← INVENTOU! Isso é a MESMA sub-rede 192.168.5.0/24!\n\n   ══ PROTOCOLO DE 3 PASSOS ══\n\n   PASSO 1 — IDENTIFIQUE AS LOOPBACKS A CRIAR: Para cada roteador alvo, chame pt_run_cli com '\\nenable\\nshow ip interface brief\\n' e identifique quais Loopback já existem e qual é o próximo número N de interface.\n\n   PASSO 2 — MONTE A LISTA DE EXECUÇÃO (zero chamadas de ferramenta): Liste TODOS os novos Loopbacks de TODOS os roteadores e atribua IPs da fila EM ORDEM SEQUENCIAL:\n     Item 1: R1 LoopbackN → IP #1 da fila\n     Item 2: R2 LoopbackN → IP #2 da fila\n     Item 3: R3 LoopbackN → IP #3 da fila\n   Verificação: cada item usa um número diferente da fila? Se sim, execute imediatamente.\n\n   PASSO 3 — EXECUTE CADA ITEM SEM ALTERAR OS IPs:\n     'enable\\nconfigure terminal\\ninterface Loopback<N>\\nip address <IP_DA_FILA> 255.255.255.0\\nno shutdown\\nend\\n'\n   Relatório final com todos os Loopbacks configurados.\n\n   PROIBIÇÕES ABSOLUTAS:\n   ❌ NUNCA invente um IP fora da fila 'PRÓXIMOS IPs DISPONÍVEIS'\n   ❌ NUNCA use o mesmo número da fila em dois itens diferentes\n   ❌ NUNCA mude o quarto octeto — a fila sempre termina em .1\n   ❌ NUNCA peça confirmação ao usuário — execute diretamente\n   ❌ NUNCA use pt_query_topology para obter IPs de Loopback\n   ❌ NUNCA sobrescreva Loopback existente sem autorização";

  const [systemPrompt, setSystemPrompt] = useState(() => 
    localStorage.getItem('pt_system_prompt') || defaultPrompt
  );
  const [showPromptModal, setShowPromptModal] = useState(false);
  
  // Estados para versionamento do Prompt
  const [promptVersion, setPromptVersion] = useState(() => 
    parseInt(localStorage.getItem('pt_prompt_version') || '0')
  );
  const [promptHistory, setPromptHistory] = useState<any[]>(() => 
    JSON.parse(localStorage.getItem('pt_prompt_history') || '[]')
  );
  const [lastPromptUpdate, setLastPromptUpdate] = useState(() => 
    localStorage.getItem('pt_prompt_last_update') || 'Original'
  );
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [logs2, setLogs2] = useState<string[]>([]);
  const [logs3, setLogs3] = useState<string[]>([]);

  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalRef2 = useRef<HTMLDivElement>(null);
  const terminalRef3 = useRef<HTMLDivElement>(null);
  const agentAbortRef = useRef(false);

  const addLog2 = (msg: string) => setLogs2(prev => [...prev, msg]);
  const addLog3 = (msg: string) => setLogs3(prev => [...prev, msg]);

  useEffect(() => {
    const connect = async () => {
      try {
        await initSession();
        setConnected(true);
        addLog('[SUCCESS] Conectado ao servidor MCP (porta 39001)');
      } catch (err: any) {
        addLog(`[ERROR] Falha ao conectar: ${err.message}`);
      }
    };
    connect();
  }, []);

  // Poll PT bridge status every 30s to show whether PT itself is connected
  useEffect(() => {
    const checkBridge = async () => {
      try {
        const result = await callMcpTool('pt_bridge_status', {});
        const text = typeof result === 'string' ? result : JSON.stringify(result);
        setPtConnected(text.includes('connected: true'));
      } catch {
        setPtConnected(false);
      }
    };
    checkBridge();
    const interval = setInterval(checkBridge, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (terminalRef2.current) {
      terminalRef2.current.scrollTop = terminalRef2.current.scrollHeight;
    }
  }, [logs2]);

  useEffect(() => {
    if (terminalRef3.current) {
      terminalRef3.current.scrollTop = terminalRef3.current.scrollHeight;
    }
  }, [logs3]);

  // Sincronização com LocalStorage
  useEffect(() => {
    localStorage.setItem('pt_chat_history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    localStorage.setItem('pt_max_iterations', JSON.stringify(maxIterations));
  }, [maxIterations]);

  useEffect(() => {
    localStorage.setItem('pt_max_memory', JSON.stringify(maxMemory));
  }, [maxMemory]);

  useEffect(() => {
    localStorage.setItem('pt_system_prompt', systemPrompt);
  }, [systemPrompt]);

  useEffect(() => {
    localStorage.setItem('pt_prompt_version', promptVersion.toString());
  }, [promptVersion]);

  useEffect(() => {
    localStorage.setItem('pt_prompt_history', JSON.stringify(promptHistory));
  }, [promptHistory]);

  useEffect(() => {
    localStorage.setItem('pt_prompt_last_update', lastPromptUpdate);
  }, [lastPromptUpdate]);

  useEffect(() => {
    localStorage.setItem('pt_ip_registry', JSON.stringify(ipRegistry));
  }, [ipRegistry]);

  useEffect(() => {
    // Migração automática do Prompt (Verifica se as regras necessárias estão presentes)
    const needsUpdate = !systemPrompt.includes('v4.10') || !systemPrompt.includes('copper-cross') || !systemPrompt.includes('FILA PRÉ-CALCULADA DO REGISTRY');
    if (needsUpdate) {
      setSystemPrompt(defaultPrompt);
      setPromptVersion(prev => prev + 1);
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setLastPromptUpdate(dateStr);
      addLog('[SYSTEM] Upgrade automático do Prompt para v' + (promptVersion + 1) + ' (Adicionada regra de Consultas de Topologia)');
    }
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg]);
  };

  const handleCallTool = async (toolName: string, args: any = {}, startMsg?: string, logger: (msg: string) => void = addLog) => {
    if (startMsg) logger(`[CMD] ${startMsg}`);
    else logger(`[CMD] Executando ${toolName}...`);

    setLoading(true);
    setStats(prev => ({ ...prev, commands: prev.commands + 1 }));
    try {
      const result = await callMcpTool(toolName, args);

      let parsedResult = result;
      if (typeof result === 'string') {
        try {
          parsedResult = JSON.parse(result);
        } catch(e) {
          // não é json, segue como string
        }
      }

      const formatHumanReadable = (obj: any, indent: string = ''): string => {
        if (typeof obj !== 'object' || obj === null) return String(obj);
        if (Array.isArray(obj)) {
          return obj.map(item => `${indent}• ${formatHumanReadable(item, indent + '  ')}`).join('\n');
        }
        return Object.entries(obj).map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
             return `${indent}${key}:\n${formatHumanReadable(value, indent + '  ')}`;
          }
          return `${indent}${key}: ${value}`;
        }).join('\n');
      };

      if (typeof parsedResult === 'string') {
        const lines = parsedResult.split('\n');
        lines.forEach(line => {
          if (line.trim()) logger(`[OUTPUT] ${line}`);
        });
      } else {
        if (toolName === 'pt_query_topology') {
          logger(`[OUTPUT] Topografia capturada com sucesso.`);
          logger(`[OUTPUT] Dispositivos detectados: ${parsedResult.devices?.length || 0}`);
          logger(`[OUTPUT] Conexões detectadas: ${parsedResult.links?.length || 0}`);
          logger(`[OUTPUT] (Dados detalhados disponíveis no painel Mapa de Topologia)`);
        } else if (toolName === 'pt_clear_canvas') {
          logger(`[SUCCESS] Canvas limpo. Todos os equipamentos e conexões foram removidos.`);
          setStats(prev => ({ ...prev, devices: 0, links: 0 }));
          setDeviceList([]);
          setLinkList([]);
        } else {
          const formatted = formatHumanReadable(parsedResult);
          if (formatted.trim()) {
            const lines = formatted.split('\n');
            lines.forEach(line => {
              if (line.trim()) logger(`[OUTPUT] ${line}`);
            });
          } else {
            logger(`[OUTPUT] Operação concluída.`);
          }
        }

        if (toolName === 'pt_query_topology' && parsedResult) {
          if (parsedResult.devices) {
            setStats(prev => ({ ...prev, devices: parsedResult.devices.length || 0 }));
            setDeviceList(parsedResult.devices);
          }
          if (parsedResult.links) {
            setStats(prev => ({ ...prev, links: parsedResult.links.length || 0 }));
            setLinkList(parsedResult.links);
          }
        }
      }
      return result;
    } catch (err: any) {
      logger(`[ERROR] ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const extractMcpText = (result: any): string => {
    if (typeof result === 'string') return result;
    if (result?.content) {
      if (Array.isArray(result.content))
        return result.content.filter((c: any) => c.type === 'text').map((c: any) => c.text ?? '').join('\n');
      if (typeof result.content === 'string') return result.content;
    }
    if (result?.text) return String(result.text);
    if (result?.output) return String(result.output);
    return JSON.stringify(result);
  };

  const syncIpRegistry = async (silent = false) => {
    if (!silent) {
      addLog('[REGISTRY] Sincronizando IP Registry com o Packet Tracer...');
      setRegistrySyncMsg(null);
    }
    setRegistryLoading(true);
    try {
      // ── Fonte 1: pt_query_topology → IPs de interfaces físicas (serial, gigabit, etc.)
      const topoResult = await callMcpTool('pt_query_topology', {});
      let parsed: any = topoResult;
      if (typeof topoResult === 'string') { try { parsed = JSON.parse(topoResult); } catch { parsed = {}; } }
      const devices: any[] = parsed?.devices || [];
      const routers = devices.filter((d: any) => {
        const m = (d.model || '').toLowerCase();
        return m.includes('2911') || m.includes('2901') || m.includes('1941') || m.includes('isr') || m.includes('router');
      });
      if (!silent && routers.length === 0) {
        setRegistrySyncMsg({ text: 'Nenhum roteador encontrado. Verifique se o PT Bridge está conectado e há roteadores no canvas.', ok: false });
        return;
      }

      const allEntries: RegistryEntry[] = [];

      // Extrai IPs das portas físicas já presentes no resultado da topologia
      for (const dev of devices) {
        for (const port of (dev.ports || [])) {
          if (!port.ip || port.ip === '0.0.0.0') continue;
          const mask = port.mask || port.subnetMask || '';
          if (!mask || mask === '0.0.0.0') continue;
          const ipParts = port.ip.split('.').map(Number);
          const maskParts = mask.split('.').map(Number);
          const network = ipParts.map((p: number, i: number) => p & maskParts[i]).join('.');
          const prefix = maskParts.reduce((acc: number, oct: number) => acc + (oct.toString(2).match(/1/g) || []).length, 0);
          const subnet = `${network}/${prefix}`;
          const t = (port.name || '').toLowerCase();
          const type = t.startsWith('loopback') ? 'loopback'
            : t.startsWith('serial') ? 'serial'
            : t.startsWith('gigabit') ? 'gigabit'
            : t.startsWith('fastethernet') ? 'fastethernet' : 'ethernet';
          allEntries.push({ subnet, device: dev.name, iface: port.name, type, ip: port.ip });
        }
      }

      // ── Fonte 2: show ip interface brief → Loopbacks (não retornadas pelo pt_query_topology)
      for (const router of routers) {
        const cliResult = await callMcpTool('pt_run_cli', { device: router.name, command: '\nenable\nshow ip interface brief\n' });
        const text = extractMcpText(cliResult);
        for (const line of text.split('\n')) {
          const m = line.match(/^(Loopback\d+)\s+(\d+\.\d+\.\d+\.\d+)\s+YES/i);
          if (!m) continue;
          const [, iface, ip] = m;
          if (ip === '0.0.0.0') continue;
          const parts = ip.split('.');
          const subnet = `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
          allEntries.push({ subnet, device: router.name, iface, type: 'loopback', ip });
        }
      }

      const seen = new Set<string>();
      const unique = allEntries.filter(e => { if (seen.has(e.subnet)) return false; seen.add(e.subnet); return true; });
      setIpRegistry(unique);
      if (!silent) {
        addLog(`[REGISTRY] Sincronização concluída: ${unique.length} sub-rede(s) registrada(s).`);
        setRegistrySyncMsg({ text: `Sincronizado — ${unique.length} sub-rede${unique.length !== 1 ? 's' : ''} em ${routers.length} roteador${routers.length !== 1 ? 'es' : ''}.`, ok: true });
      }
    } catch (err: any) {
      if (!silent) {
        addLog(`[REGISTRY] Erro: ${err.message}`);
        setRegistrySyncMsg({ text: `Erro: ${err.message}`, ok: false });
      }
    } finally {
      setRegistryLoading(false);
    }
  };

  const buildEffectiveSystemPrompt = () => {
    const header = '[IP REGISTRY — Sub-redes configuradas no Packet Tracer]';
    const footer = '[/IP REGISTRY]';
    const body = ipRegistry.length === 0
      ? 'Nenhuma sub-rede registrada ainda.'
      : ipRegistry.map(e => `${e.subnet} → ${e.device} ${e.iface} (${e.ip})`).join('\n');

    const usedOctets = ipRegistry
      .map(e => { const m = e.subnet.match(/192\.168\.(\d+)\.0\/24/); return m ? parseInt(m[1]) : null; })
      .filter((x): x is number => x !== null);

    const nextIPs: string[] = [];
    let x = 1;
    while (nextIPs.length < 30) {
      if (!usedOctets.includes(x)) nextIPs.push(`192.168.${x}.1/24`);
      x++;
    }

    const ipQueue = [
      'PRÓXIMOS IPs DISPONÍVEIS PARA LOOPBACK — use EM ORDEM, um por interface:',
      ...nextIPs.map((ip, i) => `  #${i + 1}: ${ip}`),
      'Primeira nova Loopback criada recebe #1, segunda recebe #2, etc. NUNCA repita um IP desta lista.',
    ].join('\n');

    return `${header}\n${body}\n${ipQueue}\n${footer}\n\n${systemPrompt}`;
  };

  const maskToCidr = (mask: string) => {
    if (!mask || mask === '0.0.0.0') return '';
    try {
      return '/' + mask.split('.').reduce((acc, octet) => {
        const bin = parseInt(octet).toString(2);
        return acc + (bin.match(/1/g) || []).length;
      }, 0);
    } catch (e) {
      return '';
    }
  };

  const getIpString = (deviceName: string, portName: string) => {
    const device = deviceList.find(d => d.name === deviceName);
    if (!device || !device.ports) return null;
    const port = device.ports.find((p: any) => p.name === portName);
    if (!port || !port.ip || port.ip === '0.0.0.0') return null;
    const mask = port.mask || port.subnetMask;
    return `${port.ip}${maskToCidr(mask)}`;
  };

  const getPort = (deviceName: string, portName: string) => {
    const device = deviceList.find(d => d.name === deviceName);
    if (!device || !device.ports) return null;
    return device.ports.find((p: any) => p.name === portName);
  };

  const getDeviceType = (model: string): 'router' | 'switch' | 'pc' | 'server' | 'ap' | 'phone' => {
    if (!model) return 'server';
    const m = model.toLowerCase();
    if (m.includes('pc') || m.includes('laptop')) return 'pc';
    if (m.includes('server')) return 'server';
    if (m.includes('phone') || m.includes('voip')) return 'phone';
    if (m.includes('ap') || m.includes('wireless') || m.includes('wrt')) return 'ap';
    if (m.includes('2960') || m.includes('3560') || m.includes('switch')) return 'switch';
    if (m.includes('2901') || m.includes('2911') || m.includes('1941') || m.includes('isr') || m.includes('router')) return 'router';
    return 'server';
  };

  const DEVICE_COLORS: Record<string, string> = {
    router: '#4d9fff',
    switch: '#ff8519',
    pc:     '#34d399',
    server: '#ff8519',
    ap:     '#4d9fff',
    phone:  '#ff8519',
  };

  const getDeviceColor = (model: string) => DEVICE_COLORS[getDeviceType(model)] ?? '#4d9fff';

  const getDeviceColorByName = (name: string) => {
    const dev = deviceList.find(d => d.name === name);
    return dev ? getDeviceColor(dev.model) : '#4d9fff';
  };

  const getDeviceIcon = (model: string, size = 18) => {
    const c = getDeviceColor(model);
    const t = getDeviceType(model);
    if (t === 'pc')     return <IconLaptop size={size} color={c} />;
    if (t === 'server') return <IconServer size={size} color={c} />;
    if (t === 'phone')  return <IconPhone  size={size} color={c} />;
    if (t === 'ap')     return <IconWifi   size={size} color={c} />;
    if (t === 'switch') return <IconSwitch size={size} color={c} />;
    if (t === 'router') return <IconRouter size={size} color={c} />;
    return <IconServer size={size} color={c} />;
  };

  const getSinglePortStatusColor = (port: any) => {
    if (!port) return 'gray';
    
    const interfaceUp = port.isPortUp;
    const protocolUp = port.isProtocolUp;
    
    // Se a interface está SHUTDOWN (isPortUp=false) -> VERMELHO (Administrativamente Down)
    if (!interfaceUp) return 'red';
    
    // Se a interface está UP mas o PROTOCOLO (link) está DOWN -> AMARELO (Down)
    if (interfaceUp && !protocolUp) return 'yellow';
    
    // Se ambos estão UP -> VERDE
    if (interfaceUp && protocolUp) return 'green';
    
    return 'gray'; 
  };

  const handleSavePrompt = () => {
    const savedPrompt = localStorage.getItem('pt_system_prompt') || defaultPrompt;
    
    if (systemPrompt !== savedPrompt) {
      const nextVersion = promptVersion + 1;
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      const newEntry = {
        version: nextVersion,
        prompt: systemPrompt,
        date: dateStr
      };
      
      setPromptVersion(nextVersion);
      setPromptHistory(prev => [newEntry, ...prev]);
      setLastPromptUpdate(dateStr);
      addLog(`[SYSTEM] Prompt atualizado para v${nextVersion}`);
    }
    
    setShowPromptModal(false);
  };


  // Auto-refresh topology every 15s when enabled
  useEffect(() => {
    if (!autoRefresh || !connected) return;
    const interval = setInterval(() => {
      handleCallTool('pt_query_topology', {});
    }, 15_000);
    return () => clearInterval(interval);
  }, [autoRefresh, connected]);

  // Funções pré-programadas para os botões
  const btnListDevices = () => handleCallTool('pt_query_topology', {}, 'Consultando equipamentos ativos na topologia');
  const btnAutoLayout = () => handleCallTool('pt_auto_layout', {}, 'Organizando layout visual...');
  const btnClearCanvas = () => setShowClearConfirm(true);

  const btnDeleteAllLoopbacks = async () => {
    addLog('[CMD] Buscando roteadores na topologia...');
    setLoading(true);
    try {
      const topoResult = await callMcpTool('pt_query_topology', {});
      let parsed: any = topoResult;
      if (typeof topoResult === 'string') { try { parsed = JSON.parse(topoResult); } catch { parsed = {}; } }
      const devices: any[] = parsed?.devices || [];
      const routers = devices.filter((d: any) => {
        const m = (d.model || '').toLowerCase();
        return m.includes('2911') || m.includes('2901') || m.includes('1941') || m.includes('isr') || m.includes('router');
      });
      if (routers.length === 0) { addLog('[WARNING] Nenhum roteador encontrado.'); return; }

      let total = 0;
      for (const router of routers) {
        const briefResult = await callMcpTool('pt_run_cli', { device: router.name, command: '\nenable\nshow ip interface brief\n' });
        const text = extractMcpText(briefResult);
        const loopbacks = [...text.matchAll(/^(Loopback\d+)\s+/gmi)].map(m => m[1]);
        if (loopbacks.length === 0) continue;
        addLog(`[CMD] ${router.name}: removendo ${loopbacks.length} Loopback(s): ${loopbacks.join(', ')}`);
        const cmds = loopbacks.map(lo => `no interface ${lo}`).join('\n');
        await callMcpTool('pt_run_cli', { device: router.name, command: `\nenable\nconfigure terminal\n${cmds}\nend\n` });
        total += loopbacks.length;
      }
      addLog(`[SUCCESS] ${total} Loopback(s) removida(s) de ${routers.length} roteador(es).`);
      try { await syncIpRegistry(true); } catch { /* silent */ }
    } catch (err: any) {
      addLog(`[ERROR] Falha ao deletar Loopbacks: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const btnSaveAllConfigs = async () => {
    addLog('[CMD] Buscando dispositivos na topologia...');
    setLoading(true);
    setStats(prev => ({ ...prev, commands: prev.commands + 1 }));
    try {
      const topoResult = await callMcpTool('pt_query_topology', {});
      let parsed: any = topoResult;
      if (typeof topoResult === 'string') {
        try { parsed = JSON.parse(topoResult); } catch { parsed = {}; }
      }
      const devices: any[] = parsed?.devices || [];
      if (parsed?.devices) setDeviceList(parsed.devices);
      if (parsed?.links) setLinkList(parsed.links);

      const targets = devices.filter((d: any) => {
        const model = (d.model || '').toLowerCase();
        return model.includes('2911') || model.includes('2901') || model.includes('1941') ||
               model.includes('isr') || model.includes('router') ||
               model.includes('2960') || model.includes('3560') || model.includes('switch');
      });

      if (targets.length === 0) {
        addLog('[WARNING] Nenhum roteador ou switch encontrado na topologia.');
        return;
      }

      addLog(`[CMD] Salvando NVRAM em ${targets.length} dispositivo(s): ${targets.map((d: any) => d.name).join(', ')}`);

      for (const d of targets) {
        addLog(`[CMD] Salvando ${d.name}...`);
        const res = await callMcpTool('pt_run_cli', { device: d.name, command: '\nenable\nwrite\n' });
        const text = typeof res === 'string' ? res : JSON.stringify(res);
        text.split('\n').forEach((line: string) => { if (line.trim()) addLog(`[OUTPUT] ${d.name}: ${line}`); });
      }
      addLog('[SUCCESS] Configurações salvas na NVRAM com sucesso.');
    } catch (err: any) {
      addLog(`[ERROR] Falha ao salvar configurações: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  const confirmClearCanvas = () => {
    setShowClearConfirm(false);
    if (!ptConnected) {
      addLog('[ERROR] PT Bridge não conectado. Abra o Packet Tracer e execute o script de ponte antes de limpar o canvas.');
      return;
    }
    handleCallTool('pt_clear_canvas', { confirm: true }, 'Limpando o projeto...');
  };

  const btnExecuteCustom = () => {
    if (!customCommand.trim()) return;
    handleCallTool('pt_run_cli', { device: customDevice, command: "\n" + customCommand + "\n" }, `Enviando comando para ${customDevice}...`, addLog2);
    setCustomCommand('');
  };

  const btnExecuteCustomB = () => {
    if (!customCommandB.trim()) return;
    handleCallTool('pt_run_cli', { device: customDeviceB, command: "\n" + customCommandB + "\n" }, `Enviando comando para ${customDeviceB}...`, addLog3);
    setCustomCommandB('');
  };


  const btnSendNaturalCommand = async () => {
    if (!naturalPrompt.trim()) return;
    addLog(`[USER] Requerimento: "${naturalPrompt}"`);
    const promptBackup = naturalPrompt;
    setNaturalPrompt('');
    agentAbortRef.current = false;
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
      addLog(`[DEBUG] API Key presente: ${apiKey ? 'Sim (' + apiKey.substring(0,12) + '...)' : 'NÃO'}`);

      // Helper para fatiar o histórico sem quebrar cadeias de tool_calls
      // O OpenAI exige que mensagens 'tool' sigam imediatamente um 'assistant' com 'tool_calls'
      const getSafeHistory = (rawHistory: any[], limit: number) => {
        let slice = rawHistory.slice(-(limit * 2));
        // Se o primeiro item do fatiamento for uma resposta de ferramenta,
        // precisamos remover até encontrar uma mensagem que não seja dependente.
        while (slice.length > 0 && (slice[0].role === 'tool' || (slice[0].role === 'assistant' && slice[0].tool_calls && !slice[0].content))) {
          slice.shift();
        }
        return slice;
      };

      const historyToPass = getSafeHistory(chatHistory, maxMemory);
      
      const updatedHistory = await processNaturalLanguage(promptBackup, apiKey, addLog, maxIterations, historyToPass, buildEffectiveSystemPrompt(), () => agentAbortRef.current);
      setChatHistory(updatedHistory);
      try { await syncIpRegistry(true); } catch { /* silent */ }

    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
      if (err.stack) addLog(`[ERROR-STACK] ${err.stack.split('\n').slice(0,3).join(' | ')}`);
    } finally {
      setLoading(false);
    }
  };

  const getLogClass = (log: string): string => {
    if (log.includes('[ERROR]') || log.includes('[IA-ERROR]')) return 'error';
    if (log.includes('[SUCCESS]')) return 'success';
    if (log.includes('[IA]')) return 'ai';
    if (log.includes('[USER]')) return 'user';
    if (log.includes('[CMD]')) return 'cmd';
    return '';
  };

  return (
    <div className="app-shell">
      {/* ─── Agent Flyout Menu ─── */}
      {showAgentMenu && (
        <div className="agent-flyout">
          <div className="flyout-header">
            <div className="flyout-title"><IconAI size={15} /> Menu do Agente</div>
            <button className="close-mini-btn" onClick={() => setShowAgentMenu(false)}>✕</button>
          </div>
          <div className="flyout-content">
            <div className="flyout-section-label">Configuração e Controle</div>
            <button 
              className="flyout-item" 
              onClick={() => {
                setShowMemorySettings(true);
                setShowAgentMenu(false);
              }}
            >
              <span className="flyout-item-icon"><IconBrain size={20} /></span>
              <div className="flyout-item-text">
                <span className="flyout-item-title">Tamanho da Memória</span>
                <span className="flyout-item-desc">Ajuste quantas mensagens o agente lembra</span>
              </div>
            </button>
            
            <button 
              className="flyout-item" 
              onClick={() => {
                setShowSettings(true);
                setShowAgentMenu(false);
              }}
            >
              <span className="flyout-item-icon"><IconSettings size={20} /></span>
              <div className="flyout-item-text">
                <span className="flyout-item-title">Limite de loop</span>
                <span className="flyout-item-desc">Ajuste o limite de iterações consecutivas</span>
              </div>
            </button>

            <button 
              className="flyout-item" 
              onClick={() => {
                setShowPromptModal(true);
                setShowAgentMenu(false);
              }}
            >
              <span className="flyout-item-icon"><IconDoc size={20} /></span>
              <div className="flyout-item-text">
                <span className="flyout-item-title">Prompt do Sistema</span>
                <span className="flyout-item-desc">Edite as instruções base do agente</span>
              </div>
            </button>

            <button 
              className="flyout-item" 
              onClick={() => {
                setChatHistory([]);
                addLog("[SYSTEM] Memória do Agente reiniciada.");
                setShowAgentMenu(false);
              }}
            >
              <span className="flyout-item-icon"><IconTrash size={20} /></span>
              <div className="flyout-item-text">
                <span className="flyout-item-title">Limpar Memória</span>
                <span className="flyout-item-desc">Esquece o contexto da conversa atual</span>
              </div>
            </button>

            <button 
              className="flyout-item danger" 
              onClick={() => {
                agentAbortRef.current = true;
                addLog("[SYSTEM] Sinal de parada enviado — o agente será interrompido após a ação atual.");
                setShowAgentMenu(false);
              }}
            >
              <span className="flyout-item-icon"><IconStop size={20} /></span>
              <div className="flyout-item-text">
                <span className="flyout-item-title">Parar Agente</span>
                <span className="flyout-item-desc">Interrompe a tarefa em execução</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ─── Canvas Flyout Menu ─── */}
      {showCanvasMenu && (
        <div className="agent-flyout">
          <div className="flyout-header">
            <div className="flyout-title"><IconMap size={15} /> PT Canvas</div>
            <button className="close-mini-btn" onClick={() => setShowCanvasMenu(false)}>✕</button>
          </div>
          <div className="flyout-content">
            <div className="flyout-section-label">Ações do PT Canvas</div>
            <button
              className="flyout-item"
              disabled={loading || !connected}
              onClick={() => {
                btnAutoLayout();
                setShowCanvasMenu(false);
              }}
            >
              <span className="flyout-item-icon"><IconMap size={20} /></span>
              <div className="flyout-item-text">
                <span className="flyout-item-title">Organizar Layout</span>
                <span className="flyout-item-desc">Reorganiza visualmente os dispositivos no canvas</span>
              </div>
            </button>

            <button
              className="flyout-item"
              disabled={loading || !connected}
              onClick={() => {
                btnSaveAllConfigs();
                setShowCanvasMenu(false);
              }}
            >
              <span className="flyout-item-icon"><IconSave size={20} /></span>
              <div className="flyout-item-text">
                <span className="flyout-item-title">Salvar NVRAM</span>
                <span className="flyout-item-desc">Executa "write" em todos os roteadores e switches</span>
              </div>
            </button>

            <button
              className="flyout-item danger"
              disabled={loading || !connected}
              onClick={() => {
                setShowCanvasMenu(false);
                if (window.confirm('Remover TODAS as interfaces Loopback de TODOS os roteadores?')) {
                  btnDeleteAllLoopbacks();
                }
              }}
            >
              <span className="flyout-item-icon"><IconTrash size={20} /></span>
              <div className="flyout-item-text">
                <span className="flyout-item-title">Deletar Loopbacks</span>
                <span className="flyout-item-desc">Remove todas as Loopbacks de todos os roteadores</span>
              </div>
            </button>

            <button
              className="flyout-item danger"
              disabled={loading || !connected}
              onClick={() => {
                setShowCanvasMenu(false);
                btnClearCanvas();
              }}
            >
              <span className="flyout-item-icon"><IconWarn size={20} /></span>
              <div className="flyout-item-text">
                <span className="flyout-item-title">Limpar Canvas</span>
                <span className="flyout-item-desc">Remove todos os equipamentos e conexões</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ─── Memory Settings Modal ─── */}
      {showMemorySettings && (
        <div className="settings-overlay">
          <div className="card settings-modal">
            <div className="card-header">
              <div className="card-title">
                <span className="card-title-icon"><IconBrain size={16} /></span>
                Configurações de Memória
              </div>
              <button className="close-btn" onClick={() => setShowMemorySettings(false)}>✕</button>
            </div>
            <div className="card-body">
              <div className="settings-group">
                <label>Mensagens no Contexto: {maxMemory}</label>
                <div className="range-wrapper">
                  <input 
                    type="range" 
                    min="1" 
                    max="40" 
                    value={maxMemory} 
                    onChange={(e) => setMaxMemory(parseInt(e.target.value))}
                  />
                  <span className="range-value">{maxMemory} msgs</span>
                </div>
                <p className="settings-hint">
                  Define quantas mensagens anteriores (User + IA) são enviadas para o agente. 
                  Valores maiores permitem conversas longas, mas aumentam o consumo de tokens.
                </p>
              </div>
              <div className="settings-footer">
                <button className="btn btn-primary" onClick={() => setShowMemorySettings(false)}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Sidebar ─── */}
      <aside className="sidebar">

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${showCanvasMenu ? 'active' : ''}`}
            title="PT Canvas"
            onClick={() => { setShowCanvasMenu(!showCanvasMenu); setShowAgentMenu(false); }}
          >
            <IconMap size={22} />
            <span className="nav-label">PT Canvas</span>
          </button>
          <div className="sidebar-divider" />
          <button
            className={`nav-item ${showAgentMenu ? 'active' : ''}`}
            title="AI Agent"
            onClick={() => { setShowAgentMenu(!showAgentMenu); setShowCanvasMenu(false); }}
          >
            <IconAI size={22} />
            <span className="nav-label">AI Agent</span>
          </button>
        </nav>

      </aside>

      {/* ─── Main ─── */}
      <div className="main-content">
        {/* ─── Top Header ─── */}
        <header className="top-header">
          <div className="header-left">
            <img src="/logo-4x.png" className="header-logo" alt="4X AI Network" />
          </div>
          <div className="header-center">
            <span className="header-title">4X AI NETWORK - Just Talk To Your Network.</span>
          </div>
          <div className="header-right">
            <div className="header-badge pt-bridge-dot-badge" title={ptConnected ? 'PT Bridge: Conectado' : 'PT Bridge: Aguardando'}>
              <div className={`pt-bridge-dot ${ptConnected ? 'online' : 'offline'}`} />
              <span className="badge-label">PT Bridge</span>
            </div>
            <div className="header-badge-divider" />
            <div className="header-badge stat-badge">
              <span className="badge-value">{stats.devices}</span>
              <span className="badge-label">Dispositivos</span>
            </div>
            <div className="header-badge stat-badge">
              <span className="badge-value">{stats.links}</span>
              <span className="badge-label">Links</span>
            </div>
          </div>
        </header>

        {/* ─── Scrollable Content ─── */}
        <div className="content-area">

          {/* ─── Tab Bar ─── */}
          <div className="main-tab-bar">
            <button
              className={`main-tab-btn ${activeTab === 'aba1' ? 'active' : ''}`}
              onClick={() => setActiveTab('aba1')}
            >
              <span className="main-tab-icon"><IconAI size={15} /></span>
              AI Agent
            </button>
            <button
              className={`main-tab-btn ${activeTab === 'aba2' ? 'active' : ''}`}
              onClick={() => setActiveTab('aba2')}
            >
              <span className="main-tab-icon"><IconTerminal size={15} /></span>
              Routers Check
            </button>
            <button
              className={`main-tab-btn ${activeTab === 'aba3' ? 'active' : ''}`}
              onClick={() => setActiveTab('aba3')}
            >
              <span className="main-tab-icon"><IconGlobe size={15} /></span>
              Topologia
            </button>
          </div>

          {/* ─── Aba 1: IA + Terminal AI ─── */}
          {activeTab === 'aba1' && <div className="tab1-grid">
            {/* ─── AI Assistant Card ─── */}
            <div className="card ai-section">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon"><IconAI size={16} /></span>
                  Converse com a sua rede:
                </div>
                {loading && <div className="loader" />}
              </div>
              <div className="card-body">
                <div className="ai-input-wrapper">
                  <input
                    type="text"
                    className="ai-input"
                    value={naturalPrompt}
                    onChange={(e) => setNaturalPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && btnSendNaturalCommand()}
                    placeholder="Digite livremente. Ex: 'Adicione um Switch SW4 e ligue ao R1'"
                  />
                  <button
                    className="btn btn-orange"
                    onClick={btnSendNaturalCommand}
                    disabled={loading || !naturalPrompt.trim()}
                  >
                    <IconWand size={15} /> Executar Magia
                  </button>
                </div>

              </div>
            </div>

            {/* ─── Terminal 1 · IA ─── */}
            <div className="terminal-section">
              <div className="card terminal-card-ai">
                <div className="card-header">
                  <div className="card-title">
                    <span className="card-title-icon"><IconAI size={16} /></span>
                    Terminal Output
                    <span className="terminal-label terminal-label-ai">IA · Linguagem Natural</span>
                    {loading && <div className="loader" />}
                  </div>
                  <div className="card-actions">
                    <button className="clear-btn" disabled={!loading} onClick={() => {
                      agentAbortRef.current = true;
                      addLog("[SYSTEM] Sinal de parada enviado — o agente será interrompido após a ação atual.");
                    }}>
                      <IconStop size={13} /> Parar Agente
                    </button>
                    <button className="clear-btn" onClick={() => setLogs([])}>
                      <IconTrash size={13} /> Limpar
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="terminal" ref={terminalRef}>
                    {logs.length === 0 && (
                      <div className="terminal-line" style={{ opacity: 0.3 }}>
                        <span className="terminal-prefix">❯</span>
                        <span className="terminal-text">Aguardando comandos da IA...</span>
                      </div>
                    )}
                    {logs.map((log, idx) => (
                      <div key={idx} className="terminal-line">
                        <span className="terminal-prefix">❯</span>
                        <span className={`terminal-text ${getLogClass(log)}`}>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>}

          {/* ─── Aba 2: Execução Direta + Terminal CLI ─── */}
          {activeTab === 'aba2' && <div className="tab2-grid">

            {/* ─── Router A · Execução Direta ─── */}
            <div className="card tab2-command router-card-a">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon"><IconTerminal size={16} /></span>
                  Router A - Execução Direta
                </div>
                {loading && <div className="loader" />}
              </div>
              <div className="card-body">
                <div className="command-row">
                  <div className="field field-device">
                    <label>Alvo</label>
                    <input
                      type="text"
                      value={customDevice}
                      onChange={(e) => setCustomDevice(e.target.value)}
                      placeholder="R1"
                    />
                  </div>
                  <div className="field field-grow">
                    <label>Comando / Ação</label>
                    <input
                      type="text"
                      value={customCommand}
                      onChange={(e) => setCustomCommand(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && btnExecuteCustom()}
                      placeholder="Ex: show ip int brief"
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={btnExecuteCustom}
                    disabled={loading || !connected || !customCommand.trim()}
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>

            {/* ─── Router B · Execução Direta ─── */}
            <div className="card tab2-command router-card-b">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon"><IconTerminal size={16} /></span>
                  Router B - Execução Direta
                </div>
                {loading && <div className="loader" />}
              </div>
              <div className="card-body">
                <div className="command-row">
                  <div className="field field-device">
                    <label>Alvo</label>
                    <input
                      type="text"
                      value={customDeviceB}
                      onChange={(e) => setCustomDeviceB(e.target.value)}
                      placeholder="R2"
                    />
                  </div>
                  <div className="field field-grow">
                    <label>Comando / Ação</label>
                    <input
                      type="text"
                      value={customCommandB}
                      onChange={(e) => setCustomCommandB(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && btnExecuteCustomB()}
                      placeholder="Ex: show ip int brief"
                    />
                  </div>
                  <button
                    className="btn btn-orange"
                    onClick={btnExecuteCustomB}
                    disabled={loading || !connected || !customCommandB.trim()}
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>

            {/* ─── Router A · Terminal ─── */}
            <div className="tab2-terminal">
              <div className="card terminal-card-cli" style={{ height: '100%' }}>
                <div className="card-header">
                  <div className="card-title">
                    <span className="card-title-icon"><IconTerminal size={16} /></span>
                    Router A - Terminal Output
                    <span className="terminal-label terminal-label-cli">CLI · Comandos Diretos</span>
                  </div>
                  <div className="card-actions">
                    <button className="clear-btn" onClick={() => setLogs2([])}><IconTrash size={13} /> Limpar</button>
                  </div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <div className="terminal terminal-tall" ref={terminalRef2}>
                    {logs2.length === 0 && (
                      <div className="terminal-line" style={{ opacity: 0.3 }}>
                        <span className="terminal-prefix">❯</span>
                        <span className="terminal-text">Aguardando comandos do Router A...</span>
                      </div>
                    )}
                    {logs2.map((log, idx) => (
                      <div key={idx} className="terminal-line">
                        <span className="terminal-prefix">❯</span>
                        <span className={`terminal-text ${getLogClass(log)}`}>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Router B Terminal ─── */}
            <div className="tab2-terminal">
              <div className="card terminal-card-cli-b" style={{ height: '100%' }}>
                <div className="card-header">
                  <div className="card-title">
                    <span className="card-title-icon"><IconTerminal size={16} /></span>
                    Router B - Terminal Output
                    <span className="terminal-label terminal-label-cli-b">CLI · Comandos Diretos</span>
                  </div>
                  <div className="card-actions">
                    <button className="clear-btn" onClick={() => setLogs3([])}><IconTrash size={13} /> Limpar</button>
                  </div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <div className="terminal terminal-tall" ref={terminalRef3}>
                    {logs3.length === 0 && (
                      <div className="terminal-line" style={{ opacity: 0.3 }}>
                        <span className="terminal-prefix">❯</span>
                        <span className="terminal-text">Aguardando comandos do Router B...</span>
                      </div>
                    )}
                    {logs3.map((log, idx) => (
                      <div key={idx} className="terminal-line">
                        <span className="terminal-prefix">❯</span>
                        <span className={`terminal-text ${getLogClass(log)}`}>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>}

          {/* ─── Aba 3: Mapa de Topologia ─── */}
          {activeTab === 'aba3' && <div className="tab3-grid">
            <div className="card tab3-topology">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon"><IconGlobe size={16} /></span>
                  Mapa de Topologia
                </div>
                <div className="card-tabs">
                  <button
                    className={`tab-btn ${viewMode === 'devices' ? 'active' : ''}`}
                    onClick={() => setViewMode('devices')}
                  >
                    Equipamentos
                  </button>
                  <button
                    className={`tab-btn ${viewMode === 'links' ? 'active' : ''}`}
                    onClick={() => setViewMode('links')}
                  >
                    Conexões
                  </button>
                  <button
                    className={`tab-btn ${viewMode === 'loopbacks' ? 'active' : ''}`}
                    onClick={() => setViewMode('loopbacks')}
                  >
                    Loopbacks
                  </button>
                  <button
                    className={`tab-btn ${viewMode === 'registry' ? 'active' : ''}`}
                    onClick={() => setViewMode('registry')}
                  >
                    Redes IP
                    {ipRegistry.length > 0 && <span className="registry-count-badge">{ipRegistry.length}</span>}
                  </button>
                </div>
                <div className="card-actions">
                  <button
                    className={`tab-btn ${autoRefresh ? 'active' : ''}`}
                    title="Atualizar automaticamente a cada 15s"
                    onClick={() => setAutoRefresh(v => !v)}
                    disabled={!connected}
                  >
                    {autoRefresh ? <><IconPause size={12} /> Auto</> : <><IconPlay size={12} /> Auto</>}
                  </button>
                  <button
                    className="clear-btn"
                    title="Atualizar agora"
                    onClick={btnListDevices}
                    disabled={loading || !connected}
                  >
                    <IconRefresh size={13} /> Refresh
                  </button>
                </div>
              </div>
              <div className="card-body">
                {viewMode === 'devices' && (
                  deviceList.length === 0 ? (
                    <div className="empty-state">
                      Nenhum equipamento listado. Clique em Refresh para carregar.
                    </div>
                  ) : (
                    <>
                      <div className="loopback-filter-bar">
                        <input
                          className="loopback-filter-input"
                          type="text"
                          placeholder="Dispositivo (ex: R1)"
                          value={devNameFilter}
                          onChange={e => setDevNameFilter(e.target.value)}
                        />
                        <input
                          className="loopback-filter-input"
                          type="text"
                          placeholder="Modelo (ex: 2911)"
                          value={devModelFilter}
                          onChange={e => setDevModelFilter(e.target.value)}
                        />
                        {(devNameFilter || devModelFilter) && (() => {
                          const count = deviceList.filter(dev => {
                            const qn = devNameFilter.trim().toLowerCase();
                            const qm = devModelFilter.trim().toLowerCase();
                            if (qn && !dev.name.toLowerCase().includes(qn)) return false;
                            if (qm && !(dev.model || '').toLowerCase().includes(qm)) return false;
                            return true;
                          }).length;
                          return <span className="loopback-filter-count">{count} resultado{count !== 1 ? 's' : ''}</span>;
                        })()}
                      </div>
                      <div className="table-container-full">
                        <table className="topology-table">
                          <thead>
                            <tr>
                              <th>Equipamento</th>
                              <th>Modelo</th>
                              <th>Portas Ocupadas</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deviceList
                              .filter(dev => {
                                const qn = devNameFilter.trim().toLowerCase();
                                const qm = devModelFilter.trim().toLowerCase();
                                if (qn && !dev.name.toLowerCase().includes(qn)) return false;
                                if (qm && !(dev.model || '').toLowerCase().includes(qm)) return false;
                                return true;
                              })
                              .map((dev, idx) => (
                                <tr key={idx}>
                                  <td>
                                    <span className="device-icon">{getDeviceIcon(dev.model)}</span>
                                    <span className="device-name" style={{color: getDeviceColor(dev.model)}}>{dev.name}</span>
                                  </td>
                                  <td>{dev.model}</td>
                                  <td>
                                    <div className="port-tags">
                                      {dev.ports && dev.ports.length > 0 ? (
                                        dev.ports.map((p: any, pIdx: number) => (
                                          <span key={pIdx} className="port-tag">{p.name}</span>
                                        ))
                                      ) : (
                                        <span className="no-ports">Nenhuma porta conectada</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )
                )}

                {viewMode === 'links' && (
                  linkList.length === 0 ? (
                    <div className="empty-state">
                      Nenhuma conexão detectada.
                    </div>
                  ) : (
                    <>
                      <div className="loopback-filter-bar">
                        <input
                          className="loopback-filter-input"
                          type="text"
                          placeholder="Origem (ex: R1)"
                          value={linksOrigemFilter}
                          onChange={e => setLinksOrigemFilter(e.target.value)}
                        />
                        <input
                          className="loopback-filter-input"
                          type="text"
                          placeholder="Destino (ex: SW1)"
                          value={linksDestinoFilter}
                          onChange={e => setLinksDestinoFilter(e.target.value)}
                        />
                        {(linksOrigemFilter || linksDestinoFilter) && (() => {
                          const count = linkList.filter(link => {
                            const qo = linksOrigemFilter.trim().toLowerCase();
                            const qd = linksDestinoFilter.trim().toLowerCase();
                            if (qo && !link.aDevice.toLowerCase().includes(qo)) return false;
                            if (qd && !link.bDevice.toLowerCase().includes(qd)) return false;
                            return true;
                          }).length;
                          return <span className="loopback-filter-count">{count} resultado{count !== 1 ? 's' : ''}</span>;
                        })()}
                      </div>
                      <div className="table-container-full">
                      <table className="topology-table">
                        <thead>
                          <tr>
                            <th>Origem</th>
                            <th style={{textAlign: 'center'}}>Status</th>
                            <th>Porta</th>
                            <th>IP</th>
                            <th>Destino</th>
                            <th style={{textAlign: 'center'}}>Status</th>
                            <th>Porta</th>
                            <th>IP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {linkList.filter(link => {
                            const qo = linksOrigemFilter.trim().toLowerCase();
                            const qd = linksDestinoFilter.trim().toLowerCase();
                            if (qo && !link.aDevice.toLowerCase().includes(qo)) return false;
                            if (qd && !link.bDevice.toLowerCase().includes(qd)) return false;
                            return true;
                          }).map((link, idx) => {
                            const ipA = getIpString(link.aDevice, link.aPort);
                            const ipB = getIpString(link.bDevice, link.bPort);
                            const pA = getPort(link.aDevice, link.aPort);
                            const pB = getPort(link.bDevice, link.bPort);
                            return (
                              <tr key={idx}>
                                <td>
                                  <span className="device-icon">{getDeviceIcon(deviceList.find(d => d.name === link.aDevice)?.model || '', 16)}</span>
                                  <span className="device-name" style={{color:getDeviceColorByName(link.aDevice)}}>{link.aDevice}</span>
                                </td>
                                <td style={{textAlign: 'center'}}>
                                  <span className={`status-dot ${getSinglePortStatusColor(pA)}`} title={getSinglePortStatusColor(pA).toUpperCase()}></span>
                                </td>
                                <td><span className="port-tag">{link.aPort}</span></td>
                                <td>{ipA ? <span className="ip-badge">{ipA}</span> : <span style={{opacity: 0.2}}>-</span>}</td>
                                <td>
                                  <span className="device-icon">{getDeviceIcon(deviceList.find(d => d.name === link.bDevice)?.model || '', 16)}</span>
                                  <span className="device-name" style={{color:getDeviceColorByName(link.bDevice)}}>{link.bDevice}</span>
                                </td>
                                <td style={{textAlign: 'center'}}>
                                  <span className={`status-dot ${getSinglePortStatusColor(pB)}`} title={getSinglePortStatusColor(pB).toUpperCase()}></span>
                                </td>
                                <td><span className="port-tag">{link.bPort}</span></td>
                                <td>{ipB ? <span className="ip-badge">{ipB}</span> : <span style={{opacity: 0.2}}>-</span>}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      </div>
                    </>
                  )
                )}

                {viewMode === 'registry' && (
                  <div className="loopback-view">
                    <div className="registry-sync-bar">
                      <div style={{display:'flex',flexDirection:'column',gap:4}}>
                        <span className="registry-sync-info">
                          {ipRegistry.length === 0
                            ? 'Registry vazio — nenhuma sub-rede registrada'
                            : `${ipRegistry.length} sub-rede${ipRegistry.length !== 1 ? 's' : ''} em uso`}
                        </span>
                        {registrySyncMsg && (
                          <span style={{fontSize:11,color: registrySyncMsg.ok ? '#34d399' : 'var(--orange-500)'}}>
                            {registrySyncMsg.ok ? '✓ ' : '⚠ '}{registrySyncMsg.text}
                          </span>
                        )}
                      </div>
                      <div className="registry-sync-actions">
                        <button
                          className="clear-btn"
                          onClick={() => { if (window.confirm('Limpar todo o IP Registry?')) { setIpRegistry([]); setRegistrySyncMsg(null); addLog('[REGISTRY] Registry limpo manualmente.'); } }}
                          disabled={ipRegistry.length === 0}
                        >
                          <IconTrash size={13} /> Limpar
                        </button>
                        <button
                          className="clear-btn"
                          onClick={() => syncIpRegistry(false)}
                          disabled={registryLoading}
                        >
                          {registryLoading ? <><div className="loader" style={{width:10,height:10,borderWidth:1.5}} /> Sincronizando...</> : <><IconRefresh size={13} /> Sincronizar</>}
                        </button>
                      </div>
                    </div>
                    {ipRegistry.length === 0 ? (
                      <div className="empty-state">
                        Registry vazio. Clique em "Sincronizar" para ler as configurações do Packet Tracer, ou execute um comando via IA — o registry será atualizado automaticamente.
                      </div>
                    ) : (
                      <>
                        <div className="loopback-filter-bar">
                          <input
                            className="loopback-filter-input"
                            type="text"
                            placeholder="Dispositivo (ex: R1)"
                            value={registryDevFilter}
                            onChange={e => setRegistryDevFilter(e.target.value)}
                          />
                          <input
                            className="loopback-filter-input"
                            type="text"
                            placeholder="Rede (ex: 192.168.1.0/24)"
                            value={registryNetFilter}
                            onChange={e => setRegistryNetFilter(e.target.value)}
                          />
                          {(registryDevFilter || registryNetFilter) && (() => {
                            const count = ipRegistry.filter(e => {
                              const qd = registryDevFilter.trim().toLowerCase();
                              const qn = registryNetFilter.trim().toLowerCase();
                              if (qd && !e.device.toLowerCase().includes(qd)) return false;
                              if (qn && !e.subnet.toLowerCase().includes(qn)) return false;
                              return true;
                            }).length;
                            return <span className="loopback-filter-count">{count} resultado{count !== 1 ? 's' : ''}</span>;
                          })()}
                        </div>
                        <div className="loopback-table-wrap">
                          <table className="topology-table">
                            <thead>
                              <tr>
                                <th>Sub-rede</th>
                                <th>Dispositivo</th>
                                <th>Interface</th>
                                <th>IP</th>
                                <th>Tipo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ipRegistry
                                .filter(e => {
                                  const qd = registryDevFilter.trim().toLowerCase();
                                  const qn = registryNetFilter.trim().toLowerCase();
                                  if (qd && !e.device.toLowerCase().includes(qd)) return false;
                                  if (qn && !e.subnet.toLowerCase().includes(qn)) return false;
                                  return true;
                                })
                                .map((entry, idx) => (
                                  <tr key={idx}>
                                    <td><span className="subnet-badge">{entry.subnet}</span></td>
                                    <td>
                                      <span className="device-icon">{getDeviceIcon(deviceList.find(d => d.name === entry.device)?.model || '', 16)}</span>
                                      <span className="device-name" style={{color: getDeviceColorByName(entry.device)}}>{entry.device}</span>
                                    </td>
                                    <td><span className="loopback-tag">{entry.iface}</span></td>
                                    <td><span className="ip-badge">{entry.ip}</span></td>
                                    <td><span className={`registry-type-badge registry-type-${entry.type}`}>{entry.type}</span></td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {viewMode === 'loopbacks' && (() => {
                  const allLoopbackRows: { dev: any; port: any }[] = [];
                  deviceList.forEach(dev => {
                    (dev.ports || [])
                      .filter((p: any) => p.name && p.name.toLowerCase().startsWith('loopback'))
                      .forEach((port: any) => allLoopbackRows.push({ dev, port }));
                  });
                  const filtered = allLoopbackRows.filter(({ dev, port }) => {
                    const qDev = loopbackFilter.trim().toLowerCase();
                    const qNet = loopbackNetFilter.trim().toLowerCase();
                    if (qDev && !dev.name.toLowerCase().includes(qDev)) return false;
                    if (qNet) {
                      if (!port.ip || port.ip === '0.0.0.0') return false;
                      const parts = port.ip.split('.');
                      const subnet = `${parts[0]}.${parts[1]}.${parts[2]}.0${maskToCidr(port.mask || port.subnetMask || '')}`;
                      if (!subnet.toLowerCase().includes(qNet)) return false;
                    }
                    return true;
                  });

                  return (
                    <div className="loopback-view">
                      <div className="loopback-filter-bar">
                        <input
                          className="loopback-filter-input"
                          type="text"
                          placeholder="Dispositivo (ex: R1)"
                          value={loopbackFilter}
                          onChange={e => setLoopbackFilter(e.target.value)}
                        />
                        <input
                          className="loopback-filter-input"
                          type="text"
                          placeholder="Rede (ex: 192.168.1.0/24)"
                          value={loopbackNetFilter}
                          onChange={e => setLoopbackNetFilter(e.target.value)}
                        />
                        {(loopbackFilter || loopbackNetFilter) && (
                          <span className="loopback-filter-count">
                            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {filtered.length === 0 ? (
                        <div className="empty-state">
                          {allLoopbackRows.length === 0
                            ? 'Nenhuma interface Loopback encontrada. Clique em Refresh para carregar.'
                            : `Nenhum resultado para os filtros informados.`}
                        </div>
                      ) : (
                        <div className="loopback-table-wrap">
                          <table className="topology-table">
                            <thead>
                              <tr>
                                <th>Roteador</th>
                                <th>Interface</th>
                                <th style={{textAlign: 'center'}}>Status</th>
                                <th>IP / Máscara</th>
                                <th>Sub-rede</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.map(({ dev, port }, idx) => {
                                const statusColor = getSinglePortStatusColor(port);
                                const ipCidr = port.ip && port.ip !== '0.0.0.0'
                                  ? `${port.ip}${maskToCidr(port.mask || port.subnetMask || '')}`
                                  : null;
                                const subnet = port.ip && port.ip !== '0.0.0.0'
                                  ? (() => {
                                      const parts = port.ip.split('.');
                                      return `${parts[0]}.${parts[1]}.${parts[2]}.0${maskToCidr(port.mask || port.subnetMask || '')}`;
                                    })()
                                  : null;
                                return (
                                  <tr key={idx}>
                                    <td>
                                      <span className="device-icon">{getDeviceIcon(dev.model, 16)}</span>
                                      <span className="device-name" style={{color: getDeviceColor(dev.model)}}>{dev.name}</span>
                                    </td>
                                    <td><span className="loopback-tag">{port.name}</span></td>
                                    <td style={{textAlign: 'center'}}>
                                      <span className={`status-dot ${statusColor}`} title={statusColor.toUpperCase()}></span>
                                    </td>
                                    <td>{ipCidr ? <span className="ip-badge">{ipCidr}</span> : <span style={{opacity: 0.3}}>—</span>}</td>
                                    <td>{subnet ? <span className="subnet-badge">{subnet}</span> : <span style={{opacity: 0.3}}>—</span>}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>}

        </div>
      </div>

      {/* ─── Clear Canvas Confirm Modal ─── */}
      {showClearConfirm && (
        <div className="settings-overlay">
          <div className="card settings-modal">
            <div className="card-header">
              <div className="card-title">
                <span className="card-title-icon"><IconWarn size={16} /></span>
                Confirmar Limpeza
              </div>
            </div>
            <div className="card-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Tem certeza que deseja <strong style={{ color: 'var(--danger)' }}>APAGAR TODOS</strong> os equipamentos e conexões do Packet Tracer? Esta ação não pode ser desfeita.
              </p>
              <div className="settings-footer">
                <button className="btn btn-secondary" onClick={() => setShowClearConfirm(false)}>Cancelar</button>
                <button className="btn" style={{ background: 'var(--danger)', color: '#fff' }} onClick={confirmClearCanvas}>
                  Apagar Tudo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Settings Modal ─── */}
      {showSettings && (
        <div className="settings-overlay">
          <div className="settings-modal card">
            <div className="card-header">
              <div className="card-title">
                <span className="card-title-icon"><IconSettings size={16} /></span>
                Configurações do Limite de Loop
              </div>
              <button className="close-btn" onClick={() => setShowSettings(false)}>✕</button>
            </div>
            <div className="card-body">
              <div className="settings-group">
                <label>Limite de Loop de Proteção (Ações Consecutivas)</label>
                <div className="range-wrapper">
                  <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={maxIterations} 
                    onChange={(e) => setMaxIterations(parseInt(e.target.value))}
                  />
                  <span className="range-value">{maxIterations} ações</span>
                </div>
                <p className="settings-hint">
                  Aumentar este limite permite que a IA resolva tarefas mais complexas sem interrupção, 
                  mas aumenta o risco de loops infinitos se houver erros persistentes.
                </p>
              </div>
              <div className="settings-footer">
                <button className="btn btn-primary" onClick={() => setShowSettings(false)}>
                  Salvar e Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── System Prompt Modal ─── */}
      {showPromptModal && (
        <div className="settings-overlay">
          <div className="settings-modal card prompt-modal">
            <div className="card-header">
              <div className="card-title">
                <div className="card-title-main">
                  <span className="card-title-icon"><IconDoc size={16} /></span>
                  Instruções do Sistema
                </div>
                <div className="version-badge">
                  v{promptVersion} • {lastPromptUpdate}
                </div>
              </div>
              <button className="close-btn" onClick={() => setShowPromptModal(false)}>✕</button>
            </div>
            <div className="card-body">
              <div className="settings-group">
                <div className="label-row">
                  <label>Prompt Base do Agente</label>
                  <button className="history-btn" onClick={() => setShowHistoryModal(true)}>
                    <IconDoc size={13} /> Ver Histórico
                  </button>
                </div>
                <textarea 
                  className="prompt-textarea"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Defina as regras do agente aqui..."
                />
                <p className="settings-hint">
                  Essas instruções são enviadas no início de cada interação. 
                  Você pode mudar o "tom" do agente ou adicionar regras específicas de rede aqui.
                </p>
              </div>
              <div className="settings-footer">
                <button className="btn btn-secondary" onClick={() => {
                  if(window.confirm("Deseja resetar para o prompt padrão?")) {
                    setSystemPrompt(defaultPrompt);
                  }
                }}>Resetar Padrão</button>
                <button className="btn btn-primary" onClick={handleSavePrompt}>
                  Salvar e Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Prompt History Modal ─── */}
      {showHistoryModal && (
        <div className="settings-overlay history-overlay">
          <div className="settings-modal card history-modal">
            <div className="card-header">
              <div className="card-title">
                <span className="card-title-icon"><IconClock size={16} /></span>
                Histórico de Versões
              </div>
              <button className="close-btn" onClick={() => setShowHistoryModal(false)}>✕</button>
            </div>
            <div className="card-body">
              <div className="history-list">
                <div className="history-item original">
                  <div className="history-item-header">
                    <span className="item-version">v0</span>
                    <span className="item-date">Instalação</span>
                  </div>
                  <div className="history-item-preview">Prompt originário do sistema</div>
                </div>
                {promptHistory.map((entry, idx) => (
                  <div key={idx} className="history-item">
                    <div className="history-item-header">
                      <span className="item-version">v{entry.version}</span>
                      <span className="item-date">{entry.date}</span>
                      <button className="restore-btn" onClick={() => {
                        if(window.confirm(`Restaurar versão v${entry.version}?`)) {
                          setSystemPrompt(entry.prompt);
                          setShowHistoryModal(false);
                        }
                      }}>Restaurar</button>
                    </div>
                    <div className="history-item-preview">
                      {entry.prompt.substring(0, 150)}...
                    </div>
                  </div>
                ))}
                {promptHistory.length === 0 && (
                  <div className="empty-history">Nenhuma alteração realizada ainda.</div>
                )}
              </div>
            </div>
            <div className="settings-footer">
              <button className="btn btn-primary" onClick={() => setShowHistoryModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
