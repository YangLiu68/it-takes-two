// DOM overlay: level info, collectibles, partner marker, prompts, toasts.

const $ = (id) => document.getElementById(id);

// The face that jumps out at you: pale, hollow eyes, a long dark mouth.
function drawScareFace(c) {
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  const skin = ctx.createRadialGradient(W * 0.5, H * 0.42, 20, W * 0.5, H * 0.5, W * 0.42);
  skin.addColorStop(0, '#e8e4da');
  skin.addColorStop(0.6, '#a9a59a');
  skin.addColorStop(1, '#1a1918');
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(W * 0.5, H * 0.52, W * 0.3, H * 0.44, 0.04, 0, Math.PI * 2);
  ctx.fill();
  // Hollow eyes with tiny pinprick pupils.
  for (const [x, tilt] of [[0.37, -0.25], [0.63, 0.3]]) {
    const g = ctx.createRadialGradient(W * x, H * 0.4, 4, W * x, H * 0.4, W * 0.11);
    g.addColorStop(0, '#000');
    g.addColorStop(0.75, '#050505');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(W * x, H * 0.4, W * 0.1, H * 0.085, tilt, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fffbe8';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(W * x + (x < 0.5 ? 6 : -4), H * 0.41, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  // Long stretched mouth with a ragged edge.
  ctx.fillStyle = '#000';
  ctx.beginPath();
  const cx = W * 0.5, top = H * 0.6, bot = H * 0.9, hw = W * 0.09;
  ctx.moveTo(cx - hw, top);
  for (let i = 0; i <= 10; i++) ctx.lineTo(cx - hw + (i / 10) * hw * 2, top + (i % 2 ? 9 : -4));
  ctx.quadraticCurveTo(cx + hw * 1.3, (top + bot) / 2, cx + hw * 0.4, bot);
  ctx.quadraticCurveTo(cx, bot + 12, cx - hw * 0.4, bot);
  ctx.quadraticCurveTo(cx - hw * 1.3, (top + bot) / 2, cx - hw, top);
  ctx.fill();
  // Cracks and grime.
  ctx.strokeStyle = 'rgba(20, 15, 12, 0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    let x = W * (0.3 + Math.random() * 0.4), y = H * (0.15 + Math.random() * 0.7);
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 5; k++) {
      x += (Math.random() - 0.5) * 30;
      y += Math.random() * 22;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const v = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.7);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.95)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

export class Hud {
  constructor() {
    this.root = $('hud');
    this.levelName = $('hud-level-name');
    this.levelNum = $('hud-level-num');
    this.progress = $('hud-progress');
    this.gemCount = $('hud-gem-count');
    this.gemTotal = $('hud-gem-total');
    this.gemPill = $('hud-gems');
    this.ping = $('hud-ping');
    this.net = $('hud-net');
    this.toasts = $('hud-toasts');
    this.hintEl = $('hud-hint');
    this.promptEl = $('hud-prompt');
    this.reticleEl = $('reticle');
    this.tag = $('partner-tag');
    this.tagName = this.tag.querySelector('.name');
    this.tagDist = this.tag.querySelector('.dist');
    this.arrow = $('partner-arrow');
    this.statusEl = $('hud-status');
    this.fadeEl = $('fade');
    this.countEl = $('countdown');
    this.titleCard = $('title-card');
    this.clickToPlay = $('click-to-play');
    this.notesPill = $('hud-notes');
    this.notesCount = $('hud-notes-count');
    this.carryPill = $('hud-carry');
    this.objectiveEl = $('hud-objective');
    this.subtitleEl = $('hud-subtitle');
    this.storyEl = $('story-card');
    this.noteEl = $('note-card');
    this.scareEl = $('scare');
    drawScareFace(this.scareEl.querySelector('canvas'));
    this.journal = [];
    this.storyTimer = 0;
    this.noteTimer = 0;
    this.subTimer = 0;
    this.storyEl.querySelector('.sc-close').addEventListener('click', () => this.closeStory());
    this.noteEl.querySelector('.nc-close').addEventListener('click', () => this.noteEl.classList.remove('on'));
    this.notesPill.addEventListener('click', () => this.openJournal());
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyJ' && !this.root.hidden && !(e.target instanceof HTMLInputElement)) {
        if (this.storyEl.classList.contains('on')) this.closeStory();
        else this.openJournal();
      }
    });
    this.hintTimer = 0;
    this.lastPrompt = null;
    this.lastStatus = null;
    this.progressDots = [];
  }

  show(v) {
    this.root.hidden = !v;
  }

  setLevel(label, name, segments, colors) {
    this.levelNum.textContent = label;
    this.levelName.textContent = name;
    this.progress.innerHTML = '';
    this.progressDots = [];
    for (let i = 0; i <= segments; i++) {
      const d = document.createElement('span');
      d.className = i === segments ? 'pdot goal' : 'pdot';
      this.progress.appendChild(d);
      this.progressDots.push(d);
    }
    this.colors = colors;
  }

  setProgress(cps) {
    this.progressDots.forEach((d, i) => {
      d.classList.toggle('p0', cps[0] >= i);
      d.classList.toggle('p1', cps[1] >= i);
    });
  }

  setGems(n, total, pop) {
    this.gemPill.hidden = total === 0;
    this.gemCount.textContent = n;
    this.gemTotal.textContent = total;
    if (pop) {
      this.gemPill.classList.remove('pop');
      void this.gemPill.offsetWidth;
      this.gemPill.classList.add('pop');
    }
  }

  setNotes(n, total, pop) {
    this.notesPill.hidden = total === 0;
    this.notesCount.textContent = `${n}/${total}`;
    if (pop) {
      this.notesPill.classList.remove('pop');
      void this.notesPill.offsetWidth;
      this.notesPill.classList.add('pop');
    }
  }

  carry(item) {
    this.carryPill.hidden = !item;
    if (!item) return;
    this.carryPill.querySelector('.carry-name').textContent = item.label;
    this.carryPill.style.setProperty('--c', item.color);
  }

  objective(text) {
    this.objectiveEl.textContent = text ? `Goal: ${text}` : '';
    this.objectiveEl.classList.toggle('on', !!text);
  }

  subtitle(text, seconds = 5) {
    this.subtitleEl.textContent = text;
    this.subtitleEl.classList.add('on');
    clearTimeout(this.subTimer);
    this.subTimer = setTimeout(() => this.subtitleEl.classList.remove('on'), seconds * 1000);
  }

  // Full card for story intros, outros and the journal. card: { kicker, title, lines, rules }
  storyCard(card, opts = {}) {
    const el = this.storyEl;
    el.querySelector('.sc-kicker').textContent = card.kicker || '';
    el.querySelector('.sc-title').textContent = card.title || '';
    const body = el.querySelector('.sc-body');
    body.innerHTML = '';
    for (const line of card.lines || []) {
      const p = document.createElement('p');
      p.textContent = line;
      body.appendChild(p);
    }
    if (card.rules && card.rules.length) {
      const ol = document.createElement('ol');
      ol.className = 'sc-rules';
      for (const r of card.rules) {
        const li = document.createElement('li');
        li.textContent = r;
        ol.appendChild(li);
      }
      body.appendChild(ol);
    }
    for (const n of card.notes || []) {
      const h = document.createElement('h3');
      h.textContent = n.title;
      const p = document.createElement('p');
      p.className = 'sc-note';
      p.textContent = n.text;
      body.append(h, p);
    }
    el.classList.toggle('dark', !!card.dark);
    el.classList.add('on');
    body.scrollTop = 0;
    clearTimeout(this.storyTimer);
    if (opts.ms) this.storyTimer = setTimeout(() => this.closeStory(), opts.ms);
  }

  closeStory() {
    this.storyEl.classList.remove('on');
  }

  // A page of the story, shown to both players.
  note(n, who) {
    this.journal.push(n);
    const el = this.noteEl;
    el.querySelector('.nc-who').textContent = who;
    el.querySelector('.nc-title').textContent = n.title;
    el.querySelector('.nc-text').textContent = n.text;
    el.classList.add('on');
    clearTimeout(this.noteTimer);
    this.noteTimer = setTimeout(() => el.classList.remove('on'), 16000);
  }

  openJournal() {
    if (!this.journal.length) {
      this.toast('No notes found yet');
      return;
    }
    this.storyCard({ kicker: 'Journal', title: 'Notes found', notes: this.journal, dark: true });
  }

  scare(text) {
    const el = this.scareEl;
    el.querySelector('.scare-text').textContent = text || '';
    el.classList.remove('on');
    void el.offsetWidth;
    el.classList.add('on');
  }

  resetStory() {
    this.journal = [];
    this.closeStory();
    this.noteEl.classList.remove('on');
    this.subtitleEl.classList.remove('on');
  }

  setNet(connected, rtt) {
    this.net.classList.toggle('bad', !connected);
    this.ping.textContent = connected ? `${Math.round(rtt)} ms` : 'offline';
  }

  toast(text, kind = '') {
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.textContent = text;
    this.toasts.appendChild(el);
    setTimeout(() => el.classList.add('out'), 2600);
    setTimeout(() => el.remove(), 3200);
    while (this.toasts.children.length > 4) this.toasts.firstChild.remove();
  }

  hint(text, seconds = 7) {
    if (!text) {
      this.hintEl.classList.remove('on');
      return;
    }
    this.hintEl.textContent = text;
    this.hintEl.classList.add('on');
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => this.hintEl.classList.remove('on'), seconds * 1000);
  }

  prompt(html) {
    if (html === this.lastPrompt) return;
    this.lastPrompt = html;
    if (html) {
      this.promptEl.innerHTML = html;
      this.promptEl.classList.add('on');
    } else this.promptEl.classList.remove('on');
  }

  status(text) {
    if (text === this.lastStatus) return;
    this.lastStatus = text;
    this.statusEl.textContent = text || '';
    this.statusEl.classList.toggle('on', !!text);
  }

  reticle(x, y, color, visible, active) {
    const r = this.reticleEl;
    if (!visible) {
      r.classList.remove('on');
      return;
    }
    r.classList.add('on');
    r.classList.toggle('active', !!active);
    r.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    r.style.setProperty('--c', color);
  }

  partner(info) {
    if (!info) {
      this.tag.classList.remove('on');
      this.arrow.classList.remove('on');
      return;
    }
    this.tag.style.setProperty('--c', info.color);
    this.arrow.style.setProperty('--c', info.color);
    if (info.onScreen) {
      this.arrow.classList.remove('on');
      this.tag.classList.add('on');
      this.tag.style.transform = `translate(${info.x}px, ${info.y}px) translate(-50%, -100%)`;
      this.tagName.textContent = info.name;
      this.tagDist.textContent = info.dist > 14 ? `${Math.round(info.dist)} m` : '';
      this.tag.classList.toggle('calling', !!info.calling);
    } else {
      this.tag.classList.remove('on');
      this.arrow.classList.add('on');
      this.arrow.style.transform = `translate(${info.x}px, ${info.y}px) translate(-50%, -50%) rotate(${info.angle}rad)`;
    }
  }

  fade(a, color = '#2b1d3a') {
    this.fadeEl.style.background = color;
    this.fadeEl.style.opacity = a;
  }

  countdown(text) {
    if (!text) {
      this.countEl.classList.remove('on');
      return;
    }
    if (this.countEl.textContent !== text) {
      this.countEl.textContent = text;
      this.countEl.classList.remove('on');
      void this.countEl.offsetWidth;
    }
    this.countEl.classList.add('on');
  }

  title(label, name, sub = '') {
    this.titleCard.querySelector('.tc-level').textContent = label;
    this.titleCard.querySelector('.tc-name').textContent = name;
    this.titleCard.querySelector('.tc-sub').textContent = sub;
    this.titleCard.classList.remove('on');
    void this.titleCard.offsetWidth;
    this.titleCard.classList.add('on');
  }

  showClickToPlay(v) {
    this.clickToPlay.classList.toggle('on', v);
  }
}
