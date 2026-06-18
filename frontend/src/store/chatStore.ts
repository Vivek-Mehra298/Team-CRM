import { create } from 'zustand';

export interface ChatMessage {
  _id: string;
  orgId: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  emojiReactions: Array<{ userId: string; userName: string; emoji: string }>;
  readBy: string[];
  createdAt: string;
}

export interface PresenceUser {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'online' | 'offline';
}

interface ChatState {
  activeChannelId: string;
  messages: Record<string, ChatMessage[]>;
  presenceUsers: PresenceUser[];
  typingUsers: Record<string, Record<string, boolean>>; // channelId -> { userName: isTyping }
  
  setActiveChannelId: (channelId: string) => void;
  setMessages: (channelId: string, msgs: ChatMessage[]) => void;
  addMessage: (channelId: string, msg: ChatMessage) => void;
  updateMessage: (channelId: string, msg: ChatMessage) => void;
  setPresenceUsers: (users: PresenceUser[]) => void;
  setTypingStatus: (channelId: string, userName: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeChannelId: 'general',
  messages: {},
  presenceUsers: [],
  typingUsers: {},

  setActiveChannelId: (channelId) => set({ activeChannelId: channelId }),
  
  setMessages: (channelId, msgs) => 
    set((state) => ({
      messages: { ...state.messages, [channelId]: msgs }
    })),
    
  addMessage: (channelId, msg) => 
    set((state) => {
      const channelMsgs = state.messages[channelId] || [];
      // Prevent duplicates
      if (channelMsgs.some((m) => m._id === msg._id)) return {};
      return {
        messages: {
          ...state.messages,
          [channelId]: [...channelMsgs, msg]
        }
      };
    }),

  updateMessage: (channelId, msg) =>
    set((state) => {
      const channelMsgs = state.messages[channelId] || [];
      const index = channelMsgs.findIndex((m) => m._id === msg._id);
      if (index === -1) return {};
      const updated = [...channelMsgs];
      updated[index] = msg;
      return {
        messages: {
          ...state.messages,
          [channelId]: updated
        }
      };
    }),

  setPresenceUsers: (users) => set({ presenceUsers: users }),

  setTypingStatus: (channelId, userName, isTyping) =>
    set((state) => {
      const channelTyping = state.typingUsers[channelId] || {};
      const updatedChannel = { ...channelTyping, [userName]: isTyping };
      if (!isTyping) {
        delete updatedChannel[userName];
      }
      return {
        typingUsers: {
          ...state.typingUsers,
          [channelId]: updatedChannel
        }
      };
    }),
}));
