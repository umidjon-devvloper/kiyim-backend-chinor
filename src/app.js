import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "dotenv/config";

import authRoutes from "./routes/auth.js";
import patternRoutes from "./routes/patterns.js";
import categoryRoutes from "./routes/categories.js";
import paymeRoutes from "./routes/payme.js";
import userRoutes from "./routes/user.js";
import adminRoutes from "./routes/admin.js";
import uploadthingRoutes from "./routes/uploadthing.js";
import subscriptionRoutes from "./routes/subscription.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [
      "https://checkout.test.paycom.uz",
      "https://checkout.paycom.uz",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-uploadthing-package",
      "x-uploadthing-version",
      "x-uploadthing-fe-package",
      "x-uploadthing-be-adapter",
    ],
    credentials: true,
  }),
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server ishlayapti ✅",
    timestamp: new Date(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/patterns", patternRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/payme", paymeRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/upload", uploadthingRoutes);
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Route topilmadi" });
});

app.use(errorHandler);

export default app;
