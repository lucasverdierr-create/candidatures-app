// POST /api/subscribe { subscription } → enregistre l'iPhone pour les notifications
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";
import { json, checkPin } from "../lib/common.js";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  if (!checkPin(req)) return json({ error: "Code d'accès invalide" }, 401);
  const { subscription } = await req.json().catch(() => ({}));
  if (!subscription?.endpoint) return json({ error: "Abonnement invalide" }, 400);
  const key = createHash("sha256").update(subscription.endpoint).digest("hex");
  await getStore("push-subscriptions").setJSON(key, subscription);
  return json({ ok: true });
};

export const config = { path: "/api/subscribe" };
