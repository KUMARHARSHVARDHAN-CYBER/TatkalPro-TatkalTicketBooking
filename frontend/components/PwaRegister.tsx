"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("[TatkalPro] ServiceWorker registered:", reg.scope))
        .catch((err) => console.error("[TatkalPro] ServiceWorker registration failed:", err));
    }
  }, []);

  return null;
}

