
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Square, Circle, Minus, Eraser, Trash2, ArrowRight, Type } from 'lucide-react';
import { DrawingShape } from '../types';

interface WhiteboardProps {
  onCanvasUpdate: () => void;
}

export interface WhiteboardRef {
  getSnapshot: () => Promise<string>;
}

const Whiteboard = forwardRef<WhiteboardRef, WhiteboardProps>(({ onCanvasUpdate }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shapes, setShapes] = useState<DrawingShape[]>([]);
  const [currentTool, setCurrentTool] = useState<'rect' | 'cylinder' | 'line' | 'arrow' | 'text' | 'eraser'>('rect');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentShape, setCurrentShape] = useState<DrawingShape | null>(null);
  const [textInput, setTextInput] = useState<{ x: number, y: number, value: string } | null>(null);

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
    }
  }));

  const drawShape = (ctx: CanvasRenderingContext2D, shape: DrawingShape) => {
    ctx.beginPath();
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = 2;
    ctx.fillStyle = '#1e293b'; // slate-800

    if (shape.type === 'rect') {
      if (shape.width && shape.height) {
        ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        // Label
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '12px sans-serif';
        ctx.fillText('Service', shape.x + 5, shape.y + 15);
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
        
         // Label
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '12px sans-serif';
        ctx.fillText('DB', shape.x + w/2 - 10, shape.y + h/2);
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
        if (shape.text) {
            ctx.fillStyle = '#fff';
            ctx.font = '16px sans-serif';
            ctx.textBaseline = 'top';
            ctx.fillText(shape.text, shape.x, shape.y);
        }
    }
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

    shapes.forEach(shape => drawShape(ctx, shape));
    if (currentShape) drawShape(ctx, currentShape);
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
  }, [shapes, currentShape]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (currentTool === 'eraser' || currentTool === 'text') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPos({ x, y });
    setIsDrawing(true);
    
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
    if (!isDrawing || !currentShape) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
      }
      
      setShapes([...shapes, finalShape]);
      setCurrentShape(null);
      onCanvasUpdate();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (currentTool === 'eraser') {
        const newShapes = shapes.filter(s => {
            if (s.type === 'line' || s.type === 'arrow') return true; 
            if (s.type === 'text') {
                // Approximate text bounds
                return !(x >= s.x && x <= s.x + 100 && y >= s.y && y <= s.y + 20);
            }
            return !(x >= s.x && x <= s.x + (s.width || 0) && y >= s.y && y <= s.y + (s.height || 0));
        });
        if (newShapes.length !== shapes.length) {
            setShapes(newShapes);
            onCanvasUpdate();
        }
      } else if (currentTool === 'text') {
          if (!textInput) {
              setTextInput({ x, y, value: '' });
          } else {
              // Clicked elsewhere while typing? Commit current text
              handleTextSubmit();
              setTextInput({ x, y, value: '' }); // Start new? Or just move? Let's just start new at new pos
          }
      }
  };

  const handleTextSubmit = () => {
      if (textInput && textInput.value.trim()) {
          const newShape: DrawingShape = {
              id: Date.now().toString(),
              type: 'text',
              x: textInput.x,
              y: textInput.y,
              text: textInput.value,
              color: '#fff'
          };
          setShapes([...shapes, newShape]);
          onCanvasUpdate();
      }
      setTextInput(null);
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, tool: string) => {
      e.dataTransfer.setData('tool', tool);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const tool = e.dataTransfer.getData('tool');
      if (tool && (tool === 'rect' || tool === 'cylinder')) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const newShape: DrawingShape = {
            id: Date.now().toString(),
            type: tool as any,
            x: x - 50, // Center it roughly
            y: y - 30,
            width: 100,
            height: 60,
            color: '#94a3b8'
        };
        setShapes([...shapes, newShape]);
        onCanvasUpdate();
      }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 flex gap-2 bg-slate-800 p-2 rounded-lg shadow-lg z-10 border border-slate-700">
        <button 
          draggable
          onDragStart={(e) => handleDragStart(e, 'rect')}
          onClick={() => setCurrentTool('rect')}
          className={`p-2 rounded ${currentTool === 'rect' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white cursor-grab active:cursor-grabbing'}`}
          title="Service (Rectangle) - Drag to board"
        >
          <Square size={20} />
        </button>
        <button 
          draggable
          onDragStart={(e) => handleDragStart(e, 'cylinder')}
          onClick={() => setCurrentTool('cylinder')}
          className={`p-2 rounded ${currentTool === 'cylinder' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white cursor-grab active:cursor-grabbing'}`}
          title="Database (Cylinder) - Drag to board"
        >
          <Circle size={20} />
        </button>
        <button 
          onClick={() => setCurrentTool('line')}
          className={`p-2 rounded ${currentTool === 'line' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          title="Connection (Line)"
        >
          <Minus size={20} className="rotate-45" />
        </button>
        <button 
          onClick={() => setCurrentTool('arrow')}
          className={`p-2 rounded ${currentTool === 'arrow' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          title="Directional Connection (Arrow)"
        >
          <ArrowRight size={20} className="-rotate-45" />
        </button>
        <button 
          onClick={() => setCurrentTool('text')}
          className={`p-2 rounded ${currentTool === 'text' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          title="Text Label"
        >
          <Type size={20} />
        </button>
        
         <button 
          onClick={() => setCurrentTool('eraser')}
          className={`p-2 rounded ${currentTool === 'eraser' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
          title="Eraser (Click object to delete)"
        >
          <Eraser size={20} />
        </button>
        <div className="w-px bg-slate-700 mx-1"></div>
        <button 
          onClick={() => { setShapes([]); onCanvasUpdate(); }}
          className="p-2 rounded text-slate-400 hover:text-red-400"
          title="Clear Board"
        >
          <Trash2 size={20} />
        </button>
      </div>
      
      <div 
        className="flex-1 relative cursor-crosshair"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <canvas 
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          className="absolute inset-0"
        />
        
        {/* Text Input Overlay */}
        {textInput && (
            <input
                autoFocus
                className="absolute bg-slate-800 text-white border border-blue-500 rounded px-2 py-1 text-sm outline-none shadow-lg"
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

        {/* Helper text for empty state */}
        {shapes.length === 0 && !isDrawing && !textInput && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 text-slate-400 select-none">
                <span className="text-4xl font-bold">System Design Whiteboard</span>
            </div>
        )}
      </div>
    </div>
  );
});

export default Whiteboard;
