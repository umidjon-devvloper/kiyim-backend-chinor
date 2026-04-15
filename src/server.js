import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import initFirebase from "./config/firebase.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    initFirebase();

    app.listen(PORT, () => {
      console.log(`🚀 Server port ${PORT} da ishlamoqda`);
      console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Server start xatosi:", error);
    process.exit(1);
  }
};

start();
