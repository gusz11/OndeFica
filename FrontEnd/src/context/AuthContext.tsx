import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { queryClient } from "../config/queryClient";
import {
  api,
  ApiError,
  errorMessage,
  setApiSession,
  unwrap,
} from "../services/api";
import { tokenStorage } from "../services/tokenStorage";
import { offlineCache } from "../services/offlineCache";
import * as Network from "expo-network";
import type { Token, User } from "../types/models";

type AuthState = {
  offlineSession: boolean;
  userToken: string | null;
  userData: User | null;
  isLoading: boolean;
  sessionError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  retrySession: () => void;
};
const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [offlineSession, setOfflineSession] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const clearingSession = useRef(false);
  const storageQueue = useRef<Promise<void>>(Promise.resolve());
  const writeStorage = useCallback((token: string | null): Promise<void> => {
    const next = storageQueue.current
      .catch(() => undefined)
      .then(() => (token ? tokenStorage.write(token) : tokenStorage.clear()));
    storageQueue.current = next;
    return next;
  }, []);

  const logout = useCallback(async () => {
    clearingSession.current = true;
    generation.current += 1;
    setApiSession(null);
    setUserToken(null);
    setUserData(null);
    setOfflineSession(false);
    setSessionError(null);
    // Abort queries before clearing private caches; account switches cannot reuse another user's data.
    await queryClient.cancelQueries();
    queryClient.clear();
    try {
      await offlineCache.clear();
      await writeStorage(null);
      clearingSession.current = false;
    } catch (error: unknown) {
      setSessionError(
        "Não foi possível apagar a sessão salva. Tente sair novamente.",
      );
      throw error;
    }
  }, [writeStorage]);

  const expireSession = useCallback(() => {
    void logout().catch(() =>
      setSessionError(
        "Não foi possível apagar a sessão salva. Tente sair novamente.",
      ),
    );
  }, [logout]);

  const acceptToken = useCallback(
    async (token: Token): Promise<void> => {
      const current = ++generation.current;
      setApiSession(token.access_token, expireSession);
      try {
        const profile = unwrap(await api.GET("/users/me/"));
        if (current !== generation.current) return;
        await writeStorage(token.access_token);
        if (current !== generation.current) return;
        clearingSession.current = false;
        offlineCache.activate(token.access_token, profile);
        setOfflineSession(false);
        setUserData(profile);
        setUserToken(token.access_token);
        setSessionError(null);
      } catch (error: unknown) {
        if (current === generation.current) await logout();
        throw error;
      }
    },
    [expireSession, logout, writeStorage],
  );

  useEffect(() => {
    let active = true;
    const current = ++generation.current;
    const bootstrap = async () => {
      try {
        // Remove the old plaintext JWT. Do not auto-migrate a credential that was stored insecurely.
        await AsyncStorage.removeItem("@userToken");
        const token = await tokenStorage.read();
        if (!active || current !== generation.current) return;
        if (token) {
          setApiSession(token, expireSession);
          const cached = await offlineCache.restore(token);
          let profile: User;
          let offline = false;
          try {
            const state = await Network.getNetworkStateAsync();
            if (
              state.isConnected === false ||
              state.isInternetReachable === false
            )
              throw new ApiError("Sem conexão", 0);
            // Direct request avoids a paused Query promise blocking cold offline startup.
            profile = unwrap(await api.GET("/users/me/"));
          } catch (error: unknown) {
            if (
              !cached ||
              !(error instanceof ApiError) ||
              (error.status !== 0 && error.status < 500)
            )
              throw error;
            profile = cached.user;
            offline = true;
          }
          if (!active || current !== generation.current) return;
          offlineCache.activate(token, profile, cached);
          if (cached?.tripsLoaded)
            queryClient.setQueryData(["trips", profile.id], cached.trips);
          if (cached?.itemsLoaded)
            queryClient.setQueryData(["itinerary", profile.id], cached.items);
          setOfflineSession(offline);
          setUserToken(token);
          setUserData(profile);
        }
        setSessionError(null);
      } catch (error: unknown) {
        if (!active) return;
        // Connectivity errors preserve the encrypted credential for an explicit retry.
        if (error instanceof ApiError && error.status === 401) await logout();
        else if (current === generation.current)
          setSessionError(errorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    };
    void bootstrap();
    return () => {
      active = false;
    };
  }, [attempt, expireSession, logout]);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const token = unwrap(
        await api.POST("/auth/token", {
          body: { username: email.trim().toLowerCase(), password, scope: "" },
          bodySerializer: (body) =>
            new URLSearchParams({
              username: body.username,
              password: body.password,
            }).toString(),
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }),
      );
      await acceptToken(token);
    },
    [acceptToken],
  );

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<User> =>
      unwrap(
        await api.POST("/auth/register", {
          body: {
            full_name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
          },
        }),
      ),
    [],
  );
  const retrySession = useCallback(() => {
    setLoading(true);
    // A failed credential deletion must retry deletion instead of restoring that session.
    if (clearingSession.current) {
      void logout()
        .catch(() => undefined)
        .finally(() => setLoading(false));
      return;
    }
    setAttempt((value) => value + 1);
  }, [logout]);
  const value = useMemo(
    () => ({
      offlineSession,
      userToken,
      userData,
      isLoading,
      sessionError,
      login,
      register,
      logout,
      retrySession,
    }),
    [
      offlineSession,
      userToken,
      userData,
      isLoading,
      sessionError,
      login,
      register,
      logout,
      retrySession,
    ],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth exige AuthProvider");
  return context;
}
