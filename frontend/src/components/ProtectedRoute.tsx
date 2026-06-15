import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { ReactNode } from "react";

export const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/admin-login" replace />;
  return <>{children}</>;
};

export const KitchenRoute = ({ children }: { children: ReactNode }) => {
  const { isKitchen, isAdmin } = useAuth();
  if (!isKitchen && !isAdmin) return <Navigate to="/staff-login" replace />;
  return <>{children}</>;
};

export const WaiterRoute = ({ children }: { children: ReactNode }) => {
  const { isWaiter, isAdmin } = useAuth();
  if (!isWaiter && !isAdmin) return <Navigate to="/staff-login" replace />;
  return <>{children}</>;
};

/**
 * CustomerRoute checks if a valid per-table session token exists
 * for the tableId in the current URL before rendering the menu.
 */
export const CustomerRoute = ({ children }: { children: ReactNode }) => {
  const { tableId } = useParams<{ tableId: string }>();
  const { getSessionToken } = useAuth();

  const hasSession = tableId ? !!getSessionToken(tableId) : false;
  if (!hasSession) {
    return <Navigate to={tableId ? `/table/${tableId}` : "/"} replace />;
  }
  return <>{children}</>;
};
