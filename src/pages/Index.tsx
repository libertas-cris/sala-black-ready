
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import LoginForm from "@/components/auth/LoginForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskList from "@/components/tasks/TaskList";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import DateSelector from "@/components/ui/DateSelector";
import { TaskStatus, Task, mapDbTaskToTask, mapDbEventToEvent } from "@/lib/apiTypes";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { addDays } from "date-fns";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { Moon, Sun, UserPlus, Users } from "lucide-react";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [eventDate, setEventDate] = useState<Date | undefined>(addDays(new Date(), 30));
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (data.session) {
        setIsAuthenticated(true);
        
        // Get user info
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          setUserEmail(userData.user.email || "");
          
          // Get user profile from users table
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', userData.user.id)
            .single();
            
          if (userProfile) {
            setUserName(userProfile.name);
            setIsAdmin(userProfile.role === 'admin');
          }
        }
        
        // Fetch tasks for events
        fetchTasks();
      }
      
      setLoading(false);
    };
    
    checkUser();
  }, []);
  
  const fetchTasks = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      // Buscar o evento do usuário
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('clinic_id', userData.user.id)
        .limit(1)
        .order('created_at', { ascending: false });
        
      if (eventsError) {
        console.error("Erro ao buscar eventos:", eventsError);
        return;
      }
      
      if (eventsData && eventsData.length > 0) {
        const event = mapDbEventToEvent(eventsData[0]);
        setEventDate(event.eventDate);
        
        // Buscar tarefas associadas ao evento
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('event_id', event.id)
          .order('due_date', { ascending: true });
          
        if (tasksError) {
          console.error("Erro ao buscar tarefas:", tasksError);
          return;
        }
        
        if (tasksData) {
          const formattedTasks: Task[] = tasksData.map(task => mapDbTaskToTask(task));
          setTasks(formattedTasks);
        }
      } else {
        // Criar um evento padrão se não existir
        const futureDate = addDays(new Date(), 30);
        
        const { data: newEvent, error: createError } = await supabase
          .from('events')
          .insert({
            clinic_id: userData.user.id,
            event_date: futureDate.toISOString()
          })
          .select()
          .single();
          
        if (createError) {
          console.error("Erro ao criar evento:", createError);
          return;
        }
        
        if (newEvent) {
          // Chamar função para gerar tarefas
          const { error: fnError } = await supabase.rpc('generate_event_tasks', {
            event_id: newEvent.id
          });
          
          if (fnError) {
            console.error("Erro ao gerar tarefas:", fnError);
          } else {
            // Buscar as tarefas geradas
            const { data: tasksData } = await supabase
              .from('tasks')
              .select('*')
              .eq('event_id', newEvent.id)
              .order('due_date', { ascending: true });
              
            if (tasksData) {
              const formattedTasks: Task[] = tasksData.map(task => mapDbTaskToTask(task));
              setTasks(formattedTasks);
              setEventDate(new Date(newEvent.event_date));
            }
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };
  
  const handleLogin = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast({
          title: "Erro ao fazer login",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      if (data.session) {
        setIsAuthenticated(true);
        
        // Get user profile from users table
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (userProfile) {
          setUserName(userProfile.name);
          setUserEmail(data.user.email || "");
          setIsAdmin(userProfile.role === 'admin');
        }
        
        fetchTasks();
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um erro ao tentar fazer login",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserEmail("");
    setUserName("");
    setTasks([]);
    setIsAdmin(false);
  };
  
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);
      
      if (error) {
        throw error;
      }
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus, updatedAt: new Date() } 
            : task
        )
      );
      
      toast({
        title: "Status atualizado",
        description: "O status da tarefa foi atualizado com sucesso!",
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: "Houve um problema ao atualizar o status da tarefa",
        variant: "destructive"
      });
    }
  };
  
  const handleDateChange = async (date: Date | undefined) => {
    if (!date) return;
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      // Atualizar a data do evento
      const { data: eventsData, error: fetchError } = await supabase
        .from('events')
        .select('id')
        .eq('clinic_id', userData.user.id)
        .limit(1)
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (eventsData && eventsData.length > 0) {
        const eventId = eventsData[0].id;
        
        const { error: updateError } = await supabase
          .from('events')
          .update({ event_date: date.toISOString() })
          .eq('id', eventId);
        
        if (updateError) {
          throw updateError;
        }
        
        setEventDate(date);
        
        // As datas das tarefas são atualizadas automaticamente pelo trigger no banco de dados
        // Buscar novamente as tarefas para mostrar as datas atualizadas
        fetchTasks();
        
        toast({
          title: "Data do evento atualizada",
          description: `A data do evento foi definida para ${date.toLocaleDateString('pt-BR')}`,
        });
      }
    } catch (error) {
      console.error("Error updating event date:", error);
      toast({
        title: "Erro ao atualizar data",
        description: "Houve um problema ao atualizar a data do evento",
        variant: "destructive"
      });
    }
  };
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <div className="container flex justify-end p-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
        <div className="container max-w-screen-lg mx-auto px-4 py-8 flex-1 flex flex-col items-center justify-center">
          <LoginForm onLogin={handleLogin} />
          <div className="mt-6 text-center">
            <p className="mb-2 text-muted-foreground">Não tem uma conta ainda?</p>
            <Link to="/register">
              <Button variant="outline">
                <UserPlus className="mr-2 h-4 w-4" />
                Cadastre-se
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar 
        userEmail={userEmail} 
        userName={userName || "Usuário"} 
        onLogout={handleLogout} 
        onThemeToggle={toggleTheme}
        currentTheme={theme}
      />
      
      <main className="flex-1">
        <div className="container max-w-screen-xl mx-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Gerencie as tarefas do seu evento CAIXA RÁPIDO
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link to="/users">
                  <Button variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Gerenciar Usuários
                  </Button>
                </Link>
              )}
              <DateSelector
                label="Data do Evento"
                date={eventDate}
                onDateChange={handleDateChange}
                className="w-[240px]"
              />
            </div>
          </div>
          
          <DashboardOverview tasks={tasks} eventDate={eventDate} />
          
          <div className="mt-8">
            <Tabs defaultValue="todos" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="todos">Todas as Tarefas</TabsTrigger>
                <TabsTrigger value="fazer">A Fazer</TabsTrigger>
                <TabsTrigger value="fazendo">Fazendo</TabsTrigger>
                <TabsTrigger value="feito">Feito</TabsTrigger>
              </TabsList>
              
              <TabsContent value="todos">
                <TaskList tasks={tasks} onStatusChange={handleStatusChange} />
              </TabsContent>
              
              <TabsContent value="fazer">
                <TaskList tasks={tasks.filter(task => task.status === 'todo')} onStatusChange={handleStatusChange} />
              </TabsContent>
              
              <TabsContent value="fazendo">
                <TaskList tasks={tasks.filter(task => task.status === 'in-progress')} onStatusChange={handleStatusChange} />
              </TabsContent>
              
              <TabsContent value="feito">
                <TaskList tasks={tasks.filter(task => task.status === 'done')} onStatusChange={handleStatusChange} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
