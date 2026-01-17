"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAState {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  isUpdating: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isInstallable: false,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isUpdating: false,
    registration: null,
  });
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Check if app is installed
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if running as PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setState((prev) => ({ ...prev, isInstalled: isStandalone }));

    // Listen for display mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = (e: MediaQueryListEvent) => {
      setState((prev) => ({ ...prev, isInstalled: e.matches }));
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Register service worker
  // Register service worker
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let isMounted = true;
    let registration: ServiceWorkerRegistration | null = null;

    const handleUpdateFound = () => {
      if (!isMounted || !registration) return;

      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          if (isMounted) setState((prev) => ({ ...prev, isUpdating: true }));
        }
      });
    };

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        if (!isMounted) return;

        console.log("[PWA] Service worker registered:", reg.scope);
        registration = reg;

        setState((prev) => ({ ...prev, registration: reg }));

        // Check for updates
        reg.addEventListener("updatefound", handleUpdateFound);

      } catch (error) {
        console.error("[PWA] Service worker registration failed:", error);
      }
    };

    registerSW();

    return () => {
      isMounted = false;
      if (registration) {
        registration.removeEventListener("updatefound", handleUpdateFound);
      }
    };
  }, []);

  // Listen for install prompt
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState((prev) => ({ ...prev, isInstallable: true }));
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setState((prev) => ({ ...prev, isInstalled: true, isInstallable: false }));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setState((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Install the PWA
  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setState((prev) => ({ ...prev, isInstallable: false }));
      return true;
    }

    return false;
  }, [deferredPrompt]);

  // Update the service worker
  const update = useCallback(async () => {
    if (!state.registration) return;

    try {
      await state.registration.update();

      // If there's a waiting worker, activate it
      if (state.registration.waiting) {
        state.registration.waiting.postMessage({ type: "SKIP_WAITING" });
        window.location.reload();
      }
    } catch (error) {
      console.error("[PWA] Update failed:", error);
    }
  }, [state.registration]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) return "denied";

    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";

    return await Notification.requestPermission();
  }, []);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async (vapidPublicKey: string) => {
    if (!state.registration) return null;

    try {
      const permission = await requestNotificationPermission();
      if (permission !== "granted") return null;

      const subscription = await state.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource,
      });

      return subscription;
    } catch (error) {
      console.error("[PWA] Push subscription failed:", error);
      return null;
    }
  }, [state.registration, requestNotificationPermission]);

  return {
    ...state,
    install,
    update,
    requestNotificationPermission,
    subscribeToPush,
    canInstall: state.isInstallable && !state.isInstalled,
  };
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
