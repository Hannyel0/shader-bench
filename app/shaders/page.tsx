"use client";

import { ShaderGallery } from "../components/shaders/ShaderGallery";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Home, Waves } from "lucide-react";

export default function ShadersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Shader Bench</h1>
              <p className="text-xs text-muted-foreground">Performance Gallery</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              WebGL2 Performance Profiler
            </Badge>
            <Link href="/displacement">
              <Button variant="outline" size="sm">
                <Waves className="w-4 h-4 mr-2" />
                Displacement Lab
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <ShaderGallery defaultView="grid" width={700} height={500} />
      </main>
    </div>
  );
}
