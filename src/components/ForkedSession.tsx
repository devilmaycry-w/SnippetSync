import React, { useState } from 'react';
import { ArrowLeft, Share, Play, Wand2, Copy } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

interface ForkedSessionProps {
  sessionId: string;
  forkedFromId: string;
  onBackToLanding: () => void;
}

const ForkedSession: React.FC<ForkedSessionProps> = ({
  sessionId,
  forkedFromId,
  onBackToLanding,
}) => {
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState<'code' | 'chat'>('code');
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

  const handleRunCode = () => {
    // Placeholder for code execution
    console.log('Running code:', code);
    sendMessage({
      type: 'code_execution',
      output: 'Code execution coming soon...'
    });
  };

  const handleAISuggestion = () => {
    // Placeholder for AI suggestions
    console.log('Getting AI suggestions for:', code);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  const ActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }> = ({ icon, label, onClick }) => (
    <div className="flex flex-col items-center gap-2 bg-[#111418] py-2.5 text-center">
      <button
        onClick={onClick}
        className="rounded-full bg-[#283039] p-2.5 hover:bg-[#3a4551] transition-colors"
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
            onClick={onBackToLanding}
            className="text-white flex size-12 shrink-0 items-center cursor-pointer hover:bg-[#283039] rounded-xl transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center px-2">
            Session ID: {sessionId}
          </h2>
          <div className="flex w-12 items-center justify-end">
            <button
              onClick={handleShare}
              className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 bg-transparent text-white gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0 hover:bg-[#283039] transition-colors"
            >
              <Share size={24} />
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
                <textarea
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="w-full resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border-none bg-[#283039] focus:border-none min-h-64 sm:min-h-80 lg:min-h-96 placeholder:text-[#9cabba] p-4 text-base font-normal leading-normal font-mono"
                  placeholder="Start typing your code here..."
                />
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
            />
            <ActionButton
              icon={<Wand2 size={20} />}
              label="AI"
              onClick={handleAISuggestion}
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
    </div>
  );
};

export default ForkedSession;