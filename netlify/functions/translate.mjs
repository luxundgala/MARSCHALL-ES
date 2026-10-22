// Netlify Function: keeps the Gemini API key on the server and translates.
// Needs the environment variable GEMINI_API_KEY (Netlify → Site configuration → Environment variables).
// Optional: GEMINI_MODEL to use another Gemini model.

const SOURCE = { de: "German", en: "English" };

const SPANISH = {
  ar: {
    name: "Argentine Spanish (Rioplatense)",
    notes: "Use voseo naturally (vos tenés, podés, querés; imperatives like 'avisame', 'contame') where informal or neutral-friendly address fits; use 'usted' only if the source is clearly formal (e.g. German 'Sie' in a business letter). Use Argentine vocabulary (e.g. 'celular', 'computadora', 'auto', 'colectivo', 'departamento', 'turno' for appointments, 'Buen día'). Never use 'vosotros'.",
  },
  ve: {
    name: "Venezuelan Spanish",
    notes: "Use 'tú' for informal and 'usted' for formal address, matching the source register (German 'Sie' → usted). Use Venezuelan vocabulary and phrasing where natural (e.g. 'carro', 'celular', 'computadora', 'cita', 'chévere' only if clearly casual). Keep it warm and courteous, typical of Venezuelan professional communication. Never use 'vosotros' or voseo.",
  },
  cl: {
    name: "Chilean Spanish",
    notes: "Use standard 'tú' conjugation for informal (no Chilean verbal voseo like 'tenís' in a professional text) and 'usted' for formal, matching the source register. Use Chilean vocabulary where natural (e.g. 'auto', 'celular', 'computador', 'departamento', 'hora' for an appointment). Avoid heavy slang ('po', 'cachai', 'weón') unless the source is clearly casual slang. Never use 'vosotros'.",
  },
  co: {
    name: "Colombian Spanish",
    notes: "Colombian professional communication commonly uses 'usted', even among colleagues; use 'usted' unless the source is clearly casual between friends, then 'tú'. Use Colombian vocabulary and courtesy formulas where natural (e.g. 'carro', 'celular', 'computador', 'cita', 'con mucho gusto', 'quedo atento/a'). Avoid heavy slang ('parce', 'bacano') unless the source is clearly casual. Never use 'vosotros'.",
  },
};

const MAX_CHARS = 5000;

function buildPrompt(text, source, spanish, toSpanish) {
  const src = SOURCE[source], es = SPANISH[spanish];
  const from = toSpanish ? src : es.name;
  const to = toSpanish ? es.name : src;
  const rules = toSpanish
    ? es.notes
    : `The source is ${es.name}; understand its regional words, voseo and expressions correctly. Write natural, idiomatic ${src} as a native speaker would${source === "de" ? " (choose 'Sie' or 'du' to match the source register: usted → Sie, tú/vos among friends → du)" : ""}.`;
  return [
    `You are an expert native translator. Translate the text below from ${from} into ${to}.`,
    ``,
    `Style: professional and polished, but natural and human, the way an educated native speaker from that region would actually write it. Not stiff or robotic, not word-for-word, and not overly casual. Keep the meaning, tone, register, formatting, line breaks, names, numbers and emojis of the original.`,
    `Regional rules: ${rules}`,
    ``,
    `Reply with ONLY the translated text. No quotes, no notes, no explanations, no alternatives.`,
    ``,
    `Text:`,
    `<<<`,
    text,
    `>>>`,
  ].join("\n");
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Nur POST erlaubt." }, 405);

  const key = process.env.GEMINI_API_KEY;
  if (!key) return json({ error: "Server nicht eingerichtet: GEMINI_API_KEY fehlt bei Netlify." }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Ungültige Anfrage." }, 400); }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const { source, spanish } = body;
  const toSpanish = body.toSpanish !== false;
  if (!text) return json({ error: "Erst Text eingeben." }, 400);
  if (text.length > MAX_CHARS) return json({ error: `Maximal ${MAX_CHARS} Zeichen auf einmal.` }, 400);
  if (!SOURCE[source] || !SPANISH[spanish]) return json({ error: "Unbekannte Sprache." }, 400);

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildPrompt(text, source, spanish, toSpanish) }] }],
      generationConfig: { temperature: 0.3 },
    }),
  });

  if (res.status === 429) return json({ error: "Gratis-Limit kurz erreicht. Warte eine Minute und versuch es nochmal." }, 429);
  if (!res.ok) {
    console.error("Gemini error", res.status, await res.text());
    return json({ error: "Übersetzung fehlgeschlagen. Versuch es nochmal." }, 502);
  }

  const data = await res.json();
  const translation = (data.candidates?.[0]?.content?.parts || [])
    .map((p) => p.text || "")
    .join("")
    .trim();
  if (!translation) return json({ error: "Dieser Text konnte nicht übersetzt werden. Formuliere ihn anders." }, 502);

  return json({ translation });
};

export const config = { path: "/api/translate" };
