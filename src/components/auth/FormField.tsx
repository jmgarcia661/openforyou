type Props = {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
  hint?: string;
  readOnly?: boolean;
};

export function FormField({ id, label, type = "text", autoComplete, defaultValue, hint, readOnly }: Props) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        readOnly={readOnly}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="h-12 w-full rounded-xl border border-ink/25 bg-paper px-4 text-base read-only:bg-sand/60"
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-ink-soft">
          {hint}
        </p>
      )}
    </div>
  );
}
