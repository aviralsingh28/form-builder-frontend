"use client";

import React, { useRef } from "react";
import { X, Palette, Image as ImageIcon, Plus } from "lucide-react";
import { ThemeSettings } from "@/lib/api/types";
import { uploadFile } from "@/lib/api/upload";

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeSettings;
  onChange: (theme: ThemeSettings) => void;
}

const THEME_COLORS = [
  "#001f7a", "#00a651", "#db4437", "#673ab7", "#3f51b5", "#4285f4", "#03a9f4", "#00bcd4",
  "#ff5722", "#ff9800", "#009688", "#4caf50", "#607d8b", "#9e9e9e"
];

const BACKGROUND_COLORS = [
  "#f0f0f0", "#e8f0fe", "#fce8e6", "#e6f4ea", "#fef7e0"
];

const FONTS = [
  "Roboto", "Google Sans", "Arial", "Times New Roman", "Courier New", "Verdana"
];

export function ThemeCustomizer({ isOpen, onClose, theme, onChange }: ThemeCustomizerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateTheme = (updates: Partial<ThemeSettings>) => {
    onChange({ ...theme, ...updates });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await uploadFile(file, "themes");
      updateTheme({ headerImage: response.url });
    } catch (error) {
      console.error("Failed to upload theme image:", error);
      alert("Failed to upload image. Please try again.");
    }
  };

  return (
    <aside className={`gf-theme-panel ${isOpen ? "is-open" : ""}`}>
      <div className="gf-theme-panel__header">
        <div className="gf-theme-panel__title">
          <Palette size={20} />
          <span>Theme</span>
        </div>
        <button type="button" className="gf-theme-panel__close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="gf-theme-panel__content">
        {/* Text Section */}
        <section className="gf-theme-section">
          <h3 className="gf-theme-section__title">Text</h3>
          
          <div className="gf-theme-field">
            <label className="gf-theme-label">Header</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                className="gf-theme-select" 
                value={theme.fontFamily?.header || "Roboto"}
                onChange={(e) => updateTheme({ 
                  fontFamily: { ...theme.fontFamily, header: e.target.value } 
                })}
              >
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select 
                className="gf-theme-select" 
                style={{ width: '80px' }}
                value={theme.fontSize?.header || 24}
                onChange={(e) => updateTheme({ 
                  fontSize: { ...theme.fontSize, header: parseInt(e.target.value) } 
                })}
              >
                {[18, 20, 24, 28, 32].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="gf-theme-field">
            <label className="gf-theme-label">Question</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                className="gf-theme-select"
                value={theme.fontFamily?.question || "Roboto"}
                onChange={(e) => updateTheme({ 
                  fontFamily: { ...theme.fontFamily, question: e.target.value } 
                })}
              >
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select 
                className="gf-theme-select"
                style={{ width: '80px' }}
                value={theme.fontSize?.question || 12}
                onChange={(e) => updateTheme({ 
                  fontSize: { ...theme.fontSize, question: parseInt(e.target.value) } 
                })}
              >
                {[10, 11, 12, 14, 16].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="gf-theme-field">
            <label className="gf-theme-label">Text</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                className="gf-theme-select"
                value={theme.fontFamily?.text || "Roboto"}
                onChange={(e) => updateTheme({ 
                  fontFamily: { ...theme.fontFamily, text: e.target.value } 
                })}
              >
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select 
                className="gf-theme-select"
                style={{ width: '80px' }}
                value={theme.fontSize?.text || 11}
                onChange={(e) => updateTheme({ 
                  fontSize: { ...theme.fontSize, text: parseInt(e.target.value) } 
                })}
              >
                {[9, 10, 11, 12].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Header Image Section */}
        <section className="gf-theme-section">
          <h3 className="gf-theme-section__title">Header</h3>
          {theme.headerImage ? (
            <div 
              className="gf-theme-image-preview" 
              style={{ backgroundImage: `url(${theme.headerImage})` }}
            >
              <button 
                type="button" 
                className="gf-theme-image-remove"
                onClick={() => updateTheme({ headerImage: undefined })}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button 
              type="button" 
              className="gf-theme-image-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={18} />
              <span>Choose Image</span>
            </button>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="image/*"
            onChange={handleImageUpload}
          />
        </section>

        {/* Color Section */}
        <section className="gf-theme-section">
          <h3 className="gf-theme-section__title">Colour</h3>
          <div className="gf-color-grid">
            {THEME_COLORS.map(color => (
              <button
                key={color}
                type="button"
                className={`gf-color-option ${theme.themeColor === color ? "is-selected" : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => updateTheme({ themeColor: color })}
              />
            ))}
            <button type="button" className="gf-color-option" style={{ background: '#fff', border: '1px solid #ddd' }}>
              <Plus size={16} color="#5f6368" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
            </button>
          </div>
        </section>

        {/* Background Section */}
        <section className="gf-theme-section">
          <h3 className="gf-theme-section__title">Background</h3>
          <div className="gf-color-grid">
            {BACKGROUND_COLORS.map(color => (
              <button
                key={color}
                type="button"
                className={`gf-color-option ${theme.backgroundColor === color ? "is-selected" : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => updateTheme({ backgroundColor: color })}
              />
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
