import WebSocket from 'ws';
import http from 'http';

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active sessions and their connected clients
const sessions = new Map();

// Generate unique user ID
function generateUserId() {
  return Math.random().toString(36).substring(2, 8);
}

// Broadcast message to all clients in a session except sender
function broadcastToSession(sessionId, message, excludeClient = null) {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.clients.forEach(client => {
    if (client !== excludeClient && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

// Send session info to all clients in a session
function sendSessionInfo(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;

  const sessionInfo = {
    type: 'session_info',
    sessionId,
    connectedUsers: session.clients.length,
    users: session.clients.map(client => ({
      id: client.userId,
      joinedAt: client.joinedAt
    }))
  };

  session.clients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(sessionInfo));
    }
  });
}

wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  
  let currentClient = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message:', message);

      switch (message.type) {
        case 'create_session': {
          const { sessionId } = message;
          if (sessions.has(sessionId)) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Session already exists.'
            }));
            break;
          }
          sessions.set(sessionId, {
            id: sessionId,
            clients: [],
            code: '',
            createdAt: new Date()
          });
          ws.send(JSON.stringify({
            type: 'session_created',
            sessionId
          }));
          break;
        }
        case 'join_session': {
          const { sessionId, userId: providedUserId } = message;
          if (!sessions.has(sessionId)) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Session does not exist.'
            }));
            break;
          }
          const userId = providedUserId || generateUserId();
          const session = sessions.get(sessionId);
          // Check if userId is already present
          const alreadyPresent = session.clients.some(client => client.userId === userId);
          if (alreadyPresent) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'User already connected in this session.'
            }));
            break;
          }
          currentClient = {
            ws,
            userId,
            sessionId,
            joinedAt: new Date()
          };
          session.clients.push(currentClient);
          ws.send(JSON.stringify({
            type: 'joined_session',
            sessionId,
            userId,
            currentCode: session.code
          }));
          broadcastToSession(sessionId, {
            type: 'user_joined',
            userId,
            message: `User ${userId} joined the session`
          }, currentClient);
          sendSessionInfo(sessionId);
          console.log(`User ${userId} joined session ${sessionId}`);
          break;
        }

        case 'code_change':
          if (currentClient) {
            const session = sessions.get(currentClient.sessionId);
            if (session) {
              // Update session code
              session.code = message.code;
              
              // Broadcast code change to other clients
              broadcastToSession(currentClient.sessionId, {
                type: 'code_update',
                code: message.code,
                userId: currentClient.userId,
                cursor: message.cursor
              }, currentClient);
            }
          }
          break;

        case 'cursor_position':
          if (currentClient) {
            // Broadcast cursor position to other clients
            broadcastToSession(currentClient.sessionId, {
              type: 'cursor_update',
              userId: currentClient.userId,
              position: message.position
            }, currentClient);
          }
          break;

        case 'code_execution':
          if (currentClient) {
            // Broadcast code execution result to all clients
            broadcastToSession(currentClient.sessionId, {
              type: 'execution_result',
              output: message.output,
              userId: currentClient.userId
            });
          }
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    if (currentClient) {
      const session = sessions.get(currentClient.sessionId);
      if (session) {
        // Remove client from session
        session.clients = session.clients.filter(client => client !== currentClient);
        
        // Notify other clients about user leaving
        broadcastToSession(currentClient.sessionId, {
          type: 'user_left',
          userId: currentClient.userId,
          message: `User ${currentClient.userId} left the session`
        });

        // Send updated session info
        sendSessionInfo(currentClient.sessionId);

        // Clean up empty sessions
        if (session.clients.length === 0) {
          sessions.delete(currentClient.sessionId);
          console.log(`Session ${currentClient.sessionId} deleted (no active clients)`);
        }
      }
      
      console.log(`User ${currentClient.userId} disconnected from session ${currentClient.sessionId}`);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Clean up expired sessions (older than 24 hours)
setInterval(() => {
  const now = new Date();
  const expiredSessions = [];
  
  sessions.forEach((session, sessionId) => {
    const sessionAge = now - session.createdAt;
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    if (sessionAge > twentyFourHours) {
      expiredSessions.push(sessionId);
    }
  });
  
  expiredSessions.forEach(sessionId => {
    const session = sessions.get(sessionId);
    if (session) {
      // Notify all clients that session is expiring
      session.clients.forEach(client => {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: 'session_expired',
            message: 'Session has expired after 24 hours'
          }));
          client.ws.close();
        }
      });
      sessions.delete(sessionId);
      console.log(`Expired session ${sessionId} cleaned up`);
    }
  });
}, 60 * 60 * 1000); // Check every hour

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
  console.log(`Active sessions: ${sessions.size}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down WebSocket server...');
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});