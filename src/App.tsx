import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import CodeSession from './components/CodeSession';
import ForkedSession from './components/ForkedSession';

export type ViewType = 'landing' | 'session' | 'forked';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [sessionId, setSessionId] = useState('');
  const [forkedFromId, setForkedFromId] = useState('');
  const [toast, setToast] = useState('');

  // Helper to show toast
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Helper to create a session via WebSocket
  const createSession = (newSessionId: string) => {
    const wsUrl = import.meta.env.VITE_WS_URL;
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      const ws = new window.WebSocket(wsUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'create_session', sessionId: newSessionId }));
      };
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'session_created') {
          ws.close();
          resolve({ success: true });
        } else if (msg.type === 'error') {
          ws.close();
          resolve({ success: false, error: msg.message });
        }
      };
      ws.onerror = () => {
        ws.close();
        resolve({ success: false, error: 'WebSocket error' });
      };
    });
  };

  // Helper to check if a session exists via WebSocket
  const checkSessionExists = (id: string) => {
    const wsUrl = import.meta.env.VITE_WS_URL;
    return new Promise<{ exists: boolean; error?: string }>((resolve) => {
      const ws = new window.WebSocket(wsUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'join_session', sessionId: id }));
      };
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'joined_session') {
          ws.close();
          resolve({ exists: true });
        } else if (msg.type === 'error') {
          ws.close();
          resolve({ exists: false, error: msg.message });
        }
      };
      ws.onerror = () => {
        ws.close();
        resolve({ exists: false, error: 'WebSocket error' });
      };
    });
  };

  const handleStartNewSession = async () => {
    const newSessionId = Math.random().toString(36).substring(2, 8);
    const result = await createSession(newSessionId);
    if (result.success) {
      setSessionId(newSessionId);
      setCurrentView('session');
    } else {
      showToast(result.error || 'Failed to create session');
    }
  };

  const handleJoinSession = async (sessionUrl: string) => {
    const id = sessionUrl.split('/').pop() || sessionUrl;
    const result = await checkSessionExists(id);
    if (result.exists) {
      setSessionId(id);
      setCurrentView('session');
    } else {
      showToast(result.error || 'Session does not exist');
    }
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

  const handleBackToCodeSession = (originalSessionId: string) => {
    setSessionId(originalSessionId);
    setCurrentView('session');
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
          onBackToCodeSession={handleBackToCodeSession}
        />
      )}
      {toast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#0a65c1] text-white px-4 py-2 rounded shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;