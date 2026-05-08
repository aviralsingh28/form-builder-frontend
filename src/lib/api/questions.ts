import { apiRequest } from "./client";
import type { Question, QuestionType, QuestionsListPayload } from "./types";

export function listQuestionsForForm(formId: string, page = 1, limit = 100) {
  return apiRequest<QuestionsListPayload>(
    `/questions/form/${formId}?page=${page}&limit=${limit}`,
  );
}

export function listPublicQuestionsForForm(formId: string) {
  return apiRequest<{ data: Question[] }>(`/questions/public/form/${formId}`, {
    skipAuth: true,
  });
}

export function createQuestion(body: {
  formId: string;
  type: QuestionType;
  title: string;
  required: boolean;
  description?: string;
  options?: string[];
  order?: number;
  media?: any[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}) {
  return apiRequest<Question>("/questions", { method: "POST", body: JSON.stringify(body) });
}

export function updateQuestion(
  id: string,
  body: Partial<{
    formId: string;
    type: QuestionType;
    title: string;
    required: boolean;
    description: string;
    options: string[];
    order: number;
    minLength: number;
    maxLength: number;
    min: number;
    max: number;
  }>,
) {
  return apiRequest<Question>(`/questions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteQuestion(id: string) {
  return apiRequest<{ message: string }>(`/questions/${id}`, { method: "DELETE" });
}

export function reorderQuestions(formId: string, questionIds: string[]) {
  return apiRequest<{ data: Question[] }>(`/questions/form/${formId}/reorder`, {
    method: "POST",
    body: JSON.stringify({ questionIds }),
  });
}
