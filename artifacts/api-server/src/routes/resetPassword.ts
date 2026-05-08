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

// ── Firebase Admin SDK (only when FIREBASE_SERVICE_ACCOUNT is set) ────────────

function getServiceAccount() {
  const json = process.env["FIREBASE_SERVICE_ACCOUNT"];
  if (!json) return null;
  try {
    return JSON.parse(json) as Record<string, string>;
  } catch {
    return null;
  }
}

async function getAdminSdk() {
  const serviceAccount = getServiceAccount();
  if (!serviceAccount) return null;
  const adminModule = await import("firebase-admin");
  // Dynamic ESM import wraps the module — unwrap .default if needed
  const admin = (adminModule.default ?? adminModule) as typeof import("firebase-admin");
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: FIREBASE_DB_URL,
    });
  }
  return admin;
}

// ── Firebase RTDB REST helpers (no service account needed) ───────────────────

async function getUsersViaRest(): Promise<Record<string, Record<string, string>> | null> {
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/users.json`);
    if (!res.ok) return null;
    const data = await res.json() as Record<string, Record<string, string>> | null;
    return data;
  } catch {
    return null;
  }
}

async function writePendingResetViaRest(
  key: string,
  data: Record<string, unknown>
): Promise<boolean> {
  try {
    const res = await fetch(
      `${FIREBASE_DB_URL}/password_reset_requests/${key}.json`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

// ── Shared lookup (admin SDK first, REST fallback) ───────────────────────────

async function lookupUserByMatric(
  matricNo: string
): Promise<{ uid: string; name: string; email: string } | null> {
  const admin = await getAdminSdk();

  if (admin) {
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

  // Fallback: Firebase RTDB REST API (works if rules allow public read)
  const users = await getUsersViaRest();
  if (!users) return null;
  for (const [uid, user] of Object.entries(users)) {
    if (user["matricNo"]?.toLowerCase() === matricNo.toLowerCase()) {
      return { uid, name: user["name"], email: user["email"] };
    }
  }
  return null;
}

// ── Routes ───────────────────────────────────────────────────────────────────

router.get("/lookup-user", async (req, res) => {
  const { matricNo } = req.query;
  if (!matricNo || typeof matricNo !== "string") {
    res.status(400).json({ error: "matricNo is required" });
    return;
  }

  try {
    const user = await lookupUserByMatric(matricNo.trim());
    if (!user) {
      res.status(404).json({ error: "No account found with that matric number." });
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

  try {
    const user = await lookupUserByMatric(matricNo.trim());
    if (!user) {
      res.status(404).json({ error: "No account found with that matric number." });
      return;
    }

    // If Admin SDK is available, reset the password directly
    const admin = await getAdminSdk();
    if (admin) {
      await admin.auth().updateUser(user.uid, { password: newPassword });
      res.json({ success: true });
      return;
    }

    // No service account — store a pending reset request in RTDB so the admin
    // can see it in the dashboard and process it manually.
    const key = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const written = await writePendingResetViaRest(key, {
      uid: user.uid,
      name: user.name,
      matricNo: matricNo.trim(),
      status: "pending",
      timestamp: Date.now(),
      note: "Student requested password reset via forgot-password page",
    });

    if (written) {
      // pending: true tells the frontend to show the "contact admin" screen
      res.json({ pending: true });
    } else {
      // RTDB write also failed — likely the rules don't allow public writes
      res.status(503).json({
        error:
          "Password reset is not fully configured on this server. Please contact your administrator directly.",
        contactAdmin: true,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Reset failed";
    res.status(500).json({ error: msg });
  }
});

export default router;
