import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    console.log(`Checking for admin user: ${adminEmail}`);

    // Check if admin exists
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log("✅ Admin user found, updating password...");
      admin.password = adminPassword;
      admin.role = "admin";
      await admin.save();
      console.log("✅ Admin user updated successfully!");
    } else {
      console.log("Creating new admin user...");
      admin = await User.create({
        email: adminEmail,
        name: "Admin",
        password: adminPassword,
        role: "admin",
        avatar: "",
      });
      console.log("✅ Admin user created successfully!");
    }

    console.log("\nAdmin Details:");
    console.log("- Email:", admin.email);
    console.log("- Role:", admin.role);
    console.log("- Has Password:", !!admin.password);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

createAdminUser();
