import { createUploadthing } from "uploadthing/express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const f = createUploadthing();

// Token ni header dan o'qib user qaytaradi
const verifyJWT = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    return user;
  } catch {
    return null;
  } 
};

export const uploadRouter = {
  patternImage: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
    .middleware(async ({ req }) => {
      const user = await verifyJWT(req);
      if (!user || user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return { userId: user._id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url, key: file.key };
    }),

  patternFiles: f({
    pdf: { maxFileSize: "32MB", maxFileCount: 5 },
    "application/zip": { maxFileSize: "64MB", maxFileCount: 3 },
  })
    .middleware(async ({ req }) => {
      const user = await verifyJWT(req);
      if (!user || user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return { userId: user._id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url, key: file.key, name: file.name };
    }),
};
