"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="ui-select-wrap">
      <select ref={ref} className={cn("ui-select", className)} {...props}>
        {children}
      </select>
    </div>
  );
});
