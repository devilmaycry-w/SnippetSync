import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, LogOut, Play, Wand2, Copy } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

interface ForkedSessionProps {
  sessionId: string;
  forkedFromId: string;
  onBackToLanding: () => void;
  onBackToCodeSession: (sessionId: string) => void;
}

const ForkedSession: React.FC<ForkedSessionProps> = ({
  sessionId,
  forkedFromId,
  onBackToLanding,
  onBackToCodeSession,
}) => {
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState<'code' | 'chat'>('code');
  const [language, setLanguage] = useState('python');
  const [terminalOutput, setTerminalOutput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [aiCount, setAiCount] = useState(0);
  const [toast, setToast] = useState('');
  const { isConnected, connectedUsers, sendMessage, lastMessage } = useWebSocket(sessionId);

  // Handle incoming WebSocket messages
  React.useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'code_update':
        if (lastMessage.code !== code) {
          setCode(lastMessage.code);
        }
        break;
      case 'joined_session':
        if (lastMessage.currentCode) {
          setCode(lastMessage.currentCode);
        }
        break;
      default:
        break;
    }
  }, [lastMessage, code]);

  // Send code changes to other users
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    sendMessage({
      type: 'code_change',
      code: newCode
    });
  };

  const handleShare = () => {
    const url = `${window.location.origin}/session/${sessionId}`;
    navigator.clipboard.writeText(url);
    // You could add a toast notification here
  };

  // Helper to get and set daily AI call count
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const stored = localStorage.getItem('ai_count');
    const storedDate = localStorage.getItem('ai_date');
    if (storedDate !== today) {
      localStorage.setItem('ai_count', '0');
      localStorage.setItem('ai_date', today);
      setAiCount(0);
    } else if (stored) {
      setAiCount(Number(stored));
    }
  }, []);

  const updateAiCount = (count: number) => {
    setAiCount(count);
    localStorage.setItem('ai_count', String(count));
  };

  // AI API call helper
  const callAI = async (prompt: string) => {
    try {
      // TODO: AI API key is now loaded from environment variables (see .env)
      const AI_KEY = import.meta.env.VITE_AI_KEY;
      const response = await fetch('https://api.chatanywhere.tech/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'user', content: prompt }
          ]
        }),
      });
      const data = await response.json();
      const output = data.choices?.[0]?.message?.content || 'No output.';
      updateAiCount(aiCount + 1);
      setToast(`${29 - aiCount} daily AI executions left`);
      return output;
    } catch (err) {
      setToast('Error with AI API.');
      return '';
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      setToast('Please enter some code to run.');
      return;
    }
    if (aiCount >= 30) {
      setToast('Daily AI code execution limit reached.');
      return;
    }
    setTerminalOutput('Running...');
    const output = await callAI(`Execute this ${language} code and show the output only:\n${code}`);
    setTerminalOutput(output);
  };

  const handleAISuggestion = async () => {
    if (!code.trim()) {
      setToast('Please enter some code to improve.');
      return;
    }
    if (aiCount >= 30) {
      setToast('Daily AI code execution limit reached.');
      return;
    }
    const improved = await callAI(`Improve and format this ${language} code, make it more advanced, and return only the improved code:\n${code}`);
    if (improved) setCode(improved);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setToast('Code copied to clipboard!');
  };

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Keyboard shortcut for Ctrl+Enter
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [code, language, aiCount]);

  // Listen for execution_result from WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'execution_result') {
      setTerminalOutput(lastMessage.output);
    }
  }, [lastMessage]);

  const ActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }> = ({ icon, label, onClick, disabled }) => (
    <div className="flex flex-col items-center gap-2 bg-[#111418] py-2.5 text-center">
      <button
        onClick={onClick}
        className="rounded-full bg-[#283039] p-2.5 hover:bg-[#3a4551] transition-colors"
        disabled={disabled}
      >
        <div className="text-white">{icon}</div>
      </button>
      <p className="text-white text-sm font-medium leading-normal">{label}</p>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen justify-between" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center bg-[#111418] p-4 pb-2 justify-between sticky top-0 z-10">
          <button
            onClick={() => onBackToCodeSession(forkedFromId)}
            className="text-white flex size-12 shrink-0 items-center cursor-pointer hover:bg-[#283039] rounded-xl transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex w-12 items-center justify-end">
            <button
              onClick={onBackToLanding}
              className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 bg-transparent text-white gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0 hover:bg-[#283039] transition-colors"
              title="Logout"
            >
              <LogOut size={24} />
            </button>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-[#9cabba] text-sm font-normal leading-normal pb-3 pt-1 text-center">
            Forked from {forkedFromId}
          </p>
          
          <div className="pb-3">
            <div className="flex border-b border-[#3b4754] gap-4 sm:gap-8 justify-center sm:justify-start">
              <button
                onClick={() => setActiveTab('code')}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 px-4 ${
                  activeTab === 'code'
                    ? 'border-b-white text-white'
                    : 'border-b-transparent text-[#9cabba]'
                }`}
              >
                <p className="text-sm font-bold leading-normal tracking-[0.015em]">Code</p>
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 px-4 ${
                  activeTab === 'chat'
                    ? 'border-b-white text-white'
                    : 'border-b-transparent text-[#9cabba]'
                }`}
              >
                <p className="text-sm font-bold leading-normal tracking-[0.015em]">Chat</p>
              </button>
            </div>
          </div>
          
          <div className="py-3">
            {activeTab === 'code' ? (
              <div className="max-w-full">
                <div className="flex gap-2 pb-2">
                  <label className="text-[#9cabba] text-sm">Language:</label>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="bg-[#283039] text-white rounded px-2 py-1 text-sm"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                    <option value="java">Java</option>
                    <option value="typescript">TypeScript</option>
                    <option value="ruby">Ruby</option>
                    <option value="go">Go</option>
                    <option value="php">PHP</option>
                  </select>
                </div>
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="w-full flex-1 resize-y overflow-auto rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#283039] focus:border-none min-h-64 sm:min-h-80 lg:min-h-96 max-h-[32rem] placeholder:text-[#9cabba] p-4 text-base font-normal leading-normal font-mono"
                  placeholder="Start typing your code here..."
                />
                <div className="mt-4">
                  <p className="text-white text-base font-medium leading-normal pb-2">Terminal</p>
                  <textarea
                    value={terminalOutput}
                    readOnly
                    className="w-full flex-1 resize-y overflow-auto rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#283039] focus:border-none min-h-32 sm:min-h-40 lg:min-h-48 max-h-[32rem] placeholder:text-[#9cabba] p-4 text-base font-normal leading-normal font-mono"
                    placeholder="Output will appear here..."
                  />
                </div>
              </div>
            ) : (
              <div className="max-w-full">
                <div className="rounded-xl bg-[#283039] p-4 text-white text-base font-normal leading-normal min-h-64 sm:min-h-80 lg:min-h-96">
                  <p className="text-[#9cabba]">Chat functionality coming soon...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-[#111418] border-t border-[#283039]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-2 px-4 py-4">
            <ActionButton
              icon={<Play size={20} />}
              label="Run"
              onClick={handleRunCode}
              disabled={aiCount >= 30}
            />
            <ActionButton
              icon={<Wand2 size={20} />}
              label="AI"
              onClick={handleAISuggestion}
              disabled={aiCount >= 30}
            />
            <ActionButton
              icon={<Copy size={20} />}
              label="Copy"
              onClick={handleCopyCode}
            />
          </div>
        </div>
      </div>
      
      {!isConnected && (
        <div className="bg-red-600 text-white text-center py-2 text-sm">
          Disconnected from server - attempting to reconnect...
        </div>
      )}
      {toast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#0a65c1] text-white px-4 py-2 rounded shadow-lg z-50">
          {toast}
        </div>
      )}
      {/* TODO: If you deploy this project to a new domain (e.g., Netlify), update the WebSocket URL and WhatsApp sharing URL accordingly. */}
    </div>
  );
};

export default ForkedSession;