// GET /api/offres          → liste des offres (triées par score)
// GET /api/offres?id=recX  → une seule offre
import { json, checkPin, airtable, toOffre } from "../lib/common.js";

export default async (req) => {
  if (!checkPin(req)) return json({ error: "Code d'accès invalide" }, 401);
  const url = new URL(req.url);
  try {
    const id = url.searchParams.get("id");
    if (id) {
      if (!/^rec[A-Za-z0-9]{14}$/.test(id)) return json({ error: "id invalide" }, 400);
      const r = await airtable("/" + id);
      return json({ offre: toOffre(r) });
    }
    const all = [];
    let offset = "";
    for (let i = 0; i < 10; i++) {
      const qs = new URLSearchParams({ pageSize: "100", "sort[0][field]": "Score", "sort[0][direction]": "desc" });
      if (offset) qs.set("offset", offset);
      const page = await airtable("?" + qs.toString());
      all.push(...page.records.map(toOffre));
      if (!page.offset) break;
      offset = page.offset;
    }
    return json({ offres: all });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
};

export const config = { path: "/api/offres" };
