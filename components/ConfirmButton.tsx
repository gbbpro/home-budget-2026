"use client";
import { useFormStatus } from "react-dom";

/** Delete button that asks before submitting its form. */
export default function ConfirmButton({ message = "Delete this?", children = "Delete" }: { message?: string; children?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn-danger"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {pending ? "…" : children}
    </button>
  );
}
