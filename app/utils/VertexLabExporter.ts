/**
 * Comprehensive Vertex Lab Configuration Exporter
 * Provides complete data export for recreation in other Three.js projects
 */

import {
  VertexParams,
  PerformanceMetrics,
} from "../components/vertex-lab/SceneManager";
import { NoiseLibrary, NoiseType, NoiseConfigs } from "./Noiselibrary";

export interface VertexLabExportData {
  // Metadata
  metadata: {
    version: string;
    exportDate: string;
    exportTimestamp: number;
    generator: string;
    description: string;
  };

  // Complete vertex configuration
  config: {
    noiseType: NoiseType;
    noiseLabel: string;
    noiseDescription: string;
    parameters: VertexParams;
  };

  // Performance metrics at export time
  performance: {
    captured: boolean;
    metrics?: PerformanceMetrics;
  };

  // Shader implementation
  shaders: {
    vertexShader: string;
    fragmentShader: string;
    noiseFunction: {
      name: string;
      source: string;
      dependencies: string[];
    };
  };

  // Geometry configuration
  geometry: {
    type: string;
    subdivisions: number;
    triangleCount: number;
    vertexCount: number;
    estimatedMemory: number;
  };

  // Implementation guide
  implementation: {
    quickStart: string;
    dependencies: string[];
    setupSteps: string[];
    codeSnippets: {
      uniformDeclaration: string;
      uniformUpdate: string;
      materialCreation: string;
      animationLoop: string;
    };
  };
}

export class VertexLabExporter {
  /**
   * Exports complete vertex configuration with all necessary data
   */
  static exportConfiguration(
    params: VertexParams,
    performanceMetrics?: PerformanceMetrics
  ): VertexLabExportData {
    const noiseConfig = NoiseConfigs[params.noiseType];
    const vertexShader = this.generateVertexShader(params);
    const fragmentShader = this.generateFragmentShader(params);
    const noiseFunctionData = this.getNoiseFunctionData(params.noiseType);

    return {
      metadata: {
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        exportTimestamp: Date.now(),
        generator: "Vertex Lab - Three.js Vertex Displacement Viewer",
        description: `${noiseConfig.label} vertex displacement configuration with ${params.subdivisions}x${params.subdivisions} subdivisions`,
      },

      config: {
        noiseType: params.noiseType,
        noiseLabel: noiseConfig.label,
        noiseDescription: noiseConfig.description,
        parameters: { ...params },
      },

      performance: {
        captured: !!performanceMetrics,
        metrics: performanceMetrics
          ? {
              fps: performanceMetrics.fps,
              avgFrameTime: performanceMetrics.avgFrameTime,
              triangleCount: performanceMetrics.triangleCount,
              pixelCount: performanceMetrics.pixelCount,
              geometryMemory: performanceMetrics.geometryMemory,
              resolution: performanceMetrics.resolution,
              drawCalls: performanceMetrics.drawCalls,
              droppedFrames: performanceMetrics.droppedFrames,
              totalFrames: performanceMetrics.totalFrames,
              frameTime: performanceMetrics.frameTime,
              minFrameTime: performanceMetrics.minFrameTime,
              maxFrameTime: performanceMetrics.maxFrameTime,
            }
          : undefined,
      },

      shaders: {
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        noiseFunction: noiseFunctionData,
      },

      geometry: {
        type: "SphereGeometry",
        subdivisions: params.subdivisions,
        triangleCount: params.subdivisions * params.subdivisions * 2,
        vertexCount: (params.subdivisions + 1) * (params.subdivisions + 1),
        estimatedMemory: this.calculateMemoryEstimate(params.subdivisions),
      },

      implementation: this.generateImplementationGuide(
        params,
        noiseConfig.label
      ),
    };
  }

  /**
   * Generate complete vertex shader code
   */
  private static generateVertexShader(params: VertexParams): string {
    const noiseFunction = this.getNoiseFunction(params.noiseType);
    const displacementCall = this.getDisplacementCall(params.noiseType);

    return `// Vertex Shader - ${NoiseConfigs[params.noiseType].label}
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
  float displacement = ${displacementCall};
  
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
  
  float displacement1 = ${displacementCall.replace("noisePos", "noisePos1")};
  float displacement2 = ${displacementCall.replace("noisePos", "noisePos2")};
  
  neighbour1 += objectNormal * displacement1 * uAmplitude;
  neighbour2 += objectNormal * displacement2 * uAmplitude;
  
  vec3 displacedTangent = neighbour1 - pos;
  vec3 displacedBitangent = neighbour2 - pos;
  vec3 displacedNormal = normalize(cross(displacedTangent, displacedBitangent));
  
  vNormal = normalMatrix * displacedNormal;
  vPosition = pos;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;
  }

  /**
   * Generate fragment shader code
   */
  private static generateFragmentShader(params: VertexParams): string {
    return `// Fragment Shader
uniform vec3 uColor;
uniform int uVisualizationMode; // 0: solid, 1: height, 2: normal, 3: wireframe
uniform float uRoughness; // Material roughness (0 = smooth/glossy, 1 = rough/matte)

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
    // PBR-inspired lighting with roughness control
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vPosition);
    vec3 lightDir = normalize(vec3(5.0, 5.0, 5.0));

    // Diffuse component
    float diff = max(dot(normal, lightDir), 0.0);

    // Specular component (Blinn-Phong with roughness)
    vec3 halfDir = normalize(lightDir + viewDir);
    float specAngle = max(dot(normal, halfDir), 0.0);

    // Convert roughness (0-1) to specular power (high power = smooth, low = rough)
    // Non-linear mapping: roughness 0 -> power 256, roughness 1 -> power 4
    float shininess = mix(256.0, 4.0, uRoughness);
    float spec = pow(specAngle, shininess);

    // Fresnel effect (increases spec at grazing angles)
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
    spec = mix(spec, spec * 2.0, fresnel * (1.0 - uRoughness));

    // Combine lighting
    float ambient = 0.3;
    vec3 diffuseColor = uColor * (ambient + diff * 0.7);
    vec3 specularColor = vec3(1.0) * spec * (1.0 - uRoughness * 0.7);

    finalColor = diffuseColor + specularColor;
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
}`;
  }

  /**
   * Get noise function data with dependencies
   */
  private static getNoiseFunctionData(noiseType: NoiseType): {
    name: string;
    source: string;
    dependencies: string[];
  } {
    const dependencies: string[] = ["common"];
    let source = "";
    let name = "";

    switch (noiseType) {
      case "perlin":
        name = "perlinNoise";
        source = NoiseLibrary.perlin;
        break;
      case "simplex":
        name = "simplexNoise";
        source = NoiseLibrary.simplex;
        break;
      case "voronoi":
      case "voronoiF2":
      case "voronoiF2MinusF1":
        name = "voronoiNoise";
        source = NoiseLibrary.voronoi;
        break;
      case "fbmPerlin":
        name = "fbmPerlin";
        source = NoiseLibrary.perlin + "\n" + NoiseLibrary.fbm;
        dependencies.push("perlin", "fbm");
        break;
      case "fbmSimplex":
        name = "fbmSimplex";
        source = NoiseLibrary.simplex + "\n" + NoiseLibrary.fbm;
        dependencies.push("simplex", "fbm");
        break;
      case "turbulence":
        name = "turbulence";
        source = NoiseLibrary.perlin + "\n" + NoiseLibrary.turbulence;
        dependencies.push("perlin", "turbulence");
        break;
      case "ridge":
        name = "ridgeNoise";
        source = NoiseLibrary.perlin + "\n" + NoiseLibrary.ridge;
        dependencies.push("perlin", "ridge");
        break;
      case "domainWarp":
        name = "domainWarpedNoise";
        source = NoiseLibrary.perlin + "\n" + NoiseLibrary.domainWarp;
        dependencies.push("perlin", "domainWarp");
        break;
      case "cellular":
        name = "cellularNoise";
        source = NoiseLibrary.cellular;
        break;
      default:
        name = "perlinNoise";
        source = NoiseLibrary.perlin;
    }

    return { name, source, dependencies };
  }

  /**
   * Get noise function code
   */
  private static getNoiseFunction(noiseType: NoiseType): string {
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

  /**
   * Get displacement function call
   */
  private static getDisplacementCall(
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

  /**
   * Calculate estimated memory usage
   */
  private static calculateMemoryEstimate(subdivisions: number): number {
    const vertexCount = (subdivisions + 1) * (subdivisions + 1);
    const triangleCount = subdivisions * subdivisions * 2;
    // positions (3 floats) + normals (3 floats) + uvs (2 floats) + indices (3 shorts per triangle)
    return vertexCount * 3 * 4 * 3 + triangleCount * 3 * 2;
  }

  /**
   * Generate implementation guide
   */
  private static generateImplementationGuide(
    params: VertexParams,
    noiseLabel: string
  ): VertexLabExportData["implementation"] {
    const visualizationMode =
      params.visualizationMode === "solid"
        ? 0
        : params.visualizationMode === "height"
        ? 1
        : params.visualizationMode === "normal"
        ? 2
        : 3;

    return {
      quickStart: `This configuration uses ${noiseLabel} for procedural displacement on a sphere geometry with ${params.subdivisions}x${params.subdivisions} subdivisions. The displacement is animated and can be easily integrated into any Three.js project using the provided shader code and uniforms.`,

      dependencies: [
        "three@^0.160.0 (or compatible version)",
        "@react-three/fiber@^8.15.0 (if using React)",
        "@react-three/drei@^9.92.0 (optional, for helpers)",
      ],

      setupSteps: [
        "1. Copy the vertex and fragment shader code from the 'shaders' section",
        "2. Create a THREE.ShaderMaterial with the provided shaders",
        "3. Initialize uniforms with the exact values from 'config.parameters'",
        "4. Create SphereGeometry with the specified subdivisions",
        "5. Update uTime uniform in your animation loop",
        "6. (Optional) Implement parameter controls for runtime adjustment",
      ],

      codeSnippets: {
        uniformDeclaration: `// Shader uniforms initialization
const uniforms = {
  uTime: { value: 0 },
  uAmplitude: { value: ${params.amplitude} },
  uFrequency: { value: ${params.frequency} },
  uOctaves: { value: ${params.octaves} },
  uLacunarity: { value: ${params.lacunarity} },
  uGain: { value: ${params.gain} },
  uRidgeOffset: { value: ${params.ridgeOffset} },
  uWarpStrength: { value: ${params.warpStrength} },
  uUVScale: { value: ${params.uvScale} },
  uAnimationSpeed: { value: ${params.animationSpeed} },
  uColor: { value: new THREE.Color(0x4a9eff) },
  uVisualizationMode: { value: ${visualizationMode} },
  uRoughness: { value: ${params.roughness} }
};`,

        uniformUpdate: `// Update uniforms (call when parameters change)
material.uniforms.uAmplitude.value = ${params.amplitude};
material.uniforms.uFrequency.value = ${params.frequency};
material.uniforms.uOctaves.value = ${params.octaves};
material.uniforms.uLacunarity.value = ${params.lacunarity};
material.uniforms.uGain.value = ${params.gain};
material.uniforms.uRidgeOffset.value = ${params.ridgeOffset};
material.uniforms.uWarpStrength.value = ${params.warpStrength};
material.uniforms.uUVScale.value = ${params.uvScale};
material.uniforms.uAnimationSpeed.value = ${params.animationSpeed};
material.uniforms.uRoughness.value = ${params.roughness};`,

        materialCreation: `// Create shader material
const material = new THREE.ShaderMaterial({
  vertexShader: vertexShaderCode, // from export data
  fragmentShader: fragmentShaderCode, // from export data
  uniforms: uniforms,
  wireframe: ${params.wireframe},
  side: THREE.DoubleSide
});

// Create geometry
const geometry = new THREE.SphereGeometry(1, ${params.subdivisions}, ${params.subdivisions});

// Create mesh
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);`,

        animationLoop: `// Animation loop
function animate(time) {
  requestAnimationFrame(animate);
  
  // Update shader time (in seconds)
  material.uniforms.uTime.value = time * 0.001;
  
  // Render
  renderer.render(scene, camera);
}
animate(0);`,
      },
    };
  }

  /**
   * Export to JSON string
   */
  static exportToJSON(
    params: VertexParams,
    performanceMetrics?: PerformanceMetrics,
    pretty: boolean = true
  ): string {
    const data = this.exportConfiguration(params, performanceMetrics);
    return JSON.stringify(data, null, pretty ? 2 : 0);
  }

  /**
   * Export to file download
   */
  static downloadConfiguration(
    params: VertexParams,
    performanceMetrics?: PerformanceMetrics,
    filename?: string
  ): void {
    const json = this.exportToJSON(params, performanceMetrics, true);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const defaultFilename = `displacement-${
      params.noiseType
    }-${Date.now()}.json`;
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Import and validate configuration
   */
  static importConfiguration(json: string): {
    success: boolean;
    data?: VertexLabExportData;
    error?: string;
    warnings?: string[];
  } {
    try {
      const data = JSON.parse(json) as VertexLabExportData;
      const warnings: string[] = [];

      // Validation
      if (!data.metadata || !data.config || !data.shaders) {
        return {
          success: false,
          error: "Invalid configuration format: missing required sections",
        };
      }

      // Version check
      if (data.metadata.version !== "1.0.0") {
        warnings.push(
          `Configuration version ${data.metadata.version} may not be fully compatible`
        );
      }

      // Parameter validation
      const params = data.config.parameters;
      if (
        typeof params.amplitude !== "number" ||
        typeof params.frequency !== "number"
      ) {
        return {
          success: false,
          error: "Invalid parameter types",
        };
      }

      // Subdivision bounds check
      if (params.subdivisions < 8 || params.subdivisions > 512) {
        warnings.push(
          `Subdivisions value ${params.subdivisions} is outside recommended range (8-512)`
        );
      }

      return {
        success: true,
        data,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse JSON: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Generate human-readable summary
   */
  static generateSummary(data: VertexLabExportData): string {
    const config = data.config;
    const perf = data.performance.metrics;

    let summary = `=== Displacement Configuration Summary ===\n\n`;
    summary += `Noise Type: ${config.noiseLabel}\n`;
    summary += `Description: ${config.noiseDescription}\n\n`;

    summary += `Parameters:\n`;
    summary += `  - Amplitude: ${config.parameters.amplitude}\n`;
    summary += `  - Frequency: ${config.parameters.frequency}\n`;
    summary += `  - Octaves: ${config.parameters.octaves}\n`;
    summary += `  - Lacunarity: ${config.parameters.lacunarity}\n`;
    summary += `  - Gain: ${config.parameters.gain}\n`;
    summary += `  - Animation Speed: ${config.parameters.animationSpeed}\n\n`;

    summary += `Geometry:\n`;
    summary += `  - Type: ${data.geometry.type}\n`;
    summary += `  - Subdivisions: ${data.geometry.subdivisions}\n`;
    summary += `  - Triangle Count: ${data.geometry.triangleCount.toLocaleString()}\n`;
    summary += `  - Vertex Count: ${data.geometry.vertexCount.toLocaleString()}\n`;
    summary += `  - Est. Memory: ${(
      data.geometry.estimatedMemory / 1024
    ).toFixed(2)} KB\n\n`;

    if (perf) {
      summary += `Performance (at export):\n`;
      summary += `  - FPS: ${perf.fps}\n`;
      summary += `  - Avg Frame Time: ${perf.avgFrameTime}ms\n`;
      summary += `  - Resolution: ${perf.resolution.width}x${perf.resolution.height}\n`;
      summary += `  - Draw Calls: ${perf.drawCalls}\n\n`;
    }

    summary += `Exported: ${new Date(
      data.metadata.exportDate
    ).toLocaleString()}\n`;

    return summary;
  }
}
