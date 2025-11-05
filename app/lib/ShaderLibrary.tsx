import { ShaderDefinition } from "../components/ShaderViewer";

export const exampleShaders: ShaderDefinition[] = [
  {
    name: "Plasma Wave",
    author: "Example",
    description:
      "Simple plasma effect using sine waves - good baseline performance test",
    tags: ["simple", "procedural", "colorful"],
    fragmentShader: `
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    
    float t = iTime * 0.5;
    
    float color = sin(p.x * 10.0 + t) + 
                  sin(p.y * 10.0 + t * 1.2) + 
                  sin((p.x + p.y) * 10.0 + t * 1.5) +
                  sin(length(p) * 10.0 + t * 2.0);
    
    color = color / 4.0;
    
    vec3 col = vec3(
        0.5 + 0.5 * sin(color * 3.14159 + 0.0),
        0.5 + 0.5 * sin(color * 3.14159 + 2.0),
        0.5 + 0.5 * sin(color * 3.14159 + 4.0)
    );
    
    fragColor = vec4(col, 1.0);
}
    `,
  },
  {
    name: "Fractal Zoom",
    author: "Example",
    description:
      "Julia set fractal with smooth coloring - moderate computational load",
    tags: ["fractal", "complex", "zoom"],
    fragmentShader: `
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    
    float zoom = 0.5 + 0.5 * sin(iTime * 0.3);
    zoom = 0.5 / (zoom * zoom + 0.1);
    uv *= zoom;
    
    vec2 c = vec2(0.355, 0.355);
    c.x += 0.2 * cos(iTime * 0.13);
    c.y += 0.2 * sin(iTime * 0.17);
    
    vec2 z = uv;
    float iter = 0.0;
    const int MAX_ITER = 100;
    
    for(int i = 0; i < MAX_ITER; i++) {
        if(length(z) > 2.0) break;
        
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        iter += 1.0;
    }
    
    if(iter >= float(MAX_ITER)) {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        float smooth_iter = iter + 1.0 - log(log(length(z))) / log(2.0);
        vec3 col = hsv2rgb(vec3(smooth_iter * 0.05, 0.8, 0.9));
        fragColor = vec4(col, 1.0);
    }
}
    `,
  },
  {
    name: "Raymarched Sphere",
    author: "Example",
    description:
      "Basic raymarching with lighting - tests distance field operations",
    tags: ["raymarching", "3d", "lighting"],
    fragmentShader: `
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

float map(vec3 p) {
    float sphere1 = sdSphere(p - vec3(sin(iTime) * 0.5, 0.0, 0.0), 0.5);
    float sphere2 = sdSphere(p - vec3(-sin(iTime) * 0.5, 0.0, 0.0), 0.5);
    float ground = p.y + 0.5;
    return min(min(sphere1, sphere2), ground);
}

vec3 calcNormal(vec3 p) {
    const vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        map(p + e.xyy) - map(p - e.xyy),
        map(p + e.yxy) - map(p - e.yxy),
        map(p + e.yyx) - map(p - e.yyx)
    ));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    
    vec3 ro = vec3(0.0, 0.0, -3.0);
    vec3 rd = normalize(vec3(uv, 1.0));
    
    float t = 0.0;
    vec3 col = vec3(0.0);
    
    for(int i = 0; i < 64; i++) {
        vec3 p = ro + rd * t;
        float d = map(p);
        
        if(d < 0.001) {
            vec3 n = calcNormal(p);
            vec3 lightDir = normalize(vec3(1.0, 1.0, -1.0));
            float diff = max(dot(n, lightDir), 0.0);
            float amb = 0.2;
            col = vec3(0.8, 0.5, 0.3) * (diff + amb);
            break;
        }
        
        if(t > 10.0) {
            col = vec3(0.1, 0.2, 0.3);
            break;
        }
        
        t += d;
    }
    
    fragColor = vec4(col, 1.0);
}
    `,
  },
  {
    name: "Voronoi Noise",
    author: "Example",
    description:
      "Animated Voronoi cells with smooth interpolation - moderate complexity",
    tags: ["noise", "procedural", "cells"],
    fragmentShader: `
vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

float voronoi(vec2 x) {
    vec2 n = floor(x);
    vec2 f = fract(x);
    
    float minDist = 1.0;
    
    for(int j = -1; j <= 1; j++) {
        for(int i = -1; i <= 1; i++) {
            vec2 b = vec2(float(i), float(j));
            vec2 r = b - f + hash2(n + b);
            r += 0.5 * sin(iTime * 0.5 + 6.2831 * hash2(n + b));
            float d = dot(r, r);
            minDist = min(minDist, d);
        }
    }
    
    return minDist;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 p = uv * 10.0;
    
    float v = voronoi(p);
    v = sqrt(v);
    
    vec3 col = vec3(v);
    col = pow(col, vec3(0.5));
    
    col *= vec3(0.5 + 0.5 * sin(iTime), 0.3 + 0.3 * cos(iTime * 1.3), 0.7);
    
    fragColor = vec4(col, 1.0);
}
    `,
  },
  {
    name: "Tunnel Effect",
    author: "Example",
    description:
      "Classic demoscene tunnel with texture mapping - tests pixel shading throughput",
    tags: ["tunnel", "classic", "texture"],
    fragmentShader: `
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    
    float d = length(uv);
    float a = atan(uv.y, uv.x);
    
    float u = 1.0 / d + iTime * 0.5;
    float v = a / 3.14159;
    
    float pattern = sin(u * 10.0) * sin(v * 10.0);
    pattern = pattern * 0.5 + 0.5;
    
    float glow = 0.1 / (d * d);
    
    vec3 col = vec3(pattern);
    col += vec3(glow * 0.5, glow * 0.3, glow);
    
    col *= vec3(
        0.5 + 0.5 * sin(iTime),
        0.5 + 0.5 * cos(iTime * 1.3),
        0.5 + 0.5 * sin(iTime * 1.7)
    );
    
    fragColor = vec4(col, 1.0);
}
    `,
  },
  {
    name: "Complex Mandelbrot",
    author: "Example",
    description:
      "Deep Mandelbrot set with smooth iteration coloring - high iteration count stress test",
    tags: ["fractal", "mandelbrot", "heavy"],
    fragmentShader: `
vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.0, 0.33, 0.67);
    return a + b * cos(6.28318 * (c * t + d));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    
    float zoom = 1.0 + 3.0 * (0.5 + 0.5 * sin(iTime * 0.2));
    vec2 center = vec2(-0.5, 0.0);
    center.x += 0.3 * cos(iTime * 0.1);
    
    vec2 c = center + uv / zoom;
    
    vec2 z = vec2(0.0);
    float iter = 0.0;
    const int MAX_ITER = 256;
    
    for(int i = 0; i < MAX_ITER; i++) {
        if(dot(z, z) > 4.0) break;
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        iter += 1.0;
    }
    
    vec3 col = vec3(0.0);
    
    if(iter < float(MAX_ITER)) {
        float smooth_iter = iter - log2(log2(dot(z, z)));
        col = palette(smooth_iter * 0.02);
    }
    
    fragColor = vec4(col, 1.0);
}
    `,
  },
  {
    name: "Glow Particles",
    author: "Example",
    description:
      "Multiple animated particles with glow effects - tests overdraw performance",
    tags: ["particles", "glow", "animated"],
    fragmentShader: `
float circle(vec2 p, vec2 center, float radius) {
    float d = length(p - center);
    return smoothstep(radius, radius - 0.01, d);
}

float glow(vec2 p, vec2 center, float radius) {
    float d = length(p - center);
    return radius / (d * d);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    
    vec3 col = vec3(0.0);
    
    const int NUM_PARTICLES = 20;
    
    for(int i = 0; i < NUM_PARTICLES; i++) {
        float fi = float(i);
        float t = iTime + fi * 0.5;
        
        vec2 pos = vec2(
            cos(t * 0.5 + fi) * 0.7,
            sin(t * 0.3 + fi * 1.3) * 0.5
        );
        
        float size = 0.02 + 0.02 * sin(t * 2.0 + fi);
        
        vec3 particleCol = vec3(
            0.5 + 0.5 * sin(fi * 0.5),
            0.5 + 0.5 * sin(fi * 0.7 + 2.0),
            0.5 + 0.5 * sin(fi * 0.3 + 4.0)
        );
        
        float g = glow(uv, pos, size * 0.5);
        col += particleCol * g * 0.02;
        
        float c = circle(uv, pos, size);
        col += particleCol * c;
    }
    
    col = pow(col, vec3(0.8));
    
    fragColor = vec4(col, 1.0);
}
    `,
  },
  {
    name: "Warp Speed",
    author: "Example",
    description:
      "Star field with motion blur effect - tests texture sampling and blending",
    tags: ["starfield", "motion", "speed"],
    fragmentShader: `
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    
    float a = atan(uv.y, uv.x);
    float r = length(uv);
    
    float speed = 5.0;
    float z = iTime * speed + hash(vec2(floor(a * 50.0), 0.0)) * 100.0;
    
    float layer = mod(z, 1.0);
    float fade = smoothstep(0.0, 0.1, layer) * smoothstep(1.0, 0.9, layer);
    
    vec2 starPos = vec2(
        cos(a) * (0.3 + hash(vec2(floor(a * 50.0), floor(z))) * 0.5),
        sin(a) * (0.3 + hash(vec2(floor(a * 50.0), floor(z))) * 0.5)
    );
    
    float d = length(uv - starPos);
    float size = 0.02 / (1.0 + r * 2.0);
    
    float star = size / (d + size);
    star *= fade;
    
    vec3 col = vec3(0.0);
    
    for(int i = 0; i < 3; i++) {
        float fi = float(i);
        float zOff = fi * 0.3;
        float layerZ = mod(z + zOff, 1.0);
        float layerFade = smoothstep(0.0, 0.1, layerZ) * smoothstep(1.0, 0.9, layerZ);
        
        vec2 layerPos = vec2(
            cos(a) * (0.3 + hash(vec2(floor(a * 50.0), floor(z + zOff))) * 0.5),
            sin(a) * (0.3 + hash(vec2(floor(a * 50.0), floor(z + zOff))) * 0.5)
        );
        
        float layerDist = length(uv - layerPos);
        float layerStar = size / (layerDist + size);
        layerStar *= layerFade * (1.0 - fi * 0.3);
        
        col += vec3(layerStar);
    }
    
    col += vec3(0.0, 0.1, 0.3) * r * 0.5;
    
    fragColor = vec4(col, 1.0);
}
    `,
  },
];
