import { type FormEvent, useId, useState } from "react";

export interface LoginFormStrings {
  tabSignin: string;
  tabRegister: string;
  name: string;
  email: string;
  password: string;
  confirm: string;
  submitSignin: string;
  submitRegister: string;
  submitting: string;
  errorName: string;
  errorEmail: string;
  errorPassword: string;
  errorConfirm: string;
  successSignin: string;
  successRegister: string;
  successNote: string;
  reset: string;
}

interface Props {
  strings: LoginFormStrings;
}

type Mode = "signin" | "register";

interface Values {
  name: string;
  email: string;
  password: string;
  confirm: string;
}

type Errors = Partial<Record<keyof Values, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY_VALUES: Values = { name: "", email: "", password: "", confirm: "" };

export default function LoginForm({ strings }: Props) {
  const [mode, setMode] = useState<Mode>("signin");
  const [values, setValues] = useState<Values>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Mode | null>(null);
  const idPrefix = useId();

  function validateField(
    field: keyof Values,
    current: Values,
  ): string | undefined {
    switch (field) {
      case "name":
        if (mode === "register" && current.name.trim() === "") {
          return strings.errorName;
        }
        return undefined;
      case "email":
        if (!EMAIL_PATTERN.test(current.email)) {
          return strings.errorEmail;
        }
        return undefined;
      case "password":
        if (current.password.length < 8) {
          return strings.errorPassword;
        }
        return undefined;
      case "confirm":
        if (mode === "register" && current.confirm !== current.password) {
          return strings.errorConfirm;
        }
        return undefined;
    }
  }

  function fieldsForMode(): Array<keyof Values> {
    return mode === "register"
      ? ["name", "email", "password", "confirm"]
      : ["email", "password"];
  }

  function handleBlur(field: keyof Values) {
    setErrors((prev) => ({ ...prev, [field]: validateField(field, values) }));
  }

  function handleChange(field: keyof Values, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Errors = {};
    for (const field of fieldsForMode()) {
      nextErrors[field] = validateField(field, values);
    }
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }
    setSubmitting(true);
    // Placeholder: pretend to talk to a backend, then show the success state.
    window.setTimeout(() => {
      setSubmitting(false);
      setDone(mode);
    }, 600);
  }

  function resetAll() {
    setDone(null);
    setValues(EMPTY_VALUES);
    setErrors({});
  }

  if (done) {
    return (
      <div className="login-form login-form--success" role="status">
        <p className="success-title">
          {done === "signin" ? strings.successSignin : strings.successRegister}
        </p>
        <p>{strings.successNote}</p>
        <button
          type="button"
          className="button button--outline"
          onClick={resetAll}
        >
          {strings.reset}
        </button>
      </div>
    );
  }

  const fields: Array<{
    key: keyof Values;
    label: string;
    type: string;
    autoComplete: string;
    show: boolean;
  }> = [
    {
      key: "name",
      label: strings.name,
      type: "text",
      autoComplete: "name",
      show: mode === "register",
    },
    {
      key: "email",
      label: strings.email,
      type: "email",
      autoComplete: "email",
      show: true,
    },
    {
      key: "password",
      label: strings.password,
      type: "password",
      autoComplete: mode === "register" ? "new-password" : "current-password",
      show: true,
    },
    {
      key: "confirm",
      label: strings.confirm,
      type: "password",
      autoComplete: "new-password",
      show: mode === "register",
    },
  ];

  return (
    <div className="login-form">
      <div className="tabs">
        <button
          type="button"
          aria-pressed={mode === "signin"}
          onClick={() => switchMode("signin")}
        >
          {strings.tabSignin}
        </button>
        <button
          type="button"
          aria-pressed={mode === "register"}
          onClick={() => switchMode("register")}
        >
          {strings.tabRegister}
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {fields
          .filter((field) => field.show)
          .map((field) => {
            const inputId = `${idPrefix}-${field.key}`;
            const errorId = `${inputId}-error`;
            const error = errors[field.key];
            return (
              <div className="field" key={field.key}>
                <label htmlFor={inputId}>{field.label}</label>
                <input
                  id={inputId}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  value={values[field.key]}
                  aria-invalid={error ? "true" : undefined}
                  aria-describedby={error ? errorId : undefined}
                  onChange={(event) =>
                    handleChange(field.key, event.target.value)
                  }
                  onBlur={() => handleBlur(field.key)}
                />
                {error && (
                  <p className="error" id={errorId}>
                    {error}
                  </p>
                )}
              </div>
            );
          })}

        <button
          type="submit"
          className="button button--action"
          disabled={submitting}
        >
          {submitting
            ? strings.submitting
            : mode === "signin"
              ? strings.submitSignin
              : strings.submitRegister}
        </button>
      </form>
    </div>
  );
}
