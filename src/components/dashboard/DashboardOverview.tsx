
import { Task, TaskStatus } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck2, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface DashboardOverviewProps {
  tasks: Task[];
  eventDate: Date | undefined;
}

const DashboardOverview = ({ tasks, eventDate }: DashboardOverviewProps) => {
  // Calcular porcentagem de conclusão
  const completionPercentage = tasks.length 
    ? Math.round((tasks.filter(task => task.status === 'done').length / tasks.length) * 100) 
    : 0;
  
  // Contar tarefas por status
  const taskCounts = {
    todo: tasks.filter(task => task.status === 'todo').length,
    'in-progress': tasks.filter(task => task.status === 'in-progress').length,
    done: tasks.filter(task => task.status === 'done').length
  };
  
  // Obter tarefas urgentes (vencidas e não concluídas)
  const urgentTasks = tasks.filter(task => 
    task.isUrgent && task.status !== 'done'
  );
  
  // Calcular dias restantes até o evento
  const daysToEvent = eventDate ? 
    Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
    null;
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Progress Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Progresso Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionPercentage}%</div>
          <Progress value={completionPercentage} className="h-2 mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {taskCounts.done} de {taskCounts.todo + taskCounts.done + taskCounts["in-progress"]} tarefas concluídas
          </p>
        </CardContent>
      </Card>
      
      {/* Event Date Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Data do Evento</CardTitle>
        </CardHeader>
        <CardContent>
          {eventDate ? (
            <>
              <div className="text-2xl font-bold">
                {eventDate.toLocaleDateString('pt-BR')}
              </div>
              <div className="flex items-center mt-2">
                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {daysToEvent === 0 ? (
                    "Hoje!"
                  ) : daysToEvent && daysToEvent > 0 ? (
                    `Faltam ${daysToEvent} dias`
                  ) : (
                    `${Math.abs(daysToEvent || 0)} dias atrás`
                  )}
                </p>
              </div>
            </>
          ) : (
            <div className="text-lg font-medium text-muted-foreground">Não definida</div>
          )}
        </CardContent>
      </Card>
      
      {/* Completed Tasks Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tarefas Concluídas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{taskCounts.done}</div>
          <div className="flex items-center mt-2">
            <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
            <p className="text-xs text-muted-foreground">
              {taskCounts["in-progress"]} em andamento
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Urgent Tasks Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tarefas Urgentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{urgentTasks.length}</div>
          <div className="flex items-center mt-2">
            <AlertCircle className="h-4 w-4 mr-1 text-red-500" />
            <p className="text-xs text-muted-foreground">
              Requerem atenção imediata
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
