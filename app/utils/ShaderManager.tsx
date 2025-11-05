/**
 * ShaderManager - Persistent storage for user-created shaders
 *
 * Architecture:
 * - Primary: IndexedDB (supports large storage, structured queries, better performance)
 * - Fallback: localStorage (compatibility for older browsers)
 * - Features: CRUD operations, import/export, validation
 */

import { ShaderDefinition } from "../components/ShaderViewer";
import { ShaderCompat } from "./ShaderCompact";

export interface StoredShader extends ShaderDefinition {
  id: string;
  source: "builtin" | "user";
  created: number;
  modified: number;
  version: number;
}

export interface ShaderValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

class ShaderManagerClass {
  private dbName = "ShaderPerformanceDB";
  private storeName = "userShaders";
  private version = 1;
  private db: IDBDatabase | null = null;
  private useLocalStorage = false;
  private localStorageKey = "userShaders";

  /**
   * Initialize database connection
   */
  async init(): Promise<void> {
    if (!this.supportsIndexedDB()) {
      console.warn("IndexedDB not supported, falling back to localStorage");
      this.useLocalStorage = true;
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error("IndexedDB error, falling back to localStorage");
        this.useLocalStorage = true;
        resolve();
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, {
            keyPath: "id",
          });
          objectStore.createIndex("source", "source", { unique: false });
          objectStore.createIndex("created", "created", { unique: false });
          objectStore.createIndex("modified", "modified", { unique: false });
        }
      };
    });
  }

  /**
   * Check if IndexedDB is supported
   */
  private supportsIndexedDB(): boolean {
    try {
      return "indexedDB" in window && indexedDB !== null;
    } catch {
      return false;
    }
  }

  /**
   * Generate unique ID for shader
   */
  private generateId(): string {
    return `shader_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate shader code before saving
   */
  async validateShader(
    fragmentShader: string
  ): Promise<ShaderValidationResult> {
    const result = await ShaderCompat.validateShader(fragmentShader);
    return {
      valid: result.valid,
      error: result.error,
      warnings: result.warnings,
    };
  }

  /**
   * Wrap fragment shader with Shadertoy compatibility
   */
  private wrapFragmentShader(userShader: string): string {
    return ShaderCompat.convertShadertoy(userShader);
  }

  /**
   * Add new shader
   */
  async addShader(
    shader: Omit<ShaderDefinition, "thumbnailUrl">
  ): Promise<StoredShader> {
    // Validate shader first
    const validation = await this.validateShader(shader.fragmentShader);
    if (!validation.valid) {
      throw new Error(`Shader validation failed: ${validation.error}`);
    }

    const storedShader: StoredShader = {
      ...shader,
      id: this.generateId(),
      source: "user",
      created: Date.now(),
      modified: Date.now(),
      version: 1,
    };

    if (this.useLocalStorage) {
      const shaders = this.getLocalStorageShaders();
      shaders.push(storedShader);
      localStorage.setItem(this.localStorageKey, JSON.stringify(shaders));
    } else {
      await this.indexedDBOperation("readwrite", (store) => {
        store.add(storedShader);
      });
    }

    return storedShader;
  }

  /**
   * Update existing shader
   */
  async updateShader(
    id: string,
    updates: Partial<ShaderDefinition>
  ): Promise<StoredShader> {
    // Validate if shader code is being updated
    if (updates.fragmentShader) {
      const validation = await this.validateShader(updates.fragmentShader);
      if (!validation.valid) {
        throw new Error(`Shader validation failed: ${validation.error}`);
      }
    }

    if (this.useLocalStorage) {
      const shaders = this.getLocalStorageShaders();
      const index = shaders.findIndex((s) => s.id === id);
      if (index === -1) throw new Error("Shader not found");

      const updatedShader = {
        ...shaders[index],
        ...updates,
        modified: Date.now(),
        version: shaders[index].version + 1,
      };

      shaders[index] = updatedShader;
      localStorage.setItem(this.localStorageKey, JSON.stringify(shaders));
      return updatedShader;
    } else {
      return new Promise((resolve, reject) => {
        this.indexedDBOperation("readwrite", (store) => {
          const getRequest = store.get(id);

          getRequest.onsuccess = () => {
            const shader = getRequest.result as StoredShader;
            if (!shader) {
              reject(new Error("Shader not found"));
              return;
            }

            const updatedShader = {
              ...shader,
              ...updates,
              modified: Date.now(),
              version: shader.version + 1,
            };

            store.put(updatedShader);
            resolve(updatedShader);
          };

          getRequest.onerror = () => reject(getRequest.error);
        }).catch(reject);
      });
    }
  }

  /**
   * Delete shader
   */
  async deleteShader(id: string): Promise<void> {
    if (this.useLocalStorage) {
      const shaders = this.getLocalStorageShaders();
      const filtered = shaders.filter((s) => s.id !== id);
      localStorage.setItem(this.localStorageKey, JSON.stringify(filtered));
    } else {
      await this.indexedDBOperation("readwrite", (store) => {
        store.delete(id);
      });
    }
  }

  /**
   * Get all user shaders
   */
  async getAllShaders(): Promise<StoredShader[]> {
    if (this.useLocalStorage) {
      return this.getLocalStorageShaders();
    } else {
      return new Promise((resolve, reject) => {
        this.indexedDBOperation("readonly", (store) => {
          const request = store.getAll();

          request.onsuccess = () => {
            resolve(request.result as StoredShader[]);
          };

          request.onerror = () => reject(request.error);
        }).catch(reject);
      });
    }
  }

  /**
   * Get shader by ID
   */
  async getShader(id: string): Promise<StoredShader | null> {
    if (this.useLocalStorage) {
      const shaders = this.getLocalStorageShaders();
      return shaders.find((s) => s.id === id) || null;
    } else {
      return new Promise((resolve, reject) => {
        this.indexedDBOperation("readonly", (store) => {
          const request = store.get(id);

          request.onsuccess = () => {
            resolve((request.result as StoredShader) || null);
          };

          request.onerror = () => reject(request.error);
        }).catch(reject);
      });
    }
  }

  /**
   * Export shaders to JSON
   */
  async exportShaders(): Promise<string> {
    const shaders = await this.getAllShaders();
    return JSON.stringify(
      {
        version: 1,
        exported: Date.now(),
        shaders: shaders,
      },
      null,
      2
    );
  }

  /**
   * Import shaders from JSON
   */
  async importShaders(
    jsonData: string
  ): Promise<{ imported: number; errors: string[] }> {
    try {
      const data = JSON.parse(jsonData);
      const errors: string[] = [];
      let imported = 0;

      if (!data.shaders || !Array.isArray(data.shaders)) {
        throw new Error("Invalid import format: missing shaders array");
      }

      for (const shader of data.shaders) {
        try {
          // Validate required fields
          if (!shader.name || !shader.fragmentShader) {
            errors.push(`Skipped shader: missing required fields`);
            continue;
          }

          // Create new shader (don't preserve IDs to avoid conflicts)
          await this.addShader({
            name: shader.name,
            author: shader.author,
            description: shader.description,
            fragmentShader: shader.fragmentShader,
            tags: shader.tags,
          });
          imported++;
        } catch (error) {
          errors.push(
            `Failed to import "${shader.name}": ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      return { imported, errors };
    } catch (error) {
      throw new Error(
        `Import failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Clear all user shaders
   */
  async clearAll(): Promise<void> {
    if (this.useLocalStorage) {
      localStorage.removeItem(this.localStorageKey);
    } else {
      await this.indexedDBOperation("readwrite", (store) => {
        store.clear();
      });
    }
  }

  /**
   * Helper for IndexedDB operations
   */
  private indexedDBOperation(
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([this.storeName], mode);
      const store = transaction.objectStore(this.storeName);

      callback(store);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Helper for localStorage operations
   */
  private getLocalStorageShaders(): StoredShader[] {
    try {
      const data = localStorage.getItem(this.localStorageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}

// Singleton instance
export const ShaderManager = new ShaderManagerClass();
