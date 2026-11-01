"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@/components/home/icons";
import { authClient } from "@/lib/auth-client";
import { deliveryAreas } from "@/lib/delivery";
import { claimOrder, forgetBrowserOrders, removeSite, saveSite } from "@/lib/orders/actions";
import { CHECKOUT_ATTEMPT_KEY, CHECKOUT_DRAFT_KEY, CONNECTION_ERROR, FIELD_LIMITS, friendlyAuthError, localPath, PASSWORD_HINT, type FieldErrors, type SiteFields } from "@/lib/orders/rules";

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
          try {
            const { error: failed } = mode === "in" ? await authClient.signIn.email({ email, password }) : await authClient.signUp.email({ name, email, password });
            if (failed) {
              setError(friendlyAuthError(failed.message));
              return;
            }
            const target = localPath(next);
            if (target) router.replace(target);
            else router.refresh();
          } catch {
            setError(CONNECTION_ERROR);
          }
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
        {mode === "up" && <small id="hm-auth-rule">{PASSWORD_HINT}</small>}
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

/** Leaves nothing of the buyer's here: their orders, their checkout draft, and whatever pages are kept alive in memory. */
async function leaveThisBrowser() {
  await forgetBrowserOrders();
  try {
    sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
    sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
  } catch {}
  // A full page load, not a refresh: pages kept alive in the background still hold this buyer's site and orders.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- the router would keep them alive.
  window.location.assign("/account");
}

export function SignOutButton() {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  return (
    <>
      <button
        type="button"
        className="hm-btn hm-btn--ghost hm-btn--small"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setFailed(false);
            try {
              const { error } = await authClient.signOut();
              if (error) throw error;
              await leaveThisBrowser();
            } catch {
              setFailed(true);
            }
          })
        }
      >
        Sign out
      </button>
      {failed && (
        <p className="hm-qty-note" role="alert">
          {CONNECTION_ERROR}
        </p>
      )}
    </>
  );
}

export function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [changed, setChanged] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <>
        <button
          type="button"
          className="hm-btn hm-btn--ghost hm-btn--small"
          onClick={() => {
            setChanged(false);
            setOpen(true);
          }}
        >
          Change password
        </button>
        {changed && (
          <p className="hm-account-done" role="status">
            Password changed. Any other devices have been signed out.
          </p>
        )}
      </>
    );
  }

  return (
    <form
      className="hm-siteform"
      onSubmit={(e) => {
        e.preventDefault();
        setError(undefined);
        startTransition(async () => {
          try {
            const { error: failed } = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true });
            if (failed) {
              setError(friendlyAuthError(failed.message));
              return;
            }
            setCurrent("");
            setNext("");
            setChanged(true);
            setOpen(false);
          } catch {
            setError(CONNECTION_ERROR);
          }
        });
      }}
    >
      <div className="hm-co-field">
        <label htmlFor="hm-password-current">Current password</label>
        <input id="hm-password-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </div>
      <div className="hm-co-field">
        <label htmlFor="hm-password-new">New password</label>
        <input
          id="hm-password-new"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          aria-describedby="hm-password-rule"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
        />
        <small id="hm-password-rule">{PASSWORD_HINT}</small>
      </div>
      {error && (
        <p className="hm-co-error" role="alert">
          {error}
        </p>
      )}
      <div className="hm-account-actions">
        <button type="submit" className="hm-btn hm-btn--ink hm-btn--small" disabled={pending}>
          {pending ? "Saving…" : "Save new password"}
        </button>
        <button type="button" className="hm-btn hm-btn--ghost hm-btn--small" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Two steps and the password: this can't be undone, and a borrowed browser shouldn't be enough to do it. */
export function DeleteAccountForm() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" className="hm-copy" onClick={() => setOpen(true)}>
        Delete my account
      </button>
    );
  }

  return (
    <form
      className="hm-siteform"
      onSubmit={(e) => {
        e.preventDefault();
        setError(undefined);
        startTransition(async () => {
          try {
            const { error: failed } = await authClient.deleteUser({ password });
            if (failed) {
              setError(friendlyAuthError(failed.message));
              return;
            }
            await leaveThisBrowser();
          } catch {
            setError(CONNECTION_ERROR);
          }
        });
      }}
    >
      <p className="hm-account-warning">
        <b>This can&apos;t be undone.</b> Your account and saved sites are removed, and you&apos;re signed out everywhere. Past orders stay on record for receipts and warranty claims, no longer linked to an account.
      </p>
      <div className="hm-co-field">
        <label htmlFor="hm-delete-password">Enter your password to confirm</label>
        <input id="hm-delete-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && (
        <p className="hm-co-error" role="alert">
          {error}
        </p>
      )}
      <div className="hm-account-actions">
        <button type="submit" className="hm-btn hm-btn--ink hm-btn--small" disabled={pending}>
          {pending ? "Deleting…" : "Delete my account"}
        </button>
        <button type="button" className="hm-btn hm-btn--ghost hm-btn--small" onClick={() => setOpen(false)}>
          Keep my account
        </button>
      </div>
    </form>
  );
}

/** Adds an order placed from this browser to the signed-in account, because the buyer said it's theirs. */
export function ClaimOrderButton({ number }: { number: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  return (
    <>
      <button
        type="button"
        className="hm-btn hm-btn--ghost hm-btn--small"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setFailed(false);
            try {
              await claimOrder(number);
              router.refresh();
            } catch {
              setFailed(true);
            }
          })
        }
      >
        {pending ? "Adding…" : "Add to my account"}
      </button>
      {failed && (
        <p className="hm-qty-note" role="alert">
          {CONNECTION_ERROR}
        </p>
      )}
    </>
  );
}

const EMPTY_SITE: SiteFields = { contactName: "", mobile: "", street: "", city: "", area: deliveryAreas[0] };

export function AddSiteForm({ name }: { name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [site, setSite] = useState<SiteFields>({ ...EMPTY_SITE, contactName: name });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failed, setFailed] = useState(false);
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
          setFailed(false);
          try {
            const result = await saveSite(site);
            if (result.errors) {
              setErrors(result.errors);
              return;
            }
            setSite({ ...EMPTY_SITE, contactName: name });
            setErrors({});
            setOpen(false);
            router.refresh();
          } catch {
            setFailed(true);
          }
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
      {failed && (
        <p className="hm-co-error" role="alert">
          {CONNECTION_ERROR}
        </p>
      )}
      <button type="submit" className="hm-btn hm-btn--ink hm-btn--small" disabled={pending}>
        {pending ? "Saving…" : "Save this site"}
      </button>
    </form>
  );
}

export function RemoveSiteButton({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  return (
    <>
      <button
        type="button"
        className="hm-round"
        aria-label={`Remove ${label}`}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setFailed(false);
            try {
              await removeSite(id);
              router.refresh();
            } catch {
              setFailed(true);
            }
          })
        }
      >
        <TrashIcon />
      </button>
      {failed && (
        <p className="hm-qty-note" role="alert">
          {CONNECTION_ERROR}
        </p>
      )}
    </>
  );
}
