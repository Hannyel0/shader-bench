"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { NoiseLibrary, NoiseType } from "../utils/Noiselibrary";

export interface DisplacementParams {
  noiseType: NoiseType;
  amplitude: number;
  frequency: number;
  octaves: number;
  lacunarity: number;
  gain: number;
  ridgeOffset: number;
  warpStrength: number;
  uvScale: number;
  animationSpeed: number;
  wireframe: boolean;
  subdivisions: number;
  visualizationMode: "solid" | "height" | "normal" | "wireframe";
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  avgFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  droppedFrames: number;
  totalFrames: number;
  gpuTime?: number;
  resolution: { width: number; height: number };
  pixelCount: number;
  triangleCount: number;
  drawCalls: number;
  geometryMemory: number;
}

interface DisplacementSphereProps {
  params: DisplacementParams;
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
}

const DisplacementSphere: React.FC<DisplacementSphereProps> = ({
  params,
  onPerformanceUpdate,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { gl, size } = useThree();

  // Performance tracking refs
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const frameTimesRef = useRef<number[]>([]);
  const lastUpdateTimeRef = useRef(performance.now());

  // Generate vertex shader based on noise type
  const vertexShader = useMemo(() => {
    const noiseFunction = getNoiseFunction(params.noiseType);

    return `
      ${NoiseLibrary.common}
      ${noiseFunction}

      uniform float uTime;
      uniform float uAmplitude;
      uniform float uFrequency;
      uniform int uOctaves;
      uniform float uLacunarity;
      uniform float uGain;
      uniform float uRidgeOffset;
      uniform float uWarpStrength;
      uniform float uUVScale;
      uniform float uAnimationSpeed;

      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vDisplacement;

      void main() {
        vec3 pos = position;
        vec3 objectNormal = normal;
        
        // Create animated position for noise sampling
        vec3 noisePos = pos * uFrequency * uUVScale + vec3(0.0, 0.0, uTime * uAnimationSpeed);
        
        // Calculate displacement based on noise type
        float displacement = ${getDisplacementCall(params.noiseType)};
        
        // Store displacement for fragment shader
        vDisplacement = displacement;
        
        // Apply displacement along normal
        pos += objectNormal * displacement * uAmplitude;
        
        // Calculate displaced normal for lighting
        float offset = 0.01;
        vec3 tangent = vec3(1.0, 0.0, 0.0);
        vec3 bitangent = cross(objectNormal, tangent);
        tangent = cross(bitangent, objectNormal);
        
        vec3 neighbour1 = position + tangent * offset;
        vec3 neighbour2 = position + bitangent * offset;
        
        vec3 noisePos1 = neighbour1 * uFrequency * uUVScale + vec3(0.0, 0.0, uTime * uAnimationSpeed);
        vec3 noisePos2 = neighbour2 * uFrequency * uUVScale + vec3(0.0, 0.0, uTime * uAnimationSpeed);
        
        float displacement1 = ${getDisplacementCall(
          params.noiseType,
          "noisePos1"
        )};
        float displacement2 = ${getDisplacementCall(
          params.noiseType,
          "noisePos2"
        )};
        
        neighbour1 += objectNormal * displacement1 * uAmplitude;
        neighbour2 += objectNormal * displacement2 * uAmplitude;
        
        vec3 displacedTangent = neighbour1 - pos;
        vec3 displacedBitangent = neighbour2 - pos;
        vec3 displacedNormal = normalize(cross(displacedTangent, displacedBitangent));
        
        vNormal = normalMatrix * displacedNormal;
        vPosition = pos;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;
  }, [params.noiseType]);

  // Fragment shader for coloring/visualization
  const fragmentShader = useMemo(() => {
    return `
      uniform vec3 uColor;
      uniform int uVisualizationMode; // 0: solid, 1: height, 2: normal, 3: wireframe
      
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vDisplacement;

      vec3 getHeightColor(float height) {
        // Create gradient from blue (low) to red (high)
        vec3 lowColor = vec3(0.0, 0.2, 0.8);
        vec3 midColor = vec3(0.2, 0.8, 0.2);
        vec3 highColor = vec3(0.8, 0.2, 0.0);
        
        float normalizedHeight = height * 0.5 + 0.5; // Map -1,1 to 0,1
        
        if(normalizedHeight < 0.5) {
          return mix(lowColor, midColor, normalizedHeight * 2.0);
        } else {
          return mix(midColor, highColor, (normalizedHeight - 0.5) * 2.0);
        }
      }

      void main() {
        vec3 finalColor;

        if(uVisualizationMode == 0) {
          // Solid color with basic lighting
          vec3 lightDir = normalize(vec3(5.0, 5.0, 5.0));
          float diff = max(dot(normalize(vNormal), lightDir), 0.0);
          float ambient = 0.3;
          finalColor = uColor * (ambient + diff * 0.7);
        } else if(uVisualizationMode == 1) {
          // Height-based coloring
          finalColor = getHeightColor(vDisplacement);
        } else if(uVisualizationMode == 2) {
          // Normal-based coloring
          finalColor = normalize(vNormal) * 0.5 + 0.5;
        } else {
          // Wireframe (handled by material wireframe property)
          finalColor = uColor;
        }

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;
  }, []);

  // Create shader material
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAmplitude: { value: params.amplitude },
      uFrequency: { value: params.frequency },
      uOctaves: { value: params.octaves },
      uLacunarity: { value: params.lacunarity },
      uGain: { value: params.gain },
      uRidgeOffset: { value: params.ridgeOffset },
      uWarpStrength: { value: params.warpStrength },
      uUVScale: { value: params.uvScale },
      uAnimationSpeed: { value: params.animationSpeed },
      uColor: { value: new THREE.Color(0x4a9eff) },
      uVisualizationMode: {
        value:
          params.visualizationMode === "solid"
            ? 0
            : params.visualizationMode === "height"
            ? 1
            : params.visualizationMode === "normal"
            ? 2
            : 3,
      },
    }),
    []
  );

  // Update uniforms when params change
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uAmplitude.value = params.amplitude;
      materialRef.current.uniforms.uFrequency.value = params.frequency;
      materialRef.current.uniforms.uOctaves.value = params.octaves;
      materialRef.current.uniforms.uLacunarity.value = params.lacunarity;
      materialRef.current.uniforms.uGain.value = params.gain;
      materialRef.current.uniforms.uRidgeOffset.value = params.ridgeOffset;
      materialRef.current.uniforms.uWarpStrength.value = params.warpStrength;
      materialRef.current.uniforms.uUVScale.value = params.uvScale;
      materialRef.current.uniforms.uAnimationSpeed.value =
        params.animationSpeed;
      materialRef.current.uniforms.uVisualizationMode.value =
        params.visualizationMode === "solid"
          ? 0
          : params.visualizationMode === "height"
          ? 1
          : params.visualizationMode === "normal"
          ? 2
          : 3;
      materialRef.current.wireframe = params.wireframe;
    }
  }, [params]);

  // Performance tracking with useFrame
  useFrame((state) => {
    const currentTime = performance.now();

    // Update shader time
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }

    // Performance metrics calculation
    frameCountRef.current++;
    const frameTime = currentTime - lastTimeRef.current;
    frameTimesRef.current.push(frameTime);

    // Keep only last 120 frames
    if (frameTimesRef.current.length > 120) {
      frameTimesRef.current.shift();
    }

    lastTimeRef.current = currentTime;

    // Update metrics every 10 frames (reduce overhead)
    if (frameCountRef.current % 10 === 0 && onPerformanceUpdate) {
      const avgFrameTime =
        frameTimesRef.current.reduce((sum, t) => sum + t, 0) /
        frameTimesRef.current.length;

      const fps = 1000 / avgFrameTime;
      const minFrameTime = Math.min(...frameTimesRef.current);
      const maxFrameTime = Math.max(...frameTimesRef.current);

      // Calculate dropped frames (frames that took > 20ms = below 50fps)
      const droppedFrames = frameTimesRef.current.filter((t) => t > 20).length;

      // Calculate triangle count
      const triangleCount = params.subdivisions * params.subdivisions * 2;

      // Get WebGL info
      const info = gl.info;
      const drawCalls = info.render.calls;

      // Estimate geometry memory (vertices * 3 floats * 4 bytes + indices)
      const vertexCount = (params.subdivisions + 1) * (params.subdivisions + 1);
      const geometryMemory = vertexCount * 3 * 4 * 3 + triangleCount * 3 * 2; // positions, normals, uvs + indices

      const metrics: PerformanceMetrics = {
        fps: Math.round(fps * 10) / 10,
        frameTime: Math.round(frameTime * 100) / 100,
        avgFrameTime: Math.round(avgFrameTime * 100) / 100,
        minFrameTime: Math.round(minFrameTime * 100) / 100,
        maxFrameTime: Math.round(maxFrameTime * 100) / 100,
        droppedFrames,
        totalFrames: frameCountRef.current,
        resolution: { width: size.width, height: size.height },
        pixelCount: size.width * size.height,
        triangleCount,
        drawCalls,
        geometryMemory,
      };

      onPerformanceUpdate(metrics);
      lastUpdateTimeRef.current = currentTime;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, params.subdivisions, params.subdivisions]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        wireframe={params.wireframe}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

interface DisplacementCanvasProps {
  params: DisplacementParams;
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
}

export const DisplacementCanvas: React.FC<DisplacementCanvasProps> = ({
  params,
  onPerformanceUpdate,
}) => {
  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        gl.setClearColor(0x0a0a0a, 1);
      }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={50} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        enablePan={false}
        minDistance={1.5}
        maxDistance={5}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />

      {/* Displacement Sphere */}
      <DisplacementSphere
        params={params}
        onPerformanceUpdate={onPerformanceUpdate}
      />

      {/* Grid Helper */}
      <gridHelper args={[10, 10, 0x444444, 0x222222]} position={[0, -1.5, 0]} />
    </Canvas>
  );
};

// Helper functions to generate shader code based on noise type
function getNoiseFunction(noiseType: NoiseType): string {
  switch (noiseType) {
    case "perlin":
      return NoiseLibrary.perlin;
    case "simplex":
      return NoiseLibrary.simplex;
    case "voronoi":
    case "voronoiF2":
    case "voronoiF2MinusF1":
      return NoiseLibrary.voronoi;
    case "fbmPerlin":
      return NoiseLibrary.perlin + "\n" + NoiseLibrary.fbm;
    case "fbmSimplex":
      return NoiseLibrary.simplex + "\n" + NoiseLibrary.fbm;
    case "turbulence":
      return NoiseLibrary.perlin + "\n" + NoiseLibrary.turbulence;
    case "ridge":
      return NoiseLibrary.perlin + "\n" + NoiseLibrary.ridge;
    case "domainWarp":
      return NoiseLibrary.perlin + "\n" + NoiseLibrary.domainWarp;
    case "cellular":
      return NoiseLibrary.cellular;
    default:
      return NoiseLibrary.perlin;
  }
}

function getDisplacementCall(
  noiseType: NoiseType,
  posVar: string = "noisePos"
): string {
  switch (noiseType) {
    case "perlin":
      return `perlinNoise(${posVar})`;
    case "simplex":
      return `simplexNoise(${posVar})`;
    case "voronoi":
      return `voronoiF1(${posVar})`;
    case "voronoiF2":
      return `voronoiF2(${posVar})`;
    case "voronoiF2MinusF1":
      return `voronoiF2MinusF1(${posVar})`;
    case "fbmPerlin":
      return `fbmPerlin(${posVar}, uOctaves, uLacunarity, uGain)`;
    case "fbmSimplex":
      return `fbmSimplex(${posVar}, uOctaves, uLacunarity, uGain)`;
    case "turbulence":
      return `turbulence(${posVar}, uOctaves, uLacunarity, uGain)`;
    case "ridge":
      return `ridgeNoise(${posVar}, uOctaves, uLacunarity, uGain, uRidgeOffset)`;
    case "domainWarp":
      return `domainWarpedNoise(${posVar}, uWarpStrength)`;
    case "cellular":
      return `cellularNoise(${posVar})`;
    default:
      return `perlinNoise(${posVar})`;
  }
}
