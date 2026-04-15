// src/routes/upload.js — yangi fayl
import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { adminOnly } from "../middleware/admin.js";
import { UTApi } from "uploadthing/server";

const router = Router();
const utapi = new UTApi();

// POST /api/upload/image
// FormData bilan rasm qabul qiladi, UploadThing ga yuklaydi
router.post("/image", protect, adminOnly, async (req, res, next) => {
  try {
    // express da FormData o'qish uchun
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", async () => {
      try {
        const boundary = req.headers["content-type"]?.split("boundary=")[1];
        if (!boundary) {
          return res
            .status(400)
            .json({ success: false, message: "FormData kerak" });
        }

        const body = Buffer.concat(chunks);
        const parts = parseMultipart(body, boundary);

        if (!parts.length) {
          return res
            .status(400)
            .json({ success: false, message: "Rasm topilmadi" });
        }

        const part = parts[0];
        const file = new File([part.data], part.filename, {
          type: part.contentType,
        });

        const uploaded = await utapi.uploadFiles(file);

        if (uploaded.error) {
          return res
            .status(500)
            .json({ success: false, message: uploaded.error.message });
        }

        return res.json({
          success: true,
          data: {
            url: uploaded.data.url,
            key: uploaded.data.key,
            name: uploaded.data.name,
          },
        });
      } catch (err) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
});

// Multipart parser
function parseMultipart(body, boundary) {
  const parts = [];
  const boundaryBuf = Buffer.from(`--${boundary}`);
  let start = 0;

  while (start < body.length) {
    const boundaryIndex = body.indexOf(boundaryBuf, start);
    if (boundaryIndex === -1) break;

    const headerStart = boundaryIndex + boundaryBuf.length + 2;
    const headerEnd = body.indexOf(Buffer.from("\r\n\r\n"), headerStart);
    if (headerEnd === -1) break;

    const headers = body.slice(headerStart, headerEnd).toString();
    const dataStart = headerEnd + 4;
    const nextBoundary = body.indexOf(boundaryBuf, dataStart);
    const dataEnd = nextBoundary === -1 ? body.length : nextBoundary - 2;

    if (headers.includes("filename")) {
      const filenameMatch = headers.match(/filename="([^"]+)"/);
      const contentTypeMatch = headers.match(/Content-Type: ([^\r\n]+)/);
      parts.push({
        filename: filenameMatch?.[1] || "file",
        contentType: contentTypeMatch?.[1] || "application/octet-stream",
        data: body.slice(dataStart, dataEnd),
      });
    }

    start = nextBoundary === -1 ? body.length : nextBoundary;
  }

  return parts;
}

export default router;
