"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Video,
  Image,
  Copy,
  Trash2,
  MoreVertical,
  CheckSquare,
  Circle,
  X,
  Plus,
  Upload,
  Type,
  BetweenVerticalEnd,
  GripVertical,
  Clock,
} from "lucide-react";
import { uploadFile, uploadVideo as apiUploadVideo } from "@/lib/api/upload";
import {
  deleteForm,
  duplicateForm,
  getForm,
  publishForm,
  unpublishForm,
  updateForm,
  toggleStarForm,
} from "@/lib/api/forms";
import { createQuestion, deleteQuestion, listQuestionsForForm, reorderQuestions, updateQuestion } from "@/lib/api/questions";
import {
  getFormResponseSummary,
  listResponsesForForm,
  type FormResponse,
  type QuestionSummary,
} from "@/lib/api/responses";
import type { Form, FormAccessLevel, FormSettings, Question, QuestionType } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";
import { idOf } from "@/lib/utils/id";
import { CheckboxField, Field, Input, Select, Textarea, DateField, TimeField } from "@/components/ui";
import { FormWorkspaceHeader } from "@/components/forms/FormWorkspaceHeader";
import { generateThemeVariables } from "@/lib/utils/color";
import { FormPreview } from "@/components/forms/FormPreview";
import { ThemeCustomizer } from "@/components/forms/ThemeCustomizer";
import { ThemeSettings } from "@/lib/api/types";
import { ResponsesView } from "@/components/forms/ResponsesView";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "SHORT_TYPE", label: "Short answer" },
  { value: "LONG_TYPE", label: "Paragraph" },
  { value: "SINGLE_CHOICE", label: "Multiple choice" },
  { value: "MULTIPLE_CHOICE", label: "Checkboxes" },
  { value: "DROPDOWN", label: "Dropdown" },
  { value: "FILE_UPLOAD", label: "File upload" },
  { value: "DATE", label: "Date" },
  { value: "TIME", label: "Time" },
  { value: "RATING", label: "Linear scale" },
  { value: "IMAGE", label: "Image" },
  { value: "VIDEO", label: "Video" },
  { value: "TEXT", label: "Text block" },
];

type Tab = "questions" | "responses" | "settings";

function needsOptions(t: QuestionType) {
  return ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "CHECKBOXES", "DROPDOWN"].includes(t);
}

function optionChoiceStyle(type: QuestionType): "radio" | "check" {
  if (type === "SINGLE_CHOICE" || type === "DROPDOWN") return "radio";
  return "check";
}

function OptionsPreview({ q }: { q: Question }) {
  if (!q.options?.length) return null;
  const kind = optionChoiceStyle(q.type);
  return (
    <ul className="gf-q-options">
      {q.options.map((o) => (
        <li key={o}>
          <span className={kind === "radio" ? "gf-q-options__radio" : "gf-q-options__check"} aria-hidden />
          {o}
        </li>
      ))}
    </ul>
  );
}

export function FormBuilder() {
  const params = useParams();
  const router = useRouter();
  const formId = String(params.formId ?? "");
  const addQuestionRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>("questions");
  const [form, setForm] = useState<Form | null>(null);
  const [headerTitle, setHeaderTitle] = useState("");
  const [headerDesc, setHeaderDesc] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [summary, setSummary] = useState<{
    totalResponses: number;
    questionSummaries: QuestionSummary[];
  } | null>(null);
  const [respPage, setRespPage] = useState(1);
  const [respPages, setRespPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);
  const [duping, setDuping] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const [draftAccess, setDraftAccess] = useState<FormAccessLevel>("PUBLIC");
  const [draftSettings, setDraftSettings] = useState<FormSettings>({});

  const [newType, setNewType] = useState<QuestionType>("SINGLE_CHOICE");
  const [newTitle, setNewTitle] = useState("");
  const [newRequired, setNewRequired] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [newOptions, setNewOptions] = useState<string[]>(["Option 1"]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  // Undo/Redo history for questions
  const [questionsHistory, setQuestionsHistory] = useState<Question[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Update history when questions change from API calls
  useEffect(() => {
    const lastHistory = questionsHistory[historyIndex];
    if (JSON.stringify(questions) !== JSON.stringify(lastHistory)) {
      // Add new state to history and remove redo states
      const newHistory = questionsHistory.slice(0, historyIndex + 1);
      newHistory.push(questions);
      setQuestionsHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [questions]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setQuestions(questionsHistory[newIndex]);
    }
  }, [historyIndex, questionsHistory]);

  const handleRedo = useCallback(() => {
    if (historyIndex < questionsHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setQuestions(questionsHistory[newIndex]);
    }
  }, [historyIndex, questionsHistory]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < questionsHistory.length - 1;

  const loadForm = useCallback(async () => {
    const f = await getForm(formId);
    setForm(f);
    setHeaderTitle(f.title);
    setHeaderDesc(f.description);
    setDraftAccess(f.accessLevel);
    setDraftSettings({
      allowMultipleResponses: false,
      collectEmail: false,
      allowFileUpload: false,
      allowCollaboration: false,
      ...f.settingJson,
    });
  }, [formId]);

  const loadQuestions = useCallback(async () => {
    const q = await listQuestionsForForm(formId, 1, 200);
    setQuestions(q.data);
  }, [formId]);

  const loadResponses = useCallback(async () => {
    const r = await listResponsesForForm(formId, 1, 1000);
    setResponses(r.data);
    setRespPages(r.pagination.total || 1); // We can just use total for individual count
  }, [formId]);

  const loadSummary = useCallback(async () => {
    const s = await getFormResponseSummary(formId);
    setSummary(s);
  }, [formId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadForm();
        await loadQuestions();
        await loadSummary();
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadForm, loadQuestions, loadSummary]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      // Reload form data when navigating with back/forward
      void loadForm();
      void loadQuestions();
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [loadForm, loadQuestions]);

  useEffect(() => {
    if (tab !== "responses") return;
    let cancelled = false;
    (async () => {
      try {
        await loadResponses();
        if (!cancelled) await loadSummary();
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Failed to load responses");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, loadResponses, loadSummary]);

  useEffect(() => {
    if (questions.length === 0) {
      setActiveQuestionId(null);
      return;
    }
    setActiveQuestionId((prev) => {
      if (prev && questions.some((q) => idOf(q) === prev)) return prev;
      return idOf(questions[0]);
    });
  }, [questions]);

  const publicLink = useMemo(() => {
    if (!form || !formId || typeof window === "undefined") return "";
    return `${window.location.origin}/f/${formId}`;
  }, [form, formId]);

  const onCopyLink = useCallback(async () => {
    if (!publicLink) {
      setError("Link is not available. Please try again.");
      return;
    }
    
    try {
      await navigator.clipboard.writeText(publicLink);
      // Show success message
      alert(`Responder link copied!\n\n${publicLink}`);
    } catch (err) {
      setError("Failed to copy link to clipboard. Please try again.");
    }
  }, [publicLink]);

  async function saveHeaderMeta() {
    if (!form || headerTitle.trim() === form.title && headerDesc === form.description) return;
    setSavingMeta(true);
    setError(null);
    try {
      const updated = await updateForm(formId, {
        title: headerTitle.trim() || "Untitled form",
        description: headerDesc,
      });
      setForm(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save title");
    } finally {
      setSavingMeta(false);
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingMeta(true);
    setError(null);
    try {
      const updated = await updateForm(formId, {
        title: headerTitle.trim() || "Untitled form",
        description: headerDesc,
        accessLevel: draftAccess,
        settingJson: draftSettings,
      });
      setForm(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSavingMeta(false);
    }
  }

  async function onPublish() {
    setError(null);
    try {
      const updated = await publishForm(formId);
      setForm(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Publish failed");
    }
  }

  async function onUnpublish() {
    setError(null);
    try {
      const updated = await unpublishForm(formId);
      setForm(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unpublish failed");
    }
  }

  async function onDuplicate() {
    setDuping(true);
    setError(null);
    try {
      const copy = await duplicateForm(formId);
      router.push(`/forms/${idOf(copy)}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Duplicate failed");
    } finally {
      setDuping(false);
    }
  }

  async function onDeleteForm() {
    if (!window.confirm("Move this form to trash? Questions will be removed.")) return;
    setError(null);
    try {
      await deleteForm(formId);
      router.push("/");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Delete failed");
    }
  }

  async function onToggleStar() {
    setError(null);
    try {
      const updated = await toggleStarForm(formId);
      setForm(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Toggle star failed");
    }
  }

  async function persistQuestionOrder(next: Question[]) {
    await reorderQuestions(formId, next.map((q) => idOf(q)));
    setQuestions(next);
  }

  function onDragStart(index: number) {
    setDragIndex(index);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function onDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    const next = [...questions];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setDragIndex(null);
    persistQuestionOrder(next).catch((e) => {
      setError(e instanceof ApiError ? e.message : "Reorder failed");
      void loadQuestions();
    });
  }

  async function onAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const options = needsOptions(newType) ? newOptions : undefined;
    if (needsOptions(newType) && (!options || options.length === 0)) {
      setError("Add options for this question type.");
      return;
    }
    try {
      const order = questions.reduce((m, q) => Math.max(m, q.order ?? 0), 0) + 1;
      await createQuestion({
        formId,
        type: newType,
        title: newTitle.trim() || "Untitled Question",
        required: newRequired,
        description: newDescription || undefined,
        options: needsOptions(newType) ? newOptions : undefined,
        order,
      });
      setNewTitle("");
      setNewDescription("");
      setNewOptions(["Option 1"]);
      setNewType("SINGLE_CHOICE");
      await loadQuestions();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not add question");
    }
  }

  async function onAddMedia(type: "IMAGE" | "VIDEO", file: File) {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (type === "IMAGE") {
        data = await uploadFile(file, "forms");
      } else {
        data = await apiUploadVideo(file, "videos");
      }

      const order = questions.reduce((m, q) => Math.max(m, q.order ?? 0), 0) + 1;
      await createQuestion({
        formId,
        type,
        title: type === "IMAGE" ? "Image" : "Video",
        required: false,
        media: [{
          url: data.url,
          key: data.key,
          originalName: file.name,
          mimeType: file.type,
          size: file.size
        }],
        order,
      });
      await loadQuestions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  async function onAddText() {
    setError(null);
    const order = questions.reduce((m, q) => Math.max(m, q.order ?? 0), 0) + 1;
    try {
      await createQuestion({
        formId,
        type: "TEXT",
        title: "Title",
        description: "Description",
        required: false,
        order,
      });
      await loadQuestions();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not add text");
    }
  }

  async function onDeleteQuestion(id: string) {
    if (!window.confirm("Delete this question?")) return;
    setError(null);
    try {
      await deleteQuestion(id);
      await loadQuestions();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Delete failed");
    }
  }

  async function moveQuestion(q: Question, dir: -1 | 1) {
    const idx = questions.findIndex((x) => idOf(x) === idOf(q));
    const j = idx + dir;
    if (j < 0 || j >= questions.length) return;
    const next = [...questions];
    const t = next[idx];
    next[idx] = next[j];
    next[j] = t;
    setError(null);
    try {
      await persistQuestionOrder(next);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Reorder failed");
      void loadQuestions();
    }
  }

  async function onUpdateQuestion(id: string, updates: Partial<Question>) {
    try {
      await updateQuestion(id, updates);
      await loadQuestions();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Update failed");
    }
  }

  async function onDuplicateQuestion(q: Question) {
    setError(null);
    try {
      const order = (q.order ?? 0) + 1;
      const {
        type,
        title,
        required,
        description,
        options,
        media,
        minLength,
        maxLength,
        min,
        max,
      } = q;

      await createQuestion({
        formId,
        type,
        title,
        required,
        description,
        options,
        media,
        order,
        minLength,
        maxLength,
        min,
        max,
      });
      await loadQuestions();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Duplicate failed");
    }
  }

  function renderSummaryRow(label: string, count: number, max: number, key: string) {
    const pct = max > 0 ? Math.round((count / max) * 100) : 0;
    return (
      <div className="gf-summary-row" key={key}>
        <span style={{ width: 120, flexShrink: 0 }} className="muted small">
          {label}
        </span>
        <div className="gf-summary-bar">
          <span style={{ width: `${pct}%` }} />
        </div>
        <span className="small" style={{ width: 36, textAlign: "right" }}>
          {count}
        </span>
      </div>
    );
  }

  function scrollToAddQuestion() {
    addQuestionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  if (loading || !form) {
    return (
      <div className="gf-form-editor">
        <div className="gf-editor-loading">
          {error && <div className="banner error">{error}</div>}
          {loading ? "Opening form…" : "Form not found."}
        </div>
      </div>
    );
  }

  const primaryPublish =
    form.isPublished ? (
      <button type="button" className="gf-publish-btn gf-publish-btn--ghost" onClick={onUnpublish}>
        Unpublish
      </button>
    ) : (
      <button type="button" className="gf-publish-btn" onClick={onPublish}>
        Publish
      </button>
    );

  const onThemeChange = async (theme: ThemeSettings) => {
    const nextSettings = { ...form?.settingJson, theme };
    setDraftSettings(nextSettings);
    
    // Optimistic UI update for the form object
    setForm(prev => prev ? { ...prev, settingJson: nextSettings } : null);
    
    try {
      await updateForm(formId, {
        settingJson: nextSettings
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to update theme");
    }
  };

  return (
    <div className="gf-form-editor" style={generateThemeVariables(form.settingJson?.theme)}>
      {!showPreview && (
        <FormWorkspaceHeader
          docTitle={headerTitle}
          onDocTitleChange={setHeaderTitle}
          primaryAction={primaryPublish}
          onPreview={() => setShowPreview(true)}
          onThemeOpen={() => setIsThemeOpen(true)}
          onCopyLink={onCopyLink}
          onStar={onToggleStar}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          isStarred={form?.isStarred ?? false}
          menuExtra={
            <>
              {form.isPublished && form.accessLevel === "PUBLIC" && publicLink ? (
                <a href={publicLink} className="gf-form-editor__menu-row" target="_blank" rel="noreferrer">
                  View public link
                </a>
              ) : null}
              <button type="button" className="gf-form-editor__menu-row" disabled={duping} onClick={onDuplicate}>
                {duping ? "Copying…" : "Make a copy"}
              </button>
              <button type="button" className="gf-form-editor__menu-row" onClick={onDeleteForm}>
                Delete form
              </button>
              <Link href="/" className="gf-form-editor__menu-row">
                My forms
              </Link>
            </>
          }
        />
      )}

      {!showPreview && (
        <div className="gf-form-editor__tabs-wrap">
        <nav className="gf-tabs gf-tabs--forms" aria-label="Form sections">
          <button type="button" className={tab === "questions" ? "is-active" : ""} onClick={() => setTab("questions")}>
            Questions
          </button>
          <button type="button" className={tab === "responses" ? "is-active" : ""} onClick={() => setTab("responses")}>
            Responses {summary?.totalResponses !== undefined ? `(${summary.totalResponses})` : ""}
          </button>
          <button type="button" className={tab === "settings" ? "is-active" : ""} onClick={() => setTab("settings")}>
            Settings
          </button>
        </nav>
      </div>
      )}

      <div className="gf-form-editor__body" style={showPreview ? { display: 'none' } : {}}>
        {error && <div className="banner error" style={{ margin: "0 1rem" }}>{error}</div>}
        {savingMeta && (
          <p className="muted small" style={{ margin: "0.25rem 1rem 0" }}>
            Saving…
          </p>
        )}

        {tab === "questions" && (
          <div className="gf-editor-canvas-row">
            <div className="gf-editor-layout">
              {form.settingJson?.theme?.headerImage && (
                <div 
                  className="gf-editor-header-image" 
                  style={{ 
                    backgroundImage: `url(${form.settingJson.theme.headerImage})`,
                    height: '200px',
                    width: '100%',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '8px 8px 0 0',
                    marginBottom: '-8px'
                  }} 
                />
              )}
              <section className="gf-editor-title-sheet" aria-label="Form title and description" style={{ 
                borderTop: form.settingJson?.theme?.headerImage ? 'none' : `10px solid ${form.settingJson?.theme?.themeColor || 'var(--gf-purple)'}`,
                borderTopLeftRadius: form.settingJson?.theme?.headerImage ? '0' : '8px',
                borderTopRightRadius: form.settingJson?.theme?.headerImage ? '0' : '8px'
              }}>
                <input
                  className="gf-editor-title"
                  value={headerTitle}
                  onChange={(e) => setHeaderTitle(e.target.value)}
                  onBlur={() => void saveHeaderMeta()}
                  placeholder="Untitled form"
                />
                <textarea
                  className="gf-editor-desc"
                  value={headerDesc}
                  onChange={(e) => setHeaderDesc(e.target.value)}
                  onBlur={() => void saveHeaderMeta()}
                  placeholder="Form description"
                  rows={2}
                />
              </section>

              <ul className="question-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {questions.map((q, i) => {
                  const qid = idOf(q);
                  const isActive = activeQuestionId === qid;
                  const typeLabel = QUESTION_TYPES.find((t) => t.value === q.type)?.label ?? q.type;

                  if (isActive) {
                    return (
                      <li key={qid} className="gf-question-card gf-question-card--active">
                        <div className="gf-question-card__handle" aria-hidden><GripVertical size={18} /></div>
                        <div className="gf-editor-q-main">
                          <div className="row gap-md wrap items-start">
                            <input
                              className="gf-editor-q-title-input"
                              value={q.title}
                              onChange={(e) => onUpdateQuestion(qid, { title: e.target.value })}
                              placeholder="Question"
                            />
                            <button className="btn ghost icon-only"><Image size={20} /></button>
                            <Select
                              className="gf-editor-q-type-select"
                              value={q.type}
                              onChange={(e) => onUpdateQuestion(qid, { type: e.target.value as QuestionType })}
                            >
                              {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </Select>
                          </div>

                          <div className="gf-editor-q-options-list">
                            {needsOptions(q.type) && (q.options || ["Option 1"]).map((opt, idx) => (
                              <div key={idx} className="gf-editor-q-option-row">
                                {optionChoiceStyle(q.type) === "radio" ? <Circle size={18} className="muted" /> : <CheckSquare size={18} className="muted" />}
                                <input
                                  className="gf-editor-q-option-input"
                                  value={opt}
                                  onChange={(e) => {
                                    const next = [...(q.options || [])];
                                    next[idx] = e.target.value;
                                    onUpdateQuestion(qid, { options: next });
                                  }}
                                />
                                <button className="btn ghost icon-only small" onClick={() => {
                                  const next = (q.options || []).filter((_, j) => j !== idx);
                                  onUpdateQuestion(qid, { options: next });
                                }}><X size={16} /></button>
                              </div>
                            ))}
                            {q.type === "DATE" && (
                              <div className="gf-editor-q-option-row">
                                <DateField disabled className="minimal" style={{ maxWidth: '240px', pointerEvents: 'none' }} />
                              </div>
                            )}
                            {q.type === "TIME" && (
                              <div className="gf-editor-q-option-row">
                                <TimeField disabled className="minimal" style={{ maxWidth: '240px', pointerEvents: 'none' }} />
                              </div>
                            )}
                            {needsOptions(q.type) && (
                              <div className="gf-editor-q-option-row gf-editor-q-option-row--add">
                                {optionChoiceStyle(q.type) === "radio" ? <Circle size={18} className="muted" /> : <CheckSquare size={18} className="muted" />}
                                <button className="btn ghost small" onClick={() => {
                                  const next = [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`];
                                  onUpdateQuestion(qid, { options: next });
                                }}>Add option</button>
                                <span className="muted">or</span>
                                <button className="btn ghost small brand">Add "Other"</button>
                              </div>
                            )}

                            {q.type === "FILE_UPLOAD" && (
                              <div className="gf-editor-file-upload-settings stack gap-md" style={{ marginTop: '1rem', borderTop: '1px solid var(--gf-border)', paddingTop: '1rem' }}>
                                <div className="row items-center justify-between">
                                  <span className="small">Allow only specific file types</span>
                                  <label className="gf-switch">
                                    <input
                                      type="checkbox"
                                      checked={q.allowSpecificFileTypes || false}
                                      onChange={(e) => onUpdateQuestion(qid, { allowSpecificFileTypes: e.target.checked })}
                                    />
                                  </label>
                                </div>
                                
                                {q.allowSpecificFileTypes && (
                                  <div className="grid grid-cols-2 gap-sm" style={{ paddingLeft: '1rem' }}>
                                    {['Document', 'Spreadsheet', 'PDF', 'Video', 'Presentation', 'Drawing', 'Image', 'Audio'].map((type) => (
                                      <label key={type} className="row items-center gap-sm small">
                                        <input
                                          type="checkbox"
                                          checked={q.allowedFileTypes?.includes(type.toUpperCase()) || false}
                                          onChange={(e) => {
                                            const current = q.allowedFileTypes || [];
                                            const next = e.target.checked
                                              ? [...current, type.toUpperCase()]
                                              : current.filter(t => t !== type.toUpperCase());
                                            onUpdateQuestion(qid, { allowedFileTypes: next });
                                          }}
                                        />
                                        {type}
                                      </label>
                                    ))}
                                  </div>
                                )}

                                <div className="row items-center gap-md">
                                  <span className="small" style={{ minWidth: '160px' }}>Maximum number of files</span>
                                  <Select
                                    className="minimal small"
                                    value={q.maxFiles || 1}
                                    onChange={(e) => onUpdateQuestion(qid, { maxFiles: Number(e.target.value) })}
                                    style={{ width: '80px' }}
                                  >
                                    <option value={1}>1</option>
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                  </Select>
                                </div>

                                <div className="row items-center gap-md">
                                  <span className="small" style={{ minWidth: '160px' }}>Maximum file size</span>
                                  <Select
                                    className="minimal small"
                                    value={q.maxFileSize || 10}
                                    onChange={(e) => onUpdateQuestion(qid, { maxFileSize: Number(e.target.value) })}
                                    style={{ width: '100px' }}
                                  >
                                    <option value={1}>1 MB</option>
                                    <option value={10}>10 MB</option>
                                    <option value={100}>100 MB</option>
                                    <option value={1000}>1 GB</option>
                                  </Select>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="gf-question-card__footer">
                          <button className="btn ghost icon-only" title="Duplicate" onClick={() => onDuplicateQuestion(q)}><Copy size={20} /></button>
                          <button className="btn ghost icon-only" title="Delete" onClick={() => onDeleteQuestion(qid)}><Trash2 size={20} /></button>
                          <div className="gf-footer-divider" />
                          <label className="gf-required-toggle">
                            <span>Required</span>
                            <input
                              type="checkbox"
                              checked={q.required}
                              onChange={(e) => onUpdateQuestion(qid, { required: e.target.checked })}
                            />
                          </label>
                          <button className="btn ghost icon-only"><MoreVertical size={20} /></button>
                        </div>
                      </li>
                    );
                  }

                  return (
                    <li
                      key={qid}
                      className={`gf-question-card gf-question-card--with-drag ${activeQuestionId === qid ? "gf-question-card--active" : ""
                        } ${dragIndex === i ? "dragging" : ""}`}
                      draggable
                      onDragStart={() => onDragStart(i)}
                      onDragOver={onDragOver}
                      onDrop={() => onDrop(i)}
                      onClick={() => setActiveQuestionId(qid)}
                    >
                      <div className="gf-question-card__handle" aria-hidden>
                        <GripVertical size={18} />
                      </div>
                      <div className="gf-q-type-pill">{typeLabel}</div>
                      <div className="gf-q-title-box">{q.title}</div>
                      {q.description && <p className="muted small" style={{ margin: "0 0 0.75rem" }}>{q.description}</p>}
                      {needsOptions(q.type) && <OptionsPreview q={q} />}
                      {!needsOptions(q.type) && q.type === "SHORT_TYPE" && (
                        <p className="muted small" style={{ margin: 0 }}>
                          Short answer text
                        </p>
                      )}
                      {!needsOptions(q.type) && q.type === "LONG_TYPE" && (
                        <p className="muted small" style={{ margin: 0 }}>
                          Paragraph
                        </p>
                      )}
                      {!needsOptions(q.type) && q.type === "DATE" && (
                        <p className="muted small" style={{ margin: 0 }}>
                          Date
                        </p>
                      )}
                      {!needsOptions(q.type) && q.type === "TIME" && (
                        <p className="muted small" style={{ margin: 0 }}>
                          Time
                        </p>
                      )}
                      {!needsOptions(q.type) && q.type === "RATING" && (
                        <p className="muted small" style={{ margin: 0 }}>
                          Linear scale
                        </p>
                      )}
                      {!needsOptions(q.type) && q.type === "FILE_UPLOAD" && (
                        <p className="muted small" style={{ margin: 0 }}>
                          File upload
                        </p>
                      )}
                      {q.type === "IMAGE" && q.media?.[0] && (
                        <div className="gf-q-media">
                          <img src={q.media[0].url} alt={q.title} style={{ maxWidth: '100%', borderRadius: '4px' }} />
                        </div>
                      )}
                      {q.type === "VIDEO" && q.media?.[0] && (
                        <div className="gf-q-media">
                          <video src={q.media[0].url} controls style={{ maxWidth: '100%', borderRadius: '4px' }} />
                        </div>
                      )}
                      {q.type === "TEXT" && (
                        <div className="gf-q-text-block">
                          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>{q.title}</h3>
                          <p className="muted small" style={{ margin: 0 }}>{q.description}</p>
                        </div>
                      )}
                      <div className="gf-question-card__footer" onClick={(e) => e.stopPropagation()}>
                        {q.required && (
                          <span className="tag warn" style={{ marginRight: "auto" }}>
                            Required
                          </span>
                        )}
                        <button type="button" className="btn small ghost" disabled={i === 0} onClick={() => moveQuestion(q, -1)}>
                          Up
                        </button>
                        <button
                          type="button"
                          className="btn small ghost"
                          disabled={i === questions.length - 1}
                          onClick={() => moveQuestion(q, 1)}
                        >
                          Down
                        </button>
                        <button type="button" className="btn small danger" onClick={() => onDeleteQuestion(qid)}>
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div ref={addQuestionRef} className="gf-add-question-card">
                <div className="gf-editor-q-main">
                  <div className="row gap-md wrap items-start">
                    <input
                      className="gf-editor-q-title-input"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Untitled Question"
                    />
                    <button className="btn ghost icon-only"><Image size={20} /></button>
                    <Select
                      className="gf-editor-q-type-select"
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as QuestionType)}
                    >
                      {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </Select>
                  </div>

                  <div className="gf-editor-q-options-list">
                    {needsOptions(newType) && newOptions.map((opt, idx) => (
                      <div key={idx} className="gf-editor-q-option-row">
                        {optionChoiceStyle(newType) === "radio" ? <Circle size={18} className="muted" /> : <CheckSquare size={18} className="muted" />}
                        <input
                          className="gf-editor-q-option-input"
                          value={opt}
                          onChange={(e) => {
                            const next = [...newOptions];
                            next[idx] = e.target.value;
                            setNewOptions(next);
                          }}
                        />
                        <button className="btn ghost icon-only small" onClick={() => {
                          setNewOptions(newOptions.filter((_, j) => j !== idx));
                        }}><X size={16} /></button>
                      </div>
                    ))}
                    {newType === "DATE" && (
                      <div className="gf-editor-q-option-row">
                        <DateField disabled className="minimal" style={{ maxWidth: '240px', pointerEvents: 'none' }} />
                      </div>
                    )}
                    {newType === "TIME" && (
                      <div className="gf-editor-q-option-row">
                        <TimeField disabled className="minimal" style={{ maxWidth: '240px', pointerEvents: 'none' }} />
                      </div>
                    )}
                    {needsOptions(newType) && (
                      <div className="gf-editor-q-option-row gf-editor-q-option-row--add">
                        {optionChoiceStyle(newType) === "radio" ? <Circle size={18} className="muted" /> : <CheckSquare size={18} className="muted" />}
                        <button type="button" className="btn ghost small" onClick={() => {
                          setNewOptions([...newOptions, `Option ${newOptions.length + 1}`]);
                        }}>Add option</button>
                        <span className="muted">or</span>
                        <button type="button" className="btn ghost small brand" onClick={() => {
                          setNewOptions([...newOptions, "Other..."]);
                        }}>Add "Other"</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="gf-question-card__footer">
                   <div className="gf-footer-divider" style={{ marginLeft: 'auto' }} />
                   <label className="gf-required-toggle">
                     <span>Required</span>
                     <input 
                       type="checkbox" 
                       checked={newRequired} 
                       onChange={(e) => setNewRequired(e.target.checked)} 
                     />
                   </label>
                   <button type="button" className="btn primary" onClick={onAddQuestion}>Add question</button>
                </div>
              </div>
            </div>

            <aside className="gf-editor-rail" aria-label="Insert questions">
              <button type="button" className="gf-editor-rail__btn" aria-label="Add question" onClick={scrollToAddQuestion}>
                <Plus size={22} />
              </button>
              <button type="button" className="gf-editor-rail__btn" aria-label="Import questions" onClick={scrollToAddQuestion}>
                <Upload size={20} />
              </button>
              <button type="button" className="gf-editor-rail__btn" aria-label="Add title and description" onClick={onAddText}>
                <Type size={20} />
              </button>
              <button type="button" className="gf-editor-rail__btn" aria-label="Add image" onClick={() => fileInputRef.current?.click()}>
                <Image size={20} />
              </button>
              <button type="button" className="gf-editor-rail__btn" aria-label="Add video" onClick={() => videoInputRef.current?.click()}>
                <Video size={20} />
              </button>
              <button type="button" className="gf-editor-rail__btn" aria-label="Add section" onClick={onAddText}>
                <BetweenVerticalEnd size={20} />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onAddMedia("IMAGE", file);
                }}
              />
              <input
                type="file"
                ref={videoInputRef}
                style={{ display: 'none' }}
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onAddMedia("VIDEO", file);
                }}
              />
            </aside>
          </div>
        )}

        {tab === "responses" && (
          <div className="gf-editor-canvas-row">
            <ResponsesView
              questions={questions}
              responses={responses}
              summary={summary}
              respPage={respPage}
              respPages={responses.length || 1}
              setRespPage={setRespPage}
              formTitle={form.title}
            />
          </div>
        )}

        {tab === "settings" && (
          <div className="gf-editor-canvas-row">
            <div className="gf-editor-layout">
              <form onSubmit={saveSettings} className="gf-card gf-card--pad stack">
                <h2 style={{ marginTop: 0, fontSize: "1.125rem", fontWeight: 500 }}>Form settings</h2>
                <Field label="Who can respond">
                  <Select value={draftAccess} onChange={(e) => setDraftAccess(e.target.value as FormAccessLevel)}>
                    <option value="PUBLIC">Anyone with the link</option>
                    <option value="AUTHENTICATED">Signed-in users only</option>
                    <option value="ORGANIZATION_ONLY">Organization only</option>
                  </Select>
                </Field>
                <fieldset className="stack">
                  <legend>Response options</legend>
                  <CheckboxField
                    label="Allow multiple responses"
                    checked={!!draftSettings.allowMultipleResponses}
                    onChange={(checked) => setDraftSettings((s) => ({ ...s, allowMultipleResponses: checked }))}
                  />
                  <CheckboxField
                    label="Collect email addresses"
                    checked={!!draftSettings.collectEmail}
                    onChange={(checked) => setDraftSettings((s) => ({ ...s, collectEmail: checked }))}
                  />
                  <CheckboxField
                    label="Allow file uploads"
                    checked={!!draftSettings.allowFileUpload}
                    onChange={(checked) => setDraftSettings((s) => ({ ...s, allowFileUpload: checked }))}
                  />
                  <CheckboxField
                    label="Allow collaboration"
                    checked={!!draftSettings.allowCollaboration}
                    onChange={(checked) => setDraftSettings((s) => ({ ...s, allowCollaboration: checked }))}
                  />
                </fieldset>

                <div className="row">
                  <button type="submit" className="btn primary" disabled={savingMeta}>
                    {savingMeta ? "Saving…" : "Save"}
                  </button>
                  <button type="button" className="btn danger" onClick={onDeleteForm}>
                    Delete form
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {showPreview && (
        <FormPreview
          form={form}
          questions={questions}
          onClose={() => setShowPreview(false)}
        />
      )}

      <ThemeCustomizer 
        isOpen={isThemeOpen} 
        onClose={() => setIsThemeOpen(false)} 
        theme={form.settingJson?.theme || {}} 
        onChange={onThemeChange}
      />
    </div>
  );
}
