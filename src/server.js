import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import { startPeriodicNotificationChecker } from "./services/notificationService.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server port ${PORT} da ishlamoqda`);
      console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      
      // Start periodic notification checker (every 5 minutes)
      startPeriodicNotificationChecker(5);
    });
  } catch (error) {
    console.error("❌ Server start xatosi:", error);
    process.exit(1);
  }
};

start();
