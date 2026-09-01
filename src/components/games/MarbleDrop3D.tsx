import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Html, Lightformer } from "@react-three/drei";
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
const TOP_Y = 4.4;
const BOTTOM_Y = -3.6;
const R0 = 3.5;

function helix(p: number, out = new THREE.Vector3()) {
  const a = p * Math.PI * 2 * TURNS;
  const r = R0 * (1 - 0.84 * p);
  return out.set(Math.cos(a) * r, TOP_Y + (BOTTOM_Y - TOP_Y) * p, Math.sin(a) * r);
}

/** Rampe hélicoïdale ouverte (ruban) + rebord extérieur : les billes restent visibles. */
function ramp(width: number, wallHeight: number) {
  const SEG = 420;
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
    // rebord extérieur
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
  const { floor, wall } = useMemo(() => ramp(1.5, 0.42), []);
  const edge = useMemo(() => new THREE.TubeGeometry(helixCurve(), 420, 0.05, 6, false), []);
  return (
    <group>
      <mesh geometry={floor} receiveShadow>
        <meshStandardMaterial
          color="#5a3f86"
          metalness={0.35}
          roughness={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={wall}>
        <meshStandardMaterial
          color="#8a4dd6"
          emissive="#b06bff"
          emissiveIntensity={0.6}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={edge}>
        <meshBasicMaterial color="#e6b3ff" />
      </mesh>
    </group>
  );
}

function helixCurve() {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 400; i++) pts.push(helix(i / 400));
  return new THREE.CatmullRomCurve3(pts);
}


function Goal() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.08;
    ref.current?.scale.set(s, s, s);
  });
  return (
    <group position={[0, BOTTOM_Y - 0.9, 0]}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.75, 32, 32]} />
        <meshStandardMaterial
          color="#ffd15c"
          emissive="#ffb400"
          emissiveIntensity={2.4}
          roughness={0.2}
        />
      </mesh>
      <pointLight color="#ffc95c" intensity={22} distance={9} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.75, 0]}>
        <ringGeometry args={[0.9, 2.6, 64]} />
        <meshBasicMaterial color="#ffc95c" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Marble({ state, leader }: { state: Marble3DState; leader: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const color = useMemo(
    () => new THREE.Color().setHSL(playerHue(state.name) / 360, 0.85, 0.62),
    [state.name],
  );
  const vec = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    helix(Math.min(state.p, 1), vec);
    const wobble = Math.sin(clock.elapsedTime * 6 + playerHue(state.name)) * 0.22;
    if (state.dead) {
      const d = state.deadFor;
      const push = 1 + d * 5;
      g.position.set(vec.x * push, vec.y + d * 2 - d * d * 6.5, vec.z * push);
    } else {
      g.position.set(vec.x + wobble * 0.3, vec.y + wobble * 0.1, vec.z + wobble * 0.3);
    }
    g.rotation.x += 0.14;
    g.rotation.y += 0.09;
  });

  return (
    <group ref={ref}>
      <mesh castShadow>
        <sphereGeometry args={[leader ? 0.3 : 0.24, 24, 24]} />
        <meshStandardMaterial
          color={state.dead ? "#4b4b55" : color}
          emissive={state.dead ? "#000000" : color}
          emissiveIntensity={state.dead ? 0 : leader ? 2.2 : 1.35}
          metalness={0.4}
          roughness={0.12}
        />
      </mesh>
      {leader && !state.dead && (
        <Html center distanceFactor={9} zIndexRange={[10, 0]}>
          <span className="whitespace-nowrap rounded-full border border-gold/60 bg-background/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-gold backdrop-blur">
            {state.name}
          </span>
        </Html>
      )}
    </group>
  );
}

function Rig() {
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime * 0.16;
    camera.position.set(Math.sin(t) * 11.5, 3.6 + Math.sin(t * 0.7) * 1.2, Math.cos(t) * 11.5);
    camera.lookAt(0, 0.2, 0);
  });
  return null;
}

export default function MarbleDrop3D({
  marbles,
  leader,
}: {
  marbles: Marble3DState[];
  leader?: string | undefined;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 4, 12], fov: 52 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#0b0716"]} />
      <fog attach="fog" args={["#0b0716", 14, 32]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 10, 6]} intensity={1.3} castShadow />
      <pointLight position={[-6, 2, -4]} color="#8a3ffb" intensity={30} distance={22} />
      <Environment>
        <Lightformer intensity={1.6} position={[0, 6, 0]} scale={[12, 12, 1]} />
        <Lightformer
          intensity={1}
          color="#b06bff"
          position={[-6, 1, -2]}
          rotation-y={Math.PI / 2}
          scale={[18, 3, 1]}
        />
      </Environment>
      <Rig />
      <Track />
      <Goal />
      {marbles.map((m) => (
        <Marble key={m.name} state={m} leader={m.name === leader} />
      ))}
    </Canvas>
  );
}
