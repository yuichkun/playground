import { Canvas, Object3DNode, useThree, useLoader, useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { Texture, Vector2 } from 'three';
import { useRef, useState, useEffect } from 'react';

// Define the shader material
const PixelizedImage = shaderMaterial(
  {
    uTexture: null,
    uResolution: null,
    uPixelSize: null,
    uTime: 0,
    uMouse: null,
  },
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    uniform sampler2D uTexture;
    varying vec2 vUv;
    uniform vec2 uResolution;
    uniform float uPixelSize;
    uniform float uTime;
    uniform vec2 uMouse;
    void main() {
      float pixelSize = uTime;
      vec2 steppedUv = floor(vUv * pixelSize) / pixelSize;
      // vec2 steppedUv = floor(vUv * uPixelSize) / uPixelSize;
      vec4 texColor = texture2D(uTexture, steppedUv);

      gl_FragColor = texColor;
    }
  `
);

extend({ PixelizedImage });

declare module '@react-three/fiber' {
  interface ThreeElements {
    pixelizedImage: Object3DNode<typeof PixelizedImage, InstanceType<typeof PixelizedImage>> & {
      uTexture?: Texture;
      uResolution?: Vector2;
      uPixelSize?: number;
      uTime?: number; 
      uMouse?: Vector2;
    };
  }
}

const ShaderPlane = () => {
  const { viewport } = useThree();
  const imageUrl = 'https://picsum.photos/512';
  const texture = useLoader(TextureLoader, imageUrl);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const materialRef = useRef<any>(null);
  const [mousePos, setMousePos] = useState(new Vector2(0, 0));
  
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePos(new Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      ));
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uMouse.value = mousePos;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <pixelizedImage
        ref={materialRef}
        uTexture={texture} 
        uResolution={new Vector2(viewport.width, viewport.height)} 
        uPixelSize={30}
        uMouse={mousePos} />
    </mesh>
  );
};

const App = () => (
  <Canvas orthographic style={{ width: '100vw', height: '100vh' }}>
    <ShaderPlane />
  </Canvas>
);

export default App;