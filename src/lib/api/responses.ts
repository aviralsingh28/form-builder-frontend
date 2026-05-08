import { apiRequest } from "./client";
import type { AnswerPayload } from "./types";

export interface FormResponse {
  _id: string;
  formId: string;
  answer: {
    questionId: string;
    value: unknown;
    attachments?: { url: string; key: string; originalName: string; mimeType?: string; size?: number }[];
  }[];
  submittedAt?: string;
  isPartial?: boolean;
  submittedBy?: { name?: string; email?: string };
}

export interface ResponsesPage {
  data: FormResponse[];
  pagination: { total: number; page: number; limit: number; pages: number };
}

export function submitResponse(payload: {
  formId: string;
  answer: AnswerPayload[];
  metaData?: Record<string, unknown>;
  isPartial?: boolean;
}) {
  return apiRequest<FormResponse>("/responses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listResponsesForForm(formId: string, page = 1, limit = 20) {
  return apiRequest<ResponsesPage>(
    `/responses/form/${formId}?page=${page}&limit=${limit}`,
  );
}

export type QuestionSummary = {
  questionId: string;
  title: string;
  type: string;
  answeredCount: number;
  choiceCounts?: Record<string, number>;
  averageRating?: number | null;
  ratingDistribution?: Record<number, number>;
  sampleAnswers?: string[];
  textAnswerCount?: number;
  dateCounts?: Record<string, number>;
  answeredNonEmpty?: number;
  fileAttachments?: { url: string; originalName: string; mimeType?: string; size?: number }[];
};

export function getFormResponseSummary(formId: string) {
  return apiRequest<{
    totalResponses: number;
    questionSummaries: QuestionSummary[];
  }>(`/responses/form/${formId}/summary`);
}
