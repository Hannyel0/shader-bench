"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  precision?: number;
  label?: string;
  className?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  step = 0.1,
  min,
  max,
  precision = 2,
  label,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [inputValue, setInputValue] = useState(value.toFixed(precision));
  const [isFocused, setIsFocused] = useState(false);
  const dragStartRef = useRef<{ x: number; value: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update input value when prop changes (unless focused)
  useEffect(() => {
    if (!isFocused) {
      setInputValue(value.toFixed(precision));
    }
  }, [value, precision, isFocused]);

  const clampValue = useCallback(
    (val: number) => {
      let clamped = val;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      return parseFloat(clamped.toFixed(precision));
    },
    [min, max, precision]
  );

  const handleIncrement = useCallback(() => {
    const newValue = clampValue(value + step);
    onChange(newValue);
  }, [value, step, clampValue, onChange]);

  const handleDecrement = useCallback(() => {
    const newValue = clampValue(value - step);
    onChange(newValue);
  }, [value, step, clampValue, onChange]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    },
    []
  );

  const handleInputBlur = useCallback(() => {
    setIsFocused(false);
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      const clamped = clampValue(numValue);
      onChange(clamped);
      setInputValue(clamped.toFixed(precision));
    } else {
      setInputValue(value.toFixed(precision));
    }
  }, [inputValue, value, precision, clampValue, onChange]);

  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
    inputRef.current?.select();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const multiplier = e.shiftKey ? 10 : 1;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        const newValue = clampValue(value + step * multiplier);
        onChange(newValue);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const newValue = clampValue(value - step * multiplier);
        onChange(newValue);
      } else if (e.key === "Enter") {
        inputRef.current?.blur();
      }
    },
    [value, step, clampValue, onChange]
  );

  // Drag to adjust value
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== inputRef.current) return;

      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, value };
      document.body.style.cursor = "ew-resize";
    },
    [value]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const sensitivity = e.shiftKey ? 0.01 : 0.1;
      const delta = deltaX * step * sensitivity;
      const newValue = clampValue(dragStartRef.current.value + delta);

      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      document.body.style.cursor = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
  }, [isDragging, step, clampValue, onChange]);

  return (
    <div className={cn("relative group", className)}>
      {label && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-zinc-500 pointer-events-none z-10">
          {label}
        </span>
      )}

      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        className={cn(
          "h-8 w-full rounded-md border transition-all duration-150",
          "bg-zinc-800/50 border-zinc-700 text-white text-xs",
          "focus:bg-zinc-800 focus:border-[#FF5C3D] focus:ring-1 focus:ring-[#FF5C3D]/30",
          "hover:bg-zinc-800/70 hover:border-zinc-600 hover:cursor-ew-resize",
          "outline-none",
          label ? "pl-7 pr-6" : "px-3 pr-6",
          isDragging && "cursor-ew-resize select-none bg-zinc-800 border-[#FF5C3D]"
        )}
      />

      {/* Stepper buttons */}
      <div className="absolute right-0 top-0 h-full flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={handleIncrement}
          className={cn(
            "flex items-center justify-center h-1/2 w-5 rounded-tr-md",
            "bg-zinc-700/80 hover:bg-zinc-600 active:bg-zinc-500",
            "text-zinc-300 hover:text-white transition-colors",
            "border-l border-b border-zinc-600"
          )}
          tabIndex={-1}
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={handleDecrement}
          className={cn(
            "flex items-center justify-center h-1/2 w-5 rounded-br-md",
            "bg-zinc-700/80 hover:bg-zinc-600 active:bg-zinc-500",
            "text-zinc-300 hover:text-white transition-colors",
            "border-l border-zinc-600"
          )}
          tabIndex={-1}
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
