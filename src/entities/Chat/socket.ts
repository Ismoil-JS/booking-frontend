import { io, type Socket } from 'socket.io-client';

/**
 * Socket.IO connects to the HTTP server origin (not `/api`).
 * Prefer `VITE_SOCKET_URL` (e.g. http://localhost:3000). Otherwise we strip path from `VITE_BASE_URL`.
 */
function resolveSocketUrl(): string {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (typeof explicit === 'string' && explicit.trim()) return explicit.trim();
  const base = import.meta.env.VITE_BASE_URL;
  if (typeof base === 'string' && base.trim()) {
    try {
      return new URL(base).origin;
    } catch {
      return base.trim();
    }
  }
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

/* ── Payload types ───────────────────────────────────────────────── */

export interface ChatJoinedPayload {
  conversationId: number;
  isTutorUnlockedByBooking: boolean;
  preBookTutorsRemaining?: number;
  messagesRemaining?: number;
  messageLimit?: number;
  messagesUsed?: number;
}

export interface ChatAckPayload {
  conversationId: number;
  messageId: number;
  createdAt: string;
}

export interface ChatSocketMessagePayload {
  id: number;
  conversationId: number;
  senderId: number;
  body: string;
  createdAt: string;
  readAt?: string | null;
}

export interface ChatTypingPayload {
  conversationId: number;
  isTyping: boolean;
  userId?: number;
}

export interface ChatReadPayload {
  conversationId: number;
  messageId: number;
  readByUserId?: number;
}

export interface ChatErrorPayload {
  code?: string;
  message?: string;
}

/* ── Socket singleton with reconnection ──────────────────────────── */

let socketRef: Socket | null = null;
let currentToken: string | null = null;

export function getChatSocket(token: string): Socket {
  // If token changed, disconnect old socket first
  if (socketRef && currentToken !== token) {
    socketRef.disconnect();
    socketRef = null;
  }

  if (!socketRef) {
    currentToken = token;
    socketRef = io(resolveSocketUrl(), {
      transports: ['websocket', 'polling'], // fallback to polling if websocket fails
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    // Debug logging in development
    if (import.meta.env.DEV) {
      socketRef.on('connect', () => console.log('[socket] connected', socketRef?.id));
      socketRef.on('disconnect', (reason) => console.log('[socket] disconnected:', reason));
      socketRef.on('reconnect_attempt', (n) => console.log('[socket] reconnect attempt', n));
      socketRef.on('reconnect', () => console.log('[socket] reconnected'));
      socketRef.on('connect_error', (err) => console.warn('[socket] connect_error:', err.message));
    }
  }

  return socketRef;
}

export function disconnectChatSocket() {
  if (!socketRef) return;
  socketRef.disconnect();
  socketRef = null;
  currentToken = null;
}

/** Check if the socket is currently connected */
export function isSocketConnected(): boolean {
  return socketRef?.connected ?? false;
}
