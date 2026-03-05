import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode
} from "react";

interface AuthContextType {
  // Per-table token -- stored as sessionToken-{tableNumber} in sessionStorage
  getSessionToken: (tableNumber: string | number) => string | null;
  setSessionToken: (token: string | null, tableNumber: string | number) => void;

  // Admin token -- stored in localStorage (shared, since admin is 1 user)
  adminToken: string | null;
  setAdminToken: (token: string | null) => void;

  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

/** Build the sessionStorage key for a given table. */
export function sessionTokenKey(tableNumber: string | number) {
  return `sessionToken-table-${tableNumber}`;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [adminToken, setAdminTokenState] = useState<string | null>(
    () => localStorage.getItem("adminToken")
  );

  // Per-table token helpers
  const getSessionToken = useCallback((tableNumber: string | number) => {
    return sessionStorage.getItem(sessionTokenKey(tableNumber));
  }, []);

  const setSessionToken = useCallback((token: string | null, tableNumber: string | number) => {
    const key = sessionTokenKey(tableNumber);
    if (token) sessionStorage.setItem(key, token);
    else sessionStorage.removeItem(key);
  }, []);

  const setAdminToken = useCallback((token: string | null) => {
    if (token) localStorage.setItem("adminToken", token);
    else localStorage.removeItem("adminToken");
    setAdminTokenState(token);
  }, []);

  const logout = useCallback(() => {
    // Remove all table session tokens from sessionStorage
    Object.keys(sessionStorage)
      .filter(k => k.startsWith("sessionToken-table-"))
      .forEach(k => sessionStorage.removeItem(k));
    localStorage.removeItem("adminToken");
    setAdminTokenState(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      getSessionToken,
      setSessionToken,
      adminToken,
      setAdminToken,
      logout,
      isAdmin: !!adminToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

/** Convenience hook that decodes token data for a specific table. */
export function useTableAuth(tableNumber: string | number) {
  const { getSessionToken } = useAuth();
  return useMemo(() => {
    const token = getSessionToken(tableNumber);
    if (!token) return { token: null, sessionId: null, tableId: null, tableNumber: null };
    const payload = decodeJwtPayload(token);
    return {
      token,
      sessionId: (payload?.sessionId as string) ?? null,
      tableId: (payload?.tableId as string) ?? null,
      tableNumber: (payload?.tableNumber as number) ?? null,
    };
  }, [getSessionToken, tableNumber]);
}
