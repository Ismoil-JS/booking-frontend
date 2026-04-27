import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRealtimeConversations } from './api';
import { getChatSocket } from './socket';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Reuse the same query key the chats list page uses, so both subscribers
 * share one network request and one cache entry.
 */
export const REALTIME_CONVERSATIONS_QUERY_KEY = ['realtime-chat', 'conversations'] as const;

/**
 * Subscribes to the conversation list and returns the total unread count
 * across all conversations. Refetches automatically when a new message
 * arrives over the socket.
 *
 * Safe to call from anywhere in the tree — stays disabled (and returns 0)
 * when the user is logged out.
 */
export function useUnreadMessagesCount(): number {
  const { isAuthenticated, token } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: REALTIME_CONVERSATIONS_QUERY_KEY,
    queryFn: getRealtimeConversations,
    enabled: isAuthenticated,
    staleTime: 10_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  // Refresh the count whenever a chat message lands — even if the user
  // never opens /chats. The socket is already booted by AuthProvider.
  useEffect(() => {
    if (!token) return;
    const socket = getChatSocket(token);
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: REALTIME_CONVERSATIONS_QUERY_KEY });
    };
    socket.on('chat:message', refresh);
    socket.on('chat:read', refresh);
    return () => {
      socket.off('chat:message', refresh);
      socket.off('chat:read', refresh);
    };
  }, [token, queryClient]);

  return useMemo(() => {
    if (!isAuthenticated || !data?.items) return 0;
    return data.items.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
  }, [isAuthenticated, data]);
}
