"use client";

import React, { useState, useCallback, useEffect } from "react";
import { ShaderDefinition } from "./ShaderViewer";
import { ShaderManager, ShaderValidationResult } from "../utils/ShaderManager";
import { ShaderCanvas, PerformanceMetrics } from "./ShaderCanvas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  CheckCircle,
  FileCode,
  Loader2,
  Play,
  ClipboardCopy,
} from "lucide-react";

interface AddShaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shader: ShaderDefinition) => void;
  editShader?: ShaderDefinition & { id?: string };
}

const SHADERTOY_TEMPLATE = `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord / iResolution.xy;

    // Time varying pixel color
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0, 2, 4));

    // Output to screen
    fragColor = vec4(col, 1.0);
}`;

export const AddShaderModal: React.FC<AddShaderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editShader,
}) => {
  const [name, setName] = useState(editShader?.name || "");
  const [author, setAuthor] = useState(editShader?.author || "");
  const [description, setDescription] = useState(editShader?.description || "");
  const [fragmentShader, setFragmentShader] = useState(
    editShader?.fragmentShader || ""
  );
  const [tags, setTags] = useState(editShader?.tags?.join(", ") || "");
  const [validation, setValidation] = useState<ShaderValidationResult | null>(
    null
  );
  const [isValidating, setIsValidating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMetrics, setPreviewMetrics] =
    useState<PerformanceMetrics | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(editShader?.name || "");
      setAuthor(editShader?.author || "");
      setDescription(editShader?.description || "");
      setFragmentShader(editShader?.fragmentShader || "");
      setTags(editShader?.tags?.join(", ") || "");
      setValidation(null);
      setShowPreview(false);
    }
  }, [isOpen, editShader]);

  const handleValidate = useCallback(async () => {
    if (!fragmentShader.trim()) {
      setValidation({
        valid: false,
        error: "Shader code is required",
      });
      return;
    }

    setIsValidating(true);
    try {
      const result = await ShaderManager.validateShader(fragmentShader);
      setValidation(result);
      if (result.valid) {
        setShowPreview(true);
      }
    } catch (error) {
      setValidation({
        valid: false,
        error: error instanceof Error ? error.message : "Validation failed",
      });
    } finally {
      setIsValidating(false);
    }
  }, [fragmentShader]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please enter a shader name");
      return;
    }

    if (!fragmentShader.trim()) {
      alert("Please enter shader code");
      return;
    }

    // Validate before saving
    setIsSaving(true);
    try {
      const result = await ShaderManager.validateShader(fragmentShader);
      if (!result.valid) {
        alert(`Shader validation failed: ${result.error}`);
        setValidation(result);
        setIsSaving(false);
        return;
      }

      const shader: ShaderDefinition = {
        name: name.trim(),
        author: author.trim() || undefined,
        description: description.trim() || undefined,
        fragmentShader: fragmentShader.trim(),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
      };

      onSave(shader);
      onClose();
    } catch (error) {
      alert(
        `Failed to save shader: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const insertTemplate = () => {
    setFragmentShader(SHADERTOY_TEMPLATE);
  };

  const handlePreviewMetrics = useCallback((metrics: PerformanceMetrics) => {
    setPreviewMetrics(metrics);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl">
            {editShader ? "Edit Shader" : "Add New Shader"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Shader Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Shader"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Your name"
                maxLength={50}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what your shader does..."
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="fractal, 3d, colorful"
            />
          </div>

          <Separator />

          {/* Shader Code */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="fragmentShader" className="text-base">
                <FileCode className="w-4 h-4 mr-1 inline" />
                Fragment Shader Code <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={insertTemplate}
                >
                  <ClipboardCopy className="w-4 h-4 mr-2" />
                  Insert Template
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleValidate}
                  disabled={isValidating || !fragmentShader.trim()}
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Validate & Preview
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Textarea
              id="fragmentShader"
              value={fragmentShader}
              onChange={(e) => {
                setFragmentShader(e.target.value);
                setValidation(null);
                setShowPreview(false);
              }}
              placeholder="Paste your Shadertoy fragment shader code here..."
              rows={20}
              className="font-mono text-sm"
              spellCheck={false}
            />

            <p className="text-xs text-muted-foreground">
              Paste code from Shadertoy. Must include a{" "}
              <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">
                mainImage()
              </code>{" "}
              function.
            </p>
          </div>

          {/* Validation Result */}
          {validation && (
            <Card
              className={
                validation.valid
                  ? "bg-green-500/10 border-green-500/50"
                  : "bg-destructive/10 border-destructive/50"
              }
            >
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  {validation.valid ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-500">Shader Valid</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      <span className="text-destructive">Validation Failed</span>
                    </>
                  )}
                </div>
                {validation.error && (
                  <p className="text-sm font-mono text-destructive pl-7">
                    {validation.error}
                  </p>
                )}
                {validation.warnings && validation.warnings.length > 0 && (
                  <div className="pl-7 space-y-1">
                    <p className="text-sm font-semibold text-yellow-600">
                      Warnings:
                    </p>
                    <ul className="list-disc list-inside text-sm text-yellow-600 space-y-1">
                      {validation.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Live Preview */}
          {showPreview && validation?.valid && (
            <Card className="overflow-hidden">
              <div className="bg-muted/50 p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Live Preview</h3>
                  </div>
                  {previewMetrics && (
                    <div className="flex gap-3 items-center">
                      <Badge variant="default" className="font-mono">
                        {previewMetrics.fps.toFixed(1)} FPS
                      </Badge>
                      <Badge variant="secondary" className="font-mono">
                        {previewMetrics.avgFrameTime.toFixed(1)}ms
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 bg-black flex justify-center">
                <ShaderCanvas
                  fragmentShader={fragmentShader}
                  width={600}
                  height={400}
                  onPerformanceUpdate={handlePreviewMetrics}
                />
              </div>
            </Card>
          )}
        </div>

        <DialogFooter className="p-6 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !name.trim() || !fragmentShader.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : editShader ? (
              "Update Shader"
            ) : (
              "Add Shader"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
