"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  variant?: "default" | "minimal";
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, variant = "default", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn("ui-input", variant === "minimal" && "ui-input--minimal", className)}
      {...props}
    />
  );
});
