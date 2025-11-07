/**
 * Comprehensive GLSL Noise Function Library
 * Contains various noise implementations for procedural displacement
 */

export const NoiseLibrary = {
  // Common utility functions used across noise types
  common: `
    // Hash functions for pseudo-random number generation
    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.13);
      p3 += dot(p3, p3.yzx + 3.333);
      return fract((p3.x + p3.y) * p3.z);
    }

    float hash(vec3 p3) {
      p3 = fract(p3 * 0.1031);
      p3 += dot(p3, p3.zyx + 31.32);
      return fract((p3.x + p3.y) * p3.z);
    }

    vec2 hash2(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    vec3 hash3(vec3 p) {
      p = vec3(
        dot(p, vec3(127.1, 311.7, 74.7)),
        dot(p, vec3(269.5, 183.3, 246.1)),
        dot(p, vec3(113.5, 271.9, 124.6))
      );
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    // Smooth interpolation functions
    vec3 fade(vec3 t) {
      return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    }

    vec2 fade(vec2 t) {
      return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    }
  `,

  // Classic Perlin Noise
  perlin: `
    float perlinNoise(vec3 p) {
      vec3 pi = floor(p);
      vec3 pf = p - pi;
      vec3 w = fade(pf);

      float n000 = dot(hash3(pi + vec3(0.0, 0.0, 0.0)), pf - vec3(0.0, 0.0, 0.0));
      float n001 = dot(hash3(pi + vec3(0.0, 0.0, 1.0)), pf - vec3(0.0, 0.0, 1.0));
      float n010 = dot(hash3(pi + vec3(0.0, 1.0, 0.0)), pf - vec3(0.0, 1.0, 0.0));
      float n011 = dot(hash3(pi + vec3(0.0, 1.0, 1.0)), pf - vec3(0.0, 1.0, 1.0));
      float n100 = dot(hash3(pi + vec3(1.0, 0.0, 0.0)), pf - vec3(1.0, 0.0, 0.0));
      float n101 = dot(hash3(pi + vec3(1.0, 0.0, 1.0)), pf - vec3(1.0, 0.0, 1.0));
      float n110 = dot(hash3(pi + vec3(1.0, 1.0, 0.0)), pf - vec3(1.0, 1.0, 0.0));
      float n111 = dot(hash3(pi + vec3(1.0, 1.0, 1.0)), pf - vec3(1.0, 1.0, 1.0));

      return mix(
        mix(mix(n000, n100, w.x), mix(n010, n110, w.x), w.y),
        mix(mix(n001, n101, w.x), mix(n011, n111, w.x), w.y),
        w.z
      );
    }
  `,

  // Simplex Noise (3D)
  simplex: `
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float simplexNoise(vec3 v) {
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod289(i);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }
  `,

  // Voronoi/Worley Noise
  voronoi: `
    vec2 voronoiNoise(vec3 p) {
      vec3 pi = floor(p);
      vec3 pf = fract(p);

      float minDist = 1.0;
      float secondMinDist = 1.0;

      for(int z = -1; z <= 1; z++) {
        for(int y = -1; y <= 1; y++) {
          for(int x = -1; x <= 1; x++) {
            vec3 neighbor = vec3(float(x), float(y), float(z));
            vec3 point = hash3(pi + neighbor);
            vec3 diff = neighbor + point - pf;
            float dist = length(diff);

            if(dist < minDist) {
              secondMinDist = minDist;
              minDist = dist;
            } else if(dist < secondMinDist) {
              secondMinDist = dist;
            }
          }
        }
      }

      return vec2(minDist, secondMinDist);
    }

    float voronoiF1(vec3 p) {
      return voronoiNoise(p).x;
    }

    float voronoiF2(vec3 p) {
      return voronoiNoise(p).y;
    }

    float voronoiF2MinusF1(vec3 p) {
      vec2 v = voronoiNoise(p);
      return v.y - v.x;
    }
  `,

  // Fractional Brownian Motion (FBM)
  fbm: `
    float fbmPerlin(vec3 p, int octaves, float lacunarity, float gain) {
      float value = 0.0;
      float amplitude = 1.0;
      float frequency = 1.0;
      float maxValue = 0.0;

      for(int i = 0; i < octaves; i++) {
        value += amplitude * perlinNoise(p * frequency);
        maxValue += amplitude;
        amplitude *= gain;
        frequency *= lacunarity;
      }

      return value / maxValue;
    }

    float fbmSimplex(vec3 p, int octaves, float lacunarity, float gain) {
      float value = 0.0;
      float amplitude = 1.0;
      float frequency = 1.0;
      float maxValue = 0.0;

      for(int i = 0; i < octaves; i++) {
        value += amplitude * simplexNoise(p * frequency);
        maxValue += amplitude;
        amplitude *= gain;
        frequency *= lacunarity;
      }

      return value / maxValue;
    }
  `,

  // Turbulence
  turbulence: `
    float turbulence(vec3 p, int octaves, float lacunarity, float gain) {
      float value = 0.0;
      float amplitude = 1.0;
      float frequency = 1.0;
      float maxValue = 0.0;

      for(int i = 0; i < octaves; i++) {
        value += amplitude * abs(perlinNoise(p * frequency));
        maxValue += amplitude;
        amplitude *= gain;
        frequency *= lacunarity;
      }

      return value / maxValue;
    }
  `,

  // Ridge Noise
  ridge: `
    float ridgeNoise(vec3 p, int octaves, float lacunarity, float gain, float offset) {
      float value = 0.0;
      float amplitude = 1.0;
      float frequency = 1.0;
      float weight = 1.0;

      for(int i = 0; i < octaves; i++) {
        float n = perlinNoise(p * frequency);
        n = offset - abs(n);
        n = n * n * weight;
        
        value += n * amplitude;
        weight = clamp(n, 0.0, 1.0);
        
        amplitude *= gain;
        frequency *= lacunarity;
      }

      return value;
    }
  `,

  // Domain Warping
  domainWarp: `
    float domainWarpedNoise(vec3 p, float warpStrength) {
      vec3 q = vec3(
        perlinNoise(p),
        perlinNoise(p + vec3(5.2, 1.3, 4.1)),
        perlinNoise(p + vec3(1.7, 9.2, 3.4))
      );

      vec3 r = vec3(
        perlinNoise(p + warpStrength * q + vec3(1.7, 9.2, 3.4)),
        perlinNoise(p + warpStrength * q + vec3(8.3, 2.8, 7.1)),
        perlinNoise(p + warpStrength * q + vec3(4.5, 6.1, 2.9))
      );

      return perlinNoise(p + warpStrength * r);
    }
  `,

  // Cellular/Tiles
  cellular: `
    float cellularNoise(vec3 p) {
      vec3 pi = floor(p);
      vec3 pf = fract(p);

      float minDist = 1.0;

      for(int z = -1; z <= 1; z++) {
        for(int y = -1; y <= 1; y++) {
          for(int x = -1; x <= 1; x++) {
            vec3 neighbor = vec3(float(x), float(y), float(z));
            vec3 point = hash3(pi + neighbor);
            
            // Create smooth cellular pattern
            vec3 diff = neighbor + point - pf;
            float dist = dot(diff, diff);
            minDist = min(minDist, dist);
          }
        }
      }

      return sqrt(minDist);
    }
  `,
};

export type NoiseType =
  | "perlin"
  | "simplex"
  | "voronoi"
  | "voronoiF2"
  | "voronoiF2MinusF1"
  | "fbmPerlin"
  | "fbmSimplex"
  | "turbulence"
  | "ridge"
  | "domainWarp"
  | "cellular";

export interface NoiseConfig {
  type: NoiseType;
  label: string;
  description: string;
  requiresOctaves?: boolean;
  requiresWarpStrength?: boolean;
  requiresRidgeOffset?: boolean;
}

export const NoiseConfigs: Record<NoiseType, NoiseConfig> = {
  perlin: {
    type: "perlin",
    label: "Perlin Noise",
    description: "Classic gradient noise with smooth transitions",
  },
  simplex: {
    type: "simplex",
    label: "Simplex Noise",
    description: "Optimized noise with fewer directional artifacts",
  },
  voronoi: {
    type: "voronoi",
    label: "Voronoi F1",
    description: "Distance to nearest cell point (cellular pattern)",
  },
  voronoiF2: {
    type: "voronoiF2",
    label: "Voronoi F2",
    description: "Distance to second nearest cell point",
  },
  voronoiF2MinusF1: {
    type: "voronoiF2MinusF1",
    label: "Voronoi Edge",
    description: "Cell edges (F2 - F1), creates organic cracks",
  },
  fbmPerlin: {
    type: "fbmPerlin",
    label: "FBM Perlin",
    description: "Fractal Brownian Motion with Perlin base",
    requiresOctaves: true,
  },
  fbmSimplex: {
    type: "fbmSimplex",
    label: "FBM Simplex",
    description: "Fractal Brownian Motion with Simplex base",
    requiresOctaves: true,
  },
  turbulence: {
    type: "turbulence",
    label: "Turbulence",
    description: "Absolute value noise for cloud-like patterns",
    requiresOctaves: true,
  },
  ridge: {
    type: "ridge",
    label: "Ridge Noise",
    description: "Sharp ridges and valleys, great for mountains",
    requiresOctaves: true,
    requiresRidgeOffset: true,
  },
  domainWarp: {
    type: "domainWarp",
    label: "Domain Warp",
    description: "Warped noise domain for organic distortions",
    requiresWarpStrength: true,
  },
  cellular: {
    type: "cellular",
    label: "Cellular",
    description: "Smooth cellular/tile pattern",
  },
};

// Default presets for displacement
export const PRESETS = {
  default: {
    noiseType: "perlin" as NoiseType,
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
    visualizationMode: "solid" as "solid" | "height" | "normal" | "wireframe",
    roughness: 0.5,
  },
};
