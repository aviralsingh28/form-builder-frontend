import { useState } from "react";
import { Download, ChevronLeft, ChevronRight, FileText, ExternalLink } from "lucide-react";
import type { FormResponse, QuestionSummary } from "@/lib/api/responses";
import type { Question } from "@/lib/api/types";
import { Select } from "@/components/ui";
import { idOf } from "@/lib/utils/id";

interface ResponsesViewProps {
  questions: Question[];
  responses: FormResponse[];
  summary: {
    totalResponses: number;
    questionSummaries: QuestionSummary[];
  } | null;
  respPage: number;
  respPages: number;
  setRespPage: (page: number) => void;
  formTitle: string;
}

export function ResponsesView({
  questions,
  responses,
  summary,
  respPage,
  respPages,
  setRespPage,
  formTitle,
}: ResponsesViewProps) {
  const [subTab, setSubTab] = useState<"summary" | "question" | "individual">("summary");
  const [qIndex, setQIndex] = useState(0);

  const exportToCSV = () => {
    if (!responses.length) return;
    
    const headers = ["Timestamp", ...questions.map((q) => q.title)];
    
    const rows = responses.map((r) => {
      const row = [r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ""];
      questions.forEach((q) => {
        const ans = r.answer?.find((a) => a.questionId === idOf(q));
        if (!ans) {
          row.push("");
        } else if (Array.isArray(ans.value)) {
          row.push(ans.value.join(", "));
        } else {
          row.push(String(ans.value || ""));
        }
      });
      return row;
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(","), ...rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${formTitle || "Form"}_Responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentQ = questions[qIndex];
  
  // For individual view
  const currentResp = responses[respPage - 1] || null;

  // Helper to render an answer value — handles file URLs, images, plain text
  function renderAnswerValue(
    ans: { value: unknown; attachments?: { url: string; originalName: string; mimeType?: string; size?: number }[] } | undefined,
    q: Question
  ) {
    if (!ans) return <span className="muted small">No answer</span>;

    // If there are real attachments (uploaded files), render them nicely
    if (ans.attachments && ans.attachments.length > 0) {
      return (
        <div className="stack gap-sm">
          {ans.attachments.map((f, i) => {
            const isImage = f.mimeType?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(f.url);
            const isPdf = f.mimeType === 'application/pdf' || f.url.toLowerCase().endsWith('.pdf');
            return (
              <div key={i} style={{ border: '1px solid var(--gf-border)', borderRadius: '8px', overflow: 'hidden' }}>
                {isImage ? (
                  <a href={f.url} target="_blank" rel="noreferrer">
                    <img
                      src={f.url}
                      alt={f.originalName}
                      style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', display: 'block' }}
                    />
                  </a>
                ) : isPdf ? (
                  <div style={{ padding: '0.75rem' }}>
                    <a href={f.url} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gf-brand)' }}
                    >
                      <FileText size={18} />
                      <span style={{ fontWeight: 500 }}>{f.originalName}</span>
                      <ExternalLink size={14} />
                    </a>
                    {f.size && <span className="muted small" style={{ marginLeft: '0.5rem' }}>{(f.size / 1024).toFixed(0)} KB</span>}
                  </div>
                ) : (
                  <div style={{ padding: '0.75rem' }}>
                    <a href={f.url} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gf-brand)' }}
                    >
                      <FileText size={18} />
                      <span style={{ fontWeight: 500 }}>{f.originalName}</span>
                      <ExternalLink size={14} />
                    </a>
                    {f.size && <span className="muted small" style={{ marginLeft: '0.5rem' }}>{(f.size / 1024).toFixed(0)} KB</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // Fallback: check if the value itself looks like a URL (old submissions or direct URL values)
    const val = ans.value;
    if (typeof val === 'string' && val.startsWith('http')) {
      const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(val);
      const isPdf = val.toLowerCase().endsWith('.pdf');
      if (isImage) {
        return (
          <a href={val} target="_blank" rel="noreferrer">
            <img src={val} alt="uploaded" style={{ maxWidth: '100%', maxHeight: '250px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--gf-border)' }} />
          </a>
        );
      }
      if (isPdf) {
        return (
          <a href={val} target="_blank" rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gf-brand)' }}
          >
            <FileText size={18} /> View PDF <ExternalLink size={14} />
          </a>
        );
      }
      return (
        <a href={val} target="_blank" rel="noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gf-brand)' }}
        >
          <FileText size={18} /> Open file <ExternalLink size={14} />
        </a>
      );
    }

    if (!val && val !== 0) return <span className="muted small">No answer</span>;
    if (Array.isArray(val)) return <span>{val.join(', ')}</span>;
    return <span>{String(val)}</span>;
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

  return (
    <div className="gf-editor-layout stack gap-md" style={{ gap: "1rem" }}>
      {/* Top Header Card */}
      <div className="gf-card gf-card--pad">
        <div className="row justify-between items-center" style={{ marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 400 }}>
            {summary?.totalResponses || 0} responses
          </h2>
          <button
            className="btn small"
            style={{
              backgroundColor: "#e8f0fe",
              color: "#188038",
              border: "1px solid #188038",
              fontWeight: 500,
            }}
            onClick={exportToCSV}
          >
            <Download size={16} style={{ marginRight: "0.5rem" }} />
            Link to Sheets
          </button>
        </div>
        
        <div className="gf-tabs gf-tabs--forms" style={{ borderBottom: "none", marginBottom: "-1rem" }}>
          <button
            className={subTab === "summary" ? "is-active" : ""}
            onClick={() => setSubTab("summary")}
          >
            Summary
          </button>
          <button
            className={subTab === "question" ? "is-active" : ""}
            onClick={() => setSubTab("question")}
          >
            Question
          </button>
          <button
            className={subTab === "individual" ? "is-active" : ""}
            onClick={() => setSubTab("individual")}
          >
            Individual
          </button>
        </div>
      </div>

      {subTab === "summary" && (
        <div className="stack gap-md">
          {!summary ? (
            <p className="muted">Loading summary…</p>
          ) : (
            <>
              {summary.questionSummaries
                .filter(qs => {
                  // Find the question to check its type
                  const question = questions.find(q => idOf(q) === qs.questionId);
                  // Exclude IMAGE and VIDEO from summary (display-only questions)
                  return !(question?.type === "IMAGE" || question?.type === "VIDEO");
                })
                .map((qs) => (
                <div key={qs.questionId} className="gf-card gf-card--pad">
                  <h3 style={{ marginTop: 0 }}>{qs.title}</h3>
                  <p className="muted small">
                    {qs.answeredCount} responses
                  </p>
                  
                  {qs.choiceCounts && (() => {
                    const entries = Object.entries(qs.choiceCounts);
                    const max = Math.max(1, ...entries.map(([, v]) => v));
                    return (
                      <div className="gf-summary-chart">
                        {entries.map(([k, v]) => renderSummaryRow(k, v, max, `${qs.questionId}-${k}`))}
                      </div>
                    );
                  })()}
                  
                  {qs.averageRating != null && (
                    <p className="small">
                      Average: <strong>{qs.averageRating.toFixed(2)}</strong>
                    </p>
                  )}
                  
                  {qs.sampleAnswers && qs.sampleAnswers.length > 0 && (
                    <div className="stack gap-sm" style={{ marginTop: "1rem" }}>
                      {qs.sampleAnswers.map((t, idx) => (
                        <div key={idx} style={{ padding: "0.75rem", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
                          {t}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {qs.dateCounts && (
                    <div className="gf-summary-chart" style={{ marginTop: "0.5rem" }}>
                      {Object.entries(qs.dateCounts).map(([k, v]) => {
                        const max = Math.max(1, ...Object.values(qs.dateCounts!));
                        return renderSummaryRow(k, v, max, `${qs.questionId}-d-${k}`);
                      })}
                    </div>
                  )}

                  {qs.fileAttachments && qs.fileAttachments.length > 0 && (
                    <div className="stack gap-sm" style={{ marginTop: "0.75rem" }}>
                      {qs.fileAttachments.map((f, idx) => {
                        const isImage = f.mimeType?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(f.url);
                        const isPdf = f.mimeType === 'application/pdf' || f.url.toLowerCase().endsWith('.pdf');
                        const isDoc = /\.(doc|docx|odt)$/i.test(f.url) || f.mimeType?.includes('word') || f.mimeType?.includes('document');
                        const isSpreadsheet = /\.(xls|xlsx|ods)$/i.test(f.url) || f.mimeType?.includes('sheet') || f.mimeType?.includes('excel');

                        const fileIcon = isImage ? '🖼️' : isPdf ? '📄' : isDoc ? '📝' : isSpreadsheet ? '📊' : '📎';

                        return (
                          <a
                            key={idx}
                            href={f.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem 1rem',
                              background: '#f8f9fa',
                              border: '1px solid var(--gf-border)',
                              borderRadius: '8px',
                              textDecoration: 'none',
                              color: 'inherit',
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#e8f0fe')}
                            onMouseLeave={e => (e.currentTarget.style.background = '#f8f9fa')}
                          >
                            {isImage ? (
                              <img
                                src={f.url}
                                alt={f.originalName}
                                style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                              />
                            ) : (
                              <span style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>{fileIcon}</span>
                            )}
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ fontWeight: 500, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {f.originalName}
                              </div>
                              {f.size && (
                                <div className="muted small">
                                  {f.size >= 1024 * 1024
                                    ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
                                    : `${(f.size / 1024).toFixed(0)} KB`}
                                </div>
                              )}
                            </div>
                            <ExternalLink size={16} style={{ color: 'var(--gf-brand)', flexShrink: 0 }} />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {subTab === "question" && currentQ && (
        <div className="stack gap-md">
          <div className="gf-card gf-card--pad row items-center gap-md">
            <Select
              className="minimal"
              style={{ flex: 1, fontWeight: 500 }}
              value={qIndex}
              onChange={(e) => setQIndex(Number(e.target.value))}
            >
              {questions
                .filter(q => q.type !== "IMAGE" && q.type !== "VIDEO")
                .map((q, i) => (
                <option key={idOf(q)} value={i}>
                  {q.title}
                </option>
              ))}
            </Select>
            <div className="row items-center gap-sm">
              <button
                className="btn ghost icon-only"
                disabled={qIndex <= 0}
                onClick={() => setQIndex(i => i - 1)}
              >
                <ChevronLeft size={20} />
              </button>
              <span className="small muted">
                {qIndex + 1} of {questions.length}
              </span>
              <button
                className="btn ghost icon-only"
                disabled={qIndex >= questions.length - 1}
                onClick={() => setQIndex(i => i + 1)}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          <div className="gf-card gf-card--pad stack gap-md">
            <h3 style={{ margin: 0 }}>{currentQ.title}</h3>
            
            <div className="stack gap-sm">
              {responses.map((r) => {
                const ans = r.answer?.find((a) => a.questionId === idOf(currentQ));
                if (!ans || (!ans.value && !(ans.attachments?.length))) return null;
                
                return (
                  <div key={idOf(r)} style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    {renderAnswerValue(ans, currentQ)}
                  </div>
                );
              })}
              {responses.filter(r => {
                const ans = r.answer?.find((a) => a.questionId === idOf(currentQ));
                return ans?.value || ans?.attachments?.length;
              }).length === 0 && (
                <p className="muted small">No responses yet for this question.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === "individual" && (
        <div className="stack gap-md">
          <div className="gf-card gf-card--pad row justify-between items-center">
            <h3 style={{ margin: 0 }}>Response</h3>
            <div className="row items-center gap-md">
               <button type="button" className="btn ghost" disabled={respPage <= 1} onClick={() => setRespPage(respPage - 1)}>
                  <ChevronLeft size={20} />
                </button>
                <span className="muted small">
                  {respPage} of {respPages}
                </span>
                <button
                  type="button"
                  className="btn ghost"
                  disabled={respPage >= respPages}
                  onClick={() => setRespPage(respPage + 1)}
                >
                  <ChevronRight size={20} />
                </button>
            </div>
          </div>

          {currentResp ? (
            <div className="stack gap-md">
              {questions
                .filter(q => q.type !== "IMAGE" && q.type !== "VIDEO")
                .map((q) => {
                const ans = currentResp.answer?.find((a) => a.questionId === idOf(q));
                return (
                  <div key={idOf(q)} className="gf-card gf-card--pad stack gap-sm">
                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 500 }}>{q.title}</h3>
                    <div style={{ minHeight: "1.5rem" }}>
                      {renderAnswerValue(ans, q)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
             <p className="muted">No individual responses yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
