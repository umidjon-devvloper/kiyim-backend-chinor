import { errorResponse } from "../utils/response.js";

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return errorResponse(res, "Admin huquqi talab etiladi", 403);
  }
  next();
};
