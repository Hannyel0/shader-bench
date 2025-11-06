import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Activity, Code, Gauge, Waves } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold">Shader Bench</h1>
          </div>
          <Badge variant="outline" className="text-xs">
            WebGL2 Performance Profiler
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Main Heading */}
          <div className="space-y-4">
            <Badge className="mb-4" variant="secondary">
              Real-time GPU Benchmarking
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
              Shader Bench
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              A real-time WebGL2 shader performance profiling framework for
              benchmarking Shadertoy-compatible GLSL fragment shaders with
              millisecond-precision metrics.
            </p>
          </div>

          {/* CTA */}
          <div className="flex gap-4 justify-center items-center flex-wrap">
            <Link href="/shaders">
              <Button size="lg" className="text-lg px-8 h-12">
                <Activity className="mr-2 h-5 w-5" />
                Launch Gallery
              </Button>
            </Link>
            <Link href="/displacement">
              <Button
                size="lg"
                variant="default"
                className="text-lg px-8 h-12 bg-primary/90 hover:bg-primary"
              >
                <Waves className="mr-2 h-5 w-5" />
                Displacement Lab
              </Button>
            </Link>
            <Link href="/shaders">
              <Button size="lg" variant="outline" className="text-lg px-8 h-12">
                <Code className="mr-2 h-5 w-5" />
                View Examples
              </Button>
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card className="p-6 hover:shadow-lg transition-shadow border-border/50 bg-card/50 backdrop-blur">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Gauge className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Real-time Metrics</h3>
                <p className="text-sm text-muted-foreground">
                  FPS, frame time, GPU timings with 120-frame rolling window
                  analysis
                </p>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow border-border/50 bg-card/50 backdrop-blur">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Code className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Shadertoy Compatible</h3>
                <p className="text-sm text-muted-foreground">
                  Drop in your GLSL code with full mainImage() function support
                </p>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow border-border/50 bg-card/50 backdrop-blur">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Activity className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Advanced Profiling</h3>
                <p className="text-sm text-muted-foreground">
                  Compare shaders, export data, fullscreen benchmarks, and more
                </p>
              </div>
            </Card>
          </div>

          {/* New Displacement Lab Section */}
          <div className="mt-16 pt-12 border-t border-border/40">
            <div className="max-w-3xl mx-auto">
              <Badge className="mb-4" variant="secondary">
                <Waves className="w-3 h-3 mr-1" />
                New: Displacement Lab
              </Badge>
              <h2 className="text-3xl font-bold mb-4">
                Procedural Displacement Testing
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Real-time 3D noise function visualization with interactive
                parameter control. Test Perlin, Simplex, Voronoi, FBM, and more
                on a dynamic sphere geometry with vertex displacement.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Badge variant="outline">Three.js</Badge>
                <Badge variant="outline">React Three Fiber</Badge>
                <Badge variant="outline">8+ Noise Functions</Badge>
                <Badge variant="outline">Real-time Displacement</Badge>
                <Badge variant="outline">GLSL Shaders</Badge>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="pt-12 space-y-4">
            <p className="text-sm text-muted-foreground font-medium">
              Built with modern web technologies
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Badge variant="secondary">Next.js 16</Badge>
              <Badge variant="secondary">React 19</Badge>
              <Badge variant="secondary">WebGL2</Badge>
              <Badge variant="secondary">Three.js</Badge>
              <Badge variant="secondary">TypeScript 5</Badge>
              <Badge variant="secondary">Tailwind v4</Badge>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-20">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Shader Bench - WebGL2 Performance Profiling Framework</p>
        </div>
      </footer>
    </div>
  );
}
