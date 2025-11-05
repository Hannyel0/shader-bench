"use client";

import { ShaderGallery } from "../components/ShaderGallery";

export default function ShadersPage() {
  return (
    <div className="min-h-screen bg-black">
      <ShaderGallery defaultView="grid" width={700} height={500} />
    </div>
  );
}
