"use client";

import React, { useState, useRef } from "react";
import { DisplacementParams, PerformanceMetrics } from "./Displacementcanvas";
import {
  DisplacementExporter,
  DisplacementExportData,
} from "../../utils/DisplacementExporter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Download,
  Upload,
  Copy,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Code2,
  Info,
  FileText,
} from "lucide-react";

interface DisplacementConfigManagerProps {
  currentParams: DisplacementParams;
  performanceMetrics?: PerformanceMetrics;
  onImport?: (params: DisplacementParams) => void;
}

export const DisplacementConfigManager: React.FC<DisplacementConfigManagerProps> = ({ currentParams, performanceMetrics, onImport }) => {
  const [exportData, setExportData] = useState<DisplacementExportData | null>(
    null
  );
  const [importError, setImportError] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate export data on demand
  const handleExportPreview = () => {
    const data = DisplacementExporter.exportConfiguration(
      currentParams,
      performanceMetrics
    );
    setExportData(data);
  };

  // Download JSON file
  const handleDownload = () => {
    DisplacementExporter.downloadConfiguration(
      currentParams,
      performanceMetrics
    );
  };

  // Copy JSON to clipboard
  const handleCopyJSON = async () => {
    if (!exportData) {
      handleExportPreview();
      return;
    }

    const json = JSON.stringify(exportData, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Copy shader code to clipboard
  const handleCopyShader = async (type: "vertex" | "fragment") => {
    if (!exportData) return;

    const code =
      type === "vertex"
        ? exportData.shaders.vertexShader
        : exportData.shaders.fragmentShader;

    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy shader:", err);
    }
  };

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      handleImportJSON(content);
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Import and validate JSON
  const handleImportJSON = (json: string) => {
    const result = DisplacementExporter.importConfiguration(json);

    if (!result.success) {
      setImportError(result.error || "Unknown import error");
      setImportWarnings([]);
      return;
    }

    setImportError(null);
    setImportWarnings(result.warnings || []);

    if (result.data && onImport) {
      onImport(result.data.config.parameters);
    }
  };

  // Trigger file input
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Format JSON for display
  const formatJSON = (data: DisplacementExportData, section?: string) => {
    if (section === "config") {
      return JSON.stringify(data.config, null, 2);
    } else if (section === "shaders") {
      return JSON.stringify(data.shaders, null, 2);
    } else if (section === "implementation") {
      return JSON.stringify(data.implementation, null, 2);
    }
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="default"
              onClick={handleExportPreview}
              className="flex-1 sm:flex-none"
            >
              <FileJson className="w-4 h-4 mr-2" />
              Export Config
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Export Displacement Configuration</DialogTitle>
              <DialogDescription>
                Complete configuration with shader code, parameters, and
                implementation guide
              </DialogDescription>
            </DialogHeader>

            {exportData && (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="preview">
                    <Info className="w-4 h-4 mr-1" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="config">
                    <FileJson className="w-4 h-4 mr-1" />
                    Config
                  </TabsTrigger>
                  <TabsTrigger value="shaders">
                    <Code2 className="w-4 h-4 mr-1" />
                    Shaders
                  </TabsTrigger>
                  <TabsTrigger value="guide">
                    <FileText className="w-4 h-4 mr-1" />
                    Guide
                  </TabsTrigger>
                  <TabsTrigger value="full">Full JSON</TabsTrigger>
                </TabsList>

                {/* Preview Tab */}
                <TabsContent value="preview" className="space-y-4">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <FileJson className="w-4 h-4 text-primary" />
                      Configuration Summary
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Noise Type:
                        </span>
                        <Badge variant="default">
                          {exportData.config.noiseLabel}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Subdivisions:
                        </span>
                        <span className="font-mono">
                          {exportData.config.parameters.subdivisions}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Triangle Count:
                        </span>
                        <span className="font-mono">
                          {exportData.geometry.triangleCount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Amplitude:
                        </span>
                        <span className="font-mono">
                          {exportData.config.parameters.amplitude}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Frequency:
                        </span>
                        <span className="font-mono">
                          {exportData.config.parameters.frequency}
                        </span>
                      </div>
                      {exportData.performance.captured &&
                        exportData.performance.metrics && (
                          <>
                            <div className="flex justify-between pt-2 border-t">
                              <span className="text-muted-foreground">
                                Performance FPS:
                              </span>
                              <Badge variant="secondary">
                                {exportData.performance.metrics.fps}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Avg Frame Time:
                              </span>
                              <span className="font-mono">
                                {exportData.performance.metrics.avgFrameTime}ms
                              </span>
                            </div>
                          </>
                        )}
                    </div>
                  </Card>

                  <Card className="p-4 bg-muted/30">
                    <h3 className="font-semibold mb-2 text-sm">
                      Quick Implementation
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {exportData.implementation.quickStart}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Dependencies:
                      </p>
                      {exportData.implementation.dependencies.map((dep, i) => (
                        <Badge key={i} variant="outline" className="text-xs mr-1">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                </TabsContent>

                {/* Config Tab */}
                <TabsContent value="config">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold">
                        Configuration Parameters
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleCopyJSON()
                        }
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <Textarea
                      readOnly
                      value={formatJSON(exportData, "config")}
                      className="font-mono text-xs h-96"
                    />
                  </div>
                </TabsContent>

                {/* Shaders Tab */}
                <TabsContent value="shaders" className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-semibold">Vertex Shader</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyShader("vertex")}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <Textarea
                      readOnly
                      value={exportData.shaders.vertexShader}
                      className="font-mono text-xs h-64"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-semibold">Fragment Shader</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyShader("fragment")}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <Textarea
                      readOnly
                      value={exportData.shaders.fragmentShader}
                      className="font-mono text-xs h-64"
                    />
                  </div>
                </TabsContent>

                {/* Implementation Guide Tab */}
                <TabsContent value="guide" className="space-y-4">
                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertTitle>Implementation Steps</AlertTitle>
                    <AlertDescription>
                      <ol className="list-decimal list-inside space-y-1 mt-2">
                        {exportData.implementation.setupSteps.map((step, i) => (
                          <li key={i} className="text-sm">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </AlertDescription>
                  </Alert>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 text-sm">
                      Code Snippets
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold mb-1 text-muted-foreground">
                          Uniform Declaration
                        </h4>
                        <Textarea
                          readOnly
                          value={
                            exportData.implementation.codeSnippets
                              .uniformDeclaration
                          }
                          className="font-mono text-xs h-32"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold mb-1 text-muted-foreground">
                          Material Creation
                        </h4>
                        <Textarea
                          readOnly
                          value={
                            exportData.implementation.codeSnippets
                              .materialCreation
                          }
                          className="font-mono text-xs h-32"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold mb-1 text-muted-foreground">
                          Animation Loop
                        </h4>
                        <Textarea
                          readOnly
                          value={
                            exportData.implementation.codeSnippets.animationLoop
                          }
                          className="font-mono text-xs h-24"
                        />
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                {/* Full JSON Tab */}
                <TabsContent value="full">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-semibold">
                        Complete Export Data
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopyJSON}
                      >
                        {copySuccess ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      readOnly
                      value={formatJSON(exportData)}
                      className="font-mono text-xs h-96"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleCopyJSON}>
                <Copy className="w-4 h-4 mr-2" />
                Copy JSON
              </Button>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          onClick={handleDownload}
          className="flex-1 sm:flex-none"
        >
          <Download className="w-4 h-4 mr-2" />
          Quick Download
        </Button>

        <Button
          variant="outline"
          onClick={handleImportClick}
          className="flex-1 sm:flex-none"
        >
          <Upload className="w-4 h-4 mr-2" />
          Import Config
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileImport}
          className="hidden"
        />
      </div>

      {/* Import Status */}
      {importError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Import Failed</AlertTitle>
          <AlertDescription>{importError}</AlertDescription>
        </Alert>
      )}

      {importWarnings.length > 0 && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Import Warnings</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {importWarnings.map((warning, i) => (
                <li key={i} className="text-sm">
                  {warning}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Export Status */}
      {copySuccess && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <AlertTitle className="text-green-600">Success!</AlertTitle>
          <AlertDescription className="text-green-600">
            Configuration copied to clipboard
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};