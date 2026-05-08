import { Router } from "express";

const router = Router();

const FIREBASE_DB_URL =
  "https://attendance-portal-659d6-default-rtdb.firebaseio.com";

function sanitizeMatric(matricNo: string): string {
  const normalized = matricNo
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]/g, "_");
  return `${normalized}@ids111.com`;
}

function getAdminApp() {
  const serviceAccountJson = process.env["FIREBASE_SERVICE_ACCOUNT"];
  if (!serviceAccountJson) return null;
  return JSON.parse(serviceAccountJson) as Record<string, string>;
}

async function getAdminSdk() {
  const serviceAccount = getAdminApp();
  if (!serviceAccount) return null;
  const admin = await import("firebase-admin");
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: FIREBASE_DB_URL,
    });
  }
  return admin;
}

async function lookupUserByMatric(
  matricNo: string
): Promise<{ uid: string; name: string; email: string } | null> {
  const admin = await getAdminSdk();
  if (!admin) throw new Error("SERVICE_ACCOUNT_REQUIRED");

  const db = admin.database();
  const snap = await db.ref("users").once("value");
  const users = snap.val() as Record<string, Record<string, string>> | null;
  if (!users) return null;

  for (const [uid, user] of Object.entries(users)) {
    if (user["matricNo"]?.toLowerCase() === matricNo.toLowerCase()) {
      return { uid, name: user["name"], email: user["email"] };
    }
  }
  return null;
}

router.get("/lookup-user", async (req, res) => {
  const { matricNo } = req.query;
  if (!matricNo || typeof matricNo !== "string") {
    res.status(400).json({ error: "matricNo is required" });
    return;
  }

  if (!process.env["FIREBASE_SERVICE_ACCOUNT"]) {
    res.status(503).json({
      error: "Password reset is not configured. Please contact your administrator.",
    });
    return;
  }

  try {
    const user = await lookupUserByMatric(matricNo.trim());
    if (!user) {
      res.status(404).json({ error: "No account found with that matric number" });
      return;
    }
    res.json({ name: user.name });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lookup failed";
    res.status(500).json({ error: msg });
  }
});

router.post("/reset-password", async (req, res) => {
  const { matricNo, newPassword } = req.body as {
    matricNo?: string;
    newPassword?: string;
  };

  if (!matricNo || !newPassword) {
    res.status(400).json({ error: "matricNo and newPassword are required" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  if (!process.env["FIREBASE_SERVICE_ACCOUNT"]) {
    res.status(503).json({
      error: "Password reset is not configured. Please contact your administrator.",
      contactAdmin: true,
    });
    return;
  }

  try {
    const user = await lookupUserByMatric(matricNo.trim());
    if (!user) {
      res.status(404).json({ error: "No account found with that matric number" });
      return;
    }

    const admin = await getAdminSdk();
    if (!admin) {
      res.status(503).json({ error: "Service not configured" });
      return;
    }

    await admin.auth().updateUser(user.uid, { password: newPassword });
    res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Reset failed";
    res.status(500).json({ error: msg });
  }
});

export default router;
