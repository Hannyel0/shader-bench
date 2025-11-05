/**
 * Centralized Shadertoy compatibility layer
 * Simplified approach: Extract defines and mainImage, keep everything else intact
 */

export class ShaderCompat {
  /**
   * Convert Shadertoy shader to WebGL2-compatible GLSL
   * Uses simple extraction instead of complex parsing
   */
  static convertShadertoy(source: string): string {
    // Remove any existing #version directive
    let cleanSource = source.replace(/#version\s+\d+\s+es\s*/gi, '');
    
    // Extract #define statements (must be at top)
    const defines: string[] = [];
    cleanSource = cleanSource.replace(/^(#define\s+.+)$/gm, (match) => {
      defines.push(match);
      return ''; // Remove from source
    });
    
    // Find and extract mainImage function
    const mainImageMatch = this.extractMainImage(cleanSource);
    if (!mainImageMatch) {
      throw new Error('No mainImage() function found. Ensure your shader contains:\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) { ... }');
    }
    
    const { mainImageCode, remainingCode } = mainImageMatch;
    
    // Clean up the remaining code (remove excessive blank lines)
    const bodyCode = remainingCode
      .split('\n')
      .filter(line => line.trim() !== '' || line.includes('//')) // Keep comments
      .join('\n')
      .trim();
    
    // Assemble the final shader
    return `#version 300 es
precision highp float;

// Shadertoy uniforms
uniform vec3 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int iFrame;
uniform vec4 iMouse;
uniform vec4 iDate;

out vec4 fragColor;

${defines.length > 0 ? '// User defines\n' + defines.join('\n') + '\n' : ''}
${bodyCode.length > 0 ? '// User code (globals and functions)\n' + bodyCode + '\n' : ''}
// User mainImage function
${mainImageCode}

// WebGL entry point
void main() {
  mainImage(fragColor, gl_FragCoord.xy);
}
`;
  }

  /**
   * Extract mainImage function using brace-matching
   * Returns the function and the remaining code
   */
  private static extractMainImage(source: string): { 
    mainImageCode: string; 
    remainingCode: string;
  } | null {
    // Find the start of mainImage function
    const mainImageRegex = /void\s+mainImage\s*\(\s*out\s+vec4\s+\w+\s*,\s*in\s+vec2\s+\w+\s*\)/;
    const match = source.match(mainImageRegex);
    
    if (!match || match.index === undefined) {
      return null;
    }
    
    const startIndex = match.index;
    const signatureEndIndex = startIndex + match[0].length;
    
    // Find the opening brace
    let braceStart = signatureEndIndex;
    while (braceStart < source.length && source[braceStart] !== '{') {
      braceStart++;
    }
    
    if (braceStart >= source.length) {
      return null; // No opening brace found
    }
    
    // Match braces to find the end of the function
    let braceCount = 0;
    let pos = braceStart;
    let inString = false;
    let inComment = false;
    let inLineComment = false;
    
    while (pos < source.length) {
      const char = source[pos];
      const nextChar = pos + 1 < source.length ? source[pos + 1] : '';
      
      // Handle line comments
      if (char === '/' && nextChar === '/' && !inString && !inComment) {
        inLineComment = true;
        pos += 2;
        continue;
      }
      
      if (inLineComment && char === '\n') {
        inLineComment = false;
        pos++;
        continue;
      }
      
      if (inLineComment) {
        pos++;
        continue;
      }
      
      // Handle block comments
      if (char === '/' && nextChar === '*' && !inString && !inLineComment) {
        inComment = true;
        pos += 2;
        continue;
      }
      
      if (inComment && char === '*' && nextChar === '/') {
        inComment = false;
        pos += 2;
        continue;
      }
      
      if (inComment) {
        pos++;
        continue;
      }
      
      // Handle strings
      if (char === '"' && !inComment && !inLineComment) {
        inString = !inString;
        pos++;
        continue;
      }
      
      // Count braces (only if not in string or comment)
      if (!inString && !inComment && !inLineComment) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          
          // If we've closed all braces, we found the end
          if (braceCount === 0) {
            const mainImageCode = source.substring(startIndex, pos + 1);
            const remainingCode = source.substring(0, startIndex) + source.substring(pos + 1);
            return { mainImageCode, remainingCode };
          }
        }
      }
      
      pos++;
    }
    
    return null; // Unmatched braces
  }

  /**
   * Validate shader with full WebGL context test
   */
  static async validateShader(source: string): Promise<{
    valid: boolean;
    wrappedCode?: string;
    error?: string;
    warnings?: string[];
  }> {
    try {
      // Check for mainImage before attempting conversion
      if (!source.includes('mainImage')) {
        return {
          valid: false,
          error: 'Missing mainImage() function. Shadertoy shaders must include:\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  // your code\n}'
        };
      }
      
      // Parse and wrap
      let wrapped: string;
      try {
        wrapped = this.convertShadertoy(source);
      } catch (error) {
        return {
          valid: false,
          error: error instanceof Error ? error.message : 'Failed to parse shader structure'
        };
      }
      
      // Create validation context
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const gl = canvas.getContext('webgl2', { 
        failIfMajorPerformanceCaveat: false 
      });

      if (!gl) {
        return {
          valid: false,
          error: 'WebGL2 not available in this browser'
        };
      }

      // Vertex shader
      const vertexSource = `#version 300 es
        precision highp float;
        in vec2 position;
        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
        }`;
      
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      if (!vertexShader) throw new Error('Failed to create vertex shader');
      
      gl.shaderSource(vertexShader, vertexSource);
      gl.compileShader(vertexShader);
      
      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        throw new Error('Internal vertex shader error');
      }

      // Compile fragment shader
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      if (!fragmentShader) throw new Error('Failed to create fragment shader');
      
      gl.shaderSource(fragmentShader, wrapped);
      gl.compileShader(fragmentShader);

      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        const errorLog = gl.getShaderInfoLog(fragmentShader) || 'Unknown compilation error';
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return {
          valid: false,
          error: this.formatShaderError(errorLog, wrapped)
        };
      }

      // Create and link program
      const program = gl.createProgram();
      if (!program) throw new Error('Failed to create program');
      
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const errorLog = gl.getProgramInfoLog(program) || 'Unknown linking error';
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return {
          valid: false,
          error: `Shader linking failed:\n${errorLog}` 
        };
      }

      // Test render
      gl.useProgram(program);
      gl.viewport(0, 0, 1, 1);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      // Set basic uniforms
      const iResLoc = gl.getUniformLocation(program, 'iResolution');
      const iTimeLoc = gl.getUniformLocation(program, 'iTime');
      if (iResLoc) gl.uniform3f(iResLoc, 1, 1, 1);
      if (iTimeLoc) gl.uniform1f(iTimeLoc, 0);

      // Create geometry
      const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      
      const posLoc = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      // Attempt draw
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      
      const glError = gl.getError();
      const warnings: string[] = [];
      if (glError !== gl.NO_ERROR) {
        warnings.push(`WebGL warning during render: error code ${glError}`);
      }

      // Cleanup
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(buffer);

      return {
        valid: true,
        wrappedCode: wrapped,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }

  /**
   * Format shader errors with context
   */
  private static formatShaderError(error: string, wrappedCode: string): string {
    // Extract line number and message
    const lineMatch = error.match(/ERROR:\s*\d+:(\d+):\s*(.+)/i);
    if (!lineMatch) {
      return error; // Return as-is if we can't parse it
    }
    
    const lineNum = parseInt(lineMatch[1], 10);
    const message = lineMatch[2].trim();
    
    // Get the actual line from wrapped code
    const lines = wrappedCode.split('\n');
    const errorLineIndex = lineNum - 1;
    
    if (errorLineIndex >= 0 && errorLineIndex < lines.length) {
      const errorLine = lines[errorLineIndex].trim();
      
      // Try to give context
      const contextStart = Math.max(0, errorLineIndex - 2);
      const contextEnd = Math.min(lines.length, errorLineIndex + 3);
      const context = lines
        .slice(contextStart, contextEnd)
        .map((line, idx) => {
          const actualLineNum = contextStart + idx + 1;
          const marker = actualLineNum === lineNum ? '>>> ' : '    ';
          return `${marker}${actualLineNum.toString().padStart(4)}: ${line}`;
        })
        .join('\n');
      
      return `${message}\n\nLine ${lineNum}:\n\n${context}`;
    }
    
    return `Line ${lineNum}: ${message}`;
  }
}
