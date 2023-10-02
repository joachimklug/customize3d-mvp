import { OrbitControls } from "@react-three/drei";
import { Canvas, MeshProps, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import * as THREE from "three";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import "./App.css";

function App() {
  const svgRef = useRef<SVGElement>();
  const [stl, setStl] = useState("");
  const [svgImage, setSVGImage] = useState<string>(
    '<svg><use xlink:href="sprite.svg#glasses--wine"></use></svg>'
  );
  const [ssid, setSsid] = useState("");
  const [pwd, setPwd] = useState("");

  useEffect(() => {
    if (svgRef.current) {
      setSVGImage(svgRef.current.outerHTML);
    }
  }, [svgRef, ssid, setSVGImage]);

  return (
    <>
      <h1>Customize3d</h1>
      <form
        style={{
          display: "flex",
          flexDirection: "column",
          marginBottom: 2 * 8,
          gap: 4,
        }}
      >
        <label>
          SSID:
          <input
            type="text"
            value={ssid}
            onChange={(e) => setSsid(e.target.value)}
          />
        </label>
        <label>
          PWD:
          <input
            type="text"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />
        </label>
      </form>
      <div
        style={{
          height: "auto",
          margin: "0 auto",
          maxWidth: 64 * 3,
          width: "100%",
        }}
      >
        <QRCode
          size={256}
          ref={svgRef}
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          value={`WIFI:T:WPA;S:${ssid};P:${pwd};;`}
          viewBox={`0 0 256 256`}
          level="M"
        />
      </div>
      <div style={{ border: "1px solid white" }}>
        <Canvas
          style={{ width: 800, height: 600 }}
          camera={{ position: [0, 100, 100] }}
        >
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />

          <Plane
            mesh={{ position: [0, 1, 0] }}
            setStl={setStl}
            svg={svgImage}
          />
          {/* <QROverlay svg={svgImage} /> */}

          <OrbitControls />
          <gridHelper args={[150, 15]} />
          <axesHelper scale={10} />
        </Canvas>
      </div>
      <button onClick={() => console.log(stl)}>Click</button>
    </>
  );
}

interface QROverlayProps {
  svg: string;
}

function QROverlay({ svg }: QROverlayProps) {
  const background = /<path.*?fill="#FFFFFF"><\/path>/;
  const newSvg = svg.replace(background, "");

  // const scene = useThree((state) => state.scene);
  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(newSvg);
  const loader = new SVGLoader();

  const group = new THREE.Group();
  loader.load(url, function (data) {
    const paths = data.paths;
    // group.scale.y *= -1;

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];

      const material = new THREE.MeshBasicMaterial({
        color: "white",
        // color: path.color,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const shapes = SVGLoader.createShapes(path);

      for (let j = 0; j < shapes.length; j++) {
        const shape = shapes[j];
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: 1.2,
          bevelEnabled: false,
        });
        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);
      }
    }

    group.rotateX(Math.PI / 2);

    group.position.set(-40, 1.2 + 2, -40);
    const bb = new THREE.Box3().setFromObject(group);
    const size = bb.getSize(new THREE.Vector3());
    const position = bb.min;
    console.log(size);
    console.log(position);
    const scaleFactor = (90 - 10) / 25;
    group.scale.set(scaleFactor, scaleFactor, 1);

    // scene.add(group);
  });

  return <primitive object={group} />;
}

interface PlaneProps {
  mesh: MeshProps;
  setStl: (stl: string) => void;
  svg: string;
}

function Plane({ mesh, setStl, svg }: PlaneProps) {
  const scene = useThree((state) => state.scene);
  const exporter = new STLExporter();
  const stlExport = exporter.parse(scene, { binary: false });
  console.log(stlExport);

  // useEffect(() => {
  //   setStl(stlExport);
  // }, [stlExport, setStl, svg]);

  return (
    <group>
      <mesh {...mesh}>
        <boxGeometry args={[100, 2, 100]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <QROverlay svg={svg} />
    </group>
  );
}

export default App;
