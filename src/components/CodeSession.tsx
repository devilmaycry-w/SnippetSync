import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, X, MessageCircle } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

interface CodeSessionProps {
  sessionId: string;
  onForkSession: (sessionId: string) => void;
  onBackToLanding: () => void;
}

interface AISuggestion {
  id: string;
  title: string;
  description: string;
}

const CodeSession: React.FC<CodeSessionProps> = ({
  sessionId,
  onForkSession,
  onBackToLanding,
}) => {
  const [code, setCode] = useState('');
  const [terminalOutput, setTerminalOutput] = useState('');
  const { isConnected, connectedUsers, sendMessage, lastMessage } = useWebSocket(sessionId);
  const [suggestions] = useState<AISuggestion[]>([
    { id: '1', title: 'Improve code readability', description: 'Suggestion 1' },
    { id: '2', title: 'Optimize function performance', description: 'Suggestion 2' },
    { id: '3', title: 'Add error handling', description: 'Suggestion 3' },
  ]);
  const [language, setLanguage] = useState('python'); // Default language
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [judge0Count, setJudge0Count] = useState(0);
  const [toast, setToast] = useState('');
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  // Helper to get and set daily API call count
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const stored = localStorage.getItem('judge0_count');
    const storedDate = localStorage.getItem('judge0_date');
    if (storedDate !== today) {
      localStorage.setItem('judge0_count', '0');
      localStorage.setItem('judge0_date', today);
      setJudge0Count(0);
    } else if (stored) {
      setJudge0Count(Number(stored));
    }
  }, []);

  const updateJudge0Count = (count: number) => {
    setJudge0Count(count);
    localStorage.setItem('judge0_count', String(count));
  };

  // Get persistent userId for this session
  function getOrCreateUserId(sessionId: string) {
    const key = `snippet_userid_${sessionId}`;
    let userId = localStorage.getItem(key);
    if (!userId) {
      userId = Math.random().toString(36).substring(2, 10);
      localStorage.setItem(key, userId);
    }
    return userId;
  }
  const myUserId = getOrCreateUserId(sessionId);

  // Handle incoming WebSocket messages
  React.useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'code_update':
        if (lastMessage.code !== code) {
          setCode(lastMessage.code);
          // Restore cursor if update is from this user
          if (lastMessage.userId === myUserId && textareaRef.current && typeof lastMessage.cursor === 'number') {
            setTimeout(() => {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = lastMessage.cursor;
            }, 0);
          }
        }
        break;
      case 'execution_result':
        setTerminalOutput(lastMessage.output);
        break;
      case 'joined_session':
        if (lastMessage.currentCode) {
          setCode(lastMessage.currentCode);
        }
        break;
      default:
        break;
    }
  }, [lastMessage, code, myUserId]);

  // Send code changes to other users
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    const cursorPos = textareaRef.current ? textareaRef.current.selectionStart : 0;
    sendMessage({
      type: 'code_change',
      code: newCode,
      cursor: cursorPos,
      userId: myUserId
    });
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(sessionId);
    setShowWhatsApp(true);
    setToast('Session ID copied!');
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Join my SnippetSync session: https://snippxt-sync.netlify.app . Your session id is : ${sessionId}, Join now! lets commit more.`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleForkSession = () => {
    onForkSession(sessionId);
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      setToast('Please enter some code to run.');
      return;
    }
    if (judge0Count >= 5) {
      setToast('Daily Judge0 code execution limit reached. Fork session to use AI.');
      return;
    }
    setTerminalOutput('Running...');
    try {
      // TODO: Judge0 API key and host are now loaded from environment variables (see .env)
      const JUDGE0_KEY = import.meta.env.VITE_JUDGE0_KEY;
      const JUDGE0_HOST = import.meta.env.VITE_JUDGE0_HOST;
      const response = await fetch(`https://${JUDGE0_HOST}/submissions?base64_encoded=false&wait=true`, {
        method: 'POST',
        headers: {
          'X-RapidAPI-Key': JUDGE0_KEY,
          'X-RapidAPI-Host': JUDGE0_HOST,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_code: code,
          language_id: getLanguageId(language),
        }),
      });
      const data = await response.json();
      let output = '';
      if (data.stderr) output = data.stderr;
      else if (data.compile_output) output = data.compile_output;
      else output = data.stdout || 'No output.';
      setTerminalOutput(output);
      sendMessage({
        type: 'execution_result',
        output,
      });
      updateJudge0Count(judge0Count + 1);
      setToast(`${4 - judge0Count} daily code executions left`);
    } catch (err) {
      setTerminalOutput('Error executing code.');
    }
  };

  // Helper to map language to Judge0 language_id
  function getLanguageId(lang: string) {
    const map: Record<string, number> = {
      python: 71, // Python 3.8.1
      javascript: 63, // Node.js 12.14.0
      cpp: 54, // C++ (GCC 9.2.0)
      c: 50, // C (GCC 9.2.0)
      java: 62, // Java (OpenJDK 13.0.1)
      typescript: 74, // TypeScript (3.7.4)
      ruby: 72, // Ruby (2.7.0)
      go: 60, // Go (1.13.5)
      php: 68, // PHP (7.4.1)
      // Add more as needed
    };
    return map[lang] || 71;
  }

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
  }, [code, language]);

  const handleApplySuggestion = (suggestionId: string) => {
    setToast('To use AI features, please fork the session.');
  };

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    // If loaded directly (not via app navigation), show intro
    // Heuristic: if there's no navigation state or referrer is not this site
    if (document.referrer === '' || !document.referrer.includes(window.location.hostname)) {
      setShowIntro(true);
    }
  }, []);

  if (showIntro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#111418] px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#6a5af9] mb-4 break-words">Session ID: {sessionId}</h2>
        <p className="text-lg text-center text-white mb-6 max-w-xl">
          Copy this unique session id to collaborate with your team member. Lets Commit!!
        </p>
        <button
          onClick={() => setShowIntro(false)}
          className="px-6 py-3 rounded-xl bg-[#0a65c1] text-white text-base font-bold hover:bg-[#0952a1] transition-colors"
        >
          Join Session
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen justify-between" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center bg-[#111418] p-4 pb-2 justify-between sticky top-0 z-10">
          <h2 className="hidden" />
        </div>
        
        <div className="max-w-6xl mx-auto px-4 space-y-4">
          <h2 className="text-white tracking-light text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-center pb-3 pt-5">
            Your Digital WhiteBoard for next 24 hrs
          </h2>
          <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-2 pt-4">
            Session ID: {sessionId}
            <span className="ml-4 text-[#0a65c1] text-sm font-normal">{5 - judge0Count} daily code executions left</span>
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={handleCopyUrl}
              className="flex w-full sm:w-auto min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#283039] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#3a4551] transition-colors"
            >
              <span className="truncate">Copy URL</span>
            </button>
            {showWhatsApp && (
              <button
                onClick={handleWhatsAppShare}
                className="flex w-full sm:w-auto items-center justify-center rounded-xl h-10 px-3 bg-[#25D366] text-white text-sm font-bold hover:bg-[#1ebe57] transition-colors"
                title="Share on WhatsApp"
              >
                <MessageCircle size={20} className="mr-1" /> WhatsApp
              </button>
            )}
            <button
              onClick={handleForkSession}
              className="flex w-full sm:w-auto min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#0a65c1] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#0952a1] transition-colors"
            >
              <span className="truncate">Fork Session</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <div className="flex flex-col h-full space-y-4">
              <div className="flex-1 flex flex-col">
                <p className="text-white text-base font-medium leading-normal pb-2">Code Editor</p>
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
                  style={{height: '100%', minHeight: '24rem'}}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleRunCode}
                  className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#0a65c1] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#0952a1] transition-colors"
                >
                  <span className="truncate">Run</span>
                </button>
              </div>
            </div>
            <div className="flex flex-col h-full space-y-4">
              <div className="flex-1 flex flex-col">
                <p className="text-white text-base font-medium leading-normal pb-2">Terminal</p>
                <textarea
                  value={terminalOutput}
                  readOnly
                  className="w-full flex-1 resize-y overflow-auto rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#283039] focus:border-none min-h-64 sm:min-h-80 lg:min-h-96 max-h-[32rem] placeholder:text-[#9cabba] p-4 text-base font-normal leading-normal font-mono"
                  placeholder="Output will appear here..."
                  style={{height: '100%', minHeight: '24rem'}}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] pt-4">
              AI Suggestions
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="flex items-center gap-4 bg-[#283039] rounded-xl p-4 justify-between">
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <p className="text-white text-base font-medium leading-normal line-clamp-1">
                      {suggestion.title}
                    </p>
                    <p className="text-[#9cabba] text-sm font-normal leading-normal line-clamp-2">
                      {suggestion.description}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <button
                      onClick={() => handleApplySuggestion(suggestion.id)}
                      className="flex min-w-[60px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-3 bg-[#0a65c1] text-white text-sm font-medium leading-normal hover:bg-[#0952a1] transition-colors"
                    >
                      <span className="truncate">Apply</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-[#111418] border-t border-[#283039]">
        <p className="text-[#9cabba] text-sm font-normal leading-normal py-3 px-4 text-center">
          Session auto-expires in 24 hours | {connectedUsers} user{connectedUsers !== 1 ? 's' : ''} connected
          {!isConnected && ' | Disconnected'}
        </p>
      </div>
      {toast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#0a65c1] text-white px-4 py-2 rounded shadow-lg z-50">
          {toast}
        </div>
      )}
      {showSidebar && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1" onClick={() => setShowSidebar(false)} style={{ background: 'rgba(0,0,0,0.3)' }} />
          <div className="w-full max-w-md bg-[#181c23] h-full shadow-xl p-6 overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-bold">About SnippetSync</h3>
              <button onClick={() => setShowSidebar(false)} className="text-white hover:text-[#0a65c1]">
                <X size={28} />
              </button>
            </div>
            <div className="text-[#9cabba] text-base space-y-4">
              <div>
                <b>What is SnippetSync?</b>
                <p>SnippetSync lets you collaborate on code in real-time. Share your session URL, code together, and see live results instantly.</p>
              </div>
              <div>
                <b>How to use:</b>
                <ul className="list-disc pl-5">
                  <li>Start a new session or join an existing one with a session URL.</li>
                  <li>Type code in the editor. All changes sync instantly for everyone in the session.</li>
                  <li>Click <b>Run</b> to execute code (limited daily runs).</li>
                  <li>Fork the session to use AI features and advanced code suggestions.</li>
                  <li>Share your session with the <b>Copy URL</b> and <b>WhatsApp</b> buttons.</li>
                  <li>Session auto-expires in 24 hours.</li>
                </ul>
              </div>
              <div>
                <b>Tips:</b>
                <ul className="list-disc pl-5">
                  <li>Use <b>Ctrl+Enter</b> to run code quickly.</li>
                  <li>Forked sessions are private and AI-powered.</li>
                  <li>So it’s better to note down any unique session of your choice instead of making new ones every time.</li>
                </ul>
              </div>
              <div>
                <b>Need help?</b>
                <p>Contact the developer or check the project README for more info.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeSession;