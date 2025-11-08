"use client";

import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { SceneObject, DisplacementParams } from "./SceneManager";
import { NoiseControls } from "./Noisecontrols";
import { TransformTab } from "./TransformTab";
import { MaterialTab } from "./MaterialTab";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Waves,
  Move,
  Palette,
  Settings2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Zap,
  Link2,
  Box,
} from "lucide-react";

interface ObjectPropertiesPanelProps {
  object: SceneObject;
  onDisplacementChange: (updates: Partial<DisplacementParams>) => void;
  onTransformChange: (transform: Partial<SceneObject["transform"]>) => void;
  onMaterialChange: (material: Partial<SceneObject["material"]>) => void;
  onAddDisplacement?: (id: string) => void;
  onRemoveDisplacement?: (id: string) => void;
}

export const ObjectPropertiesPanel: React.FC<ObjectPropertiesPanelProps> = ({
  object,
  onDisplacementChange,
  onTransformChange,
  onMaterialChange,
  onAddDisplacement,
  onRemoveDisplacement,
}) => {
  const [transformOpen, setTransformOpen] = useState(true);
  const [materialOpen, setMaterialOpen] = useState(true);
  const [displacementOpen, setDisplacementOpen] = useState(true);

  return (
    <Card className="w-full h-full bg-zinc-900/80 backdrop-blur-xl border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[#FF5C3D]/10 border border-[#FF5C3D]/20">
              <Settings2 className="h-3.5 w-3.5 text-[#FF5C3D]" />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-white">Properties</h3>
              <p className="text-[9px] text-zinc-500">{object.name}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="h-5 text-[9px] bg-zinc-800/50 text-zinc-400 border-zinc-700"
          >
            {object.type}
          </Badge>
        </div>
      </div>

      {/* Scrollable Properties List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-2 space-y-1">
          {/* Transform Section */}
          <Collapsible open={transformOpen} onOpenChange={setTransformOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-800/50 transition-colors">
                {transformOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <Move className="w-3.5 h-3.5 text-[#FF5C3D]" />
                <span className="text-xs font-semibold text-white">Transform</span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pl-2">
                <TransformTab
                  transform={object.transform}
                  onChange={onTransformChange}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="bg-zinc-800" />

          {/* Material Section */}
          <Collapsible open={materialOpen} onOpenChange={setMaterialOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-800/50 transition-colors">
                {materialOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <Palette className="w-3.5 h-3.5 text-[#FF5C3D]" />
                <span className="text-xs font-semibold text-white">Material</span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pl-2">
                <MaterialTab
                  material={object.material}
                  onChange={onMaterialChange}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="bg-zinc-800" />

          {/* Displacement Section */}
          {object.displacement && (
            <>
              <Collapsible
                open={displacementOpen}
                onOpenChange={setDisplacementOpen}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-800/50 transition-colors">
                    {displacementOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                    <Waves className="w-3.5 h-3.5 text-[#FF5C3D]" />
                    <span className="text-xs font-semibold text-white">
                      Displacement
                    </span>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-2">
                    <NoiseControls
                      params={object.displacement}
                      onParamsChange={onDisplacementChange}
                      onPresetLoad={onDisplacementChange}
                    />
                    <div className="px-3 pb-3">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full h-7 text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                        onClick={() => onRemoveDisplacement?.(object.id)}
                      >
                        <Trash2 className="w-3 h-3 mr-1.5" />
                        Remove Property
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              <Separator className="bg-zinc-800" />
            </>
          )}

          {/* Add Property Button */}
          <div className="px-2 py-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 justify-start text-[10px] bg-zinc-800/30 hover:bg-zinc-800/50 text-zinc-400 hover:text-white border-zinc-700 hover:border-[#FF5C3D]/30"
                >
                  <Plus className="w-3.5 h-3.5 mr-2 text-[#FF5C3D]" />
                  Add Property
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="bg-zinc-900 border-zinc-800 backdrop-blur-xl"
                align="start"
              >
                {!object.displacement && (
                  <DropdownMenuItem
                    className="text-white hover:bg-zinc-800 text-xs cursor-pointer"
                    onClick={() => onAddDisplacement?.(object.id)}
                  >
                    <Waves className="w-3.5 h-3.5 mr-2 text-[#FF5C3D]" />
                    Displacement
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-zinc-500 hover:bg-zinc-800/50 text-xs cursor-not-allowed"
                  disabled
                >
                  <Zap className="w-3.5 h-3.5 mr-2" />
                  Physics
                  <span className="ml-auto text-[9px] text-zinc-600">Soon</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-zinc-500 hover:bg-zinc-800/50 text-xs cursor-not-allowed"
                  disabled
                >
                  <Link2 className="w-3.5 h-3.5 mr-2" />
                  Constraints
                  <span className="ml-auto text-[9px] text-zinc-600">Soon</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-zinc-500 hover:bg-zinc-800/50 text-xs cursor-not-allowed"
                  disabled
                >
                  <Box className="w-3.5 h-3.5 mr-2" />
                  Modifiers
                  <span className="ml-auto text-[9px] text-zinc-600">Soon</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};
