
import { TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const statusLabels: Record<TaskStatus, string> = {
  'todo': 'A fazer',
  'in-progress': 'Fazendo',
  'done': 'Feito'
};

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const baseClasses = "px-2 py-1 text-xs font-medium rounded-full inline-flex items-center justify-center";
  
  const statusClasses = {
    'todo': "bg-gray-200 text-gray-800",
    'in-progress': "bg-sala-blue text-white",
    'done': "bg-green-500 text-white"
  };
  
  return (
    <span className={cn(baseClasses, statusClasses[status], className)}>
      {statusLabels[status]}
    </span>
  );
};

export default StatusBadge;
