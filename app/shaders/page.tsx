"use client";

import dynamic from "next/dynamic";
import { exampleShaders } from "../lib/ShaderLibrary";

const ShaderGallery = dynamic(
  () => import("../components/ShaderGallery").then(mod => ({ default: mod.ShaderGallery })),
  { ssr: false, loading: () => <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">Loading WebGL...</div> }
);

export default function ShadersPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <ShaderGallery
        shaders={exampleShaders}
        defaultView="grid"
        width={800}
        height={600}
      />
    </div>
  );
}
