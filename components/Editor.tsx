import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../App';
import { geminiService } from '../services/geminiService';
import * as fabric from 'fabric';
import { 
  Type, Square, Circle, Triangle, Image as ImageIcon, MousePointer2, 
  Pencil, Layers, Settings2, Download, Undo2, Redo2, Trash2, Sparkles,
  ChevronRight, ChevronDown, Eye, EyeOff, Lock, Unlock, AlignCenter,
  AlignLeft, AlignRight, AlignVerticalJustifyStart, AlignVerticalJustifyEnd,
  Copy, Plus, Wand, Wand2, SquareDashed, Brush, Hand, Minus, Crop, MousePointer,
  ZoomIn, History, Share, MonitorUp, Palette, Frame, PlaySquare, FileText, Move, Grid3x3, Layout
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Ensure default fabric styles match audit requirements
fabric.Object.prototype.set({
  transparentCorners: false,
  cornerColor: '#0f0f0f',
  cornerStrokeColor: '#c8a96e',
  borderColor: '#c8a96e',
  cornerSize: 8,
  cornerStyle: 'circle',
});

interface EditorProps {
  assetId: string;
  onClose: () => void;
}

type Tool = 'select' | 'marquee' | 'selection-brush' | 'hand' | 'rect' | 'circle' | 'triangle' | 'line' | 'pencil' | 'text' | 'image' | 'video' | 'crop' | 'eyedropper' | 'zoom';

const Editor: React.FC<EditorProps> = ({ assetId, onClose }) => {
  const { campaigns, updateCampaign, brands, activeBrandId } = useApp();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const containerWrapperRef = useRef<HTMLDivElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const [activeObject, setActiveObject] = useState<any>(null);
  const [layers, setLayers] = useState<any[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [zoom, setZoom] = useState(1);
  const [canvasScale, setCanvasScale] = useState(1);
  const [cornerRadius, setCornerRadius] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Left Panel
  const [leftTab, setLeftTab] = useState<'ai' | 'layers' | 'assets' | 'brand'>('ai');
  const [brandKitTab, setBrandKitTab] = useState('colors');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Top Bar & Formatting
  const [assetName, setAssetName] = useState('');
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(false);

  // AI & Gen Fill
  const [isGenFillLoading, setIsGenFillLoading] = useState(false);
  const [genFillPrompt, setGenFillPrompt] = useState('');
  const [aiPromptText, setAiPromptText] = useState('');
  const [aiModel, setAiModel] = useState('gemini');
  const [aiSize, setAiSize] = useState('auto');

  // Space + Drag pan tracking
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef<{x: number, y: number} | null>(null);
  const isSpaceDown = useRef(false);
  const cursorTracker = useRef<{x: number, y: number}>({x: 0, y: 0});
  const [cursorX, setCursorX] = useState(-100);
  const [cursorY, setCursorY] = useState(-100);

  const campaign = campaigns.find(c => c.assets.some(a => a.id === assetId));
  const asset = campaign?.assets.find(a => a.id === assetId);

  useEffect(() => {
    if (asset) setAssetName(asset.name);
  }, [asset]);

  const saveHistory = useCallback((canvasInstance: fabric.Canvas = fabricCanvas.current!) => {
    if (!canvasInstance) return;
    const json = JSON.stringify(canvasInstance.toJSON());
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, json].slice(-50);
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const updateLayers = useCallback((canvasInstance: fabric.Canvas = fabricCanvas.current!) => {
    if (!canvasInstance) return;
    const objects = canvasInstance.getObjects().slice().reverse();
    setLayers(objects.map((obj: any, index) => ({
      id: obj.id || `layer-${index}`,
      name: obj.name || obj.type,
      type: obj.type,
      visible: obj.visible,
      locked: !obj.selectable,
      ref: obj,
      thumbnail: '' // Placeholder for thumbnail logic
    })));
  }, []);

  const fitToScreen = useCallback(() => {
    if (!containerWrapperRef.current || !asset) return;
    const container = containerWrapperRef.current;
    const padding = 60; // Extra padding
    const availableWidth = container.clientWidth - padding * 2;
    const availableHeight = container.clientHeight - padding * 2;
    const scaleX = availableWidth / asset.size.width;
    const scaleY = availableHeight / asset.size.height;
    // Auto-fit to 80% coverage approx
    const scale = Math.min(scaleX, scaleY, 1) * 0.8;
    setCanvasScale(scale);
    
    // Center canvas via scrolling
    setTimeout(() => {
      if (container) {
        container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
        container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
      }
    }, 50);
  }, [asset]);

  // --- Canvas Initialization ---
  useEffect(() => {
    if (!canvasContainerRef.current || !asset) return;

    let isDisposed = false;

    const canvasElement = document.createElement('canvas');
    canvasElement.width = asset.size.width;
    canvasElement.height = asset.size.height;
    canvasContainerRef.current.appendChild(canvasElement);

    const canvas = new fabric.Canvas(canvasElement, {
      backgroundColor: '#ffffff',
      width: asset.size.width,
      height: asset.size.height,
      preserveObjectStacking: true,
      selection: true,
      selectionColor: 'rgba(200,169,110,0.08)',
      selectionBorderColor: '#c8a96e',
      selectionLineWidth: 1,
    });

    fabricCanvas.current = canvas;

    fitToScreen();
    window.addEventListener('resize', fitToScreen);

    if (asset.editorState && asset.editorState !== "undefined") {
      try {
        const parsedState = JSON.parse(asset.editorState);
        canvas.loadFromJSON(parsedState, () => {
          if (isDisposed) return;
          canvas.renderAll();
          updateLayers(canvas);
          saveHistory(canvas);
        });
      } catch (err) {
        initializeDefaultCanvas(canvas);
      }
    } else {
      initializeDefaultCanvas(canvas);
    }

    function initializeDefaultCanvas(c: fabric.Canvas) {
      const text = new fabric.IText(campaign?.offer || 'New Canvas', {
        left: asset!.size.width / 2, top: asset!.size.height / 2,
        originX: 'center', originY: 'center',
        fontSize: 80,
        fontFamily: 'Cabinet Grotesk',
        fontWeight: 'bold',
        name: 'Headline'
      });
      c.add(text);
      c.renderAll();
      updateLayers(c);
      saveHistory(c);
    }

    canvas.on('selection:created', (e) => {
      const obj = e.selected?.[0];
      setActiveObject(obj || null);
      if (obj?.type === 'rect') setCornerRadius((obj as any).rx || 0);
    });
    canvas.on('selection:updated', (e) => {
      const obj = e.selected?.[0];
      setActiveObject(obj || null);
      if (obj?.type === 'rect') setCornerRadius((obj as any).rx || 0);
    });
    canvas.on('selection:cleared', () => setActiveObject(null));
    canvas.on('object:added', () => updateLayers(canvas));
    canvas.on('object:removed', () => updateLayers(canvas));
    canvas.on('object:modified', () => { updateLayers(canvas); saveHistory(canvas); });

    // Handle generative selection stroke
    canvas.on('path:created', (e: any) => {
      if (e.path && typeof e.path.stroke === 'string' && e.path.stroke.includes('139, 92, 246')) {
         e.path.set({ name: 'Selection Area', opacity: 0.8 });
      } else if (e.path) {
         e.path.set({ name: 'Drawing' });
      }
      updateLayers(canvas);
      saveHistory(canvas);
    });

    // Space + drag panning & mouse wheel zooming
    canvas.on('mouse:wheel', (opt) => {
      if (opt.e.ctrlKey) {
        // Zoom on canvas
        const delta = opt.e.deltaY;
        let newZ = canvasScale * (0.999 ** delta);
        if (newZ > 5) newZ = 5;
        if (newZ < 0.1) newZ = 0.1;
        setCanvasScale(newZ);
        opt.e.preventDefault();
        opt.e.stopPropagation();
      } else {
        // Standard scrollwheel zoom 
        setCanvasScale(s => Math.max(0.1, Math.min(5, s - opt.e.deltaY * 0.001)));
        opt.e.preventDefault();
      }
    });

    canvas.on('mouse:down', (opt) => {
      if (isSpaceDown.current || activeTool === 'hand') {
        setIsPanning(true);
        canvas.selection = false;
        const e = opt.e as MouseEvent;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    });
    canvas.on('mouse:move', (opt) => {
      if (isPanning && lastMousePos.current && containerWrapperRef.current) {
        const e = opt.e as MouseEvent;
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        containerWrapperRef.current.scrollLeft -= dx;
        containerWrapperRef.current.scrollTop -= dy;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      }
    });
    canvas.on('mouse:up', () => {
      setIsPanning(false);
      if (!isSpaceDown.current && activeTool !== 'hand') {
        canvas.selection = true;
      }
      lastMousePos.current = null;
    });

    return () => {
      isDisposed = true;
      window.removeEventListener('resize', fitToScreen);
      canvas.dispose().then(() => canvasElement.remove());
      fabricCanvas.current = null;
    };
  }, [assetId]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger global shortcuts if typing in input/textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        isSpaceDown.current = true;
        if (fabricCanvas.current) {
          fabricCanvas.current.defaultCursor = 'grab';
        }
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          if (e.shiftKey) redo(); else undo();
          e.preventDefault();
        }
        if (e.key.toLowerCase() === 'a') {
          selectActiveAll();
          e.preventDefault();
        }
        if (e.key.toLowerCase() === 'd') {
          duplicateActive();
          e.preventDefault();
        }
        if (e.key.toLowerCase() === 'g') {
          groupObjects();
          e.preventDefault();
        }
      } else {
        if (e.key === 'Escape') {
          fabricCanvas.current?.discardActiveObject();
          fabricCanvas.current?.renderAll();
          setActiveTool('select');
          setGenFillPrompt('');
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
          deleteActive();
        }
        if (e.key === '[' && activeObject) {
          activeObject.sendBackwards();
          fabricCanvas.current?.requestRenderAll();
          updateLayers(fabricCanvas.current!);
        }
        if (e.key === ']' && activeObject) {
          activeObject.bringForward();
          fabricCanvas.current?.requestRenderAll();
          updateLayers(fabricCanvas.current!);
        }

        // Tool Shortcuts
        const toolMap: Record<string, Tool> = {
          'v': 'select', 's': 'marquee', 'h': 'hand', 'r': 'rect',
          'o': 'circle', 'l': 'line', 'p': 'pencil', 't': 'text',
          'i': 'image', 'c': 'crop', 'e': 'eyedropper', 'z': 'zoom'
        };
        const key = e.key.toLowerCase();
        if (toolMap[key]) {
          handleSetTool(toolMap[key]);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpaceDown.current = false;
        if (fabricCanvas.current && activeTool !== 'hand') {
          fabricCanvas.current.defaultCursor = 'default';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  });

  const undo = () => {
    if (historyIndex > 0 && fabricCanvas.current) {
      const prevIndex = historyIndex - 1;
      const state = history[prevIndex];
      if (state) {
        fabricCanvas.current.loadFromJSON(JSON.parse(state), () => {
          fabricCanvas.current?.renderAll();
          setHistoryIndex(prevIndex);
          updateLayers(fabricCanvas.current!);
        });
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1 && fabricCanvas.current) {
      const nextIndex = historyIndex + 1;
      const state = history[nextIndex];
      if (state) {
        fabricCanvas.current.loadFromJSON(JSON.parse(state), () => {
          fabricCanvas.current?.renderAll();
          setHistoryIndex(nextIndex);
          updateLayers(fabricCanvas.current!);
        });
      }
    }
  };

  const duplicateActive = async () => {
    if (!activeObject || !fabricCanvas.current) return;
    const cloned = await activeObject.clone();
    cloned.set({ left: activeObject.left + 20, top: activeObject.top + 20 });
    fabricCanvas.current.add(cloned);
    fabricCanvas.current.setActiveObject(cloned);
    fabricCanvas.current.requestRenderAll();
    updateLayers(fabricCanvas.current);
    saveHistory(fabricCanvas.current);
  };

  const selectActiveAll = () => {
    if (!fabricCanvas.current) return;
    fabricCanvas.current.discardActiveObject();
    const objs = fabricCanvas.current.getObjects().filter(o => o.selectable);
    if (objs.length === 0) return;
    const sel = new fabric.ActiveSelection(objs, { canvas: fabricCanvas.current });
    fabricCanvas.current.setActiveObject(sel);
    fabricCanvas.current.requestRenderAll();
  };

  const deleteActive = () => {
    if (activeObject && fabricCanvas.current) {
      if (activeObject.type === 'activeSelection') {
        activeObject.forEachObject((obj: any) => fabricCanvas.current?.remove(obj));
      } else {
        fabricCanvas.current.remove(activeObject);
      }
      fabricCanvas.current.discardActiveObject();
      fabricCanvas.current.requestRenderAll();
      updateLayers(fabricCanvas.current);
      saveHistory(fabricCanvas.current);
    }
  };

  const groupObjects = () => {
    const canvas = fabricCanvas.current;
    if (!canvas || !activeObject || activeObject.type !== 'activeSelection') return;
    (activeObject as any).toGroup();
    canvas.requestRenderAll();
    updateLayers();
    saveHistory();
  };

  const handleSetTool = (t: Tool) => {
    setActiveTool(t);
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    canvas.defaultCursor = 'default';
    canvas.selection = true;

    if (t === 'pencil') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = '#e0e0e0';
      canvas.freeDrawingBrush.width = 3;
    } else if (t === 'selection-brush') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = 'rgba(139, 92, 246, 0.4)';
      canvas.freeDrawingBrush.width = 30;
    } else if (t === 'hand') {
      canvas.defaultCursor = 'grab';
      canvas.selection = false;
    }

    if (['rect', 'circle', 'triangle', 'text', 'line'].includes(t)) {
      addShape(t);
      setActiveTool('select');
    }
  };

  const addShape = (type: Tool) => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;
    let obj: any;
    const center = canvas.getVpCenter();
    const defFill = '#c8a96e';

    if (type === 'rect') obj = new fabric.Rect({ left: center.x - 50, top: center.y - 50, width: 100, height: 100, fill: defFill, rx: cornerRadius, ry: cornerRadius, name: 'Rectangle' });
    if (type === 'circle') obj = new fabric.Circle({ left: center.x - 50, top: center.y - 50, radius: 50, fill: defFill, name: 'Circle' });
    if (type === 'triangle') obj = new fabric.Triangle({ left: center.x - 50, top: center.y - 50, width: 100, height: 100, fill: defFill, name: 'Triangle' });
    if (type === 'line') obj = new fabric.Line([center.x - 50, center.y, center.x + 50, center.y], { stroke: defFill, strokeWidth: 4, name: 'Line' });
    if (type === 'text') obj = new fabric.IText('New Text', { left: center.x - 50, top: center.y - 20, fontSize: 40, fontFamily: 'Satoshi', fill: '#e0e0e0', name: 'Text' });

    if (obj) {
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
      updateLayers();
      saveHistory();
    }
  };

  const addMarquee = () => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;
    const center = canvas.getVpCenter();
    const rect = new fabric.Rect({
      left: center.x - 100, top: center.y - 100, width: 200, height: 200,
      fill: 'rgba(200,169,110,0.1)', stroke: '#c8a96e', strokeWidth: 2, strokeDashArray: [5, 5],
      name: 'Selection Area'
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas.current) return;
    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result as string;
      fabric.Image.fromURL(data).then((img) => {
        img.scaleToWidth(400);
        const center = fabricCanvas.current!.getVpCenter();
        img.set({ left: center.x, top: center.y, originX: 'center', originY: 'center', name: file.name });
        fabricCanvas.current!.add(img);
        fabricCanvas.current!.setActiveObject(img);
        updateLayers();
        saveHistory();
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!campaign || !asset || !fabricCanvas.current) return;
    const newState = JSON.stringify(fabricCanvas.current.toJSON());
    const dataUrl = fabricCanvas.current.toDataURL({ format: 'png', multiplier: 1 });
    const updatedAssets = campaign.assets.map(a => a.id === assetId ? { ...a, name: assetName, editorState: newState, dataUrl } : a);
    updateCampaign({ ...campaign, assets: updatedAssets });
    onClose();
  };

  const exportAsset = async (format: 'png' | 'jpeg' | 'svg' | 'pdf' | 'webp' | 'zip', scale: number = 1) => {
    const canvas = fabricCanvas.current;
    if (!canvas || !asset) return;
    canvas.discardActiveObject();
    canvas.renderAll();

    let filename = `${assetName.replace(/\\s+/g, '_').toLowerCase()}_${asset.size.width}x${asset.size.height}`;

    if (format === 'zip') {
      const zip = new JSZip();
      const b64 = canvas.toDataURL({ format: 'png', multiplier: scale }).split(',')[1];
      zip.file(`${filename}.png`, b64, { base64: true });
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${filename}_assets.zip`);
    } else if (format === 'svg') {
      const svgData = canvas.toSVG();
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      saveAs(blob, `${filename}.svg`);
    } else {
      const fmt = format === 'pdf' ? 'png' : format; // Fallback if no PDF converter exists
      const dataUrl = canvas.toDataURL({ format: fmt, multiplier: scale });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${filename}.${format}`;
      link.click();
    }
    setShowExportMenu(false);
  };

  const handleGenerativeFill = async () => {
    if (!fabricCanvas.current || !activeObject || !genFillPrompt.trim()) return;
    setIsGenFillLoading(true);
    try {
      const ratio = activeObject.width / activeObject.height;
      let aspectRatio = "1:1";
      if (ratio > 1.2) aspectRatio = "16:9";
      else if (ratio < 0.8) aspectRatio = "9:16";

      const imageUrl = await geminiService.generateImage(`${genFillPrompt}`, aspectRatio);
      if (imageUrl) {
        fabric.Image.fromURL(imageUrl, { crossOrigin: 'anonymous' }).then((img) => {
          img.scaleToWidth(activeObject.getScaledWidth());
          img.scaleToHeight(activeObject.getScaledHeight());
          img.set({ 
            left: activeObject.left, top: activeObject.top, angle: activeObject.angle, name: `Gen Fill` 
          });
          fabricCanvas.current!.add(img);
          if (activeObject.name === 'Selection Area') fabricCanvas.current!.remove(activeObject);
          else fabricCanvas.current!.bringObjectToFront(img);
          fabricCanvas.current!.setActiveObject(img);
          updateLayers();
          saveHistory();
          setGenFillPrompt('');
          setActiveTool('select');
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenFillLoading(false);
    }
  };

  const isSelectionActive = ['marquee', 'selection-brush'].includes(activeTool) || activeObject?.name === 'Selection Area';

  if (!asset) return null;

  return (
    <div className="fixed inset-0 bg-[#0f0f0f] z-[60] flex flex-col text-[#e0e0e0] font-sans select-none h-screen w-screen overflow-hidden">
      
      {/* Top Bar */}
      <nav className="h-14 border-b border-[#1f1f1f] bg-[#0d0d0d] flex items-center justify-between px-4 z-50 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-1 hover:bg-[#1f1f1f] rounded transition-colors text-[#888]">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          
          <div className="flex flex-col">
            <input 
              value={assetName} onChange={e => setAssetName(e.target.value)}
              className="bg-transparent text-sm font-heading font-medium tracking-wide text-white border-none outline-none focus:ring-0 max-w-[200px]"
            />
            <span className="text-[10px] text-[#888] font-mono">{asset.size.width} × {asset.size.height}px</span>
          </div>

          <div className="relative ml-2">
            <button onClick={() => setShowFormatMenu(!showFormatMenu)} className="text-[10px] bg-[#1f1f1f] hover:bg-[#2c2c2c] px-2 py-1 rounded text-[#e0e0e0] transition-colors border border-[#333] flex items-center gap-1">
              Resize Format <ChevronDown className="w-3 h-3"/>
            </button>
            {showFormatMenu && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-[#141414] border border-[#1f1f1f] rounded-lg shadow-xl overflow-hidden py-1 z-50">
                <button className="w-full text-left px-3 py-2 text-xs hover:bg-[#1f1f1f] text-[#e0e0e0]">Instagram Story (1080x1920)</button>
                <button className="w-full text-left px-3 py-2 text-xs hover:bg-[#1f1f1f] text-[#e0e0e0]">Instagram Feed (1080x1080)</button>
                <button className="w-full text-left px-3 py-2 text-xs hover:bg-[#1f1f1f] text-[#e0e0e0]">YouTube Thumb (1280x720)</button>
                <button className="w-full text-left px-3 py-2 text-xs hover:bg-[#1f1f1f] text-[#e0e0e0]">Custom...</button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Zoom and History */}
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 hover:bg-[#1f1f1f] rounded disabled:opacity-30 text-[#888]" title="Undo (Ctrl+Z)">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 hover:bg-[#1f1f1f] rounded disabled:opacity-30 text-[#888]" title="Redo (Ctrl+Shift+Z)">
            <Redo2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-[#1f1f1f] rounded text-[#888]" title="Version History">
            <History className="w-4 h-4" />
          </button>
          
          <div className="h-4 w-[1px] bg-[#333] mx-2" />
          
          <div className="flex items-center gap-1 bg-[#141414] border border-[#1f1f1f] rounded p-0.5">
            <button onClick={() => setCanvasScale(s => Math.max(0.1, s - 0.1))} className="p-1 hover:bg-[#1f1f1f] rounded"><Minus className="w-3 h-3"/></button>
            <span className="text-[10px] w-10 text-center font-mono">{Math.round(canvasScale * 100)}%</span>
            <button onClick={() => setCanvasScale(s => Math.min(5, s + 0.1))} className="p-1 hover:bg-[#1f1f1f] rounded"><Plus className="w-3 h-3"/></button>
            <button onClick={fitToScreen} className="p-1 hover:bg-[#1f1f1f] rounded border-l border-[#1f1f1f] ml-1 px-2 text-[10px]" title="Fit to Screen">Fit</button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#888] hover:bg-[#1f1f1f] hover:text-[#e0e0e0] rounded transition-colors font-medium">
            <Share className="w-3.5 h-3.5"/> Share
          </button>

          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-2 px-4 py-1.5 bg-[#c8a96e] hover:bg-[#dfc08a] text-[#0f0f0f] rounded text-xs font-bold transition-all ml-2">
              <Download className="w-3.5 h-3.5" /> Export <ChevronDown className="w-3 h-3" />
            </button>
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-[#141414] border border-[#1f1f1f] rounded-lg shadow-xl overflow-hidden z-50 font-sans">
                <div className="px-3 py-2 border-b border-[#1f1f1f]">
                  <label className="text-[9px] uppercase tracking-wider text-[#888] font-bold block mb-1">Scale</label>
                  <select className="w-full bg-[#0d0d0d] border border-[#333] text-xs p-1 rounded text-[#e0e0e0] outline-none">
                    <option value="1">1x</option>
                    <option value="2">2x</option>
                    <option value="3">3x</option>
                  </select>
                </div>
                <button onClick={() => exportAsset('png')} className="w-full text-left px-4 py-2 text-xs hover:bg-[#1f1f1f] transition-colors text-[#e0e0e0]">Save as PNG</button>
                <button onClick={() => exportAsset('jpeg')} className="w-full text-left px-4 py-2 text-xs hover:bg-[#1f1f1f] transition-colors text-[#e0e0e0]">Save as JPG</button>
                <button onClick={() => exportAsset('svg')} className="w-full text-left px-4 py-2 text-xs hover:bg-[#1f1f1f] transition-colors text-[#e0e0e0]">Save as SVG Vector</button>
                <button onClick={() => exportAsset('webp')} className="w-full text-left px-4 py-2 text-xs hover:bg-[#1f1f1f] transition-colors text-[#e0e0e0]">Save as WebP</button>
                <button onClick={() => exportAsset('pdf')} className="w-full text-left px-4 py-2 text-xs hover:bg-[#1f1f1f] transition-colors text-[#e0e0e0]">Save as PDF (Beta)</button>
                <div className="border-t border-[#1f1f1f]"></div>
                <button onClick={() => exportAsset('zip')} className="w-full text-left px-4 py-2 text-xs hover:bg-[#1f1f1f] text-[#c8a96e] transition-colors">Batch Export as ZIP</button>
              </div>
            )}
          </div>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-1.5 bg-[#1f1f1f] hover:bg-[#2c2c2c] border border-[#333] rounded text-xs font-semibold transition-all">
            Done
          </button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Fixed vertical tool strip */}
        <div className="w-12 shrink-0 bg-[#141414] border-r border-[#1f1f1f] flex flex-col items-center py-4 gap-4 z-40 relative">
          {/* Tool Group: Select & Move */}
          <div className="flex flex-col gap-1 w-full items-center">
            <TBtn t="select" active={activeTool} act={() => handleSetTool('select')} i={<MousePointer2 className="w-4 h-4"/>} title="Select (V)" />
            <TBtn t="hand" active={activeTool} act={() => handleSetTool('hand')} i={<Hand className="w-4 h-4"/>} title="Pan Tool (H)" />
          </div>
          <div className="w-6 h-[1px] bg-[#333]" />
          
          {/* Tool Group: Selection Tools */}
          <div className="flex flex-col gap-1 w-full items-center">
            <TBtn t="marquee" active={activeTool} act={() => { handleSetTool('marquee'); addMarquee(); }} i={<SquareDashed className="w-4 h-4"/>} title="Selection Marquee (S)" />
            <TBtn t="selection-brush" active={activeTool} act={() => handleSetTool('selection-brush')} i={<Brush className="w-4 h-4"/>} title="Selection Brush" />
          </div>
          <div className="w-6 h-[1px] bg-[#333]" />
          
          {/* Tool Group: Shapes & Draw */}
          <div className="flex flex-col gap-1 w-full items-center">
            <TBtn t="rect" active={activeTool} act={() => handleSetTool('rect')} i={<Square className="w-4 h-4"/>} title="Rectangle (R)" />
            <TBtn t="circle" active={activeTool} act={() => handleSetTool('circle')} i={<Circle className="w-4 h-4"/>} title="Ellipse (O)" />
            <TBtn t="line" active={activeTool} act={() => handleSetTool('line')} i={<Minus className="w-4 h-4 rotate-45"/>} title="Line (L)" />
            <TBtn t="pencil" active={activeTool} act={() => handleSetTool('pencil')} i={<Pencil className="w-4 h-4"/>} title="Pen/Draw (P)" />
          </div>
          <div className="w-6 h-[1px] bg-[#333]" />
          
          {/* Tool Group: Content Insert */}
          <div className="flex flex-col gap-1 w-full items-center">
            <TBtn t="text" active={activeTool} act={() => handleSetTool('text')} i={<Type className="w-4 h-4"/>} title="Text (T)" />
            <label className="p-2 w-9 h-9 flex items-center justify-center rounded cursor-pointer hover:bg-[#1f1f1f] text-[#888] transition-colors relative group" title="Upload Media (I)">
              <ImageIcon className="w-4 h-4" />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
            <TBtn t="video" active={activeTool} act={() => setActiveTool('video')} i={<PlaySquare className="w-4 h-4"/>} title="Video Placeholder" />
          </div>
          <div className="w-6 h-[1px] bg-[#333]" />

          {/* Tool Group: Utilities */}
          <div className="flex flex-col gap-1 w-full items-center">
            <TBtn t="crop" active={activeTool} act={() => setActiveTool('crop')} i={<Crop className="w-4 h-4"/>} title="Crop (C)" />
            <TBtn t="eyedropper" active={activeTool} act={() => setActiveTool('eyedropper')} i={<Palette className="w-4 h-4"/>} title="Eyedropper (E)" />
            <TBtn t="zoom" active={activeTool} act={() => setActiveTool('zoom')} i={<ZoomIn className="w-4 h-4"/>} title="Zoom Tool (Z)" />
          </div>
        </div>

        {/* Left Panel */}
        <aside className="w-72 shrink-0 bg-[#141414] border-r border-[#1f1f1f] flex flex-col z-40">
          <div className="flex border-b border-[#1f1f1f] shrink-0 bg-[#0d0d0d]">
            <TabBtn id="ai" active={leftTab} act={() => setLeftTab('ai')} label={<><Sparkles className="w-3 h-3 mr-1 inline"/> AI</>} />
            <TabBtn id="layers" active={leftTab} act={() => setLeftTab('layers')} label="Layers" />
            <TabBtn id="assets" active={leftTab} act={() => setLeftTab('assets')} label="Assets" />
            <TabBtn id="brand" active={leftTab} act={() => setLeftTab('brand')} label="Kit" />
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
            
            {/* AI MAGIC */}
            {leftTab === 'ai' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-heading font-medium text-sm text-[#e0e0e0] flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-[#c8a96e]"/> Campaign Brief</h4>
                  <div className="space-y-3">
                    <input placeholder="Product Name..." className="w-full bg-[#0d0d0d] border border-[#1f1f1f] text-xs p-2 rounded text-[#e0e0e0] outline-none focus:border-[#c8a96e]" />
                    <textarea placeholder="Target Audience & Goal..." rows={2} className="w-full bg-[#0d0d0d] border border-[#1f1f1f] text-xs p-2 rounded text-[#e0e0e0] outline-none focus:border-[#c8a96e] resize-none"></textarea>
                  </div>
                </div>

                <div className="border border-[#1f1f1f] rounded-lg p-3 bg-[#0d0d0d]">
                  <h4 className="font-heading text-xs font-bold text-[#888] uppercase tracking-wider mb-2">Text to Image</h4>
                  <textarea placeholder="Describe an image to generate..." rows={2} className="w-full bg-[#141414] border border-[#1f1f1f] text-xs p-2 rounded text-[#e0e0e0] outline-none mb-2 resize-none"></textarea>
                  <div className="flex gap-2 items-center">
                    <select className="flex-1 bg-[#141414] border border-[#1f1f1f] text-[10px] p-1.5 rounded outline-none text-[#aaa]">
                      <option>Photorealistic</option>
                      <option>Minimalist</option>
                      <option>Noir</option>
                      <option>Pop Art</option>
                    </select>
                    <button className="bg-[#1f1f1f] hover:bg-[#2c2c2c] border border-[#333] px-3 py-1.5 rounded text-[10px] font-bold text-[#e0e0e0]">Generate</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-heading text-xs font-bold text-[#888] uppercase tracking-wider mb-2">Automations</h4>
                  <button className="w-full p-2 bg-[#1f1f1f] hover:bg-[#c8a96e] hover:text-[#0f0f0f] border border-[#333] hover:border-[#c8a96e] rounded text-xs font-medium transition-colors flex items-center justify-between group">
                    <span>Variant Generator (Generate 3)</span> <Sparkles className="w-3 h-3 group-hover:text-[#0f0f0f] text-[#c8a96e]"/>
                  </button>
                  <button className="w-full p-2 bg-[#1f1f1f] hover:bg-[#c8a96e] hover:text-[#0f0f0f] border border-[#333] hover:border-[#c8a96e] rounded text-xs font-medium transition-colors flex items-center justify-between group">
                    <span>Remove Background</span> <Wand className="w-3 h-3 group-hover:text-[#0f0f0f] text-[#c8a96e]"/>
                  </button>
                  <button className="w-full p-2 bg-[#1f1f1f] hover:bg-[#c8a96e] hover:text-[#0f0f0f] border border-[#333] hover:border-[#c8a96e] rounded text-xs font-medium transition-colors flex items-center justify-between group">
                    <span>Magic Resize</span> <Frame className="w-3 h-3 group-hover:text-[#0f0f0f] text-[#c8a96e]"/>
                  </button>
                </div>
              </div>
            )}

            {/* LAYERS */}
            {leftTab === 'layers' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-heading text-xs font-bold text-[#888] uppercase tracking-wider">Canvas Layers</h4>
                  <button className="p-1 hover:bg-[#1f1f1f] text-[#888] hover:text-[#c8a96e] rounded" title="Add Layer"><Plus className="w-4 h-4"/></button>
                </div>
                <div className="space-y-1">
                  {layers.map((layer) => (
                    <div 
                      key={layer.id}
                      onClick={() => { fabricCanvas.current?.setActiveObject(layer.ref); fabricCanvas.current?.renderAll(); }}
                      className={cn(
                        "group flex items-center gap-2 px-2 h-8 rounded text-xs cursor-pointer border",
                        activeObject === layer.ref ? "bg-[#1f1f1f] border-[#c8a96e]/50 text-[#e0e0e0]" : "border-transparent hover:bg-[#1f1f1f] text-[#aaa]"
                      )}
                    >
                      <GripVerticalIcon className="w-3 h-3 opacity-20 hover:opacity-100 cursor-grab"/>
                      <div className="w-4 flex justify-center text-[#888]">
                        {layer.type === 'rect' && <Square className="w-3 h-3" />}
                        {layer.type === 'circle' && <Circle className="w-3 h-3" />}
                        {layer.type === 'i-text' && <Type className="w-3 h-3" />}
                        {layer.type === 'image' && <ImageIcon className="w-3 h-3" />}
                      </div>
                      <span className="flex-1 truncate select-none leading-none">{layer.name}</span>
                      <div className="flex flex-shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100">
                        <button onClick={(e) => { e.stopPropagation(); layer.ref.set('visible', !layer.visible); fabricCanvas.current?.renderAll(); updateLayers(); }} className="p-0.5 hover:text-white">
                          {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-[#555]" />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); layer.ref.set('selectable', layer.locked); fabricCanvas.current?.renderAll(); updateLayers(); }} className="p-0.5 hover:text-white">
                          {layer.locked ? <Lock className="w-3 h-3 text-[#c8a96e]" /> : <Unlock className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ASSETS */}
            {leftTab === 'assets' && (
              <div className="space-y-6">
                <input placeholder="Search assets..." className="w-full bg-[#0d0d0d] border border-[#1f1f1f] text-xs p-2 rounded text-[#e0e0e0] outline-none focus:border-[#c8a96e]" />
                
                <div>
                  <h4 className="font-heading text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Sections</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="bg-[#1f1f1f] hover:bg-[#2c2c2c] border border-[#333] p-3 rounded flex flex-col items-center gap-2 text-xs transition-colors"><Grid3x3 className="w-5 h-5 text-[#888]"/> Templates</button>
                    <button className="bg-[#1f1f1f] hover:bg-[#2c2c2c] border border-[#333] p-3 rounded flex flex-col items-center gap-2 text-xs transition-colors"><Layout className="w-5 h-5 text-[#888]"/> Elements</button>
                    <button className="bg-[#1f1f1f] hover:bg-[#2c2c2c] border border-[#333] p-3 rounded flex flex-col items-center gap-2 text-xs transition-colors"><Type className="w-5 h-5 text-[#888]"/> Fonts</button>
                    <button className="bg-[#1f1f1f] hover:bg-[#2c2c2c] border border-[#333] p-3 rounded flex flex-col items-center gap-2 text-xs transition-colors"><PlaySquare className="w-5 h-5 text-[#888]"/> Videos</button>
                  </div>
                </div>

                <div>
                  <h4 className="font-heading text-xs font-bold text-[#888] uppercase tracking-wider mb-2">Upload</h4>
                  <label className="flex flex-col items-center justify-center border border-dashed border-[#444] bg-[#0d0d0d] rounded-lg py-6 hover:border-[#c8a96e] hover:bg-[#c8a96e]/5 cursor-pointer transition-colors">
                    <MonitorUp className="w-5 h-5 text-[#888] mb-2" />
                    <span className="text-[10px] text-[#666] font-bold uppercase tracking-widest">Browse Local Files</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
            )}

            {/* BRAND KIT */}
            {leftTab === 'brand' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-heading text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Logo</h4>
                  <div className="h-16 border border-[#1f1f1f] bg-[#0d0d0d] rounded flex items-center justify-center text-[#555] text-xs hover:border-[#c8a96e] cursor-pointer cursor">
                    + Upload Brand Logo
                  </div>
                </div>

                <div>
                  <h4 className="font-heading text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Color Swatches</h4>
                  <div className="flex flex-wrap gap-2">
                    {['#f9fafb', '#111827', '#c8a96e', '#166534'].map((c, i) => (
                      <div key={i} className="w-8 h-8 rounded border border-[#333] cursor-pointer hover:scale-110 transition-transform relative group" style={{backgroundColor: c}}>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px]">-</div>
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded border border-[#333] border-dashed flex items-center justify-center cursor-pointer hover:border-[#c8a96e] text-[#555]">+</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-heading text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Typography</h4>
                  <div className="space-y-2">
                    <label className="block text-[10px] text-[#888]">Heading Font</label>
                    <select className="w-full bg-[#0d0d0d] border border-[#1f1f1f] text-xs p-2 rounded outline-none font-heading">
                      <option>Cabinet Grotesk</option>
                      <option>Cormorant</option>
                    </select>
                    <label className="block text-[10px] text-[#888] mt-2">Body Font</label>
                    <select className="w-full bg-[#0d0d0d] border border-[#1f1f1f] text-xs p-2 rounded outline-none font-sans">
                      <option>Satoshi</option>
                      <option>Inter</option>
                    </select>
                  </div>
                </div>

                <div>
                  <h4 className="font-heading text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Brand Voice</h4>
                  <textarea placeholder="e.g. Professional but approachable, using short sentences..." rows={3} className="w-full bg-[#0d0d0d] border border-[#1f1f1f] text-xs p-2 rounded text-[#e0e0e0] outline-none focus:border-[#c8a96e] resize-none"></textarea>
                </div>

                <div>
                  <h4 className="font-heading text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Style Preset</h4>
                  <select className="w-full bg-[#1f1f1f] border border-[#333] text-sm font-medium p-2 cursor-pointer rounded text-[#c8a96e] outline-none">
                    <option>Noir Luxury</option>
                    <option>Clean Minimal</option>
                    <option>Bold Editorial</option>
                    <option>Warm Lifestyle</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Workspace */}
        <div 
           className="flex-1 relative flex flex-col bg-[#0f0f0f] overflow-hidden" 
           ref={containerWrapperRef} 
           style={{cursor: isSpaceDown.current ? 'grab' : 'default'}}
           onWheel={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                setCanvasScale(s => {
                  const newScale = s * (1 - e.deltaY * 0.01);
                  return Math.min(Math.max(0.1, newScale), 5);
                });
              } else {
                if (containerWrapperRef.current) {
                  containerWrapperRef.current.scrollTop += e.deltaY;
                  containerWrapperRef.current.scrollLeft += e.deltaX;
                }
              }
           }}
           onMouseMove={(e) => {
             if (isSpaceDown.current && lastMousePos.current && containerWrapperRef.current) {
               const dx = e.clientX - lastMousePos.current.x;
               const dy = e.clientY - lastMousePos.current.y;
               containerWrapperRef.current.scrollLeft -= dx;
               containerWrapperRef.current.scrollTop -= dy;
               lastMousePos.current = { x: e.clientX, y: e.clientY };
             } else if (!isSpaceDown.current && canvasContainerRef.current) {
               const rect = canvasContainerRef.current.getBoundingClientRect();
               const cx = (e.clientX - rect.left) / canvasScale;
               const cy = (e.clientY - rect.top) / canvasScale;
               setCursorX(cx);
               setCursorY(cy);
             }
           }}
           onMouseDown={(e) => {
             if (e.button === 1 || isSpaceDown.current) {
               e.preventDefault();
               isSpaceDown.current = true;
               lastMousePos.current = { x: e.clientX, y: e.clientY };
               setIsPanning(true);
             }
           }}
           onMouseUp={() => { setIsPanning(false); lastMousePos.current = null; }}
           onMouseLeave={() => { setIsPanning(false); setCursorX(-100); setCursorY(-100); }}
        >
          
         {/* Top/Left Rulers */}
          <div className="absolute top-0 left-6 right-0 h-6 bg-[#0a0a0a] border-b border-[#1f1f1f] z-20 flex text-[9px] text-[#555] overflow-hidden select-none pointer-events-none">
            <div className="relative w-full h-full" style={{ left: 60 - (containerWrapperRef.current?.scrollLeft || 0) }}>
               {Array.from({length: Math.ceil((asset?.size.width || 3000) / 100)}).map((_, i) => (
                  <div key={i} className="absolute border-l border-[#333] h-full" style={{left: i * 100 * canvasScale}}>
                     <span className="absolute left-1 top-0.5">{i*100}</span>
                  </div>
               ))}
               <div className="absolute top-0 bottom-0 border-l border-[#c8a96e] shadow-[0_0_4px_#c8a96e] z-30" style={{left: cursorX * canvasScale, display: cursorX >= 0 ? 'block' : 'none'}}></div>
            </div>
          </div>
          <div className="absolute top-6 left-0 bottom-0 w-6 bg-[#0a0a0a] border-r border-[#1f1f1f] z-20 flex flex-col text-[9px] text-[#555] overflow-hidden select-none pointer-events-none">
            <div className="relative w-full h-full" style={{ top: 60 - (containerWrapperRef.current?.scrollTop || 0) }}>
               {Array.from({length: Math.ceil((asset?.size.height || 3000) / 100)}).map((_, i) => (
                  <div key={i} className="absolute border-t border-[#333] w-full" style={{top: i * 100 * canvasScale}}>
                     <span className="absolute top-1 rotate-90 origin-left text-center leading-none">{i*100}</span>
                  </div>
               ))}
               <div className="absolute left-0 right-0 border-t border-[#c8a96e] shadow-[0_0_4px_#c8a96e] z-30" style={{top: cursorY * canvasScale, display: cursorY >= 0 ? 'block' : 'none'}}></div>
            </div>
          </div>
          <div className="absolute top-0 left-0 w-6 h-6 bg-[#0a0a0a] border-r border-b border-[#1f1f1f] z-30 flex items-center justify-center text-[#333]"><span className="text-[8px]">px</span></div>

          {/* Generative Fill Bar */}
          {isSelectionActive && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#2c2c2c] p-2 rounded-xl border border-[#c8a96e] shadow-[0_12px_40px_rgba(0,0,0,0.8)] w-auto min-w-[450px] animate-in slide-in-from-bottom-5">
              <Wand2 className="w-4 h-4 text-[#c8a96e] ml-2" />
              <input 
                value={genFillPrompt}
                onChange={(e) => setGenFillPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerativeFill(); }}
                placeholder="Describe what to generate or fill in this area..."
                className="flex-1 bg-transparent text-sm text-white placeholder-[#888] border-none outline-none focus:ring-0 px-2"
                autoFocus
              />
              <button 
                onClick={handleGenerativeFill}
                disabled={!genFillPrompt.trim() || isGenFillLoading}
                className="bg-[#c8a96e] hover:bg-[#dfc08a] text-[#0f0f0f] px-4 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isGenFillLoading ? <><Sparkles className="w-3 h-3 animate-spin"/> Generating</> : 'Generate'}
              </button>
            </div>
          )}

          {/* Canvas Container */}
          <div className="w-full h-full p-[60px] pb-[100px] overflow-visible pr-0 pb-0">
            <div 
              className={cn("relative transition-all duration-200 ease-out origin-top-left bg-white", gridEnabled && "bg-[linear-gradient(rgba(0,0,0,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.1)_1px,transparent_1px)] bg-[size:10px_10px]")}
              style={{ 
                transform: `scale(${canvasScale})`,
                width: asset?.size.width,
                height: asset?.size.height,
                boxShadow: '0 12px 60px rgba(0,0,0,0.85)'
              }}
              ref={canvasContainerRef}
            >
            </div>
          </div>
        </div>

        {/* Right Sidebar: Properties */}
        <aside className="w-72 shrink-0 bg-[#141414] border-l border-[#1f1f1f] flex flex-col z-40 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1f1f1f] flex items-center justify-between bg-[#0d0d0d]">
            <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-[#e0e0e0]">Design</h3>
            <Settings2 className="w-3.5 h-3.5 text-[#666]" />
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
            {!activeObject ? (
              // Empty State
              <div className="space-y-6">
                <div>
                  <h4 className="font-heading text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Document</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <PropInput label="W" val={asset.size.width} disabled />
                    <PropInput label="H" val={asset.size.height} disabled />
                  </div>
                </div>
                
                <div>
                  <h4 className="font-heading text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Background</h4>
                  <div className="flex items-center justify-between bg-[#0d0d0d] border border-[#1f1f1f] rounded p-2">
                    <span className="text-xs text-[#aaa]">Canvas Color</span>
                    <div className="w-6 h-6 border border-[#333] rounded bg-white cursor-pointer hover:border-[#c8a96e]"></div>
                  </div>
                </div>

                <div>
                  <h4 className="font-heading text-xs font-bold text-[#888] uppercase tracking-wider mb-3">View Options</h4>
                  <label className="flex items-center gap-2 text-xs text-[#aaa] cursor-pointer">
                    <input type="checkbox" checked={gridEnabled} onChange={(e)=>setGridEnabled(e.target.checked)} className="accent-[#c8a96e]" />
                    Show Canvas Grid
                  </label>
                </div>

                <div>
                  <h4 className="font-heading text-xs font-bold text-[#888] uppercase tracking-wider mb-3">Page Manager</h4>
                  <div className="border border-[#1f1f1f] bg-[#0d0d0d] rounded p-3 text-center cursor-pointer hover:border-[#c8a96e]">
                    <span className="text-[10px] text-[#666] font-bold uppercase tracking-widest">+ Add Page</span>
                  </div>
                </div>
              </div>
            ) : (
              // Object Selected State
              <div className="space-y-6">
                
                {/* Dimensions */}
                <div>
                  <h4 className="font-heading text-[10px] font-bold text-[#888] uppercase tracking-wider mb-2">Dimensions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <PropInput label="X" val={Math.round(activeObject.left)} act={(v) => { activeObject.set('left', v); fabricCanvas.current?.renderAll(); }} />
                    <PropInput label="Y" val={Math.round(activeObject.top)} act={(v) => { activeObject.set('top', v); fabricCanvas.current?.renderAll(); }} />
                    <PropInput label="W" val={Math.round(activeObject.getScaledWidth())} act={(v) => { activeObject.set('scaleX', v / activeObject.width); fabricCanvas.current?.renderAll(); }} />
                    <PropInput label="H" val={Math.round(activeObject.getScaledHeight())} act={(v) => { activeObject.set('scaleY', v / activeObject.height); fabricCanvas.current?.renderAll(); }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <PropInput label="R°" val={Math.round(activeObject.angle || 0)} act={(v) => { activeObject.set('angle', v); fabricCanvas.current?.renderAll(); }} />
                    {activeObject.type === 'rect' && (
                      <div className="flex items-center gap-2 bg-[#0d0d0d] px-2 py-1 rounded border border-[#1f1f1f]">
                        <span className="text-[9px] font-bold text-[#888] w-4">rx</span>
                        <input type="number" value={cornerRadius} onChange={(e) => { const v = parseInt(e.target.value)||0; setCornerRadius(v); activeObject.set({rx: v, ry: v}); fabricCanvas.current?.renderAll(); }} className="bg-transparent border-none text-xs w-full focus:outline-none placeholder-[#333]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Text Formatting */}
                {activeObject.type === 'i-text' && (
                  <div>
                    <h4 className="font-heading text-[10px] font-bold text-[#888] uppercase tracking-wider mb-2">Typography</h4>
                    <div className="space-y-2">
                      <select onChange={e => {activeObject.set('fontFamily', e.target.value); fabricCanvas.current?.renderAll();}} className="w-full bg-[#0d0d0d] border border-[#1f1f1f] text-xs p-1.5 rounded outline-none text-[#e0e0e0]">
                        <option>Satoshi</option>
                        <option>Cabinet Grotesk</option>
                        <option>Cormorant</option>
                        <option>Inter</option>
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <select onChange={e => {activeObject.set('fontWeight', e.target.value); fabricCanvas.current?.renderAll();}} className="bg-[#0d0d0d] border border-[#1f1f1f] text-xs p-1.5 rounded outline-none text-[#e0e0e0]">
                          <option value="normal">Regular</option>
                          <option value="500">Medium</option>
                          <option value="bold">Bold</option>
                          <option value="900">Black</option>
                        </select>
                        <PropInput label="Sz" val={activeObject.fontSize} act={v => {activeObject.set('fontSize', v); fabricCanvas.current?.renderAll();}} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <PropInput label="LH" val={activeObject.lineHeight || 1.16} act={v => {activeObject.set('lineHeight', v); fabricCanvas.current?.renderAll();}} />
                        <PropInput label="LS" val={activeObject.charSpacing || 0} act={v => {activeObject.set('charSpacing', v); fabricCanvas.current?.renderAll();}} />
                      </div>
                      
                      {/* Alignment + Color */}
                      <div className="flex gap-1 justify-between pt-1">
                        <div className="flex bg-[#0d0d0d] border border-[#1f1f1f] p-0.5 rounded">
                           <button onClick={()=> {activeObject.set('textAlign', 'left'); fabricCanvas.current?.renderAll();}} className="p-1 hover:bg-[#1f1f1f] rounded text-[#aaa]"><AlignLeft className="w-3.5 h-3.5" /></button>
                           <button onClick={()=> {activeObject.set('textAlign', 'center'); fabricCanvas.current?.renderAll();}} className="p-1 hover:bg-[#1f1f1f] rounded text-[#aaa]"><AlignCenter className="w-3.5 h-3.5" /></button>
                           <button onClick={()=> {activeObject.set('textAlign', 'right'); fabricCanvas.current?.renderAll();}} className="p-1 hover:bg-[#1f1f1f] rounded text-[#aaa]"><AlignRight className="w-3.5 h-3.5" /></button>
                        </div>
                        <input type="color" value={activeObject.fill} onChange={(e) => { activeObject.set('fill', e.target.value); fabricCanvas.current?.renderAll(); }} className="w-7 h-7 bg-transparent border-none cursor-pointer rounded overflow-hidden" />
                      </div>

                      <div className="pt-2">
                        <button className="text-[10px] w-full text-left font-bold text-[#c8a96e] hover:underline uppercase tracking-widest">+ Add Effect (Outline/Shadow)</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Image Specifics */}
                {activeObject.type === 'image' && (
                  <div>
                    <h4 className="font-heading text-[10px] font-bold text-[#888] uppercase tracking-wider mb-2">Image Setup</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button className="bg-[#1f1f1f] hover:bg-[#2c2c2c] border border-[#333] py-1.5 rounded text-[10px] font-bold text-[#e0e0e0] flex items-center justify-center gap-1"><Crop className="w-3 h-3"/> Crop Image</button>
                        <button className="bg-[#1f1f1f] hover:bg-[#2c2c2c] border border-[#333] py-1.5 rounded text-[10px] font-bold text-[#e0e0e0] flex items-center justify-center gap-1"><SquareDashed className="w-3 h-3"/> Create Mask</button>
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888] mb-1 block">Blend Mode</label>
                        <select onChange={e => {activeObject.set('globalCompositeOperation', e.target.value); fabricCanvas.current?.renderAll();}} className="w-full bg-[#0d0d0d] border border-[#1f1f1f] text-xs p-1.5 rounded outline-none text-[#e0e0e0]">
                          <option value="source-over">Normal</option>
                          <option value="multiply">Multiply</option>
                          <option value="screen">Screen</option>
                          <option value="overlay">Overlay</option>
                          <option value="darken">Darken</option>
                          <option value="lighten">Lighten</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888] mb-1 block flex justify-between">Brightness <span>0</span></label>
                        <input type="range" min="-1" max="1" step="0.01" className="w-full h-1 bg-[#333] accent-[#c8a96e] appearance-none rounded" defaultValue="0" />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888] mb-1 block flex justify-between">Contrast <span>0</span></label>
                        <input type="range" min="-1" max="1" step="0.01" className="w-full h-1 bg-[#333] accent-[#c8a96e] appearance-none rounded" defaultValue="0" />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#888] mb-1 block flex justify-between">Saturation <span>0</span></label>
                        <input type="range" min="-1" max="1" step="0.01" className="w-full h-1 bg-[#333] accent-[#c8a96e] appearance-none rounded" defaultValue="0" />
                      </div>
                      <div className="pt-2 border-t border-[#1f1f1f]">
                        <h4 className="font-heading text-[10px] font-bold text-[#888] uppercase tracking-wider mb-2 mt-2">Filters</h4>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                          <button className="w-12 h-12 shrink-0 bg-[#0d0d0d] border border-[#333] rounded hover:border-[#c8a96e] flex items-center justify-center text-[8px] text-[#888]">None</button>
                          <button className="w-12 h-12 shrink-0 bg-[#0d0d0d] border border-[#333] rounded hover:border-[#c8a96e] flex items-center justify-center text-[8px] text-zinc-500 saturate-0">B&W</button>
                          <button className="w-12 h-12 shrink-0 bg-[#0d0d0d] border border-[#333] rounded hover:border-[#c8a96e] flex items-center justify-center text-[8px] text-amber-700 sepia">Sepia</button>
                          <button className="w-12 h-12 shrink-0 bg-[#0d0d0d] border border-[#333] rounded hover:border-[#c8a96e] flex items-center justify-center text-[8px] text-blue-300 hue-rotate-[180deg]">Cool</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appearance (Fill, Stroke, Opacity) */}
                {['rect', 'circle', 'triangle', 'path', 'line'].includes(activeObject.type) && (
                  <div>
                    <h4 className="font-heading text-[10px] font-bold text-[#888] uppercase tracking-wider mb-2">Colors</h4>
                    <div className="space-y-3 bg-[#0d0d0d] border border-[#1f1f1f] rounded p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#aaa]">Fill</span>
                        <input type="color" value={activeObject.fill || '#000000'} onChange={(e) => { activeObject.set('fill', e.target.value); fabricCanvas.current?.renderAll(); }} className="w-6 h-6 bg-transparent border-none cursor-pointer p-0" />
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-[#1f1f1f]">
                        <span className="text-xs text-[#aaa]">Stroke Color</span>
                        <input type="color" value={activeObject.stroke || '#000000'} onChange={(e) => { activeObject.set('stroke', e.target.value); fabricCanvas.current?.renderAll(); }} className="w-6 h-6 bg-transparent border-none cursor-pointer p-0" />
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-[#1f1f1f]">
                        <span className="text-xs text-[#aaa] w-1/3">Stroke W</span>
                        <input type="range" min="0" max="50" value={activeObject.strokeWidth || 0} onChange={(e) => { activeObject.set('strokeWidth', parseInt(e.target.value)); fabricCanvas.current?.renderAll(); }} className="flex-1 h-1 bg-[#333] accent-[#c8a96e] appearance-none rounded" />
                        <span className="text-[10px] text-[#888] w-6 text-right">{Math.round(activeObject.strokeWidth || 0)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-heading text-[10px] font-bold text-[#888] uppercase tracking-wider mb-2">Opacity</h4>
                  <div className="flex items-center gap-2">
                    <input type="range" min="0" max="1" step="0.01" value={activeObject.opacity} onChange={(e) => { activeObject.set('opacity', parseFloat(e.target.value)); fabricCanvas.current?.renderAll(); }} className="flex-1 h-1 bg-[#333] accent-[#c8a96e] appearance-none rounded cursor-pointer" />
                    <span className="text-[10px] text-[#888] w-8 text-right font-mono">{Math.round(activeObject.opacity * 100)}%</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1f1f1f] space-y-2">
                  <div className="grid grid-cols-4 gap-1 w-full bg-[#0d0d0d] border border-[#1f1f1f] p-0.5 rounded">
                     <button onClick={() => { fabricCanvas.current?.centerObjectH(activeObject); fabricCanvas.current?.renderAll(); }} className="p-1 hover:bg-[#1f1f1f] rounded text-[#aaa] flex justify-center"><AlignCenter className="w-3 h-3" /></button>
                     <button onClick={() => { fabricCanvas.current?.centerObjectV(activeObject); fabricCanvas.current?.renderAll(); }} className="p-1 hover:bg-[#1f1f1f] rounded text-[#aaa] flex justify-center"><AlignCenter className="w-3 h-3 rotate-90" /></button>
                     <button onClick={() => { activeObject.bringForward(); fabricCanvas.current?.renderAll(); updateLayers(); }} className="p-1 hover:bg-[#1f1f1f] rounded text-[#aaa] text-[9px] font-bold flex justify-center">UP</button>
                     <button onClick={() => { activeObject.sendBackwards(); fabricCanvas.current?.renderAll(); updateLayers(); }} className="p-1 hover:bg-[#1f1f1f] rounded text-[#aaa] text-[9px] font-bold flex justify-center">DN</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={duplicateActive} className="py-2.5 bg-[#1f1f1f] hover:bg-[#2c2c2c] border border-[#333] rounded text-[10px] font-bold text-[#e0e0e0] uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"><Copy className="w-3 h-3"/> Duplicate</button>
                    <button onClick={deleteActive} className="py-2.5 hover:bg-red-500/10 text-[#d95f5f] rounded border border-[#d95f5f]/30 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"><Trash2 className="w-3 h-3"/> Delete</button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
};

// Subcomponents

const TBtn = ({ active, t, act, i, title }: { active: string, t: string, act: () => void, i: React.ReactNode, title: string }) => (
  <button 
    onClick={act} title={title}
    className={cn(
      "p-2 w-9 h-9 flex items-center justify-center rounded transition-all group relative",
      active === t ? "bg-[#c8a96e] text-[#0f0f0f] shadow-[0_0_10px_rgba(200,169,110,0.3)] shadow-[#c8a96e]" : "hover:bg-[#1f1f1f] text-[#888] hover:text-[#c8a96e]"
    )}
  >
    {i}
    <span className="absolute left-full ml-3 bg-[#0d0d0d] border border-[#1f1f1f] text-[#e0e0e0] px-2 py-1 text-[10px] font-medium rounded opacity-0 pointer-events-none group-hover:opacity-100 whitespace-nowrap z-50">
      {title}
    </span>
  </button>
);

const TabBtn = ({ id, active, act, label }: { id: string, active: string, act: () => void, label: React.ReactNode }) => (
  <button 
    onClick={act}
    className={cn(
      "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-colors",
      active === id ? "border-[#c8a96e] text-[#c8a96e] bg-[#1a1a1a]" : "border-transparent text-[#666] hover:text-[#aaa]"
    )}
  >
    {label}
  </button>
);

const PropInput = ({ label, val, act, disabled }: { label: string, val: any, act?: (v: number) => void, disabled?: boolean }) => (
  <div className="flex items-center gap-2 bg-[#0d0d0d] px-2 py-1.5 rounded border border-[#1f1f1f]">
    <span className="text-[9px] font-bold text-[#888] w-3">{label}</span>
    <input type="number" disabled={disabled} value={Number.isNaN(val) ? '' : val} onChange={(e) => act && act(parseFloat(e.target.value) || 0)} className="bg-transparent border-none text-xs w-full focus:outline-none placeholder-[#333] text-[#e0e0e0]" />
  </div>
);

// Little spacer for grab handle icon
const GripVerticalIcon = ({className}: {className?: string}) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>
  </svg>
);

export default Editor;
