"use client";

import { ServerMsg, ClientMsg } from "shared";
import "client-only";
import { toast } from "sonner";

export class GameSocket {
  private static instances: Map<string, GameSocket> = new Map();
  private socket: WebSocket | null = null;
  private gameId: string;
  private listener: ((message: ServerMsg) => void) | null = null;
  private queue: ClientMsg[] = [];
  private reconnecting: Promise<void> | null = null;
  private reconnected: () => void = () => { };

  public static getInstance(gameId: string): GameSocket {
    if (!this.instances.has(gameId)) {
      const instance = new GameSocket(gameId);
      this.instances.set(gameId, instance);
    }
    return this.instances.get(gameId)!;
  }

  constructor(gameId: string) {
    this.gameId = gameId;
    if (typeof window === "undefined") {
      return;
    }
    this.reconnect(0, true);
  }

  public reconnect(delay: number = 0, initial: boolean = false) {
    if (this.socket) { return; }
    if (!initial) {
      if (!this.reconnecting) {
        this.reconnecting = new Promise((resolve) => {
          this.reconnected = resolve;
        });
      }
      toast.promise(this.reconnecting, {
        id: "reconnecting",
        loading: "Reconnecting...",
        success: "Reconnected!",
        error: "Failed to reconnect.",
        dismissible: true,
        closeButton: true,
      })
    }
    console.log(`Reconnecting in ${delay}ms...`);
    if (delay > 0) {
      setTimeout(() => {
        console.log("Attempting to reconnect...");
        this.reconnect(0, initial);
      }, delay);
      return;
    }
    if (window.location.origin.startsWith("http://localhost")) {
      this.socket = new WebSocket(`ws://localhost:8787/do/games/${this.gameId}/ws`);
    } else {
      this.socket = new WebSocket(
        `wss://capstone.mrvillage.dev/do/games/${this.gameId}/ws`,
      );
    }
    this.socket.onopen = () => {
      console.log("WebSocket connected");
      this.send({ type: "sync_request" });
      this.reconnected();
      this.reconnected = () => { };
      this.reconnecting = null;
      while (this.queue.length > 0) {
        const message = this.queue.shift()!;
        this.send(message);
      }
    };
    this.socket.onmessage = (event) => {
      this.processMessage(event.data);
    };
    this.socket.onclose = () => {
      console.log("WebSocket closed, attempting to reconnect...");
      this.socket = null;
      this.reconnect(1000);
    };
    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      // this.reconnect(1000);
    };
  }

  public disconnect() {
    this.removeInstance();
    if (this.socket) {
      const socket = this.socket;
      socket.onopen = () => {
        socket.close();
      };
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close();
      }
    }
  }

  public processMessage(message: string) {
    const res: ServerMsg = JSON.parse(message);
    if (this.listener) {
      this.listener(res);
    }
  }

  public send(message: ClientMsg) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not ready, queuing message:", message, this.socket?.readyState);
      if (!this.queue.some((msg) => JSON.stringify(msg) === JSON.stringify(message))) {
        this.queue.push(message);
      }
      if (!this.socket || this.socket.readyState === WebSocket.CLOSED || this.socket.readyState === WebSocket.CLOSING) {
        this.socket = null;
        this.reconnect(0);
      }
    }
  }

  public setListener(listener: ((message: ServerMsg) => void) | null) {
    this.listener = listener;
  }

  public removeInstance() {
    GameSocket.instances.delete(this.gameId);
  }
}
