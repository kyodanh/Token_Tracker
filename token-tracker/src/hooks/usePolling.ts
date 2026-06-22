import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { usePopupStore } from "../store/popup";

export function usePolling() {
  const refresh = usePopupStore((s) => s.refresh);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5 * 60 * 1000);

    const unlistenPromises = [
      listen("usage_updated", () => refresh()),
      listen("claude_code_updated", () => refresh()),
    ];

    return () => {
      clearInterval(interval);
      unlistenPromises.forEach((p) => p.then((fn) => fn()));
    };
  }, []);
}
