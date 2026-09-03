import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, Environment, Lightformer, Text } from "@react-three/drei";
import * as THREE from "three";
import { playerHue } from "@/lib/game-utils";

export interface Marble3DState {
  name: string;
  /** 0 → 1 progression le long du toboggan */
  p: number;
  dead: boolean;
  /** temps écoulé depuis l'éjection (s) */
  deadFor: number;
}

const TURNS = 3.6;
const TOP_Y = 5.2;
const BOTTOM_Y = -4.4;
const R0 = 4.2;

function helix(p: number, out = new THREE.Vector3()) {
  const a = p * Math.PI * 2 * TURNS;
  const r = R0 * (1 - 0.84 * p);
  return out.set(Math.cos(a) * r, TOP_Y + (BOTTOM_Y - TOP_Y) * p, Math.sin(a) * r);
}

function helixCurve() {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 400; i++) pts.push(helix(i / 400));
  return new THREE.CatmullRomCurve3(pts);
}

/* ------------------------------------------------------------------ textures */

/** Nuage de poussière fibreux : sert de texture de paroi pour la tornade. */
function makeVortexTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 512, 512);
  // stries verticales douces
  for (let i = 0; i < 320; i++) {
    const x = Math.random() * 512;
    const w = 2 + Math.random() * 26;
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    const a = 0.05 + Math.random() * 0.4;
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.5, `rgba(255,255,255,${a})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    const y = Math.random() * 512;
    const h = 60 + Math.random() * 452;
    ctx.fillRect(x, y, w, h);
  }
  // grain
  const img = ctx.getImageData(0, 0, 512, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 42;
    img.data[i] = Math.max(0, Math.min(255, img.data[i]! + n));
    img.data[i + 1] = img.data[i]!;
    img.data[i + 2] = img.data[i]!;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Sol : terre craquelée + anneaux de vent. */
function makeGroundTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#2b2436";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const s = Math.random() * 3.4;
    ctx.fillStyle = `rgba(${120 + Math.random() * 70},${100 + Math.random() * 60},${150 + Math.random() * 70},${0.05 + Math.random() * 0.16})`;
    ctx.fillRect(x, y, s, s);
  }
  ctx.strokeStyle = "rgba(20,14,30,0.55)";
  for (let i = 0; i < 60; i++) {
    ctx.beginPath();
    ctx.lineWidth = 0.6 + Math.random();
    let x = Math.random() * 512;
    let y = Math.random() * 512;
    ctx.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      x += (Math.random() - 0.5) * 90;
      y += (Math.random() - 0.5) * 90;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ------------------------------------------------------------------ tornade */

function Tornado() {
  const tex = useMemo(makeVortexTexture, []);
  const layers = useMemo(
    () => [
      { top: 13, bottom: 1.5, h: 17, y: 3.2, op: 0.3, spin: 1.5, rep: [4, 2] as const, color: "#cbb7e8" },
      { top: 10, bottom: 1.1, h: 16, y: 2.6, op: 0.36, spin: -2.1, rep: [6, 2] as const, color: "#e6d9ff" },
      { top: 7.4, bottom: 0.8, h: 15, y: 2.2, op: 0.42, spin: 3.1, rep: [9, 3] as const, color: "#f3ecff" },
      { top: 4.6, bottom: 0.5, h: 14, y: 1.9, op: 0.5, spin: -4.4, rep: [12, 3] as const, color: "#ffffff" },
    ],
    [],
  );
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useMemo(
    () =>
      layers.map((l) => {
        const t = tex.clone();
        t.needsUpdate = true;
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(l.rep[0], l.rep[1]);
        return new THREE.MeshBasicMaterial({
          map: t,
          alphaMap: t,
          color: new THREE.Color(l.color),
          transparent: true,
          opacity: l.op,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        });
      }),
    [layers, tex],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    layers.forEach((l, i) => {
      const m = refs.current[i];
      if (m) m.rotation.y += l.spin * dt * 0.5;
      const map = mats[i]!.map!;
      map.offset.y -= dt * (0.35 + i * 0.22);
      map.offset.x += dt * 0.06 * l.spin;
    });
  });

  return (
    <group>
      {layers.map((l, i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m;
          }}
          position={[0, l.y, 0]}
          material={mats[i]!}
        >
          <cylinderGeometry args={[l.top, l.bottom, l.h, 96, 1, true]} />
        </mesh>
      ))}
      {/* halo de débris au sol */}
      <mesh position={[0, BOTTOM_Y - 1.3, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.6, 7.5, 96]} />
        <meshBasicMaterial
          color="#b79ce6"
          transparent
          opacity={0.16}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/** Poussière et débris aspirés en spirale. */
function Dust({ count = 2200 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const data = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seedArr = new Float32Array(count * 3); // radius, speed, phase
    for (let i = 0; i < count; i++) {
      const r = 0.8 + Math.pow(Math.random(), 0.6) * 11;
      const phase = Math.random() * Math.PI * 2;
      seedArr[i * 3] = r;
      seedArr[i * 3 + 1] = 0.5 + Math.random() * 1.7;
      seedArr[i * 3 + 2] = phase;
      pos[i * 3] = Math.cos(phase) * r;
      pos[i * 3 + 1] = -5 + Math.random() * 16;
      pos[i * 3 + 2] = Math.sin(phase) * r;
    }
    return { pos, seedArr };
  }, [count]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const g = ref.current;
    if (!g) return;
    const p = g.geometry.attributes["position"] as THREE.BufferAttribute;
    const arr = p.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const base = i * 3;
      const r0 = data.seedArr[base]!;
      const spd = data.seedArr[base + 1]!;
      let y = arr[base + 1]! + dt * spd * 2.4;
      if (y > 11) y = -5;
      arr[base + 1] = y;
      // rayon décroissant vers le bas, rotation rapide
      const h = (y + 5) / 16;
      const r = 0.5 + r0 * (0.18 + h * 0.86);
      const a = Math.atan2(arr[base + 2]!, arr[base]!) + dt * (2.6 / (0.4 + r * 0.22)) * spd;
      arr[base] = Math.cos(a) * r;
      arr[base + 2] = Math.sin(a) * r;
    }
    p.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.07}
        color="#e8dcff"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ décor */

function Ground() {
  const tex = useMemo(makeGroundTexture, []);
  return (
    <group position={[0, BOTTOM_Y - 1.35, 0]}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[46, 96]} />
        <meshStandardMaterial map={tex} color="#6a5b86" roughness={0.95} metalness={0.05} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[0, 0.02 + i * 0.001, 0]}>
          <ringGeometry args={[9 + i * 5, 9.25 + i * 5, 128]} />
          <meshBasicMaterial color="#8f77c4" transparent opacity={0.14} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/** Rampe hélicoïdale ouverte (ruban) + rebord extérieur. */
function ramp(width: number, wallHeight: number) {
  const SEG = 460;
  const floor: number[] = [];
  const wall: number[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const radial = new THREE.Vector3();
  for (let i = 0; i < SEG; i++) {
    helix(i / SEG, a);
    helix((i + 1) / SEG, b);
    const quad = (p: THREE.Vector3, dy: number) => {
      radial.set(p.x, 0, p.z).normalize();
      return [
        p.x - radial.x * width * 0.5,
        p.y + dy,
        p.z - radial.z * width * 0.5,
        p.x + radial.x * width * 0.5,
        p.y + dy,
        p.z + radial.z * width * 0.5,
      ];
    };
    const [ai0, ai1, ai2, ao0, ao1, ao2] = quad(a, 0) as number[];
    const [bi0, bi1, bi2, bo0, bo1, bo2] = quad(b, 0) as number[];
    floor.push(ai0!, ai1!, ai2!, ao0!, ao1!, ao2!, bo0!, bo1!, bo2!);
    floor.push(ai0!, ai1!, ai2!, bo0!, bo1!, bo2!, bi0!, bi1!, bi2!);
    wall.push(ao0!, ao1!, ao2!, ao0!, ao1! + wallHeight, ao2!, bo0!, bo1! + wallHeight, bo2!);
    wall.push(ao0!, ao1!, ao2!, bo0!, bo1! + wallHeight, bo2!, bo0!, bo1!, bo2!);
  }
  const make = (arr: number[]) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    g.computeVertexNormals();
    return g;
  };
  return { floor: make(floor), wall: make(wall) };
}

function Track() {
  const { floor, wall } = useMemo(() => ramp(1.7, 0.5), []);
  const edge = useMemo(() => new THREE.TubeGeometry(helixCurve(), 460, 0.055, 6, false), []);
  return (
    <group>
      <mesh geometry={floor} receiveShadow castShadow>
        <meshStandardMaterial
          color="#3b3350"
          emissive="#1a1030"
          emissiveIntensity={0.4}
          metalness={0.65}
          roughness={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={wall}>
        <meshStandardMaterial
          color="#7b45c8"
          emissive="#a865ff"
          emissiveIntensity={1.1}
          metalness={0.4}
          roughness={0.3}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={edge}>
        <meshBasicMaterial color="#f0d6ff" />
      </mesh>
    </group>
  );
}

function Goal() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.08;
    ref.current?.scale.set(s, s, s);
  });
  return (
    <group position={[0, BOTTOM_Y - 0.95, 0]}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.8, 40, 40]} />
        <meshStandardMaterial
          color="#ffd15c"
          emissive="#ffb400"
          emissiveIntensity={2.6}
          roughness={0.15}
          metalness={0.5}
        />
      </mesh>
      <pointLight color="#ffc95c" intensity={28} distance={12} />
    </group>
  );
}

/* ------------------------------------------------------------------ billes */

/** Pseudo affiché au-dessus de la bille, dessiné dans un canvas 2D (aucune police réseau). */
function NameTag({ name, lead, y, hue }: { name: string; lead: boolean; y: number; hue: number }) {
  const texture = useMemo(() => {
    const label = lead ? `★ ${name}` : name;
    const scale = 3;
    const font = `bold ${22 * scale}px ui-monospace, Menlo, monospace`;
    const probe = document.createElement("canvas").getContext("2d")!;
    probe.font = font;
    const w = Math.ceil(probe.measureText(label).width) + 26 * scale;
    const h = 38 * scale;
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext("2d")!;
    const rad = 14 * scale;
    ctx.beginPath();
    ctx.roundRect(scale, scale, w - 2 * scale, h - 2 * scale, rad);
    ctx.fillStyle = "rgba(12,8,22,0.78)";
    ctx.fill();
    ctx.lineWidth = 2 * scale;
    ctx.strokeStyle = lead ? "rgba(255,214,120,0.95)" : `hsla(${hue}, 85%, 72%, 0.8)`;
    ctx.stroke();
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = lead ? "#ffe6a3" : "#ffffff";
    ctx.fillText(label, w / 2, h / 2 + scale);
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    return tex;
  }, [name, lead, hue]);

  const aspect = texture.image.width / texture.image.height;
  const height = 0.3;

  return (
    <sprite position={[0, y, 0]} scale={[height * aspect, height, 1]}>
      <spriteMaterial map={texture} transparent depthTest={false} toneMapped={false} />
    </sprite>
  );
}



function Marble({ state, rank }: { state: Marble3DState; rank: number }) {
  const ref = useRef<THREE.Group>(null);
  const hue = playerHue(state.name);
  const color = useMemo(() => new THREE.Color().setHSL(hue / 360, 0.85, 0.6), [hue]);
  const vec = useMemo(() => new THREE.Vector3(), []);
  const lead = rank === 1;

  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    helix(Math.min(state.p, 1), vec);
    const wobble = Math.sin(clock.elapsedTime * 6 + hue) * 0.22;
    if (state.dead) {
      const d = state.deadFor;
      // aspirée par la tornade : spirale ascendante
      const a = clock.elapsedTime * 4 + hue;
      const r = Math.max(0.4, 3.6 - d * 0.8);
      g.position.set(Math.cos(a) * r, vec.y + d * 3.4, Math.sin(a) * r);
      g.scale.setScalar(Math.max(0.001, 1 - d * 0.12));
    } else {
      g.position.set(vec.x + wobble * 0.3, vec.y + 0.34 + wobble * 0.05, vec.z + wobble * 0.3);
    }
    g.rotation.x += 0.16;
    g.rotation.y += 0.1;
  });

  const r = lead ? 0.34 : 0.28;

  return (
    <group ref={ref}>
      <mesh castShadow>
        <sphereGeometry args={[r, 32, 32]} />
        <meshStandardMaterial
          color={state.dead ? "#4b4b55" : color}
          emissive={state.dead ? "#000000" : color}
          emissiveIntensity={state.dead ? 0 : lead ? 1.6 : 0.9}
          metalness={0.85}
          roughness={0.08}
        />
      </mesh>
      {!state.dead && <NameTag name={state.name} lead={lead} y={r + 0.55} hue={hue} />}


    </group>
  );
}

function Rig() {
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime * 0.13;
    const d = 15 + Math.sin(t * 0.9) * 2.2;
    camera.position.set(Math.sin(t) * d, 4.2 + Math.sin(t * 0.6) * 2.4, Math.cos(t) * d);
    camera.lookAt(0, 0.4, 0);
  });
  return null;
}

export default function MarbleDrop3D({
  marbles,
  ranks,
}: {
  marbles: Marble3DState[];
  /** nom → rang temps réel (1 = leader) */
  ranks: Record<string, number>;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 5, 16], fov: 50 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#0a0714"]} />
      <fog attach="fog" args={["#150c26", 22, 62]} />
      <ambientLight intensity={0.5} />
      <hemisphereLight args={["#b79ce6", "#241a33", 0.7]} />
      <directionalLight
        position={[10, 16, 8]}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-8, 3, -6]} color="#8a3ffb" intensity={40} distance={30} />
      <Environment>
        <Lightformer intensity={2} position={[0, 9, 0]} scale={[16, 16, 1]} />
        <Lightformer
          intensity={1.1}
          color="#b06bff"
          position={[-8, 2, -3]}
          rotation-y={Math.PI / 2}
          scale={[22, 4, 1]}
        />
      </Environment>
      <Rig />
      <Ground />
      <Tornado />
      <Dust />
      <Track />
      <Goal />
      {marbles.map((m) => (
        <Marble key={m.name} state={m} rank={ranks[m.name] ?? 99} />
      ))}
    </Canvas>
  );
}
