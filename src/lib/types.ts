
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  ban_duration?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: Date;
  owner: string;
  comments: Comment[];
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
  isUrgent: boolean;
}

export interface Comment {
  id: string;
  content: string;
  user: User;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: User;
  uploadedAt: Date;
}

export interface Event {
  id: string;
  clinicId: string;
  eventDate: Date;
  createdAt: Date;
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  defaultOwner: string;
  dueInDays: number;
}
