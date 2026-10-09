import { io } from "socket.io-client";
import { API_URL } from "./api";
export const socket = io(new URL(API_URL, window.location.origin).origin, {
  autoConnect: false,
  withCredentials: true,
});