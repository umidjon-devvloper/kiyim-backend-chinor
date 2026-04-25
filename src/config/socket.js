import { Server } from 'socket.io';
import Notification from '../models/Notification.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Store connected users
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // User joins with their userId
    socket.on('join', (userId) => {
      if (userId) {
        connectedUsers.set(userId, socket.id);
        socket.userId = userId;
        console.log(`👤 User ${userId} joined socket`);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        console.log(`👋 User ${socket.userId} disconnected`);
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  });

  console.log('✅ Socket.IO server initialized');
  return io;
};

// Send notification to specific user
export const sendNotificationToUser = async (userId, notification) => {
  if (!io) {
    console.error('❌ Socket.IO not initialized');
    return;
  }

  const socketId = connectedUsers.get(userId);
  
  if (socketId) {
    io.to(socketId).emit('notification', {
      _id: notification._id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      data: notification.data,
      createdAt: notification.createdAt,
      isRead: notification.isRead,
    });
    console.log(`📤 Socket notification sent to user ${userId}`);
  } else {
    console.log(`⚠️ User ${userId} not connected via socket`);
  }
};

// Send notification to all connected users
export const broadcastNotification = (notification) => {
  if (!io) {
    console.error('❌ Socket.IO not initialized');
    return;
  }

  io.emit('notification', {
    _id: notification._id,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    data: notification.data,
    createdAt: notification.createdAt,
  });
  console.log('📢 Broadcast notification to all users');
};

// Watch for new notifications in database
export const startNotificationWatcher = () => {
  console.log('👀 Starting notification watcher...');
  
  // Watch Notification collection for new inserts
  Notification.watch().on('change', (change) => {
    if (change.operationType === 'insert') {
      const newNotification = change.fullDocument;
      console.log('🔔 New notification detected:', newNotification.title);
      
      // Send to specific user
      if (newNotification.user) {
        sendNotificationToUser(newNotification.user.toString(), newNotification);
      }
      
      // Broadcast if it's for all users
      if (newNotification.sentTo === 'all') {
        broadcastNotification(newNotification);
      }
    }
  });
  
  console.log('✅ Notification watcher started');
};

// Get io instance
export const getIO = () => io;
