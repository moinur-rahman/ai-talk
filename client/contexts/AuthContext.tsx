"use client";
import { Socket } from "socket.io-client";
import { createContext, useContext, useEffect, useMemo } from "react";
import { authConnection } from "@/apis/socket";
import { useRouter } from "next/navigation";
import { url } from "@/utils/url";

interface IAuthContext {
  authConnection: Socket;
}

const AuthContext = createContext<IAuthContext | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within a AuthProvider");
  }

  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  useEffect(() => {
    authConnection.connect();

    return () => {
      authConnection.disconnect();
    };
  }, []);

  useEffect(() => {
    authConnection.on("user-logout", () => {
      router.push(url.login);
      authConnection.disconnect();
    });
  }, []);

  const value = useMemo(() => ({ authConnection }), []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
