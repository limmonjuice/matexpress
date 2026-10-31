"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@/components/home/icons";
import { authClient } from "@/lib/auth-client";
import { deliveryAreas } from "@/lib/delivery";
import { claimBrowserOrders, forgetBrowserOrders, removeSite, saveSite } from "@/lib/orders/actions";
import { CHECKOUT_DRAFT_KEY, FIELD_LIMITS, type FieldErrors, type SiteFields } from "@/lib/orders/rules";

const friendly = (message?: string) => {
  if (!message) return "Something went wrong. Please try again.";
  if (/invalid email or password/i.test(message)) return "That email and password don't match.";
  if (/already exists/i.test(message)) return "There's already an account with that email. Try signing in.";
  return message;
};

export function AuthForms({ next }: { next?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="hm-authform"
      onSubmit={(e) => {
        e.preventDefault();
        setError(undefined);
        startTransition(async () => {
          const { error: failed } = mode === "in" ? await authClient.signIn.email({ email, password }) : await authClient.signUp.email({ name, email, password });
          if (failed) {
            setError(friendly(failed.message));
            return;
          }
          await claimBrowserOrders();
          if (next?.startsWith("/")) router.replace(next);
          else router.refresh();
        });
      }}
    >
      <div className="hm-auth-tabs" role="group" aria-label="Sign in or create an account">
        <button type="button" aria-pressed={mode === "in"} onClick={() => setMode("in")}>
          Sign in
        </button>
        <button type="button" aria-pressed={mode === "up"} onClick={() => setMode("up")}>
          Create account
        </button>
      </div>

      {mode === "up" && (
        <div className="hm-co-field">
          <label htmlFor="hm-auth-name">Your name</label>
          <input id="hm-auth-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
      )}
      <div className="hm-co-field">
        <label htmlFor="hm-auth-email">Email</label>
        <input id="hm-auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="hm-co-field">
        <label htmlFor="hm-auth-password">Password</label>
        <input
          id="hm-auth-password"
          type="password"
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          minLength={8}
          aria-describedby={mode === "up" ? "hm-auth-rule" : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {mode === "up" && <small id="hm-auth-rule">At least 8 characters.</small>}
      </div>
      {error && (
        <p className="hm-co-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="hm-btn hm-btn--accent hm-btn--block" disabled={pending}>
        {pending ? "One moment…" : mode === "in" ? "Sign in" : "Create my account"}
      </button>
    </form>
  );
}

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="hm-btn hm-btn--ghost hm-btn--small"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await authClient.signOut();
          await forgetBrowserOrders();
          try {
            sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
          } catch {}
          router.refresh();
        })
      }
    >
      Sign out
    </button>
  );
}

const EMPTY_SITE: SiteFields = { contactName: "", mobile: "", street: "", city: "", area: deliveryAreas[0] };

export function AddSiteForm({ name }: { name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [site, setSite] = useState<SiteFields>({ ...EMPTY_SITE, contactName: name });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" className="hm-btn hm-btn--ghost hm-btn--small" style={{ marginTop: 8 }} onClick={() => setOpen(true)}>
        Add a site
      </button>
    );
  }

  const field = (key: "contactName" | "mobile" | "street" | "city", label: string, autoComplete: string) => (
    <div className="hm-co-field" data-invalid={Boolean(errors[key])}>
      <label htmlFor={`hm-site-${key}`}>{label}</label>
      <input id={`hm-site-${key}`} autoComplete={autoComplete} maxLength={key === "mobile" ? undefined : FIELD_LIMITS[key]} value={site[key]} onChange={(e) => setSite({ ...site, [key]: e.target.value })} aria-invalid={Boolean(errors[key])} />
      {errors[key] && <p className="hm-co-error">{errors[key]}</p>}
    </div>
  );

  return (
    <form
      className="hm-siteform"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await saveSite(site);
          if (result.errors) {
            setErrors(result.errors);
            return;
          }
          setSite({ ...EMPTY_SITE, contactName: name });
          setErrors({});
          setOpen(false);
          router.refresh();
        });
      }}
    >
      {field("contactName", "Who should the driver ask for?", "name")}
      {field("mobile", "Mobile number", "tel")}
      {field("street", "Street and lot", "address-line1")}
      {field("city", "Barangay and city", "address-level2")}
      <div className="hm-co-field">
        <label htmlFor="hm-site-area">Area</label>
        <select id="hm-site-area" value={site.area} onChange={(e) => setSite({ ...site, area: e.target.value })}>
          {deliveryAreas.map((area) => (
            <option key={area}>{area}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="hm-btn hm-btn--ink hm-btn--small" disabled={pending}>
        {pending ? "Saving…" : "Save this site"}
      </button>
    </form>
  );
}

export function RemoveSiteButton({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="hm-round"
      aria-label={`Remove ${label}`}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await removeSite(id);
          router.refresh();
        })
      }
    >
      <TrashIcon />
    </button>
  );
}
