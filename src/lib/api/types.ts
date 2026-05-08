export type FormAccessLevel = "PUBLIC" | "AUTHENTICATED" | "ORGANIZATION_ONLY";

export type QuestionType =
  | "SHORT_TYPE"
  | "LONG_TYPE"
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "CHECKBOXES"
  | "DROPDOWN"
  | "FILE_UPLOAD"
  | "DATE"
  | "TIME"
  | "RATING"
  | "IMAGE"
  | "VIDEO"
  | "TEXT";

export interface MediaMeta {
  url: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface ThemeSettings {
  headerImage?: string;
  themeColor?: string;
  backgroundColor?: string;
  fontFamily?: {
    header?: string;
    question?: string;
    text?: string;
  };
  fontSize?: {
    header?: number;
    question?: number;
    text?: number;
  };
}

export interface FormSettings {
  allowMultipleResponses?: boolean;
  collectEmail?: boolean;
  allowFileUpload?: boolean;
  allowCollaboration?: boolean;
  theme?: ThemeSettings;
}

export interface Form {
  _id: string;
  title: string;
  description: string;
  isPublished: boolean;
  accessLevel: FormAccessLevel;
  settingJson?: FormSettings;
  media?: MediaMeta[];
  expiresAt?: string;
  isExpired?: boolean;
  isStarred?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: { name?: string; email?: string };
  questionCount?: number;
  questionSnippets?: string[];
}

export interface Question {
  _id: string;
  formId: string;
  type: QuestionType;
  title: string;
  required: boolean;
  description?: string;
  options?: string[];
  order?: number;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  media?: MediaMeta[];
  // File upload settings
  allowSpecificFileTypes?: boolean;
  allowedFileTypes?: string[];
  maxFiles?: number;
  maxFileSize?: number; // In MB
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface FormsListPayload {
  data: Form[];
  pagination: Pagination;
}

export interface QuestionsListPayload {
  data: Question[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface LoginResult {
  message: string;
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export interface AnswerPayload {
  questionId: string;
  value: string | string[] | number | null;
  attachments?: { url: string; key: string; originalName: string; mimeType?: string; size?: number }[];
}

export interface CreateFormPayload {
  title: string;
  description: string;
  isPublished?: boolean;
  accessLevel?: FormAccessLevel;
  settingJson?: FormSettings;
  media?: MediaMeta[];
  expiresAt?: string;
}

export type UpdateFormPayload = Partial<CreateFormPayload>;
