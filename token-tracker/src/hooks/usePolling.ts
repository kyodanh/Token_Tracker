import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { usePopupStore } from "../store/popup";

export function usePolling() {
  const refresh = usePopupStore((s) => s.refresh);

  useEffect(() => {
    refresh();

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startInterval = () => {
      if (intervalId !== null) return;
      intervalId = setInterval(refresh, 5 * 60 * 1000);
    };

    const stopInterval = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Pause polling when popup is hidden — resumes with fresh data on re-open
    const handleVisibility = () => {
      if (document.hidden) {
        stopInterval();
      } else {
        refresh();
        startInterval();
      }
    };

    startInterval();
    document.addEventListener("visibilitychange", handleVisibility);

    const unlistenPromises = [
      listen("usage_updated", () => refresh()),
      listen("claude_code_updated", () => refresh()),
    ];

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", handleVisibility);
      unlistenPromises.forEach((p) => p.then((fn) => fn()));
    };
  }, []);
}
