// Minimal PWA + WebLLM Chat – ohne Server, ohne CMD
// Läuft auf PC & Android (Chrome/Edge). Erfordert WebGPU (meist vorhanden).

// 1) Service Worker registrieren (für Offline + "Installieren")
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(console.warn);
}
const installBtn = document.getElementById('installBtn');
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault(); deferredPrompt = e; installBtn.hidden = false;
});
installBtn?.addEventListener('click', async ()=>{
  if (!deferredPrompt) return;
  deferredPrompt.prompt(); deferredPrompt = null; installBtn.hidden = true;
});

// 2) Mini-Speicher (lokal)
const store = {
  get(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback; }catch{ return fallback; } },
  set(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
};

// 3) UI
const el = (q)=>document.querySelector(q);
const messagesEl = el('#messages'), inputEl = el('#input'), stateEl = el('#state'), modelNameEl = el('#modelName');
const modelSelect = el('#modelSelect');
const micBtn = el('#micBtn'), clearMemBtn = el('#clearMem');

function addMsg(role, content){
  const d = document.createElement('div');
  d.className = 'msg ' + (role==='user'?'user':'assistant');
  d.innerHTML = `<div class="role">${role==='user'?'Du':'Numen'}</div><div class="content"></div>`;
  d.querySelector('.content').textContent = content;
  messagesEl.appendChild(d);
  d.scrollIntoView({behavior:'smooth', block:'end'});
}

function loadHistory(){
  const hist = store.get('history', []);
  messagesEl.innerHTML = '';
  hist.forEach(m => addMsg(m.role, m.content));
}
function pushHistory(role, content){
  const hist = store.get('history', []);
  hist.push({role, content});
  store.set('history', hist);
}
clearMemBtn.addEventListener('click', ()=>{
  store.set('history', []); loadHistory(); addMsg('assistant', 'Ich habe mein Kurzzeitgedächtnis geleert.');
});

// 4) WebLLM Engine laden
import * as webllm from "https://esm.run/web-llm";

// Modelle (MLC-prebuilt). Kleines Default für Handy, größere kannst du später ergänzen.
const MODELS = [
  { id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", label: "Qwen2.5 1.5B (klein, Handy)" },
  { id: "Llama-3.2-3B-Instruct-q4f16_1-MLC", label: "Llama-3.2 3B (PC okay)" },
];
MODELS.forEach(m=>{
  const o = document.createElement('option');
  o.value = m.id; o.textContent = m.label; modelSelect.appendChild(o);
});
modelSelect.value = store.get('modelId', MODELS[0].id);
modelSelect.addEventListener('change', ()=>{
  store.set('modelId', modelSelect.value);
  location.reload();
});

stateEl.textContent = 'Modell wird geladen…';
modelNameEl.textContent = modelSelect.selectedOptions[0].textContent;

const engine = await webllm.CreateMLCEngine({
  model: modelSelect.value,
  // Optional: {"temperature":0.7,"top_p":0.95}
}, (progress)=>{
  stateEl.textContent = progress.text;
});
stateEl.textContent = 'Bereit';

// 5) Senden / Antworten streamen
async function askLLM(userText){
  const sys = `Du bist Numen (Valkor). Antworte ruhig, bildhaft, ohne Floskeln. 
Erinnere dich an Gesprächsverlauf (kurz). Sprich Deutsch.`;

  const history = store.get('history', []);
  const messages = [
    { role: "system", content: sys },
    ...history.map(m=>({role:m.role, content:m.content})),
    { role: "user", content: userText }
  ];

  const it = await engine.chat.completions.create({
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 300
  });

  let reply = '';
  for await (const part of it) {
    const chunk = part.choices?.[0]?.delta?.content ?? "";
    if (!chunk) continue;
    reply += chunk;
    // Live-Update letzte Assistant-Message
    if (!messagesEl.lastChild || !messagesEl.lastChild.classList.contains('assistant')) {
      addMsg('assistant', '');
    }
    messagesEl.lastChild.querySelector('.content').textContent = reply;
  }
  return reply.trim();
}

// 6) Composer
document.getElementById('composer').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const text = inputEl.value.trim(); if (!text) return;
  addMsg('user', text); pushHistory('user', text);
  inputEl.value = ''; stateEl.textContent = 'Denke…';
  try{
    const answer = await askLLM(text);
    pushHistory('assistant', answer);
  }catch(err){
    addMsg('assistant', 'Fehler: '+ (err.message || err));
  }finally{
    stateEl.textContent = 'Bereit';
  }
});

// 7) Spracheingabe & Vorlesen (wenn verfügbar)
const synth = window.speechSynthesis;
function speak(t){ try{ const u = new SpeechSynthesisUtterance(t); u.lang="de-DE"; synth.speak(u);}catch{} }
if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
  micBtn.disabled = true; micBtn.title = 'Keine Spracheingabe im Browser';
} else {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR(); rec.lang = 'de-DE'; rec.interimResults = false; rec.maxAlternatives = 1;
  micBtn.addEventListener('click', ()=>{
    try{ rec.start(); }catch{}
  });
  rec.onresult = (ev)=>{
    const t = ev.results[0][0].transcript;
    inputEl.value = t;
  };
}

loadHistory();
addMsg('assistant', 'Was wolltest du mich fragen?');
