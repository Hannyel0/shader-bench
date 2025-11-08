"use client";

import React, {
  useRef,
  useMemo,
  useCallback,
  useImperativeHandle,
  useEffect,
} from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { NoiseLibrary, NoiseType } from "../../utils/Noiselibrary";
import {
  SceneObject,
  GeometryType,
  geometryCache,
  getObjectById,
  getWorldTransform,
} from "./SceneManager";

interface TransformableObjectProps {
  object: SceneObject;
  allObjects: SceneObject[];
  isSelected: boolean;
  onSelect: (id: string) => void;
  onTransformChange?: (
    id: string,
    transform: Partial<SceneObject["transform"]>
  ) => void;
}

export const TransformableObject = React.forwardRef<
  THREE.Group,
  TransformableObjectProps
>(({ object, allObjects, isSelected, onSelect }, forwardedRef) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const standardMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Expose GROUP ref to parent for transform controls
  useImperativeHandle(forwardedRef, () => groupRef.current!);

  const { displacement, transform, type, visible, parentId } = object;
  const hasDisplacement = !!displacement;

  // Calculate world transform for rendering
  const worldTransform = useMemo(() => {
    if (!parentId) {
      return transform;
    }
    // In production, you'd use THREE.Matrix4 for proper hierarchical transforms
    // For now, we apply local transforms and let Three.js handle the hierarchy
    return transform;
  }, [transform, parentId, allObjects]);

  // Generate vertex shader based on noise type
  const vertexShader = useMemo(() => {
    if (!hasDisplacement || !displacement) return null;

    const noiseFunction = getNoiseFunction(displacement.noiseType);

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
        
        vec3 noisePos = pos * uFrequency * uUVScale + vec3(0.0, 0.0, uTime * uAnimationSpeed);
        
        float displacement = ${getDisplacementCall(displacement.noiseType)};
        vDisplacement = displacement;
        
        pos += objectNormal * displacement * uAmplitude;
        
        float offset = 0.01;
        vec3 tangent = vec3(1.0, 0.0, 0.0);
        vec3 bitangent = cross(objectNormal, tangent);
        tangent = cross(bitangent, objectNormal);
        
        vec3 neighbour1 = position + tangent * offset;
        vec3 neighbour2 = position + bitangent * offset;
        
        vec3 noisePos1 = neighbour1 * uFrequency * uUVScale + vec3(0.0, 0.0, uTime * uAnimationSpeed);
        vec3 noisePos2 = neighbour2 * uFrequency * uUVScale + vec3(0.0, 0.0, uTime * uAnimationSpeed);
        
        float displacement1 = ${getDisplacementCall(
          displacement.noiseType,
          "noisePos1"
        )};
        float displacement2 = ${getDisplacementCall(
          displacement.noiseType,
          "noisePos2"
        )};
        
        neighbour1 += objectNormal * displacement1 * uAmplitude;
        neighbour2 += objectNormal * displacement2 * uAmplitude;
        
        vec3 displacedTangent = neighbour1 - pos;
        vec3 displacedBitangent = neighbour2 - pos;
        vec3 displacedNormal = normalize(cross(displacedTangent, displacedBitangent));
        
        vNormal = normalMatrix * displacedNormal;
        vPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;
  }, [hasDisplacement, displacement?.noiseType]);

  // Fragment shader
  const fragmentShader = useMemo(() => {
    if (!hasDisplacement) return null;

    return `
      uniform vec3 uColor;
      uniform int uVisualizationMode;
      uniform float uRoughness;

      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vDisplacement;

      vec3 getHeightColor(float height) {
        vec3 lowColor = vec3(0.0, 0.2, 0.8);
        vec3 midColor = vec3(0.2, 0.8, 0.2);
        vec3 highColor = vec3(0.8, 0.2, 0.0);

        float normalizedHeight = height * 0.5 + 0.5;

        if(normalizedHeight < 0.5) {
          return mix(lowColor, midColor, normalizedHeight * 2.0);
        } else {
          return mix(midColor, highColor, (normalizedHeight - 0.5) * 2.0);
        }
      }

      void main() {
        vec3 finalColor;

        if(uVisualizationMode == 0) {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(cameraPosition - vPosition);
          vec3 lightDir = normalize(vec3(5.0, 5.0, 5.0));

          float diff = max(dot(normal, lightDir), 0.0);

          vec3 halfDir = normalize(lightDir + viewDir);
          float specAngle = max(dot(normal, halfDir), 0.0);

          float shininess = mix(256.0, 4.0, uRoughness);
          float spec = pow(specAngle, shininess);

          float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
          spec = mix(spec, spec * 2.0, fresnel * (1.0 - uRoughness));

          float ambient = 0.3;
          vec3 diffuseColor = uColor * (ambient + diff * 0.7);
          vec3 specularColor = vec3(1.0) * spec * (1.0 - uRoughness * 0.7);

          finalColor = diffuseColor + specularColor;
        } else if(uVisualizationMode == 1) {
          finalColor = getHeightColor(vDisplacement);
        } else if(uVisualizationMode == 2) {
          finalColor = normalize(vNormal) * 0.5 + 0.5;
        } else {
          finalColor = uColor;
        }

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;
  }, [hasDisplacement]);

  // Create shader uniforms
  const uniforms = useMemo(() => {
    if (!hasDisplacement || !displacement) return null;

    return {
      uTime: { value: 0 },
      uAmplitude: { value: displacement.amplitude },
      uFrequency: { value: displacement.frequency },
      uOctaves: { value: displacement.octaves },
      uLacunarity: { value: displacement.lacunarity },
      uGain: { value: displacement.gain },
      uRidgeOffset: { value: displacement.ridgeOffset },
      uWarpStrength: { value: displacement.warpStrength },
      uUVScale: { value: displacement.uvScale },
      uAnimationSpeed: { value: displacement.animationSpeed },
      uColor: { value: new THREE.Color(object.material.color) },
      uVisualizationMode: {
        value:
          displacement.visualizationMode === "solid"
            ? 0
            : displacement.visualizationMode === "height"
            ? 1
            : displacement.visualizationMode === "normal"
            ? 2
            : 3,
      },
      uRoughness: { value: object.material.roughness },
    };
  }, [hasDisplacement, object.id]);

  // Update uniforms efficiently
  React.useEffect(() => {
    if (materialRef.current && hasDisplacement && displacement) {
      const mat = materialRef.current;
      mat.uniforms.uAmplitude.value = displacement.amplitude;
      mat.uniforms.uFrequency.value = displacement.frequency;
      mat.uniforms.uOctaves.value = displacement.octaves;
      mat.uniforms.uLacunarity.value = displacement.lacunarity;
      mat.uniforms.uGain.value = displacement.gain;
      mat.uniforms.uRidgeOffset.value = displacement.ridgeOffset;
      mat.uniforms.uWarpStrength.value = displacement.warpStrength;
      mat.uniforms.uUVScale.value = displacement.uvScale;
      mat.uniforms.uAnimationSpeed.value = displacement.animationSpeed;
      mat.uniforms.uVisualizationMode.value =
        displacement.visualizationMode === "solid"
          ? 0
          : displacement.visualizationMode === "height"
          ? 1
          : displacement.visualizationMode === "normal"
          ? 2
          : 3;
      mat.uniforms.uColor.value.set(object.material.color);
      mat.uniforms.uRoughness.value = object.material.roughness;
      mat.wireframe = displacement.wireframe;
    }
  }, [hasDisplacement, displacement, object.material]);

  // Update standard material
  React.useEffect(() => {
    if (standardMaterialRef.current && !hasDisplacement) {
      const mat = standardMaterialRef.current;
      mat.color.set(object.material.color);
      mat.roughness = object.material.roughness;
      mat.metalness = object.material.metalness;
      mat.opacity = object.material.opacity;
      mat.emissiveIntensity = object.material.emissiveIntensity;
      mat.transparent = object.material.opacity < 1;
    }
  }, [hasDisplacement, object.material]);

  // Animate shader time
  useFrame((state) => {
    if (materialRef.current && hasDisplacement) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  // Handle click for selection
  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      onSelect(object.id);
    },
    [object.id, onSelect]
  );

  // Get or create cached geometry
  const geometry = useMemo(() => {
    const subdivisions = displacement?.subdivisions || 32;
    let geo = geometryCache.get(type, subdivisions);

    if (!geo) {
      geo = createGeometry(type, subdivisions);
      geometryCache.set(type, subdivisions, geo);
    }

    return geo;
  }, [type, displacement?.subdivisions]);

  // Render children recursively
  const children = useMemo(() => {
    return allObjects.filter((obj) => obj.parentId === object.id);
  }, [allObjects, object.id]);

  if (!visible) return null;

  return (
    <group
      ref={groupRef}
      position={worldTransform.position}
      rotation={worldTransform.rotation}
      scale={worldTransform.scale}
    >
      {/* Selection Outline - Rendered first (behind) */}
      {isSelected && (
        <mesh
          geometry={geometry}
          scale={1.01}
          renderOrder={-1}
        >
          <meshBasicMaterial
            color="#ffff00"
            side={THREE.BackSide}
            transparent
            opacity={0.5}
          />
        </mesh>
      )}

      {/* Main mesh */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        onClick={handleClick}
        renderOrder={0}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        {hasDisplacement && displacement ? (
          <shaderMaterial
            key={`${object.id}-${displacement.noiseType}`}
            ref={materialRef}
            vertexShader={vertexShader!}
            fragmentShader={fragmentShader!}
            uniforms={uniforms!}
            wireframe={displacement.wireframe}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshStandardMaterial
            ref={standardMaterialRef}
            color={object.material.color}
            roughness={object.material.roughness}
            metalness={object.material.metalness}
            transparent={object.material.opacity < 1}
            opacity={object.material.opacity}
            emissiveIntensity={object.material.emissiveIntensity}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>

      {/* Render children recursively */}
      {children.map((child) => (
        <TransformableObject
          key={child.id}
          object={child}
          allObjects={allObjects}
          isSelected={child.id === object.id}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
});

TransformableObject.displayName = "TransformableObject";

// Helper: Create geometry based on type
function createGeometry(
  type: GeometryType,
  subdivisions: number
): THREE.BufferGeometry {
  switch (type) {
    case "sphere":
      return new THREE.SphereGeometry(1, subdivisions, subdivisions);
    case "plane":
      return new THREE.PlaneGeometry(2, 2, subdivisions, subdivisions);
    case "box":
      return new THREE.BoxGeometry(
        2,
        2,
        2,
        subdivisions,
        subdivisions,
        subdivisions
      );
    case "torus":
      return new THREE.TorusGeometry(1, 0.4, subdivisions, subdivisions);
    case "cylinder":
      return new THREE.CylinderGeometry(1, 1, 2, subdivisions, subdivisions);
    default:
      return new THREE.SphereGeometry(1, subdivisions, subdivisions);
  }
}

// Helper functions for shader generation
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
