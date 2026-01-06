import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Projects from "./pages/Projects";
import CreateProject from "./pages/CreateProject";
import ProjectDetails from "./pages/ProjectDetails";
import CostEstimation from "./pages/CostEstimation";
import ResourceManagement from "./pages/ResourceManagement";
import AddResource from "./pages/AddResource";
import EditResource from "./pages/EditResource";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

// Create query client with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Login isSignup={true} />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/create-project" element={<ProtectedRoute><CreateProject /></ProtectedRoute>} />
              <Route path="/create-project/:id" element={<ProtectedRoute><CreateProject /></ProtectedRoute>} />
              <Route path="/project/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
              <Route path="/project/:id/edit" element={<ProtectedRoute><CreateProject /></ProtectedRoute>} />
              <Route path="/estimation-dashboard" element={<Navigate to="/dashboard?tab=estimations" replace />} />
              <Route path="/cost-estimation" element={<ProtectedRoute><CostEstimation /></ProtectedRoute>} />
              <Route path="/cost-estimation/:id" element={<ProtectedRoute><CostEstimation /></ProtectedRoute>} />
              <Route path="/resource-management" element={<ProtectedRoute><ResourceManagement /></ProtectedRoute>} />
              <Route path="/resource-management/add" element={<ProtectedRoute><AddResource /></ProtectedRoute>} />
              <Route path="/resource-management/edit/:id" element={<ProtectedRoute><EditResource /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              
              {/* 404 Route - Keep this last */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
