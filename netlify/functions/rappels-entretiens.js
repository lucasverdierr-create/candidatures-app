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
    const res = await pushAll({
      title: diff === 3 ? `Entretien dans 3 jours · ${f.Entreprise || ""}` : `Entretien demain · ${f.Entreprise || ""}`,
      body: [f["Intitulé"], `${jour(when)} à ${heure(when)}`].filter(Boolean).join(" — ") + (diff === 3 ? ". Prépare ton pitch et tes questions." : ". Relis ta fiche ce soir."),
      url: `/?id=${r.id}`,
    });
    sent += res.sent;
  }
  return new Response(JSON.stringify({ ok: true, sent }), { headers: { "content-type": "application/json" } });
};

// tous les jours à 7h UTC (8h ou 9h à Paris selon l'heure d'été)
export const config = { schedule: "0 7 * * *" };
