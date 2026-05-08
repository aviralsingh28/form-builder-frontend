"use client";

import { X, ArrowLeft, EyeOff, Link2, Edit3 } from "lucide-react";
import type { Form, Question } from "@/lib/api/types";
import { idOf } from "@/lib/utils/id";
import { CheckboxField, RadioField, Input, Select, Textarea, DateField } from "@/components/ui";
import { generateThemeVariables } from "@/lib/utils/color";

type FormPreviewProps = {
  form: Form;
  questions: Question[];
  onClose: () => void;
};

export function FormPreview({ form, questions, onClose }: FormPreviewProps) {
  const ordered = [...questions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="gf-preview-overlay" style={generateThemeVariables(form.settingJson?.theme)}>
      <header className="gf-preview-header">
        <div className="gf-preview-header__left">
          <button type="button" className="gf-preview-header__btn" onClick={onClose} aria-label="Close preview">
            <ArrowLeft size={20} />
          </button>
          <span className="gf-preview-header__title">Preview mode</span>
        </div>
        <div className="gf-preview-header__right">
          <div className="gf-preview-status">
            <EyeOff size={16} />
            <span>Not published</span>
          </div>
          {/* <button type="button" className="gf-preview-action-btn">
            <Link2 size={18} />
            <span>Copy responder link</span>
          </button> */}
        </div>
      </header>

      <div className="gf-preview-banner">
        <div className="gf-preview-banner__content">
          <EyeOff size={18} className="gf-preview-banner__icon" />
          <span>This form isn't accepting responses.</span>
          {/* <button type="button" className="gf-preview-banner__link">Manage publish settings</button> */}
        </div>
      </div>

      <main className="gf-preview-content">
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
            <div className="stack gap-lg">
              {ordered.map((q) => {
                const qid = idOf(q);
                const t = q.type;
                return (
                  <section key={qid} className="stack gap-sm gf-preview-question">
                    <label className="block-label">
                      <span className="question-label">
                        {q.title}
                        {q.required && <span className="req">*</span>}
                      </span>
                      {q.description && <p className="muted small">{q.description}</p>}
                    </label>

                    {(t === "SHORT_TYPE" || t === "LONG_TYPE") &&
                      (t === "SHORT_TYPE" ? (
                        <Input placeholder="Your answer" disabled />
                      ) : (
                        <Textarea rows={4} placeholder="Your answer" disabled />
                      ))}

                    {(t === "SINGLE_CHOICE" || t === "DROPDOWN") && q.options && (
                      <>
                        {t === "DROPDOWN" ? (
                          <Select disabled>
                            <option value="">Choose</option>
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
                                checked={false}
                                onSelect={() => {}}
                                label={o}
                                disabled
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {(t === "MULTIPLE_CHOICE" || t === "CHECKBOXES") && q.options && (
                      <div className="stack gap-sm">
                        {q.options.map((o, idx) => (
                          <CheckboxField
                            key={o}
                            id={`${qid}-cb-${idx}`}
                            label={o}
                            checked={false}
                            onChange={() => {}}
                            disabled
                          />
                        ))}
                      </div>
                    )}

                    {t === "DATE" && <DateField disabled />}

                    {t === "RATING" && (
                      <Select disabled>
                        <option value="">Choose</option>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </Select>
                    )}

                    {t === "IMAGE" && q.media?.[0] && (
                      <div className="gf-public-media" style={{ marginTop: '0.5rem' }}>
                        <img src={q.media[0].url} alt={q.title} style={{ maxWidth: '100%', borderRadius: '4px' }} />
                      </div>
                    )}
                    {t === "VIDEO" && q.media?.[0] && (
                      <div className="gf-public-media" style={{ marginTop: '0.5rem' }}>
                        <video src={q.media[0].url} controls style={{ maxWidth: '100%', borderRadius: '4px' }} />
                      </div>
                    )}
                  </section>
                );
              })}

              <button type="button" className="btn primary" disabled style={{ alignSelf: 'flex-start', minWidth: '100px' }}>
                Submit
              </button>
            </div>
          </div>
        </div>
      </main>

      <button className="gf-preview-edit-fab" onClick={onClose} title="Back to editor">
        <Edit3 size={24} />
      </button>
    </div>
  );
}
