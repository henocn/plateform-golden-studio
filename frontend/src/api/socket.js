import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

let socket = null;

/* Connecte le WebSocket avec le token JWT courant */
export function connectSocket() {
  if (socket) return socket;

  const token = useAuthStore.getState().accessToken;
  if (!token) return null;

  socket = io({
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.debug('[WS] connected', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.debug('[WS] disconnected', reason);
  });

  socket.on('connect_error', (err) => {
    console.debug('[WS] connect_error', err.message);
  });

  return socket;
}

/* Déconnecte proprement le WebSocket */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/* Retourne l'instance courante */
export function getSocket() {
  return socket;
}
