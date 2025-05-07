import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import LoginForm from "@/components/auth/LoginForm";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/lib/types";
import Navbar from "@/components/layout/Navbar";
import { ChevronRight, Calendar, Settings, Users } from "lucide-react";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Verificar se o usuário está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const isLoggedIn = !!data.session;
      setIsAuthenticated(isLoggedIn);

      if (isLoggedIn && data.session) {
        // Buscar dados do usuário autenticado
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          // Buscar perfil do usuário na tabela users
          const { data: userProfile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userData.user.id)
            .single();

          if (userProfile) {
            setUserName(userProfile.name || '');
            setUserEmail(userProfile.email || '');
            setIsAdmin(userProfile.email === 'admin@salaback.com');
          } else {
            console.error("Erro ao buscar perfil do usuário:", error);
          }

          // Buscar evento relacionado ao usuário
          const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select('*')
            .eq('clinic_id', userData.user.id)
            .single();

          if (eventData) {
            setEventDate(new Date(eventData.event_date));
            
            // Buscar tarefas relacionadas ao evento
            const { data: tasksData, error: tasksError } = await supabase
              .from('tasks')
              .select('*')
              .eq('event_id', eventData.id)
              .order('due_date', { ascending: true });

            if (tasksData) {
              // Mapear para o formato Task
              const mappedTasks: Task[] = tasksData.map((task: any) => ({
                id: task.id,
                title: task.title,
                description: task.description || '',
                status: task.status as any,
                dueDate: new Date(task.due_date),
                owner: task.owner || '',
                comments: task.comments || [],
                attachments: task.attachments || [],
                createdAt: new Date(task.created_at),
                updatedAt: new Date(task.updated_at),
                isUrgent: new Date(task.due_date) < new Date()
              }));
              
              setTasks(mappedTasks);
            } else {
              console.error("Erro ao buscar tarefas:", tasksError);
            }
          } else {
            console.error("Erro ao buscar evento:", eventError);
          }
        }
      }

      setLoading(false);
    };

    checkAuth();

    // Adicionar listener para eventos de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setIsAuthenticated(true);
        checkAuth();
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserName('');
        setUserEmail('');
        setIsAdmin(false);
        setTasks([]);
        setEventDate(undefined);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Função de login
  const handleLogin = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo ao sistema CAIXA RÁPIDO",
      });
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais e tente novamente",
        variant: "destructive",
      });
    }
  };

  // Função de logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // O redirecionamento e limpeza do estado são tratados pelo evento de auth
  };

  // Alternar tema
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Exibir tela de carregamento enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  // Se não estiver autenticado, exibir formulário de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md">
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  // Se estiver autenticado, exibir dashboard
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar 
        userName={userName}
        userEmail={userEmail}
        onLogout={handleLogout}
        onThemeToggle={toggleTheme}
        currentTheme={theme}
      />
      
      <main className="flex-1">
        <div className="container max-w-screen-lg mx-auto p-4 md:p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Bem-vindo, {userName}</h1>
            <p className="text-muted-foreground">Seu Caixa Rápido está programado para {eventDate ? eventDate.toLocaleDateString('pt-BR') : 'data não definida'}</p>
          </header>
          
          <div className="mb-8">
            <DashboardOverview tasks={tasks} eventDate={eventDate} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center" onClick={() => navigate('/users')}>
              <Calendar className="h-8 w-8 mb-2" />
              <span className="text-lg">Gerenciar Tarefas</span>
            </Button>
            
            {isAdmin && (
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center" onClick={() => navigate('/admin')}>
                <Users className="h-8 w-8 mb-2" />
                <span className="text-lg">Área Administrativa</span>
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
