import "dotenv/config";
import connectDB from "../config/db.js";
import { SubscriptionPlan } from "../models/Subscription.js";

const plans = [
  {
    name: "1 oylik",
    duration: 30,
    price: parseInt(process.env.SUBSCRIPTION_1M_PRICE || "5000000"),
    description: "1 oy davomida barcha patronlarga kirish",
    isActive: true,
  },
  {
    name: "3 oylik",
    duration: 90,
    price: parseInt(process.env.SUBSCRIPTION_3M_PRICE || "12000000"),
    description: "3 oy davomida barcha patronlarga kirish (20% chegirma)",
    isActive: true,
  },
  {
    name: "1 yillik",
    duration: 365,
    price: parseInt(process.env.SUBSCRIPTION_1Y_PRICE || "40000000"),
    description: "1 yil davomida barcha patronlarga kirish (33% chegirma)",
    isActive: true,
  },
];

const seed = async () => {
  await connectDB();
  const existing = await SubscriptionPlan.countDocuments();
  if (existing > 0) {
    console.log("✅ Rejalar allaqachon mavjud:", existing, "ta");
    process.exit(0);
  }
  await SubscriptionPlan.insertMany(plans);
  console.log("✅ Obuna rejalari yaratildi:");
  plans.forEach((p) => console.log(`  - ${p.name}: ${p.price / 100} so'm (${p.duration} kun)`));
  process.exit(0);
};

seed().catch((e) => { console.error(e); process.exit(1); });
