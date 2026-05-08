"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createForm } from "@/lib/api/forms";
import { createQuestion } from "@/lib/api/questions";
import { ApiError } from "@/lib/api/client";
import { FormWorkspaceHeader } from "@/components/forms/FormWorkspaceHeader";
import { TEMPLATES } from "@/lib/templates";
import { generateThemeVariables } from "@/lib/utils/color";

const FORM_ID = "gf-create-form";

export function FormCreate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateKey = searchParams.get("template");
  const template = templateKey ? TEMPLATES[templateKey] : null;

  const [title, setTitle] = useState(template?.title || "Untitled form");
  const [description, setDescription] = useState(template?.description || "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const autoStarted = useRef(false);

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setDescription(template.description);
    }
  }, [templateKey]);

  async function doSubmit(currentTitle: string, currentDesc: string) {
    setError(null);
    setLoading(true);
    setStatus("Creating form...");
    try {
      const form = await createForm({
        title: currentTitle.trim() || "Untitled form",
        description: currentDesc,
        settingJson: template?.theme ? { theme: template.theme } : undefined,
      });

      if (template && template.questions.length > 0) {
        setStatus(`Adding ${template.questions.length} questions...`);
        // Create questions sequentially to maintain order
        for (let i = 0; i < template.questions.length; i++) {
          const q = template.questions[i];
          await createQuestion({
            formId: form._id,
            ...q,
            order: i,
          });
        }
      }

      setStatus("Redirecting...");
      router.replace(`/forms/${form._id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create form");
      setStatus(null);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (templateKey && template && !autoStarted.current) {
      autoStarted.current = true;
      doSubmit(template.title, template.description);
    }
  }, [templateKey, template]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSubmit(title, description);
  }

  return (
    <div className="gf-form-editor" style={template?.theme ? generateThemeVariables(template.theme) : undefined}>
      <FormWorkspaceHeader
        docTitle={title}
        onDocTitleChange={setTitle}
        primaryAction={
          <button type="submit" form={FORM_ID} className="gf-publish-btn" disabled={loading}>
            {loading ? status || "Creating…" : "Create"}
          </button>
        }
        menuExtra={
          <>
            <Link href="/" className="gf-form-editor__menu-row">
              My forms
            </Link>
          </>
        }
      />

      <div className="gf-form-editor__body">
        <div className="gf-editor-canvas-row">
          <div className="gf-editor-layout">
            {template?.theme?.headerImage && (
              <div 
                className="gf-editor-header-image" 
                style={{ 
                  backgroundImage: `url(${template.theme.headerImage})`,
                  height: '200px',
                  width: '100%',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '8px 8px 0 0',
                  marginBottom: '-8px'
                }} 
              />
            )}
            <section className="gf-editor-title-sheet" aria-label="Form details" style={{ 
              borderTop: template?.theme?.headerImage ? 'none' : `10px solid ${template?.theme?.themeColor || 'var(--gf-purple)'}`,
              borderTopLeftRadius: template?.theme?.headerImage ? '0' : '8px',
              borderTopRightRadius: template?.theme?.headerImage ? '0' : '8px'
            }}>
              <form id={FORM_ID} onSubmit={onSubmit} className="stack gap-lg" style={{ gap: "1rem" }}>
                {error && <div className="banner error">{error}</div>}
                <input
                  className="gf-editor-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled form"
                  aria-label="Form title"
                  disabled={loading}
                />
                <textarea
                  className="gf-editor-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Form description"
                  rows={2}
                  aria-label="Form description"
                  disabled={loading}
                />
                {!loading && (
                  <p className="muted small" style={{ margin: 0 }}>
                    After you create this form, you can add questions on the next screen — similar to Google Forms.
                  </p>
                )}
                {loading && (
                  <div className="banner info" style={{ marginTop: '1rem' }}>
                    {status || "Creating your form template..."}
                  </div>
                )}
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
