import "dotenv/config";
import http from 'http';
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket, startNotificationWatcher } from "./config/socket.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();

    // Create HTTP server
    const server = http.createServer(app);
    
    // Initialize Socket.IO with production settings
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`🚀 Server port ${PORT} da ishlamoqda`);
      console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 Socket.IO ready`);
      console.log(`📡 WebSocket URL: wss://${process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost:' + PORT}`);
      
      // Start watching for new notifications in database
      startNotificationWatcher();
    });
  } catch (error) {
    console.error("❌ Server start xatosi:", error);
    process.exit(1);
  }
};

start();
