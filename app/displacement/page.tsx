"use client";

import { DisplacementViewer } from "../components/displacement/Displacementviewer";

export default function DisplacementPage() {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
      <DisplacementViewer />
    </div>
  );
}
