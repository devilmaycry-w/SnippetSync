import React, { useState, useEffect } from 'react';
import { Code, Keyboard } from 'lucide-react';

interface LandingPageProps {
  onStartNewSession: () => void;
  onJoinSession: (sessionUrl: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
  onStartNewSession,
  onJoinSession,
}) => {
  const [sessionUrl, setSessionUrl] = useState('');
  const [iconAnim, setIconAnim] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  // Dark mode effect
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored) setDarkMode(stored === 'dark');
    else setDarkMode(true);
  }, []);
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleIconClick = () => {
    setIconAnim('animate-bounce');
    setTimeout(() => setIconAnim(''), 700);
  };

  const handleThemeToggle = () => {
    setDarkMode((prev) => !prev);
  };

  const handleJoinClick = () => {
    if (sessionUrl.trim()) {
      onJoinSession(sessionUrl.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinClick();
    }
  };

  return (
    <div className="flex flex-col min-h-screen justify-between" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div>
        <div className="flex items-center bg-[#111418] p-4 pb-2 justify-between">
          <div className="text-white flex size-12 shrink-0 items-center">
            <span
              className={`text-2xl select-none cursor-pointer transition-transform duration-300 ${iconAnim}`}
              onClick={handleIconClick}
              style={{ fontFamily: 'monospace', fontWeight: 700 }}
              title="Jay Baba Ki!"
            >
              {'<>'}
            </span>
          </div>
          <h2 className="flex-1 text-center bg-clip-text text-transparent text-lg font-bold leading-tight tracking-[-0.015em] pl-0"
            style={{
              backgroundImage: 'linear-gradient(90deg, #6a5af9 0%, #a66cff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            SnippetSync
          </h2>
          <div className="flex w-12 items-center justify-end">
            <button
              className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 bg-transparent text-white gap-2 text-base font-bold leading-normal tracking-[0.015em] min-w-0 p-0 hover:bg-[#283039] transition-colors"
              onClick={handleThemeToggle}
            >
              <Keyboard size={24} />
            </button>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-white tracking-light text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-center pb-3 pt-5">
            Code Together in Real-Time
          </h2>
          
          <p className="text-white text-base sm:text-lg font-normal leading-normal pb-6 pt-1 text-center max-w-2xl mx-auto">
            Create or join a temporary coding session. No accounts, no data stored.
          </p>
          
          <div className="max-w-md mx-auto space-y-4">
            <button
              onClick={onStartNewSession}
              className="w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-5 bg-[#0a65c1] text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-[#0952a1] transition-colors flex"
            >
              <span className="truncate">Start New Session</span>
            </button>
            
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter Session URL"
                value={sessionUrl}
                onChange={(e) => setSessionUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#3b4754] bg-[#1b2127] focus:border-[#3b4754] h-14 placeholder:text-[#9cabba] p-[15px] text-base font-normal leading-normal"
              />
              
              <button
                onClick={handleJoinClick}
                className="w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#283039] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#3a4551] transition-colors flex"
              >
                <span className="truncate">Join</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <p className="text-[#9cabba] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
          Built with Codexcity | Auto-expires in 24 hours.
        </p>
        <div className="h-5 bg-[#111418]"></div>
      </div>
    </div>
  );
};

export default LandingPage;