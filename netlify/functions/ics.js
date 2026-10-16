// GET /api/ics?id=recX&k=CODE → fichier calendrier (.ics) de l'entretien, avec alertes J-3 et J-1
import { airtable } from "../lib/common.js";
import { timingSafeEqual } from "node:crypto";

const ok = (a, b) => { const A = Buffer.from(String(a)), B = Buffer.from(String(b)); return A.length === B.length && timingSafeEqual(A, B); };
const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => "\\" + c);

export default async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";
  if (!process.env.APP_PIN || !ok(url.searchParams.get("k") || "", process.env.APP_PIN)) return new Response("Accès refusé", { status: 401 });
  if (!/^rec[A-Za-z0-9]{14}$/.test(id)) return new Response("id invalide", { status: 400 });
  const f = (await airtable("/" + id)).fields;
  if (!f["Date entretien"]) return new Response("Pas de date d'entretien", { status: 404 });
  const start = new Date(f["Date entretien"]);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Candidatures Lucas//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${id}-entretien@candidatures`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(`Entretien — ${f.Entreprise || ""} (${f["Intitulé"] || ""})`)}`,
    `DESCRIPTION:${esc(`Fiche de préparation : ${url.origin}/?id=${id}`)}`,
    f.Ville ? `LOCATION:${esc(f.Ville)}` : "",
    `URL:${url.origin}/?id=${id}`,
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Entretien dans 3 jours", "TRIGGER:-P3D", "END:VALARM",
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Entretien demain", "TRIGGER:-P1D", "END:VALARM",
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Entretien dans 1 heure", "TRIGGER:-PT1H", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
  return new Response(ics, {
    headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `inline; filename="entretien.ics"`, "cache-control": "no-store" },
  });
};

export const config = { path: "/api/ics" };
