// POST /api/notify { id }  (appelé par Make, en-tête x-make-secret)
import { json, checkMakeSecret, airtable } from "../lib/common.js";
import { pushAll } from "../lib/push.js";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  if (!checkMakeSecret(req)) return json({ error: "Secret Make invalide" }, 401);

  const { id, title, body } = await req.json().catch(() => ({}));
  let payload = { title: title || "Nouvelle offre", body: body || "", url: "/" };

  if (/^rec[A-Za-z0-9]{14}$/.test(id || "")) {
    try {
      const f = (await airtable("/" + id)).fields;
      payload = {
        title: `${f.Score ?? "?"}/100 · ${f.Entreprise || "Nouvelle offre"}`,
        body: [f["Intitulé"], f.Ville].filter(Boolean).join(" — "),
        url: `/?id=${id}`,
      };
    } catch {
      payload.body = payload.body || "Une nouvelle offre est arrivée";
    }
  }
  return json({ ok: true, ...(await pushAll(payload)) });
};

export const config = { path: "/api/notify" };
