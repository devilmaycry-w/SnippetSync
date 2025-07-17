import React, { useState, useEffect } from 'react';
import { Code2, Sparkles, Users, Zap, ArrowRight, Github } from 'lucide-react';

interface LandingPageProps {
  onStartNewSession: () => void;
  onJoinSession: (sessionUrl: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
  onStartNewSession,
  onJoinSession,
}) => {
  const [sessionUrl, setSessionUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinClick = async () => {
    if (sessionUrl.trim()) {
      setIsLoading(true);
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      onJoinSession(sessionUrl.trim());
      setIsLoading(false);
    }
  };

  const handleStartSession = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    onStartNewSession();
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinClick();
    }
  };

  const features = [
    {
      icon: <Code2 className="w-6 h-6" />,
      title: "Real-time Collaboration",
      description: "Code together with live cursors and instant synchronization"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Execution",
      description: "Run code in multiple languages with immediate feedback"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "AI-Powered Suggestions",
      description: "Get intelligent code improvements and optimizations"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Privacy First",
      description: "No accounts required, sessions auto-expire in 24 hours"
    }
  ];

  return (
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center premium-shadow-sm">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">SnippetSync</h1>
            </div>
            <button className="premium-button-secondary flex items-center space-x-2">
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              Code Together
              <br />
              <span className="gradient-text">In Real-Time</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Create temporary coding sessions with instant collaboration, 
              code execution, and AI-powered suggestions. No setup required.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={handleStartSession}
              disabled={isLoading}
              className="premium-button w-full sm:w-auto flex items-center justify-center space-x-2 min-w-[200px]"
            >
              {isLoading ? (
                <div className="loading-spinner" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start New Session</span>
                </>
              )}
            </button>
            
            <div className="w-full sm:w-px h-px sm:h-6 bg-gray-600" />
            
            <div className="flex w-full sm:w-auto space-x-2">
              <input
                type="text"
                placeholder="Enter Session ID"
                value={sessionUrl}
                onChange={(e) => setSessionUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                className="premium-input flex-1 min-w-[160px]"
              />
              <button
                onClick={handleJoinClick}
                disabled={isLoading || !sessionUrl.trim()}
                className="premium-button-secondary px-4 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="loading-spinner" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="ai-suggestion-card text-center space-y-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center mx-auto border border-emerald-500/20">
                <div className="text-emerald-400">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Demo Preview */}
        <div className="mt-24">
          <div className="text-center space-y-4 mb-12">
            <h3 className="text-3xl font-bold text-white">
              VSCode-Quality Experience
            </h3>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Professional code editor with syntax highlighting, intelligent suggestions, 
              and seamless collaboration features.
            </p>
          </div>
          
          <div className="glass-effect rounded-2xl p-8 premium-shadow-lg max-w-4xl mx-auto">
            <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700/50">
              {/* Mock Editor Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-sm text-gray-400">main.py</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="status-indicator status-connected"></div>
                  <span className="text-xs text-gray-400">3 users connected</span>
                </div>
              </div>
              
              {/* Mock Code Content */}
              <div className="p-4 code-editor text-sm">
                <div className="flex">
                  <div className="code-line-numbers pr-4 select-none">
                    <div>1</div>
                    <div>2</div>
                    <div>3</div>
                    <div>4</div>
                    <div>5</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-purple-400">def <span className="text-blue-400">fibonacci</span>(<span className="text-orange-400">n</span>):</div>
                    <div className="pl-4 text-gray-300">if n &lt;= 1:</div>
                    <div className="pl-8 text-pink-400">return <span className="text-orange-400">n</span></div>
                    <div className="pl-4 text-pink-400">return <span className="text-blue-400">fibonacci</span>(<span className="text-orange-400">n</span>-1) + <span className="text-blue-400">fibonacci</span>(<span className="text-orange-400">n</span>-2)</div>
                    <div className="text-gray-500"># AI Suggestion: Consider memoization for better performance</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800/50 mt-24">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              Built with <span className="text-emerald-400">♥</span> for developers • Sessions auto-expire in 24 hours
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>Privacy First</span>
              <span>•</span>
              <span>No Data Stored</span>
              <span>•</span>
              <span>Open Source</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;