"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { CameraOff, Loader2 } from "lucide-react";

interface CameraScannerProps {
  onResult: (value: string) => void;
}

type CameraState = "idle" | "starting" | "scanning" | "denied" | "unsupported";

const CAMERA_START_TIMEOUT_MS = 12_000;

/**
 * Camera QR scanner (§7, §Fase6). Prefers the native `BarcodeDetector` when
 * available, otherwise falls back to `@zxing/browser`. Handles denied
 * permissions gracefully with a message; manual entry is always available.
 */
export function CameraScanner({ onResult }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<CameraState>("idle");
  const controlsRef = useRef<IScannerControls | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  function stop() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
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
    setState("starting");
    const video = videoRef.current;
    if (!video) return;

    try {
      // getUserMedia only exists in secure contexts (HTTPS or localhost).
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setState("unsupported");
        return;
      }

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (
        !isMobile &&
        typeof window !== "undefined" &&
        window.BarcodeDetector
      ) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();
        setState("scanning");

        try {
          const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          const tick = async () => {
            if (doneRef.current) return;
            try {
              const codes = await detector.detect(video);
              const first = codes[0];
              if (first) {
                handleHit(first.rawValue);
                return;
              }
            } catch {
              // transient detect error — keep trying
            }
            rafRef.current = requestAnimationFrame(tick);
          };
          rafRef.current = requestAnimationFrame(tick);
          return;
        } catch {
          // Some browsers expose BarcodeDetector but do not support QR formats.
          // Release its stream and continue with the ZXing fallback below.
          stop();
        }
      }

      // Fallback: ZXing.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;

      // Show the live preview as soon as frames flow, without waiting for
      // ZXing's start promise.
      video.addEventListener(
        "playing",
        () => {
          if (!doneRef.current) setState("scanning");
        },
        { once: true },
      );

      // Let ZXing attach the stream and start playback itself. Attaching it
      // to the <video> ourselves first leaves ZXing waiting forever for
      // media events that already fired (infinite "starting" on phones).
      const reader = new BrowserQRCodeReader();
      const startPromise = reader.decodeFromStream(stream, video, (result) => {
        if (result) handleHit(result.getText());
      });
      let timeoutId: number | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(
          () => reject(new Error("La cámara tardó demasiado en iniciar.")),
          CAMERA_START_TIMEOUT_MS,
        );
      });
      try {
        controlsRef.current = await Promise.race([
          startPromise,
          timeoutPromise,
        ]);
      } finally {
        window.clearTimeout(timeoutId);
      }
      setState("scanning");
    } catch (err) {
      stop();
      const denied =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "SecurityError");
      setState(denied ? "denied" : "unsupported");
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
                Iniciando cámara…
              </>
            )}
            {state === "denied" && (
              <>
                <CameraOff className="h-6 w-6" aria-hidden />
                Permiso de cámara denegado. Usa la entrada manual.
              </>
            )}
            {state === "unsupported" && (
              <>
                <CameraOff className="h-6 w-6" aria-hidden />
                No se pudo iniciar. Verifica HTTPS y el permiso de cámara en tu
                navegador. Usa la entrada manual si continúa.
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
          Escanear con la cámara
        </button>
      )}
    </div>
  );
}
