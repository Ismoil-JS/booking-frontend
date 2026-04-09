import request from '@/services/api';

const BASE_URL = import.meta.env.VITE_BASE_URL ?? '';

/* ── AI Chat (SSE streaming) ─────────────────────────────────────── */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  messages?: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
}

export interface ChatStreamChunk {
  text?: string;
  error?: string;
}

export async function sendChatMessage(body: ChatRequest): Promise<ChatResponse> {
  const { data } = await request.post<ChatResponse>('/chat', body);
  return data;
}

export async function streamChatMessage(
  body: ChatRequest,
  onChunk: (text: string) => void,
): Promise<string> {
  const res = await fetch(`${BASE_URL}chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(res.status === 503 ? 'Chat unavailable' : 'Request failed');
  }
  const reader = res.body?.getReader();
  if (!reader) throw new Error('Stream not supported');
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data: ChatStreamChunk = JSON.parse(line.slice(6));
          if (data.error) throw new Error(data.error);
          if (data.text) {
            fullText += data.text;
            onChunk(data.text);
          }
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
  }
  return fullText;
}

/* ── Realtime Learner-Tutor Chat ─────────────────────────────────── */

export interface RealtimeQuota {
  preBookTutorLimit: number;
  preBookTutorsUsed: number;
  preBookTutorsRemaining: number;
  canStartNewTutorChat: boolean;
}

export interface RealtimeConversationUser {
  id: number;
  fullName: string;
  userType?: string;
  profileImage?: string | null;
}

export interface RealtimeConversationLastMessage {
  id: number;
  body: string;
  senderId?: number;
  senderUserId?: number;
  createdAt: string;
}

export interface RealtimeConversation {
  id: number;
  directKey: string;
  createdAt: string;
  lastMessageAt: string | null;
  participants: RealtimeConversationUser[];
  lastMessage: RealtimeConversationLastMessage | null;
  isTutorUnlockedByBooking: boolean;
  messageLimit: number;
  messagesUsed: number;
  messagesRemaining: number;
  unreadCount: number;
}

export interface RealtimeMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderUserId?: number;  // backend may return this instead of senderId
  body: string;
  createdAt: string;
  readAt?: string | null;
}

/** Get the sender ID from a message, handling both field names */
export function getSenderId(m: RealtimeMessage): number {
  return m.senderId ?? m.senderUserId ?? 0;
}

export interface RealtimeConversationListResponse extends RealtimeQuota {
  items: RealtimeConversation[];
}

export interface RealtimeMessagesResponse {
  items: RealtimeMessage[];
  nextCursor: number | null;
}

export interface RealtimeMessagesParams {
  cursor?: number;
  limit?: number;
}

export async function getRealtimeConversations(): Promise<RealtimeConversationListResponse> {
  const { data } = await request.get<RealtimeConversationListResponse>('/realtime-chat/conversations');
  return data;
}

export async function getRealtimeConversationMessages(
  conversationId: number,
  params?: RealtimeMessagesParams,
): Promise<RealtimeMessagesResponse> {
  const { data } = await request.get<RealtimeMessagesResponse>(
    `/realtime-chat/conversations/${conversationId}/messages`,
    { params },
  );
  return data;
}
