import { ThemeSettings } from "../api/types";

export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 103, g: 58, b: 183 }; // Default purple
}

export function generateThemeVariables(theme: ThemeSettings | undefined) {
  if (!theme) return {};
  
  const hexColor = theme.themeColor || "#001f7a";
  const { r, g, b } = hexToRgb(hexColor);
  
  // Calculate a darker shade (multiply by 0.8)
  const darken = (c: number) => Math.max(0, Math.floor(c * 0.8));
  const darkR = darken(r);
  const darkG = darken(g);
  const darkB = darken(b);
  const darkHex = `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;

  const vars: any = {
    "--gf-purple": hexColor,
    "--gf-purple-dark": darkHex,
    "--gf-purple-soft": `rgba(${r}, ${g}, ${b}, 0.1)`,
    "--gf-editor-canvas": theme.backgroundColor || `rgba(${r}, ${g}, ${b}, 0.05)`,
    "--gf-canvas": theme.backgroundColor || `rgba(${r}, ${g}, ${b}, 0.02)`,
  };

  if (theme.fontFamily?.header) vars["--gf-font-header"] = theme.fontFamily.header;
  if (theme.fontFamily?.question) vars["--gf-font-question"] = theme.fontFamily.question;
  if (theme.fontFamily?.text) vars["--gf-font-text"] = theme.fontFamily.text;

  if (theme.fontSize?.header) vars["--gf-size-header"] = `${theme.fontSize.header}px`;
  if (theme.fontSize?.question) vars["--gf-size-question"] = `${theme.fontSize.question}px`;
  if (theme.fontSize?.text) vars["--gf-size-text"] = `${theme.fontSize.text}px`;

  return vars as React.CSSProperties;
}
