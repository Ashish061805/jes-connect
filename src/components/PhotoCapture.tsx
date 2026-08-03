import { Camera, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { dataUrlToBlob } from "@/lib/photos";

export function PhotoCapture({
  value,
  onChange,
}: {
  value: Blob | null;
  onChange: (blob: Blob | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setStreaming(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      toast.error("Camera unavailable. Upload a photo instead.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    onChange(dataUrlToBlob(canvas.toDataURL("image/jpeg", 0.9)));
    stopCamera();
  }

  return (
    <div className="space-y-3">
      <div className="flex h-44 w-36 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted">
        {streaming ? (
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        ) : preview ? (
          <img src={preview} alt="Member" className="h-full w-full object-cover" />
        ) : (
          <span className="px-2 text-center text-xs text-muted-foreground">No photo selected</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {streaming ? (
          <>
            <Button type="button" size="sm" onClick={capture}>
              Capture
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={stopCamera}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button type="button" size="sm" variant="secondary" onClick={startCamera}>
              <Camera className="mr-1.5 h-4 w-4" /> Camera
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1.5 h-4 w-4" /> Upload
            </Button>
            {value ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
                <X className="mr-1.5 h-4 w-4" /> Remove
              </Button>
            ) : null}
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}