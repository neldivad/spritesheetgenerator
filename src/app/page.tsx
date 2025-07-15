// To enable GIF previews, run: npm install gifshot
"use client";
import React, { useRef, useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove as dndArrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const COLS = 8;
const MIN_IMAGES = 8;
const SCALE_MIN = 5;
const SCALE_MAX = 400;

function getValidScale(baseW: number, baseH: number, scale: number, nRows: number) {
  let scaledW = Math.round((baseW * scale) / 100);
  let scaledH = Math.round((baseH * scale) / 100);
  scaledW = Math.round(scaledW / COLS) * COLS;
  scaledH = Math.round(scaledH / nRows) * nRows;
  return { scaledW, scaledH };
}

function SortableImage({ id, url, onRemove }: { id: string; url: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex flex-col items-center cursor-move"
      {...attributes}
      {...listeners}
    >
      <img src={url} alt={id} className="w-16 h-16 object-contain border rounded" />
      <button
        className="px-1 text-xs bg-red-400 text-white rounded mt-1"
        onClick={onRemove}
        type="button"
      >🗑️</button>
    </div>
  );
}

export default function SpriteSheetGenerator() {
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [gifUrls, setGifUrls] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spriteSize, setSpriteSize] = useState({ w: 64, h: 64 });
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [outputReady, setOutputReady] = useState(false);
  const [pendingScale, setPendingScale] = useState(100);
  const [previewSnapshot, setPreviewSnapshot] = useState<{urls: string[], scale: number, spriteSize: {w: number, h: number}} | null>(null);
  const [gifSnapshot, setGifSnapshot] = useState<{urls: string[], spriteSize: {w: number, h: number}, speed: number} | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingGif, setLoadingGif] = useState(false);
  const [gifSpeed, setGifSpeed] = useState(0.1); // seconds per frame

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    if (files.length === 0) return;
    const newUrls = files.map(f => URL.createObjectURL(f));
    setUrls(newUrls);
    return () => newUrls.forEach(u => URL.revokeObjectURL(u));
  }, [files]);

  useEffect(() => {
    if (!urls[0]) return;
    const img = new window.Image();
    img.onload = () => setSpriteSize({ w: img.width, h: img.height });
    img.src = urls[0];
  }, [urls]);

  // GIF generation (only after simulateGif)
  useEffect(() => {
    if (!gifSnapshot || gifSnapshot.urls.length < MIN_IMAGES) { setGifUrls([]); setLoadingGif(false); return; }
    setLoadingGif(true);
    const { urls: gifUrlsSnap, spriteSize: gifSpriteSize, speed } = gifSnapshot;
    const rows = Math.ceil(gifUrlsSnap.length / COLS);
    async function generateGifs() {
      try {
        const gifshot = (await import('gifshot')).default || (await import('gifshot'));
        const makeGif = (row: number) =>
          new Promise<string>((resolve) => {
            gifshot.createGIF({
              images: gifUrlsSnap.slice(row * COLS, (row + 1) * COLS),
              gifWidth: gifSpriteSize.w,
              gifHeight: gifSpriteSize.h,
              interval: speed,
            }, (obj: { image?: string }) => resolve(obj.image || ""));
          });
        const gifs: string[] = [];
        for (let r = 0; r < rows; ++r) {
          gifs.push(await makeGif(r));
        }
        setGifUrls(gifs);
      } catch (e) {
        setGifUrls([]);
      } finally {
        setLoadingGif(false);
      }
    }
    generateGifs();
  }, [gifSnapshot]);

  // Spritesheet preview
  useEffect(() => {
    if (!previewSnapshot || !outputReady || previewSnapshot.urls.length < MIN_IMAGES || !canvasRef.current) return;
    setLoadingPreview(true);
    const { urls: previewUrls, scale: previewScaleSnap, spriteSize: previewSpriteSize } = previewSnapshot;
    const rows = Math.ceil(previewUrls.length / COLS);
    const { scaledW, scaledH } = getValidScale(previewSpriteSize.w * COLS, previewSpriteSize.h * rows, previewScaleSnap, rows);
    const canvas = canvasRef.current;
    canvas.width = scaledW;
    canvas.height = scaledH;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setLoadingPreview(false); return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let loaded = 0;
    previewUrls.forEach((url, i) => {
      const img = new window.Image();
      img.onload = () => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        ctx.drawImage(
          img,
          col * (scaledW / COLS),
          row * (scaledH / rows),
          scaledW / COLS,
          scaledH / rows
        );
        loaded++;
        if (loaded === previewUrls.length) setLoadingPreview(false);
      };
      img.onerror = () => {
        loaded++;
        if (loaded === previewUrls.length) setLoadingPreview(false);
      };
      img.src = url;
    });
  }, [previewSnapshot, outputReady]);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement> | FileList) {
    let filesArr: File[] = [];
    if (e instanceof FileList) {
      filesArr = Array.from(e);
    } else {
      filesArr = Array.from(e.target.files || []);
    }
    setFiles(prev => [...prev, ...filesArr]);
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }
  function handleDragLeave(_e: React.DragEvent<HTMLDivElement>) {
    setDragActive(false);
  }
  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }
  function handleClickInput() {
    inputRef.current?.click();
  }

  function handleDndEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId !== overId) {
      const oldIndex = files.findIndex((_, i) => i.toString() === activeId);
      const newIndex = files.findIndex((_, i) => i.toString() === overId);
      setFiles((files) => dndArrayMove(files, oldIndex, newIndex));
    }
  }

  function remove(idx: number) {
    setFiles(files => files.filter((_, i) => i !== idx));
  }

  function downloadSpritesheet() {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "spritesheet.png";
    a.click();
  }

  function handleUpdatePreview() {
    setLoadingPreview(true);
    setPreviewSnapshot({
      urls: urls.filter(Boolean),
      scale: pendingScale,
      spriteSize: { ...spriteSize },
    });
    setOutputReady(true);
  }
  function handleResetOutput() {
    setOutputReady(false);
    setGifUrls([]);
    setLoadingPreview(false);
    setLoadingGif(false);
  }
  function handleSimulateGif() {
    setLoadingGif(true);
    setGifSnapshot({
      urls: previewSnapshot ? previewSnapshot.urls.filter(Boolean) : [],
      spriteSize: previewSnapshot ? { ...previewSnapshot.spriteSize } : { w: 0, h: 0 },
      speed: gifSpeed,
    });
  }
  function handleGifParamChange(e: React.ChangeEvent<HTMLInputElement>) {
    setGifSpeed(Number(e.target.value));
  }
  function handleScaleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPendingScale(Number(e.target.value));
  }

  const fileIds = files.map((_, i) => i.toString());
  const rows = previewSnapshot ? Math.ceil(previewSnapshot.urls.length / COLS) : 0;
  const { scaledW, scaledH } = previewSnapshot
    ? getValidScale(
        previewSnapshot.spriteSize.w * COLS,
        previewSnapshot.spriteSize.h * rows,
        previewSnapshot.scale,
        rows
      )
    : { scaledW: 0, scaledH: 0 };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 p-4">
      <div
        className={`bg-white rounded-xl shadow-lg p-8 flex flex-col gap-6 w-full max-w-2xl transition border-2 ${dragActive ? "border-blue-400 bg-blue-50" : "border-transparent"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <h1 className="text-2xl font-bold text-center mb-2">SpriteSheet Generator</h1>
        <div
          className="w-full cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition"
          onClick={handleClickInput}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="hidden"
            ref={inputRef}
          />
          <div className="text-gray-600">Click or drag & drop images here</div>
        </div>
        <div className="text-sm text-gray-600">Upload as many images as you want. 8 per row. Drag to rearrange. Remove with trash. At least 8 images required to generate a spritesheet.</div>
        {urls.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDndEnd}>
            <SortableContext items={fileIds} strategy={horizontalListSortingStrategy}>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-8 gap-2 my-4">
                  {files.map((file, i) => (
                    <SortableImage
                      key={i}
                      id={i.toString()}
                      url={urls[i]}
                      onRemove={() => remove(i)}
                    />
                  ))}
                </div>
              </div>
            </SortableContext>
          </DndContext>
        )}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <button
              className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition"
              onClick={handleUpdatePreview}
              disabled={files.length < MIN_IMAGES || loadingPreview || loadingGif}
            >
              Update Preview
            </button>
            <button
              className="bg-gray-300 text-gray-800 rounded px-4 py-2 font-semibold hover:bg-gray-400 transition"
              onClick={handleResetOutput}
              disabled={!outputReady || loadingPreview || loadingGif}
            >
              Reset Output
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-sm">Scale:</label>
            <input
              type="range"
              min={SCALE_MIN}
              max={SCALE_MAX}
              value={pendingScale}
              onChange={handleScaleChange}
              className="w-40"
              disabled={loadingPreview || loadingGif}
            />
            <span className="text-xs">{pendingScale}%</span>
          </div>
        </div>
        {outputReady && previewSnapshot && previewSnapshot.urls.length >= MIN_IMAGES && (
          <>
            <div className="flex flex-col items-center">
              {loadingPreview ? (
                <div className="text-blue-600 font-semibold my-4">Loading...</div>
              ) : null}
              <canvas
                ref={canvasRef}
                style={{
                  maxWidth: "100%",
                  border: "1px solid #ccc",
                  borderRadius: "0.5rem",
                  background: "#eee",
                  margin: "auto"
                }}
                width={scaledW}
                height={scaledH}
              />
              <div className="text-xs text-gray-500 mt-2">Spritesheet Preview ({scaledW} x {scaledH} px)</div>
              <button
                className="mt-2 bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition"
                onClick={downloadSpritesheet}
                disabled={previewSnapshot.urls.length % 8 !== 0 || loadingPreview || loadingGif}
              >
                Download Spritesheet
              </button>
              {previewSnapshot.urls.length % 8 !== 0 && (
                <div className="text-xs text-red-500 mt-1">Number of images must be a multiple of 8 to download.</div>
              )}
            </div>
            <div className="mt-8 w-full">
              <h2 className="text-lg font-semibold mb-2">GIF Preview (per row)</h2>
              <div className="flex gap-2 items-center mb-2">
                <label className="text-sm">Speed (sec/frame):</label>
                <input
                  type="range"
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  value={gifSpeed}
                  onChange={handleGifParamChange}
                  className="w-40"
                  disabled={loadingPreview || loadingGif}
                />
                <span className="text-xs">{gifSpeed}s</span>
                <button
                  className="ml-4 bg-blue-600 text-white rounded px-3 py-1 font-semibold hover:bg-blue-700 transition"
                  onClick={handleSimulateGif}
                  disabled={loadingPreview || loadingGif}
                >
                  Simulate GIF
                </button>
                {loadingGif ? (
                  <span className="ml-4 text-blue-600 font-semibold">Loading...</span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-4">
                {gifUrls.map((gif, i) => (
                   gif ? (
                     <div key={i} className="flex flex-col items-center">
                       <img src={gif} alt={`gif-row-${i}`} className="border rounded w-20 h-20 object-contain" />
                       <div className="text-xs text-gray-500">Row {i + 1}</div>
                     </div>
                   ) : null
                 ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
