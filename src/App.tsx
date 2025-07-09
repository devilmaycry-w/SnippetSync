import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import CodeSession from './components/CodeSession';
import ForkedSession from './components/ForkedSession';

export type ViewType = 'landing' | 'session' | 'forked';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [sessionId, setSessionId] = useState('');
  const [forkedFromId, setForkedFromId] = useState('');

  const handleStartNewSession = () => {
    const newSessionId = Math.random().toString(36).substring(2, 8);
    setSessionId(newSessionId);
    setCurrentView('session');
  };

  const handleJoinSession = (sessionUrl: string) => {
    // Extract session ID from URL or use the input directly
    const id = sessionUrl.split('/').pop() || sessionUrl;
    setSessionId(id);
    setCurrentView('session');
  };

  const handleForkSession = (originalSessionId: string) => {
    const newSessionId = Math.random().toString(36).substring(2, 8);
    setSessionId(newSessionId);
    setForkedFromId(originalSessionId);
    setCurrentView('forked');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
    setSessionId('');
    setForkedFromId('');
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-[#111418] dark justify-between group/design-root overflow-x-hidden">
      {currentView === 'landing' && (
        <LandingPage
          onStartNewSession={handleStartNewSession}
          onJoinSession={handleJoinSession}
        />
      )}
      {currentView === 'session' && (
        <CodeSession
          sessionId={sessionId}
          onForkSession={handleForkSession}
          onBackToLanding={handleBackToLanding}
        />
      )}
      {currentView === 'forked' && (
        <ForkedSession
          sessionId={sessionId}
          forkedFromId={forkedFromId}
          onBackToLanding={handleBackToLanding}
        />
      )}
    </div>
  );
}

export default App;