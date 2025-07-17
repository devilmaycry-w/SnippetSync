import { useEffect, useRef, useState, useCallback } from "react";

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
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  // Persistent userId per session
  function getOrCreateUserId(sessionId: string) {
    const key = `snippet_userid_${sessionId}`;
    let userId = localStorage.getItem(key);
    if (!userId) {
      userId = Math.random().toString(36).substring(2, 10);
      localStorage.setItem(key, userId);
    }
    return userId;
  }

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);

      sendMessage({
        type: 'join_session',
        sessionId,
        userId: getOrCreateUserId(sessionId)
      });
    };

    ws.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('Received WebSocket message:', message);
        setLastMessage(message);

        switch (message.type) {
          case 'session_info':
            setConnectedUsers(message.connectedUsers || 0);
            break;
          case 'joined_session':
            console.log('Successfully joined session:', message.sessionId);
            break;
          case 'user_joined':
          case 'user_left':
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
      console.warn('WebSocket disconnected');
      setIsConnected(false);
      setConnectedUsers(0);

      // Attempt reconnection after delay
      reconnectTimeout.current = setTimeout(() => {
        console.log('Reconnecting WebSocket...');
        connectWebSocket();
      }, 2000);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error, 'State:', ws.current?.readyState);
      setIsConnected(false);
    };
  }, [sessionId, sendMessage]);

  useEffect(() => {
    if (!sessionId) return;

    const delay = setTimeout(() => {
      connectWebSocket();
    }, 100); // Debounce initial connection

    return () => {
      clearTimeout(delay);
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [sessionId, connectWebSocket]);

  return {
    isConnected,
    connectedUsers,
    sendMessage,
    lastMessage
  };
};
