import User from "../models/User.js";
import { verifyFirebaseToken } from "../config/firebase.js";
import { generateToken } from "../utils/jwt.js";
import { successResponse, errorResponse } from "../utils/response.js";

export const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      console.error("❌ idToken not provided in request body");
      return errorResponse(res, "idToken talab etiladi", 400);
    }

    console.log("1️⃣ Verifying Firebase token...");
    // Firebase token verify
    let firebaseUser;
    try {
      firebaseUser = await verifyFirebaseToken(idToken);
      console.log("2️⃣ Firebase token verified:", firebaseUser?.email);
    } catch (err) {
      console.error("❌ Firebase token verification failed:", err.message);
      return errorResponse(
        res,
        "Firebase token noto'g'ri: " + err.message,
        401,
      );
    }

    const { uid, email, name, picture } = firebaseUser;

    if (!email) {
      console.error("❌ Email not found in Firebase token");
      return errorResponse(res, "Email topilmadi", 400);
    }

    console.log("3️⃣ Finding or creating user...");
    // Foydalanuvchi topish yoki yaratish
    let user = await User.findOne({ email });

    if (user) {
      console.log("4️⃣ User found, updating...");
      // GoogleId yangilash (eski foydalanuvchilar uchun)
      if (!user.googleId) {
        user.googleId = uid;
        if (picture && !user.avatar) user.avatar = picture;
        await user.save();
      }
    } else {
      console.log("4️⃣ Creating new user...");
      // Yangi foydalanuvchi
      const isAdmin = email === process.env.ADMIN_EMAIL;
      user = await User.create({
        googleId: uid,
        email,
        name: name || email.split("@")[0],
        avatar: picture || "",
        role: isAdmin ? "admin" : "user",
      });
    }

    console.log("5️⃣ Generating JWT token...");
    const token = generateToken(user._id);

    console.log("6️⃣ Login successful ✅");
    return successResponse(
      res,
      {
        token,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
        },
      },
      "Muvaffaqiyatli kirish",
      200,
    );
  } catch (error) {
    console.error("❌ Unexpected error in googleLogin:", error);
    next(error);
  }
};
export const emailLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validatsiya
    if (!email || !password) {
      return errorResponse(res, "Email va parol talab etiladi", 400);
    }

    // Foydalanuvchini topish
    const user = await User.findOne({ email });
    if (!user) {
      return errorResponse(res, "Foydalanuvchi topilmadi", 404);
    }

    // Parol tekshirish (agar user password bilan yaratilgan bo'lsa)
    if (user.password && user.password !== password) {
      return errorResponse(res, "Email yoki parol noto'g'ri", 401);
    }

    const token = generateToken(user._id);
    return successResponse(res, {
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const emailRegister = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validatsiya
    if (!name || !email || !password) {
      return errorResponse(res, "Barcha maydonlarni to'ldiring", 400);
    }

    if (password.length < 6) {
      return errorResponse(
        res,
        "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
        400,
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, "To'g'ri email kiriting", 400);
    }

    // Email mavjudligini tekshirish
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, "Bu email allaqachon ro'yxatdan o'tgan", 409);
    }

    // Yangi foydalanuvchi yaratish
    const user = await User.create({
      email,
      name,
      password, // Production da hash qilish kerak
      role: "user",
    });

    const token = generateToken(user._id);

    return successResponse(
      res,
      {
        token,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
        },
      },
      "Ro'yxatdan o'tish muvaffaqiyatli",
      201,
    );
  } catch (error) {
    next(error);
  }
};
