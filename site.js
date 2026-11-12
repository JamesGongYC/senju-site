// Senju site: the cursor field in the hero, and three working figures.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NEON = '#39FF14';
const ARROW = 'M4 2.5l15.5 8.2-6.6 1.9-2.6 6.6z';
const rand = (a, b) => a + Math.random() * (b - a);

// ---- Hero: a thousand cursors that form 千手, part around your pointer, and regroup on click ----
(function field() {
  const hero = $('#hero'), canvas = $('#field'), tag = $('#you-tag');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, N = 0, P = [], shape = 0, running = false, visible = true, t0 = performance.now();
  const pointer = { x: -9999, y: -9999, on: false };

  // One small cursor drawn once, then stamped a thousand times.
  function sprite(color) {
    const c = document.createElement('canvas'), s = 14 * dpr;
    c.width = c.height = s;
    const x = c.getContext('2d');
    x.scale(s / 24, s / 24);
    x.fillStyle = color;
    x.fill(new Path2D(ARROW));
    return c;
  }
  let green, white;

  // Points inside a shape, found by drawing it small and reading the pixels back.
  function sample(draw, count) {
    const w = 480, h = 260, c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.fillStyle = '#fff';
    draw(x, w, h);
    const data = x.getImageData(0, 0, w, h).data, pts = [];
    for (let py = 0; py < h; py += 3) for (let px = 0; px < w; px += 3) if (data[(py * w + px) * 4 + 3] > 128) pts.push([px / w, py / h]);
    for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
    const out = [];
    for (let i = 0; i < count; i++) { const p = pts[i % pts.length] ?? [0.5, 0.5]; out.push([p[0] + rand(-0.004, 0.004), p[1] + rand(-0.006, 0.006)]); }
    return out;
  }
  const shapes = [
    (x, w, h) => { x.font = `900 ${h * 0.86}px "PingFang SC","Hiragino Sans GB","Noto Sans CJK SC","Noto Sans SC","Microsoft YaHei",sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('千手', w / 2, h * 0.53); },
    (x, w, h) => { x.translate(w / 2 - h * 0.36, h * 0.04); x.scale(h / 21, h / 21); x.fill(new Path2D('M0 0 L0 17 L4.6 12.9 L7.6 19.6 L10.3 18.4 L7.3 11.9 L13 11.9 Z')); },
    (x, w, h) => {
      // Size the word to the box, whatever the font's width turns out to be.
      const face = 'Archivo, "Helvetica Neue", Arial, sans-serif';
      x.font = `900 100px ${face}`;
      const size = Math.min(h * 0.62, (100 * w * 0.94) / x.measureText('SENJU').width);
      x.font = `900 ${size}px ${face}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('SENJU', w / 2, h * 0.52);
    },
  ];

  // Where the formation sits: upper right on wide screens, top on narrow ones.
  function box() {
    if (W > 900) { const w = Math.min(W * 0.56, 880); return { x: W - w - W * 0.04, y: H * 0.1, w, h: w * 0.54 }; }
    const w = W * 0.92; return { x: W * 0.04, y: 84, w, h: w * 0.54 };
  }
  function aim() {
    const b = box(), pts = sample(shapes[shape % shapes.length], N);
    P.forEach((p, i) => { p.tx = b.x + pts[i][0] * b.w; p.ty = b.y + pts[i][1] * b.h; });
  }
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    green = sprite(NEON); white = sprite('#fff');
    const want = W > 900 ? 1000 : W > 560 ? 640 : 420;
    if (want !== N) {
      N = want;
      P = Array.from({ length: N }, (_, i) => {
        const edge = Math.random() * 4 | 0;   // fly in from the edges
        const x = edge === 0 ? -40 : edge === 1 ? W + 40 : rand(0, W), y = edge === 2 ? -40 : edge === 3 ? H + 40 : rand(0, H);
        return { x, y, vx: 0, vy: 0, tx: x, ty: y, k: rand(0.012, 0.03), ph: rand(0, 6.28), white: i % 17 === 0, delay: rand(0, 900) };
      });
    }
    aim();
    if (still) { P.forEach((p) => { p.x = p.tx; p.y = p.ty; }); draw(); }
  }
  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of P) ctx.drawImage(p.white ? white : green, (p.x * dpr) | 0, (p.y * dpr) | 0);
  }
  function tick(now) {
    if (!running) return;
    const t = now - t0, R = 130;
    for (const p of P) {
      if (t < p.delay) continue;
      const wob = Math.sin(now / 900 + p.ph) * 2.2;
      p.vx += (p.tx + wob - p.x) * p.k;
      p.vy += (p.ty + Math.cos(now / 1100 + p.ph) * 2.2 - p.y) * p.k;
      if (pointer.on) {
        const dx = p.x - pointer.x, dy = p.y - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < R * R) { const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 3.2; p.vx += (dx / d) * f; p.vy += (dy / d) * f; }
      }
      p.vx *= 0.86; p.vy *= 0.86;
      p.x += p.vx; p.y += p.vy;
    }
    draw();
    requestAnimationFrame(tick);
  }
  function start() { if (!running && visible && !document.hidden && !still) { running = true; requestAnimationFrame(tick); } }
  function stop() { running = false; }

  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.on = true;
    tag.style.transform = `translate(${pointer.x + 14}px, ${pointer.y + 16}px)`;
    tag.style.opacity = e.pointerType === 'mouse' ? 1 : 0;
  });
  hero.addEventListener('pointerleave', () => { pointer.on = false; tag.style.opacity = 0; });
  hero.addEventListener('click', (e) => {
    if (e.target.closest('a, button')) return;
    // Scatter from the click, then settle into the next shape.
    const r = hero.getBoundingClientRect(), cx = e.clientX - r.left, cy = e.clientY - r.top;
    for (const p of P) { const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1; p.vx += (dx / d) * rand(6, 22); p.vy += (dy / d) * rand(6, 22); }
    shape++;
    aim();
    if (still) { P.forEach((p) => { p.x = p.tx; p.y = p.ty; }); draw(); }
  });
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(hero);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(resize, 120); });
  resize();
  document.fonts?.ready.then(() => { if (shape % shapes.length === 2) aim(); });
  start();
})();

// ---- Fig. 1: a session you can interrupt ----
(function swarm() {
  const desk = $('#desk'), layer = $('#agents'), line = $('#lead-line span'), ask = $('#ask');
  const pauseBtn = $('[data-act="pause"]');
  const SCRIPT = {
    Research: { win: 'chrome', does: ['reading specs', 'opening reviews', 'noting battery life'] },
    Writer: { win: 'word', does: ['drafting the email', 'tightening the intro', 'adding the table'] },
    Courier: { win: 'slack', does: ['finding the channel', 'pasting the draft'] },
    Pricer: { win: 'chrome', does: ['checking prices', 'comparing stores'] },
  };
  let agents = [], timers = [];
  const say = (text) => { line.textContent = text; };
  const win = (name) => $(`.win[data-win="${name}"]`, desk);

  function make(name) {
    const el = document.createElement('div');
    el.className = 'agent';
    el.innerHTML = `<svg viewBox="0 0 24 24"><path d="${ARROW}"/></svg><span></span>`;
    layer.append(el);
    const a = { name, el, ...SCRIPT[name], step: 0, paused: false, needsYou: false, done: false };
    agents.push(a);
    place(a, true);
    return a;
  }
  function label(a, text, held = false) { a.el.lastChild.textContent = `${a.name}: ${text}`; a.el.classList.toggle('held', held); }
  function place(a, first = false) {
    const w = win(a.win).getBoundingClientRect(), d = desk.getBoundingClientRect();
    const x = w.left - d.left + rand(10, Math.max(12, w.width - 120)), y = w.top - d.top + rand(40, Math.max(44, w.height - (a.needsYou ? 150 : 60)));
    if (first) { a.el.style.transition = 'none'; a.el.style.transform = `translate(${d.width / 2}px, 6px)`; a.el.getBoundingClientRect(); a.el.style.transition = ''; }
    a.el.style.transform = `translate(${x}px, ${y}px)`;
  }
  function beat(a) {
    if (a.done) return;
    const yours = win(a.win).classList.contains('yours');
    if (a.paused) label(a, 'paused', true);
    else if (a.needsYou) label(a, 'needs you', true);
    else if (yours) label(a, 'waiting for you to pause', true);
    else { label(a, a.does[a.step++ % a.does.length]); place(a); }
    timers.push(setTimeout(() => beat(a), still ? 2600 : rand(1500, 2400)));
  }
  function retire(a) { a.done = true; a.el.classList.add('gone'); }

  function reset() {
    timers.forEach(clearTimeout); timers = [];
    layer.innerHTML = ''; agents = [];
    ask.hidden = true;
    pauseBtn.setAttribute('aria-pressed', 'false'); pauseBtn.textContent = 'Pause Writer'; pauseBtn.disabled = false;
    $$('[data-act="skip"], [data-act="add"]').forEach((b) => (b.disabled = false));
    ['Research', 'Writer', 'Courier'].forEach((n, i) => { const a = make(n); timers.push(setTimeout(() => beat(a), 300 + i * 250)); });
    say('Three workers running. Rest your pointer on a window and the agent in it waits for you.');
    timers.push(setTimeout(() => {
      const c = agents.find((a) => a.name === 'Courier');
      if (!c || c.done) return;
      c.needsYou = true; ask.hidden = false; label(c, 'needs you', true);
      say('Courier has a draft ready and will not send it without you.');
    }, 5200));
  }

  $$('.win', desk).forEach((w) => {
    const on = () => { w.classList.add('yours'); agents.filter((a) => a.win === w.dataset.win && !a.done && !a.paused && !a.needsYou).forEach((a) => label(a, 'waiting for you to pause', true)); };
    const off = () => w.classList.remove('yours');
    w.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && on());
    w.addEventListener('pointerleave', off);
    w.addEventListener('click', (e) => { if (e.target.closest('button')) return; if (matchMedia('(hover: none)').matches) w.classList.contains('yours') ? off() : on(); });
  });
  ask.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const c = agents.find((a) => a.name === 'Courier'); if (!c) return;
    c.needsYou = false; ask.hidden = true;
    if (b.dataset.ask === 'send') { c.does = ['sent, filing the notes', 'linking the doc']; c.step = 0; say('Sent, on your say-so. Courier is filing the notes.'); }
    else { c.does = ['holding the draft']; c.step = 0; say('Held. Courier keeps the draft and sends nothing.'); }
    label(c, c.does[0]);
  });
  $('.controls', $('#fig-swarm')).addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const writer = agents.find((a) => a.name === 'Writer');
    if (b.dataset.act === 'pause') {
      writer.paused = !writer.paused;
      b.setAttribute('aria-pressed', String(writer.paused));
      b.textContent = writer.paused ? 'Resume Writer' : 'Pause Writer';
      label(writer, writer.paused ? 'paused' : writer.does[0], writer.paused);
      say(writer.paused ? 'Writer is paused. Its window is yours until you resume it.' : 'Writer picks up where it stopped.');
    } else if (b.dataset.act === 'skip') {
      retire(writer); b.disabled = true; pauseBtn.disabled = true;
      say('Understood. I stopped Writer and dropped the email. Research and Courier carry on.');
    } else if (b.dataset.act === 'add') {
      b.disabled = true;
      const p = make('Pricer'); timers.push(setTimeout(() => beat(p), 200));
      say('Good idea. I started a fourth worker, Pricer, to check prices in the same browser.');
    } else reset();
  });
  reset();
})();

// ---- Fig. 2: one agent, two desks ----
(function multi() {
  const fig = $('#fig-multi'), courier = $('#courier'), line = $('#multi-line span'), consent = $('#consent');
  const screens = { you: $('[data-screen="you"]', fig), mina: $('[data-screen="mina"]', fig) };
  const names = { you: 'your Mac', mina: "Mina's Mac" };
  let shared = false, at = null, hop = null;
  const note = (who, html) => { $(`[data-note="${who}"]`, fig).innerHTML = html; };
  const docked = (who, text) => { $(`[data-docked="${who}"]`, fig).textContent = text; };

  function moveTo(who, resting) {
    const s = screens[who].getBoundingClientRect(), f = $('.screens', fig).getBoundingClientRect();
    const x = s.left - f.left + (resting ? s.width / 2 - 34 : rand(18, s.width - 110));
    const y = resting ? $('.dock', screens[who]).getBoundingClientRect().top - f.top + 6 : s.top - f.top + rand(60, s.height - 150);
    courier.style.transform = `translate(${x}px, ${y}px)`;
  }
  function render() {
    clearInterval(hop);
    for (const who of ['you', 'mina']) screens[who].classList.toggle('live', at === who);
    if (at) {
      const other = at === 'you' ? 'mina' : 'you';
      courier.className = 'courier on';
      moveTo(at, false);
      if (!still) hop = setInterval(() => moveTo(at, false), 1900);
      docked(at, '');
      docked(other, shared || other === 'you' ? `Courier is on ${names[at]}` : '');
      note(at, at === 'mina' ? '<b>Courier</b> is reading the meeting notes here.' : '<b>Courier</b> is writing into the team doc here.');
      if (other === 'you' || shared) note(other, at === 'mina' ? 'Courier left this screen when Mina called it.' : 'Courier left this screen when you called it.');
      line.textContent = at === 'mina' ? 'Courier is on Mina’s Mac, reading. It is gone from yours until someone calls it back.' : 'Courier is on your Mac, writing. Mina sees where it went, not what is on your screen.';
    } else {
      courier.className = 'courier on ghost';
      moveTo('you', true);
      docked('you', ''); docked('mina', shared ? 'Courier is docked here too' : '');
      note('you', 'Courier is resting. Its cursor is docked on every screen in the session.');
    }
  }
  consent.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    consent.hidden = true;
    if (b.dataset.consent === 'allow') {
      shared = true;
      $('[data-call="mina"]', fig).disabled = false;
      note('mina', 'Mina allowed this Mac for this session only.');
      line.textContent = 'Mina joined and shared her Mac. Courier is docked on both screens. Call it to either one.';
    } else {
      note('mina', 'Mina is following the session and can talk to the lead. Her Mac is not shared. <button type="button" data-share>Share it after all</button>');
      line.textContent = 'Mina is watching. I will not plan on her Mac.';
    }
    render();
  });
  fig.addEventListener('click', (e) => {
    if (e.target.closest('[data-share]')) { shared = true; $('[data-call="mina"]', fig).disabled = false; note('mina', 'Mina allowed this Mac for this session only.'); line.textContent = 'Mina shared her Mac. Call Courier to either screen.'; return render(); }
    const b = e.target.closest('[data-call]'); if (!b || b.disabled) return;
    at = at === b.dataset.call ? null : b.dataset.call;
    for (const who of ['you', 'mina']) $(`[data-call="${who}"]`, fig).textContent = at === who ? 'Send Courier back to the dock' : 'Call Courier here';
    if (!at) line.textContent = 'Courier is resting again, docked on every screen.';
    render();
  });
  addEventListener('resize', () => render());
  render();
  line.textContent = 'Waiting for Mina. Answer the card on her screen for her.';
})();

// ---- Fig. 3: run, report, retrospective, skill, and round again ----
(function loop() {
  const trace = $('#trace'), lines = $('#skill-lines'), rev = $('#rev'), btn = $('#run'), arc = $('#arc'), runner = $('#runner');
  // 1 = a useful step, 0 = a dead end. Each run keeps what the last one learned.
  const RUNS = [
    { steps: '1101001101011001101011', note: 'no skill yet', learned: 'Set the store region first. Prices stay hidden until you do.' },
    { steps: '1111011011101111', note: 'starts from revision 1', learned: 'Open one window per laptop, one agent each. Do not share tabs.' },
    { steps: '1111111111111', note: 'starts from revision 2', learned: 'Draft in Slack without pressing Return. Ask before sending.' },
  ];
  let n = 0, turns = 0, busy = false;
  const wait = (ms) => new Promise((r) => setTimeout(r, still ? Math.min(ms, 60) : ms));
  function phase(p) {
    $$('.ring li').forEach((li) => li.classList.toggle('on', Number(li.dataset.phase) === p));
    const turn = turns + Math.max(p, 0) / 4;
    runner.style.transform = `rotate(${turn * 360}deg)`;
    arc.style.strokeDashoffset = String(490 - 490 * ((p + 1) / 4));
  }
  async function run() {
    if (busy) return;
    busy = true; btn.disabled = true;
    if (n === RUNS.length) { n = 0; trace.innerHTML = ''; lines.innerHTML = ''; rev.textContent = 'no revisions yet'; }
    const r = RUNS[n];
    $$('.row', trace).forEach((row) => row.classList.remove('latest'));
    const row = document.createElement('div');
    row.className = 'row latest';
    row.innerHTML = `<b>Run ${n + 1}</b><div class="ticks"></div><span>${r.note}</span>`;
    trace.append(row);
    phase(0);
    for (const c of r.steps) { const i = document.createElement('i'); if (c === '0') i.className = 'dead'; row.children[1].append(i); await wait(70); }
    phase(1); await wait(700);
    phase(2); await wait(800);
    phase(3);
    $$('li', lines).forEach((li) => li.classList.remove('new'));
    const li = document.createElement('li'); li.className = 'new'; li.textContent = r.learned; lines.append(li);
    rev.textContent = `revision ${n + 1}`;
    await wait(700);
    n++; turns++;
    btn.textContent = n === RUNS.length ? 'Clear and start over' : 'Run it again';
    busy = false; btn.disabled = false;
  }
  btn.addEventListener('click', run);
  phase(-1);
})();
