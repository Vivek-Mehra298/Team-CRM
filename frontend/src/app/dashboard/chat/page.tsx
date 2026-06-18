'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { useChatStore, ChatMessage } from '../../../store/chatStore';
import { 
  socketJoinChannel, 
  socketLeaveChannel, 
  socketSendMessage, 
  socketSendTyping, 
  socketToggleReaction,
  socketMarkRead
} from '../../../lib/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hash, 
  Send, 
  Loader2, 
  Check, 
  CheckCheck, 
  MessageSquarePlus,
  Users
} from 'lucide-react';

const CHANNELS = [
  { id: 'general', name: 'general', desc: 'Workspace-wide discussions and general announcements' },
  { id: 'announcements', name: 'announcements', desc: 'Company news, client updates, and won deals feed' }
];

export default function ChatPage() {
  const { user } = useAuthStore();
  const { 
    activeChannelId, 
    messages, 
    presenceUsers, 
    typingUsers, 
    setActiveChannelId, 
    setMessages 
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch team members
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['members', 'chat-presence'],
    queryFn: () => apiFetch('/org/members'),
  });

  // 2. Fetch messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await apiFetch(`/chat/${activeChannelId}/messages`);
        setMessages(activeChannelId, response.messages || []);
        
        socketJoinChannel(activeChannelId);
        socketMarkRead(activeChannelId);
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };

    loadMessages();

    return () => {
      socketLeaveChannel(activeChannelId);
    };
  }, [activeChannelId, setMessages]);

  const activeMessages = messages[activeChannelId] || [];
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    socketSendMessage(activeChannelId, inputText.trim());
    setInputText('');
    handleStopTyping();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      socketSendTyping(activeChannelId, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    setIsTyping(false);
    socketSendTyping(activeChannelId, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleSelectDM = (targetUserId: string) => {
    if (!user) return;
    const parts = [user.id, targetUserId].sort();
    const dmChannelId = `dm:${parts[0]}:${parts[1]}`;
    setActiveChannelId(dmChannelId);
  };

  const handleToggleReaction = (msgId: string, emoji: string) => {
    socketToggleReaction(msgId, emoji);
  };

  const getChannelDisplayName = (id: string) => {
    if (id.startsWith('dm:')) {
      const parts = id.split(':');
      const otherUserId = parts[1] === user?.id ? parts[2] : parts[1];
      const otherUser = members.find((m: any) => m._id === otherUserId);
      return otherUser ? otherUser.name : 'Direct Conversation';
    }
    const ch = CHANNELS.find((c) => c.id === id);
    return ch ? `# ${ch.name}` : `# ${id}`;
  };

  const getChannelDescription = (id: string) => {
    if (id.startsWith('dm:')) {
      return 'Direct Message Thread (Strict Tenant Confidentiality)';
    }
    const ch = CHANNELS.find((c) => c.id === id);
    return ch ? ch.desc : '';
  };

  const members = membersData?.members || [];
  const channelTyping = typingUsers[activeChannelId] || {};
  const typingNames = Object.keys(channelTyping);

  // Framer Motion staggered transition variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03
      }
    }
  } as const;

  const bubbleVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring' as const, damping: 20, stiffness: 220 }
    }
  } as const;

  return (
    <div className="flex h-[calc(100vh-10rem)] border border-border bg-card rounded-xl overflow-hidden select-none shadow-sm">
      
      {/* 1. Left panel */}
      <div className="w-64 border-r border-border bg-card flex flex-col justify-between shrink-0">
        <div className="p-4 space-y-6 overflow-y-auto no-scrollbar">
          
          {/* Channels list */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-3 px-2 flex items-center justify-between">
              <span>Text Channels</span>
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-1">
              {CHANNELS.map((ch) => {
                const isActive = activeChannelId === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannelId(ch.id)}
                    className={`w-full flex items-center h-8 px-2 rounded-lg text-xs font-semibold gap-2.5 transition-colors text-left ${
                      isActive 
                        ? 'bg-sky-500/10 text-sky-600' 
                        : 'text-muted hover:text-foreground hover:bg-slate-50'
                    }`}
                  >
                    <Hash className="w-4 h-4 shrink-0 text-muted" />
                    <span>{ch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DMs list */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-3 px-2">
              Direct Messages
            </div>
            <div className="space-y-1">
              {membersLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 text-gray-400 animate-spin" /></div>
              ) : (
                members.map((member: any) => {
                  if (member._id === user?.id) return null;
                  
                  const presence = presenceUsers.find((p) => p.id === member._id);
                  const isOnline = presence ? presence.status === 'online' : false;
                  
                  const isSelected = activeChannelId.includes(member._id);

                  return (
                    <button
                      key={member._id}
                      onClick={() => handleSelectDM(member._id)}
                      className={`w-full flex items-center h-8 px-2 rounded-lg text-xs font-semibold gap-2.5 transition-colors text-left ${
                        isSelected 
                          ? 'bg-sky-500/10 text-sky-600' 
                          : 'text-muted hover:text-foreground hover:bg-slate-50'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-5 h-5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-600 flex items-center justify-center font-bold text-[8px] uppercase">
                          {member.name[0]}
                        </div>
                        <span className={`absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full border border-card ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                        }`} />
                      </div>
                      <span className="truncate">{member.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-border text-[9px] text-muted text-center font-mono bg-background/50">
          Socket.io Engine Online
        </div>
      </div>

      {/* 2. Chat Area */}
      <div className="flex-grow flex flex-col justify-between min-w-0 bg-background/30">
        
        {/* Header */}
        <div className="h-14 border-b border-border px-6 flex items-center justify-between shrink-0 bg-card">
          <div>
            <h3 className="text-xs font-bold text-foreground tracking-tight flex items-center gap-1">
              {getChannelDisplayName(activeChannelId)}
            </h3>
            <p className="text-[10px] text-muted mt-0.5">{getChannelDescription(activeChannelId)}</p>
          </div>
        </div>

        {/* Message Feed */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          key={activeChannelId}
          className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar"
        >
          {activeMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-xs text-muted py-12">
              <MessageSquarePlus className="w-8 h-8 text-slate-300 mb-2" />
              <span>This is the start of the chat history. Send a message to initiate discussion.</span>
            </div>
          ) : (
            activeMessages.map((msg) => {
              const isSelf = msg.senderId === user?.id;
              const readCount = msg.readBy ? msg.readBy.length - 1 : 0;
              const isRead = readCount > 0;

              return (
                <motion.div 
                  variants={bubbleVariants}
                  key={msg._id} 
                  className="flex gap-3 items-start text-xs group"
                >
                  <div className="w-8 h-8 rounded bg-background border border-border text-sky-600 font-extrabold flex items-center justify-center shrink-0 uppercase">
                    {msg.senderName[0]}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-grow">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{msg.senderName}</span>
                      <span className="text-[9px] text-muted font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className="text-slate-700 leading-relaxed break-words">{msg.content}</div>

                    {/* Reactions & Receipts */}
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      {msg.emojiReactions && msg.emojiReactions.map((react, i) => (
                        <button
                          key={i}
                          onClick={() => handleToggleReaction(msg._id, react.emoji)}
                          className="px-1.5 py-0.5 rounded-full bg-background border border-border hover:border-slate-300 text-[10px] text-muted flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>{react.emoji}</span>
                          <span className="text-[8px] text-muted font-mono font-bold">{msg.emojiReactions.filter(r => r.emoji === react.emoji).length}</span>
                        </button>
                      ))}

                      {/* picker shortcut */}
                      <div className="hidden group-hover:flex items-center gap-1">
                        {['👍', '🔥', '🚀', '🎉'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleToggleReaction(msg._id, emoji)}
                            className="w-5 h-5 rounded hover:bg-slate-100 border border-transparent hover:border-border flex items-center justify-center text-[10px] transition-colors cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      {/* receipts */}
                      {activeChannelId.startsWith('dm:') && isSelf && (
                        <div className="ml-auto flex items-center text-[9px] text-gray-400 font-mono">
                          {isRead ? (
                            <span className="text-sky-600 flex items-center gap-0.5"><CheckCheck className="w-3.5 h-3.5" /> Read</span>
                          ) : (
                            <span className="flex items-center gap-0.5"><Check className="w-3.5 h-3.5" /> Sent</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={threadEndRef} />
        </motion.div>

        {/* Input Bar */}
        <div className="p-4 border-t border-border bg-card shrink-0 space-y-2">
          {typingNames.length > 0 && (
            <div className="text-[10px] text-muted font-medium italic animate-pulse">
              {typingNames.join(', ')} {typingNames.length > 1 ? 'are' : 'is'} typing...
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              placeholder={`Message ${getChannelDisplayName(activeChannelId)}...`}
              value={inputText}
              onChange={handleInputChange}
              className="flex-grow h-10 px-4 rounded-lg border border-border bg-background text-foreground text-xs focus:border-sky-500 focus:outline-none placeholder:text-slate-400"
              required
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
