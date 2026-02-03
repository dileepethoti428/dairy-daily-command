import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import FarmerList from "./pages/FarmerList";
import FarmerAdd from "./pages/FarmerAdd";
import FarmerDetail from "./pages/FarmerDetail";
import FarmerEdit from "./pages/FarmerEdit";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import MilkEntryAdd from "./pages/MilkEntryAdd";
import TodayEntries from "./pages/TodayEntries";
import MilkEntryDetail from "./pages/MilkEntryDetail";
import MilkEntryEdit from "./pages/MilkEntryEdit";
import SettlementList from "./pages/SettlementList";
import SettlementDetail from "./pages/SettlementDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmers"
              element={
                <ProtectedRoute>
                  <FarmerList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmers/add"
              element={
                <ProtectedRoute>
                  <FarmerAdd />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmers/:id"
              element={
                <ProtectedRoute>
                  <FarmerDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmers/:id/edit"
              element={
                <ProtectedRoute>
                  <FarmerEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/milk/add"
              element={
                <ProtectedRoute>
                  <MilkEntryAdd />
                </ProtectedRoute>
              }
            />
            <Route
              path="/milk/today"
              element={
                <ProtectedRoute>
                  <TodayEntries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/milk/:id"
              element={
                <ProtectedRoute>
                  <MilkEntryDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/milk/:id/edit"
              element={
                <ProtectedRoute>
                  <MilkEntryEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settlements"
              element={
                <ProtectedRoute>
                  <SettlementList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settlements/:id"
              element={
                <ProtectedRoute>
                  <SettlementDetail />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
