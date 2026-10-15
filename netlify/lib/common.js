// Outils partagés par les fonctions Netlify
import { timingSafeEqual } from "node:crypto";

const env = (k) => process.env[k] || "";

export const AIRTABLE_URL = () =>
  `https://api.airtable.com/v0/${env("AIRTABLE_BASE_ID")}/${encodeURIComponent(env("AIRTABLE_TABLE") || "Candidatures")}`;

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function safeEqual(a, b) {
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  return A.length === B.length && timingSafeEqual(A, B);
}

// Vérifie le code d'accès envoyé par l'app (en-tête x-app-pin)
export function checkPin(req) {
  const pin = env("APP_PIN");
  if (!pin) return false;
  return safeEqual(req.headers.get("x-app-pin") || "", pin);
}

// Vérifie le secret partagé avec Make (en-tête x-make-secret)
export function checkMakeSecret(req) {
  const s = env("MAKE_SECRET");
  if (!s) return false;
  return safeEqual(req.headers.get("x-make-secret") || "", s);
}

export async function airtable(path = "", init = {}) {
  const res = await fetch(AIRTABLE_URL() + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${env("AIRTABLE_TOKEN")}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.error?.message || body?.error?.type || res.statusText;
    throw new Error(`Airtable ${res.status} : ${msg}`);
  }
  return body;
}

export const toOffre = (r) => ({ id: r.id, createdTime: r.createdTime, ...r.fields });
