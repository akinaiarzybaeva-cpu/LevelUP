import { useState } from "react";
import siteLogo from "../pages/logo.png";

const PASSWORD_HASH_PREFIX = "sha256:";

const bytesToHex = (bytes) =>
  Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");

const isPasswordHash = (value) => typeof value === "string" && value.startsWith(PASSWORD_HASH_PREFIX);

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

const isPasswordValid = async (rawPassword, storedUser) => {
  if (!rawPassword || !storedUser) return false;
  if (isPasswordHash(storedUser.passwordHash || "")) {
    const nextHash = await hashPassword(rawPassword);
    return nextHash === storedUser.passwordHash;
  }
  return typeof storedUser.password === "string" && storedUser.password === rawPassword;
};

export default function Auth({ onClose, onLogin, onModeChange, t = {}, initialMode = "register", standalone = false }) {
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

    const savedUser = JSON.parse(localStorage.getItem("studypro_user") || "null");

    if (mode === "register") {
      if (!name.trim()) {
        setError(t.nameRequired);
        return;
      }

      if (password.length < 6) {
        setError(t.passwordTooShort);
        return;
      }

      if (password !== confirmPassword) {
        setError(t.passwordsMismatch);
        return;
      }

      const normalizedName = name.trim();
      const normalizedEmail = email.trim().toLowerCase();
      try {
        const passwordHash = await hashPassword(password);
        const user = {
          name: normalizedName,
          fullName: normalizedName,
          username: normalizedName.split(/\s+/)[0],
          email: normalizedEmail,
          passwordHash,
          password: "",
          registrationDate: new Date().toISOString(),
          language: "ru",
          theme: "light",
        };

        localStorage.setItem("studypro_user", JSON.stringify(user));
        onLogin(user, "register");
      } catch {
        setError(t.passwordHashingError || "Secure password setup is unavailable right now. Please try again.");
      }
      return;
    }

    if (!savedUser || !savedUser.email || savedUser.email !== email.trim().toLowerCase()) {
      setError(t.accountNotFound);
      return;
    }

    let isValidPassword = false;
    try {
      isValidPassword = await isPasswordValid(password, savedUser);
    } catch {
      setError(t.passwordHashingError || "Secure password verification is unavailable right now. Please try again.");
      return;
    }

    if (!isValidPassword) {
      setError(t.invalidPassword || "Incorrect password. Please try again.");
      return;
    }

    let nextUser = savedUser;
    if (!isPasswordHash(savedUser.passwordHash || "") && typeof savedUser.password === "string" && savedUser.password.length > 0) {
      try {
        const migratedHash = await hashPassword(savedUser.password);
        nextUser = {
          ...savedUser,
          passwordHash: migratedHash,
          password: "",
        };
        localStorage.setItem("studypro_user", JSON.stringify(nextUser));
      } catch {
        setError(t.passwordHashingError || "Secure password verification is unavailable right now. Please try again.");
        return;
      }
    }

    onLogin(nextUser, "login");
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
              minLength={6}
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
                minLength={6}
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
