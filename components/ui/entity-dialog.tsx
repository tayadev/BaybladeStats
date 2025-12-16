"use client";

import * as React from "react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { Input } from "./input";
import { Label } from "./label";

export type FieldType = "text" | "datetime-local" | "number" | "select" | "checkbox";

export type FieldOption = { label: string; value: string | number };

export type EntityField = {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: FieldOption[]; // for select
  required?: boolean;
  disabled?: boolean;
};

export type EntityDialogProps<TValues extends Record<string, any>> = {
  mode: "create" | "edit";
  title: string;
  description?: string;
  trigger: React.ReactNode;
  fields: EntityField[];
  initialValues?: Partial<TValues>;
  onSubmit: (values: TValues) => Promise<void> | void;
  submitLabel?: string;
  cancelLabel?: string;
};

export function EntityDialog<TValues extends Record<string, any>>({
  mode,
  title,
  description,
  trigger,
  fields,
  initialValues,
  onSubmit,
  submitLabel,
  cancelLabel,
}: EntityDialogProps<TValues>) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [values, setValues] = React.useState<Record<string, any>>(() => ({ ...(initialValues ?? {}) }));

  const handleChange = (id: string, value: any) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(values as TValues);
      setOpen(false);
      // reset on create
      if (mode === "create") {
        setValues({});
      }
    } finally {
      setLoading(false);
    }
  };

  const isValid = fields.every((f) => {
    if (!f.required) return true;
    const v = values[f.id];
    return !(v === undefined || v === null || (typeof v === "string" && v.trim() === ""));
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              {field.type === "text" || field.type === "number" || field.type === "datetime-local" ? (
                <Input
                  id={field.id}
                  type={field.type === "text" ? "text" : field.type === "number" ? "number" : "datetime-local"}
                  placeholder={field.placeholder}
                  value={values[field.id] ?? ""}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  disabled={loading || field.disabled}
                />
              ) : field.type === "select" ? (
                <select
                  id={field.id}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none"
                  value={values[field.id] ?? ""}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  disabled={loading || field.disabled}
                >
                  <option value="" disabled>
                    {field.placeholder ?? "Select"}
                  </option>
                  {(field.options ?? []).map((opt) => (
                    <option key={String(opt.value)} value={String(opt.value)}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "checkbox" ? (
                <input
                  id={field.id}
                  type="checkbox"
                  checked={Boolean(values[field.id])}
                  onChange={(e) => handleChange(field.id, e.target.checked)}
                  disabled={loading || field.disabled}
                />
              ) : null}
            </div>
          ))}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              {cancelLabel ?? "Cancel"}
            </Button>
            <Button type="submit" disabled={loading || !isValid}>
              {loading ? (mode === "create" ? "Creating..." : "Saving...") : submitLabel ?? (mode === "create" ? "Create" : "Save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
