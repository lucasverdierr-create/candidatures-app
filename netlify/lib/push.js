// Envoi d'une notification à tous les iPhone abonnés
import { getStore } from "@netlify/blobs";
import webpush from "web-push";

export async function pushAll(payload) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contact@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
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
  return { sent, removed };
}
