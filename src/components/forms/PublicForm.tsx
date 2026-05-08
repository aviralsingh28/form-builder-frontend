"use client";

import { Upload, FileText, X } from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getPublicForm } from "@/lib/api/forms";
import { listPublicQuestionsForForm } from "@/lib/api/questions";
import { submitResponse } from "@/lib/api/responses";
import { uploadFile } from "@/lib/api/upload";
import type { Form, Question, QuestionType } from "@/lib/api/types";
import { ApiError, getAccessToken } from "@/lib/api/client";
import { idOf } from "@/lib/utils/id";
import { CheckboxField, Input, RadioField, Select, Textarea, DateField, TimeField } from "@/components/ui";
import { generateThemeVariables } from "@/lib/utils/color";

type AnswerState = Record<string, string | string[] | number | null>;

function choiceTypes(t: QuestionType) {
  return t === "SINGLE_CHOICE" || t === "DROPDOWN";
}

function multiTypes(t: QuestionType) {
  return t === "MULTIPLE_CHOICE" || t === "CHECKBOXES";
}

export function PublicForm() {
  const params = useParams();
  const formId = String(params.formId ?? "");

  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authed, setAuthed] = useState(false);
  // Track uploaded file attachments per question: { [questionId]: { url, key, originalName, mimeType, size }[] }
  const [fileAttachments, setFileAttachments] = useState<Record<string, { url: string; key: string; originalName: string; mimeType: string; size: number }[]>>({});
  const [uploadingFile, setUploadingFile] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setAuthed(!!getAccessToken());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [f, q] = await Promise.all([
          getPublicForm(formId),
          listPublicQuestionsForForm(formId),
        ]);
        if (cancelled) return;
        setForm(f);
        setQuestions(q.data);
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Could not load form");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formId]);

  const ordered = useMemo(
    () => [...questions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [questions],
  );

  function setAnswer(qid: string, value: string | string[] | number | null) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  }

  function toggleMulti(qid: string, option: string, checked: boolean) {
    setAnswers((prev) => {
      const cur = (prev[qid] as string[] | undefined) ?? [];
      const next = checked ? [...cur, option] : cur.filter((x) => x !== option);
      return { ...prev, [qid]: next };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Filter out IMAGE and VIDEO types from required validation (they're display-only)
    const missing = ordered.filter((q) => {
      if (q.type === "IMAGE" || q.type === "VIDEO") return false; // Skip validation for display-only questions
      if (!q.required) return false;
      const v = answers[idOf(q)];
      if (v == null || v === "") return true;
      if (Array.isArray(v) && v.length === 0) return true;
      return false;
    });
    if (missing.length) {
      setError("Please answer all required questions.");
      return;
    }

    // Build answer list - exclude IMAGE and VIDEO types
    const answer = ordered
      .filter(q => q.type !== "IMAGE" && q.type !== "VIDEO") // Don't include IMAGE/VIDEO in responses
      .map((q) => {
        const qid = idOf(q);
        let value: string | string[] | number | null = answers[qid] ?? null;
        if (q.type === "RATING" && typeof value === "string" && value !== "") {
          value = Number(value);
        }
        const attachments = fileAttachments[qid];
        return { questionId: qid, value, ...(attachments?.length ? { attachments } : {}) };
      });

    setSubmitting(true);
    try {
      await submitResponse({
        formId,
        answer,
        metaData: { userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "" },
      });
      setDone("Thanks — your response was submitted.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="gf-public-page">
        <p className="muted" style={{ textAlign: "center" }}>
          Loading…
        </p>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="gf-public-page">
        <div className="gf-public-card">
          <div className="gf-public-card__body">
            <div className="banner error">{error}</div>
            <p className="muted small">
              The link must point to a <strong>published</strong> form with <strong>PUBLIC</strong> access.
            </p>
            <Link href="/login">Sign in to build forms</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!form) return null;

  if (done) {
    return (
      <div className="gf-public-page" style={generateThemeVariables(form.settingJson?.theme)}>
        <div className="gf-public-card">
          <div className="gf-public-card__header">
            <h1>{form.title}</h1>
          </div>
          <div className="gf-public-card__body">
            <div className="banner ok">{done}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gf-public-page" style={generateThemeVariables(form.settingJson?.theme)}>
      <div className="gf-public-card">
        {form.settingJson?.theme?.headerImage && (
          <div 
            className="gf-public-header-image" 
            style={{ 
              backgroundImage: `url(${form.settingJson.theme.headerImage})`,
              height: '200px',
              width: '100%',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '8px 8px 0 0'
            }} 
          />
        )}
        <header className="gf-public-card__header" style={{
          borderTop: form.settingJson?.theme?.headerImage ? 'none' : `10px solid ${form.settingJson?.theme?.themeColor || 'var(--gf-purple)'}`,
          borderTopLeftRadius: form.settingJson?.theme?.headerImage ? '0' : '8px',
          borderTopRightRadius: form.settingJson?.theme?.headerImage ? '0' : '8px'
        }}>
          <h1>{form.title}</h1>
          {form.description && <p className="muted small" style={{ margin: "0.35rem 0 0" }}>{form.description}</p>}
        </header>

        <div className="gf-public-card__body">
          {error && <div className="banner error">{error}</div>}

          <form onSubmit={onSubmit} className="stack gap-lg">
            {ordered.map((q) => {
              const qid = idOf(q);
              const t = q.type;
              
              // Skip rendering input for IMAGE and VIDEO types - they're display-only
              if (t === "IMAGE" || t === "VIDEO") {
                return (
                  <section key={qid} className="stack gap-sm" style={{ paddingBottom: "1.25rem", borderBottom: "1px solid var(--gf-border)" }}>
                    {q.type === "IMAGE" && q.media?.[0] && (
                      <div className="gf-public-media" style={{ marginTop: "0rem" }}>
                        <img src={q.media[0].url} alt={q.title} style={{ maxWidth: "100%", borderRadius: "4px" }} />
                      </div>
                    )}
                    {q.type === "VIDEO" && q.media?.[0] && (
                      <div className="gf-public-media" style={{ marginTop: "0rem" }}>
                        <video src={q.media[0].url} controls style={{ maxWidth: "100%", borderRadius: "4px" }} />
                      </div>
                    )}
                  </section>
                );
              }
              
              return (
                <section key={qid} className="stack gap-sm" style={{ paddingBottom: "1.25rem", borderBottom: "1px solid var(--gf-border)" }}>
              <label className="block-label">
                <span className="question-label">
                  {q.title}
                  {q.required && <span className="req">*</span>}
                </span>
                {q.description && <p className="muted small">{q.description}</p>}
              </label>

              {(t === "SHORT_TYPE" || t === "LONG_TYPE") &&
                (t === "SHORT_TYPE" ? (
                  <Input
                    value={(answers[qid] as string) ?? ""}
                    onChange={(e) => setAnswer(qid, e.target.value)}
                    maxLength={q.maxLength}
                    minLength={q.minLength}
                  />
                ) : (
                  <Textarea rows={4} value={(answers[qid] as string) ?? ""} onChange={(e) => setAnswer(qid, e.target.value)} />
                ))}

              {choiceTypes(t) && q.options && (
                <>
                  {t === "DROPDOWN" ? (
                    <Select value={(answers[qid] as string) ?? ""} onChange={(e) => setAnswer(qid, e.target.value)}>
                      <option value="">Select…</option>
                      {q.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <div className="stack gap-sm">
                      {q.options.map((o, idx) => (
                        <RadioField
                          key={o}
                          id={`${qid}-opt-${idx}`}
                          name={qid}
                          value={o}
                          checked={(answers[qid] as string) === o}
                          onSelect={() => setAnswer(qid, o)}
                          label={o}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {multiTypes(t) && q.options && (
                <div className="stack gap-sm">
                  {q.options.map((o, idx) => {
                    const selected = ((answers[qid] as string[]) ?? []).includes(o);
                    return (
                      <CheckboxField
                        key={o}
                        id={`${qid}-cb-${idx}`}
                        label={o}
                        checked={selected}
                        onChange={(checked) => toggleMulti(qid, o, checked)}
                      />
                    );
                  })}
                </div>
              )}

              {t === "DATE" && (
                <DateField value={(answers[qid] as string) ?? ""} onChange={(e) => setAnswer(qid, e.target.value)} />
              )}
              {t === "TIME" && (
                <TimeField value={(answers[qid] as string) ?? ""} onChange={(e) => setAnswer(qid, e.target.value)} />
              )}

              {t === "RATING" && (
                <Select
                  value={
                    answers[qid] === null || answers[qid] === undefined ? "" : String(answers[qid])
                  }
                  onChange={(e) => setAnswer(qid, e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Select…</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              )}

              {t === "FILE_UPLOAD" && (
                <div className="stack gap-sm">
                  <p className="muted small" style={{ margin: 0 }}>
                    {q.maxFiles && q.maxFiles > 1 ? `Upload up to ${q.maxFiles} files.` : `Upload 1 supported file.`} 
                    {q.maxFileSize ? ` Max ${q.maxFileSize >= 1000 ? (q.maxFileSize/1000) + ' GB' : q.maxFileSize + ' MB'}.` : ''}
                  </p>
                  <div className="row items-center gap-md">
                    <label
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        border: '1px solid var(--gf-border)', padding: '0.5rem 1rem',
                        borderRadius: '4px', cursor: uploadingFile[qid] ? 'wait' : 'pointer',
                        color: 'var(--gf-brand)', background: 'transparent', fontWeight: 500
                      }}
                    >
                      <Upload size={18} />
                      {uploadingFile[qid] ? 'Uploading…' : 'Add File'}
                      <input
                        type="file"
                        style={{ display: 'none' }}
                        multiple={(q.maxFiles || 1) > 1}
                        accept={q.allowSpecificFileTypes && q.allowedFileTypes?.length
                          ? q.allowedFileTypes.map((ft: string) => ({
                              'DOCUMENT': '.doc,.docx,.odt',
                              'SPREADSHEET': '.xls,.xlsx,.ods',
                              'PDF': '.pdf',
                              'VIDEO': 'video/*',
                              'PRESENTATION': '.ppt,.pptx',
                              'DRAWING': '.svg,.ai,.drawio',
                              'IMAGE': 'image/*',
                              'AUDIO': 'audio/*'
                            }[ft] || '')).filter(Boolean).join(',')
                          : undefined
                        }
                        disabled={uploadingFile[qid] || submitting}
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (!files.length) return;
                          setUploadingFile(prev => ({ ...prev, [qid]: true }));
                          setError(null);
                          try {
                            const uploaded = await Promise.all(
                              files.map(async (file) => {
                                const result = await uploadFile(file, 'responses');
                                return { url: result.url, key: result.key, originalName: file.name, mimeType: file.type, size: file.size };
                              })
                            );
                            setFileAttachments(prev => ({ ...prev, [qid]: [...(prev[qid] || []), ...uploaded] }));
                            setAnswer(qid, uploaded.map(u => u.url).join(','));
                          } catch {
                            setError('File upload failed. Please try again.');
                          } finally {
                            setUploadingFile(prev => ({ ...prev, [qid]: false }));
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  </div>
                  {/* Show uploaded files */}
                  {(fileAttachments[qid] || []).length > 0 && (
                    <div className="stack gap-sm" style={{ marginTop: '0.5rem' }}>
                      {(fileAttachments[qid] || []).map((f, idx) => (
                        <div key={idx} className="row items-center gap-sm" style={{
                          padding: '0.5rem 0.75rem', background: '#f8f9fa',
                          borderRadius: '6px', border: '1px solid var(--gf-border)'
                        }}>
                          <FileText size={16} className="muted" />
                          <span className="small" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {f.originalName}
                          </span>
                          <span className="muted small">{(f.size / 1024).toFixed(0)} KB</span>
                          <button
                            type="button" className="btn ghost icon-only small"
                            onClick={() => {
                              const next = (fileAttachments[qid] || []).filter((_, i) => i !== idx);
                              setFileAttachments(prev => ({ ...prev, [qid]: next }));
                              if (!next.length) setAnswer(qid, null);
                              else setAnswer(qid, next.map(u => u.url).join(','));
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {t === "TEXT" && (
                <div className="gf-public-text-block">
                   {/* Title is already rendered by the label section above if we want, 
                       but for TEXT type, maybe we want it more prominent */}
                </div>
              )}
            </section>
              );
            })}

            <button type="submit" className="btn primary full" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </form>

          <footer className="public-footer muted small">
            {!authed ? (
              <span>
                Form owner? <Link href="/login">Sign in</Link>
              </span>
            ) : (
              <Link href="/">My forms</Link>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}
