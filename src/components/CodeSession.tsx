import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Copy, 
  Share2, 
  Users, 
  Settings, 
  GitBranch, 
  MessageSquare,
  Sparkles,
  Terminal,
  Code2,
  Zap,
  ChevronDown,
  X,
  ArrowLeft
} from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

interface CodeSessionProps {
  sessionId: string;
  onForkSession: (sessionId: string) => void;
  onBackToLanding: () => void;
  skipIntro?: boolean;
}

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  type: 'performance' | 'readability' | 'security' | 'best-practice';
}

const CodeSession: React.FC<CodeSessionProps> = ({
  sessionId,
  onForkSession,
  onBackToLanding,
  skipIntro = false,
}) => {
  const [code, setCode] = useState('# Welcome to SnippetSync!\n# Start coding here...\n\ndef hello_world():\n    print("Hello, World!")\n    return "Ready to code together!"\n\nhello_world()');
  const [terminalOutput, setTerminalOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const { isConnected, connectedUsers, sendMessage, lastMessage } = useWebSocket(sessionId);
  const [activeTab, setActiveTab] = useState<'editor' | 'terminal' | 'suggestions'>('editor');
  const [language, setLanguage] = useState('python');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [judge0Count, setJudge0Count] = useState(0);
  const [toast, setToast] = useState('');
  const [showIntro, setShowIntro] = useState(false);

  const suggestions: AISuggestion[] = [
    { 
      id: '1', 
      title: 'Add Error Handling', 
      description: 'Wrap your code in try-catch blocks for better reliability',
      type: 'best-practice'
    },
    { 
      id: '2', 
      title: 'Optimize Performance', 
      description: 'Consider using list comprehensions for better performance',
      type: 'performance'
    },
    { 
      id: '3', 
      title: 'Improve Readability', 
      description: 'Add type hints and docstrings to your functions',
      type: 'readability'
    },
    { 
      id: '4', 
      title: 'Security Check', 
      description: 'Validate input parameters to prevent security issues',
      type: 'security'
    },
  ];

  const languages = [
    { id: 'python', name: 'Python', icon: '🐍' },
    { id: 'javascript', name: 'JavaScript', icon: '🟨' },
    { id: 'typescript', name: 'TypeScript', icon: '🔷' },
    { id: 'cpp', name: 'C++', icon: '⚡' },
    { id: 'java', name: 'Java', icon: '☕' },
    { id: 'go', name: 'Go', icon: '🐹' },
    { id: 'rust', name: 'Rust', icon: '🦀' },
    { id: 'php', name: 'PHP', icon: '🐘' },
  ];

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
          if (lastMessage.userId === myUserId && textareaRef.current && typeof lastMessage.cursor === 'number') {
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = lastMessage.cursor;
              }
            }, 0);
          }
        }
        break;
      case 'execution_result':
        setTerminalOutput(lastMessage.output);
        setIsRunning(false);
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

  const handleCopySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    setToast('Session ID copied to clipboard!');
  };

  const handleShareSession = () => {
    const text = `Join my SnippetSync session: ${sessionId}`;
    if (navigator.share) {
      navigator.share({ title: 'SnippetSync Session', text });
    } else {
      navigator.clipboard.writeText(text);
      setToast('Session details copied to clipboard!');
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      setToast('Please enter some code to run.');
      return;
    }
    if (judge0Count >= 5) {
      setToast('Daily execution limit reached. Fork session for unlimited AI features.');
      return;
    }

    setIsRunning(true);
    setActiveTab('terminal');
    setTerminalOutput('Executing code...');

    try {
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
      if (data.stderr) output = `Error: ${data.stderr}`;
      else if (data.compile_output) output = `Compile Error: ${data.compile_output}`;
      else output = data.stdout || 'No output generated.';
      
      setTerminalOutput(output);
      sendMessage({
        type: 'execution_result',
        output,
      });
      
      updateJudge0Count(judge0Count + 1);
      setToast(`${4 - judge0Count} executions remaining today`);
    } catch (err) {
      setTerminalOutput('Error: Failed to execute code. Please try again.');
    } finally {
      setIsRunning(false);
    }
  };

  // Helper to map language to Judge0 language_id
  function getLanguageId(lang: string) {
    const map: Record<string, number> = {
      python: 71,
      javascript: 63,
      cpp: 54,
      c: 50,
      java: 62,
      typescript: 74,
      ruby: 72,
      go: 60,
      php: 68,
      rust: 73,
    };
    return map[lang] || 71;
  }

  const handleApplySuggestion = (suggestionId: string) => {
    setToast('Fork this session to unlock AI-powered suggestions and unlimited features!');
  };

  const getSuggestionIcon = (type: AISuggestion['type']) => {
    switch (type) {
      case 'performance': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'security': return <Settings className="w-4 h-4 text-red-400" />;
      case 'readability': return <Code2 className="w-4 h-4 text-blue-400" />;
      default: return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleCopySessionId();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [code, language]);

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    if ((document.referrer === '' || !document.referrer.includes(window.location.hostname)) && !skipIntro) {
      setShowIntro(true);
    }
  }, [skipIntro]);

  if (showIntro && !skipIntro) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center px-8">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto premium-shadow-lg">
            <Code2 className="w-10 h-10 text-white" />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white">
              Session Ready!
            </h2>
            <div className="space-y-2">
              <p className="text-lg gradient-text font-semibold">
                ID: {sessionId}
              </p>
              <p className="text-gray-300">
                Share this ID with your team to start collaborating
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowIntro(false)}
            className="premium-button w-full flex items-center justify-center space-x-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Enter Session</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBackToLanding}
                className="premium-button-secondary p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <Code2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">SnippetSync</h1>
                  <p className="text-xs text-gray-400">Session: {sessionId}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-800/50">
                <div className={`status-indicator ${isConnected ? 'status-connected' : 'status-disconnected'}`} />
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">{connectedUsers}</span>
              </div>

              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="premium-button-secondary flex items-center space-x-2"
                >
                  <span>{languages.find(l => l.id === language)?.icon}</span>
                  <span>{languages.find(l => l.id === language)?.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showLanguageDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-48 glass-effect rounded-xl border border-gray-700/50 premium-shadow-lg z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => {
                          setLanguage(lang.id);
                          setShowLanguageDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center space-x-3 first:rounded-t-xl last:rounded-b-xl smooth-transition"
                      >
                        <span>{lang.icon}</span>
                        <span className="text-white">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopySessionId}
                  className="premium-button-secondary p-2"
                  title="Copy Session ID (Ctrl+S)"
                >
                  <Copy className="w-4 h-4" />
                </button>
                
                <button
                  onClick={handleShareSession}
                  className="premium-button-secondary p-2"
                  title="Share Session"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => onForkSession(sessionId)}
                  className="premium-button flex items-center space-x-2"
                >
                  <GitBranch className="w-4 h-4" />
                  <span>Fork</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Panel - Code Editor */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b border-gray-800/50 bg-gray-900/50">
            <div className="flex items-center px-8">
              <button
                onClick={() => setActiveTab('editor')}
                className={`tab-button ${activeTab === 'editor' ? 'active' : ''}`}
              >
                <Code2 className="w-4 h-4 mr-2" />
                Editor
              </button>
              <button
                onClick={() => setActiveTab('terminal')}
                className={`tab-button ${activeTab === 'terminal' ? 'active' : ''}`}
              >
                <Terminal className="w-4 h-4 mr-2" />
                Terminal
              </button>
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`tab-button ${activeTab === 'suggestions' ? 'active' : ''}`}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Suggestions
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8">
            {activeTab === 'editor' && (
              <div className="h-full flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Code Editor</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">
                      {5 - judge0Count} executions left today
                    </span>
                    <button
                      onClick={handleRunCode}
                      disabled={isRunning || judge0Count >= 5}
                      className="premium-button flex items-center space-x-2"
                      title="Run Code (Ctrl+Enter)"
                    >
                      {isRunning ? (
                        <div className="loading-spinner" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      <span>Run</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 glass-effect rounded-xl border border-gray-700/50 overflow-hidden">
                  <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    className="w-full h-full resize-none bg-transparent text-white placeholder-gray-400 p-6 code-editor focus:outline-none"
                    placeholder="Start typing your code here..."
                    spellCheck={false}
                  />
                </div>
              </div>
            )}

            {activeTab === 'terminal' && (
              <div className="h-full flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Terminal Output</h3>
                  <button
                    onClick={() => setTerminalOutput('')}
                    className="premium-button-secondary text-sm px-3 py-1"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="flex-1 terminal-output rounded-xl p-6 overflow-auto">
                  <pre className="whitespace-pre-wrap text-sm">
                    {terminalOutput || 'No output yet. Run your code to see results here.'}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'suggestions' && (
              <div className="h-full flex flex-col space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">AI Suggestions</h3>
                  <div className="text-sm text-gray-400">
                    Fork session to unlock AI features
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestions.map((suggestion) => (
                    <div key={suggestion.id} className="ai-suggestion-card">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getSuggestionIcon(suggestion.type)}
                          <h4 className="font-medium text-white">{suggestion.title}</h4>
                        </div>
                        <button
                          onClick={() => handleApplySuggestion(suggestion.id)}
                          className="premium-button-secondary text-xs px-3 py-1"
                        >
                          Apply
                        </button>
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {suggestion.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}

      {/* Click outside handler for dropdown */}
      {showLanguageDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowLanguageDropdown(false)}
        />
      )}
    </div>
  );
};

export default CodeSession;