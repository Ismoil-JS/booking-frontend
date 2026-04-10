import { useState, useRef, useEffect } from 'react';
import { Button, Input, Alert, message } from 'antd';
import { Send, Bot, User } from 'lucide-react';
import { streamChatMessage, type ChatMessage } from '@/entities/Chat/api';
import MarkdownText from '@/shared/ui/MarkdownText';

const sectionPadding = 'py-6';

const ChatPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    setInput('');
    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setStreamingContent('');

    try {
      const fullReply = await streamChatMessage(
        {
          message: text,
          messages: messages.length > 0 ? messages : undefined,
        },
        (chunk) => setStreamingContent((prev) => prev + chunk)
      );
      setMessages((prev) => [...prev, { role: 'assistant', content: fullReply }]);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
      if (errMsg === 'Chat unavailable' || errMsg === 'Request failed') {
        setError(
          errMsg === 'Chat unavailable'
            ? 'Chat is unavailable. Please try again later.'
            : 'Something went wrong. Please try again.'
        );
        message.error(errMsg === 'Chat unavailable' ? 'Chat is unavailable.' : 'Request failed.');
      } else {
        setError(errMsg);
        message.error(errMsg);
      }
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      setStreamingContent(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`min-h-[calc(100vh-6rem)] flex flex-col ${sectionPadding}`}>
      <div className="container mx-auto max-w-3xl flex-1 flex flex-col">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          AI Chat
        </h1>
        <p className="text-gray-600 mb-6">
          Ask anything. This chat does not save history; messages are only for this session.
        </p>

        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            closable
            onClose={() => setError(null)}
            className="mb-4"
          />
        )}

        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[320px]">
            {messages.length === 0 && !loading && streamingContent === null && (
              <p className="text-gray-400 text-center py-8">
                Send a message to start the conversation.
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.role === 'user'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-indigo-100 text-indigo-600'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <MarkdownText variant="chatAssistant" className="text-sm">
                      {msg.content}
                    </MarkdownText>
                  ) : (
                    <MarkdownText variant="chatUser" className="text-sm">
                      {msg.content}
                    </MarkdownText>
                  )}
                </div>
              </div>
            ))}
            {streamingContent !== null && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-2.5 bg-gray-100 text-gray-900">
                  {streamingContent === '' ? (
                    <p className="text-sm text-gray-500 italic flex items-center gap-2">
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
                      </span>
                      The system is thinking…
                    </p>
                  ) : (
                    <div className="text-sm">
                      <MarkdownText variant="chatAssistant">{streamingContent}</MarkdownText>
                      <span className="inline-block w-2 h-4 ml-0.5 bg-indigo-500 animate-pulse align-middle" aria-hidden />
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={listEndRef} />
          </div>

          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={loading}
                maxLength={10000}
                showCount={false}
                className="rounded-xl flex-1"
              />
              <Button
                type="primary"
                icon={<Send className="w-4 h-4" />}
                onClick={handleSend}
                loading={loading}
                disabled={!input.trim()}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 border-0 shrink-0"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
