import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { errorResponse } from "../utils/response.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, "Token topilmadi", 401);
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return errorResponse(res, "Token muddati tugagan", 401);
      }
      return errorResponse(res, "Token noto'g'ri", 401);
    }

    const user = await User.findById(decoded.id).select("-__v");
    if (!user) {
      return errorResponse(res, "Foydalanuvchi topilmadi", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, "Autentifikatsiya xatosi", 500);
  }
};
