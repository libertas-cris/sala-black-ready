
import { Task, TaskStatus, User } from './types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Dr. Silva',
    email: 'dr.silva@salaodonto.com',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Ana Secretária',
    email: 'ana@salaodonto.com',
    role: 'staff',
  },
  {
    id: '3',
    name: 'Carlos Assistente',
    email: 'carlos@salaodonto.com',
    role: 'staff',
  },
];

const generateMockTask = (
  id: string,
  title: string,
  description: string,
  status: TaskStatus,
  daysToEvent: number,
  owner: string,
  isUrgent: boolean = false
): Task => {
  const now = new Date();
  const dueDate = new Date();
  dueDate.setDate(now.getDate() + daysToEvent);
  
  return {
    id,
    title,
    description,
    status,
    dueDate,
    owner,
    comments: [],
    attachments: [],
    createdAt: now,
    updatedAt: now,
    isUrgent,
  };
};

export const mockTasks: Task[] = [
  generateMockTask(
    '1',
    'Confirmar local do evento',
    'Entrar em contato com o hotel/espaço de eventos para confirmar a reserva e discutir detalhes logísticos.',
    'done',
    -30,
    'Dr. Silva'
  ),
  generateMockTask(
    '2',
    'Enviar convites para participantes',
    'Preparar e enviar convites oficiais para todos os participantes confirmados.',
    'in-progress',
    -20,
    'Ana Secretária'
  ),
  generateMockTask(
    '3',
    'Contratar serviço de coffee break',
    'Selecionar e contratar empresa responsável pelo coffee break durante o evento.',
    'todo',
    -15,
    'Carlos Assistente',
    true
  ),
  generateMockTask(
    '4',
    'Preparar material promocional',
    'Criar e imprimir folhetos, banners e outros materiais promocionais para o evento.',
    'todo',
    -10,
    'Ana Secretária'
  ),
  generateMockTask(
    '5',
    'Confirmar palestrantes',
    'Entrar em contato com todos os palestrantes para confirmar presença e detalhes da apresentação.',
    'in-progress',
    -7,
    'Dr. Silva',
    true
  ),
  generateMockTask(
    '6',
    'Testar equipamentos audiovisuais',
    'Verificar funcionamento de projetores, microfones e sistemas de som antes do evento.',
    'todo',
    -3,
    'Carlos Assistente'
  ),
  generateMockTask(
    '7',
    'Imprimir lista de presença',
    'Preparar lista de presença para controle de participantes no dia do evento.',
    'todo',
    -2,
    'Ana Secretária'
  ),
  generateMockTask(
    '8',
    'Confirmar transporte da equipe',
    'Organizar transporte para equipe até o local do evento.',
    'todo',
    -1,
    'Dr. Silva'
  ),
];

export const getTasksByStatus = (status: TaskStatus): Task[] => {
  return mockTasks.filter(task => task.status === status);
};

export const getTotalTasksByStatus = (): Record<TaskStatus, number> => {
  const counts: Record<TaskStatus, number> = {
    'todo': 0,
    'in-progress': 0,
    'done': 0,
  };
  
  mockTasks.forEach(task => {
    counts[task.status]++;
  });
  
  return counts;
};

export const getCompletionPercentage = (): number => {
  const done = mockTasks.filter(task => task.status === 'done').length;
  return Math.round((done / mockTasks.length) * 100);
};

export const getUrgentTasks = (): Task[] => {
  return mockTasks.filter(task => task.isUrgent);
};
