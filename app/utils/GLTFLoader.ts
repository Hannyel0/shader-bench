/**
 * GLTF Loader Utility
 * Handles loading and processing of GLTF/GLB files for import into Vertex Lab
 */

import { GLTFLoader as ThreeGLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { GLTFData } from '../components/vertex-lab/SceneManager';

export class GLTFImporter {
  private loader: ThreeGLTFLoader;
  private dracoLoader: DRACOLoader;

  constructor() {
    this.loader = new ThreeGLTFLoader();

    // Setup DRACO decoder for compressed models
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    this.loader.setDRACOLoader(this.dracoLoader);
  }

  /**
   * Load a GLTF/GLB file from a File object
   */
  async loadFromFile(file: File): Promise<GLTFData> {
    const url = URL.createObjectURL(file);

    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          try {
            const scene = gltf.scene;
            const meshes: THREE.Mesh[] = [];
            const materials: THREE.Material[] = [];

            // Traverse and collect meshes/materials
            scene.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                meshes.push(child);
                if (Array.isArray(child.material)) {
                  materials.push(...child.material);
                } else {
                  materials.push(child.material);
                }
              }
            });

            // Calculate bounding box
            const boundingBox = new THREE.Box3().setFromObject(scene);

            // Center the model at origin
            const center = boundingBox.getCenter(new THREE.Vector3());
            scene.position.sub(center);

            // Recalculate bounding box after centering
            boundingBox.setFromObject(scene);

            const gltfData: GLTFData = {
              url,
              originalScene: scene,
              meshes,
              materials,
              animations: gltf.animations,
              boundingBox
            };

            resolve(gltfData);
          } catch (error) {
            reject(error);
          }
        },
        (progress) => {
          // Optional: could emit progress events here
          const percentComplete = (progress.loaded / progress.total) * 100;
          console.log(`Loading: ${percentComplete.toFixed(2)}%`);
        },
        (error) => {
          // Clean up URL on error
          URL.revokeObjectURL(url);
          reject(error);
        }
      );
    });
  }

  /**
   * Load a GLTF/GLB file from a URL
   */
  async loadFromURL(url: string): Promise<GLTFData> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          try {
            const scene = gltf.scene;
            const meshes: THREE.Mesh[] = [];
            const materials: THREE.Material[] = [];

            // Traverse and collect meshes/materials
            scene.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                meshes.push(child);
                if (Array.isArray(child.material)) {
                  materials.push(...child.material);
                } else {
                  materials.push(child.material);
                }
              }
            });

            // Calculate bounding box
            const boundingBox = new THREE.Box3().setFromObject(scene);

            // Center the model at origin
            const center = boundingBox.getCenter(new THREE.Vector3());
            scene.position.sub(center);

            // Recalculate bounding box after centering
            boundingBox.setFromObject(scene);

            const gltfData: GLTFData = {
              url,
              originalScene: scene,
              meshes,
              materials,
              animations: gltf.animations,
              boundingBox
            };

            resolve(gltfData);
          } catch (error) {
            reject(error);
          }
        },
        undefined,
        (error) => reject(error)
      );
    });
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.dracoLoader.dispose();
  }
}
