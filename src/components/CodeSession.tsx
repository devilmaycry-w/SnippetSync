import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
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

  // Handle incoming WebSocket messages
  React.useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'code_update':
        if (lastMessage.code !== code) {
          setCode(lastMessage.code);
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
  }, [lastMessage, code]);

  // Send code changes to other users
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    sendMessage({
      type: 'code_change',
      code: newCode
    });
  };

  const handleCopyUrl = () => {
    const url = `${window.location.origin}/session/${sessionId}`;
    navigator.clipboard.writeText(url);
    // You could add a toast notification here
  };

  const handleForkSession = () => {
    onForkSession(sessionId);
  };

  const handleRunCode = () => {
    // Placeholder for code execution
    const output = 'Code execution coming soon...';
    setTerminalOutput(output);
    
    // Broadcast execution result to other users
    sendMessage({
      type: 'code_execution',
      output
    });
  };

  const handleApplySuggestion = (suggestionId: string) => {
    // Placeholder for applying AI suggestions
    console.log('Applying suggestion:', suggestionId);
  };

  return (
    <div className="flex flex-col min-h-screen justify-between" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center bg-[#111418] p-4 pb-2 justify-between sticky top-0 z-10">
          <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pl-12">
            SnippetSync
          </h2>
          <div className="flex w-12 items-center justify-end">
            <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 bg-transparent text-white gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0 hover:bg-[#283039] transition-colors">
              <HelpCircle size={24} />
            </button>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 space-y-4">
          <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-2 pt-4">
            Session ID: {sessionId}
          </h3>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCopyUrl}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#283039] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#3a4551] transition-colors"
            >
              <span className="truncate">Copy URL</span>
            </button>
            
            <button
              onClick={handleForkSession}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#0a65c1] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#0952a1] transition-colors"
            >
              <span className="truncate">Fork Session</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-white text-base font-medium leading-normal pb-2">Code Editor</p>
                <textarea
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="w-full resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#283039] focus:border-none min-h-64 sm:min-h-80 lg:min-h-96 placeholder:text-[#9cabba] p-4 text-base font-normal leading-normal font-mono"
                  placeholder="Start typing your code here..."
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
            
            <div className="space-y-4">
              <div>
                <p className="text-white text-base font-medium leading-normal pb-2">Terminal</p>
                <textarea
                  value={terminalOutput}
                  readOnly
                  className="w-full resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#283039] focus:border-none min-h-64 sm:min-h-80 lg:min-h-96 placeholder:text-[#9cabba] p-4 text-base font-normal leading-normal font-mono"
                  placeholder="Output will appear here..."
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
    </div>
  );
};

export default CodeSession;