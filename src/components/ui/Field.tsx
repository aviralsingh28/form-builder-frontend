"use client";

import React, { useId } from "react";
import { cn } from "@/lib/cn";

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactElement;
  className?: string;
  required?: boolean;
  /** If omitted, a stable id is generated and applied to the child control */
  id?: string;
};

export function Field({ label, hint, error, children, className, required, id: idProp }: FieldProps) {
  const uid = useId();
  const id = idProp ?? uid.replace(/:/g, "");

  const control = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<{ id?: string; "aria-invalid"?: boolean }>, {
        id,
        ...(error ? { "aria-invalid": true as const } : {}),
      })
    : children;

  return (
    <div className={cn("ui-field", error && "ui-field--invalid", className)}>
      <label className="ui-field__label" htmlFor={id}>
        {label}
        {required && <span className="ui-field__req">*</span>}
      </label>
      {hint && <p className="ui-field__hint">{hint}</p>}
      {control}
      {error && (
        <p className="ui-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
