
import { useState } from "react";
import { Task, TaskStatus } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  User, 
  MessageSquare 
} from "lucide-react";
import { cn } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

const TaskCard = ({ task, onStatusChange }: TaskCardProps) => {
  const [expanded, setExpanded] = useState(false);
  
  const handleStatusChange = (newStatus: TaskStatus) => {
    if (onStatusChange) {
      onStatusChange(task.id, newStatus);
    }
  };
  
  const getRelativeDate = (date: Date) => {
    try {
      return formatDistanceToNow(date, { addSuffix: true, locale: pt });
    } catch (error) {
      return "Data inválida";
    }
  };
  
  return (
    <Card className={cn(
      "task-card mb-4", 
      task.isUrgent && "urgent",
      expanded && "shadow-md"
    )}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{task.title}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{getRelativeDate(task.dueDate)}</span>
            </CardDescription>
          </div>
          <StatusBadge status={task.status} />
        </div>
      </CardHeader>
      
      <div 
        className="px-6 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-sm text-muted-foreground">
          {expanded ? "Ocultar detalhes" : "Mostrar detalhes"}
        </span>
        {expanded ? 
          <ChevronUp className="h-4 w-4 text-muted-foreground" /> : 
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        }
      </div>
      
      {expanded && (
        <>
          <CardContent className="pt-4">
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Descrição:</h4>
              <p className="text-sm text-muted-foreground">
                {task.description}
              </p>
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground mb-4">
              <User className="h-4 w-4 mr-1" />
              <span>Responsável: {task.owner}</span>
            </div>
            
            {task.comments.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  <h4 className="text-sm font-medium">Comentários ({task.comments.length})</h4>
                </div>
                <div className="space-y-2">
                  {task.comments.map(comment => (
                    <div key={comment.id} className="bg-muted p-2 rounded-md text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{comment.user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {getRelativeDate(comment.createdAt)}
                        </span>
                      </div>
                      <p>{comment.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="pt-0 flex-col items-start">
            <div className="w-full">
              <h4 className="text-sm font-medium mb-2">Alterar status:</h4>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant={task.status === 'todo' ? "default" : "outline"}
                  onClick={() => handleStatusChange('todo')}
                >
                  A fazer
                </Button>
                <Button 
                  size="sm" 
                  variant={task.status === 'in-progress' ? "default" : "outline"}
                  onClick={() => handleStatusChange('in-progress')}
                >
                  Fazendo
                </Button>
                <Button 
                  size="sm" 
                  variant={task.status === 'done' ? "default" : "outline"}
                  onClick={() => handleStatusChange('done')}
                >
                  Feito
                </Button>
              </div>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
};

export default TaskCard;
