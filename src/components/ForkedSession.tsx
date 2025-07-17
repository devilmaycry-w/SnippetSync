import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Copy, 
  Sparkles, 
  MessageSquare, 
  Code2, 
  Terminal,
  Zap,
  Settings,
  Users,
  ChevronDown,
  Send,
  Bot
} from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

interface ForkedSessionProps {
  sessionId: string;
  forkedFromId: string;
  onBackToLanding: () => void;
  onBackToCodeSession: (sessionId: string) => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const ForkedSession: React.FC<ForkedSessionProps> = ({
  sessionId,
  forkedFromId,
  onBackToLanding,
  onBackToCodeSession,
}) => {
  const [code, setCode] = useState('# Forked Session - AI Enhanced\n# This is your private workspace with unlimited AI features\n\ndef fibonacci(n):\n    """Calculate fibonacci number with memoization"""\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\n# Try the AI suggestions below!');
  const [activeTab, setActiveTab] = useState<'code' | 'terminal' | 'chat'>('code');
  const [language, setLanguage] = useState('python');
  const [terminalOutput, setTerminalOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [aiCount, setAiCount] = useState(0);
  const [toast, setToast] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Welcome to your forked session! I can help you improve your code, explain concepts, and provide suggestions. What would you like to work on?',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const { isConnected, connectedUsers, sendMessage, lastMessage } = useWebSocket(sessionId);

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
    if (aiCount >= 30) {
      setToast('Daily AI limit reached (30/30)');
      return '';
    }

    try {
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
      const output = data.choices?.[0]?.message?.content || 'No response from AI.';
      updateAiCount(aiCount + 1);
      setToast(`AI calls remaining: ${29 - aiCount}/30`);
      return output;
    } catch (err) {
      setToast('AI service temporarily unavailable');
      return 'Sorry, I encountered an error. Please try again.';
    }
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      setToast('Please enter some code to run.');
      return;
    }

    setIsRunning(true);
    setActiveTab('terminal');
    setTerminalOutput('Executing with AI enhancement...');

    const output = await callAI(`Execute this ${language} code and show only the output:\n\n${code}`);
    setTerminalOutput(output);
    setIsRunning(false);
  };

  const handleAISuggestion = async () => {
    if (!code.trim()) {
      setToast('Please enter some code to improve.');
      return;
    }

    setIsRunning(true);
    const improved = await callAI(`Improve this ${language} code by making it more efficient, readable, and following best practices. Return only the improved code:\n\n${code}`);
    if (improved && improved !== 'Sorry, I encountered an error. Please try again.') {
      setCode(improved);
      sendMessage({
        type: 'code_change',
        code: improved
      });
    }
    setIsRunning(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setToast('Code copied to clipboard!');
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsAiTyping(true);

    const aiResponse = await callAI(`You are a helpful coding assistant. The user is working on this ${language} code:\n\n${code}\n\nUser question: ${chatInput}\n\nProvide a helpful response about their code or question.`);

    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: aiResponse,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, aiMessage]);
    setIsAiTyping(false);
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
        handleCopyCode();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [code, language, aiCount]);

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onBackToCodeSession(forkedFromId)}
                className="premium-button-secondary p-2"
                title="Back to Original Session"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">AI-Enhanced Fork</h1>
                  <p className="text-xs text-gray-400">Forked from: {forkedFromId}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* AI Usage Counter */}
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-purple-900/30 border border-purple-500/20">
                <Bot className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300">{30 - aiCount}/30 AI calls</span>
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

              <button
                onClick={onBackToLanding}
                className="premium-button-secondary"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Tab Navigation */}
        <div className="border-b border-gray-800/50 bg-gray-900/50">
          <div className="flex items-center px-8">
            <button
              onClick={() => setActiveTab('code')}
              className={`tab-button ${activeTab === 'code' ? 'active' : ''}`}
            >
              <Code2 className="w-4 h-4 mr-2" />
              Code Editor
            </button>
            <button
              onClick={() => setActiveTab('terminal')}
              className={`tab-button ${activeTab === 'terminal' ? 'active' : ''}`}
            >
              <Terminal className="w-4 h-4 mr-2" />
              AI Terminal
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              AI Assistant
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8">
          {activeTab === 'code' && (
            <div className="h-full flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">AI-Enhanced Code Editor</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleAISuggestion}
                    disabled={isRunning || aiCount >= 30}
                    className="premium-button-secondary flex items-center space-x-2"
                  >
                    {isRunning ? (
                      <div className="loading-spinner" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>AI Improve</span>
                  </button>
                  
                  <button
                    onClick={handleRunCode}
                    disabled={isRunning || aiCount >= 30}
                    className="premium-button flex items-center space-x-2"
                    title="AI-Enhanced Run (Ctrl+Enter)"
                  >
                    {isRunning ? (
                      <div className="loading-spinner" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>AI Run</span>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 glass-effect rounded-xl border border-gray-700/50 overflow-hidden">
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="w-full h-full resize-none bg-transparent text-white placeholder-gray-400 p-6 code-editor focus:outline-none"
                  placeholder="Your AI-enhanced code editor is ready..."
                  spellCheck={false}
                />
              </div>
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="h-full flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">AI-Enhanced Terminal</h3>
                <button
                  onClick={() => setTerminalOutput('')}
                  className="premium-button-secondary text-sm px-3 py-1"
                >
                  Clear
                </button>
              </div>
              
              <div className="flex-1 terminal-output rounded-xl p-6 overflow-auto">
                <pre className="whitespace-pre-wrap text-sm">
                  {terminalOutput || 'AI-enhanced terminal ready. Run your code to see intelligent output analysis.'}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="h-full flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">AI Code Assistant</h3>
                <div className="text-sm text-purple-400">
                  Unlimited conversations about your code
                </div>
              </div>
              
              <div className="flex-1 flex flex-col space-y-4">
                {/* Chat Messages */}
                <div className="flex-1 glass-effect rounded-xl border border-gray-700/50 p-6 overflow-y-auto space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-xl ${
                          message.type === 'user'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-800 text-gray-100 border border-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          {message.type === 'ai' && <Bot className="w-4 h-4 text-purple-400" />}
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isAiTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl">
                        <div className="flex items-center space-x-2">
                          <Bot className="w-4 h-4 text-purple-400" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Chat Input */}
                <div className="flex space-x-2">
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me about your code, request improvements, or get explanations..."
                    className="flex-1 premium-input"
                    disabled={aiCount >= 30}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isAiTyping || aiCount >= 30}
                    className="premium-button p-3"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="action-button-grid">
        <button
          onClick={handleRunCode}
          disabled={isRunning || aiCount >= 30}
          className="action-button"
        >
          {isRunning ? (
            <div className="loading-spinner" />
          ) : (
            <Play className="w-5 h-5 text-emerald-400" />
          )}
          <span className="text-xs font-medium text-white">AI Run</span>
        </button>
        
        <button
          onClick={handleAISuggestion}
          disabled={isRunning || aiCount >= 30}
          className="action-button"
        >
          {isRunning ? (
            <div className="loading-spinner" />
          ) : (
            <Sparkles className="w-5 h-5 text-purple-400" />
          )}
          <span className="text-xs font-medium text-white">Improve</span>
        </button>
        
        <button
          onClick={handleCopyCode}
          className="action-button"
        >
          <Copy className="w-5 h-5 text-blue-400" />
          <span className="text-xs font-medium text-white">Copy</span>
        </button>
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

export default ForkedSession;