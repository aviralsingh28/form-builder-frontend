import { apiRequest } from "./client";
import type { CreateFormPayload, Form, FormsListPayload, UpdateFormPayload } from "./types";

export function listForms(page = 1, limit = 10) {
  return apiRequest<FormsListPayload>(`/forms?page=${page}&limit=${limit}`);
}

export function getForm(id: string) {
  return apiRequest<Form>(`/forms/${id}`);
}

export function getPublicForm(id: string) {
  return apiRequest<Form>(`/forms/public/${id}`, { skipAuth: true });
}

export function createForm(body: CreateFormPayload) {
  return apiRequest<Form>("/forms", { method: "POST", body: JSON.stringify(body) });
}

export function updateForm(id: string, body: UpdateFormPayload) {
  return apiRequest<Form>(`/forms/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function publishForm(id: string) {
  return apiRequest<Form>(`/forms/${id}/publish`, { method: "PATCH" });
}

export function unpublishForm(id: string) {
  return apiRequest<Form>(`/forms/${id}/unpublish`, { method: "PATCH" });
}

export function deleteForm(id: string) {
  return apiRequest<void>(`/forms/${id}`, { method: "DELETE" });
}

export function duplicateForm(id: string) {
  return apiRequest<Form>(`/forms/${id}/duplicate`, { method: "POST" });
}

export function toggleStarForm(id: string) {
  return apiRequest<Form>(`/forms/${id}/toggle-star`, { method: "PATCH" });
}
