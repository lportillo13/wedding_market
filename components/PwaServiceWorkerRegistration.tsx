"use client";

import { useEffect } from "react";

export default function PwaServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }

    window.addEventListener("load", () => {
      void navigator.serviceWorker.register("/sw.js");
    });
  }, []);

  return null;
}
