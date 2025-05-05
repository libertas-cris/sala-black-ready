
import { useState } from "react";
import { Task, TaskStatus } from "@/lib/types";
import TaskCard from "./TaskCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

const TaskList = ({ tasks, onStatusChange }: TaskListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOwner, setFilteredOwner] = useState<string | null>(null);
  const [filteredStatus, setFilteredStatus] = useState<TaskStatus | null>(null);
  
  const handleClearFilters = () => {
    setSearchTerm("");
    setFilteredOwner(null);
    setFilteredStatus(null);
  };
  
  // Get unique owners from tasks
  const owners = Array.from(new Set(tasks.map(task => task.owner)));
  
  // Filter tasks based on search term, owner, and status
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOwner = filteredOwner ? task.owner === filteredOwner : true;
    const matchesStatus = filteredStatus ? task.status === filteredStatus : true;
    
    return matchesSearch && matchesOwner && matchesStatus;
  });
  
  // Sort tasks by urgency and due date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });
  
  return (
    <div className="w-full">
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          
          {/* Owner filters */}
          {owners.map(owner => (
            <Badge
              key={owner}
              variant={filteredOwner === owner ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilteredOwner(filteredOwner === owner ? null : owner)}
            >
              {owner}
            </Badge>
          ))}
          
          {/* Status filters */}
          <Badge
            variant={filteredStatus === 'todo' ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilteredStatus(filteredStatus === 'todo' ? null : 'todo')}
          >
            A fazer
          </Badge>
          <Badge
            variant={filteredStatus === 'in-progress' ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilteredStatus(filteredStatus === 'in-progress' ? null : 'in-progress')}
          >
            Fazendo
          </Badge>
          <Badge
            variant={filteredStatus === 'done' ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilteredStatus(filteredStatus === 'done' ? null : 'done')}
          >
            Feito
          </Badge>
          
          {/* Clear filters button */}
          {(searchTerm || filteredOwner || filteredStatus) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </Button>
          )}
        </div>
      </div>
      
      {sortedTasks.length > 0 ? (
        <div>
          {sortedTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">
            Nenhuma tarefa encontrada para os filtros aplicados.
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskList;
