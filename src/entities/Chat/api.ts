import request from '@/services/api';

const BASE_URL = import.meta.env.VITE_BASE_URL ?? '';

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

/** SSE event chunk from POST /chat/stream */
export interface ChatStreamChunk {
  text?: string;
  error?: string;
}

export async function sendChatMessage(body: ChatRequest): Promise<ChatResponse> {
  const { data } = await request.post<ChatResponse>('/chat', body);
  return data;
}

/**
 * Stream assistant reply from POST /chat/stream. Calls onChunk for each text chunk.
 * Returns the full reply when the stream ends. Throws on stream error or non-2xx response.
 */
export async function streamChatMessage(
  body: ChatRequest,
  onChunk: (text: string) => void
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
