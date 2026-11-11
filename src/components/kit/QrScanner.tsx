import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Sheet } from "./index";

/** Extrait l'adresse d'un QR (adresse brute ou URI type bitcoin:…?amount=…). */
export function parseQrPayload(text: string): string {
  const t = text.trim();
  const m = t.match(/^[a-z]+:(?:\/\/)?([^?@]+)/i);
  return (m ? m[1] : t).trim();
}

export function QrScanner({ onResult, onClose }: { onResult: (address: string) => void; onClose: () => void }) {
  const id = useRef(`qr-${Math.random().toString(36).slice(2)}`).current;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode(id, { verbose: false });
    let active = true;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (text) => {
          if (!active) return;
          active = false;
          scanner.stop().catch(() => undefined);
          onResult(parseQrPayload(text));
        },
        () => undefined,
      )
      .catch(() => setError("Caméra indisponible. Autorisez l'accès à la caméra ou collez l'adresse."));
    return () => {
      active = false;
      if (scanner.isScanning) scanner.stop().catch(() => undefined);
    };
  }, [id, onResult]);

  return (
    <Sheet onClose={onClose} title="Scanner un QR code">
      <div id={id} className="w-full aspect-square rounded-[20px] overflow-hidden bg-black" />
      {error ? (
        <p className="font-urbanist text-loss text-xs text-center mt-4">{error}</p>
      ) : (
        <p className="font-urbanist text-text-gray text-xs text-center mt-4">Placez le QR code de l'adresse dans le cadre</p>
      )}
    </Sheet>
  );
}
