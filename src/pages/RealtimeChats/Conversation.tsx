import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Spin, Tooltip, message } from 'antd';
import {
  ArrowLeft,
  Clock,
  Lock,
  Send,
  Unlock,
  WifiOff,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  getRealtimeConversationMessages,
  getRealtimeConversations,
  getSenderId,
  type RealtimeConversation,
  type RealtimeMessage,
} from '@/entities/Chat/api';
import {
  getChatSocket,
  isSocketConnected,
  type ChatAckPayload,
  type ChatErrorPayload,
  type ChatReadPayload,
  type ChatSocketMessagePayload,
  type ChatTypingPayload,
} from '@/entities/Chat/socket';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/authSlice';

const PAGE_SIZE = 40;

/* ── Helpers ──────────────────────────────────────────────────────── */

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function shouldShowDateSeparator(messages: RealtimeMessage[], index: number): boolean {
  if (index === 0) return true;
  const curr = new Date(messages[index].createdAt).toDateString();
  const prev = new Date(messages[index - 1].createdAt).toDateString();
  return curr !== prev;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/* ── Components ───────────────────────────────────────────────────── */

function MiniAvatar({ name, profileImage }: { name: string; profileImage?: string | null }) {
  const baseUrl = import.meta.env.VITE_BASE_URL?.replace(/\/$/, '') ?? '';
  if (profileImage) {
    const src = profileImage.startsWith('http') ? profileImage : `${baseUrl}/${profileImage}`;
    return (
      <img
        src={src}
        alt={name}
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
      {getInitials(name)}
    </div>
  );
}

function MessageBubble({
  msg,
  isMine,
  isOptimistic,
}: {
  msg: RealtimeMessage;
  isMine: boolean;
  isOptimistic: boolean;
}) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}>
      <div
        className={`relative max-w-[75%] sm:max-w-[65%] rounded-2xl px-3.5 py-2 shadow-sm ${
          isMine
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-white text-gray-900 border border-gray-100 rounded-bl-md'
        }`}
      >
        <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
          {msg.body}
        </p>
        <div
          className={`flex items-center justify-end gap-1 mt-0.5 ${
            isMine ? 'text-blue-200' : 'text-gray-400'
          }`}
        >
          <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
          {isMine && isOptimistic && (
            <Clock className="w-3 h-3 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{name}</span>
          <div className="flex gap-0.5">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────── */

export default function RealtimeConversationPage() {
  const { id } = useParams<{ id: string }>();
  const conversationId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token, logout } = useAuth();
  const user = useSelector(selectUser);

  /* state */
  const [draft, setDraft] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [localMessages, setLocalMessages] = useState<RealtimeMessage[]>([]);
  const [connected, setConnected] = useState(isSocketConnected());
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(true);

  /* refs */
  const listEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const pendingSendRef = useRef<{ optimisticId: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);

  /* queries */
  const conversationsQuery = useQuery({
    queryKey: ['realtime-chat', 'conversations'],
    queryFn: getRealtimeConversations,
  });
  const messagesQuery = useQuery({
    queryKey: ['realtime-chat', 'messages', conversationId],
    queryFn: () => getRealtimeConversationMessages(conversationId, { limit: PAGE_SIZE }),
    enabled: Number.isFinite(conversationId) && conversationId > 0,
  });

  /* derived */
  const currentConversation: RealtimeConversation | undefined = useMemo(() => {
    const list = conversationsQuery.data?.items;
    if (!Array.isArray(list)) return undefined;
    return list.find((c) => c.id === conversationId);
  }, [conversationsQuery.data, conversationId]);

  const peerInfo = useMemo(() => {
    if (!currentConversation) return { name: 'Chat', profileImage: null };
    const isCurrentUserTutor = user?.userType === 'TUTOR';
    const peer = currentConversation.participants.find((p) =>
      isCurrentUserTutor ? p.userType === 'LEARNER' : p.userType === 'TUTOR',
    ) ?? currentConversation.participants.find((p) => p.id !== user?.id);
    return {
      name: peer?.fullName ?? 'Unknown',
      profileImage: peer?.profileImage ?? null,
    };
  }, [currentConversation, user]);

  /* seed messages from query + mark last unread message as read on load */
  useEffect(() => {
    const raw = messagesQuery.data?.items;
    const seeded = Array.isArray(raw) ? raw : [];
    setLocalMessages(seeded);
    setHasOlderMessages(!!messagesQuery.data?.nextCursor);

    if (!token || !conversationId || seeded.length === 0) return;

    // Find the last message sent by the OTHER user and mark it as read,
    // so the backend updates lastReadMessageId and clears the unread badge.
    const lastOtherMessage = [...seeded]
      .reverse()
      .find((m) => getSenderId(m) !== user?.id);

    if (lastOtherMessage) {
      const socket = getChatSocket(token);
      const doMark = () => {
        socket.emit('chat:read', { conversationId, messageId: lastOtherMessage.id });
        // Refresh conversation list so the unread badge clears immediately
        void queryClient.invalidateQueries({ queryKey: ['realtime-chat', 'conversations'] });
      };
      if (socket.connected) {
        doMark();
      } else {
        socket.once('connect', doMark);
      }
    }
  }, [messagesQuery.data, token, conversationId, user?.id, queryClient]);

  /* auto-scroll logic */
  const scrollToBottom = useCallback((smooth = true) => {
    listEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom(true);
    }
  }, [localMessages.length, typingUser, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 100;
    setShowScrollDown(distanceFromBottom > 300);
  }, []);

  /* load older messages */
  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasOlderMessages || localMessages.length === 0) return;
    setLoadingOlder(true);
    try {
      const oldestId = localMessages[0].id;
      const res = await getRealtimeConversationMessages(conversationId, {
        cursor: oldestId,
        limit: PAGE_SIZE,
      });
      const older = Array.isArray(res.items) ? res.items : [];
      if (older.length === 0) {
        setHasOlderMessages(false);
      } else {
        setHasOlderMessages(!!res.nextCursor);
        setLocalMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const unique = older.filter((m) => !existingIds.has(m.id));
          return [...unique, ...prev];
        });
      }
    } catch {
      message.error('Failed to load older messages');
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, hasOlderMessages, localMessages, conversationId]);

  /* dedupe and append helper */
  const dedupeAndAppend = useCallback((incoming: RealtimeMessage) => {
    setLocalMessages((prev) => {
      if (prev.some((m) => m.id === incoming.id)) return prev;
      return [...prev, incoming];
    });
  }, []);

  /* ── Socket events ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!token || !conversationId || Number.isNaN(conversationId)) return;
    const socket = getChatSocket(token);

    const onConnect = () => {
      setConnected(true);
      // Re-join the conversation room on reconnect
      const otherUserId =
        user?.userType === 'TUTOR'
          ? currentConversation?.participants.find((p) => p.userType === 'LEARNER')?.id
          : currentConversation?.participants.find((p) => p.userType === 'TUTOR')?.id;
      if (otherUserId) socket.emit('chat:join', { otherUserId });
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    const onMessage = (payload: ChatSocketMessagePayload) => {
      if (!payload || payload.conversationId !== conversationId) return;

      const payloadSenderId = payload.senderId ?? (payload as any).senderUserId ?? 0;
      const isOwnMessage = user?.id != null && payloadSenderId === user.id;

      if (isOwnMessage && pendingSendRef.current) {
        // Replace the optimistic message with the server-confirmed one
        const optId = pendingSendRef.current.optimisticId;
        pendingSendRef.current = null;
        setIsSending(false);
        setLocalMessages((prev) => {
          const rest = prev.filter((m) => m.id !== optId);
          return rest.some((m) => m.id === payload.id) ? rest : [...rest, payload];
        });
      } else if (isOwnMessage) {
        // Own message broadcast (e.g. from another tab) — just dedupe, do NOT mark as read
        dedupeAndAppend(payload);
      } else {
        // Message from the OTHER user — add it and mark as read
        dedupeAndAppend(payload);
        socket.emit('chat:read', { conversationId, messageId: payload.id });
      }

      // Refresh conversation list for unread counts
      void queryClient.invalidateQueries({ queryKey: ['realtime-chat', 'conversations'] });
    };

    const onTyping = (payload: ChatTypingPayload) => {
      if (!payload || payload.conversationId !== conversationId) return;
      if (payload.userId && payload.userId !== user?.id) {
        setTypingUser(payload.isTyping ? peerInfo.name : null);
        // Auto-clear typing after 4 seconds in case we miss the "stopped" event
        if (payload.isTyping) {
          setTimeout(() => setTypingUser(null), 4000);
        }
      }
    };

    const onRead = (payload: ChatReadPayload) => {
      if (!payload || payload.conversationId !== conversationId) return;
      // Update read state internally (no visual indicator shown)
      setLocalMessages((prev) =>
        prev.map((m) =>
          m.id <= payload.messageId && getSenderId(m) === user?.id && !m.readAt
            ? { ...m, readAt: new Date().toISOString() }
            : m,
        ),
      );
    };

    const onAck = (payload: ChatAckPayload) => {
      if (payload?.conversationId != null && payload.conversationId !== conversationId) return;
      const pending = pendingSendRef.current;
      if (!pending || payload?.messageId == null) return;
      pendingSendRef.current = null;
      setIsSending(false);
      const mid = payload.messageId;
      const createdAt = payload.createdAt ?? new Date().toISOString();
      setLocalMessages((prev) =>
        prev.map((m) => (m.id === pending.optimisticId ? { ...m, id: mid, createdAt } : m)),
      );
      void queryClient.invalidateQueries({ queryKey: ['realtime-chat', 'conversations'] });
    };

    const onError = (payload: ChatErrorPayload | undefined) => {
      const code = payload && typeof payload === 'object' ? payload.code : undefined;
      const msg = payload && typeof payload === 'object' ? payload.message : undefined;

      if (code === 'UNAUTHORIZED') {
        message.error('Session expired. Please log in again.');
        logout();
        navigate('/login', { replace: true });
        return;
      }

      const pending = pendingSendRef.current;
      if (pending) {
        pendingSendRef.current = null;
        setIsSending(false);
        setLocalMessages((prev) => prev.filter((m) => m.id !== pending.optimisticId));
      }

      if (msg) message.error(msg);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat:message', onMessage);
    socket.on('chat:typing', onTyping);
    socket.on('chat:read', onRead);
    socket.on('chat:ack', onAck);
    socket.on('chat:error', onError);

    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat:message', onMessage);
      socket.off('chat:typing', onTyping);
      socket.off('chat:read', onRead);
      socket.off('chat:ack', onAck);
      socket.off('chat:error', onError);
    };
  }, [
    conversationId,
    token,
    queryClient,
    dedupeAndAppend,
    user?.id,
    user?.userType,
    logout,
    navigate,
    currentConversation,
    peerInfo.name,
  ]);

  /* ── Typing indicator ──────────────────────────────────────────── */
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!token || !conversationId) return;
      getChatSocket(token).emit('chat:typing', { conversationId, isTyping });
    },
    [token, conversationId],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    // Auto-resize textarea
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';

    sendTyping(true);
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => sendTyping(false), 1200);
  };

  /* ── Send message ──────────────────────────────────────────────── */
  const sendBlockedByQuota =
    user?.userType === 'LEARNER' &&
    currentConversation &&
    (currentConversation.messagesRemaining ?? 0) <= 0;

  const canSend = !!draft.trim() && !isSending && !sendBlockedByQuota && connected;

  const handleSend = () => {
    const body = draft.trim();
    if (!body || !token || !conversationId || !canSend) return;

    const socket = getChatSocket(token);
    setDraft('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const optimisticId = Date.now();
    const optimistic: RealtimeMessage = {
      id: optimisticId,
      conversationId,
      senderId: user?.id ?? 0,
      body,
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    dedupeAndAppend(optimistic);
    pendingSendRef.current = { optimisticId };
    setIsSending(true);

    socket.emit('chat:send', { conversationId, body });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* stuck-send timeout */
  useEffect(() => {
    if (!isSending || !pendingSendRef.current) return;
    const t = window.setTimeout(() => {
      if (!pendingSendRef.current) return;
      const stuckId = pendingSendRef.current.optimisticId;
      pendingSendRef.current = null;
      setIsSending(false);
      message.warning('Message not confirmed. Check your connection.');
      setLocalMessages((prev) => prev.filter((m) => m.id !== stuckId));
    }, 30_000);
    return () => window.clearTimeout(t);
  }, [isSending]);

  /* ── Render ─────────────────────────────────────────────────────── */

  const isLoading = conversationsQuery.isLoading || messagesQuery.isLoading;
  const isLoadError = conversationsQuery.isError || messagesQuery.isError;

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* ── Chat header ─────────────────────────────────────────── */}
      <div className="bg-white rounded-t-2xl border border-b-0 border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <Link
          to="/dashboard/chats"
          className="p-1.5 -ml-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>

        <MiniAvatar name={peerInfo.name} profileImage={peerInfo.profileImage} />

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 truncate text-[15px]">{peerInfo.name}</h2>
        </div>

        {/* Quota badge */}
        {currentConversation && user?.userType === 'LEARNER' && (
          <Tooltip
            title={
              currentConversation.isTutorUnlockedByBooking
                ? `Booked: ${currentConversation.messagesRemaining} of ${currentConversation.messageLimit} messages left`
                : `Free chat: ${currentConversation.messagesRemaining} of ${currentConversation.messageLimit} messages left. Book a session for ${200} messages.`
            }
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 cursor-help">
              {currentConversation.isTutorUnlockedByBooking ? (
                <Unlock className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span
                className={`text-xs font-medium tabular-nums ${
                  currentConversation.messagesRemaining <= 3
                    ? 'text-red-600'
                    : currentConversation.messagesRemaining <= 10
                      ? 'text-amber-600'
                      : 'text-gray-700'
                }`}
              >
                {currentConversation.messagesRemaining}/{currentConversation.messageLimit}
              </span>
            </div>
          </Tooltip>
        )}
      </div>

      {/* ── Messages area ───────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-gray-50 border-x border-gray-100 relative"
        style={{ minHeight: 0 }}
      >
        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <Spin size="large" />
          </div>
        )}

        {isLoadError && (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
            <AlertCircle className="w-10 h-10 text-red-300" />
            <p className="text-sm text-gray-500">Could not load messages</p>
            <Button
              size="small"
              type="primary"
              onClick={() => messagesQuery.refetch()}
              className="rounded-lg"
            >
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !isLoadError && (
          <div className="px-4 py-3 space-y-1.5">
            {/* Load older */}
            {hasOlderMessages && (
              <div className="flex justify-center py-2">
                <Button
                  size="small"
                  type="text"
                  loading={loadingOlder}
                  onClick={loadOlderMessages}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Load older messages
                </Button>
              </div>
            )}

            {/* Messages */}
            {localMessages.map((m, i) => {
              const isMine = getSenderId(m) === user?.id;
              const isOptimistic = m.id >= 1e12; // optimistic ids are Date.now() which is > 1 trillion
              return (
                <div key={m.id}>
                  {/* Date separator */}
                  {shouldShowDateSeparator(localMessages, i) && (
                    <div className="flex items-center justify-center my-3">
                      <span className="text-[11px] text-gray-400 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-gray-100">
                        {formatDateSeparator(m.createdAt)}
                      </span>
                    </div>
                  )}
                  <MessageBubble msg={m} isMine={isMine} isOptimistic={isOptimistic} />
                </div>
              );
            })}

            {/* Typing indicator */}
            {typingUser && <TypingIndicator name={typingUser} />}

            {/* Empty state */}
            {localMessages.length === 0 && !typingUser && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                  <Send className="w-7 h-7 text-blue-400" />
                </div>
                <p className="text-sm text-gray-500 mb-1">No messages yet</p>
                <p className="text-xs text-gray-400">
                  Say hi to {peerInfo.name} to start the conversation!
                </p>
              </div>
            )}

            <div ref={listEndRef} />
          </div>
        )}

        {/* Scroll-to-bottom button */}
        {showScrollDown && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
          >
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* ── Quota warning ───────────────────────────────────────── */}
      {sendBlockedByQuota && (
        <div className="bg-amber-50 border-x border-gray-100 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-xs text-amber-700">
              {currentConversation?.isTutorUnlockedByBooking
                ? "You've reached your message limit with this tutor."
                : 'Free message limit reached. Book a session to unlock more messages.'}
            </span>
          </div>
          {!currentConversation?.isTutorUnlockedByBooking && (
            <Link to="/find-tutor">
              <Button size="small" type="primary" className="rounded-lg text-xs bg-amber-500 hover:bg-amber-600 border-0">
                Book now
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* ── Connection warning ──────────────────────────────────── */}
      {!connected && (
        <div className="bg-red-50 border-x border-gray-100 px-4 py-2 flex items-center gap-2">
          <WifiOff className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs text-red-600">Connection lost. Reconnecting automatically...</span>
        </div>
      )}

      {/* ── Input area ──────────────────────────────────────────── */}
      <div className="bg-white rounded-b-2xl border border-t-0 border-gray-100 shadow-sm px-3 py-2.5 flex items-end gap-2 flex-shrink-0">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            sendBlockedByQuota
              ? 'Message limit reached'
              : !connected
                ? 'Waiting for connection...'
                : `Message ${peerInfo.name}...`
          }
          disabled={!!sendBlockedByQuota || !connected}
          rows={1}
          className="flex-1 resize-none bg-gray-50 rounded-xl px-3.5 py-2.5 text-[14px] text-gray-900 placeholder-gray-400
                     border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:outline-none
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
          style={{ maxHeight: 120, minHeight: 40 }}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            canSend
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}
        >
          {isSending ? (
            <Spin size="small" />
          ) : (
            <Send className="w-4.5 h-4.5" />
          )}
        </button>
      </div>
    </div>
  );
}
