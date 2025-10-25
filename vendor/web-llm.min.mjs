// Minimaler Stub für WebLLM – nur für Fallback-Betrieb.
// Später durch das echte web-llm.min.mjs ersetzen!

export async function CreateMLCEngine(/* opts */) {
  throw new Error("WebLLM stub: kein echtes Engine-Modul geladen");
}

export default { CreateMLCEngine };
