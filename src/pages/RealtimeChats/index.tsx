import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Input, Spin, Tag, message } from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  MessageCircle,
  Search,
  Lock,
  Unlock,
  ChevronRight,
} from 'lucide-react';
import {
  getRealtimeConversations,
  type RealtimeConversation,
} from '@/entities/Chat/api';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/authSlice';
import { useAuth } from '@/contexts/AuthContext';
import { getChatSocket } from '@/entities/Chat/socket';

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ name, profileImage, size = 48 }: { name: string; profileImage?: string | null; size?: number }) {
  if (profileImage) {
    const baseUrl = import.meta.env.VITE_BASE_URL?.replace(/\/$/, '') ?? '';
    const src = profileImage.startsWith('http') ? profileImage : `${baseUrl}/${profileImage}`;
    return (
      <img
        src={src}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {getInitials(name)}
    </div>
  );
}

export default function RealtimeChatsPage() {
  const user = useSelector(selectUser);
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  const otherUserIdFromQuery = Number(
    searchParams.get('otherUserId') ?? searchParams.get('tutorId'),
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['realtime-chat', 'conversations'],
    queryFn: getRealtimeConversations,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

  const conversations = useMemo(() => data?.items ?? [], [data]);
  const [joinPending, setJoinPending] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const wantsStartChat =
    !!token && Number.isFinite(otherUserIdFromQuery) && otherUserIdFromQuery > 0;

  // Listen for new incoming messages to refresh conversation list
  useEffect(() => {
    if (!token) return;
    const socket = getChatSocket(token);
    const onNewMessage = () => {
      refetch();
    };
    socket.on('chat:message', onNewMessage);
    return () => { socket.off('chat:message', onNewMessage); };
  }, [token, refetch]);

  // Auto-join when navigating with ?otherUserId=
  useEffect(() => {
    if (!wantsStartChat) {
      setJoinPending(false);
      setJoinError(null);
      return;
    }

    setJoinPending(true);
    setJoinError(null);

    const socket = getChatSocket(token!);
    let cancelled = false;
    let joinTimeoutId: number | undefined;

    const clearJoinTimeout = () => {
      if (joinTimeoutId !== undefined) {
        window.clearTimeout(joinTimeoutId);
        joinTimeoutId = undefined;
      }
    };

    const onJoined = (payload: { conversationId?: number }) => {
      if (cancelled) return;
      const cid = payload?.conversationId;
      if (cid == null) return;
      clearJoinTimeout();
      setJoinPending(false);
      navigate(`/dashboard/chats/${cid}`, { replace: true });
    };

    const onChatError = (payload: unknown) => {
      if (cancelled) return;
      clearJoinTimeout();
      setJoinPending(false);
      const p = payload && typeof payload === 'object' ? (payload as { code?: string; message?: string }) : {};
      if (p.code === 'UNAUTHORIZED') {
        message.error('Session expired. Please log in again.');
        logout();
        navigate('/login', { replace: true });
        return;
      }
      const msgText = p.message ?? 'Could not start chat.';
      message.error(msgText);
      setJoinError(msgText);
    };

    const onConnectError = () => {
      if (cancelled) return;
      clearJoinTimeout();
      setJoinPending(false);
      setJoinError('Could not reach the chat server. Please check your connection.');
      message.error('Chat connection failed.');
    };

    socket.on('chat:joined', onJoined);
    socket.on('chat:error', onChatError);
    socket.on('connect_error', onConnectError);

    const doJoin = () => {
      if (cancelled) return;
      socket.emit('chat:join', { otherUserId: otherUserIdFromQuery });
    };

    if (socket.connected) {
      doJoin();
    } else {
      socket.once('connect', doJoin);
    }

    joinTimeoutId = window.setTimeout(() => {
      if (cancelled) return;
      setJoinPending(false);
      setJoinError('No response from chat server. Please try again.');
    }, 15_000);

    return () => {
      cancelled = true;
      clearJoinTimeout();
      socket.off('chat:joined', onJoined);
      socket.off('chat:error', onChatError);
      socket.off('connect_error', onConnectError);
      socket.off('connect', doJoin);
    };
  }, [token, wantsStartChat, otherUserIdFromQuery, navigate, logout]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const peer = getPeer(c, user);
      return peer.name.toLowerCase().includes(q);
    });
  }, [conversations, searchQuery, user]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          {data && user?.userType === 'LEARNER' && (
            <Tag
              color={data.preBookTutorsRemaining > 0 ? 'blue' : 'default'}
              className="text-xs px-2 py-0.5"
            >
              {data.preBookTutorsRemaining} / {data.preBookTutorLimit} free chats left
            </Tag>
          )}
        </div>
        <p className="text-sm text-gray-500">
          {user?.userType === 'LEARNER'
            ? 'Chat with tutors before or after booking sessions'
            : 'Respond to learner inquiries'}
        </p>
      </div>

      {/* Search */}
      {conversations.length > 0 && (
        <div className="mb-4">
          <Input
            prefix={<Search className="w-4 h-4 text-gray-400" />}
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl"
            allowClear
          />
        </div>
      )}

      {/* Join status */}
      {wantsStartChat && joinPending && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
          <Spin size="small" />
          <span className="text-sm text-blue-700">Connecting to chat server...</span>
        </div>
      )}
      {joinError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-sm text-red-700">{joinError}</p>
          <Button
            type="link"
            size="small"
            className="p-0 mt-1"
            onClick={() => setJoinError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center gap-3">
          <Spin size="large" />
          <span className="text-sm text-gray-400">Loading conversations...</span>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="py-10 text-center">
          <p className="text-red-500 mb-2">
            {error instanceof Error ? error.message : 'Could not load chats'}
          </p>
          <Button type="primary" onClick={() => refetch()} className="rounded-xl">
            Retry
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && conversations.length === 0 && !joinPending && (
        <div className="py-16 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <MessageCircle className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">No conversations yet</h3>
          <p className="text-sm text-gray-500 mb-5 max-w-xs">
            Find a tutor and send them a message to get started.
          </p>
          <Link to="/find-tutor">
            <Button type="primary" size="large" className="rounded-xl bg-blue-600 hover:bg-blue-700 px-8">
              Find a tutor
            </Button>
          </Link>
        </div>
      )}

      {/* Conversation list */}
      {!isLoading && !isError && filteredConversations.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {filteredConversations.map((conversation) => {
            const peer = getPeer(conversation, user);
            const lastMsg = conversation.lastMessage;
            const hasUnread = conversation.unreadCount > 0;

            return (
              <Link
                key={conversation.id}
                to={`/dashboard/chats/${conversation.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
              >
                {/* Avatar */}
                <div className="relative">
                  <Avatar
                    name={peer.name}
                    profileImage={peer.profileImage}
                    size={48}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-semibold truncate ${hasUnread ? 'text-gray-900' : 'text-gray-800'}`}>
                      {peer.name}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {timeAgo(conversation.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className={`text-sm truncate ${hasUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                      {lastMsg
                        ? (lastMsg.senderUserId ?? lastMsg.senderId) === user?.id
                          ? `You: ${lastMsg.body}`
                          : lastMsg.body
                        : 'Start chatting...'}
                    </p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {hasUnread && (
                        <Badge
                          count={conversation.unreadCount}
                          size="small"
                          style={{ backgroundColor: '#2563eb' }}
                        />
                      )}
                      {conversation.isTutorUnlockedByBooking ? (
                        <Unlock className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-gray-300" />
                      )}
                    </div>
                  </div>
                  {/* Message quota bar */}
                  {user?.userType === 'LEARNER' && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            conversation.messagesRemaining <= 3
                              ? 'bg-red-400'
                              : conversation.messagesRemaining <= 10
                                ? 'bg-amber-400'
                                : 'bg-blue-400'
                          }`}
                          style={{
                            width: `${Math.max(2, (conversation.messagesUsed / conversation.messageLimit) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 tabular-nums">
                        {conversation.messagesRemaining}/{conversation.messageLimit}
                      </span>
                    </div>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
              </Link>
            );
          })}
        </div>
      )}

      {/* No search results */}
      {!isLoading && !isError && conversations.length > 0 && filteredConversations.length === 0 && (
        <div className="py-10 text-center text-sm text-gray-500">
          No conversations match "{searchQuery}"
        </div>
      )}
    </div>
  );
}

/* ── helpers ──────────────────────────────────────────────────────── */

function getPeer(
  conversation: RealtimeConversation,
  user: { id?: number; userType?: string } | null,
): { name: string; profileImage: string | null } {
  const isCurrentUserTutor = user?.userType === 'TUTOR';
  // Find the "other" participant
  const peer = conversation.participants.find((p) =>
    isCurrentUserTutor ? p.userType === 'LEARNER' : p.userType === 'TUTOR',
  ) ?? conversation.participants.find((p) => p.id !== user?.id);

  return {
    name: peer?.fullName ?? 'Unknown User',
    profileImage: peer?.profileImage ?? null,
  };
}
