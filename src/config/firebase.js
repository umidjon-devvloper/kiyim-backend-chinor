import admin from "firebase-admin";

const initFirebase = () => {
  if (admin.apps.length > 0) return;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });

  console.log("✅ Firebase Admin initialized");
};

export const verifyFirebaseToken = async (idToken) => {
  try {
    console.log("🔐 Verifying Firebase token...");
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("✅ Token verified successfully");
    return decodedToken;
  } catch (error) {
    console.error("❌ Firebase token verification error:", {
      code: error.code,
      message: error.message,
    });
    throw new Error(
      `Firebase verification failed: ${error.code || error.message}`,
    );
  }
};

export default initFirebase;
