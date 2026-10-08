import { useSyncExternalStore } from "react";
import { onlineManager } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
export function useReadOnly() {
  const online = useSyncExternalStore(
    onlineManager.subscribe.bind(onlineManager),
    () => onlineManager.isOnline(),
  );
  return useAuth().offlineSession || !online;
}
