// Home Assistant theme — Smartmorphic
// All UI primitives, HA-style cards, and dashboard views in one file.
// Loaded after lib/design-canvas.jsx and lib/tweaks-panel.jsx.

// ─────────────────────────────────────────────────────────────────────────────
// Tokens / constants
// ─────────────────────────────────────────────────────────────────────────────

const HA_FONT_SANS    = "'DM Sans', system-ui, sans-serif";
const HA_FONT_DISPLAY = "'Outfit', system-ui, sans-serif";
const HA_FONT_MONO    = "'JetBrains Mono', ui-monospace, monospace";

// Mocked entity data, real-feeling. Names follow HA entity_id convention.
const HOUSE = {
  greeting: 'Good evening',
  user: 'Nick',
  outside: { temp: 58, low: 51, high: 67, condition: 'Partly cloudy', uv: 3 },
  inside:  { temp: 71, humidity: 42 },
  energy:  { solar: 2.4, grid: 0.9, load: 2.6, batteryPct: 78, batteryFlow: 0.7, today_kwh: 14.3, today_solar: 11.8 },
  alarm:   { state: 'armed_home' }, // disarmed | armed_home | armed_away
  scenes:  [
    { id: 'movie',  name: 'Movie Night',  icon: 'film',     active: false },
    { id: 'dinner', name: 'Dinner',       icon: 'utensils', active: true  },
    { id: 'sleep',  name: 'Wind Down',    icon: 'moon',     active: false },
    { id: 'away',   name: 'Away',         icon: 'doorOpen', active: false },
  ],
};

const ROOMS = [
  { id: 'living',  name: 'Living Room', icon: 'sofa',     temp: 71, lights: { total: 5, on: 3 }, climate: 71, target: 70 },
  { id: 'kitchen', name: 'Kitchen',     icon: 'chefHat',  temp: 70, lights: { total: 3, on: 1 }, climate: 70, target: 70 },
  { id: 'bed',     name: 'Bedroom',     icon: 'bed',      temp: 68, lights: { total: 4, on: 0 }, climate: 68, target: 68 },
  { id: 'office',  name: 'Office',      icon: 'monitor',  temp: 72, lights: { total: 2, on: 2 }, climate: 72, target: 71 },
  { id: 'bath',    name: 'Bathroom',    icon: 'bath',     temp: 70, lights: { total: 2, on: 0 }, climate: 70, target: 70 },
  { id: 'patio',   name: 'Patio',       icon: 'leaf',     temp: 58, lights: { total: 3, on: 0 }, climate: null, target: null },
];

const LIGHTS_ALL = [
  { id: 'living.pendant',  name: 'Pendant',    room: 'Living Room', on: true,  brightness: 80, k: 2700 },
  { id: 'living.floor',    name: 'Floor Lamp', room: 'Living Room', on: true,  brightness: 60, k: 2200 },
  { id: 'living.tv',       name: 'TV Bias',    room: 'Living Room', on: true,  brightness: 35, k: 4000 },
  { id: 'kitchen.island',  name: 'Island',     room: 'Kitchen',     on: true,  brightness: 90, k: 4000 },
  { id: 'office.desk',     name: 'Desk Lamp',  room: 'Office',      on: true,  brightness: 70, k: 5000 },
  { id: 'office.shelf',    name: 'Shelf',      room: 'Office',      on: true,  brightness: 50, k: 3000 },
];

const AUTOMATIONS = [
  { id: 'sunset',   name: 'Sunset lights on',         desc: 'Living Room + Kitchen at 80%',      last: '6:42 PM', on: true,  blueprint: 'time/sun' },
  { id: 'arriving', name: 'Arrive home',              desc: 'Phone enters home zone',            last: '5:14 PM', on: true,  blueprint: 'zone' },
  { id: 'morning',  name: 'Weekday morning',          desc: 'Weekdays 6:30 AM — Bedroom + Coffee', last: 'Yesterday', on: true,  blueprint: 'time' },
  { id: 'leaving',  name: 'Leaving the house',        desc: 'All phones leave zone',             last: '8:13 AM', on: true,  blueprint: 'zone' },
  { id: 'lowsun',   name: 'Sun below 4°',             desc: 'Outdoor lights on',                 last: '6:39 PM', on: true,  blueprint: 'sun.angle' },
  { id: 'security', name: 'Door opens after 11pm',    desc: 'Notify + flash hallway',            last: '3 days ago', on: false, blueprint: 'state' },
  { id: 'laundry',  name: 'Washer done → notify',     desc: 'Power draw drops below 5W for 3min', last: 'Mon 9:30 PM', on: true, blueprint: 'numeric_state' },
  { id: 'leak',     name: 'Leak detected',            desc: 'Any leak sensor → siren + alert',   last: 'Never',   on: true,  blueprint: 'state' },
];

const CAMERAS = [
  { id: 'front',  name: 'Front Door',   live: true,  motion: '12s ago' },
  { id: 'driveway', name: 'Driveway',  live: true,  motion: '6m ago'  },
  { id: 'patio',  name: 'Patio',        live: true,  motion: '1h ago'  },
  { id: 'garage', name: 'Garage',       live: false, motion: '—'       },
];

// ─────────────────────────────────────────────────────────────────────────────
// Icons — Lucide-style line, 24×24, stroke=currentColor
// ─────────────────────────────────────────────────────────────────────────────
const HA_ICONS = {
  home:        'M3 12l9-9 9 9M5 10v10h14V10',
  light:       'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.7.6 1 1.4 1 2.3v1h6v-1c0-.9.3-1.7 1-2.3A7 7 0 0 0 12 2z',
  thermo:      'M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z',
  energy:      'M13 2L3 14h7l-1 8 10-12h-7l1-8z',
  shield:      'M12 2L4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z',
  bot:         'M12 2v3M5 9V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2M4 13h16M5 9h14a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9a1 1 0 0 1 1-1z M9 17h.01M15 17h.01',
  settings:    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9 1.7 1.7 0 0 0 4.3 7.2l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  sofa:        'M20 9V7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v2M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0z',
  bed:         'M2 4v16M22 4v16M2 8h20M6 8v6M18 8v6M2 14h20',
  chefHat:     'M6 13.87A4 4 0 0 1 7.41 6a5 5 0 0 1 9.18 0A4 4 0 0 1 18 13.87V21H6z',
  monitor:     'M2 4h20v12H2zM8 20h8M12 16v4',
  bath:        'M4 12V5a2 2 0 0 1 2-2 2 2 0 0 1 2 2 1 1 0 0 0 1 1h2M2 12h20v3a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-3zM5 21l-1 1M19 21l1 1',
  leaf:        'M11 20A7 7 0 0 1 4 13V8a4 4 0 0 1 4-4h7a7 7 0 0 1 0 14H11zM2 22l9-9',
  doorOpen:    'M13 4h3v16h-3M11 6L4 4v16l7-2zM7 12h.01',
  utensils:    'M3 2v7c0 1.1.9 2 2 2v11M7 2v20M21 15v6M21 2c-2.2 0-4 1.8-4 4v6a2 2 0 0 0 2 2h2',
  film:        'M2 4h20v16H2zM7 4v16M17 4v16M2 8h5M2 12h5M2 16h5M17 8h5M17 12h5M17 16h5',
  moon:        'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  briefcase:   'M2 7h20v13H2zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  sun:         'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  cloud:       'M17 19a5 5 0 0 0 1-9.9A7 7 0 0 0 4 11a4 4 0 0 0 0 8h13z',
  cloudRain:   'M17 14a5 5 0 0 0 1-9.9A7 7 0 0 0 4 7a4 4 0 0 0 0 8h13z M8 19l-1 2M12 19l-1 2M16 19l-1 2',
  drop:        'M12 2.7c2.3 3 6 7 6 11a6 6 0 1 1-12 0c0-4 3.7-8 6-11z',
  wind:        'M3 8h13a3 3 0 1 0-3-3M3 12h17a3 3 0 1 1-3 3M3 16h9a3 3 0 1 1-3 3',
  lock:        'M3 11h18v11H3zM7 11V7a5 5 0 0 1 10 0v4',
  unlock:      'M3 11h18v11H3zM7 11V7a5 5 0 0 1 10 0',
  camera:      'M2 7h4l2-3h8l2 3h4v13H2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  motion:      'M13 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM9 22l1-6 2 1v6M14 13l-1-2 2-3 3 1 2 3M5 14l3-3 4 2',
  bell:        'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M14 21a2 2 0 0 1-4 0',
  alarm:       'M3 11h18v11H3zM6 4l3 3M21 7l-3-3M12 11v6M12 21h.01',
  play:        'M6 4l14 8-14 8z',
  pause:       'M6 4h4v16H6zM14 4h4v16h-4z',
  prev:        'M6 4v16M19 4L9 12l10 8z',
  next:        'M18 4v16M5 4l10 8L5 20z',
  speaker:     'M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM12 7v.01M12 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  tv:          'M2 5h20v13H2zM7 22h10',
  chevR:       'M9 6l6 6-6 6',
  chevL:       'M15 6l-6 6 6 6',
  chevDown:    'M6 9l6 6 6-6',
  chevUp:      'M18 15l-6-6-6 6',
  plus:        'M12 5v14M5 12h14',
  search:      'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  more:        'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  bolt:        'M13 2L3 14h7l-1 8 10-12h-7l1-8z',
  battery:     'M2 7h17v10H2zM21 10v4M6 10v4M10 10v4',
  grid:        'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  refresh:     'M21 3v7h-7M3 21v-7h7M3 14a9 9 0 0 0 15 5l3-3M21 10a9 9 0 0 0-15-5L3 8',
  arrowR:      'M5 12h14M13 5l7 7-7 7',
  arrowL:      'M19 12H5M11 5l-7 7 7 7',
  zap:         'M13 2L3 14h7l-1 8 10-12h-7l1-8z',
  car:         'M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11M5 11h14v6H5zM7 17v2M17 17v2M7 14h.01M17 14h.01',
  fan:         'M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 12c0 3 2 5 5 5M12 12c0 3-2 5-5 5M12 12c3 0 5-2 5-5M12 12c-3 0-5-2-5-5',
  fridge:      'M5 3h14v18H5zM5 11h14M9 6v2M9 14v3',
  router:     'M5 16h14a2 2 0 0 1 0 4H5a2 2 0 0 1 0-4zM6 12V8a4 4 0 1 1 8 0M6 8h-.01M10 8h.01M14 8h.01M18 8h.01M8 16v-2',
  user:        'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  power:       'M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10',
  history:     'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l4 2',
  blueprint:   'M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6zM9 6h6M9 18h6M6 9v6M18 9v6',
  area:        'M3 21h18M3 10l9-7 9 7v11H3z',
  trash:       'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
  edit:        'M11 4H4v16h16v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  arrowDown:   'M12 5v14M5 12l7 7 7-7',
  arrowUp:     'M12 19V5M5 12l7-7 7 7',
  garage:      'M3 21V8l9-5 9 5v13M5 21V12h14v9M5 16h14',
};

function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 1.7, style, ...rest }) {
  const path = HA_ICONS[name];
  if (!path) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
        style={{ display: 'block', ...style }} {...rest}>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', ...style }} {...rest}>
      {path.split(/(?=M)/).filter(Boolean).map((seg, i) => <path key={i} d={seg.trim()}/>)}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Surface primitives
// ─────────────────────────────────────────────────────────────────────────────

function Raised({ children, radius = 18, padding = 16, style, ...rest }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: radius,
      boxShadow: 'var(--neu-raised)', padding,
      border: '1px solid transparent', ...style,
    }} {...rest}>{children}</div>
  );
}
function Pressed({ children, radius = 14, padding = 12, style, ...rest }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: radius,
      boxShadow: 'var(--neu-pressed)', padding, ...style,
    }} {...rest}>{children}</div>
  );
}
// IconWell — flat / pressed badge for icons. Default is *flat* (no shadow) so
// it can live inside a raised parent without stacking shadows. Pass
// `variant="pressed"` for an inset look on flat backgrounds.
function IconWell({ icon, size = 40, iconSize = 18, color = 'var(--text-secondary)', radius = 12, variant = 'flat', style }) {
  const bg = {
    flat:    { background: 'rgba(125,128,146,0.10)', boxShadow: 'none' },
    pressed: { background: 'var(--surface)', boxShadow: 'var(--neu-pressed)' },
  }[variant] || {};
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color, flexShrink: 0,
      ...bg, ...style,
    }}>
      <Icon name={icon} size={iconSize}/>
    </div>
  );
}
// ActiveIconWell — the toggleable entity badge. Active uses an accent fill +
// inner highlight (NO outer filter drop-shadow — that bled fuzzy halos onto
// neighbours). Off is a flat muted chip.
function ActiveIconWell({ icon, size = 40, iconSize = 18, on = false, radius = 12, style }) {
  if (on) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius,
        background: 'var(--accent-glow)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1px var(--accent-glow)',
        color: 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        ...style,
      }}>
        <Icon name={icon} size={iconSize} strokeWidth={2}/>
      </div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: 'rgba(125,128,146,0.12)',
      color: 'var(--text-muted)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      ...style,
    }}>
      <Icon name={icon} size={iconSize}/>
    </div>
  );
}
function Eyebrow({ children, style }) {
  return (
    <div style={{
      fontFamily: HA_FONT_DISPLAY, fontSize: 10, fontWeight: 600,
      letterSpacing: 1.5, textTransform: 'uppercase',
      color: 'var(--text-muted)', ...style,
    }}>{children}</div>
  );
}
function Stat({ value, unit, size = 28, weight = 500, color = 'var(--text-primary)', style }) {
  // Detect degree-style units so we can render them as a tight superscript-ish
  // glyph that sits high in the line. Plain alphanumeric units (kW, kWh, %, etc.)
  // baseline-align like normal so they don't look orphaned.
  const isDegree = typeof unit === 'string' && /^°/.test(unit);
  return (
    <div style={{ display: 'inline-block', lineHeight: 1, color, ...style }}>
      <span style={{ fontFamily: HA_FONT_DISPLAY, fontSize: size, fontWeight: weight, letterSpacing: -0.5, lineHeight: 1 }}>
        {value}
        {isDegree && (
          <span style={{
            fontFamily: HA_FONT_DISPLAY,
            fontSize: Math.max(11, size * 0.38),
            fontWeight: 400,
            color: 'var(--text-muted)',
            verticalAlign: 'top',
            marginLeft: 1,
            lineHeight: 1,
            position: 'relative',
            top: Math.max(2, size * 0.06),
          }}>{unit}</span>
        )}
      </span>
      {unit && !isDegree && (
        <span style={{
          fontFamily: HA_FONT_DISPLAY,
          fontSize: Math.max(11, size * 0.42),
          fontWeight: 400,
          color: 'var(--text-muted)',
          marginLeft: 3,
        }}>{unit}</span>
      )}
    </div>
  );
}
function Mono({ children, style }) {
  return <span style={{ fontFamily: HA_FONT_MONO, ...style }}>{children}</span>;
}
function Pill({ children, tone = 'neutral', style }) {
  const tones = {
    neutral: { bg: 'rgba(125,128,146,0.14)', fg: 'var(--text-secondary)' },
    accent:  { bg: 'var(--accent-glow)',     fg: 'var(--accent)' },
    success: { bg: 'rgba(58,191,122,0.16)',  fg: 'var(--success)' },
    warning: { bg: 'rgba(232,184,58,0.16)',  fg: 'var(--warning)' },
    danger:  { bg: 'rgba(232,74,58,0.16)',   fg: 'var(--danger)' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 9px', borderRadius: 999,
      background: t.bg, color: t.fg,
      fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase',
      ...style,
    }}>{children}</span>
  );
}
function Slider({ value = 50, accent = 'var(--accent)', height = 6, knob = 14, glow = true, style }) {
  return (
    <div style={{
      height, borderRadius: 999, position: 'relative',
      background: 'var(--surface)', boxShadow: 'var(--neu-pressed)', ...style,
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${value}%`, borderRadius: 999, background: accent,
        ...(glow ? { boxShadow: `0 0 10px ${accent === 'var(--accent)' ? 'var(--accent-glow)' : accent + '55'}` } : {}),
      }}/>
      <div style={{
        position: 'absolute', left: `calc(${value}% - ${knob/2}px)`,
        top: `calc(50% - ${knob/2}px)`, width: knob, height: knob,
        borderRadius: '50%', background: '#fff',
        boxShadow: '1px 1px 3px rgba(0,0,0,0.25), var(--neu-raised-sm)',
      }}/>
    </div>
  );
}
function Toggle({ on = true, size = 'md' }) {
  const w = size === 'sm' ? 36 : 44;
  const h = size === 'sm' ? 22 : 26;
  const k = size === 'sm' ? 18 : 22;
  return (
    <div style={{
      width: w, height: h, borderRadius: 999,
      background: on ? 'var(--accent)' : '#c4c7d4',
      boxShadow: on ? '0 0 10px var(--accent-glow)' : 'none',
      position: 'relative', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? (w - k - 2) : 2,
        width: k, height: k, borderRadius: '50%', background: '#fff',
        boxShadow: '1px 1px 3px rgba(0,0,0,0.25)',
      }}/>
    </div>
  );
}

// Sparkline — uses ctx.showSparkline tweak when given an HA ctx
function Spark({ values, width = 80, height = 24, color = 'var(--accent)', filled = true, dots = false, style }) {
  if (!values || values.length === 0) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  const area = `0,${height} ${pts} ${width},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', ...style }}>
      {filled && <polyline points={area} fill={color} fillOpacity="0.12" stroke="none"/>}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}55)` }}/>
      {dots && values.map((v, i) => (
        <circle key={i} cx={i * step} cy={height - ((v - min) / range) * (height - 4) - 2} r="1.4" fill={color}/>
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HA frame — sidebar + topbar
// ─────────────────────────────────────────────────────────────────────────────
function HAWindow({ title = 'Home', view = 'overview', children }) {
  return (
    <div className="bw">
      <div className="bw-bar">
        <span className="bw-dot" style={{ background: '#e8653a', opacity: 0.7 }}/>
        <span className="bw-dot" style={{ background: '#e8b83a', opacity: 0.7 }}/>
        <span className="bw-dot" style={{ background: '#3abf7a', opacity: 0.7 }}/>
        <div className="bw-url">https://home.local/lovelace/{view}</div>
        <Icon name="refresh" size={13} color="var(--text-muted)"/>
      </div>
      <div className="bw-body">
        <HASidebar active={view}/>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
          <HATopBar title={title}/>
          <div style={{ flex: 1, minHeight: 0, padding: '0 14px 14px' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

const NAV = [
  { id: 'overview',    label: 'Overview',    icon: 'home' },
  { id: 'climate',     label: 'Climate',     icon: 'thermo' },
  { id: 'energy',      label: 'Energy',      icon: 'energy' },
  { id: 'security',    label: 'Security',    icon: 'shield' },
  { id: 'automations', label: 'Automations', icon: 'bot' },
  { id: 'settings',    label: 'Settings',    icon: 'settings' },
];

function HASidebar({ active }) {
  return (
    <div style={{
      width: 220, flexShrink: 0, padding: '20px 14px',
      display: 'flex', flexDirection: 'column', gap: 24,
      borderRight: '1px solid rgba(125,128,146,0.10)',
      background: 'var(--surface)',
    }}>
      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 10px 4px 6px' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: 'var(--accent-glow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent)',
        }}>
          <Icon name="light" size={16} strokeWidth={2}/>
        </div>
        <div>
          <div style={{ fontFamily: HA_FONT_DISPLAY, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.2 }}>Home</div>
          <div style={{ fontSize: 9, fontFamily: HA_FONT_MONO, color: 'var(--text-muted)', letterSpacing: 0.6, marginTop: 1 }}>SMARTMORPHIC</div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Eyebrow style={{ padding: '0 10px', marginBottom: 6 }}>Dashboards</Eyebrow>
        {NAV.map(n => {
          const on = n.id === active;
          return (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '9px 10px', borderRadius: 12,
              background: 'var(--surface)',
              boxShadow: on ? 'var(--neu-pressed)' : 'none',
              color: on ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: on ? 600 : 500,
              cursor: 'default',
            }}>
              <Icon name={n.icon} size={16} strokeWidth={on ? 2 : 1.7}/>
              <span>{n.label}</span>
              {on && <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: 999, background: 'var(--accent)', boxShadow: '0 0 6px var(--accent-glow)' }}/>}
            </div>
          );
        })}
      </div>

      {/* Areas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Eyebrow style={{ padding: '0 10px', marginBottom: 6 }}>Areas</Eyebrow>
        {ROOMS.slice(0, 5).map(r => (
          <div key={r.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '8px 10px', borderRadius: 12,
            color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
          }}>
            <Icon name={r.icon} size={15} strokeWidth={1.7}/>
            <span>{r.name}</span>
            {r.lights.on > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: HA_FONT_MONO, color: 'var(--accent)' }}>
                {r.lights.on}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Footer status */}
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px' }}>
        <div style={{ position: 'relative', width: 8, height: 8 }}>
          <span style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'var(--success)', boxShadow: '0 0 6px rgba(58,191,122,0.6)' }}/>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: HA_FONT_MONO, lineHeight: 1.3 }}>
          core-2026.5.2<br/>
          <span style={{ color: 'var(--success)' }}>104 entities · online</span>
        </div>
      </div>
    </div>
  );
}

function HATopBar({ title }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '20px 28px 18px',
    }}>
      <div>
        <Eyebrow>{HOUSE.greeting} · {HOUSE.user}</Eyebrow>
        <div style={{ fontFamily: HA_FONT_DISPLAY, fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.5, marginTop: 2 }}>{title}</div>
      </div>
      <div style={{ flex: 1 }}/>
      {/* search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderRadius: 999,
        background: 'var(--surface)', boxShadow: 'var(--neu-pressed)',
        minWidth: 220, color: 'var(--text-muted)',
      }}>
        <Icon name="search" size={14}/>
        <span style={{ fontSize: 12 }}>Search entities</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: HA_FONT_MONO, padding: '2px 6px', borderRadius: 6, background: 'rgba(125,128,146,0.18)' }}>⌘K</span>
      </div>
      <IconWell icon="bell" size={36} iconSize={16}/>
      {/* avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: 999,
        background: 'var(--surface)', boxShadow: 'var(--neu-raised-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: HA_FONT_DISPLAY, fontWeight: 600, color: 'var(--accent)',
        fontSize: 13,
      }}>N</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HA card components
// ─────────────────────────────────────────────────────────────────────────────

// TileCard — Lovelace tile equivalent. icon well + label + state.
function TileCard({ icon, label, state, sub, on = false, tone = 'neutral', spark, ctx, onClick, padding }) {
  const dense = ctx?.density === 'dense';
  const p = padding ?? (dense ? 12 : 16);
  const ts = dense ? { name: 13, state: 18 } : { name: 14, state: 22 };
  return (
    <Raised padding={p} radius={dense ? 14 : 16}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <ActiveIconWell icon={icon} on={on} size={dense ? 32 : 38} iconSize={dense ? 14 : 17}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: ts.name, fontWeight: 600, color: on ? 'var(--accent)' : 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: dense ? 10 : 14, gap: 8 }}>
        <div style={{ fontFamily: HA_FONT_DISPLAY, fontSize: ts.state, fontWeight: 500, color: on ? 'var(--accent)' : 'var(--text-primary)', letterSpacing: -0.3, lineHeight: 1 }}>{state}</div>
        {spark && ctx?.showSparkline && <Spark values={spark} width={dense ? 50 : 70} height={dense ? 16 : 22} color={on ? 'var(--accent)' : 'var(--text-muted)'}/>}
      </div>
    </Raised>
  );
}

// LightTileCard — like Tile but with a brightness slider built-in
function LightTileCard({ light, ctx }) {
  const dense = ctx?.density === 'dense';
  return (
    <Raised padding={dense ? 12 : 14} radius={dense ? 14 : 16}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ActiveIconWell icon="light" on={light.on} size={dense ? 32 : 38} iconSize={dense ? 14 : 17}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: dense ? 12 : 13, fontWeight: 600, color: light.on ? 'var(--accent)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{light.name}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: HA_FONT_MONO, marginTop: 1 }}>{light.room.toLowerCase().replace(/\s+/g,'_')}</div>
        </div>
        <Toggle on={light.on} size="sm"/>
      </div>
      {light.on && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: dense ? 10 : 12 }}>
          <Icon name="sun" size={12} color="var(--text-muted)"/>
          <div style={{ flex: 1 }}><Slider value={light.brightness} height={5} knob={11}/></div>
          <Mono style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 24, textAlign: 'right' }}>{light.brightness}%</Mono>
        </div>
      )}
    </Raised>
  );
}

// Sensor / metric tile — large stat + sparkline
function SensorTile({ icon, label, value, unit, spark, color = 'var(--text-primary)', ctx, footer }) {
  return (
    <Raised padding={ctx?.density === 'dense' ? 14 : 18} radius={16}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Icon name={icon} size={14} color="var(--text-muted)"/>
        <Eyebrow>{label}</Eyebrow>
      </div>
      <Stat value={value} unit={unit} size={ctx?.density === 'dense' ? 26 : 32} color={color}/>
      {spark && ctx?.showSparkline && (
        <div style={{ marginTop: 10 }}>
          <Spark values={spark} width={ctx?.density === 'dense' ? 100 : 140} height={28} color={color}/>
        </div>
      )}
      {footer && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>{footer}</div>
      )}
    </Raised>
  );
}

// Climate tile — current/target + mode chips + small ring
function ClimateTile({ room, ctx, full = false }) {
  const dense = ctx?.density === 'dense';
  const diff = (room.climate ?? 0) - (room.target ?? 0);
  return (
    <Raised padding={dense ? 14 : 16} radius={16}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ActiveIconWell icon={room.icon} on size={dense ? 32 : 38} iconSize={dense ? 14 : 17}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: dense ? 13 : 14, fontWeight: 600, color: 'var(--text-primary)' }}>{room.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Target {room.target}°</div>
        </div>
        <ClimateRing current={room.climate} target={room.target} size={dense ? 44 : 52}/>
      </div>
      {full && (
        <>
          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            {['Heat', 'Cool', 'Auto', 'Off'].map((m, i) => {
              const active = m === 'Heat';
              return (
                <div key={m} style={{
                  flex: 1, padding: '6px 0', textAlign: 'center', borderRadius: 8,
                  background: 'var(--surface)',
                  boxShadow: active ? 'var(--neu-pressed)' : 'var(--neu-raised-sm)',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 11, fontWeight: 600,
                }}>{m}</div>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <Icon name="drop" size={12} color="var(--text-muted)"/>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Humidity 42%</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: HA_FONT_MONO, color: diff > 0 ? 'var(--warning)' : 'var(--success)' }}>
              {diff > 0 ? '+' : ''}{diff}°
            </span>
          </div>
        </>
      )}
    </Raised>
  );
}

function ClimateRing({ current = 71, target = 70, size = 60 }) {
  const min = 60, max = 80;
  const pct = Math.max(0, Math.min(1, (current - min) / (max - min)));
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(163,167,185,0.30)" strokeWidth="3"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--accent)" strokeWidth="3"
          strokeDasharray={`${c * pct} ${c}`} strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 4px var(--accent-glow))' }}/>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: HA_FONT_DISPLAY, fontSize: size * 0.32, fontWeight: 500, color: 'var(--text-primary)',
      }}>
        {current}°
      </div>
    </div>
  );
}

// Scene chip — lives on the page background (NOT inside a raised card), so it
// uses the full raised treatment to stand out, and pressed for the active state.
function SceneChip({ scene, ctx }) {
  const dense = ctx?.density === 'dense';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      padding: dense ? '10px 8px' : '14px 10px', borderRadius: 14,
      background: 'var(--surface)',
      boxShadow: scene.active ? 'var(--neu-pressed)' : 'var(--neu-raised-sm)',
      color: scene.active ? 'var(--accent)' : 'var(--text-secondary)',
      minWidth: 86, flex: '0 0 auto',
    }}>
      <Icon name={scene.icon} size={dense ? 16 : 18} strokeWidth={1.8}/>
      <span style={{ fontSize: 11, fontWeight: 600 }}>{scene.name}</span>
    </div>
  );
}

// Media card
function MediaCard({ ctx, compact = false }) {
  const dense = ctx?.density === 'dense';
  return (
    <Raised padding={dense ? 14 : 16} radius={16}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: compact ? 48 : 56, height: compact ? 48 : 56, borderRadius: 10,
          background: 'linear-gradient(135deg, #e8653a, #9b59b6)',
          boxShadow: 'var(--neu-pressed)',
          padding: 4, flexShrink: 0,
        }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 7, overflow: 'hidden', position: 'relative' }}>
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              <defs><linearGradient id="hamediag" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#f5e6c7"/><stop offset="1" stopColor="#e8653a"/>
              </linearGradient></defs>
              <rect width="100" height="100" fill="url(#hamediag)"/>
              <circle cx="32" cy="68" r="28" fill="#2c2e3a" opacity="0.55"/>
            </svg>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <Icon name="speaker" size={10} color="var(--text-muted)"/>
            <span style={{ fontSize: 10, fontFamily: HA_FONT_MONO, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Living Room · Era 300</span>
          </div>
          <div style={{ fontFamily: HA_FONT_DISPLAY, fontSize: dense ? 14 : 15, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>After Laughter — Pool</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Paramore · Spotify Connect</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--surface)', boxShadow: 'var(--neu-raised-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)',
          }}><Icon name="prev" size={14}/></div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 10px var(--accent-glow)',
          }}><Icon name="pause" size={14} strokeWidth={2.4}/></div>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--surface)', boxShadow: 'var(--neu-raised-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)',
          }}><Icon name="next" size={14}/></div>
        </div>
      </div>
      {/* progress */}
      <div style={{ marginTop: 12 }}>
        <Slider value={44} height={4} knob={9}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'var(--text-muted)', fontFamily: HA_FONT_MONO }}>
          <span>1:42</span><span>3:48</span>
        </div>
      </div>
    </Raised>
  );
}

// Weather card
function WeatherCard({ ctx, large = false }) {
  const dense = ctx?.density === 'dense';
  const hourly = [56, 55, 55, 54, 53, 52, 53, 56, 60, 64, 67, 67];
  return (
    <Raised padding={large ? 22 : (dense ? 14 : 18)} radius={18}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Eyebrow>Outside</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <Stat value={HOUSE.outside.temp} unit="°F" size={large ? 56 : 36}/>
            {large && (
              <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>
                {HOUSE.outside.condition}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name="arrowDown" size={11}/> {HOUSE.outside.low}°
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name="arrowUp" size={11}/> {HOUSE.outside.high}°
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name="sun" size={11}/> UV {HOUSE.outside.uv}
            </span>
          </div>
        </div>
        {/* weather glyph — not a toggle, no accent treatment */}
        <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="cloud" size={large ? 56 : 36} strokeWidth={1.5}/>
        </div>
      </div>
      {large && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 60 }}>
            {hourly.map((t, i) => {
              const min = Math.min(...hourly), max = Math.max(...hourly);
              const h = ((t - min) / (max - min || 1)) * 50 + 6;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 9, fontFamily: HA_FONT_MONO, color: 'var(--text-muted)' }}>{t}°</div>
                  <div style={{
                    width: 4, height: h, borderRadius: 999,
                    background: i < 6 ? 'rgba(58,142,232,0.7)' : 'var(--accent)',
                    boxShadow: i >= 6 ? '0 0 6px var(--accent-glow)' : 'none',
                  }}/>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: 'var(--text-muted)', fontFamily: HA_FONT_MONO }}>
            <span>NOW</span><span>+3h</span><span>+6h</span><span>+9h</span><span>+12h</span>
          </div>
        </div>
      )}
    </Raised>
  );
}

// Status banner — security state
function StatusBanner({ ctx }) {
  return (
    <Raised padding={14} radius={16} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <ActiveIconWell icon="shield" on size={42} iconSize={20}/>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Armed · Home</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>4 sensors monitoring · all clear</div>
      </div>
      <Pill tone="success">All Clear</Pill>
    </Raised>
  );
}

// Energy summary tile  
function EnergyTile({ ctx, expanded = false }) {
  const dense = ctx?.density === 'dense';
  return (
    <Raised padding={dense ? 14 : 18} radius={16}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Icon name="bolt" size={14} color="var(--accent)"/>
        <Eyebrow>Energy now</Eyebrow>
        <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: HA_FONT_MONO, color: 'var(--success)' }}>
          ↓ 1.5kW surplus
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <FlowMini label="Solar"   icon="sun"     value={HOUSE.energy.solar} unit="kW" color="var(--warning)" arrow="out"/>
        <FlowMini label="House"   icon="home"    value={HOUSE.energy.load}  unit="kW" color="var(--accent)"  arrow="none"/>
        <FlowMini label="Battery" icon="battery" value={`${HOUSE.energy.batteryPct}`} unit="%" color="var(--success)" arrow={HOUSE.energy.batteryFlow > 0 ? 'in' : 'out'}/>
      </div>
    </Raised>
  );
}

function FlowMini({ label, icon, value, unit, color, arrow }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, margin: '0 auto 6px',
        background: `${color}1f`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        <Icon name={icon} size={16}/>
      </div>
      <div style={{ fontFamily: HA_FONT_DISPLAY, fontSize: 16, fontWeight: 500, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, fontFamily: HA_FONT_MONO, letterSpacing: 0.5 }}>{unit} · {label}</div>
    </div>
  );
}

// Room grid card
function RoomCard({ room, ctx }) {
  const dense = ctx?.density === 'dense';
  return (
    <Raised padding={dense ? 14 : 16} radius={16}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <ActiveIconWell icon={room.icon} on={room.lights.on > 0} size={dense ? 32 : 40} iconSize={dense ? 14 : 18}/>
        <div style={{ textAlign: 'right' }}>
          <Stat value={room.temp} unit="°" size={dense ? 20 : 24}/>
        </div>
      </div>
      <div style={{ marginTop: dense ? 12 : 14 }}>
        <div style={{ fontSize: dense ? 13 : 14, fontWeight: 600, color: 'var(--text-primary)' }}>{room.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          {room.lights.on}/{room.lights.total} lights {room.lights.on > 0 && <span style={{ color: 'var(--accent)' }}>· on</span>}
        </div>
      </div>
    </Raised>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section title
// ─────────────────────────────────────────────────────────────────────────────
function SectionHead({ title, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 }}>
      <Eyebrow>{title}</Eyebrow>
      {action && <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW: Overview (3 compositions)
// ─────────────────────────────────────────────────────────────────────────────

function OverviewView({ ctx, variant = 'airy' }) {
  // sample data
  const insideSpark    = [69, 70, 70, 71, 71, 70, 71, 72, 72, 71, 71, 71];
  const energySpark    = [0.3, 0.6, 1.2, 1.8, 2.1, 2.4, 2.6, 2.5, 2.4, 2.3, 2.2, 1.9];
  const humiditySpark  = [40, 41, 42, 42, 43, 42, 42, 41, 42, 42, 41, 42];

  if (variant === 'hero') return <OverviewHero ctx={ctx} insideSpark={insideSpark} energySpark={energySpark}/>;

  // Airy & Dense share structure, density via ctx
  const gap = ctx.density === 'dense' ? 12 : 16;

  return (
    <div className="ha-scroll" style={{ display: 'flex', flexDirection: 'column', gap, height: '100%', overflow: 'auto' }}>
      {/* Top metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1.2fr', gap }}>
        <WeatherCard ctx={ctx}/>
        <SensorTile  ctx={ctx} icon="thermo"  label="Inside" value={HOUSE.inside.temp}     unit="°F" spark={insideSpark}    color="var(--text-primary)"/>
        <SensorTile  ctx={ctx} icon="drop"    label="Humidity" value={HOUSE.inside.humidity} unit="%"  spark={humiditySpark}  color="var(--text-primary)"/>
        <SensorTile  ctx={ctx} icon="bolt"    label="Power"  value={HOUSE.energy.load.toFixed(1)} unit="kW" spark={energySpark}    color="var(--accent)"/>
        <StatusBanner ctx={ctx}/>
      </div>

      {/* Scenes + Media — scenes laid out directly on the page bg (no outer card)
          so the raised chips don't sit inside another raised surface. */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.8fr', gap, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <SectionHead title="Scenes" action="Edit"/>
          <div style={{ display: 'flex', gap: 12, overflow: 'auto', padding: '6px 12px 14px', margin: '0 -12px' }}>
            {HOUSE.scenes.concat([
              { id: 'arrive', name: 'Arriving', icon: 'car', active: false },
              { id: 'focus',  name: 'Focus',    icon: 'briefcase', active: false },
            ]).map(s => <SceneChip key={s.id} scene={s} ctx={ctx}/>)}
          </div>
        </div>
        <MediaCard ctx={ctx}/>
      </div>

      {/* Rooms grid + Lights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap, flex: 1, minHeight: 0 }}>
        <div>
          <SectionHead title="Rooms"/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap }}>
            {ROOMS.map(r => <RoomCard key={r.id} room={r} ctx={ctx}/>)}
          </div>
        </div>
        <div>
          <SectionHead title="Active lights" action={`${LIGHTS_ALL.filter(l => l.on).length} on`}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: gap - 2 }}>
            {LIGHTS_ALL.slice(0, 4).map(l => <LightTileCard key={l.id} light={l} ctx={ctx}/>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewHero({ ctx, insideSpark, energySpark }) {
  return (
    <div className="ha-scroll" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, height: '100%', overflow: 'auto' }}>
      {/* Left column — Hero weather + scenes + media */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <WeatherCard ctx={ctx} large/>
        <div>
          <SectionHead title="Quick scenes" action="Edit"/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {HOUSE.scenes.map(s => <SceneChip key={s.id} scene={s} ctx={ctx}/>)}
          </div>
        </div>
        <MediaCard ctx={ctx}/>
      </div>
      {/* Right column — climate hero + status + sensors */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Raised padding={20} radius={18}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Eyebrow>Climate · Living Room</Eyebrow>
            <Pill tone="accent">Heat</Pill>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Stat value="71" unit="°F" size={64}/>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Target 70° · Humidity 42%</div>
            </div>
            <ClimateRing current={71} target={70} size={120}/>
          </div>
          <div style={{ marginTop: 16 }}>
            <Spark values={insideSpark} width={500} height={36} color="var(--accent)" filled/>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, fontFamily: HA_FONT_MONO, color: 'var(--text-muted)' }}>
              <span>12h ago</span><span>6h</span><span>now</span>
            </div>
          </div>
        </Raised>
        <StatusBanner ctx={ctx}/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <SensorTile  ctx={ctx} icon="bolt"  label="Power"   value={HOUSE.energy.load.toFixed(1)} unit="kW" spark={energySpark} color="var(--accent)"/>
          <SensorTile  ctx={ctx} icon="sun"   label="Solar"   value={HOUSE.energy.solar.toFixed(1)} unit="kW" spark={[0.1, 0.4, 1.0, 1.8, 2.2, 2.4, 2.3, 2.0, 1.5, 1.0, 0.6, 0.3]} color="var(--warning)"/>
          <SensorTile  ctx={ctx} icon="battery" label="Battery" value={HOUSE.energy.batteryPct} unit="%" spark={[60, 62, 65, 68, 70, 72, 74, 75, 76, 77, 78, 78]} color="var(--success)"/>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW: Climate
// ─────────────────────────────────────────────────────────────────────────────

function ClimateView({ ctx }) {
  const climateRooms = ROOMS.filter(r => r.climate);
  const tempHistory = {
    living:  [68, 69, 70, 70, 71, 71, 71, 72, 72, 71, 71, 71],
    kitchen: [69, 70, 70, 70, 70, 71, 71, 70, 70, 70, 70, 70],
    bed:     [67, 67, 68, 68, 68, 68, 69, 69, 68, 68, 68, 68],
    office:  [70, 71, 72, 72, 72, 73, 73, 72, 72, 72, 72, 72],
    bath:    [68, 69, 70, 70, 70, 70, 71, 71, 70, 70, 70, 70],
  };
  return (
    <div className="ha-scroll" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Aggregate */}
        <Raised padding={22} radius={18}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <Eyebrow>House average</Eyebrow>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 6 }}>
                <Stat value="70.2" unit="°F" size={48}/>
                <Pill tone="accent">Heating</Pill>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 18 }}>
              <KPI label="Setpoint avg" value="70.0°"/>
              <KPI label="Humidity"     value="42%"/>
              <KPI label="Runtime today" value="4h 12m"/>
              <KPI label="Cost today"   value="$1.84"/>
            </div>
          </div>
          {/* multi-room chart */}
          <div style={{ height: 160, position: 'relative' }}>
            <svg viewBox="0 0 600 160" width="100%" height="100%" preserveAspectRatio="none">
              {[40, 80, 120].map(y => (
                <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(125,128,146,0.15)" strokeDasharray="2 4"/>
              ))}
              {Object.entries(tempHistory).map(([k, vals], idx) => {
                const colors = ['var(--accent)', 'var(--warning)', 'var(--success)', 'var(--azure-color, #3a8ee8)', 'var(--plum-color, #9b59b6)'];
                const c = colors[idx % colors.length];
                const min = 65, max = 75;
                const w = 600 / (vals.length - 1);
                const pts = vals.map((v, i) => `${i*w},${160 - ((v - min) / (max - min)) * 140 - 10}`).join(' ');
                return (
                  <polyline key={k} points={pts} fill="none" stroke={c} strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" opacity={idx === 0 ? 1 : 0.55}/>
                );
              })}
            </svg>
            {/* legend */}
            <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 12, fontSize: 10, fontFamily: HA_FONT_MONO, color: 'var(--text-muted)' }}>
              {['Living', 'Kitchen', 'Bedroom', 'Office', 'Bath'].map((n, i) => {
                const colors = ['var(--accent)', 'var(--warning)', 'var(--success)', '#3a8ee8', '#9b59b6'];
                return (
                  <span key={n} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 2, borderRadius: 999, background: colors[i] }}/>
                    {n}
                  </span>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, fontFamily: HA_FONT_MONO, color: 'var(--text-muted)' }}>
            <span>−12h</span><span>−9h</span><span>−6h</span><span>−3h</span><span>now</span>
          </div>
        </Raised>

        {/* Rooms grid */}
        <div>
          <SectionHead title="Zones"/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {climateRooms.map(r => <ClimateTile key={r.id} room={r} ctx={ctx} full/>)}
          </div>
        </div>
      </div>

      {/* Right rail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <WeatherCard ctx={ctx} large/>
        <Raised padding={18} radius={18}>
          <SectionHead title="Outside today"/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Row icon="sun"      label="Sunrise"       value="6:14 AM"/>
            <Row icon="sun"      label="Sunset"        value="6:42 PM"/>
            <Row icon="wind"     label="Wind"          value="6 mph SW"/>
            <Row icon="cloudRain" label="Precipitation" value="0%" />
            <Row icon="drop"     label="Dew point"     value="51°"/>
          </div>
        </Raised>
        <Raised padding={14} radius={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ActiveIconWell icon="fan" on size={38} iconSize={18}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>HVAC Fan</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Auto · circulating</div>
            </div>
            <Toggle on/>
          </div>
        </Raised>
      </div>
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 9, fontFamily: HA_FONT_MONO, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
      <div style={{ fontFamily: HA_FONT_DISPLAY, fontSize: 18, fontWeight: 500, color: 'var(--text-primary)', marginTop: 2 }}>{value}</div>
    </div>
  );
}

function Row({ icon, label, value, accent = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <IconWell icon={icon} size={32} iconSize={14}/>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ marginLeft: 'auto', fontFamily: HA_FONT_DISPLAY, fontSize: 13, fontWeight: 600, color: accent ? 'var(--accent)' : 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW: Energy (Sankey + 24h)
// ─────────────────────────────────────────────────────────────────────────────

function EnergyView({ ctx }) {
  const daily = [0, 0, 0.2, 0.6, 1.4, 2.0, 2.2, 2.4, 2.3, 2.1, 1.7, 1.2, 0.6, 0.2, 0, 0, 0.1, 0.4, 0.8, 1.0, 1.1, 0.9, 0.5, 0.2];
  const consumption = [0.8, 0.9, 0.9, 0.8, 0.7, 0.8, 1.2, 1.5, 1.4, 1.3, 1.4, 1.5, 1.4, 1.5, 1.6, 1.8, 2.2, 2.6, 2.8, 2.5, 2.0, 1.6, 1.2, 0.9];
  return (
    <div className="ha-scroll" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, height: '100%', overflow: 'auto' }}>
      {/* Left — Sankey + history */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Sankey */}
        <Raised padding={22} radius={18}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <Eyebrow>Right now</Eyebrow>
              <div style={{ fontFamily: HA_FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>Energy distribution</div>
            </div>
            <Pill tone="success">Net export 1.5 kW</Pill>
          </div>
          <EnergySankey/>
        </Raised>

        {/* 24h history chart */}
        <Raised padding={22} radius={18}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <Eyebrow>Last 24 hours</Eyebrow>
              <div style={{ fontFamily: HA_FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>Solar vs. consumption</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['24h', 'Week', 'Month'].map((t, i) => (
                <div key={t} style={{
                  padding: '5px 10px', borderRadius: 8,
                  background: 'var(--surface)',
                  boxShadow: i === 0 ? 'var(--neu-pressed)' : 'var(--neu-raised-sm)',
                  color: i === 0 ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 11, fontWeight: 600,
                }}>{t}</div>
              ))}
            </div>
          </div>
          <EnergyHistoryChart solar={daily} consumption={consumption}/>
        </Raised>
      </div>

      {/* Right rail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Raised padding={18} radius={18}>
          <SectionHead title="Today"/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <BigStat label="Solar produced" value="11.8" unit="kWh" color="var(--warning)" icon="sun"/>
            <BigStat label="House used"     value="14.3" unit="kWh" color="var(--accent)"  icon="home"/>
            <BigStat label="Grid imported"  value="3.7"  unit="kWh" color="var(--text-secondary)" icon="grid"/>
            <BigStat label="To battery"     value="2.4"  unit="kWh" color="var(--success)" icon="battery"/>
          </div>
        </Raised>
        <Raised padding={18} radius={18}>
          <SectionHead title="Devices · highest load"/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <EnergyDeviceRow icon="fridge" name="Refrigerator"  w={154} pct={32}/>
            <EnergyDeviceRow icon="bath"   name="Water heater"  w={920} pct={62} active/>
            <EnergyDeviceRow icon="tv"     name="Living Room TV" w={86}  pct={20}/>
            <EnergyDeviceRow icon="car"    name="EV charger"    w={0}   pct={0}/>
            <EnergyDeviceRow icon="router" name="Network gear"  w={48}  pct={14}/>
          </div>
        </Raised>
        <Raised padding={14} radius={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ActiveIconWell icon="bolt" on size={42} iconSize={20}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Selling to grid</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>$0.18 /kWh · earned $0.27 today</div>
            </div>
            <div style={{ fontFamily: HA_FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: 'var(--success)' }}>+$0.27</div>
          </div>
        </Raised>
      </div>
    </div>
  );
}

function BigStat({ label, value, unit, color, icon }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Icon name={icon} size={12} color={color}/>
        <Eyebrow>{label}</Eyebrow>
      </div>
      <Stat value={value} unit={unit} size={26} color={color}/>
    </div>
  );
}

function EnergyDeviceRow({ icon, name, w, pct, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <ActiveIconWell icon={icon} on={active} size={32} iconSize={14}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: active ? 'var(--accent)' : 'var(--text-primary)' }}>{name}</div>
          <Mono style={{ fontSize: 11, color: 'var(--text-muted)' }}>{w} W</Mono>
        </div>
        <div style={{ marginTop: 6 }}>
          <Slider value={pct} height={4} knob={0}/>
        </div>
      </div>
    </div>
  );
}

// Sankey — solar/grid → house/battery/grid (export)
function EnergySankey() {
  // Layout: 3 cols. Sources(left): Solar 2.4, Grid 0.0. Hub(center): House 2.6. Targets(right): House out=0, Battery in 0.7, Export 1.5.
  // We'll draw curves with bezier paths.
  const W = 700, H = 240;
  const nodes = {
    solar:   { x: 30,  y: 50,  h: 110, label: 'Solar',    val: '2.4 kW', icon: 'sun',     color: 'var(--warning)' },
    grid:    { x: 30,  y: 178, h: 30,  label: 'Grid in',  val: '0.0 kW', icon: 'grid',    color: 'var(--text-muted)' },
    house:   { x: 580, y: 18,  h: 130, label: 'House',    val: '2.6 kW', icon: 'home',    color: 'var(--accent)' },
    battery: { x: 580, y: 160, h: 30,  label: 'Battery',  val: '0.7 kW', icon: 'battery', color: 'var(--success)' },
    export:  { x: 580, y: 198, h: 35,  label: 'Export',   val: '1.5 kW', icon: 'arrowR',  color: 'var(--success)' },
  };
  // flows: solar→house 1.6, solar→battery 0.7, solar→export 0.1; grid→house 0.0
  const flows = [
    { from: 'solar', to: 'house',   width: 70, color: 'var(--warning)', label: '1.6' },
    { from: 'solar', to: 'battery', width: 28, color: 'var(--success)', label: '0.7' },
    { from: 'solar', to: 'export',  width: 12, color: 'var(--success)', label: '0.1' },
    { from: 'grid',  to: 'house',   width: 4,  color: 'var(--text-muted)', label: '0.0', opacity: 0.4 },
  ];
  const path = (a, b, width) => {
    const x1 = a.x + 130, x2 = b.x; // edge of source node, start of target
    const y1 = a.y + a.h/2, y2 = b.y + b.h/2;
    const cx = (x1 + x2) / 2;
    return `M${x1},${y1 - width/2} C${cx},${y1 - width/2} ${cx},${y2 - width/2} ${x2},${y2 - width/2}
            L${x2},${y2 + width/2} C${cx},${y2 + width/2} ${cx},${y1 + width/2} ${x1},${y1 + width/2} Z`;
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {/* flows */}
      {flows.map((f, i) => {
        const a = nodes[f.from], b = nodes[f.to];
        return (
          <g key={i}>
            <path d={path(a, b, f.width)} fill={f.color} opacity={f.opacity ?? 0.35}/>
            <text
              x={(a.x + 130 + b.x) / 2} y={(a.y + a.h/2 + b.y + b.h/2) / 2 - 4}
              textAnchor="middle" fontFamily="JetBrains Mono" fontSize="10" fill={f.color} opacity={0.9}>
              {f.label}kW
            </text>
          </g>
        );
      })}
      {/* nodes */}
      {Object.entries(nodes).map(([k, n]) => (
        <SankeyNode key={k} {...n}/>
      ))}
    </svg>
  );
}

function SankeyNode({ x, y, h, label, val, icon, color }) {
  // SVG can't take CSS vars in box-shadow, so we render the surface via a
  // foreignObject DIV that picks up the same neu-raised tokens the rest of the
  // page uses — keeps the depth consistent in light + dark mode.
  return (
    <g transform={`translate(${x}, ${y})`}>
      <foreignObject x="0" y="0" width="130" height={h}>
        <div style={{
          width: '100%', height: '100%',
          background: 'var(--surface)', borderRadius: 10,
          boxShadow: 'var(--neu-raised-sm)',
          padding: 10,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
          boxSizing: 'border-box',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color }}>
            <Icon name={icon} size={12}/>
            <span style={{ fontSize: 10, fontFamily: HA_FONT_MONO, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</span>
          </div>
          <div style={{ fontFamily: HA_FONT_DISPLAY, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{val}</div>
        </div>
      </foreignObject>
    </g>
  );
}

function EnergyHistoryChart({ solar, consumption }) {
  const W = 700, H = 200;
  const max = Math.max(...solar, ...consumption);
  const min = 0;
  const range = max - min || 1;
  const sw = W / (solar.length - 1);
  const path = (vals, close = false) => {
    const pts = vals.map((v, i) => `${i*sw},${H - ((v - min) / range) * (H - 20) - 10}`);
    let p = `M${pts[0]} L` + pts.slice(1).join(' L');
    if (close) p += ` L${W},${H} L0,${H} Z`;
    return p;
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {/* horizontal grid */}
      {[0.25, 0.5, 0.75].map(y => (
        <line key={y} x1="0" y1={H * y} x2={W} y2={H * y} stroke="rgba(125,128,146,0.15)" strokeDasharray="2 4"/>
      ))}
      {/* solar */}
      <path d={path(solar, true)} fill="var(--warning)" opacity="0.18"/>
      <path d={path(solar)} fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* consumption */}
      <path d={path(consumption)} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 6px var(--accent-glow))' }}/>
      {/* axis labels */}
      {[0, 6, 12, 18, 23].map(h => (
        <text key={h} x={(W / 23) * h} y={H - 2} fontFamily="JetBrains Mono" fontSize="9" fill="var(--text-muted)">{h}:00</text>
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW: Security
// ─────────────────────────────────────────────────────────────────────────────

function SecurityView({ ctx }) {
  return (
    <div className="ha-scroll" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, height: '100%', overflow: 'auto' }}>
      {/* Cameras grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Cameras grid — flat container (cameras have their own dark frame) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Eyebrow>Cameras · 3 of 4 online</Eyebrow>
            <Pill tone="success">All Clear</Pill>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {CAMERAS.map(c => <CameraTile key={c.id} cam={c}/>)}
          </div>
        </div>
        <Raised padding={20} radius={18}>
          <SectionHead title="Recent activity"/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Activity icon="motion" label="Motion · Front Door"     time="6:42 PM" tone="accent"/>
            <Activity icon="user"   label="Nick's phone arrived"    time="5:14 PM" tone="success"/>
            <Activity icon="unlock" label="Front Door unlocked"     time="5:14 PM" tone="neutral"/>
            <Activity icon="motion" label="Motion · Driveway"       time="3:08 PM" tone="neutral"/>
            <Activity icon="bell"   label="Doorbell pressed"        time="1:24 PM" tone="warning"/>
          </div>
        </Raised>
      </div>

      {/* Right rail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Alarm panel */}
        <Raised padding={22} radius={18}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Eyebrow>Alarm panel</Eyebrow>
            <Pill tone="success">Armed · Home</Pill>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 18px' }}>
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: 'var(--accent-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)',
              boxShadow: 'inset 0 0 0 1px var(--accent-glow)',
            }}>
              <Icon name="shield" size={48} strokeWidth={1.6}/>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: 'Disarm',  tone: 'pressed', active: false },
              { label: 'Home',    tone: 'active',  active: true },
              { label: 'Away',    tone: 'pressed', active: false },
            ].map((m, i) => (
              <div key={m.label} style={{
                padding: '10px 0', textAlign: 'center', borderRadius: 12,
                background: 'var(--surface)',
                boxShadow: m.active ? 'var(--neu-pressed)' : 'var(--neu-raised-sm)',
                color: m.active ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 12, fontWeight: 600,
              }}>{m.label}</div>
            ))}
          </div>
        </Raised>

        {/* Locks & doors */}
        <Raised padding={18} radius={18}>
          <SectionHead title="Locks & doors"/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <DoorRow icon="lock"     name="Front Door"  state="Locked"   tone="success"/>
            <DoorRow icon="lock"     name="Back Door"   state="Locked"   tone="success"/>
            <DoorRow icon="unlock"   name="Garage Door" state="Unlocked" tone="warning"/>
            <DoorRow icon="garage"   name="Garage"      state="Closed"   tone="success"/>
          </div>
        </Raised>

        {/* Sensors */}
        <Raised padding={18} radius={18}>
          <SectionHead title="Sensors · 4 detectors"/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <SensorPill icon="bell"  label="Smoke" value="OK" tone="success"/>
            <SensorPill icon="wind"  label="CO"    value="OK" tone="success"/>
            <SensorPill icon="drop"  label="Leak" value="OK" tone="success"/>
            <SensorPill icon="motion" label="Glass" value="OK" tone="success"/>
          </div>
        </Raised>
      </div>
    </div>
  );
}

function CameraTile({ cam }) {
  return (
    <div style={{
      position: 'relative', borderRadius: 14, overflow: 'hidden',
      background: '#1a1b22',
      boxShadow: 'var(--neu-raised-sm)',
      aspectRatio: '16/9',
    }}>
      {/* "video" placeholder pattern */}
      <svg viewBox="0 0 320 180" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`cam-${cam.id}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#1f212a"/>
            <stop offset="1" stopColor="#0d0e13"/>
          </linearGradient>
          <pattern id={`cam-grid-${cam.id}`} width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="320" height="180" fill={`url(#cam-${cam.id})`}/>
        <rect width="320" height="180" fill={`url(#cam-grid-${cam.id})`}/>
        {/* fake silhouette of door / objects */}
        {cam.id === 'front' && <rect x="120" y="40" width="80" height="130" fill="rgba(255,255,255,0.08)" rx="4"/>}
        {cam.id === 'driveway' && <rect x="60" y="100" width="200" height="60" fill="rgba(255,255,255,0.06)" rx="6"/>}
        {cam.id === 'patio' && <circle cx="160" cy="100" r="40" fill="rgba(255,255,255,0.06)"/>}
      </svg>
      {/* offline overlay */}
      {!cam.live && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
          <span style={{ fontSize: 11, fontFamily: HA_FONT_MONO, color: 'rgba(255,255,255,0.7)' }}>OFFLINE</span>
        </div>
      )}
      {/* HUD */}
      <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
        {cam.live && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 7px', borderRadius: 999,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
            color: 'var(--accent)', fontSize: 9, fontFamily: HA_FONT_MONO, fontWeight: 600, letterSpacing: 0.5,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--accent)', animation: 'ha-pulse 2s infinite' }}/>
            LIVE
          </span>
        )}
        <span style={{
          padding: '3px 7px', borderRadius: 999,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
          color: '#fff', fontSize: 10, fontFamily: HA_FONT_SANS, fontWeight: 600,
        }}>{cam.name}</span>
      </div>
      <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <span style={{
          padding: '3px 7px', borderRadius: 6,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
          color: 'rgba(255,255,255,0.8)', fontSize: 9, fontFamily: HA_FONT_MONO,
        }}>Motion · {cam.motion}</span>
      </div>
      <style>{`@keyframes ha-pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.35 } }`}</style>
    </div>
  );
}

function Activity({ icon, label, time, tone = 'neutral' }) {
  const colors = {
    neutral: 'var(--text-secondary)',
    accent:  'var(--accent)',
    success: 'var(--success)',
    warning: 'var(--warning)',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <IconWell icon={icon} size={32} iconSize={14} color={colors[tone]}/>
      <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{label}</span>
      <Mono style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{time}</Mono>
    </div>
  );
}

function DoorRow({ icon, name, state, tone }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <ActiveIconWell icon={icon} on={tone === 'success'} size={32} iconSize={14}/>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
      </div>
      <Pill tone={tone}>{state}</Pill>
    </div>
  );
}

function SensorPill({ icon, label, value, tone }) {
  return (
    <Pressed padding={10} radius={12} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Icon name={icon} size={14} color={tone === 'success' ? 'var(--success)' : 'var(--text-muted)'}/>
      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: HA_FONT_MONO, color: tone === 'success' ? 'var(--success)' : 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
    </Pressed>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW: Automations
// ─────────────────────────────────────────────────────────────────────────────

function AutomationsView({ ctx }) {
  return (
    <div className="ha-scroll" style={{ display: 'grid', gridTemplateColumns: '1fr 0.6fr', gap: 16, height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <Eyebrow>Automations · 8 total</Eyebrow>
              <div style={{ fontFamily: HA_FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>7 enabled · 1 disabled</div>
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 16px', borderRadius: 999,
              background: 'var(--accent)', color: '#fff',
              fontSize: 12, fontWeight: 600,
              boxShadow: '0 4px 12px var(--accent-glow)',
            }}>
              <Icon name="plus" size={14} strokeWidth={2.2}/> New automation
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {AUTOMATIONS.map(a => <AutomationRow key={a.id} auto={a}/>)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Raised padding={18} radius={18}>
          <SectionHead title="Today"/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <KPIRow label="Triggers fired" value="34"/>
            <KPIRow label="Most active" value="Sunset lights on"/>
            <KPIRow label="Last triggered" value="6:42 PM"/>
            <KPIRow label="Failed runs" value="0" color="var(--success)"/>
          </div>
        </Raised>
        <Raised padding={18} radius={18}>
          <SectionHead title="Activity · last 24h" action="Logs"/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <TimelineRow time="6:42 PM" label="Sunset lights on"/>
            <TimelineRow time="5:14 PM" label="Arrive home"/>
            <TimelineRow time="3:08 PM" label="Motion · driveway"/>
            <TimelineRow time="8:13 AM" label="Leaving the house"/>
            <TimelineRow time="6:30 AM" label="Weekday morning"/>
          </div>
        </Raised>
        <Raised padding={18} radius={18}>
          <SectionHead title="Blueprints"/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Row icon="blueprint" label="Time of day"    value="3 used"/>
            <Row icon="blueprint" label="Zone enters/leaves" value="2 used"/>
            <Row icon="blueprint" label="State change"   value="2 used"/>
            <Row icon="blueprint" label="Numeric state"  value="1 used"/>
          </div>
        </Raised>
      </div>
    </div>
  );
}

function AutomationRow({ auto }) {
  return (
    <Raised padding={14} radius={14}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ActiveIconWell icon="bot" on={auto.on} size={38} iconSize={16}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: auto.on ? 'var(--text-primary)' : 'var(--text-muted)' }}>{auto.name}</div>
            <Mono style={{ fontSize: 9, color: 'var(--text-muted)', padding: '1px 6px', borderRadius: 4, background: 'rgba(125,128,146,0.10)' }}>{auto.blueprint}</Mono>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{auto.desc}</div>
        </div>
        <div style={{ textAlign: 'right', marginRight: 8 }}>
          <div style={{ fontSize: 9, fontFamily: HA_FONT_MONO, color: 'var(--text-muted)', letterSpacing: 0.6, textTransform: 'uppercase' }}>Last</div>
          <div style={{ fontSize: 11, fontFamily: HA_FONT_DISPLAY, color: 'var(--text-secondary)', marginTop: 1 }}>{auto.last}</div>
        </div>
        <div style={{
          padding: '6px 10px', borderRadius: 8,
          background: 'var(--surface)', boxShadow: 'var(--neu-raised-sm)',
          color: 'var(--text-secondary)', fontSize: 10, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 8,
        }}>
          <Icon name="play" size={10}/> Run
        </div>
        <Toggle on={auto.on}/>
      </div>
    </Raised>
  );
}

function KPIRow({ label, value, color = 'var(--text-primary)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontFamily: HA_FONT_DISPLAY, fontSize: 14, fontWeight: 600, color }}>{value}</span>
    </div>
  );
}
function TimelineRow({ time, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Mono style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 56 }}>{time}</Mono>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)', boxShadow: '0 0 4px var(--accent-glow)' }}/>
      <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PHONE views
// ─────────────────────────────────────────────────────────────────────────────

function PhoneShell({ children }) {
  return (
    <div style={{
      width: '100%', height: '100%', borderRadius: 44, overflow: 'hidden',
      background: 'var(--bg)', position: 'relative',
      boxShadow: '0 32px 64px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.08)',
    }}>
      {/* dynamic island */}
      <div style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        width: 116, height: 32, borderRadius: 20, background: '#000', zIndex: 50,
      }}/>
      {/* status bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        height: 50, padding: '16px 24px 0', display: 'flex', justifyContent: 'space-between',
        fontFamily: '-apple-system, system-ui', fontWeight: 600, fontSize: 15,
        color: 'var(--text-primary)',
      }}>
        <span>9:41</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="18" height="11" viewBox="0 0 18 11"><rect x="0" y="7" width="3" height="4" rx="0.5" fill="currentColor"/><rect x="4.5" y="5" width="3" height="6" rx="0.5" fill="currentColor"/><rect x="9" y="2.5" width="3" height="8.5" rx="0.5" fill="currentColor"/><rect x="13.5" y="0" width="3" height="11" rx="0.5" fill="currentColor"/></svg>
          <svg width="25" height="12" viewBox="0 0 25 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.35" fill="none"/><rect x="2" y="2" width="18" height="8" rx="2" fill="currentColor"/></svg>
        </span>
      </div>
      <div style={{ height: '100%', paddingTop: 56, overflow: 'auto' }}>{children}</div>
      {/* home indicator */}
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 132, height: 5, borderRadius: 999, background: 'rgba(0,0,0,0.25)', zIndex: 60,
      }}/>
    </div>
  );
}

function MobileOverview({ ctx }) {
  return (
    <div style={{ padding: '8px 18px 80px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <Eyebrow>{HOUSE.greeting}</Eyebrow>
        <div style={{ fontFamily: HA_FONT_DISPLAY, fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>Apartment</div>
      </div>
      {/* hero weather + status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
        <Raised padding={14} radius={16}>
          <Eyebrow>Outside</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <Stat value={HOUSE.outside.temp} unit="°F" size={32}/>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{HOUSE.outside.condition} · L {HOUSE.outside.low}° / H {HOUSE.outside.high}°</div>
        </Raised>
        <Raised padding={14} radius={16}>
          <Eyebrow>Inside</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
            <Stat value={HOUSE.inside.temp} unit="°F" size={32}/>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Humidity {HOUSE.inside.humidity}%</div>
        </Raised>
      </div>
      <StatusBanner ctx={ctx}/>
      {/* scenes */}
      <div>
        <SectionHead title="Quick scenes"/>
        <div style={{ display: 'flex', gap: 10, overflow: 'auto', padding: '6px 12px 14px', margin: '0 -12px' }}>
          {HOUSE.scenes.map(s => <SceneChip key={s.id} scene={s} ctx={ctx}/>)}
        </div>
      </div>
      {/* rooms 2-col */}
      <div>
        <SectionHead title="Rooms"/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {ROOMS.slice(0, 4).map(r => <RoomCard key={r.id} room={r} ctx={{ ...ctx, density: 'dense' }}/>)}
        </div>
      </div>
      <MediaCard ctx={{ ...ctx, density: 'dense' }} compact/>
    </div>
  );
}

function MobileClimate({ ctx }) {
  const spark = [68, 69, 70, 70, 71, 71, 71, 72, 72, 71, 71, 71];
  return (
    <div style={{ padding: '8px 18px 80px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <IconWell icon="chevL" size={36} iconSize={16}/>
        <div>
          <Eyebrow>Climate · Living Room</Eyebrow>
          <div style={{ fontFamily: HA_FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Thermostat</div>
        </div>
      </div>
      <Raised padding={20} radius={20}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
          <ClimateRing current={71} target={70} size={200}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
          <KPI label="Current" value="71°F"/>
          <KPI label="Target"  value="70°F"/>
          <KPI label="Humidity" value="42%"/>
        </div>
        <div style={{ marginTop: 16 }}>
          <Spark values={spark} width={320} height={36} color="var(--accent)" filled/>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, fontFamily: HA_FONT_MONO, color: 'var(--text-muted)' }}>
            <span>−12h</span><span>−6h</span><span>now</span>
          </div>
        </div>
      </Raised>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {['Heat', 'Cool', 'Auto', 'Off'].map((m, i) => {
          const active = m === 'Heat';
          return (
            <div key={m} style={{
              padding: '12px 0', textAlign: 'center', borderRadius: 12,
              background: 'var(--surface)',
              boxShadow: active ? 'var(--neu-pressed)' : 'var(--neu-raised-sm)',
              color: active ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 600,
            }}>{m}</div>
          );
        })}
      </div>
      <Raised padding={16} radius={16}>
        <SectionHead title="Other zones"/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ROOMS.filter(r => r.climate && r.id !== 'living').map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ActiveIconWell icon={r.icon} on size={32} iconSize={14}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Target {r.target}°</div>
              </div>
              <Stat value={r.climate} unit="°" size={20}/>
            </div>
          ))}
        </div>
      </Raised>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIGHT CONTROLS — RGB / Color temp / combined phone
// HA's more-info dialog for a light entity, restyled to Smartmorphic.
// ─────────────────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 0, g: 0, b: 0 };
}

// Outer sheet — fills its artboard. Use for desktop "more-info" dialogs.
function LightControlSheet({ light, children, padding = 24, gap = 18 }) {
  return (
    <div style={{
      width: '100%', height: '100%', borderRadius: 24,
      background: 'var(--surface)',
      boxShadow: 'var(--neu-raised-lg)',
      padding, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap,
      overflow: 'auto',
    }}>
      <LightSheetHeader light={light}/>
      {children}
    </div>
  );
}

function LightSheetHeader({ light }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <IconWell icon="chevL" size={36} iconSize={16}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Eyebrow>{light.room}</Eyebrow>
        <div style={{ fontFamily: HA_FONT_DISPLAY, fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2, letterSpacing: -0.3 }}>{light.name}</div>
      </div>
      <Mono style={{ fontSize: 11, color: 'var(--text-muted)' }}>{light.brightness}%</Mono>
      <Toggle on={light.on}/>
    </div>
  );
}

// Color | White segmented tab
function ColorTabSwitch({ active = 'color' }) {
  const tabs = [
    { id: 'color', label: 'Color' },
    { id: 'white', label: 'White' },
  ];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      padding: 4, gap: 4, borderRadius: 12,
      background: 'var(--surface)', boxShadow: 'var(--neu-pressed)',
    }}>
      {tabs.map(t => (
        <div key={t.id} style={{
          padding: '9px 0', textAlign: 'center', borderRadius: 9,
          background: 'var(--surface)',
          boxShadow: t.id === active ? 'var(--neu-raised-sm)' : 'none',
          color: t.id === active ? 'var(--accent)' : 'var(--text-secondary)',
          fontSize: 12, fontWeight: 600,
        }}>{t.label}</div>
      ))}
    </div>
  );
}

// RGB wheel — conic hue + radial saturation falloff
function ColorWheel({ size = 260, selected = { x: 0.72, y: 0.32 }, color = '#ff7850' }) {
  // pressed inset gives the wheel a "set into the surface" feel
  return (
    <div style={{
      width: size, height: size, position: 'relative',
      borderRadius: '50%',
      padding: 8,
      background: 'var(--surface)',
      boxShadow: 'var(--neu-pressed)',
    }}>
      <div style={{
        width: '100%', height: '100%', position: 'relative',
        borderRadius: '50%',
        background: `
          radial-gradient(circle at center, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0) 62%),
          conic-gradient(
            from 0deg,
            hsl(0,100%,55%)   0deg,
            hsl(60,100%,55%)  60deg,
            hsl(120,100%,52%) 120deg,
            hsl(180,100%,50%) 180deg,
            hsl(240,100%,60%) 240deg,
            hsl(300,100%,58%) 300deg,
            hsl(360,100%,55%) 360deg
          )
        `,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)',
      }}>
        {/* selection handle */}
        <div style={{
          position: 'absolute',
          left: `${selected.x * 100}%`, top: `${selected.y * 100}%`,
          width: 30, height: 30, borderRadius: '50%',
          background: color,
          border: '4px solid #fff',
          boxShadow: '0 3px 10px rgba(0,0,0,0.30), 0 0 0 1px rgba(0,0,0,0.08)',
          transform: 'translate(-50%, -50%)',
        }}/>
      </div>
    </div>
  );
}

function ColorReadout({ color = '#ff7850', label = 'Selected' }) {
  const rgb = hexToRgb(color);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: color,
        boxShadow: 'var(--neu-raised-sm), inset 0 0 0 1px rgba(255,255,255,0.3)',
      }}/>
      <div style={{ flex: 1 }}>
        <Eyebrow>{label}</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
          <Mono style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{color.toUpperCase()}</Mono>
          <Mono style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rgb.r}, {rgb.g}, {rgb.b}</Mono>
        </div>
      </div>
      <div style={{
        padding: '6px 10px', borderRadius: 8,
        background: 'var(--surface)', boxShadow: 'var(--neu-raised-sm)',
        color: 'var(--text-secondary)', fontSize: 10, fontFamily: HA_FONT_MONO, fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: 5,
      }}>
        <Icon name="refresh" size={11}/> SYNC
      </div>
    </div>
  );
}

// Big brightness slider with sun glyphs flanking it
function BigBrightnessSlider({ value = 80 }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Eyebrow>Brightness</Eyebrow>
        <div style={{ fontFamily: HA_FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
          {value}<span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 2 }}>%</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon name="sun" size={13} color="var(--text-muted)" strokeWidth={1.5}/>
        <div style={{ flex: 1 }}>
          <Slider value={value} height={10} knob={22}/>
        </div>
        <Icon name="sun" size={20} color="var(--accent)" strokeWidth={2}/>
      </div>
    </div>
  );
}

// Color temperature slider with kelvin gradient + draggable thumb
function ColorTempSlider({ value = 0.22 /* 0..1 */ }) {
  const kelvin = Math.round(2200 + value * (6500 - 2200));
  const label = kelvin < 2700 ? 'Candle'
              : kelvin < 3300 ? 'Warm white'
              : kelvin < 4200 ? 'Soft white'
              : kelvin < 5500 ? 'Daylight'
              : 'Cool white';
  // map value to a representative color for the thumb
  const thumbColor = kelvin < 3000 ? '#ffae5c'
                  : kelvin < 4000 ? '#ffd9a8'
                  : kelvin < 5000 ? '#fff5e0'
                  : kelvin < 6000 ? '#f0f6ff'
                  : '#c5dcff';
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Eyebrow>Color temperature</Eyebrow>
        <div>
          <span style={{ fontFamily: HA_FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{kelvin}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 2 }}>K</span>
          <span style={{ marginLeft: 10, fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>{label}</span>
        </div>
      </div>
      <div style={{
        position: 'relative', height: 32, borderRadius: 16,
        background: 'linear-gradient(90deg, #ff9a3c 0%, #ffc680 18%, #ffe2b8 38%, #fff3d6 55%, #f0f7ff 72%, #b3d1ff 90%, #6fa4ff 100%)',
        boxShadow: 'var(--neu-pressed), inset 0 0 0 1px rgba(255,255,255,0.4)',
      }}>
        {/* tick marks at preset stops */}
        {[0, 0.12, 0.27, 0.42, 0.65, 1].map((p, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${p * 100}%`, top: '50%', transform: 'translate(-50%, -50%)',
            width: 1, height: 8, background: 'rgba(0,0,0,0.18)',
          }}/>
        ))}
        {/* thumb */}
        <div style={{
          position: 'absolute',
          left: `calc(${value * 100}% )`, top: '50%', transform: 'translate(-50%, -50%)',
          width: 32, height: 32, borderRadius: '50%',
          background: thumbColor,
          border: '4px solid #fff',
          boxShadow: '0 3px 10px rgba(0,0,0,0.30), 0 0 0 1px rgba(0,0,0,0.08)',
        }}/>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, fontFamily: HA_FONT_MONO, color: 'var(--text-muted)' }}>
        <span>2200K</span><span>3000K</span><span>4000K</span><span>5000K</span><span>6500K</span>
      </div>
    </div>
  );
}

// Row of round preset color chips
function SwatchRow({ swatches, selected = -1, columns = 10 }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Eyebrow>Favorites</Eyebrow>
        <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, fontFamily: HA_FONT_MONO, letterSpacing: 0.5 }}>+ ADD</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 10 }}>
        {swatches.map((c, i) => {
          const sel = i === selected;
          return (
            <div key={i} style={{
              position: 'relative', aspectRatio: '1', borderRadius: '50%',
              background: c,
              boxShadow: sel
                ? '0 0 0 2px var(--surface), 0 0 0 4px var(--accent), 0 2px 6px rgba(0,0,0,0.18)'
                : '0 1px 3px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.35)',
            }}/>
          );
        })}
      </div>
    </div>
  );
}

// White preset cards
function WhitePresetRow({ selected = 1 }) {
  const presets = [
    { name: 'Candle',   kelvin: 2200, color: '#ff9a3c' },
    { name: 'Warm',     kelvin: 2700, color: '#ffc680' },
    { name: 'Soft',     kelvin: 3500, color: '#ffe8c2' },
    { name: 'Daylight', kelvin: 5000, color: '#fffcf2' },
    { name: 'Cool',     kelvin: 6500, color: '#cfe0ff' },
  ];
  return (
    <div>
      <Eyebrow style={{ marginBottom: 10 }}>Presets</Eyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {presets.map((p, i) => {
          const sel = i === selected;
          return (
            <div key={p.name} style={{
              padding: '12px 6px 10px', borderRadius: 14,
              background: 'var(--surface)',
              boxShadow: sel ? 'var(--neu-pressed)' : 'var(--neu-raised-sm)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: p.color,
                boxShadow: sel
                  ? `0 0 14px ${p.color}99, inset 0 0 0 1px rgba(0,0,0,0.06)`
                  : '0 1px 3px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(0,0,0,0.06)',
              }}/>
              <div style={{ fontSize: 11, fontWeight: 600, color: sel ? 'var(--accent)' : 'var(--text-primary)' }}>{p.name}</div>
              <Mono style={{ fontSize: 9, color: 'var(--text-muted)' }}>{p.kelvin}K</Mono>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EffectsRow() {
  const effects = ['None', 'Pulse', 'Color loop', 'Strobe', 'Candle'];
  const active = 0;
  return (
    <div>
      <Eyebrow style={{ marginBottom: 10 }}>Effect</Eyebrow>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {effects.map((e, i) => (
          <div key={e} style={{
            padding: '8px 14px', borderRadius: 999,
            background: 'var(--surface)',
            boxShadow: i === active ? 'var(--neu-pressed)' : 'var(--neu-raised-sm)',
            color: i === active ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 11, fontWeight: 600,
          }}>{e}</div>
        ))}
      </div>
    </div>
  );
}

// ── Variations ──────────────────────────────────────────────────────────

function LightControlRGB() {
  const light = { room: 'Living Room', name: 'Pendant', brightness: 80, on: true };
  const swatches = ['#ffffff', '#ffdfba', '#ffb38a', '#ff7850', '#ff4d6d', '#c64dff', '#4d8aff', '#4dffd6', '#74ff4d', '#fcff4d'];
  return (
    <LightControlSheet light={light}>
      <ColorTabSwitch active="color"/>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
        <ColorWheel size={260} selected={{ x: 0.74, y: 0.34 }} color="#ff7850"/>
      </div>
      <ColorReadout color="#ff7850"/>
      <BigBrightnessSlider value={80}/>
      <SwatchRow swatches={swatches} selected={3}/>
      <EffectsRow/>
    </LightControlSheet>
  );
}

function LightControlWhite() {
  const light = { room: 'Bedroom', name: 'Ceiling Light', brightness: 60, on: true };
  return (
    <LightControlSheet light={light}>
      <ColorTabSwitch active="white"/>
      {/* Big preview lamp */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 16px' }}>
        <div style={{ position: 'relative', width: 220, height: 220 }}>
          {/* halo */}
          <div style={{
            position: 'absolute', inset: -30, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,168,77,0.35) 0%, rgba(255,168,77,0) 70%)',
          }}/>
          {/* bulb */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #fff6dc 0%, #ffd28a 50%, #ffa84d 100%)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5), inset -8px -8px 24px rgba(0,0,0,0.10)',
          }}/>
          {/* Kelvin label center */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: 'rgba(80,40,10,0.8)', textShadow: '0 1px 2px rgba(255,255,255,0.5)',
          }}>
            <div style={{ fontFamily: HA_FONT_DISPLAY, fontSize: 44, fontWeight: 600, letterSpacing: -1, lineHeight: 1 }}>2700</div>
            <div style={{ fontSize: 10, fontFamily: HA_FONT_MONO, letterSpacing: 1, marginTop: 4 }}>KELVIN</div>
          </div>
        </div>
      </div>
      <ColorTempSlider value={0.12}/>
      <BigBrightnessSlider value={60}/>
      <WhitePresetRow selected={1}/>
    </LightControlSheet>
  );
}

function LightControlPhone() {
  const light = { room: 'Office', name: 'Desk Lamp', brightness: 70, on: true };
  return (
    <PhoneShell>
      <div style={{ padding: '4px 18px 60px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <LightSheetHeader light={light}/>
        <ColorTabSwitch active="color"/>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
          <ColorWheel size={240} selected={{ x: 0.32, y: 0.72 }} color="#4dffd6"/>
        </div>
        <ColorReadout color="#4dffd6"/>
        <BigBrightnessSlider value={70}/>
        <SwatchRow swatches={['#ffffff','#ffdfba','#ff7850','#ff4d6d','#c64dff','#4dffd6']} selected={5} columns={6}/>
      </div>
    </PhoneShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Globals
// ─────────────────────────────────────────────────────────────────────────────
Object.assign(window, {
  Icon, Raised, Pressed, IconWell, ActiveIconWell, Eyebrow, Stat, Mono, Pill, Slider, Toggle, Spark,
  HAWindow, HASidebar, HATopBar,
  TileCard, LightTileCard, SensorTile, ClimateTile, ClimateRing, SceneChip, MediaCard,
  WeatherCard, StatusBanner, EnergyTile, FlowMini, RoomCard, SectionHead, Row, KPI,
  EnergySankey, EnergyHistoryChart, BigStat, EnergyDeviceRow,
  CameraTile, Activity, DoorRow, SensorPill,
  AutomationRow, KPIRow, TimelineRow,
  OverviewView, OverviewHero, ClimateView, EnergyView, SecurityView, AutomationsView,
  PhoneShell, MobileOverview, MobileClimate,
  hexToRgb, LightControlSheet, LightSheetHeader, ColorTabSwitch, ColorWheel,
  ColorReadout, BigBrightnessSlider, ColorTempSlider, SwatchRow, WhitePresetRow, EffectsRow,
  LightControlRGB, LightControlWhite, LightControlPhone,
});
