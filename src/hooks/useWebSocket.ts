import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  connectedUsers: number;
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
}

export const useWebSocket = (sessionId: string): UseWebSocketReturn => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    // WebSocket server URL - dynamically construct based on current host
    const wsUrl = `ws://${window.location.hostname}:8080`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Join the session
      sendMessage({
        type: 'join_session',
        sessionId
      });
    };

    ws.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('Received WebSocket message:', message);
        
        setLastMessage(message);

        // Handle specific message types
        switch (message.type) {
          case 'session_info':
            setConnectedUsers(message.connectedUsers || 0);
            break;
          case 'joined_session':
            console.log('Successfully joined session:', message.sessionId);
            break;
          case 'user_joined':
          case 'user_left':
            // These will be handled by session_info updates
            break;
          case 'session_expired':
            console.log('Session expired:', message.message);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setConnectedUsers(0);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [sessionId, sendMessage]);

  return {
    isConnected,
    connectedUsers,
    sendMessage,
    lastMessage
  };
};