"use client";

import type { Order } from "@/types/order";

export type ConnectionStatus = "connected" | "connecting" | "disconnected";
export type OrderRow = Omit<Order, "items">;

export function makeSubscribeHandler(
  setStatus: React.Dispatch<React.SetStateAction<ConnectionStatus>>
) {
  return (status: string) => {
    if (status === "SUBSCRIBED") setStatus("connected");
    else if (
      status === "CLOSED" ||
      status === "CHANNEL_ERROR" ||
      status === "TIMED_OUT"
    )
      setStatus("disconnected");
    else setStatus("connecting");
  };
}
