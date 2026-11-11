import { useCallback, useEffect, useRef, useState } from "react";
import { QUOTE_TTL_SEC } from "@/lib/config";

/**
 * Devis garanti : fige le taux au moment où la confirmation s'ouvre.
 * Le montant exécuté est calculé sur ce taux figé, jamais sur un taux postérieur.
 * À l'expiration, l'utilisateur doit actualiser le devis.
 */
export function useLockedQuote(liveRate: number, active: boolean) {
  const [locked, setLocked] = useState<number | null>(null);
  const [left, setLeft] = useState(QUOTE_TTL_SEC);
  const liveRef = useRef(liveRate);
  liveRef.current = liveRate;

  const lock = useCallback(() => {
    setLocked(liveRef.current);
    setLeft(QUOTE_TTL_SEC);
  }, []);

  useEffect(() => {
    if (!active) {
      setLocked(null);
      return;
    }
    lock();
  }, [active, lock]);

  useEffect(() => {
    if (!active || locked === null) return;
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, [active, locked]);

  return { rate: locked ?? liveRate, secondsLeft: left, expired: active && left === 0, refresh: lock };
}
