"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownAZ,
  ChevronsUpDown,
  FileText,
  Folder,
  LayoutGrid,
  List,
  MoreVertical,
  Star,
} from "lucide-react";
import { duplicateForm, listForms, deleteForm, toggleStarForm } from "@/lib/api/forms";
import type { Form } from "@/lib/api/types";
import { idOf } from "@/lib/utils/id";
import { ApiError } from "@/lib/api/client";
import { useHomeSearch } from "@/context/HomeSearchContext";

function formatOpened(iso?: string) {
  if (!iso) return "Recently opened";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Recently opened";
  const t = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  return `Opened ${t}`;
}

function OpenedLabel({ iso, className }: { iso?: string; className?: string }) {
  const [label, setLabel] = useState("Opened —");
  useEffect(() => {
    setLabel(formatOpened(iso));
  }, [iso]);
  return <p className={className}>{label}</p>;
}

function TemplateThumb({ variant }: { variant: "quiz" | "rsvp" | "shirt" | "contact" }) {
  const config = {
    quiz: {
      color: "#673ab7",
      bg: "#f3e5f5",
      header: null,
      questions: ["Untitled Question"],
    },
    rsvp: {
      color: "#e67e22",
      bg: "#fff7ed",
      header: "/templates/rsvp.png",
      questions: ["Can you attend?", "Names of people attending"],
    },
    shirt: {
      color: "#673ab7",
      bg: "#f3e5f5",
      header: "/templates/shirt.png",
      questions: ["Name", "Shirt size"],
    },
    contact: {
      color: "#0f9d58",
      bg: "#e8f5e9",
      header: "/templates/contact.png",
      questions: ["Name", "Email", "Address", "Phone number", "Comments"],
    },
  }[variant];

  return (
    <div className="gf-tpl-preview-v2" style={{ backgroundColor: config.bg, overflow: "hidden", display: "flex", justifyContent: "center", paddingTop: "8px" }}>
      <div style={{ width: "90%", maxWidth: "150px", transform: "scale(0.85)", transformOrigin: "top center", display: "flex", flexDirection: "column", gap: "4px" }}>
        {config.header ? (
          <img src={config.header} alt="" style={{ width: "100%", height: "35px", objectFit: "cover", borderRadius: "4px 4px 0 0" }} />
        ) : (
          <div style={{ width: "100%", height: "12px", borderRadius: "4px 4px 0 0", backgroundColor: config.color }} />
        )}
        <div style={{ backgroundColor: "#fff", borderRadius: config.header ? "0 0 4px 4px" : "4px", padding: "8px", borderTop: config.header ? "none" : `4px solid ${config.color}`, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <div style={{ width: "60%", height: "8px", background: "#202124", borderRadius: "2px", marginBottom: "4px" }} />
          <div style={{ width: "30%", height: "4px", background: "#5f6368", borderRadius: "2px" }} />
        </div>
        {config.questions.map((q, i) => (
          <div key={i} style={{ backgroundColor: "#fff", borderRadius: "4px", padding: "6px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "6px", fontWeight: "500", color: "#202124", marginBottom: "4px" }}>{q}</div>
            <div style={{ height: "4px", width: "40%", backgroundColor: "#f1f3f4", borderRadius: "1px" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

const START_TEMPLATES = [
  { key: "blank", title: "Blank", href: "/forms/new", variant: "blank" as const },
  { key: "contact", title: "Contact Information", href: "/forms/new?template=contact", variant: "contact" as const },
  { key: "rsvp", title: "RSVP", href: "/forms/new?template=rsvp", variant: "rsvp" as const },
  { key: "shirt", title: "T-Shirt Sign Up", href: "/forms/new?template=shirt", variant: "shirt" as const },
  { key: "quiz", title: "Blank Quiz", href: "/forms/new?template=quiz", variant: "quiz" as const },
];

export function FormsList() {
  const router = useRouter();
  const { query } = useHomeSearch();
  const [forms, setForms] = useState<Form[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dupId, setDupId] = useState<string | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [starId, setStarId] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sortAz, setSortAz] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await listForms(page, 12);
        if (!cancelled) {
          setForms(res.data);
          setPages(res.pagination.pages || 1);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Failed to load forms");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  const filteredSorted = useMemo(() => {
    let list = [...forms];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q)),
      );
    }
    if (sortAz) {
      list.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
    }
    return list;
  }, [forms, query, sortAz]);

  async function onDuplicate(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setDupId(id);
    try {
      const copy = await duplicateForm(id);
      router.push(`/forms/${idOf(copy)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Duplicate failed");
    } finally {
      setDupId(null);
    }
  }

  async function onDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this form?")) return;
    
    setError(null);
    setDelId(id);
    try {
      await deleteForm(id);
      setForms((prev) => prev.filter((f) => idOf(f) !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setDelId(null);
    }
  }

  async function onToggleStar(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setStarId(id);
    try {
      const updated = await toggleStarForm(id);
      setForms((prev) => prev.map((f) => (idOf(f) === id ? updated : f)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Toggle star failed");
    } finally {
      setStarId(null);
    }
  }

  return (
    <div className="gf-home">
      <section className="gf-home-start" aria-labelledby="gf-start-heading">
        <div className="gf-home-start__head">
          <h2 id="gf-start-heading">Start a new form</h2>
          <div className="gf-home-start__actions">
            {/* <button type="button" className="gf-template-gallery">
              Template gallery
            </button>
            <button type="button" className="gf-topbar__icon-btn" aria-label="Template order">
              <ChevronsUpDown size={20} />
            </button>
            <button type="button" className="gf-topbar__icon-btn" aria-label="More templates">
              <MoreVertical size={20} />
            </button> */}
          </div>
        </div>
        <div className="gf-home-templates">
          {START_TEMPLATES.map((t) =>
            t.variant === "blank" ? (
              <Link key={t.key} href={t.href} className="gf-tpl-card">
                <div className="gf-tpl-card__thumb gf-tpl-card__thumb--blank">
                  <span className="gf-google-plus" aria-hidden>
                    +
                  </span>
                </div>
                <span className="gf-tpl-card__label">{t.title}</span>
              </Link>
            ) : (
              <Link key={t.key} href={t.href} className="gf-tpl-card">
                <div className="gf-tpl-card__thumb">
                  <TemplateThumb variant={t.variant} />
                </div>
                <span className="gf-tpl-card__label">{t.title}</span>
              </Link>
            ),
          )}
        </div>
      </section>

      <section className="gf-home-recent" aria-labelledby="gf-recent-heading">
        <div className="gf-home-recent__toolbar">
          <h2 id="gf-recent-heading">Recent forms</h2>
          <div className="gf-home-recent__controls">
            {/* <select className="gf-select-owned" aria-label="Owner filter" defaultValue="anyone">
              <option value="anyone">Owned by anyone</option>
              <option value="me">Owned by me</option>
            </select> */}
            <button
              type="button"
              className={`gf-icon-toggle ${view === "list" ? "is-active" : ""}`}
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <List size={20} />
            </button>
            <button
              type="button"
              className={`gf-icon-toggle ${view === "grid" ? "is-active" : ""}`}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
            >
              <LayoutGrid size={20} />
            </button>
            <button
              type="button"
              className={`gf-icon-toggle ${sortAz ? "is-active" : ""}`}
              aria-label="Sort alphabetically"
              aria-pressed={sortAz}
              onClick={() => setSortAz((s) => !s)}
            >
              <ArrowDownAZ size={20} />
            </button>
            <button type="button" className="gf-icon-toggle" aria-label="Open folder">
              <Folder size={20} />
            </button>
          </div>
        </div>

        {error && <div className="banner error">{error}</div>}

        {loading ? (
          <p className="muted" style={{ margin: 0 }}>
            Loading your forms…
          </p>
        ) : forms.length === 0 ? (
          <div className="gf-home-empty">
            <p style={{ margin: "0 0 0.5rem" }}>No forms yet</p>
            <p className="muted" style={{ margin: 0 }}>
              Choose a template above or start with a blank form.
            </p>
          </div>
        ) : filteredSorted.length === 0 ? (
          <div className="gf-home-empty">No forms match your search.</div>
        ) : view === "grid" ? (
          <div className="gf-recent-grid">
            {filteredSorted.map((f) => {
              const fid = idOf(f);
              return (
                <article key={fid} className="gf-recent-card">
                  <details className="gf-recent-card__menu">
                    <summary aria-label="More actions">
                      <MoreVertical size={18} />
                    </summary>
                    <div className="gf-recent-card__menu-panel">
                      <Link href={`/forms/${fid}`}>Open</Link>
                      {f.isPublished && f.accessLevel === "PUBLIC" && (
                        <Link href={`/f/${fid}`} target="_blank" rel="noreferrer">
                          View public link
                        </Link>
                      )}
                      <button type="button" disabled={dupId === fid || delId === fid} onClick={(e) => onDuplicate(e, fid)}>
                        {dupId === fid ? "Duplicating…" : "Make a copy"}
                      </button>
                      <button type="button" disabled={dupId === fid || delId === fid} onClick={(e) => onDelete(e, fid)}>
                        {delId === fid ? "Removing…" : "Remove"}
                      </button>
                    </div>
                  </details>
                  <button
                    type="button"
                    className="gf-recent-card__star"
                    aria-label={f.isStarred ? "Unstar form" : "Star form"}
                    title={f.isStarred ? "Unstar form" : "Star form"}
                    disabled={starId === fid}
                    onClick={(e) => onToggleStar(e, fid)}
                    style={{
                      color: f.isStarred ? "var(--ez-navy)" : "#999",
                    }}
                  >
                    <Star
                      size={20}
                      strokeWidth={1.75}
                      fill={f.isStarred ? "currentColor" : "none"}
                    />
                  </button>
                  <Link href={`/forms/${fid}`} className="gf-recent-card__link">
                    <div
                      className="gf-recent-card__preview"
                      aria-hidden
                      style={{ 
                        background: f.settingJson?.theme?.backgroundColor || (f.settingJson?.theme?.themeColor ? `${f.settingJson.theme.themeColor}15` : "#f0f4f8"),
                        padding: "12px",
                        display: "flex",
                        justifyContent: "center",
                        overflow: "hidden"
                      }}
                    >
                      <div style={{ 
                        width: "100%", 
                        maxWidth: "180px", 
                        transform: "scale(0.85)", 
                        transformOrigin: "top center", 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "6px" 
                      }}>
                        {f.settingJson?.theme?.headerImage ? (
                          <img 
                            src={f.settingJson.theme.headerImage} 
                            alt="" 
                            style={{ width: "100%", height: "40px", objectFit: "cover", borderRadius: "6px 6px 0 0", marginBottom: "-6px" }} 
                          />
                        ) : (
                          <div style={{ width: "100%", height: "16px", borderRadius: "6px 6px 0 0", backgroundColor: f.settingJson?.theme?.themeColor || "var(--ez-navy)" }} />
                        )}
                        
                        <div style={{
                          backgroundColor: "#fff",
                          borderRadius: f.settingJson?.theme?.headerImage ? "0 0 6px 6px" : "6px",
                          padding: "10px",
                          borderTop: f.settingJson?.theme?.headerImage ? "none" : `6px solid ${f.settingJson?.theme?.themeColor || "var(--ez-navy)"}`,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px"
                        }}>
                          <div style={{ fontSize: "10px", fontWeight: "600", color: "#202124", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "0.2px" }}>
                            {f.title || "Untitled Form"}
                          </div>
                          {f.description && (
                            <div style={{ fontSize: "7px", color: "#5f6368", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {f.description}
                            </div>
                          )}
                        </div>
                        
                        {f.questionSnippets && f.questionSnippets.length > 0 ? (
                          f.questionSnippets.slice(0, 3).map((s, i) => (
                            <div key={i} style={{ backgroundColor: "#fff", borderRadius: "6px", padding: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "6px" }}>
                              <div style={{ fontSize: "8px", fontWeight: "500", color: "#202124", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {s}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", border: "1px solid #dadce0" }} />
                                <div style={{ height: "4px", width: "40px", backgroundColor: "#f1f3f4", borderRadius: "2px" }} />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ backgroundColor: "#fff", borderRadius: "6px", padding: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ height: "6px", width: "60%", backgroundColor: "#e8eaed", borderRadius: "3px" }} />
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <div style={{ width: "8px", height: "8px", borderRadius: "50%", border: "1px solid #dadce0" }} />
                              <div style={{ height: "4px", width: "40px", backgroundColor: "#f1f3f4", borderRadius: "2px" }} />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <div style={{ width: "8px", height: "8px", borderRadius: "50%", border: "1px solid #dadce0" }} />
                              <div style={{ height: "4px", width: "40px", backgroundColor: "#f1f3f4", borderRadius: "2px" }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="gf-recent-card__footer">
                      <FileText
                        className="gf-recent-card__icon"
                        size={18}
                        strokeWidth={2}
                        aria-hidden
                        style={{ color: f.settingJson?.theme?.themeColor || "var(--ez-navy)" }}
                      />
                      <div className="gf-recent-card__meta">
                        <h3 className="gf-recent-card__title">{f.title}</h3>
                        <OpenedLabel iso={f.updatedAt ?? f.createdAt} className="gf-recent-card__opened" />
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="gf-recent-list">
            {filteredSorted.map((f) => {
              const fid = idOf(f);
              return (
                <div key={fid} className="gf-recent-row">
                  <div
                    className="gf-recent-row__thumb"
                    aria-hidden
                    style={{ padding: 0, overflow: "hidden", background: f.settingJson?.theme?.themeColor ? `${f.settingJson.theme.themeColor}15` : "#f0f4f8" }}
                  >
                    <div style={{ height: "12px", background: f.settingJson?.theme?.themeColor || "var(--ez-navy)", width: "100%" }} />
                    <div style={{ padding: "6px 8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ background: "#fff", borderTop: `2px solid ${f.settingJson?.theme?.themeColor || "var(--ez-navy)"}`, borderRadius: "2px", padding: "4px", boxShadow: "0 1px 1px rgba(0,0,0,0.05)" }}>
                        <div style={{ height: "3px", width: "50%", background: "#dadce0", borderRadius: "1.5px", marginBottom: "3px" }} />
                        <div style={{ height: "2px", width: "30%", background: "#f1f3f4", borderRadius: "1px" }} />
                      </div>
                      <div style={{ background: "#fff", borderRadius: "2px", padding: "3px 4px", border: "1px solid #e8eaed" }}>
                        <div style={{ height: "2px", width: "70%", background: "#dadce0", borderRadius: "1px" }} />
                      </div>
                    </div>
                  </div>
                  <div className="gf-recent-row__body">
                    <h3 className="gf-recent-row__title">
                      <Link href={`/forms/${fid}`} style={{ color: f.settingJson?.theme?.themeColor }}>
                        {f.title}
                      </Link>
                    </h3>
                    <OpenedLabel iso={f.updatedAt ?? f.createdAt} className="gf-recent-row__opened" />
                  </div>
                  <button
                    type="button"
                    className="gf-recent-row__star"
                    aria-label={f.isStarred ? "Unstar form" : "Star form"}
                    title={f.isStarred ? "Unstar form" : "Star form"}
                    disabled={starId === fid}
                    onClick={(e) => onToggleStar(e, fid)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "4px 8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: f.isStarred ? "var(--ez-navy)" : "#999",
                    }}
                  >
                    <Star
                      size={18}
                      strokeWidth={1.75}
                      fill={f.isStarred ? "currentColor" : "none"}
                    />
                  </button>
                  <details className="gf-recent-card__menu" style={{ position: "relative" }}>
                    <summary aria-label="More actions">
                      <MoreVertical size={18} />
                    </summary>
                    <div className="gf-recent-card__menu-panel">
                      <Link href={`/forms/${fid}`}>Open</Link>
                      {f.isPublished && f.accessLevel === "PUBLIC" && (
                        <Link href={`/f/${fid}`} target="_blank" rel="noreferrer">
                          View public link
                        </Link>
                      )}
                      <button type="button" disabled={dupId === fid || delId === fid} onClick={(e) => onDuplicate(e, fid)}>
                        {dupId === fid ? "Duplicating…" : "Make a copy"}
                      </button>
                      <button type="button" disabled={dupId === fid || delId === fid} onClick={(e) => onDelete(e, fid)}>
                        {delId === fid ? "Removing…" : "Remove"}
                      </button>
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        )}

        {pages > 1 && (
          <div className="gf-home-pagination">
            <button type="button" className="btn ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span className="muted small">
              Page {page} of {pages}
            </span>
            <button
              type="button"
              className="btn ghost"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
