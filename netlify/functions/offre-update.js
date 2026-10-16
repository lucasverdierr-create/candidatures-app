// POST /api/offre-update  { id, fields: { Statut, "Notes d'appels", "Date de candidature" } }
import { json, checkPin, airtable, toOffre } from "../lib/common.js";

const EDITABLE = ["Statut", "Notes d'appels", "Date de candidature", "Date entretien"];

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  if (!checkPin(req)) return json({ error: "Code d'accès invalide" }, 401);
  try {
    const { id, fields = {} } = await req.json();
    if (!/^rec[A-Za-z0-9]{14}$/.test(id || "")) return json({ error: "id invalide" }, 400);
    const clean = {};
    for (const k of EDITABLE) if (k in fields) clean[k] = fields[k] === "" ? null : fields[k];
    const r = await airtable("/" + id, { method: "PATCH", body: JSON.stringify({ fields: clean, typecast: true }) });
    return json({ offre: toOffre(r) });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
};

export const config = { path: "/api/offre-update" };
