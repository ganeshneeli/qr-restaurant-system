import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode
} from "react";

interface AuthContextType {
  // Per-table token -- stored as sessionToken-{tableNumber} in localStorage
  getSessionToken: (tableNumber: string | number) => string | null;
  setSessionToken: (token: string | null, tableNumber: string | number) => void;

  // Admin token -- stored in localStorage
  adminToken: string | null;
  setAdminToken: (token: string | null) => void;

  // Staff token (waiter/kitchen)
  staffToken: string | null;
  staffRole: "kitchen" | "waiter" | null;
  staffName: string | null;
  setStaffToken: (token: string | null) => void;

  logout: () => void;
  staffLogout: () => void;

  // Role flags
  isAdmin: boolean;
  isKitchen: boolean;
  isWaiter: boolean;
  isStaff: boolean;
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

  const [staffToken, setStaffTokenState] = useState<string | null>(
    () => localStorage.getItem("staffToken")
  );

  // Decode staff token for role + name
  const staffPayload = useMemo(() => {
    if (!staffToken) return null;
    return decodeJwtPayload(staffToken);
  }, [staffToken]);

  const staffRole = (staffPayload?.role as "kitchen" | "waiter" | null) ?? null;
  const staffName = (staffPayload?.name as string | null) ?? null;

  // Per-table token helpers
  const getSessionToken = useCallback((tableNumber: string | number) => {
    return localStorage.getItem(sessionTokenKey(tableNumber));
  }, []);

  const setSessionToken = useCallback((token: string | null, tableNumber: string | number) => {
    const key = sessionTokenKey(tableNumber);
    if (token) localStorage.setItem(key, token);
    else localStorage.removeItem(key);
  }, []);

  const setAdminToken = useCallback((token: string | null) => {
    if (token) localStorage.setItem("adminToken", token);
    else localStorage.removeItem("adminToken");
    setAdminTokenState(token);
  }, []);

  const setStaffToken = useCallback((token: string | null) => {
    if (token) localStorage.setItem("staffToken", token);
    else localStorage.removeItem("staffToken");
    setStaffTokenState(token);
  }, []);

  const logout = useCallback(() => {
    Object.keys(localStorage)
      .filter(k => k.startsWith("sessionToken-table-"))
      .forEach(k => localStorage.removeItem(k));
    localStorage.removeItem("adminToken");
    setAdminTokenState(null);
  }, []);

  const staffLogout = useCallback(() => {
    localStorage.removeItem("staffToken");
    setStaffTokenState(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      getSessionToken,
      setSessionToken,
      adminToken,
      setAdminToken,
      staffToken,
      staffRole,
      staffName,
      setStaffToken,
      logout,
      staffLogout,
      isAdmin: !!adminToken,
      isKitchen: staffRole === "kitchen",
      isWaiter: staffRole === "waiter",
      isStaff: staffRole === "kitchen" || staffRole === "waiter",
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
