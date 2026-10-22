(() => {
  const $ = (id) => document.getElementById(id);
  const textL = $("textL"), textR = $("textR"), langL = $("langL"), langR = $("langR");
  const panelL = $("panelL"), panelR = $("panelR"), go = $("go"), dirLabel = $("dirLabel"), status = $("status");

  const SRC = { de: "DE", en: "EN" };
  const ES = {
    ar: { short: "ES-AR", ph: "Escribí o pegá tu texto en español …" },
    ve: { short: "ES-VE", ph: "Escribe o pega tu texto en español …" },
    cl: { short: "ES-CL", ph: "Escribe o pega tu texto en español …" },
    co: { short: "ES-CO", ph: "Escribe o pega tu texto en español …" },
  };

  let dir = "toES";          // "toES" (links → rechts) or "fromES" (rechts → links)
  let lastCopied = "";
  let ctl = null, busy = false;

  function setDir(d) {
    dir = d;
    go.classList.toggle("rev", d === "fromES");
    panelL.classList.toggle("active", d === "toES");
    panelR.classList.toggle("active", d === "fromES");
    const a = SRC[langL.value], b = ES[langR.value].short;
    dirLabel.textContent = d === "toES" ? `${a} → ${b}` : `${b} → ${a}`;
  }
  function counts() {
    $("countL").textContent = textL.value.length + " Zeichen";
    $("countR").textContent = textR.value.length + " Zeichen";
  }
  function say(msg, err = false) { status.textContent = msg; status.classList.toggle("err", err); }

  async function translate() {
    if (busy) { ctl?.abort(); return; }
    const toES = dir === "toES";
    const srcEl = toES ? textL : textR, outEl = toES ? textR : textL;
    const text = srcEl.value.trim();
    if (!text) { say("Erst Text eingeben.", true); srcEl.focus(); return; }
    if (text.length > 5000) { say("Maximal 5000 Zeichen auf einmal.", true); return; }

    busy = true; ctl = new AbortController();
    go.classList.add("busy"); go.setAttribute("aria-label", "Stopp");
    say("Übersetze …");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, source: langL.value, spanish: langR.value, toSpanish: toES }),
        signal: ctl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Übersetzung fehlgeschlagen. Versuch es nochmal.");
      outEl.value = data.translation; counts();
      say("Fertig · " + dirLabel.textContent);
    } catch (e) {
      if (e.name === "AbortError") say("Gestoppt.");
      else say(e.message || "Verbindung unterbrochen. Versuch es nochmal.", true);
    } finally {
      busy = false; ctl = null;
      go.classList.remove("busy"); go.setAttribute("aria-label", "Übersetzen");
    }
  }

  async function copyFrom(el, btn) {
    const v = el.value;
    if (!v.trim()) { say("Nichts zum Kopieren.", true); return; }
    lastCopied = v;
    try {
      await navigator.clipboard.writeText(v);
      say("Kopiert.");
    } catch {
      el.focus(); el.select();
      say("Text markiert · mit ⌘/Strg + C kopieren.");
    }
    btn.classList.add("ok"); btn.textContent = "COPIED";
    setTimeout(() => { btn.classList.remove("ok"); btn.textContent = "COPY THIS SHIIT"; }, 1400);
  }

  async function addInto(el, side) {
    let v = "";
    try { v = await navigator.clipboard.readText(); } catch {}
    if (!v) v = lastCopied;
    if (v) {
      el.value = v; counts();
      setDir(side === "L" ? "toES" : "fromES");
      el.focus();
      say("Eingefügt · jetzt übersetzen.");
    } else {
      el.focus(); el.select();
      say("Feld ist bereit · mit ⌘/Strg + V einfügen.");
    }
  }

  textL.addEventListener("input", () => { setDir("toES"); counts(); });
  textR.addEventListener("input", () => { setDir("fromES"); counts(); });
  textL.addEventListener("focus", () => setDir("toES"));
  textR.addEventListener("focus", () => setDir("fromES"));
  for (const el of [textL, textR]) {
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); translate(); }
    });
  }
  langL.addEventListener("change", () => setDir(dir));
  langR.addEventListener("change", () => {
    textR.placeholder = ES[langR.value].ph;
    setDir(dir);
  });
  go.addEventListener("click", translate);
  $("copyL").addEventListener("click", (e) => copyFrom(textL, e.currentTarget));
  $("copyR").addEventListener("click", (e) => copyFrom(textR, e.currentTarget));
  $("addL").addEventListener("click", () => addInto(textL, "L"));
  $("addR").addEventListener("click", () => addInto(textR, "R"));

  setDir("toES"); counts();
})();
