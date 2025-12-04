import io from 'socket.io-client';

let socket = null; // Instance unique

export const initSocket = () => {
  if (socket) {
    console.log('Socket déjà init – reconnecting');
    socket.connect();
    return socket;
  }

  if (typeof io === 'undefined') {
    console.error('socket.io-client not loaded – skipping init');
    return null;
  }

  socket = io('http://localhost:5000', { 
    withCredentials: true, // Pour sessions app.py
    transports: ['polling'], // Force polling only (fix WebSocket crashes dans logs)
    autoConnect: true,
    reconnection: true, // Auto-reconnect
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected (SID:', socket.id, ')'); // Debug
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected (reason:', reason, ')'); // Debug : 'io server disconnect' ou 'ping timeout'
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connect error:', err.message); // ex. CORS ou transport fail
  });

  console.log('Socket initialized');
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    console.log('Socket disconnected');
    socket = null;
  }
};

export const onNotification = (callback) => {
  if (socket) {
    socket.on('notification', (data) => {
      console.log('Notification reçue:', data); // Debug : ex. relance de app.py
      callback(data);
    });
    return () => socket.off('notification'); // Cleanup
  }
};

export default socket;