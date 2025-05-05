
import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import LoginForm from "@/components/auth/LoginForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskList from "@/components/tasks/TaskList";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import DateSelector from "@/components/ui/DateSelector";
import { getTasksByStatus, mockTasks } from "@/lib/mockData";
import { TaskStatus, Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { addDays } from "date-fns";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [eventDate, setEventDate] = useState<Date | undefined>(addDays(new Date(), 30));
  
  const handleLogin = (email: string, password: string) => {
    // In a real app, this would validate against a backend
    setIsAuthenticated(true);
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
  };
  
  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
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
  };
  
  const handleDateChange = (date: Date | undefined) => {
    setEventDate(date);
    
    if (date) {
      toast({
        title: "Data do evento atualizada",
        description: `A data do evento foi definida para ${date.toLocaleDateString('pt-BR')}`,
      });
      
      // In a real app, this would recalculate all task due dates based on the event date
    }
  };
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <div className="container max-w-screen-lg mx-auto px-4 py-8 flex-1 flex items-center justify-center">
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar userEmail="admin@salaodonto.com" userName="Administrador" onLogout={handleLogout} />
      
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
