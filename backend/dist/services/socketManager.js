"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToOrg = exports.emitToUser = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ChatMessage_1 = __importDefault(require("../models/ChatMessage"));
const Notification_1 = __importDefault(require("../models/Notification"));
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = __importDefault(require("mongoose"));
let ioServer = null;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyteamcrm';
// Track online sockets by userId in-memory for immediate lookup (in addition to Redis keys)
const userSockets = new Map(); // userId -> socketId[]
const initSocket = (server) => {
    ioServer = new socket_io_1.Server(server, {
        cors: {
            origin: '*', // Allow all origins for development, can lock down in production
            methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        },
    });
    // Socket Auth Middleware
    ioServer.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
            return next(new Error('Authentication token missing'));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            socket.user = {
                id: decoded.id,
                email: decoded.email,
                name: decoded.name,
                role: decoded.role,
                orgId: decoded.orgId,
            };
            next();
        }
        catch (err) {
            next(new Error('Authentication failed: Invalid token'));
        }
    });
    ioServer.on('connection', async (socket) => {
        if (!socket.user)
            return;
        const user = socket.user;
        const socketId = socket.id;
        console.log(`[Socket]: User "${user.name}" connected (${socketId})`);
        // 1. Map user to socketId
        const sockets = userSockets.get(user.id) || [];
        sockets.push(socketId);
        userSockets.set(user.id, sockets);
        // 2. Join organization-wide room
        const orgRoom = `org:${user.orgId}`;
        socket.join(orgRoom);
        // 3. Broadcast updated presence status
        await broadcastOrgPresence(user.orgId);
        // -- Event Handlers --
        // Join Chat Channel or DM Room
        socket.on('join_channel', (channelId) => {
            // Security check: if DM, verify user is a participant
            if (channelId.startsWith('dm:')) {
                const parts = channelId.split(':');
                if (parts[1] !== user.id && parts[2] !== user.id) {
                    return socket.emit('error_message', 'Forbidden: You cannot access this direct message channel.');
                }
            }
            socket.join(`channel:${channelId}`);
            console.log(`[Socket]: User "${user.name}" joined channel "${channelId}"`);
        });
        // Leave Chat Channel or DM Room
        socket.on('leave_channel', (channelId) => {
            socket.leave(`channel:${channelId}`);
            console.log(`[Socket]: User "${user.name}" left channel "${channelId}"`);
        });
        // Handle New Message
        socket.on('send_message', async (data) => {
            try {
                const { channelId, content } = data;
                if (!content || !channelId)
                    return;
                // Save to Database
                const newMessage = new ChatMessage_1.default({
                    orgId: user.orgId,
                    channelId,
                    senderId: user.id,
                    senderName: user.name,
                    content,
                    emojiReactions: [],
                    readBy: [new mongoose_1.default.Types.ObjectId(user.id)],
                });
                await newMessage.save();
                // Broadcast to channel members
                ioServer?.to(`channel:${channelId}`).emit('message_received', newMessage);
                // Send alert/notification to recipients who are NOT in the room
                // If DM, create a database notification for the other user
                if (channelId.startsWith('dm:')) {
                    const parts = channelId.split(':');
                    const recipientId = parts[1] === user.id ? parts[2] : parts[1];
                    // Check if recipient is online (presence check)
                    const isRecipientConnected = userSockets.has(recipientId);
                    const dbNotif = new Notification_1.default({
                        orgId: user.orgId,
                        recipientId,
                        type: 'new_message',
                        title: `New DM from ${user.name}`,
                        message: content.length > 50 ? `${content.substring(0, 50)}...` : content,
                        referenceId: newMessage._id,
                    });
                    await dbNotif.save();
                    // If recipient is connected, emit real-time notification
                    if (isRecipientConnected) {
                        (0, exports.emitToUser)(recipientId, 'notification_received', dbNotif);
                    }
                }
            }
            catch (err) {
                console.error('Socket message save error:', err);
                socket.emit('error_message', 'Failed to send message');
            }
        });
        // Typing Indicators
        socket.on('typing', (data) => {
            socket.to(`channel:${data.channelId}`).emit('typing_status', {
                channelId: data.channelId,
                userId: user.id,
                userName: user.name,
                isTyping: data.isTyping,
            });
        });
        // Emoji Reactions
        socket.on('toggle_reaction', async (data) => {
            try {
                const { messageId, emoji } = data;
                const msg = await ChatMessage_1.default.findOne({ _id: messageId, orgId: user.orgId });
                if (!msg)
                    return;
                const reactionIndex = msg.emojiReactions.findIndex((r) => r.userId.toString() === user.id && r.emoji === emoji);
                if (reactionIndex > -1) {
                    msg.emojiReactions.splice(reactionIndex, 1);
                }
                else {
                    msg.emojiReactions.push({
                        userId: new mongoose_1.default.Types.ObjectId(user.id),
                        userName: user.name,
                        emoji,
                    });
                }
                await msg.save();
                ioServer?.to(`channel:${msg.channelId}`).emit('reaction_updated', msg);
            }
            catch (err) {
                console.error('Socket toggle reaction error:', err);
            }
        });
        // Read Receipts
        socket.on('mark_read', async (data) => {
            try {
                const { channelId } = data;
                const userIdObj = new mongoose_1.default.Types.ObjectId(user.id);
                await ChatMessage_1.default.updateMany({
                    orgId: user.orgId,
                    channelId,
                    senderId: { $ne: userIdObj },
                    readBy: { $ne: userIdObj },
                }, {
                    $push: { readBy: userIdObj },
                });
                ioServer?.to(`channel:${channelId}`).emit('channel_marked_read', {
                    channelId,
                    userId: user.id,
                });
            }
            catch (err) {
                console.error('Socket mark read error:', err);
            }
        });
        // Disconnect Handler
        socket.on('disconnect', async () => {
            console.log(`[Socket]: User "${user.name}" disconnected (${socketId})`);
            const sockets = userSockets.get(user.id) || [];
            const updatedSockets = sockets.filter((id) => id !== socketId);
            if (updatedSockets.length === 0) {
                userSockets.delete(user.id);
            }
            else {
                userSockets.set(user.id, updatedSockets);
            }
            await broadcastOrgPresence(user.orgId);
        });
    });
};
exports.initSocket = initSocket;
// Helper: Broadcast current online presence in the organization
const broadcastOrgPresence = async (orgId) => {
    try {
        const orgRoom = `org:${orgId}`;
        // Find all users in the organization
        const orgUsers = await User_1.default.find({ orgId }).select('_id name role email');
        const presenceList = orgUsers.map((u) => {
            const isOnline = userSockets.has(u._id.toString());
            return {
                id: u._id,
                name: u.name,
                role: u.role,
                email: u.email,
                status: isOnline ? 'online' : 'offline',
            };
        });
        ioServer?.to(orgRoom).emit('presence_update', presenceList);
    }
    catch (err) {
        console.error('Broadcast presence error:', err);
    }
};
// Send real-time notification to a specific user
const emitToUser = (userId, event, payload) => {
    const socketIds = userSockets.get(userId) || [];
    socketIds.forEach((sid) => {
        ioServer?.to(sid).emit(event, payload);
    });
};
exports.emitToUser = emitToUser;
// Emit event to all sockets in an organization
const emitToOrg = (orgId, event, payload) => {
    const orgRoom = `org:${orgId}`;
    ioServer?.to(orgRoom).emit(event, payload);
};
exports.emitToOrg = emitToOrg;
