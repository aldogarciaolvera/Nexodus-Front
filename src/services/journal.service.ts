import { apiFetch, handleResponse } from './api';

export interface ChecklistItemDto {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface NoteDto {
  id: string;
  type: 'idea' | 'diario';
  title?: string;
  content?: string;
  checklist?: ChecklistItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteDto {
  type: 'idea' | 'diario';
  title?: string;
  content?: string;
  checklist?: Omit<ChecklistItemDto, 'id'>[];
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  checklist?: Omit<ChecklistItemDto, 'id'>[];
}

class JournalService {
  async getAll(): Promise<NoteDto[]> {
    const response = await apiFetch('/api/notes');
    return handleResponse(response);
  }

  async getById(id: string): Promise<NoteDto> {
    const response = await apiFetch(`/api/notes/${id}`);
    return handleResponse(response);
  }

  async create(data: CreateNoteDto): Promise<NoteDto> {
    const response = await apiFetch('/api/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }

  async update(id: string, data: UpdateNoteDto): Promise<NoteDto> {
    const response = await apiFetch(`/api/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  }

  async delete(id: string): Promise<void> {
    const response = await apiFetch(`/api/notes/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  }
}

export default new JournalService();
