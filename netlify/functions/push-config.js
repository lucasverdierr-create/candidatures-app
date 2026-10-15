// GET /api/push-config → clé publique VAPID pour l'abonnement aux notifications
import { json, checkPin } from "../lib/common.js";

export default async (req) => {
  if (!checkPin(req)) return json({ error: "Code d'accès invalide" }, 401);
  return json({ publicKey: process.env.VAPID_PUBLIC_KEY || "" });
};

export const config = { path: "/api/push-config" };
