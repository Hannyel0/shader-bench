"use client";

import React, { useState, useCallback, useEffect } from "react";
import { ShaderDefinition } from "./ShaderViewer";
import { ShaderManager, ShaderValidationResult } from "../utils/ShaderManager";
import { ShaderCanvas, PerformanceMetrics } from "./ShaderCanvas";

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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editShader ? "Edit Shader" : "Add New Shader"}</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label>
                  Shader Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome Shader"
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label>Author</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your name"
                  maxLength={50}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what your shader does..."
                rows={2}
                maxLength={500}
              />
            </div>

            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="fractal, 3d, colorful"
              />
            </div>

            <div className="form-group code-group">
              <div className="code-header">
                <label>
                  Fragment Shader Code <span className="required">*</span>
                </label>
                <div className="code-actions">
                  <button
                    type="button"
                    onClick={insertTemplate}
                    className="template-btn"
                  >
                    📋 Insert Template
                  </button>
                  <button
                    type="button"
                    onClick={handleValidate}
                    disabled={isValidating || !fragmentShader.trim()}
                    className="validate-btn"
                  >
                    {isValidating ? "⏳ Validating..." : "✓ Validate & Preview"}
                  </button>
                </div>
              </div>
              <textarea
                value={fragmentShader}
                onChange={(e) => {
                  setFragmentShader(e.target.value);
                  setValidation(null);
                  setShowPreview(false);
                }}
                placeholder="Paste your Shadertoy fragment shader code here..."
                rows={20}
                className="code-editor"
                spellCheck={false}
              />
              <div className="code-hint">
                💡 Paste code from Shadertoy. Must include a{" "}
                <code>mainImage()</code> function.
              </div>
            </div>

            {validation && (
              <div
                className={`validation-result ${
                  validation.valid ? "success" : "error"
                }`}
              >
                <div className="validation-header">
                  {validation.valid ? "✓ Shader Valid" : "✗ Validation Failed"}
                </div>
                {validation.error && (
                  <div className="validation-message">{validation.error}</div>
                )}
                {validation.warnings && validation.warnings.length > 0 && (
                  <div className="validation-warnings">
                    <strong>Warnings:</strong>
                    <ul>
                      {validation.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {showPreview && validation?.valid && (
              <div className="preview-section">
                <div className="preview-header">
                  <h3>🎨 Live Preview</h3>
                  {previewMetrics && (
                    <div className="preview-stats">
                      <span className="stat-fps">
                        {previewMetrics.fps.toFixed(1)} FPS
                      </span>
                      <span className="stat-time">
                        {previewMetrics.avgFrameTime.toFixed(1)}ms
                      </span>
                    </div>
                  )}
                </div>
                <div className="preview-canvas-container">
                  <ShaderCanvas
                    fragmentShader={fragmentShader}
                    width={600}
                    height={400}
                    onPerformanceUpdate={handlePreviewMetrics}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving || !name.trim() || !fragmentShader.trim()}
          >
            {isSaving
              ? "⏳ Saving..."
              : editShader
              ? "💾 Update Shader"
              : "✨ Add Shader"}
          </button>
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            padding: 20px;
            overflow-y: auto;
          }

          .modal-container {
            background: #1a1a1a;
            border-radius: 12px;
            border: 1px solid #333;
            width: 100%;
            max-width: 1200px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px 32px;
            border-bottom: 1px solid #333;
            background: #2a2a2a;
            border-radius: 12px 12px 0 0;
          }

          .modal-header h2 {
            margin: 0;
            color: #fff;
            font-size: 24px;
            font-weight: 600;
          }

          .close-btn {
            background: none;
            border: none;
            color: #888;
            font-size: 28px;
            cursor: pointer;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: all 0.2s;
          }

          .close-btn:hover {
            background: #333;
            color: #fff;
          }

          .modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 32px;
          }

          .form-section {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .form-group label {
            color: #aaa;
            font-size: 14px;
            font-weight: 500;
            font-family: monospace;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .required {
            color: #ff4444;
          }

          .form-group input,
          .form-group textarea {
            background: #0a0a0a;
            border: 1px solid #333;
            border-radius: 6px;
            padding: 12px 16px;
            color: #fff;
            font-size: 14px;
            font-family: inherit;
            transition: all 0.2s;
          }

          .form-group input:focus,
          .form-group textarea:focus {
            outline: none;
            border-color: #00ff00;
            box-shadow: 0 0 0 2px rgba(0, 255, 0, 0.1);
          }

          .code-group {
            margin-top: 8px;
          }

          .code-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }

          .code-actions {
            display: flex;
            gap: 8px;
          }

          .template-btn,
          .validate-btn {
            background: #2a2a2a;
            border: 1px solid #555;
            color: #fff;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-family: monospace;
            transition: all 0.2s;
          }

          .template-btn:hover,
          .validate-btn:hover:not(:disabled) {
            background: #333;
            border-color: #00ff00;
          }

          .validate-btn {
            background: #00aa00;
            border-color: #00ff00;
          }

          .validate-btn:hover:not(:disabled) {
            background: #00cc00;
          }

          .validate-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .code-editor {
            font-family: "Consolas", "Monaco", "Courier New", monospace;
            font-size: 13px;
            line-height: 1.6;
            resize: vertical;
            min-height: 300px;
            tab-size: 4;
          }

          .code-hint {
            color: #666;
            font-size: 12px;
            font-style: italic;
          }

          .code-hint code {
            background: #2a2a2a;
            padding: 2px 6px;
            border-radius: 3px;
            color: #00ff00;
            font-family: monospace;
          }

          .validation-result {
            padding: 16px;
            border-radius: 8px;
            border: 1px solid;
          }

          .validation-result.success {
            background: rgba(0, 255, 0, 0.1);
            border-color: #00ff00;
          }

          .validation-result.error {
            background: rgba(255, 0, 0, 0.1);
            border-color: #ff4444;
          }

          .validation-header {
            font-weight: bold;
            font-family: monospace;
            margin-bottom: 8px;
          }

          .validation-result.success .validation-header {
            color: #00ff00;
          }

          .validation-result.error .validation-header {
            color: #ff4444;
          }

          .validation-message {
            color: #ff8888;
            font-family: monospace;
            font-size: 13px;
            white-space: pre-wrap;
            line-height: 1.5;
          }

          .validation-warnings {
            color: #ffaa00;
            font-size: 13px;
            margin-top: 8px;
          }

          .validation-warnings ul {
            margin: 8px 0 0 20px;
            padding: 0;
          }

          .validation-warnings li {
            margin: 4px 0;
          }

          .preview-section {
            background: #0a0a0a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 20px;
          }

          .preview-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }

          .preview-header h3 {
            margin: 0;
            color: #00ff00;
            font-size: 18px;
            font-family: monospace;
          }

          .preview-stats {
            display: flex;
            gap: 16px;
            font-family: monospace;
            font-size: 14px;
          }

          .stat-fps {
            color: #00ff00;
            font-weight: bold;
          }

          .stat-time {
            color: #00aaff;
          }

          .preview-canvas-container {
            border-radius: 6px;
            overflow: hidden;
            display: flex;
            justify-content: center;
            background: #000;
          }

          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            padding: 24px 32px;
            border-top: 1px solid #333;
            background: #2a2a2a;
            border-radius: 0 0 12px 12px;
          }

          .btn {
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-family: monospace;
            border: none;
          }

          .btn-secondary {
            background: #333;
            color: #fff;
            border: 1px solid #555;
          }

          .btn-secondary:hover {
            background: #444;
          }

          .btn-primary {
            background: #00ff00;
            color: #000;
            border: 1px solid #00ff00;
          }

          .btn-primary:hover:not(:disabled) {
            background: #00cc00;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 255, 0, 0.3);
          }

          .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          @media (max-width: 768px) {
            .modal-container {
              max-width: 100%;
              max-height: 100vh;
              border-radius: 0;
            }

            .form-row {
              grid-template-columns: 1fr;
            }

            .modal-header,
            .modal-body,
            .modal-footer {
              padding: 16px;
            }
          }
        `}</style>
      </div>
    </div>
  );
};
