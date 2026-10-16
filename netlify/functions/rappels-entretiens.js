// Fonction planifiée : chaque matin, rappel des entretiens à J-3 et J-1
import { airtable } from "../lib/common.js";
import { pushAll } from "../lib/push.js";

const parisDay = (d) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(d); // AAAA-MM-JJ
const heure = (d) => new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(d);
const jour = (d) => new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" }).format(d);

export default async () => {
  const qs = new URLSearchParams({ filterByFormula: "NOT({Date entretien}='')", pageSize: "100" });
  const { records } = await airtable("?" + qs.toString());
  const today = new Date(parisDay(new Date()) + "T12:00:00Z");
  let sent = 0;
  for (const r of records) {
    const f = r.fields;
    if (["Refus", "Écartée"].includes(f.Statut)) continue;
    const when = new Date(f["Date entretien"]);
    const diff = Math.round((new Date(parisDay(when) + "T12:00:00Z") - today) / 86400000);
    if (diff !== 3 && diff !== 1) continue;
    const poste = f["Intitulé"] || "Entretien";
    const res = await pushAll(diff === 3 ? {
      title: `📅 Entretien dans 3 jours · ${f.Entreprise || ""}`,
      body: `${poste} — ${jour(when)} à ${heure(when)}\nRelis ton pitch et prépare tes questions.`,
      url: `/?id=${r.id}`, tag: `itv3-${r.id}`,
    } : {
      title: `⏰ Entretien demain à ${heure(when)} · ${f.Entreprise || ""}`,
      body: `${[poste, f.Ville].filter(Boolean).join(" — ")}\nRelis ta fiche ce soir, tout est dans l'app.`,
      url: `/?id=${r.id}`, tag: `itv1-${r.id}`,
    });
    sent += res.sent;
  }
  return new Response(JSON.stringify({ ok: true, sent }), { headers: { "content-type": "application/json" } });
};

// tous les jours à 7h UTC (8h ou 9h à Paris selon l'heure d'été)
export const config = { schedule: "0 7 * * *" };
