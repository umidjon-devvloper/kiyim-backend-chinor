import mongoose from 'mongoose';
import { UserSubscription, SubscriptionPlan } from '../models/Subscription.js';
import dotenv from 'dotenv';

dotenv.config();

async function createTestSubscription() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Plan topish yoki yaratish
  let plan = await SubscriptionPlan.findOne();
  if (!plan) {
    plan = await SubscriptionPlan.create({
      name: '1 oylik',
      duration: 30,
      price: 10000, // 100 so'm (tiyinda)
      isActive: true,
    });
    console.log('Plan yaratildi:', plan._id);
  }
  
  // Test obuna yaratish
  const sub = await UserSubscription.create({
    user: new mongoose.Types.ObjectId(), // Test user
    plan: plan._id,
    amount: 10000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: false,
    paymeState: 1, // Pending
  });
  
  console.log('Test obuna yaratildi:');
  console.log('subscription_id:', sub._id.toString());
  console.log('amount:', sub.amount);
  
  await mongoose.disconnect();
}

createTestSubscription().catch(console.error);
