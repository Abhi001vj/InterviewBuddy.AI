
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Square, Circle, Minus, Eraser, Trash2, ArrowRight, Type, User, MousePointer2 } from 'lucide-react';
import { DrawingShape } from '../types';

interface WhiteboardProps {
  onCanvasUpdate: () => void;
}

export interface WhiteboardRef {
  getSnapshot: () => Promise<string>;
  getVersion: () => number;
}

const Whiteboard = forwardRef<WhiteboardRef, WhiteboardProps>(({ onCanvasUpdate }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shapes, setShapes] = useState<DrawingShape[]>([]);
  const [currentTool, setCurrentTool] = useState<'select' | 'rect' | 'cylinder' | 'line' | 'arrow' | 'text' | 'eraser' | 'actor'>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentShape, setCurrentShape] = useState<DrawingShape | null>(null);
  const [textInput, setTextInput] = useState<{ x: number, y: number, value: string, editingShapeId?: string } | null>(null);
  
  // Selection & Dragging State
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const versionRef = useRef(0);

  useImperativeHandle(ref, () => ({
    getSnapshot: async () => {
      if (!canvasRef.current) return '';
      return new Promise((resolve) => {
        canvasRef.current?.toBlob(async (blob) => {
          if (!blob) {
             resolve('');
             return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
             const base64 = (reader.result as string).split(',')[1];
             resolve(base64);
          };
          reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.8);
      });
    },
    getVersion: () => versionRef.current
  }));

  const drawShape = (ctx: CanvasRenderingContext2D, shape: DrawingShape, isSelected: boolean = false) => {
    ctx.beginPath();
    ctx.strokeStyle = isSelected ? '#3b82f6' : shape.color; // Blue if selected
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.fillStyle = '#1e293b'; // slate-800

    if (isSelected) {
        ctx.setLineDash([5, 5]);
    } else {
        ctx.setLineDash([]);
    }

    // Determine if we should draw the text (skip if currently editing this shape's text)
    const shouldDrawText = !textInput?.editingShapeId || textInput.editingShapeId !== shape.id;

    if (shape.type === 'rect') {
      if (shape.width && shape.height) {
        ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        
        if (shouldDrawText) {
            ctx.setLineDash([]); 
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '12px sans-serif';
            const label = shape.text || 'Service';
            ctx.fillText(label, shape.x + 5, shape.y + 15);
        }
      }
    } else if (shape.type === 'cylinder') {
      if (shape.width && shape.height) {
        const h = shape.height;
        const w = shape.width;
        // Top ellipse
        ctx.beginPath();
        ctx.ellipse(shape.x + w/2, shape.y, w/2, w/4, 0, 0, 2 * Math.PI);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.stroke();
        
        // Body
        ctx.beginPath();
        ctx.moveTo(shape.x, shape.y);
        ctx.lineTo(shape.x, shape.y + h);
        ctx.lineTo(shape.x + w, shape.y + h);
        ctx.lineTo(shape.x + w, shape.y);
        ctx.fill(); // fill rect behind

        // Side lines
        ctx.beginPath();
        ctx.moveTo(shape.x, shape.y);
        ctx.lineTo(shape.x, shape.y + h);
        ctx.moveTo(shape.x + w, shape.y);
        ctx.lineTo(shape.x + w, shape.y + h);
        ctx.stroke();

        // Bottom ellipse
        ctx.beginPath();
        ctx.ellipse(shape.x + w/2, shape.y + h, w/2, w/4, 0, 0, Math.PI);
        ctx.stroke();
        
        if (shouldDrawText) {
            ctx.setLineDash([]);
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '12px sans-serif';
            const label = shape.text || 'DB';
            ctx.fillText(label, shape.x + w/2 - 10, shape.y + h/2);
        }
      }
    } else if (shape.type === 'actor') {
         // Draw a stick figure or user icon
         const w = 40;
         const h = 50;
         const cx = shape.x + w/2;
         const cy = shape.y;
         
         // Head
         ctx.beginPath();
         ctx.arc(cx, cy + 10, 10, 0, Math.PI * 2);
         ctx.fillStyle = '#1e293b';
         ctx.fill();
         ctx.stroke();
         
         // Body
         ctx.beginPath();
         ctx.moveTo(cx, cy + 20);
         ctx.lineTo(cx, cy + 35);
         ctx.stroke();
         
         // Arms
         ctx.beginPath();
         ctx.moveTo(cx - 10, cy + 25);
         ctx.lineTo(cx + 10, cy + 25);
         ctx.stroke();
         
         // Legs
         ctx.beginPath();
         ctx.moveTo(cx, cy + 35);
         ctx.lineTo(cx - 10, cy + 50);
         ctx.moveTo(cx, cy + 35);
         ctx.lineTo(cx + 10, cy + 50);
         ctx.stroke();
         
         if (shouldDrawText) {
             ctx.setLineDash([]);
             ctx.fillStyle = '#cbd5e1';
             ctx.font = '12px sans-serif';
             const label = shape.text || 'User';
             ctx.fillText(label, shape.x, shape.y + 60);
         }

    } else if (shape.type === 'line' || shape.type === 'arrow') {
      if (shape.endX !== undefined && shape.endY !== undefined) {
        ctx.moveTo(shape.x, shape.y);
        ctx.lineTo(shape.endX, shape.endY);
        ctx.stroke();
        
        if (shape.type === 'arrow') {
            // Arrowhead
            const headLen = 10;
            const dx = shape.endX - shape.x;
            const dy = shape.endY - shape.y;
            const angle = Math.atan2(dy, dx);
            ctx.beginPath();
            ctx.moveTo(shape.endX, shape.endY);
            ctx.lineTo(shape.endX - headLen * Math.cos(angle - Math.PI / 6), shape.endY - headLen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(shape.endX, shape.endY);
            ctx.lineTo(shape.endX - headLen * Math.cos(angle + Math.PI / 6), shape.endY - headLen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        }
      }
    } else if (shape.type === 'text') {
        if (shape.text && shouldDrawText) {
            ctx.setLineDash([]);
            ctx.fillStyle = '#fff';
            ctx.font = '16px sans-serif';
            ctx.textBaseline = 'top';
            ctx.fillText(shape.text, shape.x, shape.y);
            
            if (isSelected) {
                const metrics = ctx.measureText(shape.text);
                ctx.strokeStyle = '#3b82f6';
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(shape.x - 4, shape.y - 4, metrics.width + 8, 24);
            }
        }
    }
    // Reset Dash
    ctx.setLineDash([]);
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.5;
    const gridSize = 20;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    shapes.forEach(shape => drawShape(ctx, shape, shape.id === selectedShapeId));
    if (currentShape) drawShape(ctx, currentShape, false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
    renderCanvas();
  }, [shapes, currentShape, selectedShapeId, textInput]);

  const hitTest = (x: number, y: number): DrawingShape | null => {
      // Check in reverse order (top to bottom)
      for (let i = shapes.length - 1; i >= 0; i--) {
          const s = shapes[i];
          if (s.type === 'rect' || s.type === 'cylinder') {
              if (x >= s.x && x <= s.x + (s.width || 0) && y >= s.y && y <= s.y + (s.height || 0)) {
                  return s;
              }
          } else if (s.type === 'actor') {
               if (x >= s.x && x <= s.x + 40 && y >= s.y && y <= s.y + 60) return s;
          } else if (s.type === 'text' && s.text) {
               // Approximate text hit box
               if (x >= s.x && x <= s.x + (s.text.length * 10) && y >= s.y && y <= s.y + 20) return s;
          } else if ((s.type === 'line' || s.type === 'arrow') && s.endX !== undefined && s.endY !== undefined) {
               // Distance to segment
               const A = x - s.x;
               const B = y - s.y;
               const C = s.endX - s.x;
               const D = s.endY - s.y;
               const dot = A * C + B * D;
               const len_sq = C * C + D * D;
               let param = -1;
               if (len_sq !== 0) param = dot / len_sq;
               let xx, yy;
               if (param < 0) { xx = s.x; yy = s.y; }
               else if (param > 1) { xx = s.endX; yy = s.endY; }
               else { xx = s.x + param * C; yy = s.y + param * D; }
               const dx = x - xx;
               const dy = y - yy;
               if ((dx * dx + dy * dy) < 100) return s; // 10px buffer
          }
      }
      return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'select') {
        const hit = hitTest(x, y);
        if (hit) {
            setSelectedShapeId(hit.id);
            setIsDragging(true);
            setDragOffset({ x: x - hit.x, y: y - hit.y });
        } else {
            setSelectedShapeId(null);
        }
        return;
    }

    if (currentTool === 'eraser') {
        // Handled in click usually, but can be drag-to-erase? Keep click for now.
        return;
    }

    if (currentTool === 'text') return; // Handled in click

    // Start Drawing
    setStartPos({ x, y });
    setIsDrawing(true);
    setSelectedShapeId(null);
    
    const newShape: DrawingShape = {
      id: Date.now().toString(),
      type: currentTool,
      x, y, 
      width: 0, height: 0,
      endX: x, endY: y,
      color: '#94a3b8'
    };
    setCurrentShape(newShape);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'select' && isDragging && selectedShapeId) {
        setShapes(prev => prev.map(s => {
            if (s.id === selectedShapeId) {
                const newX = x - dragOffset.x;
                const newY = y - dragOffset.y;
                const dx = newX - s.x;
                const dy = newY - s.y;
                
                // For lines, move endpoints too
                if ((s.type === 'line' || s.type === 'arrow') && s.endX !== undefined && s.endY !== undefined) {
                    return { ...s, x: newX, y: newY, endX: s.endX + dx, endY: s.endY + dy };
                }
                return { ...s, x: newX, y: newY };
            }
            return s;
        }));
        return;
    }

    if (!isDrawing || !currentShape) return;

    if (currentTool === 'line' || currentTool === 'arrow') {
      setCurrentShape({ ...currentShape, endX: x, endY: y });
    } else {
      setCurrentShape({ 
        ...currentShape, 
        width: x - startPos.x, 
        height: y - startPos.y 
      });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
        setIsDragging(false);
        versionRef.current += 1;
        onCanvasUpdate();
        return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentShape) {
      let finalShape = { ...currentShape };
      // Normalize rect/cylinder
      if (finalShape.type === 'rect' || finalShape.type === 'cylinder') {
        if (finalShape.width && finalShape.width < 0) {
            finalShape.x += finalShape.width;
            finalShape.width = Math.abs(finalShape.width);
        }
        if (finalShape.height && finalShape.height < 0) {
            finalShape.y += finalShape.height;
            finalShape.height = Math.abs(finalShape.height);
        }
        // Minimal size check
        if ((Math.abs(finalShape.width || 0) < 5) && (Math.abs(finalShape.height || 0) < 5)) {
            setCurrentShape(null);
            return; 
        }
      }
      
      setShapes([...shapes, finalShape]);
      setCurrentShape(null);
      versionRef.current += 1;
      onCanvasUpdate();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
      if (isDragging) return; // Don't trigger click events if we just dragged
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (currentTool === 'eraser') {
        const hit = hitTest(x, y);
        if (hit) {
            setShapes(shapes.filter(s => s.id !== hit.id));
            versionRef.current += 1;
            onCanvasUpdate();
        }
      } else if (currentTool === 'text') {
          if (!textInput) {
              setTextInput({ x, y, value: '' });
          } else {
              handleTextSubmit();
              setTextInput({ x, y, value: '' });
          }
      } else if (currentTool === 'actor') {
          const newShape: DrawingShape = {
              id: Date.now().toString(),
              type: 'actor',
              x: x - 20,
              y: y - 25,
              width: 40, 
              height: 50,
              color: '#94a3b8'
          };
          setShapes([...shapes, newShape]);
          versionRef.current += 1;
          onCanvasUpdate();
      }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
      if (currentTool !== 'select') return;
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const hit = hitTest(x, y);
      if (hit) {
          // Open text edit for this shape
          let initialText = hit.text || '';
          if (!initialText) {
             if (hit.type === 'rect') initialText = 'Service';
             if (hit.type === 'cylinder') initialText = 'DB';
             if (hit.type === 'actor') initialText = 'User';
          }
          
          setTextInput({
              x: hit.x,
              y: hit.y, // adjust for visual alignment?
              value: initialText,
              editingShapeId: hit.id
          });
      }
  };

  const handleTextSubmit = () => {
      if (textInput && textInput.value.trim()) {
          if (textInput.editingShapeId) {
              // Update existing shape text
              setShapes(prev => prev.map(s => s.id === textInput.editingShapeId ? { ...s, text: textInput.value } : s));
          } else {
              // Create new text shape
              const newShape: DrawingShape = {
                  id: Date.now().toString(),
                  type: 'text',
                  x: textInput.x,
                  y: textInput.y,
                  text: textInput.value,
                  color: '#fff'
              };
              setShapes([...shapes, newShape]);
          }
          versionRef.current += 1;
          onCanvasUpdate();
      }
      setTextInput(null);
  };

  const handleDragStart = (e: React.DragEvent, tool: string) => {
      e.dataTransfer.setData('tool', tool);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const tool = e.dataTransfer.getData('tool');
      if (tool && (tool === 'rect' || tool === 'cylinder' || tool === 'actor')) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const newShape: DrawingShape = {
            id: Date.now().toString(),
            type: tool as any,
            x: x - 50, // Center it roughly
            y: y - 30,
            width: tool === 'actor' ? 40 : 100,
            height: tool === 'actor' ? 50 : 60,
            color: '#94a3b8'
        };
        setShapes([...shapes, newShape]);
        versionRef.current += 1;
        onCanvasUpdate();
      }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 flex gap-1 bg-slate-800 p-1.5 rounded-lg shadow-xl z-10 border border-slate-700">
        <button 
          onClick={() => { setCurrentTool('select'); setSelectedShapeId(null); }}
          className={`p-2 rounded-md transition-colors ${currentTool === 'select' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          title="Select / Move"
        >
          <MousePointer2 size={18} />
        </button>
        <div className="w-px bg-slate-700 mx-1 my-1"></div>
        <button 
          draggable
          onDragStart={(e) => handleDragStart(e, 'rect')}
          onClick={() => setCurrentTool('rect')}
          className={`p-2 rounded-md transition-colors ${currentTool === 'rect' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          title="Service (Rectangle)"
        >
          <Square size={18} />
        </button>
        <button 
          draggable
          onDragStart={(e) => handleDragStart(e, 'cylinder')}
          onClick={() => setCurrentTool('cylinder')}
          className={`p-2 rounded-md transition-colors ${currentTool === 'cylinder' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          title="Database (Cylinder)"
        >
          <Circle size={18} />
        </button>
        <button 
          draggable
          onDragStart={(e) => handleDragStart(e, 'actor')}
          onClick={() => setCurrentTool('actor')}
          className={`p-2 rounded-md transition-colors ${currentTool === 'actor' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          title="User / Actor"
        >
          <User size={18} />
        </button>
        <div className="w-px bg-slate-700 mx-1 my-1"></div>
        <button 
          onClick={() => setCurrentTool('arrow')}
          className={`p-2 rounded-md transition-colors ${currentTool === 'arrow' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          title="Arrow Connection"
        >
          <ArrowRight size={18} className="-rotate-45" />
        </button>
        <button 
          onClick={() => setCurrentTool('line')}
          className={`p-2 rounded-md transition-colors ${currentTool === 'line' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          title="Line Connection"
        >
          <Minus size={18} className="rotate-45" />
        </button>
        <button 
          onClick={() => setCurrentTool('text')}
          className={`p-2 rounded-md transition-colors ${currentTool === 'text' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          title="Text Label"
        >
          <Type size={18} />
        </button>
        
        <div className="w-px bg-slate-700 mx-1 my-1"></div>
        <button 
          onClick={() => setCurrentTool('eraser')}
          className={`p-2 rounded-md transition-colors ${currentTool === 'eraser' ? 'bg-red-900/50 text-red-200 shadow-sm border border-red-900' : 'text-slate-400 hover:text-red-300 hover:bg-slate-700'}`}
          title="Eraser"
        >
          <Eraser size={18} />
        </button>
        <button 
          onClick={() => { setShapes([]); versionRef.current += 1; onCanvasUpdate(); }}
          className="p-2 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
          title="Clear Board"
        >
          <Trash2 size={18} />
        </button>
      </div>
      
      <div 
        className={`flex-1 relative ${currentTool === 'select' ? 'cursor-default' : 'cursor-crosshair'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <canvas 
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          className="absolute inset-0"
        />
        
        {textInput && (
            <input
                autoFocus
                className="absolute bg-slate-800 text-white border border-blue-500 rounded px-2 py-1 text-sm outline-none shadow-lg z-20 min-w-[100px]"
                style={{ left: textInput.x, top: textInput.y }}
                value={textInput.value}
                onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTextSubmit();
                    if (e.key === 'Escape') setTextInput(null);
                }}
                onBlur={handleTextSubmit}
                placeholder="Label..."
            />
        )}

        {shapes.length === 0 && !isDrawing && !textInput && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 text-slate-400 select-none">
                <span className="text-4xl font-bold tracking-tight">System Design Canvas</span>
            </div>
        )}
      </div>
    </div>
  );
});

export default Whiteboard;
