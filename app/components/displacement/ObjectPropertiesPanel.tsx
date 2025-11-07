"use client";

import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SceneObject } from "./SceneManager";
import { NoiseControls } from "./Noisecontrolsadapter";
import { TransformTab } from "./TransformTab";
import { MaterialTab } from "./MaterialTab";
import { DisplacementParams } from "./Displacementcanvas";
import { Waves, Move, Palette } from "lucide-react";

interface ObjectPropertiesPanelProps {
  object: SceneObject;
  onDisplacementChange: (updates: Partial<DisplacementParams>) => void;
  onTransformChange: (transform: Partial<SceneObject["transform"]>) => void;
  onMaterialChange: (material: Partial<SceneObject["material"]>) => void;
}

export const ObjectPropertiesPanel: React.FC<ObjectPropertiesPanelProps> = ({
  object,
  onDisplacementChange,
  onTransformChange,
  onMaterialChange,
}) => {
  const [openSections, setOpenSections] = useState<string[]>(["transform"]);

  return (
    <div className="w-full h-full bg-black/60 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">
      <ScrollArea className="h-full">
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="w-full"
        >
          {/* Transform Section */}
          <AccordionItem value="transform" className="border-b border-white/10">
            <AccordionTrigger className="px-3 py-2 hover:bg-white/5 text-xs font-semibold text-white">
              <div className="flex items-center gap-2">
                <Move className="w-3.5 h-3.5 text-green-400" />
                Transform
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0">
              <div className="px-3 pb-3">
                <TransformTab
                  transform={object.transform}
                  onChange={onTransformChange}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Material Section */}
          <AccordionItem value="material" className="border-b border-white/10">
            <AccordionTrigger className="px-3 py-2 hover:bg-white/5 text-xs font-semibold text-white">
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-purple-400" />
                Material
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0">
              <div className="px-3 pb-3">
                <MaterialTab
                  material={object.material}
                  onChange={onMaterialChange}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Displacement Section */}
          <AccordionItem value="displacement" className="border-b-0">
            <AccordionTrigger className="px-3 py-2 hover:bg-white/5 text-xs font-semibold text-white">
              <div className="flex items-center gap-2">
                <Waves className="w-3.5 h-3.5 text-blue-400" />
                Displacement
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0">
              <div className="px-3 pb-3">
                <NoiseControls
                  params={object.displacement}
                  onChange={onDisplacementChange}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
    </div>
  );
};
