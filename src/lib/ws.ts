"use client";

import { ServerMsg, ClientMsg } from "shared";

export class GameSocket {
  private static instance: GameSocket | null = null;
  private socket: WebSocket | null = null;
  private gameId: string | null = null;
  private listener: ((message: ServerMsg) => void) | null = null;

  public static get(gameId: string): GameSocket {
    if (this.instance === null) {
      this.instance = new GameSocket();
    }
    if (this.instance.gameId !== gameId) {
      this.instance.connect(gameId);
    }
    return this.instance;
  }

  public connect(gameId: string) {
    if (this.socket) {
      this.socket.close();
    }
    this.gameId = gameId;
    this.socket = new WebSocket(
      `${window.location.origin.replace("http", "ws")}/games/${gameId}/ws`,
    );
    this.socket.onmessage = (event) => {
      this.processMessage(event.data);
    };
    this.socket.onclose = () => {
      this.socket = null;
      this.gameId = null;
    };
    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.gameId = null;
    }
  }

  public processMessage(message: string) {
    const res: ServerMsg = JSON.parse(message);
    if (this.listener) {
      this.listener(res);
    }
  }

  public sendMessage(message: ClientMsg) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      throw new Error("WebSocket is not connected.");
    }
  }

  public setListener(listener: ((message: ServerMsg) => void) | null) {
    this.listener = listener;
  }
}

export function useGameSocket(gameId: string): GameSocket {
  return GameSocket.get(gameId);
}
