"use client";

import { VertexLabViewer } from "../components/vertex-lab/VertexLabViewer";

export default function VertexLabPage() {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
      <VertexLabViewer />
    </div>
  );
}
