"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  RotateCcw,
  RotateCw,
  Sparkles,
  Wand2,
  Eraser,
  Sun,
  RefreshCw,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * In-browser image editor. Opens after the user picks a file, BEFORE
 * upload — they can crop, rotate, remove background, and auto-enhance
 * before anything hits Vercel Blob.
 *
 * Why client-side:
 *  - No server-side image processing required, no API costs.
 *  - Background removal uses @imgly/background-removal which runs an
 *    ONNX model in the browser via WebAssembly. ~70MB model downloads
 *    on first use, then cached forever — subsequent edits are fast.
 *  - User's image never leaves their machine until they click "Save".
 *
 * Output:
 *  - Always a Blob in the original mime type (jpeg by default).
 *  - After background removal we switch to PNG to preserve transparency.
 */

type AspectKey = "free" | "1:1" | "4:5" | "3:4" | "16:9" | "9:16";
const ASPECTS: { key: AspectKey; label: string; value: number | undefined }[] = [
  { key: "free", label: "חופשי", value: undefined },
  { key: "1:1", label: "1:1", value: 1 },
  { key: "4:5", label: "4:5", value: 4 / 5 },
  { key: "3:4", label: "3:4", value: 3 / 4 },
  { key: "16:9", label: "16:9", value: 16 / 9 },
  { key: "9:16", label: "9:16", value: 9 / 16 },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The source image — either a freshly-picked File or an existing URL. */
  source: File | string | null;
  /** Called with the edited blob when the user clicks Save. */
  onSave: (edited: Blob) => void;
  /** Hint about the upload target's aspect. Sets the initial crop preset. */
  defaultAspect?: AspectKey;
};

/** Initial crop = 90% centered area with the chosen aspect ratio. */
function defaultCrop(width: number, height: number, aspect: number | undefined): Crop {
  if (!aspect) {
    return centerCrop({ unit: "%", x: 5, y: 5, width: 90, height: 90 }, width, height);
  }
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height),
    width,
    height,
  );
}

export function ImageEditorModal({
  open,
  onOpenChange,
  source,
  onSave,
  defaultAspect = "1:1",
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSrc, setImgSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop | undefined>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | undefined>();
  const [aspectKey, setAspectKey] = useState<AspectKey>(defaultAspect);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100); // 0..200, 100 = baseline
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [bgRemoved, setBgRemoved] = useState(false);
  const [bgFill, setBgFill] = useState<string>("transparent");
  const [busy, setBusy] = useState<"bg" | "save" | null>(null);

  // Load source → data URL whenever the modal opens with a new source
  useEffect(() => {
    if (!open || !source) return;
    if (typeof source === "string") {
      setImgSrc(source);
    } else {
      const reader = new FileReader();
      reader.onload = () => setImgSrc(String(reader.result));
      reader.readAsDataURL(source);
    }
    // Reset all editor state for the new image
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBgRemoved(false);
    setBgFill("transparent");
    setCrop(undefined);
    setCompletedCrop(undefined);
  }, [open, source]);

  const aspect = ASPECTS.find((a) => a.key === aspectKey)?.value;

  // (Re)initialize the crop rectangle when the image loads OR the aspect changes
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(defaultCrop(width, height, aspect));
    },
    [aspect],
  );

  useEffect(() => {
    // When aspect changes after image is loaded, re-center the crop
    if (imgRef.current && imgSrc) {
      const { width, height } = imgRef.current;
      if (width > 0 && height > 0) {
        setCrop(defaultCrop(width, height, aspect));
      }
    }
  }, [aspect, imgSrc]);

  function rotate(delta: number) {
    setRotation((r) => (r + delta + 360) % 360);
  }

  function autoEnhance() {
    // Subtle preset boost — what most product photos benefit from.
    // Brightness slight up (gives 'pop'), contrast bumped (deeper
    // shadows), saturation bumped (more vibrant color).
    setBrightness(108);
    setContrast(118);
    setSaturation(115);
    toast.success("הגברה אוטומטית הופעלה");
  }

  function resetAll() {
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBgFill("transparent");
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(defaultCrop(width, height, aspect));
    }
  }

  async function handleRemoveBg() {
    if (!imgSrc) return;
    setBusy("bg");
    const t = toast.loading(
      "מסיר רקע… (פעם ראשונה לוקח דקה — המודל נטען לדפדפן וייקלע מהקאש בפעם הבאה)",
    );
    try {
      // Dynamic import so the ~5MB library + ONNX runtime only loads
      // when the user actually clicks the button.
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(imgSrc, {
        output: { format: "image/png", quality: 1 },
      });
      const dataUrl = await blobToDataUrl(blob);
      setImgSrc(dataUrl);
      setBgRemoved(true);
      setBgFill("transparent");
      toast.success("הרקע הוסר ✨", { id: t });
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "שגיאה בהסרת רקע",
        { id: t },
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleSave() {
    if (!imgRef.current || !completedCrop) {
      toast.error("בחר אזור חיתוך לפני שמירה");
      return;
    }
    setBusy("save");
    try {
      const blob = await renderEdited({
        img: imgRef.current,
        crop: completedCrop,
        rotation,
        brightness,
        contrast,
        saturation,
        bgFill: bgRemoved ? bgFill : "transparent",
        outputMime: bgRemoved && bgFill === "transparent" ? "image/png" : "image/jpeg",
      });
      onSave(blob);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "שגיאה בשמירה");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1100px] w-[95vw] max-h-[95vh] p-0 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <DialogTitle className="text-lg font-semibold">עריכת תמונה</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              חיתוך, סיבוב, הסרת רקע ועריכת צבעים — הכל בתוך הדפדפן.
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="סגור"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_280px] min-h-0">
          {/* Canvas / preview */}
          <div className="relative bg-[repeating-conic-gradient(#e5e5e5_0%_25%,#f5f5f5_0%_50%)] [background-size:20px_20px] overflow-auto p-6 flex items-center justify-center min-h-[400px]">
            {imgSrc ? (
              <div
                className="relative inline-block"
                style={{
                  // Background fill for after bg-removal preview
                  background:
                    bgRemoved && bgFill !== "transparent" ? bgFill : "transparent",
                }}
              >
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
                  aspect={aspect}
                  keepSelection
                  minHeight={40}
                  minWidth={40}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt=""
                    onLoad={onImageLoad}
                    // crossOrigin is needed for canvas toBlob() when
                    // the source is a remote URL (re-editing an already
                    // uploaded Blob). Has no effect on data: URLs.
                    crossOrigin="anonymous"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                      maxHeight: "70vh",
                      display: "block",
                    }}
                  />
                </ReactCrop>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">טוען…</div>
            )}
          </div>

          {/* Sidebar: tools */}
          <aside className="border-t lg:border-t-0 lg:border-s border-border bg-muted/30 p-5 overflow-y-auto space-y-5">
            {/* Background removal — the headline action */}
            <Section title="רקע">
              <Button
                type="button"
                onClick={handleRemoveBg}
                disabled={busy !== null}
                variant={bgRemoved ? "outline" : "default"}
                size="sm"
                className="w-full gap-2 justify-center"
              >
                {busy === "bg" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Eraser className="size-4" />
                )}
                {bgRemoved ? "הסר רקע שוב" : "הסר רקע (AI)"}
              </Button>

              {bgRemoved && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-muted-foreground">צבע רקע</div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { v: "transparent", label: "שקוף", bg: "checkered" },
                      { v: "#ffffff", label: "לבן", bg: "#ffffff" },
                      { v: "#16191c", label: "שחור", bg: "#16191c" },
                      { v: "#f4f6f3", label: "קרם", bg: "#f4f6f3" },
                      { v: "#cf9834", label: "זהב", bg: "#cf9834" },
                    ].map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setBgFill(opt.v)}
                        aria-label={opt.label}
                        title={opt.label}
                        className={`size-7 rounded-md border-2 ${
                          bgFill === opt.v ? "border-foreground" : "border-border"
                        }`}
                        style={
                          opt.bg === "checkered"
                            ? {
                                background:
                                  "repeating-conic-gradient(#bbb 0 25%, #fff 0 50%)",
                                backgroundSize: "8px 8px",
                              }
                            : { background: opt.bg }
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </Section>

            <Section title="חיתוך">
              <div className="flex flex-wrap gap-1.5">
                {ASPECTS.map((a) => (
                  <Button
                    key={a.key}
                    type="button"
                    onClick={() => setAspectKey(a.key)}
                    size="sm"
                    variant={aspectKey === a.key ? "default" : "outline"}
                    className="h-8 px-2.5 text-xs"
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            </Section>

            <Section title="סיבוב">
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  onClick={() => rotate(-90)}
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5"
                >
                  <RotateCcw className="size-3.5" />
                  סובב שמאלה
                </Button>
                <Button
                  type="button"
                  onClick={() => rotate(90)}
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5"
                >
                  <RotateCw className="size-3.5" />
                  סובב ימינה
                </Button>
              </div>
            </Section>

            <Section
              title="צבע"
              action={
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={autoEnhance}
                  className="h-7 px-2 text-xs gap-1 text-brand-accent hover:text-brand-accent-dark"
                  title="הגברה אוטומטית"
                >
                  <Wand2 className="size-3" />
                  הגברה אוטו׳
                </Button>
              }
            >
              <SliderRow
                icon={<Sun className="size-3.5" />}
                label="בהירות"
                value={brightness}
                min={50}
                max={150}
                onChange={setBrightness}
              />
              <SliderRow
                icon={<Sparkles className="size-3.5" />}
                label="ניגודיות"
                value={contrast}
                min={50}
                max={150}
                onChange={setContrast}
              />
              <SliderRow
                icon={<Sparkles className="size-3.5" />}
                label="רוויה"
                value={saturation}
                min={0}
                max={200}
                onChange={setSaturation}
              />
            </Section>

            <div className="pt-2 border-t border-border">
              <Button
                type="button"
                onClick={resetAll}
                size="sm"
                variant="ghost"
                className="w-full gap-1.5 text-muted-foreground"
              >
                <RefreshCw className="size-3.5" />
                איפוס כל השינויים
              </Button>
            </div>
          </aside>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy !== null}
          >
            ביטול
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={busy !== null}
            className="gap-2"
          >
            {busy === "save" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            שמירה והעלאה
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────── Helper subcomponents ─────────── */

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function SliderRow({
  icon,
  label,
  value,
  min,
  max,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="tabular-nums text-foreground">{value}%</span>
      </div>
      {/* Native range — styled minimally to fit the admin chrome.
          Avoids pulling in a slider library when one slider suffices. */}
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={1}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-accent cursor-pointer"
      />
    </div>
  );
}

/* ─────────── Canvas rendering ─────────── */

type RenderArgs = {
  img: HTMLImageElement;
  crop: PixelCrop;
  rotation: number;
  brightness: number;
  contrast: number;
  saturation: number;
  bgFill: string;
  outputMime: "image/jpeg" | "image/png";
};

/**
 * Apply all edits (rotation → filter → crop → bg fill) to a canvas
 * and return the result as a Blob. Drawn at the source's natural
 * resolution so we don't downsample the original.
 */
function renderEdited(args: RenderArgs): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const { img, crop, rotation, brightness, contrast, saturation, bgFill, outputMime } = args;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    const pixelCrop = {
      x: crop.x * scaleX,
      y: crop.y * scaleY,
      width: crop.width * scaleX,
      height: crop.height * scaleY,
    };

    // Step 1: draw the FULL image rotated onto a temp canvas so we
    // can crop from the rotated bitmap directly.
    const rad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    const fullW = img.naturalWidth * cos + img.naturalHeight * sin;
    const fullH = img.naturalWidth * sin + img.naturalHeight * cos;

    const fullCanvas = document.createElement("canvas");
    fullCanvas.width = fullW;
    fullCanvas.height = fullH;
    const fctx = fullCanvas.getContext("2d");
    if (!fctx) return reject(new Error("canvas context unavailable"));
    fctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    fctx.translate(fullW / 2, fullH / 2);
    fctx.rotate(rad);
    fctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

    // Step 2: crop from the rotated canvas. The cropping rectangle
    // was computed against the *displayed* image before rotation,
    // so we don't rotate the rectangle — the user is selecting from
    // the post-rotation view that ReactCrop showed.
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = pixelCrop.width;
    cropCanvas.height = pixelCrop.height;
    const cctx = cropCanvas.getContext("2d");
    if (!cctx) return reject(new Error("canvas context unavailable"));

    // Background fill (only matters if image has alpha after bg removal)
    if (bgFill !== "transparent") {
      cctx.fillStyle = bgFill;
      cctx.fillRect(0, 0, pixelCrop.width, pixelCrop.height);
    }

    cctx.drawImage(
      fullCanvas,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    cropCanvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("toBlob returned null"));
        resolve(blob);
      },
      outputMime,
      outputMime === "image/jpeg" ? 0.92 : 1,
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
