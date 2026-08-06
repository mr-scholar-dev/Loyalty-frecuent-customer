"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { CameraOff, Loader2 } from "lucide-react";

interface CameraScannerProps {
  onResult: (value: string) => void;
}

type CameraState = "idle" | "starting" | "scanning" | "denied" | "error";

const GET_USER_MEDIA_TIMEOUT_MS = 20_000;
const VIDEO_START_TIMEOUT_MS = 10_000;
const SCAN_INTERVAL_MS = 200;

/** Rejects after `ms`, cleaning its timer if the base promise settles first. */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string) {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() =>
    window.clearTimeout(timeoutId),
  );
}

function describeError(err: unknown): { state: CameraState; detail: string } {
  if (err instanceof DOMException) {
    switch (err.name) {
      case "NotAllowedError":
      case "SecurityError":
        return { state: "denied", detail: err.name };
      case "NotFoundError":
      case "OverconstrainedError":
        return {
          state: "error",
          detail: `No se encontró una cámara compatible (${err.name}).`,
        };
      case "NotReadableError":
      case "AbortError":
        return {
          state: "error",
          detail: `La cámara está en uso por otra aplicación o pestaña (${err.name}). Ciérrala e intenta de nuevo.`,
        };
      default:
        return { state: "error", detail: `${err.name}: ${err.message}` };
    }
  }
  if (err instanceof Error) return { state: "error", detail: err.message };
  return { state: "error", detail: "Error desconocido al iniciar la cámara." };
}

/**
 * Camera QR scanner (§7, §Fase6). Owns the full pipeline — getUserMedia,
 * video playback and a polling decode loop — instead of delegating video
 * attachment to a library (ZXing's internal attach hangs on several mobile
 * browsers). Decodes with the native `BarcodeDetector` when available and
 * falls back to `@zxing/browser` over canvas frames. Surfaces the concrete
 * failure step/reason so field issues are diagnosable; manual entry is
 * always available.
 */
export function CameraScanner({ onResult }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<CameraState>("idle");
  const [detail, setDetail] = useState<string>("");
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const doneRef = useRef(false);
  const sessionRef = useRef(0);

  function stop() {
    sessionRef.current += 1;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
  }

  useEffect(() => {
    // Cleanup on unmount.
    return () => stop();
  }, []);

  function handleHit(value: string) {
    if (doneRef.current) return;
    doneRef.current = true;
    stop();
    setState("idle");
    onResult(value);
  }

  async function start() {
    doneRef.current = false;
    stop();
    const session = sessionRef.current;
    const isStale = () => sessionRef.current !== session;
    setState("starting");
    const video = videoRef.current;
    if (!video) return;

    try {
      // getUserMedia only exists in secure contexts (HTTPS or localhost).
      if (!window.isSecureContext) {
        setState("error");
        setDetail(
          "La página no se sirve por HTTPS, el navegador bloquea la cámara.",
        );
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setState("error");
        setDetail("Este navegador no soporta acceso a la cámara.");
        return;
      }

      setDetail("Solicitando permiso de cámara…");
      const streamPromise = navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      // If the guard below fires, release the camera whenever the browser
      // eventually hands it over.
      streamPromise
        .then((s) => {
          if (streamRef.current !== s) s.getTracks().forEach((t) => t.stop());
        })
        .catch(() => {});
      const stream = await withTimeout(
        streamPromise,
        GET_USER_MEDIA_TIMEOUT_MS,
        "El navegador no entregó la cámara (¿permiso pendiente o cámara ocupada?).",
      );
      if (isStale()) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      setDetail("Iniciando video…");
      video.srcObject = stream;
      await withTimeout(
        video.play(),
        VIDEO_START_TIMEOUT_MS,
        "El video no arrancó. Cierra otras apps que usen la cámara e intenta de nuevo.",
      );
      if (isStale()) return;
      setState("scanning");

      // Decode loop over the live element: native BarcodeDetector when the
      // browser has it, otherwise ZXing against canvas snapshots.
      let detector: BarcodeDetector | null = null;
      if (typeof window.BarcodeDetector === "function") {
        try {
          const formats = await window.BarcodeDetector.getSupportedFormats();
          if (formats.includes("qr_code")) {
            detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          }
        } catch {
          // Fall through to ZXing.
        }
      }
      const zxing = detector ? null : new BrowserQRCodeReader();
      const canvas = detector ? null : document.createElement("canvas");
      const ctx = canvas?.getContext("2d", { willReadFrequently: true });

      const tick = async () => {
        if (doneRef.current || isStale()) return;
        if (video.readyState >= 2 && video.videoWidth > 0) {
          try {
            if (detector) {
              const codes = await detector.detect(video);
              const first = codes[0];
              if (first) {
                handleHit(first.rawValue);
                return;
              }
            } else if (zxing && canvas && ctx) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0);
              const result = zxing.decodeFromCanvas(canvas);
              if (result) {
                handleHit(result.getText());
                return;
              }
            }
          } catch {
            // No QR in this frame (ZXing throws NotFound) — keep polling.
          }
        }
        if (doneRef.current || isStale()) return;
        timerRef.current = window.setTimeout(tick, SCAN_INTERVAL_MS);
      };
      timerRef.current = window.setTimeout(tick, SCAN_INTERVAL_MS);
    } catch (err) {
      stop();
      const described = describeError(err);
      setState(described.state);
      setDetail(described.detail);
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-900">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          autoPlay
          playsInline
          muted
        />
        {state !== "scanning" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-sm text-white/80">
            {state === "starting" && (
              <>
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
                {detail || "Iniciando cámara…"}
              </>
            )}
            {state === "denied" && (
              <>
                <CameraOff className="h-6 w-6" aria-hidden />
                Permiso de cámara denegado ({detail}). Habilítalo en la
                configuración del sitio o usa la entrada manual.
              </>
            )}
            {state === "error" && (
              <>
                <CameraOff className="h-6 w-6" aria-hidden />
                {detail}
              </>
            )}
            {state === "idle" && <span>Cámara detenida</span>}
          </div>
        )}
      </div>

      {state === "scanning" ? (
        <button
          type="button"
          onClick={() => {
            stop();
            setState("idle");
          }}
          className="w-full text-sm font-medium text-muted-foreground underline underline-offset-4"
        >
          Detener cámara
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          className="w-full text-sm font-medium text-primary underline underline-offset-4"
        >
          {state === "starting" ? "Reintentar" : "Escanear con la cámara"}
        </button>
      )}
    </div>
  );
}
