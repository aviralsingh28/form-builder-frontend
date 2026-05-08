"use client";

import React, { forwardRef, useId } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/cn";
import { Input } from "./Input";

export type DateFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  error?: string;
};

export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(function DateField(
  { className, label, error, ...props },
  ref,
) {
  const id = useId();

  return (
    <div className={cn("ui-date-field", className)}>
      {label && (
        <label htmlFor={id} className="ui-field__label">
          {label}
        </label>
      )}
      <div className="ui-date-field__wrapper">
        <Input
          {...props}
          ref={ref}
          id={id}
          type="date"
          placeholder="dd/mm/yyyy"
          className={cn("ui-date-field__input", error && "ui-input--error")}
        />
        <Calendar className="ui-date-field__icon" size={18} />
      </div>
      {error && <p className="ui-field__error">{error}</p>}
    </div>
  );
});
