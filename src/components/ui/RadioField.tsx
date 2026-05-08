"use client";

import { cn } from "@/lib/cn";

type RadioFieldProps = {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  onSelect: () => void;
  label: string;
  className?: string;
  disabled?: boolean;
};

export function RadioField({ id, name, value, checked, onSelect, label, className, disabled }: RadioFieldProps) {
  return (
    <label className={cn("ui-radio", className)} htmlFor={id}>
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="ui-radio__input"
        disabled={disabled}
      />
      <span className="ui-radio__text">{label}</span>
    </label>
  );
}
