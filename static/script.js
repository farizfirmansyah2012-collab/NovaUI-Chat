// ============================================================
// NovaChat — logic dasar UI + integrasi API asli (butuh API key)
// ============================================================

// ===== ELEMENTS =====
const historyPanel = document.getElementById('historyPanel');
const workspacePanel = document.getElementById('workspacePanel');
const backdrop = document.getElementById('backdrop');
const openHistory = document.getElementById('openHistory');
const closeHistory = document.getElementById('closeHistory');
const openWorkspace = document.getElementById('openWorkspace');
const closeWorkspace = document.getElementById('closeWorkspace');

const newChatBtn = document.getElementById('newChatBtn');
const chatList = document.getElementById('chatList');
const chatTitle = document.getElementById('chatTitle');
const emptyState = document.getElementById('emptyState');
const greetingText = document.getElementById('greetingText');
const messagesEl = document.getElementById('messages');
const composerInput = document.getElementById('composerInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');

const modelSelect = document.getElementById('modelSelect');
const modelBadge = document.getElementById('modelBadge');
const tempSlider = document.getElementById('tempSlider');
const tempValue = document.getElementById('tempValue');
const tokenFill = document.getElementById('tokenFill');
const tokenUsed = document.getElementById('tokenUsed');

const apiKeyBlock = document.getElementById('apiKeyBlock');
const apiKeyToggle = document.getElementById('apiKeyToggle');
const apiKeyContent = document.getElementById('apiKeyContent');
const apiKeyInput = document.getElementById('apiKeyInput');
const toggleKeyVisibility = document.getElementById('toggleKeyVisibility');
const apiKeyDot = document.getElementById('apiKeyDot');
const apiKeyStatusText = document.getElementById('apiKeyStatusText');

// Kunci disimpan HANYA di memori (variabel JS), tidak di localStorage —
// jadi otomatis hilang saat halaman ditutup/refresh. Ini sengaja, demi keamanan.
let apiKey = '';
let conversation = []; // riwayat pesan untuk dikirim sebagai konteks ke API

// ===== SAPAAN SESUAI WAKTU =====
function getGreeting(){
  const h = new Date().getHours();
  if(h >= 4 && h < 11) return 'Selamat pagi';
  if(h >= 11 && h < 15) return 'Selamat siang';
  if(h >= 15 && h < 18) return 'Selamat sore';
  return 'Selamat malam';
}
greetingText.textContent = `${getGreeting()}, User`;

// ===== MOBILE DRAWERS =====
function openDrawer(panel){
  panel.classList.add('open');
  backdrop.classList.add('show');
}
function closeDrawers(){
  historyPanel.classList.remove('open');
  workspacePanel.classList.remove('open');
  backdrop.classList.remove('show');
}
openHistory?.addEventListener('click', () => openDrawer(historyPanel));
closeHistory?.addEventListener('click', closeDrawers);
openWorkspace?.addEventListener('click', () => openDrawer(workspacePanel));
closeWorkspace?.addEventListener('click', closeDrawers);
backdrop?.addEventListener('click', closeDrawers);

// ===== API KEY: buka/tutup + tampilkan/sembunyikan =====
apiKeyToggle.addEventListener('click', () => {
  const isHidden = apiKeyContent.hidden;
  apiKeyContent.hidden = !isHidden;
  apiKeyBlock.classList.toggle('open', isHidden);
});

toggleKeyVisibility.addEventListener('click', () => {
  apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
});

apiKeyInput.addEventListener('input', () => {
  apiKey = apiKeyInput.value.trim();
  const connected = apiKey.length > 0;
  apiKeyDot.classList.toggle('on', connected);
  apiKeyDot.classList.toggle('off', !connected);
  apiKeyStatusText.textContent = connected ? 'Terhubung — siap digunakan' : 'Belum terhubung';
});

function flashApiKeyAttention(){
  apiKeyContent.hidden = false;
  apiKeyBlock.classList.add('open');
  apiKeyBlock.classList.add('attention');
  openDrawer(workspacePanel); // di mobile, otomatis buka panel workspace
  setTimeout(() => apiKeyBlock.classList.remove('attention'), 2900);
  apiKeyInput.focus();
}

// ===== NEW CHAT =====
function resetToEmptyState(){
  conversation = [];
  messagesEl.innerHTML = '';
  messagesEl.hidden = true;
  emptyState.hidden = false;
  greetingText.textContent = `${getGreeting()}, Fariz`;
  chatTitle.textContent = 'Obrolan Baru';
}

newChatBtn.addEventListener('click', () => {
  document.querySelectorAll('#chatList .item').forEach(i => i.classList.remove('active'));

  const newItem = document.createElement('a');
  newItem.className = 'item active';
  newItem.href = '#';
  newItem.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 8.5 8.5 0 0 1-3.8-.9L3 20l1.1-4.3a8.4 8.4 0 0 1-.9-3.8 8.4 8.4 0 0 1 8.4-8.4h.3a8.4 8.4 0 0 1 8 8.9v.1z"/></svg>
    Obrolan Baru
  `;
  chatList.prepend(newItem);

  resetToEmptyState();
  closeDrawers();
});

// klik item riwayat (demo: karena tidak ada backend, isi pesan lama tidak tersimpan)
chatList.addEventListener('click', (e) => {
  const item = e.target.closest('.item');
  if(!item) return;
  e.preventDefault();
  document.querySelectorAll('#chatList .item').forEach(i => i.classList.remove('active'));
  item.classList.add('active');
  resetToEmptyState();
  chatTitle.textContent = item.textContent.trim();
  closeDrawers();
});

// ===== SUGGESTION CARDS (empty state) =====
document.querySelectorAll('.suggestion-card').forEach(card => {
  card.addEventListener('click', () => {
    composerInput.value = card.dataset.prompt;
    sendMessage();
  });
});

// ===== COMPOSER: auto-resize textarea =====
composerInput.addEventListener('input', () => {
  composerInput.style.height = 'auto';
  composerInput.style.height = Math.min(composerInput.scrollHeight, 160) + 'px';
});

composerInput.addEventListener('keydown', (e) => {
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault();
    sendMessage();
  }
});
sendBtn.addEventListener('click', sendMessage);

function currentTime(){
  const d = new Date();
  return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
}

function appendMessage(role, html){
  const wrap = document.createElement('div');
  wrap.className = `msg ${role}`;
  if(role === 'assistant'){
    wrap.innerHTML = `
      <div class="msg-avatar ai">N</div>
      <div class="msg-bubble"><p>${html}</p><span class="msg-time">${currentTime()}</span></div>
    `;
  } else if(role === 'error'){
    wrap.className = 'msg assistant';
    wrap.innerHTML = `
      <div class="msg-avatar ai">N</div>
      <div class="msg-bubble" style="border-color:rgba(244,63,94,0.4);background:rgba(244,63,94,0.08);">
        <p>${html}</p><span class="msg-time">${currentTime()}</span>
      </div>
    `;
  } else {
    wrap.innerHTML = `
      <div class="msg-bubble"><p>${html}</p><span class="msg-time">${currentTime()}</span></div>
      <div class="msg-avatar user">FA</div>
    `;
  }
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ===== KONFIGURASI PROVIDER =====
// Setiap model dipetakan ke provider + nama model API-nya.
// Catatan: sebagian provider (mis. Anthropic) membatasi permintaan langsung
// dari browser (CORS). Jika terjadi error CORS di production, gunakan
// backend kecil sebagai proxy alih-alih memanggil API langsung dari klien.
const MODEL_CONFIG = {
  'GPT-5':           { provider: 'openai',     model: 'gpt-5' },
  'Claude Sonnet 5': { provider: 'anthropic',  model: 'claude-sonnet-5' },
  'Gemini 3 Pro':    { provider: 'gemini',     model: 'gemini-3-pro' },
  'Llama 4':         { provider: 'openrouter', model: 'meta-llama/llama-4' }
};

async function callOpenAI(key, model, messages, temperature){
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model, messages, temperature })
  });
  if(!res.ok){ const e = await res.text(); throw new Error(`OpenAI (${res.status}): ${e.slice(0,200)}`); }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callAnthropic(key, model, messages, temperature){
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({ model, max_tokens: 1024, temperature, messages })
  });
  if(!res.ok){ const e = await res.text(); throw new Error(`Anthropic (${res.status}): ${e.slice(0,200)}`); }
  const data = await res.json();
  return data.content.map(b => b.text || '').join('\n');
}

async function callGemini(key, model, messages, temperature){
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, generationConfig: { temperature } })
  });
  if(!res.ok){ const e = await res.text(); throw new Error(`Gemini (${res.status}): ${e.slice(0,200)}`); }
  const data = await res.json();
  return data.candidates[0].content.parts.map(p => p.text || '').join('\n');
}

async function callOpenRouter(key, model, messages, temperature){
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model, messages, temperature })
  });
  if(!res.ok){ const e = await res.text(); throw new Error(`OpenRouter (${res.status}): ${e.slice(0,200)}`); }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function askAI(userText){
  const config = MODEL_CONFIG[modelSelect.value];
  const temperature = parseFloat(tempSlider.value);

  conversation.push({ role: 'user', content: userText });

  let reply;
  if(config.provider === 'openai') reply = await callOpenAI(apiKey, config.model, conversation, temperature);
  else if(config.provider === 'anthropic') reply = await callAnthropic(apiKey, config.model, conversation, temperature);
  else if(config.provider === 'gemini') reply = await callGemini(apiKey, config.model, conversation, temperature);
  else if(config.provider === 'openrouter') reply = await callOpenRouter(apiKey, config.model, conversation, temperature);
  else throw new Error('Provider tidak dikenali.');

  conversation.push({ role: 'assistant', content: reply });
  return reply;
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function sendMessage(){
  const text = composerInput.value.trim();
  if(!text) return;

  // Pindah dari empty state ke tampilan chat normal — dilakukan SEBELUM
  // pengecekan apa pun, supaya sambutan selalu hilang begitu user mengirim.
  if(!emptyState.hidden){
    emptyState.hidden = true;
    messagesEl.hidden = false;
  }

  appendMessage('user', escapeHtml(text));
  composerInput.value = '';
  composerInput.style.height = 'auto';
  messagesEl.scrollTop = messagesEl.scrollHeight;

  if(!apiKey){
    flashApiKeyAttention();
    appendMessage('error', 'Kamu belum memasukkan API key. Buka panel "API Key" di AI Workspace, tempel key kamu di sana, lalu kirim pesan lagi.');
    return;
  }

  typingIndicator.hidden = false;
  messagesEl.scrollTop = messagesEl.scrollHeight;

  try{
    const reply = await askAI(text);
    typingIndicator.hidden = true;
    appendMessage('assistant', escapeHtml(reply).replace(/\n/g, '<br>'));
    bumpTokenUsage();
  }catch(err){
    typingIndicator.hidden = true;
    appendMessage('error', `Gagal menghubungi AI: ${escapeHtml(err.message)}. Periksa API key dan koneksi kamu.`);
  }
}

// ===== WORKSPACE: model / temperature / tokens =====
modelSelect.addEventListener('change', () => {
  modelBadge.textContent = modelSelect.value;
});

tempSlider.addEventListener('input', () => {
  const v = parseFloat(tempSlider.value);
  tempValue.textContent = v.toFixed(1);
  const pct = v * 100;
  tempSlider.style.background = `linear-gradient(90deg, var(--nova) ${pct}%, rgba(255,255,255,0.1) ${pct}%)`;
});

let tokensUsedK = 1.2; // selaras dengan tampilan awal "1.2K" di HTML
function bumpTokenUsage(){
  tokensUsedK = Math.min(8, tokensUsedK + (Math.random()*0.3 + 0.1));
  tokenUsed.textContent = tokensUsedK.toFixed(1) + 'K';
  tokenFill.style.width = Math.min(100, (tokensUsedK/8)*100) + '%';
}

// ===== PROMPT LIBRARY CHIPS =====
document.querySelectorAll('.prompt-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    composerInput.value = chip.dataset.prompt + ' ';
    composerInput.focus();
    composerInput.style.height = 'auto';
    composerInput.style.height = Math.min(composerInput.scrollHeight, 160) + 'px';
    closeDrawers();
  });
});
