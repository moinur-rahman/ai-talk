import { io } from "socket.io-client";

export const createNamespaceConnection = (namespace: string) => {
  return io(`${process.env.NEXT_PUBLIC_SOCKET_URL}/${namespace}`, {
    withCredentials: true,
    autoConnect: false,
    reconnectionAttempts: 2,
    reconnectionDelay: 2000,
  });
};

export const authConnection = createNamespaceConnection("auth");

export const providerConnection = createNamespaceConnection("provider");
