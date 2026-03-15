const P = 4;
const snap = v => Math.floor(v / P) * P;

const C = {
  bg: "#e8e4d9", dark: "#2a2a2a", mid: "#6b6b6b", light: "#b0aaa0",
  glow: "#d4c85a", glowSoft: "#e8dfa0",
  wall: "#ccc8bc", wallLight: "#d8d4c8", wallDark: "#b8b4a8", white: "#f0ece2",
  shelf: "#8b7355", shelfLight: "#a08868",
  plant: "#5a7a52", plantDark: "#3d5438", pot: "#b07050", potDark: "#8a5840",
  box: "#9a8a6a", boxDark: "#7a6a4a", boxLight: "#b0a080",
  cat: "#555", catLight: "#777",
  sky: "#8ab4d0", skyLight: "#a8cce0", cloud: "#d0e4f0",
  windowFrame: "#7a7060", windowFrameLight: "#968a78", sill: "#8a8070",
};

const Px = ({ x, y, w, h, fill, opacity = 1 }) => (
  <rect
    x={snap(x)} y={snap(y)}
    width={Math.max(0, snap(w))} height={Math.max(0, snap(h))}
    fill={fill} opacity={opacity}
  />
);

function cordCurve(x1, y1, x2, y2, sag, steps = 20) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push([
      Math.round(x1 + (x2 - x1) * t),
      Math.round(y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * sag),
    ]);
  }
  return pts;
}

function Lamp({ cx, cy, lit }) {
  return (
    <g id={lit ? "Lamp-Lit" : "Lamp-Unlit"}>
      <Px x={cx - 16} y={cy}      w={32} h={8}  fill={C.dark} />
      <Px x={cx - 4}  y={cy - 48} w={8}  h={48} fill={C.dark} />
      <Px x={cx - 24} y={cy - 72} w={48} h={24} fill={C.dark} />
      <Px x={cx - 20} y={cy - 68} w={40} h={16} fill={lit ? C.glow : C.mid} />
      {lit && <>
        {[1, 2, 3, 4].map(r => (
          <ellipse key={r} cx={cx} cy={cy - 50}
            rx={30 + r * 16} ry={20 + r * 12}
            fill={C.glow} opacity={0.15} />
        ))}
        <path
          d={`M ${cx - 20} ${cy - 48} L ${cx - 50} ${cy + 10} L ${cx + 50} ${cy + 10} L ${cx + 20} ${cy - 48} Z`}
          fill={C.glowSoft} opacity={0.08}
        />
      </>}
    </g>
  );
}

function Table({ x, y, w = 140, h = 12 }) {
  return (
    <g id="Table">
      <Px x={x}           y={y}     w={w}       h={h}  fill={C.dark} />
      <Px x={x + P}       y={y + P} w={w - P*2} h={P}  fill={C.mid} />
      <Px x={x + P*2}     y={y + h} w={P*2}     h={40} fill={C.dark} />
      <Px x={x + w - P*4} y={y + h} w={P*2}     h={40} fill={C.dark} />
    </g>
  );
}

function Window({ x, y, w = 100, h = 80 }) {
  const o = 0.55;
  return (
    <g id="Window">
      <Px x={x-4} y={y-4} w={w+8} h={h+8} fill={C.windowFrame} opacity={o} />
      <Px x={x-2} y={y-2} w={w+4} h={h+4} fill={C.windowFrameLight} opacity={o} />
      <Px x={x}   y={y}   w={w}   h={h}   fill={C.sky}      opacity={o} />
      <Px x={x}   y={y}   w={w}   h={Math.floor(h/3)} fill={C.skyLight} opacity={o} />
      {/* static clouds */}
      <Px x={x - 20} y={y + 12} w={24} h={P*2} fill={C.cloud} opacity={0.4} />
      <Px x={x - 24} y={y + 16} w={32} h={P}   fill={C.cloud} opacity={0.4} />
      <Px x={x + 40} y={y + 28} w={20} h={P*2} fill={C.cloud} opacity={0.4} />
      <Px x={x + 36} y={y + 32} w={28} h={P}   fill={C.cloud} opacity={0.4} />
      {/* dividers */}
      <Px x={x + Math.floor(w/2) - 2} y={y} w={P} h={h} fill={C.windowFrame} opacity={o} />
      <Px x={x} y={y + Math.floor(h/2) - 2} w={w} h={P} fill={C.windowFrame} opacity={o} />
      {/* sill */}
      <Px x={x-8} y={y+h+4} w={w+16} h={P*2} fill={C.sill} opacity={o} />
      <Px x={x-6} y={y+h+4} w={w+12} h={P}   fill={C.windowFrameLight} opacity={o} />
    </g>
  );
}

function Wall({ x, y, h = 200 }) {
  return (
    <g id="Wall">
      <Px x={x}   y={y} w={80} h={h} fill={C.wall} />
      <Px x={x}   y={y} w={P}  h={h} fill={C.wallLight} />
      {[0,1,2].map(i => <Px key={i} x={x+P} y={y+40+i*72} w={72} h={P} fill={C.wallDark} />)}
      <Px x={x} y={y + Math.min(h - 18, 120)} w={80} h={8} fill={C.wallDark} />
      <Px x={x} y={y + Math.min(h - 20, 118)} w={80} h={P} fill={C.mid} />
    </g>
  );
}

function Outlet({ cx, cy }) {
  return (
    <g id="Outlet">
      <Px x={cx-12} y={cy-18} w={24} h={32} fill={C.dark} />
      <Px x={cx-10} y={cy-16} w={20} h={28} fill={C.white} />
      <Px x={cx-3}  y={cy-10} w={P}  h={8}  fill={C.dark} />
      <Px x={cx+2}  y={cy-10} w={P}  h={8}  fill={C.dark} />
      <Px x={cx-3}  y={cy+4}  w={P}  h={8}  fill={C.dark} />
      <Px x={cx+2}  y={cy+4}  w={P}  h={8}  fill={C.dark} />
      <Px x={cx-1}  y={cy-14} w={2}  h={2}  fill={C.mid} />
      <Px x={cx-1}  y={cy+13} w={2}  h={2}  fill={C.mid} />
    </g>
  );
}

function Shelf({ x, y, w = 60 }) {
  return (
    <g id="Shelf">
      <Px x={x}         y={y}     w={P*2} h={P}   fill={C.dark} />
      <Px x={x}         y={y+P}   w={P}   h={P*3} fill={C.dark} />
      <Px x={x+w-P*2}   y={y}     w={P*2} h={P}   fill={C.dark} />
      <Px x={x+w-P}     y={y+P}   w={P}   h={P*3} fill={C.dark} />
      <Px x={x-P}       y={y-P}   w={w+P*2} h={P*2} fill={C.shelf} />
      <Px x={x}         y={y-P}   w={w}   h={P}   fill={C.shelfLight} />
      {/* items */}
      <Px x={x+P*2}  y={y-P*5} w={P*2} h={P*4} fill={C.dark} />
      <Px x={x+P*4}  y={y-P*6} w={P*2} h={P*5} fill={C.mid} />
      <Px x={x+P*6}  y={y-P*4} w={P*3} h={P*3} fill="#8a6050" />
      <Px x={x+P*10} y={y-P*5} w={P*2} h={P*4} fill={C.dark} />
    </g>
  );
}

function Plant({ cx, cy }) {
  return (
    <g id="Plant">
      <Px x={cx-10} y={cy-20} w={20} h={20} fill={C.pot} />
      <Px x={cx-12} y={cy-22} w={24} h={P}  fill={C.pot} />
      <Px x={cx-8}  y={cy-18} w={16} h={4}  fill={C.potDark} />
      <Px x={cx-8}  y={cy-22} w={16} h={P}  fill="#6a5a40" />
      <Px x={cx-2}  y={cy-36} w={P}  h={14} fill={C.plantDark} />
      <Px x={cx-10} y={cy-40} w={P*2} h={P*2} fill={C.plant} />
      <Px x={cx-6}  y={cy-44} w={P*2} h={P*2} fill={C.plant} />
      <Px x={cx+2}  y={cy-38} w={P*2} h={P*2} fill={C.plant} />
      <Px x={cx+6}  y={cy-42} w={P*2} h={P*2} fill={C.plant} />
      <Px x={cx-2}  y={cy-46} w={P*2} h={P*2} fill={C.plant} />
      <Px x={cx+8}  y={cy-36} w={P*2} h={P}   fill={C.plant} />
      <Px x={cx-12} y={cy-38} w={P*2} h={P}   fill={C.plant} />
    </g>
  );
}

function Boxes({ x, y }) {
  return (
    <g id="Boxes">
      <Px x={x}    y={y-28} w={36}  h={28} fill={C.box} />
      <Px x={x+P}  y={y-26} w={32}  h={P}  fill={C.boxLight} />
      <Px x={x+14} y={y-28} w={P*2} h={28} fill={C.boxDark} />
      <Px x={x+4}  y={y-48} w={28}  h={20} fill={C.boxDark} />
      <Px x={x+6}  y={y-46} w={24}  h={P}  fill={C.box} />
      <Px x={x+14} y={y-48} w={P*2} h={20} fill={C.mid} />
      <Px x={x+16} y={y-48} w={P}   h={P}  fill={C.light} />
    </g>
  );
}

function Cat({ cx, cy }) {
  return (
    <g id="Cat">
      <Px x={cx-10} y={cy-16} w={20} h={16} fill={C.cat} />
      <Px x={cx-8}  y={cy-14} w={16} h={12} fill={C.catLight} />
      <Px x={cx-8}  y={cy-28} w={16} h={12} fill={C.cat} />
      <Px x={cx-6}  y={cy-26} w={12} h={8}  fill={C.catLight} />
      <Px x={cx-8}  y={cy-32} w={P}  h={P}  fill={C.cat} />
      <Px x={cx+6}  y={cy-32} w={P}  h={P}  fill={C.cat} />
      <Px x={cx-4}  y={cy-24} w={2}  h={2}  fill={C.glow} />
      <Px x={cx+4}  y={cy-24} w={2}  h={2}  fill={C.glow} />
      <Px x={cx+10} y={cy-8}  w={P}  h={P}  fill={C.cat} />
      <Px x={cx+14} y={cy-10} w={P}  h={P}  fill={C.cat} />
      <Px x={cx+18} y={cy-14} w={P}  h={P}  fill={C.cat} />
    </g>
  );
}

function Plug({ cx, cy, color = C.dark }) {
  const pc = color === C.dark ? C.mid : color;
  return (
    <g id="Plug">
      <Px x={cx-4} y={cy-2} w={8} h={8} fill={color} />
      <Px x={cx-2} y={cy+4} w={P} h={5} fill={pc} />
      <Px x={cx+1} y={cy+4} w={P} h={5} fill={pc} />
    </g>
  );
}

function Cord({ x1, y1, x2, y2, sag = -40, color = C.dark }) {
  const pts = cordCurve(x1, y1, x2, y2, sag, 18);
  const points = pts.map(([x, y]) => `${x},${y}`).join(' ');
  return (
    <g id="Cord">
      <polyline points={points} stroke={color} strokeWidth={P} fill="none" strokeLinecap="square" strokeLinejoin="miter" />
      <Plug cx={x2} cy={y2} color={color} />
    </g>
  );
}

// Card wrapper with label
function Card({ x, y, w, h, label }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#f5f3ee" stroke="#d0ccc0" strokeWidth={1} rx={3} />
      <text x={x + w / 2} y={y + h - 6} textAnchor="middle" fontSize={9} fontFamily="monospace" fill={C.mid} letterSpacing={1}>
        {label}
      </text>
    </g>
  );
}

const CARD_PAD = 16;

export default function SpritesPage() {
  return (
    <div style={{ background: "#d4d0c6", minHeight: "100vh", padding: 32, fontFamily: "monospace" }}>
      <p style={{ color: C.mid, fontSize: 11, marginBottom: 16, letterSpacing: 2 }}>
        LAMP &amp; CORD — SPRITE SHEET
      </p>

      <svg
        id="GameSprites"
        width={920}
        height={780}
        viewBox="0 0 920 780"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        {/* ── Row 1: Characters ─────────────────────────────── */}
        <text x={20} y={16} fontSize={9} fontFamily="monospace" fill={C.mid} letterSpacing={2}>CHARACTERS</text>

        {/* Lamp Unlit */}
        <Card x={20} y={24} w={110} h={120} label="LAMP UNLIT" />
        <Lamp cx={75} cy={122} lit={false} />

        {/* Lamp Lit */}
        <Card x={148} y={24} w={130} h={120} label="LAMP LIT" />
        <Lamp cx={213} cy={122} lit={true} />

        {/* Cat */}
        <Card x={296} y={24} w={100} h={120} label="CAT" />
        <Cat cx={346} cy={122} />

        {/* Plant */}
        <Card x={414} y={24} w={100} h={120} label="PLANT" />
        <Plant cx={464} cy={122} />

        {/* Boxes */}
        <Card x={532} y={24} w={100} h={120} label="BOXES" />
        <Boxes x={544} y={122} />

        {/* Outlet */}
        <Card x={650} y={24} w={90} h={120} label="OUTLET" />
        <Outlet cx={695} cy={90} />

        {/* Plug */}
        <Card x={758} y={24} w={80} h={120} label="PLUG" />
        <Plug cx={798} cy={90} />

        {/* ── Row 2: Furniture ──────────────────────────────── */}
        <text x={20} y={170} fontSize={9} fontFamily="monospace" fill={C.mid} letterSpacing={2}>FURNITURE</text>

        {/* Table */}
        <Card x={20} y={178} w={210} h={110} label="TABLE" />
        <Table x={35} y={240} w={180} h={12} />

        {/* Shelf */}
        <Card x={248} y={178} w={140} h={110} label="SHELF + ITEMS" />
        <Shelf x={270} y={264} w={96} />

        {/* ── Row 3: Room ───────────────────────────────────── */}
        <text x={20} y={316} fontSize={9} fontFamily="monospace" fill={C.mid} letterSpacing={2}>ROOM</text>

        {/* Window */}
        <Card x={20} y={324} w={160} h={160} label="WINDOW" />
        <Window x={40} y={346} w={100} h={80} />

        {/* Wall segment */}
        <Card x={198} y={324} w={120} h={160} label="WALL" />
        <Wall x={218} y={340} h={120} />

        {/* Floor line */}
        <Card x={336} y={324} w={180} h={160} label="FLOOR LINE" />
        <g id="Floor">
          <Px x={346} y={452} w={160} h={P} fill={C.light} />
        </g>

        {/* ── Row 4: Cord states ────────────────────────────── */}
        <text x={20} y={514} fontSize={9} fontFamily="monospace" fill={C.mid} letterSpacing={2}>CORD STATES</text>

        {/* Cord resting (small curl) */}
        <Card x={20} y={522} w={140} h={100} label="CORD RESTING" />
        <g id="Cord-Resting">
          <Cord x1={60} y1={580} x2={80} y2={596} sag={8} />
        </g>

        {/* Cord mid-throw */}
        <Card x={178} y={522} w={340} h={100} label="CORD THROWN" />
        <g id="Cord-Thrown">
          <Cord x1={200} y1={590} x2={490} y2={574} sag={-40} />
        </g>

        {/* Cord plugged in */}
        <Card x={536} y={522} w={340} h={100} label="CORD PLUGGED IN" />
        <g id="Cord-Plugged">
          {(() => {
            const pts = cordCurve(556, 590, 830, 574, -15, 18);
            const points = pts.map(([x, y]) => `${x},${y}`).join(' ');
            return <polyline points={points} stroke={C.dark} strokeWidth={P} fill="none" strokeLinecap="square" />;
          })()}
          <Px x={826} y={570} w={8} h={8} fill={C.dark} />
        </g>

        {/* ── Row 5: Full scene composition ─────────────────── */}
        <text x={20} y={654} fontSize={9} fontFamily="monospace" fill={C.mid} letterSpacing={2}>FULL SCENE (LEVEL 1)</text>

        <Card x={20} y={662} w={880} h={108} label="SCENE COMPOSITION" />

        {/* Scaled-down full scene at 0.25× */}
        <g id="Full-Scene" transform="translate(30, 672) scale(0.75)">
          <rect width={640} height={80} fill={C.bg} />
          <Px x={0}   y={72} w={640} h={P} fill={C.light} />
          <Window x={300} y={0} w={80} h={60} />
          {/* wall */}
          <Px x={560} y={0} w={80} h={80} fill={C.wall} />
          <Px x={560} y={0} w={P}  h={80} fill={C.wallLight} />
          <Outlet cx={580} cy={40} />
          <Table x={40} y={52} w={140} h={10} />
          <Lamp cx={116} cy={50} lit={false} />
          <g id="Cord-Scene">
            <Cord x1={120} y1={44} x2={136} y2={58} sag={6} />
          </g>
        </g>
      </svg>
    </div>
  );
}
