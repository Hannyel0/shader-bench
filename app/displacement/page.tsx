"use client";

import { DisplacementViewer } from "../components/Displacementviewer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Home, Waves } from "lucide-react";

export default function DisplacementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Waves className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Displacement Lab</h1>
              <p className="text-xs text-muted-foreground">
                Procedural Texture Testing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              Three.js Displacement Engine
            </Badge>
            <Link href="/shaders">
              <Button variant="outline" size="sm">
                <Zap className="w-4 h-4 mr-2" />
                Shader Gallery
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
        <div className="mb-6 space-y-2">
          <h2 className="text-3xl font-bold">
            Procedural Displacement Testing
          </h2>
          <p className="text-muted-foreground">
            Real-time noise function visualization on 3D sphere geometry with
            interactive parameter control
          </p>
        </div>
        <DisplacementViewer />
      </main>
    </div>
  );
}
