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

  const btnSendNaturalCommand = async () => {
    if (!naturalPrompt.trim()) return;
    addLog(`[USER] Requerimento: "${naturalPrompt}"`);
    const promptBackup = naturalPrompt;
    setNaturalPrompt('');
    setLoading(true);

    try {
      // Puxa a chave da OpenAI injetada pelo Vite (lembre de criar o .env)
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
      
      // Envia o prompt para a OpenAI resolver
      await processNaturalLanguage(promptBackup, apiKey, addLog);
      
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <header>
        <h1>4X NET AGENT</h1>
        <div className={`status-badge`}>
          <div className={`status-dot ${connected ? '' : 'offline'}`}></div>
          {connected ? 'MCP CONECTADO' : 'DESCONECTADO'}
        </div>
      </header>

      <section className="panel quick-ops-panel">
        <div className="button-group">
          <button onClick={btnListDevices} disabled={loading || !connected}>
            <span>📋 Listar Equipamentos</span>
          </button>
          <button onClick={btnAutoLayout} disabled={loading || !connected}>
            <span>✨ Organizar Layout</span>
          </button>
          <button className="danger" onClick={btnClearCanvas} disabled={loading || !connected}>
            <span>⚠️ Limpar Canvas (Nuke)</span>
          </button>
        </div>
      </section>

      <section className="natural-input-section panel">
        <h2>Assistente de Rede (Linguagem Natural)</h2>
        <div className="natural-input-box">
          <input 
            type="text" 
            value={naturalPrompt} 
            onChange={(e) => setNaturalPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && btnSendNaturalCommand()}
            placeholder="Digite livremente a mudança que deseja. Ex: 'Adicione um Switch SW4 e ligue no R1'"
            className="natural-input"
          />
          <button className="primary-btn" onClick={btnSendNaturalCommand} disabled={loading || !naturalPrompt.trim()}>
            <span>✨ EXECUTAR MAGIA</span>
          </button>
        </div>
      </section>

      <main className="grid">
        <section className="panel">
          <h2>Execução Direta</h2>
          <div className="custom-command-box">
            <div className="input-group">
              <label>Alvo:</label>
              <input 
                type="text" 
                value={customDevice} 
                onChange={(e) => setCustomDevice(e.target.value)} 
                placeholder="Ex: R1, SW1..."
                className="device-input"
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Comando / Ação:</label>
              <input 
                type="text" 
                value={customCommand} 
                onChange={(e) => setCustomCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && btnExecuteCustom()}
                placeholder="Ex: show ip int brief"
                className="command-input"
              />
            </div>
            <button onClick={btnExecuteCustom} disabled={loading || !connected || !customCommand.trim()}>
              <span>ENVIAR</span>
            </button>
          </div>
        </section>

        <section className="panel terminal-panel">
          <h2 style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
            <span>Terminal Output {loading && <div className="loader"></div>}</span>
            <button 
              onClick={() => setLogs([])} 
              style={{ 
                position: 'absolute', 
                left: '50%', 
                transform: 'translateX(-50%)',
                fontSize: '0.7rem',
                padding: '0.2rem 0.6rem',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)'
              }}
              title="Limpar o terminal"
            >
              🧹 Clear Screen
            </button>
          </h2>
          <div className="terminal" ref={terminalRef}>
            {logs.map((log, idx) => (
              <div key={idx} className="terminal-line">
                <span className="terminal-prefix">{'>'}</span> 
                <span style={{color: log.includes('[ERROR]') ? 'var(--danger)' : log.includes('[SUCCESS]') ? 'var(--accent)' : 'inherit'}}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
