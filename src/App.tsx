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
        // Objeto JSON formatado "human-readable"
        const formatted = formatHumanReadable(parsedResult);
        const lines = formatted.split('\n');
        lines.forEach(line => {
          if (line.trim()) addLog(`[OUTPUT] ${line}`);
        });

        // Atualiza estatísticas se for consulta de topologia
        if (toolName === 'pt_query_topology' && parsedResult) {
          if (parsedResult.devices) {
            setStats(prev => ({ ...prev, devices: parsedResult.devices.length || 0 }));
          }
          if (parsedResult.links) {
            setStats(prev => ({ ...prev, links: parsedResult.links.length || 0 }));
          }
        }
      }
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
    } finally {
      setLoading(false);
    }
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
      // Puxa a chave da OpenAI injetada pelo Vite (lembre de criar o .env)
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
      addLog(`[DEBUG] API Key presente: ${apiKey ? 'Sim (' + apiKey.substring(0,12) + '...)' : 'NÃO'}`);

      // Envia o prompt para a OpenAI resolver
      await processNaturalLanguage(promptBackup, apiKey, addLog);

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
    </div>
  );
}

export default App;
