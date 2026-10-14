// A small Logo interpreter with a turtle on a canvas.
// Hooks into any element with a data-logo attribute.

(() => {
  const MAX_STEPS = 500000;
  const MAX_DEPTH = 1000;
  // instructions run per animation frame, indexed by the speed slider (1-10)
  const SPEEDS = [0, 1, 2, 3, 5, 8, 15, 30, 60, 150, Infinity];

  const ALIASES = {
    fd: 'forward', bk: 'back', rt: 'right', lt: 'left',
    pu: 'penup', pd: 'pendown', cs: 'clearscreen',
    ht: 'hideturtle', st: 'showturtle',
    setpc: 'setpencolor', setcolor: 'setpencolor',
    setps: 'setpensize', setwidth: 'setpensize',
    seth: 'setheading', pr: 'print',
  };
  const BUILTINS = new Set([
    'forward', 'back', 'right', 'left', 'penup', 'pendown', 'clearscreen', 'home',
    'hideturtle', 'showturtle', 'setheading', 'setxy', 'setpencolor', 'setpensize',
    'repeat', 'if', 'ifelse', 'stop', 'make', 'print',
    'repcount', 'random', 'sqrt', 'sin', 'cos', 'heading', 'xcor', 'ycor',
  ]);

  // classic MSWLogo palette, 0 (black) follows the page's text colour instead
  const PALETTE = [
    null, '#0000ff', '#00a000', '#00c8c8', '#ff0000', '#ff00ff', '#e6c800', '#ffffff',
    '#9b6030', '#c5a070', '#228b22', '#40e0d0', '#fa8072', '#8000c0', '#ff9000', '#a0a0a0',
  ];

  const EXAMPLES = {
    square: 'repeat 4 [forward 100 right 90]',
    flower: 'repeat 36 [repeat 4 [forward 100 right 90] right 10]',
    star: 'penup setxy -25 -90 pendown\nsetpencolor "orange\nrepeat 5 [forward 180 right 144]',
    spiral: [
      'to spiral :size',
      '  if :size > 220 [stop]',
      '  forward :size right 91',
      '  spiral :size + 2',
      'end',
      '',
      'setpencolor 1',
      'spiral 1',
    ].join('\n'),
    tree: [
      'to tree :size',
      '  if :size < 5 [stop]',
      '  forward :size',
      '  left 30 tree :size * 0.7',
      '  right 60 tree :size * 0.7',
      '  left 30 back :size',
      'end',
      '',
      'penup back 140 pendown',
      'setpencolor 10',
      'tree 90',
    ].join('\n'),
  };

  class LogoError extends Error {}
  const STOP = Symbol('stop');

  // ---- parsing ----

  function tokenize(src) {
    const out = [];
    const re = /\s+|;[^\n]*|([[\]()])|(<=|>=|<>|[+\-*/<>=])|"([^\s[\]()]*)|:([a-z_][\w.]*)|(\d+(?:\.\d*)?|\.\d+)|([a-z_][\w.?]*)/giy;
    while (re.lastIndex < src.length) {
      const at = re.lastIndex;
      const m = re.exec(src);
      if (!m) throw new LogoError(`I don't understand "${src.slice(at).split(/\s/)[0]}"`);
      if (m[1]) out.push({ t: m[1] });
      else if (m[2]) {
        // like real Logo, "setxy -25 -90" is two negative numbers, not a subtraction
        const neg = m[2] === '-' && /[\s[(]/.test(src[at - 1] || ' ') && /[^\s]/.test(src[re.lastIndex] || ' ');
        out.push({ t: 'op', v: m[2], neg });
      }
      else if (m[3] !== undefined) out.push({ t: 'quote', v: m[3].toLowerCase() });
      else if (m[4]) out.push({ t: 'var', v: m[4].toLowerCase() });
      else if (m[5]) out.push({ t: 'num', v: parseFloat(m[5]) });
      else if (m[6]) out.push({ t: 'word', v: m[6].toLowerCase() });
    }
    return out;
  }

  // turn [ ... ] into nested list tokens
  function nest(tokens) {
    const stack = [[]];
    for (const tok of tokens) {
      if (tok.t === '[') stack.push([]);
      else if (tok.t === ']') {
        if (stack.length === 1) throw new LogoError('There\'s a "]" without a matching "["');
        const list = stack.pop();
        stack[stack.length - 1].push({ t: 'list', v: list });
      } else stack[stack.length - 1].push(tok);
    }
    if (stack.length > 1) throw new LogoError('There\'s a "[" without a matching "]"');
    return stack[0];
  }

  // pull out "to name :a :b ... end" definitions, return them and the rest
  function extractProcs(toks) {
    const procs = Object.create(null);
    const main = [];
    for (let i = 0; i < toks.length; i++) {
      const tok = toks[i];
      if (!(tok.t === 'word' && tok.v === 'to')) { main.push(tok); continue; }

      const nameTok = toks[++i];
      if (!nameTok || nameTok.t !== 'word') throw new LogoError('"to" needs a procedure name');
      const name = nameTok.v;
      if (BUILTINS.has(ALIASES[name] || name)) throw new LogoError(`"${name}" is already a built-in command`);

      const params = [];
      while (toks[i + 1] && toks[i + 1].t === 'var') params.push(toks[++i].v);

      const body = [];
      while (++i < toks.length && !(toks[i].t === 'word' && toks[i].v === 'end')) body.push(toks[i]);
      if (i >= toks.length) throw new LogoError(`"to ${name}" is missing its "end"`);

      procs[name] = { params, body };
    }
    return { procs, main };
  }

  function show(v) {
    if (typeof v === 'number') return String(+v.toFixed(6));
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'string') return v;
    switch (v.t) {
      case 'num': return String(v.v);
      case 'word': case 'op': return v.v;
      case 'var': return ':' + v.v;
      case 'quote': return '"' + v.v;
      case 'list': return '[' + v.v.map(show).join(' ') + ']';
      default: return v.t;
    }
  }

  // ---- interpreter ----

  class Interp {
    constructor(turtle, procs, print) {
      this.turtle = turtle;
      this.procs = procs;
      this.print = print;
      this.globals = Object.create(null);
      this.repcounts = [];
      this.steps = 0;
      this.depth = 0;
      this.current = '';
    }

    *runList(list, scope) {
      const r = { toks: list, pos: 0 };
      while (r.pos < list.length) yield* this.command(r, scope);
    }

    *command(r, scope) {
      if (++this.steps > MAX_STEPS) throw new LogoError('That was taking too long, so I stopped it');

      const tok = r.toks[r.pos++];
      if (tok.t !== 'word') throw new LogoError(`I don't know what to do with ${show(tok)}`);
      const name = ALIASES[tok.v] || tok.v;
      const t = this.turtle;
      this.current = tok.v;

      switch (name) {
        case 'forward': t.move(this.num(r, scope)); yield; return;
        case 'back': t.move(-this.num(r, scope)); yield; return;
        case 'right': t.turn(this.num(r, scope)); yield; return;
        case 'left': t.turn(-this.num(r, scope)); yield; return;
        case 'penup': t.pen = false; return;
        case 'pendown': t.pen = true; return;
        case 'home': t.lineTo(0, 0); t.heading = 0; yield; return;
        case 'clearscreen': t.clearscreen(); yield; return;
        case 'hideturtle': t.visible = false; return;
        case 'showturtle': t.visible = true; return;
        case 'setheading': t.heading = this.num(r, scope); yield; return;
        case 'setxy': {
          const x = this.num(r, scope);
          const y = this.num(r, scope);
          t.lineTo(x, y);
          yield;
          return;
        }
        case 'setpencolor': t.setColor(this.expr(r, scope)); return;
        case 'setpensize': t.width = Math.max(0.5, this.num(r, scope)); return;
        case 'repeat': {
          const n = Math.floor(this.num(r, scope));
          const body = this.list(r);
          for (let k = 1; k <= n; k++) {
            this.repcounts.push(k);
            try { yield* this.runList(body, scope); } finally { this.repcounts.pop(); }
          }
          return;
        }
        case 'if': {
          const cond = this.bool(r, scope);
          const body = this.list(r);
          if (cond) yield* this.runList(body, scope);
          return;
        }
        case 'ifelse': {
          const cond = this.bool(r, scope);
          const yes = this.list(r);
          const no = this.list(r);
          yield* this.runList(cond ? yes : no, scope);
          return;
        }
        case 'stop': throw STOP;
        case 'make': {
          const nameTok = r.toks[r.pos++];
          if (!nameTok || nameTok.t !== 'quote') throw new LogoError('make needs a name with a quote, like make "size 10');
          const v = this.expr(r, scope);
          if (scope && nameTok.v in scope) scope[nameTok.v] = v;
          else this.globals[nameTok.v] = v;
          return;
        }
        case 'print': this.print(show(this.expr(r, scope))); return;
      }

      const proc = this.procs[name];
      if (!proc) throw new LogoError(`I don't know how to ${tok.v}`);

      const local = Object.create(null);
      for (const p of proc.params) local[p] = this.expr(r, scope);

      if (++this.depth > MAX_DEPTH) throw new LogoError(`${tok.v} called itself too many times`);
      try {
        yield* this.runList(proc.body, local);
      } catch (e) {
        if (e !== STOP) throw e;
      } finally {
        this.depth--;
      }
    }

    num(r, scope) {
      const name = this.current;
      const v = this.expr(r, scope);
      if (typeof v !== 'number') throw new LogoError(`${name} needs a number, not ${show(v)}`);
      return v;
    }

    bool(r, scope) {
      const name = this.current;
      const v = this.expr(r, scope);
      if (typeof v !== 'boolean') throw new LogoError(`${name} needs a true or false test, like :size > 100`);
      return v;
    }

    list(r) {
      const tok = r.toks[r.pos++];
      if (!tok || tok.t !== 'list') throw new LogoError(`${this.current} needs a [list] of instructions`);
      return tok.v;
    }

    expr(r, s) {
      let a = this.additive(r, s);
      while (this.peekOp(r, '<', '>', '=', '<=', '>=', '<>')) {
        const op = r.toks[r.pos++].v;
        const b = this.additive(r, s);
        if (op === '=') a = a === b;
        else if (op === '<>') a = a !== b;
        else {
          this.needNums(op, a, b);
          a = op === '<' ? a < b : op === '>' ? a > b : op === '<=' ? a <= b : a >= b;
        }
      }
      return a;
    }

    additive(r, s) {
      let a = this.multiplicative(r, s);
      while (this.peekOp(r, '+', '-') && !r.toks[r.pos].neg) {
        const op = r.toks[r.pos++].v;
        const b = this.multiplicative(r, s);
        this.needNums(op, a, b);
        a = op === '+' ? a + b : a - b;
      }
      return a;
    }

    multiplicative(r, s) {
      let a = this.unary(r, s);
      while (this.peekOp(r, '*', '/')) {
        const op = r.toks[r.pos++].v;
        const b = this.unary(r, s);
        this.needNums(op, a, b);
        if (op === '/' && b === 0) throw new LogoError('Can\'t divide by zero');
        a = op === '*' ? a * b : a / b;
      }
      return a;
    }

    unary(r, s) {
      if (this.peekOp(r, '-')) {
        r.pos++;
        const v = this.unary(r, s);
        this.needNums('-', v, 0);
        return -v;
      }
      return this.primary(r, s);
    }

    primary(r, s) {
      const tok = r.toks[r.pos++];
      if (!tok) throw new LogoError(`${this.current} needs more inputs`);
      switch (tok.t) {
        case 'num': case 'quote': return tok.v;
        case 'list': return tok;
        case 'var':
          if (s && tok.v in s) return s[tok.v];
          if (tok.v in this.globals) return this.globals[tok.v];
          throw new LogoError(`:${tok.v} hasn't been given a value`);
        case '(': {
          const v = this.expr(r, s);
          const close = r.toks[r.pos++];
          if (!close || close.t !== ')') throw new LogoError('There\'s a "(" without a matching ")"');
          return v;
        }
        case 'word': {
          const name = tok.v;
          const t = this.turtle;
          const arg = () => {
            const v = this.unary(r, s);
            this.needNums(name, v, 0);
            return v;
          };
          switch (name) {
            case 'repcount': return this.repcounts.length ? this.repcounts[this.repcounts.length - 1] : -1;
            case 'random': return Math.floor(Math.random() * arg());
            case 'sqrt': return Math.sqrt(arg());
            case 'sin': return Math.sin(arg() * Math.PI / 180);
            case 'cos': return Math.cos(arg() * Math.PI / 180);
            case 'heading': return t.heading;
            case 'xcor': return t.x;
            case 'ycor': return t.y;
          }
          if (this.procs[name] || BUILTINS.has(ALIASES[name] || name)) {
            throw new LogoError(`${name} doesn't give back a value, so ${this.current} can't use it`);
          }
          throw new LogoError(`I don't know how to ${name}`);
        }
        default:
          throw new LogoError(`I didn't expect ${show(tok)} there`);
      }
    }

    peekOp(r, ...ops) {
      const tok = r.toks[r.pos];
      return tok && tok.t === 'op' && ops.includes(tok.v);
    }

    needNums(op, a, b) {
      if (typeof a !== 'number' || typeof b !== 'number') throw new LogoError(`${op} needs numbers`);
    }
  }

  // ---- the turtle and its canvas ----

  class Board {
    constructor(root) {
      this.root = root;
      this.stage = root.querySelector('.logo-stage');
      this.paper = root.querySelector('.logo-paper');
      this.sprite = root.querySelector('.logo-turtle');
      this.code = root.querySelector('.logo-code');
      this.msg = root.querySelector('.logo-msg');
      this.speed = root.querySelector('[data-speed]');
      this.segments = [];
      this.run = null;
      this.home();

      root.querySelector('[data-action="run"]').addEventListener('click', () => this.start());
      root.querySelector('[data-action="stop"]').addEventListener('click', () => this.halt('Stopped.'));
      root.querySelector('[data-action="clear"]').addEventListener('click', () => {
        this.halt('');
        this.home();
        this.redraw();
      });
      root.querySelectorAll('[data-example]').forEach(btn => btn.addEventListener('click', () => {
        this.code.value = EXAMPLES[btn.dataset.example];
        this.start();
      }));
      this.code.addEventListener('keydown', e => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          this.start();
        }
      });

      this.resize();
      new ResizeObserver(() => this.resize()).observe(this.stage);
      new MutationObserver(() => this.redraw()).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    // turtle state

    home() {
      this.x = 0;
      this.y = 0;
      this.heading = 0;
      this.pen = true;
      this.color = null;
      this.width = 2;
      this.visible = true;
      this.segments = [];
    }

    clearscreen() {
      this.segments = [];
      this.x = 0;
      this.y = 0;
      this.heading = 0;
      this.redraw();
    }

    move(d) {
      const rad = this.heading * Math.PI / 180;
      this.lineTo(this.x + d * Math.sin(rad), this.y + d * Math.cos(rad));
    }

    turn(a) {
      this.heading = ((this.heading + a) % 360 + 360) % 360;
    }

    lineTo(x, y) {
      if (this.pen) {
        const seg = { x1: this.x, y1: this.y, x2: x, y2: y, color: this.color, width: this.width };
        this.segments.push(seg);
        this.drawSegment(this.paper.getContext('2d'), seg);
      }
      this.x = x;
      this.y = y;
    }

    setColor(v) {
      if (typeof v === 'number') {
        const i = Math.floor(v);
        if (i < 0 || i >= PALETTE.length) throw new LogoError('setpencolor numbers go from 0 to 15');
        this.color = PALETTE[i];
      } else if (typeof v === 'string') {
        if (v === 'black') this.color = null;
        else if (CSS.supports('color', v)) this.color = v;
        else throw new LogoError(`I don't know the colour "${v}"`);
      } else {
        throw new LogoError('setpencolor needs a number or a colour name, like "red');
      }
    }

    // drawing

    resize() {
      const dpr = window.devicePixelRatio || 1;
      this.w = this.stage.clientWidth;
      this.h = this.stage.clientHeight;
      for (const c of [this.paper, this.sprite]) {
        c.width = Math.round(this.w * dpr);
        c.height = Math.round(this.h * dpr);
        c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      this.redraw();
    }

    css(name) {
      return getComputedStyle(this.root).getPropertyValue(name).trim();
    }

    drawSegment(ctx, s) {
      const cx = this.w / 2, cy = this.h / 2;
      ctx.strokeStyle = s.color || this.ink;
      ctx.lineWidth = s.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + s.x1, cy - s.y1);
      ctx.lineTo(cx + s.x2, cy - s.y2);
      ctx.stroke();
    }

    redraw() {
      this.ink = this.css('--ink');
      const ctx = this.paper.getContext('2d');
      ctx.clearRect(0, 0, this.w, this.h);
      for (const s of this.segments) this.drawSegment(ctx, s);
      this.drawTurtle();
    }

    drawTurtle() {
      const ctx = this.sprite.getContext('2d');
      ctx.clearRect(0, 0, this.w, this.h);
      if (!this.visible) return;
      ctx.save();
      ctx.translate(this.w / 2 + this.x, this.h / 2 - this.y);
      ctx.rotate(this.heading * Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(8, 8);
      ctx.lineTo(0, 4);
      ctx.lineTo(-8, 8);
      ctx.closePath();
      ctx.fillStyle = this.css('--accent');
      ctx.fill();
      ctx.restore();
    }

    // running

    say(text, isError = false) {
      this.msg.textContent = text;
      this.msg.classList.toggle('logo-error', isError);
    }

    halt(text) {
      if (this.run) this.run.cancelled = true;
      this.run = null;
      if (text !== undefined) this.say(text);
    }

    start() {
      this.halt();
      this.home();
      this.redraw();

      const printed = [];
      let gen;
      try {
        const { procs, main } = extractProcs(nest(tokenize(this.code.value)));
        const interp = new Interp(this, procs, line => {
          printed.push(line);
          this.say(printed.slice(-3).join('\n'));
        });
        gen = interp.runList(main, null);
      } catch (e) {
        return this.fail(e);
      }

      const run = { cancelled: false };
      this.run = run;
      this.say('Running...');

      const frame = () => {
        if (run.cancelled) return;
        const budget = SPEEDS[+this.speed.value] ?? 8;
        const t0 = performance.now();
        try {
          for (let i = 0; i < budget; i++) {
            if (gen.next().done) return this.finish(printed);
            if (budget === Infinity && performance.now() - t0 > 30) break;
          }
        } catch (e) {
          if (e === STOP) return this.finish(printed);
          return this.fail(e);
        }
        this.drawTurtle();
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }

    finish(printed) {
      this.run = null;
      this.drawTurtle();
      this.say(printed.length ? printed.slice(-3).join('\n') : 'Done.');
    }

    fail(e) {
      this.run = null;
      this.drawTurtle();
      if (e instanceof LogoError) this.say(e.message, true);
      else if (e instanceof RangeError) this.say('That went too deep, so I stopped it', true);
      else throw e;
    }
  }

  document.querySelectorAll('[data-logo]').forEach(root => new Board(root));
})();
