import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/context/AuthContext";
import { AdminRoute, CustomerRoute, KitchenRoute, WaiterRoute } from "@/components/ProtectedRoute";
import SmoothScroll from "@/components/SmoothScroll";
import { useLocation } from "react-router-dom";

// Lazy loading pages for better performance
const Landing = lazy(() => import("@/pages/Landing"));
const TableActivation = lazy(() => import("@/pages/TableActivation"));
const TablePage = lazy(() => import("@/pages/Menu"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const StaffLogin = lazy(() => import("@/pages/StaffLogin"));
const KitchenKDS = lazy(() => import("@/pages/KitchenKDS"));
const WaiterDashboard = lazy(() => import("@/pages/WaiterDashboard"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#050505]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-white/40 text-sm font-medium tracking-widest uppercase">Loading</p>
    </div>
  </div>
);


const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();

  return (
    <SmoothScroll>
      <AnimatePresence mode="wait">
        <Suspense fallback={<PageLoader />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/table/:tableId" element={<TableActivation />} />
            <Route
              path="/table/:tableId/menu"
              element={
                <CustomerRoute>
                  <TablePage />
                </CustomerRoute>
              }
            />
            {/* Admin routes */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            {/* Staff routes */}
            <Route path="/staff-login" element={<StaffLogin />} />
            <Route
              path="/kitchen"
              element={
                <KitchenRoute>
                  <KitchenKDS />
                </KitchenRoute>
              }
            />
            <Route
              path="/waiter"
              element={
                <WaiterRoute>
                  <WaiterDashboard />
                </WaiterRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </SmoothScroll>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <AppContent />
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
