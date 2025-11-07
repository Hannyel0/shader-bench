"use client";

import React from "react";
import { NoiseControls as OriginalNoiseControls } from "./Noisecontrols";
import { DisplacementParams } from "./Displacementcanvas";

interface NoiseControlsAdapterProps {
  params: DisplacementParams;
  onChange: (params: Partial<DisplacementParams>) => void;
}

/**
 * Adapter component to bridge the original NoiseControls interface
 * with the new multi-object scene editor interface
 */
export const NoiseControls: React.FC<NoiseControlsAdapterProps> = ({
  params,
  onChange,
}) => {
  const handleParamsChange = (updates: Partial<DisplacementParams>) => {
    onChange(updates);
  };

  const handlePresetLoad = (preset: DisplacementParams) => {
    onChange(preset);
  };

  return (
    <OriginalNoiseControls
      params={params}
      onParamsChange={handleParamsChange}
      onPresetLoad={handlePresetLoad}
    />
  );
};
