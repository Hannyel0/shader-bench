/**
 * Scene Object Management
 * Handles multi-object state, selection, and CRUD operations
 */

import * as THREE from "three";

export type GeometryType = "sphere" | "plane" | "box" | "torus" | "cylinder";

export interface DisplacementParams {
  noiseType: "perlin" | "simplex" | "voronoi" | "voronoiF2" | "voronoiF2MinusF1" | "fbmPerlin" | "fbmSimplex" | "turbulence" | "ridge" | "domainWarp" | "cellular";
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
  roughness: number;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  avgFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  droppedFrames: number;
  totalFrames: number;
  resolution: { width: number; height: number };
  pixelCount: number;
  triangleCount: number;
  drawCalls: number;
  geometryMemory: number;
}

export interface MaterialProperties {
  color: string;
  roughness: number;
  metalness: number;
  opacity: number;
  emissiveIntensity: number;
}

export interface SceneObject {
  id: string;
  name: string;
  type: GeometryType;
  displacement: DisplacementParams;
  material: MaterialProperties;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  visible: boolean;
}

export interface SceneState {
  objects: SceneObject[];
  selectedId: string | null;
}

// Geometry cache for performance - reuse geometries with same subdivisions
class GeometryCache {
  private cache = new Map<string, THREE.BufferGeometry>();

  getCacheKey(type: GeometryType, subdivisions: number): string {
    return `${type}-${subdivisions}`;
  }

  get(type: GeometryType, subdivisions: number): THREE.BufferGeometry | null {
    const key = this.getCacheKey(type, subdivisions);
    return this.cache.get(key) || null;
  }

  set(
    type: GeometryType,
    subdivisions: number,
    geometry: THREE.BufferGeometry
  ): void {
    const key = this.getCacheKey(type, subdivisions);
    this.cache.set(key, geometry);
  }

  clear(): void {
    this.cache.forEach((geo) => geo.dispose());
    this.cache.clear();
  }
}

export const geometryCache = new GeometryCache();

// Generate unique IDs for objects
export function generateObjectId(): string {
  return `object-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create default material properties for new objects
export function createDefaultMaterial(): MaterialProperties {
  return {
    color: "#4a9eff",
    roughness: 0.5,
    metalness: 0.0,
    opacity: 1.0,
    emissiveIntensity: 0.0,
  };
}

// Create default displacement params for new objects
export function createDefaultDisplacementParams(): DisplacementParams {
  return {
    noiseType: "perlin",
    amplitude: 0.5,
    frequency: 1.0,
    octaves: 4,
    lacunarity: 2.0,
    gain: 0.5,
    ridgeOffset: 1.0,
    warpStrength: 0.5,
    uvScale: 1.0,
    animationSpeed: 0.5,
    wireframe: false,
    subdivisions: 128,
    visualizationMode: "solid",
    roughness: 0.5,
  };
}

// Factory function for creating new scene objects
export function createSceneObject(
  type: GeometryType,
  position: [number, number, number] = [0, 0, 0]
): SceneObject {
  return {
    id: generateObjectId(),
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${
      Date.now() % 1000
    }`,
    type,
    displacement: createDefaultDisplacementParams(),
    material: createDefaultMaterial(),
    transform: {
      position,
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    visible: true,
  };
}

// Scene reducer actions
export type SceneAction =
  | { type: "ADD_OBJECT"; object: SceneObject }
  | { type: "REMOVE_OBJECT"; id: string }
  | { type: "SELECT_OBJECT"; id: string | null }
  | { type: "UPDATE_OBJECT"; id: string; updates: Partial<SceneObject> }
  | {
      type: "UPDATE_DISPLACEMENT";
      id: string;
      displacement: Partial<DisplacementParams>;
    }
  | {
      type: "UPDATE_TRANSFORM";
      id: string;
      transform: Partial<SceneObject["transform"]>;
    }
  | {
      type: "UPDATE_MATERIAL";
      id: string;
      material: Partial<MaterialProperties>;
    }
  | { type: "DUPLICATE_OBJECT"; id: string }
  | { type: "TOGGLE_VISIBILITY"; id: string }
  | { type: "CLEAR_SCENE" };

// Scene state reducer
export function sceneReducer(
  state: SceneState,
  action: SceneAction
): SceneState {
  switch (action.type) {
    case "ADD_OBJECT":
      return {
        ...state,
        objects: [...state.objects, action.object],
        selectedId: action.object.id,
      };

    case "REMOVE_OBJECT":
      return {
        ...state,
        objects: state.objects.filter((obj) => obj.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      };

    case "SELECT_OBJECT":
      return {
        ...state,
        selectedId: action.id,
      };

    case "UPDATE_OBJECT":
      return {
        ...state,
        objects: state.objects.map((obj) =>
          obj.id === action.id ? { ...obj, ...action.updates } : obj
        ),
      };

    case "UPDATE_DISPLACEMENT":
      return {
        ...state,
        objects: state.objects.map((obj) =>
          obj.id === action.id
            ? {
                ...obj,
                displacement: { ...obj.displacement, ...action.displacement },
              }
            : obj
        ),
      };

    case "UPDATE_TRANSFORM":
      return {
        ...state,
        objects: state.objects.map((obj) =>
          obj.id === action.id
            ? {
                ...obj,
                transform: { ...obj.transform, ...action.transform },
              }
            : obj
        ),
      };

    case "UPDATE_MATERIAL":
      return {
        ...state,
        objects: state.objects.map((obj) =>
          obj.id === action.id
            ? {
                ...obj,
                material: { ...obj.material, ...action.material },
              }
            : obj
        ),
      };

    case "DUPLICATE_OBJECT": {
      const objToDuplicate = state.objects.find((obj) => obj.id === action.id);
      if (!objToDuplicate) return state;

      const duplicated: SceneObject = {
        ...objToDuplicate,
        id: generateObjectId(),
        name: `${objToDuplicate.name} Copy`,
        transform: {
          ...objToDuplicate.transform,
          position: [
            objToDuplicate.transform.position[0] + 0.5,
            objToDuplicate.transform.position[1],
            objToDuplicate.transform.position[2],
          ],
        },
      };

      return {
        ...state,
        objects: [...state.objects, duplicated],
        selectedId: duplicated.id,
      };
    }

    case "TOGGLE_VISIBILITY":
      return {
        ...state,
        objects: state.objects.map((obj) =>
          obj.id === action.id ? { ...obj, visible: !obj.visible } : obj
        ),
      };

    case "CLEAR_SCENE":
      return {
        objects: [],
        selectedId: null,
      };

    default:
      return state;
  }
}

// Get selected object from state
export function getSelectedObject(state: SceneState): SceneObject | null {
  if (!state.selectedId) return null;
  return state.objects.find((obj) => obj.id === state.selectedId) || null;
}
