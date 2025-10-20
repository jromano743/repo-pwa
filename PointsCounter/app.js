const STORAGE_KEY = 'points_counter_v1';
const el = id => document.getElementById(id);
const $ = q => document.querySelector(q);

let participants = [];

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      console.log("Cargando desde caché...");
      return JSON.parse(raw);
    }
  } catch (e) {}
  return [];
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(participants));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function render() {
  const container = el('list');
  container.innerHTML = '';
  if (!participants.length) {
    container.innerHTML = '<small style="opacity:.6">No hay participantes</small>';
    return;
  }
  participants.forEach(p => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <div>${p.name} | <strong>${p.points}</strong></div>
      <div class="controls"></div>
    `;
    const controls = row.querySelector('.controls');
    [-5, -3, -1, 1, 3, 5].forEach(d => {
      const b = document.createElement('button');
      b.textContent = (d > 0 ? "+" : "") + d;
      b.onclick = () => {
        p.points += d;
        save();
        render();
      };
      controls.appendChild(b);
    });
    container.appendChild(row);
  });
}

el('addBtn').addEventListener('click', () => {
  const name = el('nameInput').value.trim();
  if (!name) return alert('Ingresa un nombre');
  participants.push({ id: uid(), name, points: 0 });
  save();
  el('nameInput').value = '';
  render();
});


window.addEventListener('DOMContentLoaded', () => {
  participants = load();
  render();
});


el('exportBtn').addEventListener('click', () => {
  const topList = [...participants].sort((a, b) => b.points - a.points).slice(0, 10);
  if (!topList.length) return alert("No hay participantes");

  const width = 800, rowH = 70, padding = 40, titleH = 80;
  const height = padding * 2 + titleH + topList.length * rowH;
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px Arial';
  ctx.fillText('TOP 10 — Puntos', padding, padding + 20);

  const medals = ['🥇', '🥈', '🥉'];

  topList.forEach((p, i) => {
    const y = padding + titleH + i * rowH;
    ctx.font = '28px Arial';
    ctx.fillText(i < 3 ? medals[i] : (i + 1) + '.', padding, y);
    ctx.fillText(p.name, padding + 80, y);
    ctx.textAlign = 'right';
    ctx.fillText(p.points, width - padding, y);
    ctx.textAlign = 'left';
  });

  c.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'top10.png';
    a.click();
    URL.revokeObjectURL(a.href);
  });
});