// POST /api/notify { id }  (appelé par Make, en-tête x-make-secret)
// Lit l'offre dans Airtable et envoie une notification à tous les iPhone abonnés.
import { getStore } from "@netlify/blobs";
import webpush from "web-push";
import { json, checkMakeSecret, airtable } from "../lib/common.js";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  if (!checkMakeSecret(req)) return json({ error: "Secret Make invalide" }, 401);

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contact@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const { id, title, body } = await req.json().catch(() => ({}));
  let payload = { title: title || "Nouvelle offre", body: body || "", url: "/" };

  if (/^rec[A-Za-z0-9]{14}$/.test(id || "")) {
    try {
      const r = await airtable("/" + id);
      const f = r.fields;
      payload = {
        title: `${f.Score ?? "?"}/100 · ${f.Entreprise || "Nouvelle offre"}`,
        body: [f["Intitulé"], f.Ville].filter(Boolean).join(" — "),
        url: `/?id=${id}`,
      };
    } catch (e) {
      payload.body = payload.body || "Une nouvelle offre est arrivée";
    }
  }

  const store = getStore("push-subscriptions");
  const { blobs } = await store.list();
  let sent = 0, removed = 0;
  for (const b of blobs) {
    const sub = await store.get(b.key, { type: "json" });
    if (!sub) continue;
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 86400, urgency: "high" });
      sent++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) { await store.delete(b.key); removed++; }
    }
  }
  return json({ ok: true, sent, removed });
};

export const config = { path: "/api/notify" };
