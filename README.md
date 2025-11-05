# Shader Bench

Real-time WebGL2 shader performance profiling framework with millisecond-precision metrics, fullscreen stress testing, and comparative benchmarking for Shadertoy GLSL shaders.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![WebGL2](https://img.shields.io/badge/WebGL-2.0-red)](https://www.khronos.org/webgl/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## Features

- **Zero-overhead profiling** - Direct WebGL2 rendering without framework abstraction
- **Real-time metrics** - FPS, frame time, dropped frames, GPU throughput
- **Fullscreen stress testing** - Test shaders at native display resolution
- **Shadertoy compatibility** - Copy/paste GLSL code directly from shadertoy.com
- **Comparative benchmarking** - Side-by-side performance analysis (up to 4 shaders)
- **Resolution correlation** - Track performance across different pixel densities
- **Metrics export** - JSON data export for post-processing
- **Visual profiling** - Real-time FPS graphs with 120-frame history

## Performance Metrics

- **FPS** - Rolling average with quality grading (Excellent/Good/Fair/Poor)
- **Frame Time** - Current, average, min, max in milliseconds
- **Dropped Frames** - Count exceeding 16.67ms threshold
- **Pixel Throughput** - Megapixels rendered per second
- **Resolution Context** - Width × Height with pixel count tracking

## Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/shader-bench.git
cd shader-bench

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` → Click "Launch Shader Gallery"

## Usage

### Testing Individual Shaders

```tsx
import { ShaderViewer } from "@/components/ShaderViewer";

const myShader = {
  name: "Plasma Effect",
  fragmentShader: `
    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
      vec2 uv = fragCoord / iResolution.xy;
      vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0,2,4));
      fragColor = vec4(col, 1.0);
    }
  `,
};

export default function Page() {
  return <ShaderViewer shader={myShader} width={1920} height={1080} />;
}
```

### Fullscreen Performance Testing

1. Click **"⛶ Fullscreen"** button
2. Canvas expands to native screen resolution
3. Performance overlay displays in top-right corner
4. Monitor FPS degradation at higher pixel counts
5. Press **ESC** to exit fullscreen

### Comparative Benchmarking

1. Navigate to gallery view
2. Click **"+ Compare"** on shaders to test
3. Switch to **Compare View**
4. Observe side-by-side performance metrics
5. Export results with **"💾 Export Results"**

## Shadertoy Compatibility

All standard Shadertoy uniforms are supported:

```glsl
uniform vec3 iResolution;   // viewport resolution (pixels)
uniform float iTime;        // shader playback time (seconds)
uniform float iTimeDelta;   // render time (seconds)
uniform int iFrame;         // frame number
uniform vec4 iMouse;        // mouse pixel coords (xy: current, zw: click)
uniform vec4 iDate;         // (year, month, day, time in seconds)
```

Simply implement `mainImage()`:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  // Your shader code
}
```

## Project Structure

```
app/
├── components/
│   ├── ShaderCanvas.tsx          # WebGL2 renderer
│   ├── ShaderViewer.tsx          # Shader + metrics viewer
│   ├── PerformanceMonitor.tsx    # Metrics display
│   ├── PerformanceOverlay.tsx    # Fullscreen HUD
│   ├── ShaderGallery.tsx         # Multi-shader gallery
│   └── ResolutionBenchmark.tsx   # Resolution profiler
├── lib/
│   └── shaderLibrary.ts          # Example shader collection
└── shaders/
    └── page.tsx                  # Gallery route
```

## Technical Architecture

**Rendering Pipeline:**

- WebGL2 context with high-performance settings
- Full-screen quad geometry (2 triangles)
- GLSL ES 3.0 fragment shaders
- Hardware-accelerated execution

**Performance Collection:**

- 120-frame rolling window for metrics
- Updates every 10 frames (reduced overhead)
- Millisecond-precision timing via `performance.now()`
- GPU timer queries when `EXT_disjoint_timer_query_webgl2` available

**Optimization Strategies:**

- Alpha channel disabled (3-byte vs 4-byte framebuffer)
- No antialiasing, depth, or stencil buffers
- Single shader program per canvas (minimal state changes)
- Pre-allocated geometry buffers

## Performance Insights

**Resolution Scaling:**
| Resolution | Pixels | Relative Load | Expected FPS @ 60 Baseline |
|------------|--------|---------------|---------------------------|
| 800×600 | 480K | 1.0× | 60 FPS |
| 1920×1080 | 2.07M | 4.3× | 14 FPS |
| 3840×2160 | 8.29M | 17.3× | 3 FPS |

Actual performance depends on shader complexity, GPU fill rate, and driver optimizations.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 15+
- Edge 90+

Requires WebGL2 support (96% global browser coverage).

## Development

```bash
# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

## Adding Custom Shaders

Edit `app/lib/shaderLibrary.ts`:

```tsx
export const exampleShaders: ShaderDefinition[] = [
  {
    name: "My Custom Shader",
    author: "Your Name",
    description: "Shader description",
    tags: ["procedural", "animated"],
    fragmentShader: `
      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        // Your GLSL code
      }
    `,
  },
];
```

## Metrics Export Format

```json
{
  "shader": "Plasma Wave",
  "timestamp": "2025-11-04T12:34:56.789Z",
  "metrics": {
    "fps": 58.3,
    "frameTime": 17.15,
    "avgFrameTime": 17.23,
    "minFrameTime": 16.12,
    "maxFrameTime": 23.45,
    "droppedFrames": 5,
    "totalFrames": 1847,
    "resolution": { "width": 1920, "height": 1080 },
    "pixelCount": 2073600
  }
}
```

## Performance Tips

1. **Reduce iterations** - Lower max loop counts in fractals/raymarching
2. **Early termination** - Break loops when conditions met
3. **Avoid expensive functions** - `atan()`, `pow()`, `sin/cos` per pixel
4. **Pre-compute constants** - Move calculations outside loops
5. **Level of Detail** - Reduce quality at screen edges

## Known Limitations

- No texture sampling support (would require additional implementation)
- Single fragment shader only (no multi-pass effects)
- No audio reactive uniforms (`iChannel` support not implemented)

## Contributing

Contributions welcome! Areas for enhancement:

- [ ] Texture/image input support
- [ ] Multi-pass shader pipelines
- [ ] Automated benchmark suite runner
- [ ] WebGPU rendering backend
- [ ] Server-side shader validation

## License

MIT License - Free for commercial and personal use.

## Acknowledgments

Built with:

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- WebGL2 - Graphics API

Inspired by [Shadertoy](https://www.shadertoy.com/) by Inigo Quilez.

---

**Built for shader optimization and GPU performance analysis.**
