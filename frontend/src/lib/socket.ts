import { io, Socket } from 'socket.io-client';
import { useChatStore } from '../store/chatStore';
import { useNotificationStore } from '../store/notificationStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const connectSocket = (token: string) => {
  // If already connected, do not reinitialize
  if (socket?.connected) return;
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('[Socket]: Connected to WebSocket server.');
  });

  socket.on('presence_update', (users) => {
    useChatStore.getState().setPresenceUsers(users);
  });

  socket.on('message_received', (msg) => {
    useChatStore.getState().addMessage(msg.channelId, msg);
  });

  socket.on('typing_status', (data) => {
    useChatStore.getState().setTypingStatus(data.channelId, data.userName, data.isTyping);
  });

  socket.on('reaction_updated', (msg) => {
    useChatStore.getState().updateMessage(msg.channelId, msg);
  });

  socket.on('channel_marked_read', (data) => {
    // Handled locally or via state sync
  });

  socket.on('notification_received', (notif) => {
    useNotificationStore.getState().addNotification(notif);
  });

  socket.on('disconnect', () => {
    console.log('[Socket]: Disconnected from WebSocket server.');
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const socketJoinChannel = (channelId: string) => {
  socket?.emit('join_channel', channelId);
};

export const socketLeaveChannel = (channelId: string) => {
  socket?.emit('leave_channel', channelId);
};

export const socketSendMessage = (channelId: string, content: string) => {
  socket?.emit('send_message', { channelId, content });
};

export const socketSendTyping = (channelId: string, isTyping: boolean) => {
  socket?.emit('typing', { channelId, isTyping });
};

export const socketToggleReaction = (messageId: string, emoji: string) => {
  socket?.emit('toggle_reaction', { messageId, emoji });
};

export const socketMarkRead = (channelId: string) => {
  socket?.emit('mark_read', { channelId });
};
