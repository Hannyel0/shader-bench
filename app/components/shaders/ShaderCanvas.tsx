"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { ShaderCompat } from "../../utils/ShaderCompact";

interface ShaderCanvasProps {
  fragmentShader: string;
  width?: number;
  height?: number;
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
  onResize?: (resizeFn: (w: number, h: number) => void) => void;
  paused?: boolean;
  pausedTime?: number;
  className?: string;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  avgFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  droppedFrames: number;
  totalFrames: number;
  gpuTime?: number;
  resolution: { width: number; height: number };
  pixelCount: number;
}

interface ShaderUniforms {
  iResolution: WebGLUniformLocation | null;
  iTime: WebGLUniformLocation | null;
  iTimeDelta: WebGLUniformLocation | null;
  iFrame: WebGLUniformLocation | null;
  iMouse: WebGLUniformLocation | null;
  iDate: WebGLUniformLocation | null;
}

export const ShaderCanvas: React.FC<ShaderCanvasProps> = ({
  fragmentShader,
  width = 800,
  height = 600,
  onPerformanceUpdate,
  onResize,
  paused = false,
  pausedTime = 0,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const uniformsRef = useRef<ShaderUniforms | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const frameTimesRef = useRef<number[]>([]);
  const gpuTimeSamplesRef = useRef<number[]>([]);
  const mouseRef = useRef<[number, number, number, number]>([0, 0, 0, 0]);
  const queryRef = useRef<WebGLQuery | null>(null);

  // Dynamic canvas sizing handler
  const resizeCanvas = useCallback((newWidth: number, newHeight: number) => {
    const gl = glRef.current;
    const uniforms = uniformsRef.current;

    if (!gl || !uniforms) return;

    // Update canvas dimensions
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = newWidth;
      canvas.height = newHeight;
    }

    // Update WebGL viewport and uniform
    gl.viewport(0, 0, newWidth, newHeight);
    if (uniforms.iResolution) {
      gl.uniform3f(uniforms.iResolution, newWidth, newHeight, 1.0);
    }
  }, []);

  const resizeCallbackRef = useRef(resizeCanvas);

  // Update the ref when resizeCanvas changes
  useEffect(() => {
    resizeCallbackRef.current = resizeCanvas;
  }, [resizeCanvas]);

  // Vertex shader for full-screen quad
  const vertexShaderSource = `#version 300 es
    precision highp float;
    
    in vec2 position;
    
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const compileShader = useCallback(
    (
      gl: WebGL2RenderingContext,
      source: string,
      type: number
    ): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    },
    []
  );

  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });

    if (!gl) {
      console.error("WebGL2 not supported");
      return false;
    }

    glRef.current = gl;

    // Create GPU timer query if available
    const ext = gl.getExtension("EXT_disjoint_timer_query_webgl2");
    if (ext) {
      queryRef.current = gl.createQuery();
    }

    // Compile shaders
    const vertexShader = compileShader(
      gl,
      vertexShaderSource,
      gl.VERTEX_SHADER
    );
    const compiledFragmentShader = compileShader(
      gl,
      ShaderCompat.convertShadertoy(fragmentShader),
      gl.FRAGMENT_SHADER
    );

    if (!vertexShader || !compiledFragmentShader) return false;

    // Create program
    const program = gl.createProgram();
    if (!program) return false;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, compiledFragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program linking error:", gl.getProgramInfoLog(program));
      return false;
    }

    programRef.current = program;
    gl.useProgram(program);

    // Get uniform locations
    uniformsRef.current = {
      iResolution: gl.getUniformLocation(program, "iResolution"),
      iTime: gl.getUniformLocation(program, "iTime"),
      iTimeDelta: gl.getUniformLocation(program, "iTimeDelta"),
      iFrame: gl.getUniformLocation(program, "iFrame"),
      iMouse: gl.getUniformLocation(program, "iMouse"),
      iDate: gl.getUniformLocation(program, "iDate"),
    };

    // Create full-screen quad
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Set initial resolution
    gl.uniform3f(uniformsRef.current.iResolution, width, height, 1.0);

    startTimeRef.current = performance.now();
    frameCountRef.current = 0;
    lastFrameTimeRef.current = startTimeRef.current;
    frameTimesRef.current = [];

    // Simplified VSync detection
    let rafTimestamps: number[] = [];

    const detectRefreshRate = (timestamp: number) => {
      rafTimestamps.push(timestamp);
      if (rafTimestamps.length >= 10) {
        const intervals = rafTimestamps
          .slice(1)
          .map((t, i) => t - rafTimestamps[i]);
        const avgInterval =
          intervals.reduce((a, b) => a + b) / intervals.length;
        const detectedRefreshRate = Math.round(1000 / avgInterval);
        (gl as any).__refreshRate = detectedRefreshRate;
        return; // Stop after detection
      }
      requestAnimationFrame(detectRefreshRate);
    };

    requestAnimationFrame(detectRefreshRate);

    return true;
  }, [fragmentShader, width, height, compileShader]);

  // Validation diagnostic function
  const validateMetrics = useCallback(() => {
    const gl = glRef.current;
    if (!gl) return;

    console.group("Performance Validation");
    console.log("RAF Interval:", lastFrameTimeRef.current);
    console.log("GPU Time:", (uniformsRef.current as any)?.lastGpuTime);
    console.log("Refresh Rate:", (gl as any).__refreshRate);
    console.log("Frame Times:", frameTimesRef.current.slice(-5));
    console.groupEnd();
  }, []);

  const calculateMetrics = useCallback(
    (
      currentTime: number,
      frameTimes: number[],
      gpuTimeSamples: number[]
    ): PerformanceMetrics => {
      const frameTime = currentTime - lastFrameTimeRef.current;
      frameTimes.push(frameTime);

      // Keep only last 120 frames for rolling average
      if (frameTimes.length > 120) frameTimes.shift();

      // Calculate RAF-based metrics
      const avgFrameTime =
        frameTimes.reduce((sum, t) => sum + t, 0) / frameTimes.length;
      const rafFps = 1000 / avgFrameTime;
      const minFrameTime = Math.min(...frameTimes);
      const maxFrameTime = Math.max(...frameTimes);

      // Detect actual frame drops based on RAF timing
      const targetFrameTime = 1000 / 60; // 16.67ms for 60 FPS
      const droppedFrames = frameTimes.filter(
        (t) => t > targetFrameTime * 1.5 // 50% threshold
      ).length;

      // Calculate GPU-based metrics if available
      let gpuFps = rafFps; // Default to RAF-based FPS
      let reportedGpuTime: number | undefined = undefined;

      if (gpuTimeSamples.length > 0) {
        // Keep only last 30 GPU samples
        if (gpuTimeSamples.length > 30) gpuTimeSamples.shift();

        // Use median GPU time to filter outliers
        const sortedGpuTimes = [...gpuTimeSamples].sort((a, b) => a - b);
        const medianGpuTime =
          sortedGpuTimes[Math.floor(sortedGpuTimes.length / 2)];

        gpuFps = 1000 / medianGpuTime;
        reportedGpuTime = medianGpuTime;
      }

      // Use GPU FPS if available and reasonable (within 2x of RAF FPS)
      const finalFps =
        reportedGpuTime && Math.abs(gpuFps - rafFps) < rafFps * 2
          ? gpuFps
          : rafFps;

      return {
        fps: Math.round(finalFps * 100) / 100,
        frameTime: Math.round(frameTime * 100) / 100,
        avgFrameTime: Math.round(avgFrameTime * 100) / 100,
        minFrameTime: Math.round(minFrameTime * 100) / 100,
        maxFrameTime: Math.round(maxFrameTime * 100) / 100,
        droppedFrames,
        totalFrames: frameCountRef.current,
        gpuTime: reportedGpuTime,
        resolution: { width, height },
        pixelCount: width * height,
      };
    },
    [width, height]
  );

  const render = useCallback(
    (currentTime: number) => {
      const gl = glRef.current;
      const uniforms = uniformsRef.current;

      if (!gl || !uniforms) return;

      const elapsedTime = paused
        ? pausedTime ?? 0
        : (currentTime - startTimeRef.current) / 1000;
      const deltaTime = paused
        ? 0
        : (currentTime - lastFrameTimeRef.current) / 1000;

      // Update uniforms
      if (uniforms.iTime) gl.uniform1f(uniforms.iTime, elapsedTime);
      if (uniforms.iTimeDelta) gl.uniform1f(uniforms.iTimeDelta, deltaTime);
      if (uniforms.iFrame) gl.uniform1i(uniforms.iFrame, frameCountRef.current);
      if (uniforms.iMouse) gl.uniform4f(uniforms.iMouse, ...mouseRef.current);

      // Update date
      if (uniforms.iDate) {
        const date = new Date();
        gl.uniform4f(
          uniforms.iDate,
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
        );
      }

      // Render viewport
      gl.viewport(0, 0, width, height);

      // GPU timing implementation
      const ext = gl.getExtension("EXT_disjoint_timer_query_webgl2");

      if (ext && queryRef.current) {
        // Check if previous query result is available (non-blocking)
        const queryAvailable = gl.getQueryParameter(
          queryRef.current,
          gl.QUERY_RESULT_AVAILABLE
        );

        if (queryAvailable) {
          const gpuTimeNs = gl.getQueryParameter(
            queryRef.current,
            gl.QUERY_RESULT
          );
          const gpuTimeMs = gpuTimeNs / 1_000_000; // Convert nanoseconds to milliseconds

          // Store GPU sample (only if reasonable - filter extreme outliers)
          if (gpuTimeMs > 0 && gpuTimeMs < 1000) {
            gpuTimeSamplesRef.current.push(gpuTimeMs);
          }
        }

        // Start timing this frame's GPU work
        gl.beginQuery(ext.TIME_ELAPSED_EXT, queryRef.current);
      }

      // Execute draw call
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (ext && queryRef.current) {
        gl.endQuery(ext.TIME_ELAPSED_EXT);
      }

      frameCountRef.current++;

      // Update performance metrics every 10 frames to prevent React render storms
      if (frameCountRef.current % 10 === 0 && onPerformanceUpdate) {
        const metrics = calculateMetrics(
          currentTime,
          frameTimesRef.current,
          gpuTimeSamplesRef.current
        );
        onPerformanceUpdate(metrics);
      }

      lastFrameTimeRef.current = currentTime;
      animationFrameRef.current = requestAnimationFrame(render);
    },
    [width, height, onPerformanceUpdate, calculateMetrics, paused, pausedTime]
  );

  useEffect(() => {
    if (initWebGL()) {
      animationFrameRef.current = requestAnimationFrame(render);
    }

    // Expose resize function to parent
    if (onResize) {
      onResize(resizeCanvas);
    }

    // Expose validateMetrics for debugging (accessible via browser console)
    if (typeof window !== "undefined") {
      (window as any).__shaderValidateMetrics = validateMetrics;
    }

    // Mouse tracking
    const canvas = canvasRef.current;
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = height - (e.clientY - rect.top); // Flip Y for WebGL
      mouseRef.current[0] = x;
      mouseRef.current[1] = y;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = height - (e.clientY - rect.top);
      mouseRef.current[2] = x;
      mouseRef.current[3] = y;
    };

    canvas?.addEventListener("mousemove", handleMouseMove);
    canvas?.addEventListener("mousedown", handleMouseDown);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      canvas?.removeEventListener("mousemove", handleMouseMove);
      canvas?.removeEventListener("mousedown", handleMouseDown);

      const gl = glRef.current;
      if (gl && programRef.current) {
        gl.deleteProgram(programRef.current);
      }

      // Cleanup window reference
      if (typeof window !== "undefined") {
        delete (window as any).__shaderValidateMetrics;
      }
    };
  }, [fragmentShader, width, height, validateMetrics]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`${className} block`}
      style={{ imageRendering: "pixelated" }}
    />
  );
};
