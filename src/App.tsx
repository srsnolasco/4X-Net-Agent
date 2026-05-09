import { useState, useEffect, useRef } from 'react';
import './App.css';
import { callMcpTool, initSession } from './api';
import { processNaturalLanguage } from './ai';

function App() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Novos estados para o input de comando direto
  const [customDevice, setCustomDevice] = useState('R1');
  const [customCommand, setCustomCommand] = useState('');

  // Estado para o input de texto livre (Linguagem Natural / IA)
  const [naturalPrompt, setNaturalPrompt] = useState('');

  // Stats simulados (poderiam vir do MCP futuramente)
  const [stats, setStats] = useState({
    devices: 0,
    links: 0,
    commands: 0,
  });

  // Lista detalhada de equipamentos
  const [deviceList, setDeviceList] = useState<any[]>([]);
  const [linkList, setLinkList] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'devices' | 'links'>('devices');
  const [maxIterations, setMaxIterations] = useState(() => 
    JSON.parse(localStorage.getItem('pt_max_iterations') || '15')
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>(() => 
    JSON.parse(localStorage.getItem('pt_chat_history') || '[]')
  );
  const [maxMemory, setMaxMemory] = useState(() => 
    JSON.parse(localStorage.getItem('pt_max_memory') || '10')
  );
  const [showMemorySettings, setShowMemorySettings] = useState(false);

  const defaultPrompt = "v3.1 - Você é um Engenheiro de Redes Cisco Senior operando o Packet Tracer de forma automatizada. Você TEM capacidade de criar, conectar, configurar e remover dispositivos.\n\nRegras:\n1. Quando o usuário pedir para CRIAR um dispositivo (roteador, switch, PC, etc), USE pt_add_device IMEDIATAMENTE. Modelos padrão: roteadores='2911', switches='2960-24TT', PCs='PC-PT'. **REGRA CRÍTICA: Sempre que criar um roteador '2911', você DEVE obrigatoriamente incluir na MESMA RESPOSTA a ferramenta pt_add_module para instalar o módulo 'HWIC-2T' no slot '0/0'. NUNCA crie um roteador sem o módulo WAN.**\n2. Quando o usuário pedir apenas para CONECTAR dispositivos que já existem, NÃO crie dispositivos novos — só crie o link.\n3. Se uma chamada de ferramenta falhar por porta inválida ou ocupada, chame pt_query_topology para ver quais portas estão livres antes de tentar novamente.\n4. Se receber o mesmo erro 2 vezes seguidas, PARE e explique o problema ao usuário.\n5. NÃO use pt_auto_layout a menos que o usuário peça EXPLICITAMENTE para organizar o layout.\n6. Você PODE remover dispositivos (pt_delete_device) e links (pt_delete_link). Antes de remover, use pt_query_topology para confirmar os nomes.\n7. SEMPRE execute as ações pedidas. NUNCA recuse um pedido legítimo de criar, conectar ou configurar dispositivos.\n8. **GESTÃO DE BOOT E CONFIGURAÇÃO:** Dispositivos novos podem estar no 'Initial Configuration Dialog'. Se detectar isso no output (pergunta [yes/no]), envie 'no' antes de qualquer outro comando. Para CONFIGURAR interfaces ou roteamento, use SEMPRE `pt_run_cli` ou `pt_run_cli_bulk` com o parâmetro `mode='global'`. Isso garante que o comando seja executado no contexto correto (config terminal).";

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

  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Tenta conectar assim que o app carrega
    const connect = async () => {
      try {
        await initSession();
        setConnected(true);
        addLog('[SUCCESS] Conectado ao servidor MCP (porta 39001)');

        // Verifica o status da ponte com o PT
        await handleCallTool('pt_bridge_status', {}, 'Verificando status da Ponte PT...');
      } catch (err: any) {
        addLog(`[ERROR] Falha ao conectar: ${err.message}`);
      }
    };
    connect();
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

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
    // Migração automática do Prompt (Verifica se a regra de WAN e Boot estão presentes)
    const needsUpdate = !systemPrompt.includes('HWIC-2T') || !systemPrompt.includes('GESTÃO DE BOOT');
    if (needsUpdate) {
      setSystemPrompt(defaultPrompt);
      setPromptVersion(prev => prev + 1);
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setLastPromptUpdate(dateStr);
      addLog('[SYSTEM] Upgrade automático do Prompt para v' + (promptVersion + 1) + ' (Gestão de Boot e Modo Global)');
    }
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg]);
  };

  const handleCallTool = async (toolName: string, args: any = {}, startMsg?: string) => {
    if (startMsg) addLog(`[CMD] ${startMsg}`);
    else addLog(`[CMD] Executando ${toolName}...`);

    setLoading(true);
    setStats(prev => ({ ...prev, commands: prev.commands + 1 }));
    try {
      const result = await callMcpTool(toolName, args);

      // Se for string, tentamos ver se é um JSON disfarçado
      let parsedResult = result;
      if (typeof result === 'string') {
        try {
          parsedResult = JSON.parse(result);
        } catch(e) {
          // não é json, segue como string
        }
      }

      // Função recursiva para transformar JSON em texto humanizado
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
          if (line.trim()) addLog(`[OUTPUT] ${line}`);
        });
      } else {
        // Se for o JSON de topologia, mostramos um resumo amigável no terminal
        if (toolName === 'pt_query_topology') {
          addLog(`[OUTPUT] Topografia capturada com sucesso.`);
          addLog(`[OUTPUT] Dispositivos detectados: ${parsedResult.devices?.length || 0}`);
          addLog(`[OUTPUT] Conexões detectadas: ${parsedResult.links?.length || 0}`);
          addLog(`[OUTPUT] (Dados detalhados disponíveis no painel Mapa de Topologia)`);
        } else {
          // Objeto JSON formatado "human-readable"
          const formatted = formatHumanReadable(parsedResult);
          const lines = formatted.split('\n');
          lines.forEach(line => {
            if (line.trim()) addLog(`[OUTPUT] ${line}`);
          });
        }

        // Atualiza estatísticas e listas se for consulta de topologia
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
      return result; // Importante para o processNaturalLanguage
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
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


  // Funções pré-programadas para os botões
  const btnListDevices = () => handleCallTool('pt_query_topology', {}, 'Consultando equipamentos ativos na topologia');
  const btnAutoLayout = () => handleCallTool('pt_auto_layout', {}, 'Organizando layout visual...');
  const btnClearCanvas = () => {
    if(window.confirm('Tem certeza que deseja APAGAR TUDO no Packet Tracer?')) {
      handleCallTool('pt_clear_canvas', {}, 'Limpando o projeto...');
    }
  };

  const btnExecuteCustom = () => {
    if (!customCommand.trim()) return;
    handleCallTool('pt_run_cli', { device: customDevice, command: "\n" + customCommand + "\n" }, `Enviando comando para ${customDevice}...`);
    setCustomCommand('');
  };

  // Botão de teste direto — chama MCP sem IA para diagnóstico
  const btnTestDirect = () => {
    handleCallTool('pt_add_device', { model: '2911', name: 'TestRouter' }, 'TESTE DIRETO: Criando roteador TestRouter...');
  };

  const btnSendNaturalCommand = async () => {
    if (!naturalPrompt.trim()) return;
    addLog(`[USER] Requerimento: "${naturalPrompt}"`);
    const promptBackup = naturalPrompt;
    setNaturalPrompt('');
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
      
      const updatedHistory = await processNaturalLanguage(promptBackup, apiKey, addLog, maxIterations, historyToPass, systemPrompt);
      setChatHistory(updatedHistory);

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
            <div className="flyout-title">🤖 Menu do Agente</div>
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
              <span className="flyout-item-icon">🧠</span>
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
              <span className="flyout-item-icon">⚙️</span>
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
              <span className="flyout-item-icon">📜</span>
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
              <span className="flyout-item-icon">🧹</span>
              <div className="flyout-item-text">
                <span className="flyout-item-title">Limpar Memória</span>
                <span className="flyout-item-desc">Esquece o contexto da conversa atual</span>
              </div>
            </button>

            <button 
              className="flyout-item danger" 
              onClick={() => {
                // Futura implementação de cancelar tarefa
                addLog("[SYSTEM] Comando de parada enviado (simulado).");
                setShowAgentMenu(false);
              }}
            >
              <span className="flyout-item-icon">🛑</span>
              <div className="flyout-item-text">
                <span className="flyout-item-title">Parar Agente</span>
                <span className="flyout-item-desc">Interrompe a tarefa em execução</span>
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
                <span className="card-title-icon">🧠</span>
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
        <div className="sidebar-logo">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white"/>
            <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active" title="Dashboard">
            <span>📊</span>
            <span className="nav-tooltip">Dashboard</span>
          </button>

          <div className="sidebar-divider" />

          <button className="nav-item" title="Listar Equipamentos" onClick={btnListDevices} disabled={loading || !connected}>
            <span>📋</span>
            <span className="nav-tooltip">Listar Equipamentos</span>
          </button>
          <button className="nav-item" title="Organizar Layout" onClick={btnAutoLayout} disabled={loading || !connected}>
            <span>✨</span>
            <span className="nav-tooltip">Organizar Layout</span>
          </button>
          <button className="nav-item nav-danger" title="Limpar Canvas" onClick={btnClearCanvas} disabled={loading || !connected}>
            <span>⚠️</span>
            <span className="nav-tooltip">Limpar Canvas</span>
          </button>
          <button className="nav-item nav-warning" title="Teste Direto MCP" onClick={btnTestDirect} disabled={loading || !connected}>
            <span>🔧</span>
            <span className="nav-tooltip">Teste Direto MCP</span>
          </button>
          
          <div className="sidebar-divider" />
          
          <button 
            className={`nav-item ${showAgentMenu ? 'active' : ''}`} 
            title="Menu do Agente" 
            onClick={() => setShowAgentMenu(!showAgentMenu)}
          >
            <span>🤖</span>
            <span className="nav-tooltip">Agente</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <div className={`status-indicator ${connected ? 'online' : 'offline'}`} />
          </div>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <div className="main-content">
        {/* ─── Top Header ─── */}
        <header className="top-header">
          <div className="header-left">
            <div>
              <div className="header-title">4X NET AGENT</div>
              <div className="header-subtitle">Cisco Packet Tracer Command Center</div>
            </div>
          </div>
          <div className="header-right">
            <div className="header-badge stat-badge">
              <span className="badge-icon blue">🖥️</span>
              <span className="badge-label">Dispositivos</span>
              <span className="badge-value">{stats.devices}</span>
            </div>
            <div className="header-badge stat-badge">
              <span className="badge-icon orange">🔗</span>
              <span className="badge-label">Links</span>
              <span className="badge-value">{stats.links}</span>
            </div>
            <div className="header-badge stat-badge">
              <span className="badge-icon green">📡</span>
              <span className="badge-label">Status</span>
              <span className="badge-value">{connected ? 'Online' : 'Offline'}</span>
            </div>
            <div className="header-badge stat-badge">
              <span className="badge-icon blue">⚡</span>
              <span className="badge-label">Comandos</span>
              <span className="badge-value">{stats.commands}</span>
            </div>
            <div className="header-badge-divider" />
            <div className="header-badge">
              <div className={`dot ${connected ? 'online' : 'offline'}`} />
              {connected ? 'MCP Conectado' : 'Desconectado'}
            </div>
          </div>
        </header>

        {/* ─── Scrollable Content ─── */}
        <div className="content-area">


          {/* ─── Dashboard Grid ─── */}
          <div className="dashboard-grid">
            {/* ─── AI Assistant Card ─── */}
            <div className="card ai-section">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon">🤖</span>
                  Assistente de Rede — Linguagem Natural
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
                    ✨ Executar Magia
                  </button>
                </div>

              </div>
            </div>

            {/* ─── Direct Command Card ─── */}
            <div className="card direct-command">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon">⌨️</span>
                  Execução Direta de Comandos
                </div>
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

            {/* ─── Topology Map Card ─── */}
            <div className="card topology-section">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon">🌐</span>
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
                </div>
              </div>
              <div className="card-body">
                {viewMode === 'devices' ? (
                  deviceList.length === 0 ? (
                    <div className="empty-state">
                      Nenhum equipamento listado. Clique em "Listar Equipamentos" na barra lateral.
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="topology-table">
                        <thead>
                          <tr>
                            <th>Equipamento</th>
                            <th>Modelo</th>
                            <th>Portas Ocupadas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deviceList.map((dev, idx) => (
                            <tr key={idx}>
                              <td>
                                <span className="device-name">{dev.name}</span>
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
                  )
                ) : (
                  linkList.length === 0 ? (
                    <div className="empty-state">
                      Nenhuma conexão detectada.
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="topology-table">
                        <thead>
                          <tr>
                            <th>Origem</th>
                            <th>Porta</th>
                            <th style={{textAlign: 'center'}}>→</th>
                            <th>Destino</th>
                            <th>Porta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {linkList.map((link, idx) => (
                            <tr key={idx}>
                              <td><span className="device-name">{link.aDevice}</span></td>
                              <td><span className="port-tag">{link.aPort}</span></td>
                              <td style={{textAlign: 'center', opacity: 0.5}}>🔗</td>
                              <td><span className="device-name">{link.bDevice}</span></td>
                              <td><span className="port-tag">{link.bPort}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* ─── Terminal Card ─── */}
            <div className="terminal-section">
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <span className="card-title-icon">🖥️</span>
                    Terminal Output
                    {loading && <div className="loader" />}
                  </div>
                  <div className="card-actions">
                    <button className="clear-btn" onClick={() => setLogs([])}>
                      🧹 Limpar
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="terminal" ref={terminalRef}>
                    {logs.length === 0 && (
                      <div className="terminal-line" style={{ opacity: 0.3 }}>
                        <span className="terminal-prefix">❯</span>
                        <span className="terminal-text">Aguardando comandos...</span>
                      </div>
                    )}
                    {logs.map((log, idx) => (
                      <div key={idx} className="terminal-line">
                        <span className="terminal-prefix">❯</span>
                        <span className={`terminal-text ${getLogClass(log)}`}>
                          {log}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Settings Modal ─── */}
      {showSettings && (
        <div className="settings-overlay">
          <div className="settings-modal card">
            <div className="card-header">
              <div className="card-title">
                <span className="card-title-icon">⚙️</span>
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

      {/* ─── Memory Settings Modal ─── */}
      {showMemorySettings && (
        <div className="settings-overlay">
          <div className="settings-modal card">
            <div className="card-header">
              <div className="card-title">
                <span className="card-title-icon">🧠</span>
                Configurações de Memória
              </div>
              <button className="close-btn" onClick={() => setShowMemorySettings(false)}>✕</button>
            </div>
            <div className="card-body">
              <div className="settings-group">
                <label>Tamanho da Janela de Contexto (Mensagens)</label>
                <div className="range-wrapper">
                  <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    value={maxMemory} 
                    onChange={(e) => setMaxMemory(parseInt(e.target.value))}
                  />
                  <span className="range-value">{maxMemory} mensagens</span>
                </div>
                <p className="settings-hint">
                  Define quantas interações passadas são enviadas para a IA. 
                  Valores maiores permitem lembrar de conversas longas, mas consomem mais tokens.
                </p>
              </div>
              <div className="settings-footer">
                <button className="btn btn-primary" onClick={() => setShowMemorySettings(false)}>
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
                  <span className="card-title-icon">📜</span>
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
                    📜 Ver Histórico
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
                <span className="card-title-icon">🕒</span>
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
