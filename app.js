// SCOA home page. Built from the design canvas; runs on Preact + htm (vendored, no build step).
import { h, render, Component as PreactComponent } from './vendor/preact.module.js';
import htm from './vendor/htm.module.js';

const html = htm.bind(h);

// Every section's logic below extends this: renderVals() feeds the page template.
class DCLogic extends PreactComponent {
  render() { return view(this.renderVals()); }
}

class Part {
  constructor() { this.state = {}; this.host = null; }
  get props() { return (this.host && this.host.props) || {}; }
  setState(u, cb) {
    var next = typeof u === 'function' ? u(this.state, this.props) : u;
    if (next) this.state = Object.assign({}, this.state, next);
    if (this.host && this.host.live) this.host.setState(function (s) { return { tick: (s.tick || 0) + 1 }; });
    if (cb) cb();
  }
}

class HeroPart extends Part {
  constructor(props) {
    super(props);
    this.state = { phase: 'play', menu: false, nudge: 0 };
    this.links = [
      { label: 'About', href: '#about' },
      { label: 'Events', href: '#events' },
      { label: 'Team', href: '#team' },
      { label: 'Careers', href: '#careers' }
    ].map(function (l, i) { return { label: l.label, href: l.href, delay: 450 + i * 70 }; });
    var self = this;
    this.onMove = function (e) {
      var el = e.currentTarget;
      var r = el.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      var sway = self.props.sway == null ? 5 : Number(self.props.sway);
      var lensOn = self.props.lens == null ? true : !!self.props.lens;
      el.style.setProperty('--mx', x + 'px');
      el.style.setProperty('--my', y + 'px');
      var near = false;
      var hit = el.querySelector('.base .hit');
      if (hit && lensOn && r.width > 760) {
        var h = hit.getBoundingClientRect();
        var gx = Math.max(h.left - e.clientX, 0, e.clientX - h.right);
        var gy = Math.max(h.top - e.clientY, 0, e.clientY - h.bottom);
        near = Math.sqrt(gx * gx + gy * gy) < 70;
      }
      el.style.setProperty('--r', near ? '130px' : '0px');
      el.setAttribute('data-lens', near ? '1' : '0');
      var dx = (x - r.width / 2) / (r.width / 2);
      el.style.setProperty('--sw', (-dx * sway).toFixed(2) + 'deg');
    };
    this.onLeave = function (e) {
      e.currentTarget.setAttribute('data-lens', '0');
      e.currentTarget.style.setProperty('--r', '0px');
      e.currentTarget.style.setProperty('--sw', '0deg');
    };
    this.nudge = function (e) {
      var b = e.currentTarget.getBoundingClientRect();
      var dir = (e.clientX - b.left) < b.width / 2 ? -1 : 1;
      var st = e.currentTarget.closest('.stage');
      if (st) st.style.setProperty('--dir', String(dir));
      self.setState(function (s) { return { nudge: s.nudge + 1 }; });
    };
    this.magnet = function (e) {
      var el = e.currentTarget;
      var r = el.getBoundingClientRect();
      el.style.setProperty('--bx', ((e.clientX - r.left - r.width / 2) * 0.28).toFixed(1) + 'px');
      el.style.setProperty('--by', ((e.clientY - r.top - r.height / 2) * 0.4).toFixed(1) + 'px');
    };
    this.unmagnet = function (e) {
      e.currentTarget.style.setProperty('--bx', '0px');
      e.currentTarget.style.setProperty('--by', '0px');
    };
    this.replay = function (e) {
      if (e && e.preventDefault) e.preventDefault();
      clearTimeout(self.t);
      self.setState({ phase: 'pre', menu: false, nudge: 0 });
      self.t = setTimeout(function () { self.setState({ phase: 'play' }); }, 80);
    };
    this.toggleMenu = function () { self.setState(function (s) { return { menu: !s.menu }; }); };
  }
  componentWillUnmount() { clearTimeout(this.t); }
  renderVals() {
    var n = this.state.nudge;
    return {
      rootClass: 'v1 ' + this.state.phase,
      swingClass: n === 0 ? 'swing' : (n % 2 ? 'swing na' : 'swing nb'),
      links: this.links,
      menuOpen: this.state.menu,
      onMove: this.onMove,
      onLeave: this.onLeave,
      nudge: this.nudge,
      magnet: this.magnet,
      unmagnet: this.unmagnet,
      replay: this.replay,
      toggleMenu: this.toggleMenu
    };
  }
}

class AboutPart extends Part {
  constructor(props) {
    super(props);
    this.items = [
      { name: 'Networking events' },
      { name: 'Case competitions' },
      { name: 'Workshops' },
      { name: 'Social events' }
    ];
    this.state = { phase: 'play', diag: 'dplay', active: 0, auto: true, swap: 0 };
    var self = this;
    this.go = function (i, stop) {
      self.setState(function (s) {
        var n = (i + 4) % 4;
        return { active: n, auto: stop ? false : s.auto, swap: n === s.active ? s.swap : s.swap + 1 };
      });
    };
    this.picks = [0, 1, 2, 3].map(function (i) { return function () { self.go(i, true); }; });
    this.onMove = function (e) {
      var el = e.currentTarget, r = el.getBoundingClientRect();
      el.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      el.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    };
    this.onLeave = function (e) {
      e.currentTarget.style.setProperty('--px', '0');
      e.currentTarget.style.setProperty('--py', '0');
    };
    this.repack = function () {
      clearTimeout(self.rt);
      self.setState({ diag: 'dpre' });
      self.rt = setTimeout(function () { self.setState({ diag: 'dplay' }); }, 60);
    };
  }
  componentDidMount() {
    var self = this;
    this.iv = setInterval(function () {
      var on = self.props.autoplay == null ? true : !!self.props.autoplay;
      if (on && self.state.auto) self.go(self.state.active + 1, false);
    }, 3200);
  }
  componentWillUnmount() { clearInterval(this.iv); clearTimeout(this.rt); }
  renderVals() {
    var a = this.state.active, it = this.items[a], sw = this.state.swap;
    var v = {
      rootClass: 's1 ' + this.state.phase,
      diagClass: this.state.diag,
      cur: { num: '0' + (a + 1), name: it.name },
      swapKey: sw === 0 ? '' : (sw % 2 ? 'sa' : 'sb'),
      onMove: this.onMove, onLeave: this.onLeave, repack: this.repack
    };
    for (var i = 0; i < 4; i++) {
      v['bx' + i] = 'bx' + (i === a ? ' on' : '');
      v['lb' + i] = 'lb' + (i === a ? ' on' : '');
      v['pick' + i] = this.picks[i];
    }
    return v;
  }
}

class EventsPart extends Part {
  constructor(props) {
    super(props);
    this.state = { active: 0, auto: true };
    var self = this;
    this.picks = [0, 1, 2, 3].map(function (i) { return function () { self.setState({ active: i, auto: false }); }; });
  }
  componentDidMount() {
    var self = this;
    this.iv = setInterval(function () {
      var on = self.props.autoplay == null ? true : !!self.props.autoplay;
      if (on && self.state.auto) self.setState(function (s) { return { active: (s.active + 1) % 4 }; });
    }, 2800);
  }
  componentWillUnmount() { clearInterval(this.iv); }
  renderVals() {
    var a = this.state.active, v = { rootClass: 'e2 play', trolleyTop: a * 132 + 66 };
    for (var i = 0; i < 4; i++) {
      v['s' + i] = 'st' + (i === a ? ' on' : '');
      v['t' + i] = i === a ? ' on' : '';
      v['pick' + i] = this.picks[i];
    }
    return v;
  }
}

class TeamPart extends Part {
  constructor(props) {
    super(props);
    this.N = 12;
    this.state = { slots: [0, 1, 2], flips: [0, 0, 0], spins: 0, hover: false };
    var self = this;
    this.timers = [];
    this.turn = function () {
      var base = (self.state.slots[2] + 1) % self.N;
      [0, 1, 2].forEach(function (i) {
        self.timers.push(setTimeout(function () {
          self.setState(function (s) { var f = s.flips.slice(); f[i]++; return { flips: f }; });
        }, i * 120));
        self.timers.push(setTimeout(function () {
          self.setState(function (s) { var sl = s.slots.slice(); sl[i] = (base + i) % self.N; return { slots: sl }; });
        }, 310 + i * 120));
      });
    };
    this.shuffle = function () {
      self.setState(function (s) { return { spins: s.spins + 1 }; });
      self.last = Date.now();
      self.turn();
    };
    this.hoverOn = function () { self.setState({ hover: true }); };
    this.hoverOff = function () { self.setState({ hover: false }); };
  }
  componentDidMount() {
    var self = this;
    this.last = Date.now();
    this.iv = setInterval(function () {
      var on = self.props.autoplay == null ? true : !!self.props.autoplay;
      if (on && !self.state.hover && Date.now() - self.last > 2840) { self.last = Date.now(); self.turn(); }
    }, 100);
  }
  componentWillUnmount() { clearInterval(this.iv); this.timers.forEach(clearTimeout); }
  renderVals() {
    var s = this.state, self = this;
    var cards = s.slots.map(function (p, i) {
      var n = p + 1;
      return {
        cls: 'card k' + i,
        d: 450 + i * 140,
        inner: 'inner' + (s.flips[i] === 0 ? '' : (s.flips[i] % 2 ? ' fa' : ' fb')),
        ph: 'ph pv' + (p % 3),
        num: (n < 10 ? '0' : '') + n
      };
    });
    return {
      cards: cards,
      spinCls: s.spins === 0 ? '' : (s.spins % 2 ? 'sa' : 'sb'),
      shuffle: this.shuffle, hoverOn: this.hoverOn, hoverOff: this.hoverOff
    };
  }
}

class FooterPart extends Part {
  constructor(props) {
    super(props);
    this.state = { laps: 0 };
    this.busy = false;
    var self = this;
    this.drive = function () {
      if (self.busy) return;
      self.busy = true;
      self.setState(function (s) { return { laps: s.laps + 1 }; });
      clearTimeout(self.t);
      self.t = setTimeout(function () { self.busy = false; }, 3300);
    };
  }
  componentWillUnmount() { clearTimeout(this.t); }
  renderVals() {
    var n = this.state.laps;
    return { drive: this.drive, truckCls: n === 0 ? '' : (n % 2 ? 'la' : 'lb') };
  }
}

class Component extends DCLogic {
  constructor(props) {
    super(props);
    var self = this;
    this.keys = ['hero', 'about', 'events', 'team', 'careers', 'footer'];
    this.state = { tick: 0, seen: { hero: true } };
    this.parts = { h_: new HeroPart(props), a_: new AboutPart(props), e_: new EventsPart(props), t_: new TeamPart(props), f_: new FooterPart(props) };
    Object.keys(this.parts).forEach(function (k) { self.parts[k].host = self; });
    this.els = {};
    this.secRefs = {};
    this.keys.forEach(function (k) { self.secRefs[k] = function (el) { if (el) self.els[k] = el; }; });
  }
  componentDidMount() {
    var self = this;
    this.live = true;
    Object.keys(this.parts).forEach(function (k) { var p = self.parts[k]; if (p.componentDidMount) p.componentDidMount(); });
    this.watch();
  }
  showAll() {
    var all = {};
    this.keys.forEach(function (k) { all[k] = true; });
    this.setState({ seen: all });
  }
  watch() {
    var self = this;
    try {
      var list = this.keys.map(function (k) { return self.els[k]; }).filter(Boolean);
      if (list.length < this.keys.length && typeof document !== 'undefined') {
        list = Array.prototype.slice.call(document.querySelectorAll('[data-sec]'));
      }
      if (!list.length || typeof IntersectionObserver === 'undefined') { this.showAll(); return; }
      this.io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var k = en.target.getAttribute('data-sec');
          self.io.unobserve(en.target);
          self.setState(function (s) { var n = Object.assign({}, s.seen); n[k] = true; return { seen: n }; });
        });
      }, { threshold: 0.12 });
      list.forEach(function (el) { self.io.observe(el); });
    } catch (err) { this.showAll(); }
  }
  componentWillUnmount() {
    var self = this;
    this.live = false;
    if (this.io) this.io.disconnect();
    Object.keys(this.parts).forEach(function (k) { var p = self.parts[k]; if (p.componentWillUnmount) p.componentWillUnmount(); });
  }
  renderVals() {
    var v = {}, self = this, seen = this.state.seen || {};
    Object.keys(this.parts).forEach(function (pre) {
      var vals = self.parts[pre].renderVals();
      Object.keys(vals).forEach(function (k) { v[pre + k] = vals[k]; });
    });
    this.keys.forEach(function (k) {
      v['sec_' + k] = seen[k] ? 'in' : '';
      v['ref_' + k] = self.secRefs[k];
    });
    return v;
  }
}

function view(v) {
  return html`<div class="page">
<div class="sec ${v.sec_hero}" id="top" data-sec="hero" ref=${v.ref_hero}>
<div class=${v.h_rootClass}>
  <div class="cols" aria-hidden="true">
    <span style="animation-delay: 0ms"></span><span style="animation-delay: 60ms"></span><span style="animation-delay: 120ms"></span><span style="animation-delay: 180ms"></span><span style="animation-delay: 240ms"></span><span style="animation-delay: 300ms"></span>
  </div>

  <header class="nav">
    <a class="brand" href="#top" onClick=${v.h_replay} aria-label="SCOA home, replays the intro">
      <svg class="mark" viewBox="0 0 1310 1112" aria-hidden="true">
        <path class="peak" fill="#FEFDF0" d="M852.915 4.18051L854.225 4.31653C857.905 15.0325 864.745 29.8635 869.375 40.5835L1269.09 964.927C1282.35 995.568 1297.09 1028.12 1309.48 1058.98C1298.69 1059.66 1280.59 1062.89 1269.44 1064.51C1245.15 1068.08 1220.8 1071.41 1196.44 1074.5C1119.58 1084.28 1042.52 1092.33 965.295 1098.65C643.085 1124.06 318.979 1110.54 0 1058.39C9.091 1035.09 19.606 999.318 27.722 974.557L81.692 810.167C98.481 813.737 115.302 817.147 132.153 820.407C148.116 779.197 163.297 734.057 178.559 692.157C194.004 695.757 226.438 707.288 242.114 712.488C255.147 674.678 269.719 636.767 282.973 598.877C381.576 641.627 481.848 687.957 580.154 732.027L1309.97 1059.07C1280.08 1033.66 1240.53 1004.68 1209.18 980.397L1019.83 833.647C999.585 741.017 981.465 643.557 962.725 550.404L852.915 4.18051ZM1169.33 1030.46C1174.39 1031.61 1199.11 1037.06 1203.11 1036.52C1196.03 1032.93 1183.84 1029.73 1175.82 1027.06L1125.15 1010.37L211.813 713.897C204.395 711.487 191.819 707.838 185.046 705.057C172.255 743.477 156.71 784.237 142.872 822.637L1078.31 1012.11L1140.74 1024.86C1145.73 1025.88 1165.09 1030.18 1169.33 1030.46Z"></path>
        <path class="flag" fill="#FEEA00" d="M852.915 4.18051L852.835 0.017511C856.995 -0.589489 886.315 14.7655 892.955 17.8855L993.885 65.4145C1076.21 104.236 1161.27 143.153 1242.98 182.853C1177.99 175.134 1111.26 170.756 1046.09 163.746C1020.3 160.972 988.295 159.412 963.185 155.522C928.075 107.714 890.175 53.4635 856.215 4.4215L854.225 4.31653L852.915 4.18051Z"></path>
      </svg>
    </a>
    <nav class="links" aria-label="Main">
      ${(v.h_links || []).map((l) => html`
        <a class="lk" href=${l.href} style="animation-delay: ${l.delay}ms"><span class="roll"><span class="r1">${l.label}</span><span class="r2" aria-hidden="true">${l.label}</span></span></a>
      `)}
    </nav>
    <a class="join" href="https://www.showpass.com/m/ubc-scoa-membership-20262027/" target="_blank" rel="noopener">
      <span>Join SCOA</span>
      <span class="dot"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>
    </a>
    <button class="menu" type="button" aria-label="Open menu" aria-expanded=${v.h_menuOpen} onClick=${v.h_toggleMenu}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 7h14M3 13h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path></svg>
    </button>
  </header>

  ${v.h_menuOpen ? html`
    <nav class="sheet" aria-label="Mobile">
      ${(v.h_links || []).map((l) => html`
        <a href=${l.href} onClick=${v.h_toggleMenu}>${l.label}</a>
      `)}
      <a href="https://www.showpass.com/m/ubc-scoa-membership-20262027/" target="_blank" rel="noopener" onClick=${v.h_toggleMenu}>Join SCOA</a>
    </nav>
  ` : null}

  <main class="stage" onMouseMove=${v.h_onMove} onMouseLeave=${v.h_onLeave}>
    <div class="layer base">
      <h1 class="hl">
        <span class="line l1"><span class="ch" style="animation-delay: 560ms">E</span><span class="ch" style="animation-delay: 605ms">v</span><span class="ch" style="animation-delay: 650ms">e</span><span class="ch" style="animation-delay: 695ms">r</span><span class="ch" style="animation-delay: 740ms">y</span><span class="ch" style="animation-delay: 785ms">t</span><span class="ch" style="animation-delay: 830ms">h</span><span class="ch" style="animation-delay: 875ms">i</span><span class="ch" style="animation-delay: 920ms">n</span><span class="ch" style="animation-delay: 965ms">g</span></span>
        <span class="line l2"><span class="ch" style="animation-delay: 950ms">m</span><span class="ch" style="animation-delay: 1010ms">o</span><span class="ch" style="animation-delay: 1070ms">v</span><span class="ch" style="animation-delay: 1130ms">e</span><span class="ch" style="animation-delay: 1190ms">s</span><span class="ch yd" style="animation-delay: 1250ms">.</span></span>
      </h1>
      <div class="rig">
        <div class=${v.h_swingClass}><div class="follow"><div class="drop">
          <span class="cable"></span>
          <button class="hit" type="button" aria-label="Give the container a push" onClick=${v.h_nudge}></button>
          <svg class="box" viewBox="0 -70 424 430" aria-hidden="true">
            <defs><clipPath id="v1clip"><polygon points="30.0,200.0 289.8,350.0 289.8,220.0 30.0,70.0"></polygon></clipPath></defs>
            <polygon class="c-top" points="30.0,70.0 289.8,220.0 393.7,160.0 133.9,10.0"/>
<polygon class="c-long" points="30.0,200.0 289.8,350.0 289.8,220.0 30.0,70.0"/>
<polygon class="c-end" points="289.8,350.0 393.7,290.0 393.7,160.0 289.8,220.0"/>
<path class="c-rib" d="M40.8,198.2L40.8,84.2M51.7,204.5L51.7,90.5M62.5,210.8L62.5,96.8M73.3,217.0L73.3,103.0M84.1,223.2L84.1,109.2M95.0,229.5L95.0,115.5M105.8,235.8L105.8,121.8M116.6,242.0L116.6,128.0M127.4,248.2L127.4,134.2M138.3,254.5L138.3,140.5M149.1,260.8L149.1,146.8M159.9,267.0L159.9,153.0M170.7,273.2L170.7,159.2M181.6,279.5L181.6,165.5M192.4,285.8L192.4,171.8M203.2,292.0L203.2,178.0M214.0,298.2L214.0,184.2M224.9,304.5L224.9,190.5M235.7,310.8L235.7,196.8M246.5,317.0L246.5,203.0M257.3,323.2L257.3,209.2M268.2,329.5L268.2,215.5M279.0,335.8L279.0,221.8"/>
<path class="c-rib faint" d="M51.4,76.4L145.0,22.4M67.7,85.8L161.2,31.8M83.9,95.1L177.4,41.1M100.1,104.5L193.7,50.5M116.4,113.9L209.9,59.9M132.6,123.2L226.2,69.2M148.9,132.6L242.4,78.6M165.1,142.0L258.6,88.0M181.3,151.4L274.9,97.4M197.6,160.8L291.1,106.8M213.8,170.1L307.3,116.1M230.1,179.5L323.6,125.5M246.3,188.9L339.8,134.9M262.5,198.2L356.1,144.2M278.8,207.6L372.3,153.6"/>
<path class="c-door" d="M341.8,316.0L341.8,194.0"/>
<path class="c-bar" d="M306.4,330.4L306.4,220.4M325.1,319.6L325.1,209.6M358.4,300.4L358.4,190.4M377.1,289.6L377.1,179.6"/>
<path class="c-bar" d="M306.4,281.9L312.5,278.4M325.1,271.1L331.2,267.6M358.4,251.9L364.5,248.4M377.1,241.1L383.2,237.6"/>
<path class="c-edge" d="M30.0,200.0L289.8,350.0L393.7,290.0M30.0,200.0L30.0,70.0L289.8,220.0L393.7,160.0L133.9,10.0L30.0,70.0M289.8,350.0L289.8,220.0M393.7,290.0L393.7,160.0"/>
<path class="c-rail" d="M30.0,195.0L289.8,345.0M30.0,75.0L289.8,225.0"/>
<rect class="c-cast" x="26.0" y="196.0" width="8" height="8"/><rect class="c-cast" x="285.8" y="346.0" width="8" height="8"/><rect class="c-cast" x="389.7" y="286.0" width="8" height="8"/><rect class="c-cast" x="26.0" y="66.0" width="8" height="8"/><rect class="c-cast" x="285.8" y="216.0" width="8" height="8"/><rect class="c-cast" x="389.7" y="156.0" width="8" height="8"/><rect class="c-cast" x="129.9" y="6.0" width="8" height="8"/>
            <g transform="matrix(0.8660 0.5000 0 1 30.0 70.0)">
              <text class="c-txt" x="22" y="60">SCOA</text>
              <text class="c-code" x="23" y="78">SCOU 4912 3</text>
              <g transform="translate(196 28) scale(0.064)"><path fill="#FEFDF0" d="M852.915 4.18051L854.225 4.31653C857.905 15.0325 864.745 29.8635 869.375 40.5835L1269.09 964.927C1282.35 995.568 1297.09 1028.12 1309.48 1058.98C1298.69 1059.66 1280.59 1062.89 1269.44 1064.51C1245.15 1068.08 1220.8 1071.41 1196.44 1074.5C1119.58 1084.28 1042.52 1092.33 965.295 1098.65C643.085 1124.06 318.979 1110.54 0 1058.39C9.091 1035.09 19.606 999.318 27.722 974.557L81.692 810.167C98.481 813.737 115.302 817.147 132.153 820.407C148.116 779.197 163.297 734.057 178.559 692.157C194.004 695.757 226.438 707.288 242.114 712.488C255.147 674.678 269.719 636.767 282.973 598.877C381.576 641.627 481.848 687.957 580.154 732.027L1309.97 1059.07C1280.08 1033.66 1240.53 1004.68 1209.18 980.397L1019.83 833.647C999.585 741.017 981.465 643.557 962.725 550.404L852.915 4.18051ZM1169.33 1030.46C1174.39 1031.61 1199.11 1037.06 1203.11 1036.52C1196.03 1032.93 1183.84 1029.73 1175.82 1027.06L1125.15 1010.37L211.813 713.897C204.395 711.487 191.819 707.838 185.046 705.057C172.255 743.477 156.71 784.237 142.872 822.637L1078.31 1012.11L1140.74 1024.86C1145.73 1025.88 1165.09 1030.18 1169.33 1030.46Z"></path><path fill="#FEEA00" d="M852.915 4.18051L852.835 0.017511C856.995 -0.589489 886.315 14.7655 892.955 17.8855L993.885 65.4145C1076.21 104.236 1161.27 143.153 1242.98 182.853C1177.99 175.134 1111.26 170.756 1046.09 163.746C1020.3 160.972 988.295 159.412 963.185 155.522C928.075 107.714 890.175 53.4635 856.215 4.4215L854.225 4.31653L852.915 4.18051Z"></path></g>
            </g>
            <g clip-path="url(#v1clip)"><polygon class="sheen" points="-40,-80 10,-80 -90,440 -140,440"></polygon></g>
            <path class="c-sling" d="M212 -70V-60M212.0,-52.0L30.0,70.0M212.0,-52.0L289.8,220.0M212.0,-52.0L393.7,160.0M212.0,-52.0L133.9,10.0"></path>
            <rect class="c-hk" x="205" y="-62" width="14" height="10" rx="2"></rect>
          </svg>
        </div></div></div>
      </div>
    </div>

    <div class="layer xray" aria-hidden="true">
      <div class="hl">
        <span class="line l1"><span class="ch" style="animation-delay: 560ms">E</span><span class="ch" style="animation-delay: 605ms">v</span><span class="ch" style="animation-delay: 650ms">e</span><span class="ch" style="animation-delay: 695ms">r</span><span class="ch" style="animation-delay: 740ms">y</span><span class="ch" style="animation-delay: 785ms">t</span><span class="ch" style="animation-delay: 830ms">h</span><span class="ch" style="animation-delay: 875ms">i</span><span class="ch" style="animation-delay: 920ms">n</span><span class="ch" style="animation-delay: 965ms">g</span></span>
        <span class="line l2"><span class="ch" style="animation-delay: 950ms">m</span><span class="ch" style="animation-delay: 1010ms">o</span><span class="ch" style="animation-delay: 1070ms">v</span><span class="ch" style="animation-delay: 1130ms">e</span><span class="ch" style="animation-delay: 1190ms">s</span><span class="ch yd" style="animation-delay: 1250ms">.</span></span>
      </div>
      <div class="rig">
        <div class=${v.h_swingClass}><div class="follow"><div class="drop">
          <span class="cable"></span>
          <svg class="box" viewBox="0 -70 424 430">
            <path class="x-hidden" d="M133.9,140.0L30.0,200.0M133.9,140.0L393.7,290.0M133.9,140.0L133.9,10.0"/>
<g class="x-box"><polygon class="bf" points="94.1,177.0 133.9,200.0 133.9,160.0 94.1,137.0"/><polygon class="br" points="133.9,200.0 179.0,174.0 179.0,134.0 133.9,160.0"/><polygon class="bt" points="94.1,137.0 133.9,160.0 179.0,134.0 139.1,111.0"/><path class="tape" d="M114.0,148.5L159.0,122.5"/></g><g class="x-box"><polygon class="bf" points="94.1,137.0 133.9,160.0 133.9,120.0 94.1,97.0"/><polygon class="br" points="133.9,160.0 179.0,134.0 179.0,94.0 133.9,120.0"/><polygon class="bt" points="94.1,97.0 133.9,120.0 179.0,94.0 139.1,71.0"/><path class="tape" d="M114.0,108.5L159.0,82.5"/></g><g class="x-box"><polygon class="bf" points="139.1,203.0 179.0,226.0 179.0,186.0 139.1,163.0"/><polygon class="br" points="179.0,226.0 224.0,200.0 224.0,160.0 179.0,186.0"/><polygon class="bt" points="139.1,163.0 179.0,186.0 224.0,160.0 184.2,137.0"/><path class="tape" d="M159.0,174.5L204.1,148.5"/></g><g class="x-box"><polygon class="bf" points="139.1,163.0 179.0,186.0 179.0,146.0 139.1,123.0"/><polygon class="br" points="179.0,186.0 224.0,160.0 224.0,120.0 179.0,146.0"/><polygon class="bt" points="139.1,123.0 179.0,146.0 224.0,120.0 184.2,97.0"/><path class="tape" d="M159.0,134.5L204.1,108.5"/></g><g class="x-box"><polygon class="bf" points="139.1,123.0 179.0,146.0 179.0,106.0 139.1,83.0"/><polygon class="br" points="179.0,146.0 224.0,120.0 224.0,80.0 179.0,106.0"/><polygon class="bt" points="139.1,83.0 179.0,106.0 224.0,80.0 184.2,57.0"/><path class="tape" d="M159.0,94.5L204.1,68.5"/></g><g class="x-box"><polygon class="bf" points="184.2,229.0 224.0,252.0 224.0,212.0 184.2,189.0"/><polygon class="br" points="224.0,252.0 269.0,226.0 269.0,186.0 224.0,212.0"/><polygon class="bt" points="184.2,189.0 224.0,212.0 269.0,186.0 229.2,163.0"/><path class="tape" d="M204.1,200.5L249.1,174.5"/></g><g class="x-box"><polygon class="bf" points="184.2,189.0 224.0,212.0 224.0,172.0 184.2,149.0"/><polygon class="br" points="224.0,212.0 269.0,186.0 269.0,146.0 224.0,172.0"/><polygon class="bt" points="184.2,149.0 224.0,172.0 269.0,146.0 229.2,123.0"/><path class="tape" d="M204.1,160.5L249.1,134.5"/></g><g class="x-box"><polygon class="bf" points="229.2,255.0 269.0,278.0 269.0,238.0 229.2,215.0"/><polygon class="br" points="269.0,278.0 314.1,252.0 314.1,212.0 269.0,238.0"/><polygon class="bt" points="229.2,215.0 269.0,238.0 314.1,212.0 274.2,189.0"/><path class="tape" d="M249.1,226.5L294.1,200.5"/></g><g class="x-box"><polygon class="bf" points="229.2,215.0 269.0,238.0 269.0,198.0 229.2,175.0"/><polygon class="br" points="269.0,238.0 314.1,212.0 314.1,172.0 269.0,198.0"/><polygon class="bt" points="229.2,175.0 269.0,198.0 314.1,172.0 274.2,149.0"/><path class="tape" d="M249.1,186.5L294.1,160.5"/></g><g class="x-box"><polygon class="bf" points="274.2,281.0 314.1,304.0 314.1,264.0 274.2,241.0"/><polygon class="br" points="314.1,304.0 359.1,278.0 359.1,238.0 314.1,264.0"/><polygon class="bt" points="274.2,241.0 314.1,264.0 359.1,238.0 319.3,215.0"/><path class="tape" d="M294.1,252.5L339.2,226.5"/></g><g class="x-box"><polygon class="bf" points="47.3,204.0 87.2,227.0 87.2,187.0 47.3,164.0"/><polygon class="br" points="87.2,227.0 132.2,201.0 132.2,161.0 87.2,187.0"/><polygon class="bt" points="47.3,164.0 87.2,187.0 132.2,161.0 92.4,138.0"/><path class="tape" d="M67.2,175.5L112.3,149.5"/></g><g class="x-box"><polygon class="bf" points="47.3,164.0 87.2,187.0 87.2,147.0 47.3,124.0"/><polygon class="br" points="87.2,187.0 132.2,161.0 132.2,121.0 87.2,147.0"/><polygon class="bt" points="47.3,124.0 87.2,147.0 132.2,121.0 92.4,98.0"/><path class="tape" d="M67.2,135.5L112.3,109.5"/></g><g class="x-box"><polygon class="bf" points="92.4,230.0 132.2,253.0 132.2,213.0 92.4,190.0"/><polygon class="br" points="132.2,253.0 177.2,227.0 177.2,187.0 132.2,213.0"/><polygon class="bt" points="92.4,190.0 132.2,213.0 177.2,187.0 137.4,164.0"/><path class="tape" d="M112.3,201.5L157.3,175.5"/></g><g class="x-box"><polygon class="bf" points="92.4,190.0 132.2,213.0 132.2,173.0 92.4,150.0"/><polygon class="br" points="132.2,213.0 177.2,187.0 177.2,147.0 132.2,173.0"/><polygon class="bt" points="92.4,150.0 132.2,173.0 177.2,147.0 137.4,124.0"/><path class="tape" d="M112.3,161.5L157.3,135.5"/></g><g class="x-box"><polygon class="bf" points="137.4,256.0 177.2,279.0 177.2,239.0 137.4,216.0"/><polygon class="br" points="177.2,279.0 222.3,253.0 222.3,213.0 177.2,239.0"/><polygon class="bt" points="137.4,216.0 177.2,239.0 222.3,213.0 182.4,190.0"/><path class="tape" d="M157.3,227.5L202.3,201.5"/></g><g class="x-box"><polygon class="bf" points="137.4,216.0 177.2,239.0 177.2,199.0 137.4,176.0"/><polygon class="br" points="177.2,239.0 222.3,213.0 222.3,173.0 177.2,199.0"/><polygon class="bt" points="137.4,176.0 177.2,199.0 222.3,173.0 182.4,150.0"/><path class="tape" d="M157.3,187.5L202.3,161.5"/></g><g class="x-box"><polygon class="bf" points="137.4,176.0 177.2,199.0 177.2,159.0 137.4,136.0"/><polygon class="br" points="177.2,199.0 222.3,173.0 222.3,133.0 177.2,159.0"/><polygon class="bt" points="137.4,136.0 177.2,159.0 222.3,133.0 182.4,110.0"/><path class="tape" d="M157.3,147.5L202.3,121.5"/></g><g class="x-box"><polygon class="bf" points="182.4,282.0 222.3,305.0 222.3,265.0 182.4,242.0"/><polygon class="br" points="222.3,305.0 267.3,279.0 267.3,239.0 222.3,265.0"/><polygon class="bt" points="182.4,242.0 222.3,265.0 267.3,239.0 227.5,216.0"/><path class="tape" d="M202.3,253.5L247.4,227.5"/></g><g class="x-box hl"><polygon class="bf" points="182.4,242.0 222.3,265.0 222.3,225.0 182.4,202.0"/><polygon class="br" points="222.3,265.0 267.3,239.0 267.3,199.0 222.3,225.0"/><polygon class="bt" points="182.4,202.0 222.3,225.0 267.3,199.0 227.5,176.0"/><path class="tape" d="M202.3,213.5L247.4,187.5"/></g><g class="x-box"><polygon class="bf" points="227.5,308.0 267.3,331.0 267.3,291.0 227.5,268.0"/><polygon class="br" points="267.3,331.0 312.3,305.0 312.3,265.0 267.3,291.0"/><polygon class="bt" points="227.5,268.0 267.3,291.0 312.3,265.0 272.5,242.0"/><path class="tape" d="M247.4,279.5L292.4,253.5"/></g>
<path class="x-edge" d="M30.0,200.0L289.8,350.0L393.7,290.0M30.0,200.0L30.0,70.0L289.8,220.0L393.7,160.0L133.9,10.0L30.0,70.0M289.8,350.0L289.8,220.0M393.7,290.0L393.7,160.0"/>
            <path class="x-sling" d="M212 -70V-60M212.0,-52.0L30.0,70.0M212.0,-52.0L289.8,220.0M212.0,-52.0L393.7,160.0M212.0,-52.0L133.9,10.0"></path>
            <rect class="c-hk" x="205" y="-62" width="14" height="10" rx="2"></rect>
          </svg>
        </div></div></div>
      </div>
    </div>

    <div class="ring" aria-hidden="true"><span class="rl">Look inside</span></div>
  </main>

  <p class="meta">Vancouver, BC<br/>49.26° N, 123.25° W</p>

  <div class="foot">
    <div class="lead">
      <a class="pass" href="https://www.showpass.com/m/ubc-scoa-membership-20262027/" target="_blank" rel="noopener">
        <span class="pmain">
          <svg class="bars" viewBox="0 0 56 46" aria-hidden="true"><rect x="0" y="0" width="2" height="46"></rect><rect x="3" y="0" width="1" height="46"></rect><rect x="5" y="0" width="3" height="46"></rect><rect x="10" y="0" width="1" height="46"></rect><rect x="12" y="0" width="2" height="46"></rect><rect x="15" y="0" width="1" height="46"></rect><rect x="18" y="0" width="3" height="46"></rect><rect x="22" y="0" width="1" height="46"></rect><rect x="24" y="0" width="2" height="46"></rect><rect x="28" y="0" width="1" height="46"></rect><rect x="30" y="0" width="1" height="46"></rect><rect x="34" y="0" width="2" height="46"></rect><rect x="37" y="0" width="1" height="46"></rect><rect x="40" y="0" width="1" height="46"></rect><rect x="42" y="0" width="3" height="46"></rect><rect x="46" y="0" width="2" height="46"></rect><rect x="49" y="0" width="1" height="46"></rect><rect x="51" y="0" width="2" height="46"></rect><rect x="55" y="0" width="1" height="46"></rect></svg>
          <span class="scan" aria-hidden="true"></span>
          <span class="ptxt"><strong>Buy a membership</strong><small>Your member pass for the year</small></span>
        </span>
        <span class="ptab"><span class="pdot"><svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></span>
      </a>
      <p class="lede">SCOA is the Supply Chain & Operations Association at UBC Sauder. We bring students together with the people behind how things get made, moved and delivered.</p>
    </div>
  </div>
</div>
</div>
<div class="sec ${v.sec_about}" id="about" data-sec="about" ref=${v.ref_about}>
<section class=${v.a_rootClass} aria-labelledby="about-a">
  <div class="cols" aria-hidden="true"><span style="animation-delay: 0ms"></span><span style="animation-delay: 60ms"></span><span style="animation-delay: 120ms"></span><span style="animation-delay: 180ms"></span><span style="animation-delay: 240ms"></span><span style="animation-delay: 300ms"></span></div>

  <div class="copy">
    <p class="tag"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M11 2 20 7v8l-9 5-9-5V7l9-5Z M2 7l9 5 9-5 M11 12v8" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"></path></svg>About the club</p>
    <h2 class="head" id="about-a"><span class="w" style="animation-delay: 150ms">From</span> <span class="w" style="animation-delay: 188ms">the</span> <span class="w" style="animation-delay: 226ms">classroom</span> <span class="w" style="animation-delay: 264ms">to</span> <span class="w" style="animation-delay: 302ms">the</span> <span class="hm h1"><span class="w" style="animation-delay: 340ms">supply</span> <span class="w" style="animation-delay: 378ms">chain</span></span><span class="w" style="animation-delay: 416ms">.</span></h2>
    <p class="mission">Our mission is to connect supply chain and operations students to industry professionals and provide them with the skills necessary to succeed in their careers.</p>
    <div class="goals">
      <div class="goal"><strong><b>01</b>Connect</strong><span>Students with the industry professionals behind real supply chains.</span></div>
      <div class="goal"><strong><b>02</b>Equip</strong><span>Students with the skills they need to succeed in their careers.</span></div>
    </div>
    <a class="cta" href="#about-page"><span class="tx">Learn more about us</span><span class="dot"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></a>
  </div>

  <div class="diag" onMouseMove=${v.a_onMove} onMouseLeave=${v.a_onLeave}>
    <div class="stage ${v.a_diagClass}">
      <svg viewBox="0 0 760 620" aria-hidden="true">
        <g class="lid">
          <polygon points="300.3,296.0 560.1,446.0 585.2,319.0 325.4,169.0"></polygon>
          <path d="M320.4,299.1L342.5,187.3M338.9,309.8L361.0,198.0M357.5,320.5L379.6,208.7M376.1,331.2L398.2,219.5M394.6,342.0L416.7,230.2M413.2,352.7L435.3,240.9M431.7,363.4L453.8,251.6M450.3,374.1L472.4,262.3M468.9,384.8L491.0,273.0M487.4,395.5L509.5,283.7M506.0,406.2L528.1,294.5M524.5,417.0L546.6,305.2M543.1,427.7L565.2,315.9"></path>
        </g>
        <g class="crate" onClick=${v.a_repack}>
          <polygon class="k-in" points="199.9,354.0 459.7,504.0 560.1,446.0 300.3,296.0"></polygon>
<polygon class="k-wall" points="300.3,296.0 560.1,446.0 560.1,472.0 300.3,322.0"></polygon>
<polygon class="k-wall2" points="199.9,354.0 300.3,296.0 300.3,322.0 199.9,380.0"></polygon>
<polygon class="k-long" points="199.9,458.0 459.7,608.0 459.7,504.0 199.9,354.0"></polygon>
<polygon class="k-end" points="459.7,608.0 560.1,550.0 560.1,446.0 459.7,504.0"></polygon>
<path class="k-rib" d="M211.7,457.8L211.7,367.8M223.5,464.6L223.5,374.6M235.3,471.5L235.3,381.5M247.1,478.3L247.1,388.3M258.9,485.1L258.9,395.1M270.7,491.9L270.7,401.9M282.5,498.7L282.5,408.7M294.3,505.5L294.3,415.5M306.2,512.4L306.2,422.4M318.0,519.2L318.0,429.2M329.8,526.0L329.8,436.0M341.6,532.8L341.6,442.8M353.4,539.6L353.4,449.6M365.2,546.5L365.2,456.5M377.0,553.3L377.0,463.3M388.8,560.1L388.8,470.1M400.6,566.9L400.6,476.9M412.4,573.7L412.4,483.7M424.2,580.5L424.2,490.5M436.1,587.4L436.1,497.4M447.9,594.2L447.9,504.2"></path>
<path class="k-door" d="M509.9,575.0L509.9,479.0"></path><path class="k-bar" d="M476.8,589.1L476.8,503.1M493.8,579.3L493.8,493.3M526.0,560.7L526.0,474.7M543.1,550.9L543.1,464.9"></path>
<path class="k-edge" d="M199.9,458.0L459.7,608.0L560.1,550.0M199.9,458.0L199.9,354.0L459.7,504.0L560.1,446.0L300.3,296.0L199.9,354.0M459.7,608.0L459.7,504.0M560.1,550.0L560.1,446.0"></path>
          <g transform="matrix(0.8660 0.5000 0 1 199.9 354.0)">
            <text class="k-txt" x="20" y="52">SCOA</text>
            <text class="k-code" x="21" y="70">SCOU 4912 3</text>
            <g transform="translate(206 20) scale(0.056)"><path fill="#FEFDF0" d="M852.915 4.18051L854.225 4.31653C857.905 15.0325 864.745 29.8635 869.375 40.5835L1269.09 964.927C1282.35 995.568 1297.09 1028.12 1309.48 1058.98C1298.69 1059.66 1280.59 1062.89 1269.44 1064.51C1245.15 1068.08 1220.8 1071.41 1196.44 1074.5C1119.58 1084.28 1042.52 1092.33 965.295 1098.65C643.085 1124.06 318.979 1110.54 0 1058.39C9.091 1035.09 19.606 999.318 27.722 974.557L81.692 810.167C98.481 813.737 115.302 817.147 132.153 820.407C148.116 779.197 163.297 734.057 178.559 692.157C194.004 695.757 226.438 707.288 242.114 712.488C255.147 674.678 269.719 636.767 282.973 598.877C381.576 641.627 481.848 687.957 580.154 732.027L1309.97 1059.07C1280.08 1033.66 1240.53 1004.68 1209.18 980.397L1019.83 833.647C999.585 741.017 981.465 643.557 962.725 550.404L852.915 4.18051ZM1169.33 1030.46C1174.39 1031.61 1199.11 1037.06 1203.11 1036.52C1196.03 1032.93 1183.84 1029.73 1175.82 1027.06L1125.15 1010.37L211.813 713.897C204.395 711.487 191.819 707.838 185.046 705.057C172.255 743.477 156.71 784.237 142.872 822.637L1078.31 1012.11L1140.74 1024.86C1145.73 1025.88 1165.09 1030.18 1169.33 1030.46Z"></path><path fill="#FEEA00" d="M852.915 4.18051L852.835 0.017511C856.995 -0.589489 886.315 14.7655 892.955 17.8855L993.885 65.4145C1076.21 104.236 1161.27 143.153 1242.98 182.853C1177.99 175.134 1111.26 170.756 1046.09 163.746C1020.3 160.972 988.295 159.412 963.185 155.522C928.075 107.714 890.175 53.4635 856.215 4.4215L854.225 4.31653L852.915 4.18051Z"></path></g>
          </g>
        </g>
        <path class="trail" style="animation-delay: 950ms" d="M380.0 400.0Q232.1 302.0 133.4 356.0"></path>
        <path class="trail" style="animation-delay: 1060ms" d="M380.0 400.0Q318.5 168.0 277.4 222.0"></path>
        <path class="trail" style="animation-delay: 1170ms" d="M380.0 400.0Q436.1 158.0 473.4 212.0"></path>
        <path class="trail" style="animation-delay: 1280ms" d="M380.0 400.0Q524.9 290.0 621.4 344.0"></path>
        <line class="tick" style="animation-delay: 1500ms" x1="133.4" y1="234.0" x2="133.4" y2="206.0"></line>
        <line class="tick" style="animation-delay: 1610ms" x1="277.4" y1="100.0" x2="277.4" y2="72.0"></line>
        <line class="tick" style="animation-delay: 1720ms" x1="473.4" y1="90.0" x2="473.4" y2="62.0"></line>
        <line class="tick" style="animation-delay: 1830ms" x1="621.4" y1="222.0" x2="621.4" y2="194.0"></line>
        <g class="px px0"><g class="rise r0" style="animation-delay: 1050ms"><g class="bob" style="animation-delay: 0.0s"><g class=${v.a_bx0} onClick=${v.a_pick0} onMouseEnter=${v.a_pick0}><g class="lift"><polygon class="bf" points="78.0,330.0 133.4,362.0 133.4,304.0 78.0,272.0"></polygon><polygon class="br" points="133.4,362.0 188.9,330.0 188.9,272.0 133.4,304.0"></polygon><polygon class="bt" points="78.0,272.0 133.4,304.0 188.9,272.0 133.4,240.0"></polygon><path class="tape" d="M105.7,288.0L161.1,256.0"></path><g transform="matrix(0.8660 0.5000 0 1 78.0 272.0)"><text class="num" x="9" y="34">01</text></g></g></g></g></g></g>
        <g class="px px1"><g class="rise r1" style="animation-delay: 1170ms"><g class="bob" style="animation-delay: -1.1s"><g class=${v.a_bx1} onClick=${v.a_pick1} onMouseEnter=${v.a_pick1}><g class="lift"><polygon class="bf" points="222.0,196.0 277.4,228.0 277.4,170.0 222.0,138.0"></polygon><polygon class="br" points="277.4,228.0 332.9,196.0 332.9,138.0 277.4,170.0"></polygon><polygon class="bt" points="222.0,138.0 277.4,170.0 332.9,138.0 277.4,106.0"></polygon><path class="tape" d="M249.7,154.0L305.1,122.0"></path><g transform="matrix(0.8660 0.5000 0 1 222.0 138.0)"><text class="num" x="9" y="34">02</text></g></g></g></g></g></g>
        <g class="px px2"><g class="rise r2" style="animation-delay: 1290ms"><g class="bob" style="animation-delay: -2.2s"><g class=${v.a_bx2} onClick=${v.a_pick2} onMouseEnter=${v.a_pick2}><g class="lift"><polygon class="bf" points="418.0,186.0 473.4,218.0 473.4,160.0 418.0,128.0"></polygon><polygon class="br" points="473.4,218.0 528.9,186.0 528.9,128.0 473.4,160.0"></polygon><polygon class="bt" points="418.0,128.0 473.4,160.0 528.9,128.0 473.4,96.0"></polygon><path class="tape" d="M445.7,144.0L501.1,112.0"></path><g transform="matrix(0.8660 0.5000 0 1 418.0 128.0)"><text class="num" x="9" y="34">03</text></g></g></g></g></g></g>
        <g class="px px3"><g class="rise r3" style="animation-delay: 1410ms"><g class="bob" style="animation-delay: -3.3s"><g class=${v.a_bx3} onClick=${v.a_pick3} onMouseEnter=${v.a_pick3}><g class="lift"><polygon class="bf" points="566.0,318.0 621.4,350.0 621.4,292.0 566.0,260.0"></polygon><polygon class="br" points="621.4,350.0 676.9,318.0 676.9,260.0 621.4,292.0"></polygon><polygon class="bt" points="566.0,260.0 621.4,292.0 676.9,260.0 621.4,228.0"></polygon><path class="tape" d="M593.7,276.0L649.1,244.0"></path><g transform="matrix(0.8660 0.5000 0 1 566.0 260.0)"><text class="num" x="9" y="34">04</text></g></g></g></g></g></g>
      </svg>
      <button class=${v.a_lb0} type="button" style="left: 17.56%; top: 31.61%; animation-delay: 1550ms" onClick=${v.a_pick0} onMouseEnter=${v.a_pick0} onFocus=${v.a_pick0}><span>Networking events</span></button>
      <button class=${v.a_lb1} type="button" style="left: 36.5%; top: 10.0%; animation-delay: 1660ms" onClick=${v.a_pick1} onMouseEnter=${v.a_pick1} onFocus=${v.a_pick1}><span>Case competitions</span></button>
      <button class=${v.a_lb2} type="button" style="left: 62.29%; top: 8.39%; animation-delay: 1770ms" onClick=${v.a_pick2} onMouseEnter=${v.a_pick2} onFocus=${v.a_pick2}><span>Workshops</span></button>
      <button class=${v.a_lb3} type="button" style="left: 81.77%; top: 29.68%; animation-delay: 1880ms" onClick=${v.a_pick3} onMouseEnter=${v.a_pick3} onFocus=${v.a_pick3}><span>Social events</span></button>
    </div>
  </div>
</section>
</div>
<div class="sec ${v.sec_events}" id="events" data-sec="events" ref=${v.ref_events}>
<section class=${v.e_rootClass} aria-labelledby="ev-b">
  <div class="cols" aria-hidden="true"><span style="animation-delay: 0ms"></span><span style="animation-delay: 60ms"></span><span style="animation-delay: 120ms"></span><span style="animation-delay: 180ms"></span><span style="animation-delay: 240ms"></span><span style="animation-delay: 300ms"></span></div>
  <div class="top">
    <h2 id="ev-b"><span class="w" style="animation-delay: 100ms">Upcoming</span> <em class="w" style="animation-delay: 200ms">events</em><span class="w yd" style="animation-delay: 300ms">.</span></h2>
  </div>
  <div class="rail">
    <span class="track" aria-hidden="true"></span>
    <span class="trolley" style="top: ${v.e_trolleyTop}px" aria-hidden="true"></span>
    <div class="rw"><div class="cl"><span class="dd" style="animation-delay: 720ms">Sat, Nov 28</span></div><div class="cc" style="animation-delay: 500ms"><span class=${v.e_s0} style="animation-delay: 500ms">01</span></div><div class="cr"><a class="card R${v.e_t0}" href="https://docs.google.com/forms/d/e/1FAIpQLSd-MpMki6fvuzWFja1aldEbYaHMvar2a7RdWdtNN6yemlRH7w/viewform" target="_blank" rel="noopener" style="animation-delay: 620ms" onMouseEnter=${v.e_pick0} onFocus=${v.e_pick0} aria-label="Sign up for First Sem Case Competition"><span class="cic"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h8v4.5a4 4 0 0 1-8 0V4ZM8 5.5H5.5a2.6 2.6 0 0 0 2.7 3.6M16 5.5h2.5a2.6 2.6 0 0 1-2.7 3.6M12 12.5v3.5M9 20h6M10 16h4v4h-4z"></path></svg></span><span class="ctx"><strong>First Sem Case Competition</strong><small>Supply chain case competition</small><span class="mdt">Sat, Nov 28</span></span><span class="cgo"><span>Sign up</span><span class="cdot"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></span><i class="cn cn1"></i><i class="cn cn2"></i><i class="cn cn3"></i><i class="cn cn4"></i></a></div></div>
    <div class="rw"><div class="cl"><a class="card L${v.e_t1}" href="#showpass-2" style="animation-delay: 750ms" onMouseEnter=${v.e_pick1} onFocus=${v.e_pick1} aria-label="Get tickets for Connect Trek on Showpass"><span class="cic"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 21a2.2 2.2 0 1 0 0-4.4A2.2 2.2 0 0 0 6 21ZM18 7.4A2.2 2.2 0 1 0 18 3a2.2 2.2 0 0 0 0 4.4ZM6 16.6v-3.1A3.5 3.5 0 0 1 9.5 10h5A3.5 3.5 0 0 0 18 6.5v-.1"></path><path d="M2.5 13.5 6 10l3.5 3.5"></path></svg></span><span class="ctx"><strong>Connect Trek</strong><small>Networking event</small><span class="mdt">Thu, Dec 3</span></span><span class="cgo"><span>Tickets</span><span class="cdot"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></span><i class="cn cn1"></i><i class="cn cn2"></i><i class="cn cn3"></i><i class="cn cn4"></i></a></div><div class="cc" style="animation-delay: 630ms"><span class=${v.e_s1} style="animation-delay: 630ms">02</span></div><div class="cr"><span class="dd" style="animation-delay: 850ms">Thu, Dec 3</span></div></div>
    <div class="rw"><div class="cl"><span class="dd" style="animation-delay: 980ms">Thu, Dec 17</span></div><div class="cc" style="animation-delay: 760ms"><span class=${v.e_s2} style="animation-delay: 760ms">03</span></div><div class="cr"><a class="card R${v.e_t2}" href="#showpass-3" style="animation-delay: 880ms" onMouseEnter=${v.e_pick2} onFocus=${v.e_pick2} aria-label="Sign up for Study with SCOA: COMM 204"><span class="cic"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5.5C5 4.5 8.5 4.5 12 6.5c3.5-2 7-2 9-1V19c-2-1-5.5-1-9 1-3.5-2-7-2-9-1V5.5ZM12 6.5V20"></path></svg></span><span class="ctx"><strong>Study with SCOA: COMM 204</strong><small>Tutoring for COMM 204</small><span class="mdt">Thu, Dec 17</span></span><span class="cgo"><span>Sign up</span><span class="cdot"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></span><i class="cn cn1"></i><i class="cn cn2"></i><i class="cn cn3"></i><i class="cn cn4"></i></a></div></div>
    <div class="rw"><div class="cl"><a class="card L${v.e_t3}" href="#showpass-4" style="animation-delay: 1010ms" onMouseEnter=${v.e_pick3} onFocus=${v.e_pick3} aria-label="Sign up for Study with SCOA: COMM 191"><span class="cic"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 4.5l5 5L9 20H4v-5L14.5 4.5ZM12.5 6.5l5 5M4 15l5 5"></path></svg></span><span class="ctx"><strong>Study with SCOA: COMM 191</strong><small>Tutoring for COMM 191</small><span class="mdt">Sat, Dec 19</span></span><span class="cgo"><span>Sign up</span><span class="cdot"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></span><i class="cn cn1"></i><i class="cn cn2"></i><i class="cn cn3"></i><i class="cn cn4"></i></a></div><div class="cc" style="animation-delay: 890ms"><span class=${v.e_s3} style="animation-delay: 890ms">04</span></div><div class="cr"><span class="dd" style="animation-delay: 1110ms">Sat, Dec 19</span></div></div>
  </div>
</section>
</div>
<div class="sec ${v.sec_team}" id="team" data-sec="team" ref=${v.ref_team}>
<section class="t t3 play" aria-labelledby="team-c">
  <div class="cols" aria-hidden="true"><span style="animation-delay: 0ms"></span><span style="animation-delay: 60ms"></span><span style="animation-delay: 120ms"></span><span style="animation-delay: 180ms"></span><span style="animation-delay: 240ms"></span><span style="animation-delay: 300ms"></span></div>
  <div class="copy">
    <h2 id="team-c"><span class="w" style="animation-delay: 100ms">Meet</span> <span class="w" style="animation-delay: 170ms">the</span> <em class="w" style="animation-delay: 240ms">team</em></h2>
    <p class="lede">Meet the minds behind SCOA. Our team works really hard, and we’re happy to help out anyone who needs a hand in the world of supply chain and operations.</p>
    <div class="acts">
      <a class="cta" href="#team-page"><span class="tx">Meet the full team</span><span class="dot"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></a>
      <button class="shuf" type="button" onClick=${v.t_shuffle}><svg class=${v.t_spinCls} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h3.5c2.5 0 3.7 1.2 5.5 5s3 5 5.5 5H21M18 14l3 3-3 3M3 17h3.5c1.4 0 2.4-.4 3.2-1.3M14.3 8.3c.8-.9 1.8-1.3 3.2-1.3H21M18 4l3 3-3 3"></path></svg><span class="sl">Shuffle</span></button>
    </div>
  </div>
  <div class="deck" onMouseEnter=${v.t_hoverOn} onMouseLeave=${v.t_hoverOff} aria-live="polite">
    ${(v.t_cards || []).map((c) => html`
      <div class=${c.cls} style="animation-delay: ${c.d}ms">
        <div class=${c.inner}>
          <div class=${c.ph}><svg class="sil" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="40" r="17"></circle><path d="M16 100V86c0-13 10-22 24-23h20c14 1 24 10 24 23v14Z"></path></svg></div>
          <div class="cap"><b>[Name]</b><small>[Role]</small></div>
        </div>
      </div>
    `)}
  </div>
  <div class="logos">
    <h3>Where our execs<br/>are working</h3>
    <div class="mq" aria-label="Companies where our execs are working">
      <div class="mqt"><div class="lg"><i></i>Company logo</div><div class="lg"><i></i>Company logo</div><div class="lg"><i></i>Company logo</div><div class="lg"><i></i>Company logo</div><div class="lg"><i></i>Company logo</div><div class="lg"><i></i>Company logo</div><div class="lg"><i></i>Company logo</div><div class="lg"><i></i>Company logo</div><div class="lg"><i></i>Company logo</div><div class="lg"><i></i>Company logo</div><div class="lg"><i></i>Company logo</div><div class="lg"><i></i>Company logo</div><div class="lg"><i></i>Company logo</div><div class="lg"><i></i>Company logo</div><div class="lg"><i></i>Company logo</div><div class="lg"><i></i>Company logo</div><div class="lg"><i></i>Company logo</div><div class="lg"><i></i>Company logo</div><div class="lg"><i></i>Company logo</div><div class="lg"><i></i>Company logo</div></div>
    </div>
  </div>
</section>
</div>
<div class="sec ${v.sec_careers}" id="careers" data-sec="careers" ref=${v.ref_careers}>
<section class="c k3 play" aria-labelledby="car-c">
  <div class="cols" aria-hidden="true"><span style="animation-delay: 0ms"></span><span style="animation-delay: 60ms"></span><span style="animation-delay: 120ms"></span><span style="animation-delay: 180ms"></span><span style="animation-delay: 240ms"></span><span style="animation-delay: 300ms"></span></div>
  <div class="intro">
    <h2 id="car-c"><span class="w" style="animation-delay: 100ms">Career</span> <em class="w" style="animation-delay: 200ms">paths</em><span class="w yd" style="animation-delay: 300ms">.</span></h2>
    <p class="lede">Supply chain and operations opens doors in almost every industry. Here are a few of the roles you could step into.</p>
    <a class="fork" href="#career-map"><svg class="fl" width="64" height="48" viewBox="0 0 64 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
<path d="M6 36V24a2 2 0 0 1 2-2h28v14"></path><path d="M14 22V10h13l6 12"></path><path d="M40 4v34"></path>
<g class="fk"><path d="M43 26v12h16"></path><rect x="46" y="27" width="11" height="8" rx="1" fill="currentColor" stroke="none"></rect></g>
<circle cx="14" cy="39" r="5" fill="#feea00"></circle><circle cx="31" cy="39" r="5" fill="#feea00"></circle></svg><span class="ft"><strong>See all roles</strong><span>on the career map</span></span><span class="dot"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></a>
  </div>
  <div class="rack">
    <span class="up u1" aria-hidden="true" style="animation-delay: 200ms"></span>
    <span class="up u2" aria-hidden="true" style="animation-delay: 280ms"></span>
    <span class="up u3" aria-hidden="true" style="animation-delay: 360ms"></span>
    <div class="bay">
        <div class="slot">
          <div class="box" style="animation-delay: 1850ms">
            <span class="tape" aria-hidden="true"></span>
            <div class="hd"><span class="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 12h.01"></path></svg></span><span class="lab"><b>OPS</b><span class="bc" aria-hidden="true"></span></span></div>
            <h3>Operations Consulting</h3>
            <p>Help companies find and fix what slows their operations down.</p>
          </div>
          <span class="pal" aria-hidden="true" style="animation-delay: 1700ms"></span>
        </div>
        <div class="beam" aria-hidden="true" style="animation-delay: 1450ms"><span class="loc"><span class="pl" style="animation-delay: 2500ms"></span>B-01<span class="bc"></span></span></div>
      </div><div class="bay">
        <div class="slot">
          <div class="box" style="animation-delay: 1950ms">
            <span class="tape" aria-hidden="true"></span>
            <div class="hd"><span class="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2l2.4 11h11.2L21 7H6.2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path></svg></span><span class="lab"><b>SRC</b><span class="bc" aria-hidden="true"></span></span></div>
            <h3>Strategic Sourcing</h3>
            <p>Choose suppliers and negotiate deals that keep costs in check.</p>
          </div>
          <span class="pal" aria-hidden="true" style="animation-delay: 1800ms"></span>
        </div>
        <div class="beam" aria-hidden="true" style="animation-delay: 1550ms"><span class="loc"><span class="pl" style="animation-delay: 2600ms"></span>B-02<span class="bc"></span></span></div>
      </div><div class="bay">
        <div class="slot">
          <div class="box" style="animation-delay: 1500ms">
            <span class="tape" aria-hidden="true"></span>
            <div class="hd"><span class="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 17l5-5 4 3 8-8M15 7h5v5"></path></svg></span><span class="lab"><b>PLN</b><span class="bc" aria-hidden="true"></span></span></div>
            <h3>Supply Chain Planning</h3>
            <p>Balance supply and demand so the right stock is in the right place.</p>
          </div>
          <span class="pal" aria-hidden="true" style="animation-delay: 1350ms"></span>
        </div>
        <div class="beam" aria-hidden="true" style="animation-delay: 1100ms"><span class="loc"><span class="pl" style="animation-delay: 2150ms"></span>A-01<span class="bc"></span></span></div>
      </div><div class="bay">
        <div class="slot">
          <div class="box" style="animation-delay: 1600ms">
            <span class="tape" aria-hidden="true"></span>
            <div class="hd"><span class="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 6h12v10H2zM14 10h4l3 3v3h-7M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path></svg></span><span class="lab"><b>FRT</b><span class="bc" aria-hidden="true"></span></span></div>
            <h3>Freight Broker</h3>
            <p>Match shippers with carriers and keep freight moving.</p>
          </div>
          <span class="pal" aria-hidden="true" style="animation-delay: 1450ms"></span>
        </div>
        <div class="beam" aria-hidden="true" style="animation-delay: 1200ms"><span class="loc"><span class="pl" style="animation-delay: 2250ms"></span>A-02<span class="bc"></span></span></div>
      </div>
    <div class="floor" aria-hidden="true"></div>
  </div>
</section>
</div>
<div class="sec ${v.sec_footer}" id="footer" data-sec="footer" ref=${v.ref_footer}>
<footer class="f fc play" aria-label="Site footer">
  <div class="cols" aria-hidden="true"><span style="animation-delay: 0ms"></span><span style="animation-delay: 60ms"></span><span style="animation-delay: 120ms"></span><span style="animation-delay: 180ms"></span><span style="animation-delay: 240ms"></span><span style="animation-delay: 300ms"></span></div>
  <div class="main">
    <div class="lead">
      <h2><span class="w" style="animation-delay: 100ms">Your</span> <span class="w" style="animation-delay: 170ms">next</span> <span class="w" style="animation-delay: 240ms">move</span> <em class="w" style="animation-delay: 310ms">starts</em> <em class="w" style="animation-delay: 380ms">here.</em></h2>
      <p>Become a member and join us at networking events, case competitions, workshops and socials all year long.</p>
      <a class="cta" href="https://www.showpass.com/m/ubc-scoa-membership-20262027/" target="_blank" rel="noopener" onMouseEnter=${v.f_drive} onFocus=${v.f_drive}><span class="tx">Buy a membership</span><span class="dot"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></a>
    </div>
    <nav class="big" aria-label="Footer"><a href="#about" style="animation-delay: 700ms"><span class="n">01</span><span class="pk"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z"></path><path d="M3 7.5 12 12l9-4.5M12 12v9"></path></svg></span><strong>About</strong><span class="ar"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></a><a href="#events" style="animation-delay: 800ms"><span class="n">02</span><span class="pk"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z"></path><path d="M3 7.5 12 12l9-4.5M12 12v9"></path></svg></span><strong>Events</strong><span class="ar"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></a><a href="#team" style="animation-delay: 900ms"><span class="n">03</span><span class="pk"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z"></path><path d="M3 7.5 12 12l9-4.5M12 12v9"></path></svg></span><strong>Team</strong><span class="ar"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></a><a href="#careers" style="animation-delay: 1000ms"><span class="n">04</span><span class="pk"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z"></path><path d="M3 7.5 12 12l9-4.5M12 12v9"></path></svg></span><strong>Careers</strong><span class="ar"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></a></nav>
    <div class="side">
      <div><h3>Follow us</h3><ul><li><a class="ln" href="#">Instagram</a></li><li><a class="ln" href="#">LinkedIn</a></li><li><a class="ln" href="#">Email</a></li></ul></div>
      <p>Vancouver, BC<br/>49.26° N, 123.25° W</p>
    </div>
  </div>
  <div class="road" onMouseEnter=${v.f_drive}>
    <a class="brand" href="#top" aria-label="SCOA, back to top"><svg class="mark" viewBox="0 0 1310 1112" aria-hidden="true"><path fill="#fffdf1" d="M852.915 4.18051L854.225 4.31653C857.905 15.0325 864.745 29.8635 869.375 40.5835L1269.09 964.927C1282.35 995.568 1297.09 1028.12 1309.48 1058.98C1298.69 1059.66 1280.59 1062.89 1269.44 1064.51C1245.15 1068.08 1220.8 1071.41 1196.44 1074.5C1119.58 1084.28 1042.52 1092.33 965.295 1098.65C643.085 1124.06 318.979 1110.54 0 1058.39C9.091 1035.09 19.606 999.318 27.722 974.557L81.692 810.167C98.481 813.737 115.302 817.147 132.153 820.407C148.116 779.197 163.297 734.057 178.559 692.157C194.004 695.757 226.438 707.288 242.114 712.488C255.147 674.678 269.719 636.767 282.973 598.877C381.576 641.627 481.848 687.957 580.154 732.027L1309.97 1059.07C1280.08 1033.66 1240.53 1004.68 1209.18 980.397L1019.83 833.647C999.585 741.017 981.465 643.557 962.725 550.404L852.915 4.18051ZM1169.33 1030.46C1174.39 1031.61 1199.11 1037.06 1203.11 1036.52C1196.03 1032.93 1183.84 1029.73 1175.82 1027.06L1125.15 1010.37L211.813 713.897C204.395 711.487 191.819 707.838 185.046 705.057C172.255 743.477 156.71 784.237 142.872 822.637L1078.31 1012.11L1140.74 1024.86C1145.73 1025.88 1165.09 1030.18 1169.33 1030.46Z"></path><path class="flag" fill="#feea00" d="M852.915 4.18051L852.835 0.017511C856.995 -0.589489 886.315 14.7655 892.955 17.8855L993.885 65.4145C1076.21 104.236 1161.27 143.153 1242.98 182.853C1177.99 175.134 1111.26 170.756 1046.09 163.746C1020.3 160.972 988.295 159.412 963.185 155.522C928.075 107.714 890.175 53.4635 856.215 4.4215L854.225 4.31653L852.915 4.18051Z"></path></svg></a>
    <p class="copy">© 2026 SCOA, the Supply Chain & Operations Association at UBC Sauder.</p>
    <a class="btt" href="#top"><span class="tx">Back to top</span><span class="ub"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 13V3M4 7l4-4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg></span></a>
    <span class="lane" aria-hidden="true"></span>
    <span class="curb" aria-hidden="true"></span>
    <span class="tw" aria-hidden="true"><svg class="truck ${v.f_truckCls}" width="100" height="50" viewBox="0 0 100 50" aria-hidden="true">
<rect x="2" y="4" width="60" height="32" rx="3" fill="#fffdf1"></rect>
<path d="M22 8v24M42 8v24" stroke="rgba(23,67,54,.3)" stroke-width="1.5"></path>
<path d="M65 12h17l12 13v11H65Z" fill="#fffdf1"></path>
<path d="M69 16h11l7.5 8H69Z" fill="#174336"></path>
<rect x="2" y="36" width="94" height="4" rx="1" fill="#fffdf1"></rect>
<rect x="92" y="28" width="4" height="4" rx="1" fill="#feea00" class="hl"></rect>
<g class="wl"><g class="wl2"><circle cx="20" cy="42" r="6.5" fill="#174336" stroke="#fffdf1" stroke-width="2.5"></circle><path d="M20 37.5v9M15.5 42h9" stroke="#fffdf1" stroke-width="1.4"></path></g></g>
<g class="wl"><g class="wl2"><circle cx="78" cy="42" r="6.5" fill="#174336" stroke="#fffdf1" stroke-width="2.5"></circle><path d="M78 37.5v9M73.5 42h9" stroke="#fffdf1" stroke-width="1.4"></path></g></g>
</svg></span>
  </div>
</footer>
</div>
</div>`;
}

export { Component, view };

if (typeof document !== 'undefined') {
  render(h(Component, {}), document.getElementById('root'));
}
