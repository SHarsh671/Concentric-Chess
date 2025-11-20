"use client";

import { ServerMsg, ClientMsg } from "shared";
import "client-only";

export class GameSocket {
  private static instance: GameSocket | null = null;
  private socket: WebSocket | null = null;
  private gameId: string | null = null;
  private listener: ((message: ServerMsg) => void) | null = null;

  public static get(): GameSocket {
    if (this.instance === null) {
      this.instance = new GameSocket();
    }
    return this.instance;
  }

  public connect(gameId: string | null) {
    if (this.gameId === gameId) {
      return;
    }
    if (gameId === null) {
      this.disconnect();
      return;
    }
    if (this.socket) {
      this.disconnect();
    }
    this.gameId = gameId;
    if (window.location.origin.startsWith("http://localhost")) {
      this.socket = new WebSocket(`ws://localhost:8787/do/games/${gameId}/ws`);
    } else {
      this.socket = new WebSocket(
        `wss://capstone.mrvillage.dev/do/games/${gameId}/ws`,
      );
    }
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
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close();
      }
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

  public send(message: ClientMsg) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.log(this.socket);
      throw new Error("WebSocket is not connected.");
    }
  }

  public setListener(listener: ((message: ServerMsg) => void) | null) {
    this.listener = listener;
  }
}
