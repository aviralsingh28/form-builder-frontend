"use client";

import { cn } from "@/lib/cn";

type CheckboxFieldProps = {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
  disabled?: boolean;
};

export function CheckboxField({ id, checked, onChange, label, className, disabled }: CheckboxFieldProps) {
  return (
    <label className={cn("ui-checkbox", className)}>
      <input
        type="checkbox"
        id={id}
        className="ui-checkbox__input"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="ui-checkbox__text">{label}</span>
    </label>
  );
}
