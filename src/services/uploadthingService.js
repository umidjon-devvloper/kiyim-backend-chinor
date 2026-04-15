import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export const deleteFile = async (key) => {
  if (!key) return;
  try {
    await utapi.deleteFiles(key);
  } catch (error) {
    console.error(`UploadThing delete error for key ${key}:`, error.message);
  }
};

export const deleteFiles = async (keys) => {
  if (!keys || keys.length === 0) return;
  try {
    await utapi.deleteFiles(keys);
  } catch (error) {
    console.error("UploadThing bulk delete error:", error.message);
  }
};

export const getFileUrl = (key) => {
  return `https://utfs.io/f/${key}`;
};
