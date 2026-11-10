import { useState } from "react";
import siteLogo from "../pages/logo.png";

const PASSWORD_HASH_PREFIX = "sha256:";
const AUTH_TOKENS_STORAGE_KEY = "studypro_auth_tokens";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL
  || (typeof window !== "undefined" ? `${window.location.origin}/api` : "/api")
).replace(/\/+$/, "");

const bytesToHex = (bytes) =>
  Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");

const hashPassword = async (rawPassword) => {
  if (!rawPassword || typeof rawPassword !== "string") {
    throw new Error("Password value is required.");
  }
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error("Secure password hashing is not available in this browser.");
  }
  const payload = new TextEncoder().encode(rawPassword);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", payload);
  return `${PASSWORD_HASH_PREFIX}${bytesToHex(new Uint8Array(hashBuffer))}`;
};

const buildApiUrl = (path) => `${API_BASE_URL}/${String(path || "").replace(/^\/+/, "")}`;

const parseErrorMessage = (payload, fallbackMessage) => {
  const pickText = (value) => {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      for (const item of value) {
        const nested = pickText(item);
        if (nested) return nested;
      }
      return "";
    }
    if (value && typeof value === "object") {
      for (const nestedValue of Object.values(value)) {
        const nested = pickText(nestedValue);
        if (nested) return nested;
      }
    }
    return "";
  };
  return pickText(payload) || fallbackMessage;
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
};

const buildClientUser = (serverUser, language, passwordHash) => {
  const fullName = serverUser?.profile?.full_name || serverUser?.username || "";
  return {
    id: serverUser?.id,
    name: fullName,
    fullName,
    username: serverUser?.username || "",
    email: serverUser?.email || "",
    phone: serverUser?.profile?.phone || "",
    language: serverUser?.profile?.preferred_language || language || "en",
    theme: "light",
    passwordHash: passwordHash || "",
    password: "",
    registrationDate: new Date().toISOString(),
  };
};

export default function Auth({
  onClose,
  onLogin,
  onModeChange,
  t = {},
  language = "en",
  initialMode = "register",
  standalone = false,
}) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function submitForm(event) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (mode === "register") {
      if (!name.trim()) {
        setError(t.nameRequired);
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (!EMAIL_PATTERN.test(normalizedEmail)) {
        setError(t.invalidEmailFormat || "Please enter a valid email address.");
        return;
      }

      if (password.length < 8) {
        setError(t.passwordTooShort);
        return;
      }

      if (password !== confirmPassword) {
        setError(t.passwordsMismatch);
        return;
      }

      const normalizedName = name.trim();
      try {
        const registerResult = await fetchJson(buildApiUrl("auth/register/"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": language,
          },
          body: JSON.stringify({
            email: normalizedEmail,
            password,
            full_name: normalizedName,
            preferred_language: language,
          }),
        });

        if (!registerResult.response.ok) {
          const message = parseErrorMessage(registerResult.payload, t.registrationFailed || "Unable to create account. Please check your data.");
          setError(message);
          return;
        }

        const loginResult = await fetchJson(buildApiUrl("auth/login/"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": language,
          },
          body: JSON.stringify({
            email: normalizedEmail,
            password,
          }),
        });

        if (!loginResult.response.ok || !loginResult.payload?.access) {
          const message = parseErrorMessage(loginResult.payload, t.loginFailed || "Account created, but sign-in failed. Please try logging in.");
          setError(message);
          return;
        }

        localStorage.setItem(AUTH_TOKENS_STORAGE_KEY, JSON.stringify({
          access: loginResult.payload.access,
          refresh: loginResult.payload.refresh || "",
        }));

        const meResult = await fetchJson(buildApiUrl("auth/me/"), {
          headers: {
            Authorization: `Bearer ${loginResult.payload.access}`,
          },
        });

        if (!meResult.response.ok || !meResult.payload?.id) {
          setError(t.profileLoadError || "Signed in, but failed to load profile data.");
          return;
        }

        const passwordHash = await hashPassword(password);
        const user = buildClientUser(meResult.payload, language, passwordHash);
        onLogin(user, "register");
      } catch {
        setError(t.networkError || "Unable to connect to server. Please try again.");
      }
      return;
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!EMAIL_PATTERN.test(normalizedEmail)) {
        setError(t.invalidEmailFormat || "Please enter a valid email address.");
        return;
      }
      const loginResult = await fetchJson(buildApiUrl("auth/login/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": language,
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      if (!loginResult.response.ok || !loginResult.payload?.access) {
        const message = parseErrorMessage(loginResult.payload, t.invalidPassword || "Incorrect email or password.");
        setError(message);
        return;
      }

      localStorage.setItem(AUTH_TOKENS_STORAGE_KEY, JSON.stringify({
        access: loginResult.payload.access,
        refresh: loginResult.payload.refresh || "",
      }));

      const meResult = await fetchJson(buildApiUrl("auth/me/"), {
        headers: {
          Authorization: `Bearer ${loginResult.payload.access}`,
        },
      });

      if (!meResult.response.ok || !meResult.payload?.id) {
        setError(t.profileLoadError || "Signed in, but failed to load profile data.");
        return;
      }

      const passwordHash = await hashPassword(password);
      const nextUser = buildClientUser(meResult.payload, language, passwordHash);
      onLogin(nextUser, "login");
    } catch {
      setError(t.networkError || "Unable to connect to server. Please try again.");
    }
  }

  function handleRecovery() {
    if (!email.trim()) {
      setError(t.recoveryPrompt);
      return;
    }

    setError("");
    setSuccessMessage(`${t.resetSuccess} ${email.trim().toLowerCase()}.`);
  }

  return (
    <div className={standalone ? "auth-page-shell" : "auth-overlay"}>
      <div className="auth-card">
        {!standalone && onClose ? (
          <button className="auth-close" onClick={onClose} aria-label={t.closeAuth}>
            ✕
          </button>
        ) : null}

        <div className="auth-route-switch" aria-label={t.languageLabel}>
          <button
            type="button"
            className={mode === "register" ? "filter-btn active" : "filter-btn"}
            onClick={() => {
              setMode("register");
              if (onModeChange) {
                onModeChange("register");
              }
              setError("");
              setSuccessMessage("");
            }}
          >
            {t.register}
          </button>
          <button
            type="button"
            className={mode === "login" ? "filter-btn active" : "filter-btn"}
            onClick={() => {
              setMode("login");
              if (onModeChange) {
                onModeChange("login");
              }
              setError("");
              setSuccessMessage("");
            }}
          >
            {t.signInAction}
          </button>
        </div>

        <div className="auth-logo">
          <img src={siteLogo} alt={t.siteLogoAlt} />
        </div>

        <h2>{mode === "register" ? t.authStartTitle : t.authWelcomeTitle}</h2>

        <p className="auth-subtitle">
          {mode === "register" ? t.authStartSubtitle : t.authWelcomeSubtitle}
        </p>

        <form onSubmit={submitForm}>
          {mode === "register" && (
            <label className="auth-label">
              {t.fullName}
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t.enterFullName}
                required
              />
            </label>
          )}

          <label className="auth-label">
            {t.emailAddress}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t.enterEmail}
              required
            />
          </label>

          <label className="auth-label">
            {t.password}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t.enterPassword}
              minLength={8}
              required
            />
          </label>

          {mode === "register" && (
            <label className="auth-label">
              {t.confirmPassword}
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={t.reEnterPassword}
                minLength={8}
                required
              />
            </label>
          )}

          {mode === "login" && (
            <button type="button" className="auth-link" onClick={handleRecovery}>
              {t.forgotPassword}
            </button>
          )}

          {error && <p className="auth-error">{error}</p>}
          {successMessage && <p className="auth-success">{successMessage}</p>}

          <button className="btn btn-primary auth-submit" type="submit">
            {mode === "register" ? t.createAccount : t.signIn}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "register" ? t.alreadyHave : t.needAccount}

          <button
            type="button"
            onClick={() => {
              const nextMode = mode === "register" ? "login" : "register";
              setMode(nextMode);
              if (onModeChange) {
                onModeChange(nextMode);
              }
              setError("");
              setSuccessMessage("");
            }}
          >
            {mode === "register" ? t.signInAction : t.register}
          </button>
        </p>
      </div>
    </div>
  );
}
