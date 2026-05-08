import { Router } from "express";

const router = Router();

const FIREBASE_API_KEY = "AIzaSyAKii-aOhj46hGn9JXmDlXvU8zItQ8CZsY";
const FIREBASE_DB_URL =
  "https://attendance-portal-659d6-default-rtdb.firebaseio.com";
const ADMIN_EMAIL = "pauladamu600@gmail.com";
const ADMIN_PASSWORD = "Admin@123";

function sanitizeEmail(matricNo: string): string {
  const normalized = matricNo
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]/g, "_");
  return `${normalized}@ids111.com`;
}

async function getAdminToken(): Promise<string> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        returnSecureToken: true,
      }),
    }
  );
  const data = (await response.json()) as { idToken?: string; error?: { message: string } };
  if (!data.idToken) {
    throw new Error(data.error?.message || "Admin authentication failed");
  }
  return data.idToken;
}

async function lookupUserByMatric(
  matricNo: string,
  adminToken: string
): Promise<{ uid: string; name: string; email: string; matricNo: string } | null> {
  const response = await fetch(
    `${FIREBASE_DB_URL}/users.json?auth=${adminToken}`
  );
  if (!response.ok) throw new Error("Failed to read database");
  const users = (await response.json()) as Record<string, Record<string, string>> | null;
  if (!users) return null;

  for (const [uid, user] of Object.entries(users)) {
    if (user.matricNo?.toLowerCase() === matricNo.toLowerCase()) {
      return { uid, name: user.name, email: user.email, matricNo: user.matricNo };
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

  try {
    const adminToken = await getAdminToken();
    const user = await lookupUserByMatric(matricNo.trim(), adminToken);
    if (!user) {
      res.status(404).json({ error: "No account found with that matric number" });
      return;
    }
    res.json({ name: user.name, uid: user.uid });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lookup failed";
    res.status(500).json({ error: msg });
  }
});

router.post("/reset-password", async (req, res) => {
  const { matricNo, newPassword } = req.body as { matricNo?: string; newPassword?: string };
  if (!matricNo || !newPassword) {
    res.status(400).json({ error: "matricNo and newPassword are required" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  try {
    const adminToken = await getAdminToken();
    const user = await lookupUserByMatric(matricNo.trim(), adminToken);
    if (!user) {
      res.status(404).json({ error: "No account found with that matric number" });
      return;
    }

    const serviceAccountJson = process.env["FIREBASE_SERVICE_ACCOUNT"];
    if (serviceAccountJson) {
      const admin = await import("firebase-admin");
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
          databaseURL: FIREBASE_DB_URL,
        });
      }
      await admin.auth().updateUser(user.uid, { password: newPassword });
      res.json({ success: true });
      return;
    }

    const email = sanitizeEmail(matricNo);
    const pendingRes = await fetch(
      `${FIREBASE_DB_URL}/password_reset_requests/${encodeURIComponent(matricNo.toLowerCase().replace(/[^a-z0-9]/g, "_"))}.json?auth=${adminToken}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matricNo: matricNo.trim(),
          email,
          uid: user.uid,
          name: user.name,
          newPassword,
          timestamp: Date.now(),
          status: "pending",
        }),
      }
    );

    if (!pendingRes.ok) {
      res.status(500).json({ error: "Could not submit request. Contact admin directly." });
      return;
    }

    res.json({
      success: false,
      pending: true,
      message:
        "Reset request submitted. Your administrator will process it shortly.",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Reset failed";
    res.status(500).json({ error: msg });
  }
});

export default router;
