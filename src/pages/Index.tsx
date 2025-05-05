
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import LoginForm from "@/components/auth/LoginForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskList from "@/components/tasks/TaskList";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import DateSelector from "@/components/ui/DateSelector";
import { TaskStatus, Task } from "@/lib/apiTypes";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { addDays } from "date-fns";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { Moon, Sun } from "lucide-react";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [eventDate, setEventDate] = useState<Date | undefined>(addDays(new Date(), 30));
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
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
    // This would be replaced with actual Supabase query in production
    // For now, using mockTasks to prevent errors
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(1);
      
    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      return;
    }
    
    if (eventsData && eventsData.length > 0) {
      const eventId = eventsData[0].id;
      setEventDate(new Date(eventsData[0].event_date));
      
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('event_id', eventId);
        
      if (tasksError) {
        console.error("Error fetching tasks:", tasksError);
        return;
      }
      
      if (tasksData) {
        const formattedTasks: Task[] = tasksData.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description || "",
          status: task.status as TaskStatus,
          dueDate: new Date(task.due_date),
          owner: task.owner || "",
          comments: [],
          attachments: [],
          createdAt: new Date(task.created_at),
          updatedAt: new Date(task.updated_at),
          isUrgent: new Date(task.due_date) < new Date() && task.status !== 'done'
        }));
        
        setTasks(formattedTasks);
      }
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
      setEventDate(date);
      
      // In a real app, we would update the event date in the database
      const { data: eventsData } = await supabase
        .from('events')
        .select('id')
        .limit(1);
      
      if (eventsData && eventsData.length > 0) {
        const eventId = eventsData[0].id;
        
        const { error } = await supabase
          .from('events')
          .update({ event_date: date.toISOString() })
          .eq('id', eventId);
        
        if (error) {
          throw error;
        }
        
        // Task dates are updated automatically by the database trigger
        // Refresh tasks to show the updated due dates
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
        <div className="container max-w-screen-lg mx-auto px-4 py-8 flex-1 flex items-center justify-center">
          <LoginForm onLogin={handleLogin} />
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
              <DateSelector
                label="Data do Evento"
                date={eventDate}
                onDateChange={handleDateChange}
                className="w-[240px]"
              />
            </div>
          </div>
          
          <DashboardOverview eventDate={eventDate} />
          
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
