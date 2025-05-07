import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Users from "./pages/Users";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@salaback.com';

interface AuthState {
  isAuthenticated: boolean;
  userEmail: string | null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
    },
  },
});

const App = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userEmail: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        const isAuthenticated = !!sessionData.session;
        let userEmail = null;

        if (isAuthenticated) {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          userEmail = userData.user?.email || null;
        }

        setAuthState({ isAuthenticated, userEmail });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao verificar autenticação');
        setAuthState({ isAuthenticated: false, userEmail: null });
      } finally {
        setIsLoading(false);
      }

      // Set up auth listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setAuthState({
            isAuthenticated: !!session,
            userEmail: session?.user?.email || null,
          });
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Erro: {error}</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/users" 
                element={authState.isAuthenticated ? <Users /> : <Navigate to="/" replace />} 
              />
              <Route 
                path="/admin" 
                element={authState.isAuthenticated && authState.userEmail === ADMIN_EMAIL ? <Admin /> : <Navigate to="/" replace />} 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
