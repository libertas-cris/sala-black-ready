
import { Database } from "@/integrations/supabase/types";

// Extending the Supabase types with our own application types
export type DbTask = Database['public']['Tables']['tasks']['Row'];
export type DbEvent = Database['public']['Tables']['events']['Row'];
export type DbUser = Database['public']['Tables']['users']['Row'];
export type DbComment = Database['public']['Tables']['comments']['Row'];
export type DbAttachment = Database['public']['Tables']['attachments']['Row'];
export type DbTaskTemplate = Database['public']['Tables']['task_templates']['Row'];

// Our frontend types that match what we're using in the UI
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
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

// Utility functions to convert between DB and frontend types
export function mapDbTaskToTask(dbTask: DbTask): Task {
  // Create empty arrays for comments and attachments by default
  let comments: Comment[] = [];
  let attachments: Attachment[] = [];
  
  // If dbTask.comments exists and is an array, try to convert each item to a Comment
  if (dbTask.comments && Array.isArray(dbTask.comments)) {
    comments = (dbTask.comments as any[]).map(comment => {
      // This is a simplified conversion - in a real app, you'd validate each field
      return {
        id: comment.id || '',
        content: comment.content || '',
        user: comment.user || { id: '', name: '', email: '', role: 'staff' },
        createdAt: new Date(comment.created_at || Date.now())
      };
    });
  }
  
  // If dbTask.attachments exists and is an array, try to convert each item to an Attachment
  if (dbTask.attachments && Array.isArray(dbTask.attachments)) {
    attachments = (dbTask.attachments as any[]).map(attachment => {
      // This is a simplified conversion - in a real app, you'd validate each field
      return {
        id: attachment.id || '',
        name: attachment.name || '',
        url: attachment.url || '',
        type: attachment.type || '',
        size: attachment.size || 0,
        uploadedBy: attachment.uploadedBy || { id: '', name: '', email: '', role: 'staff' },
        uploadedAt: new Date(attachment.uploaded_at || Date.now())
      };
    });
  }
  
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description || '',
    status: dbTask.status as TaskStatus,
    dueDate: new Date(dbTask.due_date),
    owner: dbTask.owner || '',
    comments: comments,
    attachments: attachments,
    createdAt: new Date(dbTask.created_at),
    updatedAt: new Date(dbTask.updated_at),
    isUrgent: new Date(dbTask.due_date) < new Date() && dbTask.status !== 'done'
  };
}

export function mapDbEventToEvent(dbEvent: DbEvent): Event {
  return {
    id: dbEvent.id,
    clinicId: dbEvent.clinic_id,
    eventDate: new Date(dbEvent.event_date),
    createdAt: new Date(dbEvent.created_at)
  };
}
