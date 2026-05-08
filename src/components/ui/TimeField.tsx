"use client";

import React, { forwardRef, useId } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { Input } from "./Input";

export type TimeFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  error?: string;
};

export const TimeField = forwardRef<HTMLInputElement, TimeFieldProps>(function TimeField(
  { className, label, error, ...props },
  ref,
) {
  const id = useId();

  return (
    <div className={cn("ui-time-field", className)}>
      {label && (
        <label htmlFor={id} className="ui-field__label">
          {label}
        </label>
      )}
      <div className="ui-time-field__wrapper">
        <Input
          {...props}
          ref={ref}
          id={id}
          type="time"
          placeholder="--:-- AM/PM"
          className={cn("ui-time-field__input", error && "ui-input--error")}
        />
        <Clock className="ui-time-field__icon" size={18} />
      </div>
      {error && <p className="ui-field__error">{error}</p>}
    </div>
  );
});
