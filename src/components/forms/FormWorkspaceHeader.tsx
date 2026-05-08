"use client";

import Link from "next/link";
import {
  Eye,
  MoreVertical,
  Palette,
  Redo2,
  Star,
  Undo2,
  Users,
  Link2,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/context/AuthContext";

type FormWorkspaceHeaderProps = {
  docTitle: string;
  onDocTitleChange: (value: string) => void;
  docTitlePlaceholder?: string;
  primaryAction?: React.ReactNode;
  menuExtra?: React.ReactNode;
  onPreview?: () => void;
  onThemeOpen?: () => void;
  onCopyLink?: () => void;
  onStar?: () => void;
  isStarred?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
};

export function FormWorkspaceHeader({
  docTitle,
  onDocTitleChange,
  docTitlePlaceholder = "Untitled form",
  primaryAction,
  menuExtra,
  onPreview,
  onThemeOpen,
  onCopyLink,
  onStar,
  isStarred = false,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: FormWorkspaceHeaderProps) {
  const { user, logout } = useAuth();
  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <header className="gf-form-editor__top">
      <div className="gf-form-editor__top-row gf-form-editor__top-row--primary">
        <div className="gf-form-editor__top-left">
          <Link href="/" className="gf-form-editor__doc-icon" aria-label="Forms home" title="Forms">
            <Logo />
          </Link>
          <input
            type="text"
            className="gf-form-editor__doc-title"
            value={docTitle}
            onChange={(e) => onDocTitleChange(e.target.value)}
            placeholder={docTitlePlaceholder}
            aria-label="Form title"
          />
        </div>
        <div className="gf-form-editor__top-right gf-form-editor__top-right--primary">
          <button
            type="button"
            className="gf-form-editor__star"
            aria-label="Star form"
            title={isStarred ? "Unstar form" : "Star form"}
            onClick={onStar}
          >
            <Star size={20} strokeWidth={1.75} fill={isStarred ? "currentColor" : "none"} />
          </button>
          <button 
            type="button" 
            className="gf-topbar__icon-btn" 
            aria-label="Customize theme"
            onClick={onThemeOpen}
            title="Customize theme"
          >
            <Palette size={20} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="gf-topbar__icon-btn"
            aria-label="Preview"
            onClick={onPreview}
            title="Preview form"
          >
            <Eye size={20} strokeWidth={2} />
          </button>
          {primaryAction}
          <details className="gf-form-editor__more">
            <summary className="gf-topbar__icon-btn gf-form-editor__more-trigger" aria-label="More options">
              <MoreVertical size={20} strokeWidth={2} />
            </summary>
            {menuExtra ? <div className="gf-form-editor__more-panel">{menuExtra}</div> : null}
          </details>
          <details className="gf-user-menu">
            <summary className="gf-avatar" aria-label="Account menu">
              {initial}
            </summary>
            <div className="gf-user-menu__panel">
              <div className="gf-user-menu__name">{user?.name}</div>
              <button type="button" className="gf-user-menu__signout" onClick={logout}>
                Sign out
              </button>
            </div>
          </details>
        </div>
      </div>
      <div className="gf-form-editor__top-row gf-form-editor__top-row--secondary">
        <button 
          type="button" 
          className="gf-topbar__icon-btn" 
          aria-label="Copy link"
          onClick={onCopyLink}
          title="Copy responder link"
        >
          <Link2 size={18} strokeWidth={2} />
        </button>
        <button 
          type="button" 
          className={`gf-topbar__icon-btn ${!canUndo ? 'gf-icon-btn--muted' : ''}`}
          aria-label="Undo" 
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={18} strokeWidth={2} />
        </button>
        <button 
          type="button" 
          className={`gf-topbar__icon-btn ${!canRedo ? 'gf-icon-btn--muted' : ''}`}
          aria-label="Redo" 
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={18} strokeWidth={2} />
        </button>
        <button type="button" className="gf-topbar__icon-btn" aria-label="Collaborators" title="Add collaborators">
          <Users size={18} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
