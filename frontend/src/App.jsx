import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import "./theme-overrides.css";
import Quiz from "./components/Quiz.jsx";
import Auth from "./components/Auth.jsx";
import AdminPanel from "./components/AdminPanel.jsx";
import FeaturedPathCard from "./components/FeaturedPathCard.jsx";
import LessonIcon from "./components/LessonIcon.jsx";
import siteLogo from "./pages/logo.png";
import { DEFAULT_LANGUAGE, isSupportedLanguage, languageOptions, locales } from "./i18n";

const LANGUAGE_STORAGE_KEY = "levelup-language";
const THEME_STORAGE_KEY = "levelup-theme";
const USER_STORAGE_KEY = "studypro_user";
const AUTH_TOKENS_STORAGE_KEY = "studypro_auth_tokens";
const ADMIN_SESSION_STORAGE_KEY = "studypro_admin_session";
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL
  || (typeof window !== "undefined" ? `${window.location.origin}/api` : "/api")
).replace(/\/+$/, "");

const normalizeTheme = (value) => (value === "dark" ? "dark" : "light");

const getStoredTheme = () => {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return normalizeTheme(savedTheme);
  } catch {
    return "light";
  }
};

const applyThemeToDocument = (nextTheme) => {
  if (typeof document === "undefined") {
    return;
  }

  const safeTheme = normalizeTheme(nextTheme);
  document.documentElement.setAttribute("data-theme", safeTheme);
  document.documentElement.style.colorScheme = safeTheme;
  document.body.dataset.theme = safeTheme;
};
const REVIEWS_STORAGE_KEY = "levelup-reviews";
const LESSON_PROGRESS_STORAGE_KEY = "levelup-lesson-progress";
const AI_PRO_STORAGE_KEY = "levelup-ai-pro";
const LESSON_VIDEO_LOCK_NOTICE = "lesson-video-lock";
const PASSWORD_HASH_PREFIX = "sha256:";

let youtubeApiLoader = null;

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
  const hashArray = new Uint8Array(hashBuffer);
  return `${PASSWORD_HASH_PREFIX}${bytesToHex(hashArray)}`;
};

const isPasswordValidForUser = async (rawPassword, userData) => {
  if (!rawPassword || typeof rawPassword !== "string" || !userData) return false;
  const storedHash = typeof userData.passwordHash === "string" ? userData.passwordHash : "";
  if (isPasswordHash(storedHash)) {
    const candidateHash = await hashPassword(rawPassword);
    return candidateHash === storedHash;
  }
  const legacyPassword = typeof userData.password === "string" ? userData.password : "";
  return legacyPassword.length > 0 && legacyPassword === rawPassword;
};

const ROUTE_PUBLIC_HOME = "public-home";
const ROUTE_AUTH = "auth";
const ROUTE_MEMBER_HOME = "member-home";
const ROUTE_ADMIN = "admin";
const ROUTE_PROFILE_SETTINGS = "profile-settings";
const ROUTE_PROFILE_DATA = "profile-data";

const BACKGROUND_ANIMATION_SYMBOLS = [
  "</>",
  "{}",
  "{x}",
  "</html>",
  "{div}",
  "const",
  "let",
  "if()",
  "=>",
  "return",
  "HTML",
  "CSS",
  "JS",
  "</html>",
  "{ }",
  "if{}",
];

const getBackgroundTokenCount = () => {
  if (typeof window === "undefined") return 32;
  if (window.innerWidth < 640) return 22;
  if (window.innerWidth < 1024) return 30;
  return 40;
};

const createBackgroundTokens = (count) =>
  Array.from({ length: count }, (_, index) => {
    const layer = (index % 3) + 1;
    const size = Number((0.8 + Math.random() * 1.35).toFixed(2));
    const left = Number((Math.random() * 100).toFixed(2));
    const top = Number((Math.random() * 100).toFixed(2));
    const driftX = Number((-90 + Math.random() * 180).toFixed(2));
    const driftY = Number((-70 + Math.random() * 140).toFixed(2));
    const duration = Number((24 + Math.random() * 26).toFixed(2));
    const delay = Number((-Math.random() * duration).toFixed(2));
    const rotateStart = Number((-20 + Math.random() * 40).toFixed(2));
    const rotateMid = Number((-26 + Math.random() * 52).toFixed(2));
    const alpha = Number((0.2 + Math.random() * 0.35).toFixed(2));
    const hue = 195 + Math.round(Math.random() * 90);
    const blur = Number((Math.random() * 0.8).toFixed(2));
    const layerDepth = layer === 1 ? 0.2 : layer === 2 ? 0.35 : 0.5;

    return {
      id: `code-bg-${index}-${Math.round(Math.random() * 100000)}`,
      value: BACKGROUND_ANIMATION_SYMBOLS[index % BACKGROUND_ANIMATION_SYMBOLS.length],
      size,
      left,
      top,
      driftX,
      driftY,
      duration,
      delay,
      rotateStart,
      rotateMid,
      alpha,
      hue,
      blur,
      layerDepth,
    };
  });

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
};

const getInitialLanguage = () => {
  try {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && isSupportedLanguage(savedLanguage)) {
      return savedLanguage;
    }
  } catch {
    return DEFAULT_LANGUAGE;
  }
  return DEFAULT_LANGUAGE;
};

const isProfileComplete = (userData) => {
  if (!userData || typeof userData !== "object") {
    return false;
  }

  const identity = [userData.fullName, userData.name, userData.username, userData.email]
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .join(" ");

  return Boolean(identity.trim().length > 0);
};

const normalizeUserProfile = (userData) => {
  if (!userData || typeof userData !== "object") {
    return null;
  }

  const fullName = userData.fullName || userData.name || "";
  const username = userData.username || (fullName ? fullName.trim().split(/\s+/)[0] : "");
  const normalizedUser = {
    ...userData,
    name: fullName,
    fullName,
    username,
    email: userData.email || "",
    phone: userData.phone || "",
    passwordHash: userData.passwordHash || "",
    password: typeof userData.password === "string" ? userData.password : "",
    avatar: userData.avatar || "",
    registrationDate: userData.registrationDate || new Date().toISOString(),
    language: userData.language || getInitialLanguage(),
    theme: userData.theme || "light",
    role: userData.role || "member",
    isAdmin: Boolean(userData.isAdmin || userData.role === "admin" || userData.is_staff || userData.is_superuser),
  };

  return isProfileComplete(normalizedUser) ? normalizedUser : null;
};

const isValidReview = (review) =>
  review &&
  typeof review.id === "string" &&
  typeof review.name === "string" &&
  typeof review.text === "string" &&
  Number.isFinite(review.rating) &&
  review.rating >= 1 &&
  review.rating <= 5 &&
  typeof review.createdAt === "string";

const getProgressUserKey = (userData) => {
  if (!userData || typeof userData !== "object") return "guest";
  const primaryId = userData.email || userData.username || userData.fullName || userData.name || "guest";
  return String(primaryId).trim().toLowerCase() || "guest";
};

const buildApiUrl = (path) => `${API_BASE_URL}/${String(path || "").replace(/^\/+/, "")}`;

const getStoredAuthTokens = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTH_TOKENS_STORAGE_KEY) || "null");
    if (!parsed || typeof parsed !== "object") return null;
    const access = typeof parsed.access === "string" ? parsed.access : "";
    const refresh = typeof parsed.refresh === "string" ? parsed.refresh : "";
    if (!access && !refresh) return null;
    return { access, refresh };
  } catch {
    return null;
  }
};

const setStoredAuthTokens = (tokens) => {
  if (!tokens || typeof tokens !== "object") return;
  const payload = {
    access: typeof tokens.access === "string" ? tokens.access : "",
    refresh: typeof tokens.refresh === "string" ? tokens.refresh : "",
  };
  localStorage.setItem(AUTH_TOKENS_STORAGE_KEY, JSON.stringify(payload));
};

const clearStoredAuthTokens = () => {
  localStorage.removeItem(AUTH_TOKENS_STORAGE_KEY);
};

const getStoredReviewsForUser = (userData) => {
  const userKey = getProgressUserKey(userData);
  try {
    const parsed = JSON.parse(localStorage.getItem(REVIEWS_STORAGE_KEY) || "{}");
    if (Array.isArray(parsed)) {
      return userKey === "guest" ? parsed.filter(isValidReview) : [];
    }
    if (!parsed || typeof parsed !== "object") return [];
    const candidate = parsed[userKey];
    return Array.isArray(candidate) ? candidate.filter(isValidReview) : [];
  } catch {
    return [];
  }
};

const saveStoredReviewsForUser = (userData, reviews) => {
  const userKey = getProgressUserKey(userData);
  let parsed = {};
  try {
    const raw = JSON.parse(localStorage.getItem(REVIEWS_STORAGE_KEY) || "{}");
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      parsed = raw;
    } else if (Array.isArray(raw)) {
      parsed = { guest: raw.filter(isValidReview) };
    }
  } catch {
    parsed = {};
  }
  parsed[userKey] = Array.isArray(reviews) ? reviews.filter(isValidReview) : [];
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(parsed));
};

const getStoredAiProState = (userData) => {
  const userKey = getProgressUserKey(userData);
  try {
    const parsed = JSON.parse(localStorage.getItem(AI_PRO_STORAGE_KEY) || "{}");
    if (typeof parsed === "boolean") {
      return userKey === "guest" ? parsed : false;
    }
    if (parsed && typeof parsed === "object") {
      if (typeof parsed[userKey] === "boolean") return parsed[userKey];
      if (parsed.active && parsed.email && userData?.email) {
        return String(parsed.email).trim().toLowerCase() === String(userData.email).trim().toLowerCase();
      }
      return false;
    }
    return false;
  } catch {
    return false;
  }
};

const saveStoredAiProState = (userData, isActive) => {
  const userKey = getProgressUserKey(userData);
  let parsed = {};
  try {
    const raw = JSON.parse(localStorage.getItem(AI_PRO_STORAGE_KEY) || "{}");
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      parsed = raw;
    }
  } catch {
    parsed = {};
  }
  parsed[userKey] = Boolean(isActive);
  localStorage.setItem(AI_PRO_STORAGE_KEY, JSON.stringify(parsed));
};

const getStoredLessonProgress = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(LESSON_PROGRESS_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const getAiAssistantQuestionsByLanguage = (currentLanguage) => {
  const selectedLocale = locales[currentLanguage] || locales[DEFAULT_LANGUAGE];
  const fallback = locales[DEFAULT_LANGUAGE].content.aiAssistantQuestions || [];
  return selectedLocale?.content?.aiAssistantQuestions || fallback;
};

const extractYouTubeVideoId = (urlValue) => {
  if (!urlValue || typeof urlValue !== "string") return "";
  try {
    const url = new URL(urlValue);
    if (url.pathname.includes("/embed/")) {
      const parts = url.pathname.split("/embed/");
      return parts[1]?.split("/")[0] || "";
    }
    return url.searchParams.get("v") || "";
  } catch {
    return "";
  }
};

const loadYouTubeIframeApi = () => {
  if (typeof window === "undefined") return Promise.reject(new Error("window is unavailable"));
  if (window.YT && typeof window.YT.Player === "function") return Promise.resolve(window.YT);
  if (youtubeApiLoader) return youtubeApiLoader;

  youtubeApiLoader = new Promise((resolve, reject) => {
    const previousReadyHandler = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReadyHandler === "function") {
        previousReadyHandler();
      }
      resolve(window.YT);
    };

    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load YouTube IFrame API"));
    document.body.appendChild(script);
  });

  return youtubeApiLoader;
};

const parseHashState = () => {
  if (typeof window === "undefined") return { route: ROUTE_PUBLIC_HOME, authMode: "register" };

  const hash = window.location.hash.replace(/^#\/?/, "").toLowerCase();

  if (hash === "login") return { route: ROUTE_AUTH, authMode: "login" };
  if (hash === "register" || hash === "auth") return { route: ROUTE_AUTH, authMode: "register" };
  if (hash === "member-home" || hash === "student-home") {
    return { route: ROUTE_MEMBER_HOME, authMode: "register" };
  }
  if (hash === "admin") return { route: ROUTE_ADMIN, authMode: "login" };
  if (hash === "profile-settings" || hash === "settings") return { route: ROUTE_PROFILE_SETTINGS, authMode: "register" };
  if (hash === "profile-data" || hash === "my-data" || hash === "data") {
    return { route: ROUTE_PROFILE_DATA, authMode: "register" };
  }
  if (hash === "ratings") return { route: ROUTE_PUBLIC_HOME, authMode: "register" };
  if (hash === "reviews") return { route: ROUTE_MEMBER_HOME, authMode: "register" };
  if (hash === "home" || hash === "courses" || hash === "learning" || hash === "pricing" || hash === "faq") {
    return { route: ROUTE_PUBLIC_HOME, authMode: "register" };
  }
  if (hash === "search" || hash === "subjects") {
    return { route: ROUTE_MEMBER_HOME, authMode: "register" };
  }

  return { route: ROUTE_PUBLIC_HOME, authMode: "register" };
};

const getHashForState = (route, authMode) => {
  if (route === ROUTE_AUTH) {
    return authMode === "login" ? "#/login" : "#/register";
  }
  if (route === ROUTE_ADMIN) return "#/admin";
  if (route === ROUTE_MEMBER_HOME) return "#/member-home";
  if (route === ROUTE_PROFILE_SETTINGS) return "#/profile-settings";
  if (route === ROUTE_PROFILE_DATA) return "#/profile-data";
  return "#/home";
};

const getStatusLabel = (status, t) => {
  if (status === "completed") return t.statusCompleted;
  if (status === "in-progress") return t.statusInProgress;
  return t.statusNotStarted;
};

function App() {
  const appRootRef = useRef(null);
  const lessonVideoPlayerRef = useRef(null);
  const youtubePlayerRef = useRef(null);
  const youtubeProgressIntervalRef = useRef(null);
  const youtubePlaybackStateRef = useRef({ lastTime: 0, watchedSeconds: 0, duration: 0 });
  const assistantChatScrollRef = useRef(null);
  const assistantInputRef = useRef(null);
  const [backgroundTokenCount, setBackgroundTokenCount] = useState(getBackgroundTokenCount);
  const backgroundTokens = useMemo(() => createBackgroundTokens(backgroundTokenCount), [backgroundTokenCount]);
  const initialHashState = parseHashState();
  const [language, setLanguage] = useState(getInitialLanguage);
  const initialStoredUser = normalizeUserProfile(getStoredUser());
  const initialStoredTokens = getStoredAuthTokens();
  const [user, setUser] = useState(() => {
    if (!initialStoredUser) {
      try {
        localStorage.removeItem(USER_STORAGE_KEY);
      } catch {
        // Ignore storage errors in restricted environments.
      }
      return null;
    }
    return initialStoredUser;
  });
  const [route, setRoute] = useState(() => {
    if (initialHashState.route === ROUTE_MEMBER_HOME && !initialStoredUser && !initialStoredTokens?.access) return ROUTE_PUBLIC_HOME;
    if (initialHashState.route === ROUTE_PROFILE_SETTINGS && !initialStoredUser && !initialStoredTokens?.access) return ROUTE_PUBLIC_HOME;
    if (initialHashState.route === ROUTE_PROFILE_DATA && !initialStoredUser && !initialStoredTokens?.access) return ROUTE_PUBLIC_HOME;
    return initialHashState.route;
  });
  const [authMode, setAuthMode] = useState(initialHashState.authMode);
  const [authBootstrapDone, setAuthBootstrapDone] = useState(() => !Boolean(initialStoredTokens?.access));

  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showLessonAccessNotice, setShowLessonAccessNotice] = useState(false);
  const [pendingAccessCourseId, setPendingAccessCourseId] = useState(null);
  const [pendingAccessLessonId, setPendingAccessLessonId] = useState(null);
  const [lessonCompletionNotice, setLessonCompletionNotice] = useState("");
  const [lessonPlaybackError, setLessonPlaybackError] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isAiAssistantMinimized, setIsAiAssistantMinimized] = useState(false);
  const [showReadyQuestions, setShowReadyQuestions] = useState(false);
  const [showAiPaymentModal, setShowAiPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");
  const [aiAssistantLoading, setAiAssistantLoading] = useState(false);
  const [aiAssistantError, setAiAssistantError] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lastProfileRoute, setLastProfileRoute] = useState(ROUTE_MEMBER_HOME);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [ratingsValue, setRatingsValue] = useState(5);
  const [ratingsText, setRatingsText] = useState("");
  const [ratingsCourse, setRatingsCourse] = useState("all");
  const [ratingsSortBy, setRatingsSortBy] = useState("newest");
  const [ratingsFilter, setRatingsFilter] = useState("all");
  const [ratingsError, setRatingsError] = useState("");
  const [ratingsSuccess, setRatingsSuccess] = useState("");
  const [ratingsSubmitting, setRatingsSubmitting] = useState(false);
  const [isRatingsFormOpen, setIsRatingsFormOpen] = useState(false);
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [editingReviewId, setEditingReviewId] = useState(null);

  const [theme, setTheme] = useState(() => getStoredTheme());

  const [chatMessages, setChatMessages] = useState(() => {
    const initialLocale = locales[getInitialLanguage()] || locales[DEFAULT_LANGUAGE];
    return [{ role: "bot", text: initialLocale.content.chat.welcome }];
  });

  const [aiProEnabled, setAiProEnabled] = useState(() => getStoredAiProState(initialStoredUser));
  const [websiteReviews, setWebsiteReviews] = useState(() => getStoredReviewsForUser(initialStoredUser));
  const [lessonProgress, setLessonProgress] = useState(getStoredLessonProgress);

  const [profileForm, setProfileForm] = useState(() => {
    const safeUser = normalizeUserProfile(getStoredUser()) || {};
    return {
      avatar: safeUser.avatar || "",
      username: safeUser.username || "",
      fullName: safeUser.fullName || safeUser.name || "",
      email: safeUser.email || "",
      phone: safeUser.phone || "",
      language: safeUser.language || getInitialLanguage(),
      theme: safeUser.theme || "light",
    };
  });

  const [profileSaveMessage, setProfileSaveMessage] = useState("");
  const [profileSaveError, setProfileSaveError] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [passwordUpdateMessage, setPasswordUpdateMessage] = useState("");
  const [passwordUpdateError, setPasswordUpdateError] = useState("");
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  const locale = locales[language] || locales[DEFAULT_LANGUAGE];
  const t = locale.ui;
  const content = locale.content;
  const isAuthenticated = Boolean(user && isProfileComplete(user));
  const isCurrentUserAdmin = Boolean(user?.isAdmin || user?.role === "admin" || user?.is_staff || user?.is_superuser);

  const {
    courseCatalog,
    categoryFilters,
    learningPaths,
    benefits,
    dashboardMetrics,
    testimonials,
    faqs,
    lessonSlides,
    suggestedPrompts,
    pricingFeatures,
    quizQuestions,
    chat,
  } = content;

  const [reviewCourseId, setReviewCourseId] = useState(() => courseCatalog?.[0]?.id || "all");
  const [reviewLessonId, setReviewLessonId] = useState(() => courseCatalog?.[0]?.lessons?.[0]?.id || "");

  useEffect(() => {
    if (!courseCatalog || courseCatalog.length === 0) {
      setReviewCourseId("all");
      setReviewLessonId("");
      return;
    }

    const validCourse = courseCatalog.find((course) => course.id === reviewCourseId);
    if (!validCourse) {
      const firstCourse = courseCatalog[0];
      setReviewCourseId(firstCourse.id);
      setReviewLessonId(firstCourse.lessons?.[0]?.id || "");
      return;
    }

    const lessonExists = validCourse.lessons?.some((lesson) => lesson.id === reviewLessonId);
    if (!lessonExists) {
      setReviewLessonId(validCourse.lessons?.[0]?.id || "");
    }
  }, [courseCatalog, reviewCourseId, reviewLessonId]);

  useEffect(() => {
    const bootstrapAuthSession = async () => {
      const storedTokens = getStoredAuthTokens();
      if (!storedTokens?.access) {
        setAuthBootstrapDone(true);
        return;
      }

      const requestCurrentUser = async (accessToken) => {
        const response = await fetch(buildApiUrl("auth/me/"), {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const payload = await response.json().catch(() => ({}));
        return { response, payload };
      };

      const refreshAccessToken = async () => {
        if (!storedTokens.refresh) return null;
        const response = await fetch(buildApiUrl("auth/refresh/"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh: storedTokens.refresh }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.access) {
          return null;
        }
        const nextTokens = {
          access: payload.access,
          refresh: typeof payload.refresh === "string" ? payload.refresh : storedTokens.refresh,
        };
        setStoredAuthTokens(nextTokens);
        return nextTokens;
      };

      try {
        let session = await requestCurrentUser(storedTokens.access);
        if (session.response.status === 401) {
          const refreshedTokens = await refreshAccessToken();
          if (refreshedTokens?.access) {
            session = await requestCurrentUser(refreshedTokens.access);
          }
        }

        if (!session.response.ok || !session.payload?.id) {
          setUser(null);
          localStorage.removeItem(USER_STORAGE_KEY);
          clearStoredAuthTokens();
          setRoute(ROUTE_AUTH);
          setAuthMode("login");
          return;
        }

        const fallbackUser = normalizeUserProfile(getStoredUser()) || {};
        const normalizedUser = normalizeUserProfile({
          ...fallbackUser,
          id: session.payload.id,
          username: session.payload.username || fallbackUser.username || "",
          email: session.payload.email || fallbackUser.email || "",
          fullName: session.payload.profile?.full_name || fallbackUser.fullName || fallbackUser.name || session.payload.username || "",
          name: session.payload.profile?.full_name || fallbackUser.fullName || fallbackUser.name || session.payload.username || "",
          phone: session.payload.profile?.phone || fallbackUser.phone || "",
          language: session.payload.profile?.preferred_language || fallbackUser.language || getInitialLanguage(),
          registrationDate: fallbackUser.registrationDate || new Date().toISOString(),
        });

        if (!normalizedUser) {
          localStorage.removeItem(USER_STORAGE_KEY);
          clearStoredAuthTokens();
          return;
        }

        setUser(normalizedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
      } catch {
        setUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
        clearStoredAuthTokens();
      } finally {
        setAuthBootstrapDone(true);
      }
    };

    bootstrapAuthSession();
  }, []);

  useEffect(() => {
    if (user && !isProfileComplete(user)) {
      setUser(null);
      try {
        localStorage.removeItem(USER_STORAGE_KEY);
        clearStoredAuthTokens();
      } catch {
        // Ignore storage errors for environments that block localStorage.
      }
    }
  }, [user]);

  useEffect(() => {
    applyThemeToDocument(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors in restricted environments.
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Ignore storage errors for environments that block localStorage.
    }
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    setWebsiteReviews(getStoredReviewsForUser(user));
    setAiProEnabled(getStoredAiProState(user));
  }, [user]);

  useEffect(() => {
    try {
      saveStoredReviewsForUser(user, websiteReviews);
    } catch {
      // Ignore storage errors for environments that block localStorage.
    }
  }, [user, websiteReviews]);

  useEffect(() => {
    try {
      saveStoredAiProState(user, aiProEnabled);
    } catch {
      // Ignore storage errors for environments that block localStorage.
    }
  }, [user, aiProEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(LESSON_PROGRESS_STORAGE_KEY, JSON.stringify(lessonProgress));
    } catch {
      // Ignore storage errors for environments that block localStorage.
    }
  }, [lessonProgress]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const chatWindows = document.querySelectorAll(".ai-assistant-chat-window");
    chatWindows.forEach((chatWindow) => {
      chatWindow.scrollTop = chatWindow.scrollHeight;
    });
  }, [chatMessages, aiAssistantLoading, isAiAssistantOpen, isAiAssistantMinimized]);

  useEffect(() => {
    if (!user) return;
    const guestProgress = lessonProgress?.guest || {};
    const userKey = getProgressUserKey(user);
    const existingUserProgress = lessonProgress?.[userKey] || {};
    const guestHasProgress = Object.values(guestProgress).some(
      (courseProgress) => courseProgress && typeof courseProgress === "object" && Object.keys(courseProgress).length > 0
    );
    if (!guestHasProgress || Object.keys(existingUserProgress).length > 0) return;

    setLessonProgress((previous) => ({
      ...previous,
      [userKey]: guestProgress,
    }));
  }, [lessonProgress, user]);

  useEffect(() => {
    setRatingsLoading(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const appRoot = appRootRef.current;
    if (!appRoot) return undefined;

    let rafId = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const animateParallax = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      appRoot.style.setProperty("--bg-parallax-x", `${currentX.toFixed(2)}px`);
      appRoot.style.setProperty("--bg-parallax-y", `${currentY.toFixed(2)}px`);

      if (Math.abs(targetX - currentX) > 0.04 || Math.abs(targetY - currentY) > 0.04) {
        rafId = window.requestAnimationFrame(animateParallax);
        return;
      }
      rafId = 0;
    };

    const scheduleParallaxAnimation = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(animateParallax);
      }
    };

    const handlePointerMove = (event) => {
      const offsetX = event.clientX / Math.max(window.innerWidth, 1) - 0.5;
      const offsetY = event.clientY / Math.max(window.innerHeight, 1) - 0.5;
      targetX = offsetX * 26;
      targetY = offsetY * 18;
      scheduleParallaxAnimation();
    };

    const resetParallax = () => {
      targetX = 0;
      targetY = 0;
      scheduleParallaxAnimation();
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", resetParallax);
    window.addEventListener("pointerleave", resetParallax);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", resetParallax);
      window.removeEventListener("pointerleave", resetParallax);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleResize = () => {
      const nextCount = getBackgroundTokenCount();
      setBackgroundTokenCount((previousCount) => (previousCount === nextCount ? previousCount : nextCount));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const eventTarget = event.target;
      if (!(eventTarget instanceof Element) || !eventTarget.closest(".profile-menu-wrap")) {
        setIsProfileOpen(false);
      }

      if (isMobileMenuOpen && (!(eventTarget instanceof Element) || !eventTarget.closest(".site-header"))) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!authBootstrapDone) return undefined;
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, "").toLowerCase();
      const safeHash = hash || "home";
      const isSharedSection = ["pricing"].includes(safeHash);
      const isMemberSection = ["search", "subjects", "reviews"].includes(safeHash);
      const isPublicSection = ["home", "courses", "learning", "faq"].includes(safeHash);

      if (isSharedSection && route === ROUTE_MEMBER_HOME && isAuthenticated) {
        setRoute(ROUTE_MEMBER_HOME);
        setAuthMode("register");
        return;
      }

      if (isMemberSection && isAuthenticated) {
        setRoute(ROUTE_MEMBER_HOME);
        setAuthMode("register");
        return;
      }

      if (isPublicSection && route === ROUTE_MEMBER_HOME && isAuthenticated) {
        setRoute(ROUTE_PUBLIC_HOME);
        setAuthMode("register");
        return;
      }

      const hashState = parseHashState();

      if ((hashState.route === ROUTE_MEMBER_HOME || hashState.route === ROUTE_PROFILE_SETTINGS || hashState.route === ROUTE_PROFILE_DATA) && !isAuthenticated) {
        setRoute(ROUTE_PUBLIC_HOME);
        return;
      }

      setRoute(hashState.route);
      setAuthMode(hashState.authMode);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [authBootstrapDone, isAuthenticated, route]);

  useEffect(() => {
    const expectedHash = getHashForState(route, authMode);
    if (window.location.hash !== expectedHash) {
      const url = new URL(window.location.href);
      url.hash = expectedHash;
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, [route, authMode]);

  useEffect(() => {
    if (route === ROUTE_PROFILE_SETTINGS || route === ROUTE_PROFILE_DATA) {
      setProfileForm(buildProfileForm(user));
    }
  }, [route, user, language, theme]);

  const activeFilter = categoryFilters.some((item) => item.id === filter) ? filter : "all";
  const selectedCourse = selectedCourseId ? courseCatalog.find((course) => course.id === selectedCourseId) || null : null;
  const selectedLesson = selectedLessonId
    ? (selectedCourse?.lessons || []).find((lesson) => lesson.id === selectedLessonId) || null
    : null;
  const progressUserKey = getProgressUserKey(user);
  const guestCompletedLessonsByCourse = lessonProgress?.guest || {};
  const userCompletedLessonsByCourse = lessonProgress?.[progressUserKey] || {};
  const completedLessonsByCourse = { ...guestCompletedLessonsByCourse, ...userCompletedLessonsByCourse };
  const isLessonCompleted = (courseId, lessonId) => {
    if (!courseId || !lessonId) return false;
    return Boolean(completedLessonsByCourse?.[courseId]?.[lessonId]);
  };
  const activeCourseLessons = Array.isArray(selectedCourse?.lessons) ? selectedCourse.lessons.filter(Boolean) : [];
  const activeLessonIndex =
    selectedLesson && activeCourseLessons.length > 0
      ? activeCourseLessons.findIndex((lesson) => lesson.id === selectedLesson.id)
      : -1;
  const completedCourseLessons = activeCourseLessons.filter((lesson) => isLessonCompleted(selectedCourse?.id, lesson.id)).length;

  const filteredCourses = useMemo(
    () =>
      courseCatalog.filter((course) => {
        const matchesFilter = activeFilter === "all" || course.categoryId === activeFilter;
        const matchesSearch = `${course.title} ${course.category} ${course.description}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
      }),
    [activeFilter, courseCatalog, searchQuery]
  );

  const renderedReviews = useMemo(() => {
    const saved = [...websiteReviews]
      .filter((item) => item && typeof item.text === "string" && item.text.trim().length > 0)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .map((item) => ({
        ...item,
        id: item.id || `review-${item.createdAt || Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: item.name || t.studentFallback,
        role: t.studentFallback,
        quote: item.text,
        rating: Number.isFinite(item.rating) ? item.rating : 5,
        createdAt: item.createdAt || new Date().toISOString(),
      }));

    return saved;
  }, [language, t.studentFallback, websiteReviews]);

  const ratingSummary = useMemo(() => {
    const total = renderedReviews.length;
    const average = total > 0
      ? renderedReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / total
      : 0;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    renderedReviews.forEach((review) => {
      const safeRating = Math.min(5, Math.max(1, Number(review.rating) || 1));
      distribution[safeRating] += 1;
    });

    return { total, average, distribution };
  }, [renderedReviews]);

  const ratingCourseOptions = useMemo(
    () => [
      { id: "all", label: t.allCourses || "All courses" },
      ...courseCatalog.map((course) => ({ id: course.id, label: course.title })),
    ],
    [courseCatalog, t.allCourses]
  );

  const visibleReviews = useMemo(() => {
    const sorted = [...renderedReviews].filter((review) => {
      if (ratingsFilter === "all") return true;
      return (review.courseId || "all") === ratingsFilter;
    });

    sorted.sort((a, b) => {
      if (ratingsSortBy === "highest") return Number(b.rating) - Number(a.rating);
      if (ratingsSortBy === "lowest") return Number(a.rating) - Number(b.rating);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return sorted;
  }, [ratingsFilter, ratingsSortBy, renderedReviews]);

  const currentLesson = lessonSlides[slideIndex];
  const lessonVideoConfig = (() => {
    if (!selectedCourse || !selectedLesson || !Array.isArray(selectedCourse.lessons)) {
      return null;
    }

    const selectedLessonIndex = selectedCourse.lessons.findIndex((lesson) => lesson && lesson.id === selectedLesson.id);
    if (selectedLessonIndex < 0) {
      return null;
    }

    if (selectedCourse.id === "mathematics") {
      const mathVideoTitle = "Mathematics lesson video";

      if (selectedLessonIndex === 0) {
        return {
          src: "https://www.youtube.com/embed/tR_UdpCy4LQ",
          title: mathVideoTitle,
        };
      }

      if (selectedLessonIndex === 1) {
        return {
          src: "https://www.youtube.com/embed/QhK6hU0CBe0",
          title: mathVideoTitle,
        };
      }

      if (route === ROUTE_MEMBER_HOME && isAuthenticated) {
        if (selectedLessonIndex === 2) {
          return {
            src: "https://www.youtube.com/embed/_kS7sNAaBC8",
            title: mathVideoTitle,
          };
        }

        if (selectedLessonIndex >= 3 && selectedLessonIndex <= 19) {
          return {
            src: "https://www.youtube.com/embed/OLn2xxOF51Y",
            title: mathVideoTitle,
          };
        }
      }

      return null;
    }

    if (selectedCourse.id === "physics") {
      const physicsVideoTitle = "Physics lesson video";

      if (selectedLessonIndex === 0) {
        return {
          src: "https://www.youtube.com/embed/2JGbRnJfG0g?si=iubzJsZwFbvZj5Ot",
          title: physicsVideoTitle,
        };
      }

      if (selectedLessonIndex === 1) {
        return {
          src: "https://www.youtube.com/embed/Ioaq97Jp10Q?si=q3huALhpm977WE8A",
          title: physicsVideoTitle,
        };
      }

      if (route === ROUTE_MEMBER_HOME && isAuthenticated) {
        if (selectedLessonIndex === 2) {
          return {
            src: "https://www.youtube.com/embed/E-Hps8rwGDY?si=ceOQyeUP2Hg0QqWt",
            title: physicsVideoTitle,
          };
        }

        if (selectedLessonIndex >= 3 && selectedLessonIndex <= 19) {
          return {
            src: "https://www.youtube.com/embed/8sHSZK0MDsk?si=SOr2bUDW1TGNj8BY",
            title: physicsVideoTitle,
          };
        }
      }

      return null;
    }

    if (selectedCourse.id === "english-language") {
      const englishVideoTitle = "English lesson video";

      if (selectedLessonIndex === 0) {
        return {
          src: "https://www.youtube.com/embed/_dVF0SXgs0w?si=twADPppc0vK-gS5g",
          title: englishVideoTitle,
        };
      }

      if (selectedLessonIndex === 1) {
        return {
          src: "https://www.youtube.com/embed/fvbl1y2C4bg?si=ko5JzlPdI1gkFPOG",
          title: englishVideoTitle,
        };
      }

      if (route === ROUTE_MEMBER_HOME && isAuthenticated) {
        if (selectedLessonIndex === 2) {
          return {
            src: "https://www.youtube.com/embed/ro74ZX-bs1I?si=5_Jl8dndh0-I05CE",
            title: englishVideoTitle,
          };
        }

        if (selectedLessonIndex >= 3 && selectedLessonIndex <= 19) {
          return {
            src: "https://www.youtube.com/embed/1WWGgvkY2IA?si=unTcNX2zY4vuO8yD",
            title: englishVideoTitle,
          };
        }
      }

      return null;
    }

    if (selectedCourse.id === "kyrgyz-language") {
      const cssVideoTitle = "CSS lesson video";

      if (selectedLessonIndex === 0) {
        return {
          src: "https://www.youtube.com/embed/hft4XYApT44?si=Tfttfh73RecYaE5g",
          title: cssVideoTitle,
        };
      }

      if (selectedLessonIndex === 1) {
        return {
          src: "https://www.youtube.com/embed/DX9ITfNVM7I?si=xR36HlIrQq2M6dQb",
          title: cssVideoTitle,
        };
      }

      if (route === ROUTE_MEMBER_HOME && isAuthenticated) {
        if (selectedLessonIndex === 2) {
          return {
            src: "https://www.youtube.com/embed/LQxx5Z9XEdM?si=z_wasRTMsG5rotVd",
            title: cssVideoTitle,
          };
        }

        if (selectedLessonIndex >= 3 && selectedLessonIndex <= 19) {
          return {
            src: "https://www.youtube.com/embed/nZHrCDJEnw4?si=udrizanujQKqoO8A",
            title: cssVideoTitle,
          };
        }
      }

      return null;
    }

    if (selectedCourse.id === "russian-language") {
      const javascriptVideoTitle = "JavaScript lesson video";

      if (selectedLessonIndex === 0) {
        return {
          src: "https://www.youtube.com/embed/nCgFdChjnds?si=0POU1CGH1u59V9zv",
          title: javascriptVideoTitle,
        };
      }

      if (selectedLessonIndex === 1) {
        return {
          src: "https://www.youtube.com/embed/ZV8fNtV1mOM?si=8191dskbgJVG0iiM",
          title: javascriptVideoTitle,
        };
      }

      if (route === ROUTE_MEMBER_HOME && isAuthenticated) {
        if (selectedLessonIndex === 2) {
          return {
            src: "https://www.youtube.com/embed/kfcl02Nd2YI?si=NIzNWjctXGgZnVsP",
            title: javascriptVideoTitle,
          };
        }

        if (selectedLessonIndex >= 3 && selectedLessonIndex <= 19) {
          return {
            src: "https://www.youtube.com/embed/fayTKZUUm7c?si=owgldzQsyKZ08HMx",
            title: javascriptVideoTitle,
          };
        }
      }

      return null;
    }

    if (selectedCourse.id === "artificial-intelligence") {
      const aiVideoTitle = "Artificial Intelligence lesson video";

      if (selectedLessonIndex === 0) {
        return {
          src: "https://www.youtube.com/embed/3mvbRsOxzGY?si=HWGwUUzEnVijTPZQ",
          title: aiVideoTitle,
        };
      }

      if (selectedLessonIndex === 1) {
        return {
          src: "https://www.youtube.com/embed/xu1XcCbT3fQ?si=Hu86lYcpY9cu6nVW",
          title: aiVideoTitle,
        };
      }

      if (route === ROUTE_MEMBER_HOME && isAuthenticated) {
        if (selectedLessonIndex === 2) {
          return {
            src: "https://www.youtube.com/embed/TxYPwVH6m_E?si=JhzouUJUC9StPqNf",
            title: aiVideoTitle,
          };
        }

        if (selectedLessonIndex >= 3 && selectedLessonIndex <= 19) {
          return {
            src: "https://www.youtube.com/embed/h8EtZPG_BVE?si=0WPglouDJ9-l7Uab",
            title: aiVideoTitle,
          };
        }
      }

      return null;
    }

    if (selectedCourse.id === "web-design") {
      const webDesignVideoTitle = "Web Design lesson video";

      if (selectedLessonIndex === 0) {
        return {
          src: "https://www.youtube.com/embed/kkThgsC1tnk?si=DLO4_BZf74ZK-Djo",
          title: webDesignVideoTitle,
        };
      }

      if (selectedLessonIndex === 1) {
        return {
          src: "https://www.youtube.com/embed/pMTl6hj6Jlk?si=xSWWT4-ooUx3r85F",
          title: webDesignVideoTitle,
        };
      }

      if (route === ROUTE_MEMBER_HOME && isAuthenticated) {
        if (selectedLessonIndex === 2) {
          return {
            src: "https://www.youtube.com/embed/lPsoouVUnYU?si=HlBLzj3OLurZFFYJ",
            title: webDesignVideoTitle,
          };
        }

        if (selectedLessonIndex >= 3 && selectedLessonIndex <= 19) {
          return {
            src: "https://www.youtube.com/embed/untWeLiHo08?si=Cnh-dOXc3rJ5aW6u",
            title: webDesignVideoTitle,
          };
        }
      }

      return null;
    }

    if (selectedCourse.id !== "programming-it") {
      return null;
    }

    const lessonOneId = selectedCourse.lessons[0]?.id;
    const lessonTwoId = selectedCourse.lessons[1]?.id;
    const lessonThreeId = selectedCourse.lessons[2]?.id;

    if (selectedLesson.id === lessonOneId) {
      return {
        src: "https://www.youtube.com/embed/yE4Rlp0OeVc?si=XmInrrMuHbuP-Tha",
        title: "HTML для начинающих. Введение — тег, анатомия тега, поток документа, вложенность, атрибуты",
      };
    }

    if (selectedLesson.id === lessonTwoId) {
      return {
        src: "https://www.youtube.com/embed/-MY61d175_o?si=CxgR_kCAzgDbRpoh",
        title: "HTML для начинающих. Введение — тег, анатомия тега, поток документа, вложенность, атрибуты",
      };
    }

    if (selectedLesson.id === lessonThreeId && route === ROUTE_MEMBER_HOME && isAuthenticated) {
      return {
        src: "https://www.youtube.com/embed/aDGJ3St-jqU?si=i3Uf5tEWyta7ixPA",
        title: "HTML для начинающих. Введение — тег, анатомия тега, поток документа, вложенность, атрибуты",
      };
    }

    if (route === ROUTE_MEMBER_HOME && isAuthenticated && selectedLessonIndex >= 3 && selectedLessonIndex <= 19) {
      return {
        src: "https://www.youtube.com/embed/ny-ouhU-cCc?si=aCg6uBq1xIVG7g_O",
        title: "HTML для начинающих. Введение — тег, анатомия тега, поток документа, вложенность, атрибуты",
      };
    }

    return null;
  })();
  const displayLessonVideo = Boolean(lessonVideoConfig);
  const currentLessonVideoId = lessonVideoConfig?.src ? extractYouTubeVideoId(lessonVideoConfig.src) : "";
  const isCurrentLessonCompleted = Boolean(selectedCourse && selectedLesson && isLessonCompleted(selectedCourse.id, selectedLesson.id));
  const isVideoCompletionRequired = Boolean(displayLessonVideo && selectedLesson);
  const isNextLessonLockedByVideo = Boolean(
    isVideoCompletionRequired &&
    activeLessonIndex >= 0 &&
    activeLessonIndex < activeCourseLessons.length - 1 &&
    !isCurrentLessonCompleted
  );
  const nextLessonButtonText = isNextLessonLockedByVideo ? t.nextLessonLocked || t.nextLesson : t.nextLesson;
  const userName = user ? (user.name || user.fullName || t.studentFallback).split(" ")[0] : t.studentFallback;

  const buildProfileForm = (currentUser) => {
    const safeUser = normalizeUserProfile(currentUser) || {};
    const fullName = safeUser.fullName || safeUser.name || "";
    return {
      avatar: safeUser.avatar || "",
      username: safeUser.username || (fullName ? fullName.trim().split(/\s+/)[0] : ""),
      fullName,
      email: safeUser.email || "",
      phone: safeUser.phone || "",
      language: safeUser.language || language,
      theme: safeUser.theme || theme,
    };
  };

  const navigateTo = (nextRoute, nextAuthMode = authMode) => {
    if ([ROUTE_PROFILE_SETTINGS, ROUTE_PROFILE_DATA].includes(nextRoute) && ![ROUTE_PROFILE_SETTINGS, ROUTE_PROFILE_DATA].includes(route)) {
      setLastProfileRoute(route || ROUTE_MEMBER_HOME);
    }
    setRoute(nextRoute);
    setAuthMode(nextAuthMode);
    setIsMobileMenuOpen(false);
  };

  const scrollToPopularCourses = () => {
    if (typeof window === "undefined") return;

    const coursesSection = document.getElementById("courses");
    if (!coursesSection) return;

    const headerOffset = window.innerWidth < 768 ? 84 : 108;
    const top = coursesSection.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    clearStoredAuthTokens();
    setIsProfileOpen(false);
    setSelectedCourseId(null);
    setSelectedLessonId(null);
    setPendingAccessCourseId(null);
    setPendingAccessLessonId(null);
    setShowLessonAccessNotice(false);
    setShowQuiz(false);
    setIsMobileMenuOpen(false);
    navigateTo(ROUTE_AUTH, "login");
  };

  const handleBackFromProfile = () => {
    if (lastProfileRoute && lastProfileRoute !== ROUTE_PROFILE_SETTINGS && lastProfileRoute !== ROUTE_PROFILE_DATA) {
      navigateTo(lastProfileRoute);
      return;
    }
    navigateTo(ROUTE_MEMBER_HOME);
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setProfileSaveMessage("");
    setProfileSaveError("");

    let nextPasswordHash = user?.passwordHash || "";
    if (!isPasswordHash(nextPasswordHash) && user?.password) {
      try {
        nextPasswordHash = await hashPassword(user.password);
      } catch {
        setProfileSaveError(t.passwordHashingError || "Secure password update is unavailable right now. Please try again.");
        return;
      }
    }

    const normalizedUser = normalizeUserProfile({
      ...user,
      name: profileForm.fullName.trim() || user?.name || "",
      fullName: profileForm.fullName.trim() || user?.fullName || user?.name || "",
      username: profileForm.username.trim() || (profileForm.fullName.trim() ? profileForm.fullName.trim().split(/\s+/)[0] : user?.username || ""),
      email: profileForm.email.trim().toLowerCase(),
      passwordHash: nextPasswordHash,
      password: "",
      phone: profileForm.phone.trim(),
      avatar: profileForm.avatar,
      language: profileForm.language,
      theme: profileForm.theme,
      registrationDate: user?.registrationDate || new Date().toISOString(),
    });

    if (!normalizedUser) return;

    setUser(normalizedUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
    setLanguage(profileForm.language);
    setTheme(profileForm.theme);
    setProfileSaveMessage(t.profileSavedMessage || "Changes saved successfully.");
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    if (passwordUpdating) return;

    setPasswordUpdateMessage("");
    setPasswordUpdateError("");

    if (!user || !isAuthenticated) {
      setPasswordUpdateError(t.reviewSignInRequired || "Please sign in to continue.");
      return;
    }

    const currentPassword = passwordForm.current.trim();
    const nextPassword = passwordForm.next.trim();
    const confirmPassword = passwordForm.confirm.trim();

    if (!currentPassword || !nextPassword || !confirmPassword) {
      setPasswordUpdateError(t.passwordChangeFillRequired || "Please fill in all password fields.");
      return;
    }

    if (nextPassword.length < 8) {
      setPasswordUpdateError(t.passwordTooShort || "Password must be at least 8 characters long.");
      return;
    }

    if (nextPassword !== confirmPassword) {
      setPasswordUpdateError(t.passwordChangeMismatch || t.passwordsMismatch || "Passwords do not match.");
      return;
    }

    if (currentPassword === nextPassword) {
      setPasswordUpdateError(t.passwordChangeSameAsCurrent || "New password must be different from the current password.");
      return;
    }

    setPasswordUpdating(true);
    try {
      const currentPasswordIsValid = await isPasswordValidForUser(currentPassword, user);
      if (!currentPasswordIsValid) {
        setPasswordUpdateError(t.passwordChangeCurrentInvalid || "Current password is incorrect.");
        return;
      }

      const newPasswordHash = await hashPassword(nextPassword);
      const updatedUser = normalizeUserProfile({
        ...user,
        passwordHash: newPasswordHash,
        password: "",
      });

      if (!updatedUser) {
        setPasswordUpdateError(t.passwordChangeUnknownError || "Unable to update password right now.");
        return;
      }

      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setPasswordForm({ current: "", next: "", confirm: "" });
      setPasswordUpdateMessage(t.passwordChangeSuccess || "Password changed successfully.");
    } catch {
      setPasswordUpdateError(t.passwordHashingError || "Secure password update is unavailable right now. Please try again.");
    } finally {
      setPasswordUpdating(false);
    }
  };

  const syncSelectionToUrl = (courseId, lessonId) => {
    try {
      const url = new URL(window.location.href);
      if (courseId) {
        url.searchParams.set("course", courseId);
      } else {
        url.searchParams.delete("course");
      }

      if (lessonId) {
        url.searchParams.set("lesson", lessonId);
      } else {
        url.searchParams.delete("lesson");
      }

      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {
      // Ignore URL update errors in unsupported environments.
    }
  };

  const closeCourseLessons = () => {
    setSelectedCourseId(null);
    setSelectedLessonId(null);
    setShowLessonAccessNotice(false);
    setPendingAccessCourseId(null);
    setPendingAccessLessonId(null);
    setLessonCompletionNotice("");
    setLessonPlaybackError("");
    syncSelectionToUrl(null, null);
  };

  const openLesson = (course) => {
    const safeCourse = course || courseCatalog[0];
    setLessonCompletionNotice("");
    setLessonPlaybackError("");
    setSelectedCourseId(safeCourse.id);
    setSelectedLessonId(null);
    setShowLessonAccessNotice(false);
    setSlideIndex(0);
    syncSelectionToUrl(safeCourse.id, null);
  };

  const getLessonIndex = (course, lesson) => {
    if (!course || !lesson || !Array.isArray(course.lessons)) return -1;
    return course.lessons.findIndex((courseLesson) => courseLesson && courseLesson.id === lesson.id);
  };

  const isRestrictedLessonForGuest = (course, lesson) => {
    if (isAuthenticated) return false;
    const lessonIndex = getLessonIndex(course, lesson);
    return lessonIndex >= 1 && lessonIndex <= 19;
  };

  const isLessonLockedByProgress = (course, lesson) => {
    const lessonIndex = getLessonIndex(course, lesson);
    if (lessonIndex <= 0) return false;
    const previousLesson = course?.lessons?.[lessonIndex - 1];
    if (!previousLesson) return false;
    return !isLessonCompleted(course.id, previousLesson.id);
  };

  const markLessonAsCompleted = (courseId, lessonId) => {
    if (!courseId || !lessonId) return;
    setLessonProgress((previous) => {
      const currentByUser = previous?.[progressUserKey] || {};
      const currentByCourse = currentByUser?.[courseId] || {};
      if (currentByCourse[lessonId]) return previous;
      return {
        ...previous,
        [progressUserKey]: {
          ...currentByUser,
          [courseId]: {
            ...currentByCourse,
            [lessonId]: true,
          },
        },
      };
    });
  };

  const showRestrictedLessonNotice = (course, lesson = null) => {
    setSelectedCourseId(course.id);
    setSelectedLessonId(null);
    setPendingAccessCourseId(course.id);
    setPendingAccessLessonId(lesson?.id || null);
    setSlideIndex(0);
    setShowLessonAccessNotice(true);
    syncSelectionToUrl(course.id, lesson?.id || null);
  };

  const openLessonCard = (course, lesson) => {
    if (isRestrictedLessonForGuest(course, lesson)) {
      showRestrictedLessonNotice(course, lesson);
      return;
    }

    if (isLessonLockedByProgress(course, lesson)) {
      setLessonCompletionNotice(LESSON_VIDEO_LOCK_NOTICE);
      setSelectedCourseId(course.id);
      setSelectedLessonId(null);
      return;
    }

    setLessonCompletionNotice("");
    setLessonPlaybackError("");
    setSelectedCourseId(course.id);
    setSelectedLessonId(lesson.id);
    setShowLessonAccessNotice(false);
    setSlideIndex(0);
    syncSelectionToUrl(course.id, lesson.id);
  };

  useEffect(() => {
    if (youtubeProgressIntervalRef.current) {
      window.clearInterval(youtubeProgressIntervalRef.current);
      youtubeProgressIntervalRef.current = null;
    }

    if (!displayLessonVideo || !selectedCourse || !selectedLesson) {
      return undefined;
    }

    if (!currentLessonVideoId) {
      setLessonPlaybackError("Видео жүктөлгөн жок. Кийинчерээк кайра аракет кылыңыз.");
      return undefined;
    }

    let isCancelled = false;

    const setupYoutubePlayer = async () => {
      try {
        setLessonPlaybackError("");
        youtubePlaybackStateRef.current = { lastTime: 0, watchedSeconds: 0, duration: 0 };
        const YT = await loadYouTubeIframeApi();
        if (isCancelled || !lessonVideoPlayerRef.current) return;

        if (youtubePlayerRef.current && typeof youtubePlayerRef.current.destroy === "function") {
          youtubePlayerRef.current.destroy();
          youtubePlayerRef.current = null;
        }

        youtubePlayerRef.current = new YT.Player(lessonVideoPlayerRef.current, {
          videoId: currentLessonVideoId,
          playerVars: {
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
          },
          events: {
            onReady: (event) => {
              youtubePlaybackStateRef.current.duration = Number(event.target.getDuration?.() || 0);
              youtubePlaybackStateRef.current.lastTime = Number(event.target.getCurrentTime?.() || 0);
              youtubeProgressIntervalRef.current = window.setInterval(() => {
                if (!youtubePlayerRef.current || !youtubePlayerRef.current.getPlayerState) return;
                const state = youtubePlayerRef.current.getPlayerState();
                if (state !== 1) return;
                const currentTime = Number(youtubePlayerRef.current.getCurrentTime?.() || 0);
                const duration = Number(youtubePlayerRef.current.getDuration?.() || 0);
                const playbackRate = Number(youtubePlayerRef.current.getPlaybackRate?.() || 1);
                const previousTime = youtubePlaybackStateRef.current.lastTime;
                const delta = currentTime - previousTime;
                const allowedDelta = Math.max(1.35, (Number.isFinite(playbackRate) ? playbackRate : 1) * 1.5);

                if (duration > 0) {
                  youtubePlaybackStateRef.current.duration = duration;
                }
                if (delta > 0 && delta <= allowedDelta) {
                  youtubePlaybackStateRef.current.watchedSeconds += delta;
                }
                youtubePlaybackStateRef.current.lastTime = currentTime;
              }, 1000);
            },
            onStateChange: (event) => {
              if (!youtubePlayerRef.current) return;
              const currentTime = Number(youtubePlayerRef.current.getCurrentTime?.() || 0);
              if (event.data === 1) {
                youtubePlaybackStateRef.current.lastTime = currentTime;
              }

              if (event.data === 2 || event.data === 3) {
                youtubePlaybackStateRef.current.lastTime = currentTime;
              }

              if (event.data === 0) {
                const duration = Number(youtubePlayerRef.current.getDuration?.() || youtubePlaybackStateRef.current.duration || 0);
                const watchedSeconds = Number(youtubePlaybackStateRef.current.watchedSeconds || 0);
                const completionRatio = duration > 0 ? watchedSeconds / duration : 0;
                if (completionRatio >= 0.9) {
                  markLessonAsCompleted(selectedCourse.id, selectedLesson.id);
                  setLessonCompletionNotice("");
                } else {
                  setLessonCompletionNotice(LESSON_VIDEO_LOCK_NOTICE);
                }
              }
            },
            onError: () => {
              setLessonPlaybackError("Видео убактылуу жеткиликсиз. Кайра аракет кылыңыз.");
            },
          },
        });
      } catch {
        setLessonPlaybackError("Видео ойноткуч жүктөлгөн жок. Интернетти текшериңиз.");
      }
    };

    setupYoutubePlayer();

    return () => {
      isCancelled = true;
      if (youtubeProgressIntervalRef.current) {
        window.clearInterval(youtubeProgressIntervalRef.current);
        youtubeProgressIntervalRef.current = null;
      }
      if (youtubePlayerRef.current && typeof youtubePlayerRef.current.destroy === "function") {
        youtubePlayerRef.current.destroy();
        youtubePlayerRef.current = null;
      }
    };
  }, [currentLessonVideoId, displayLessonVideo, selectedCourse, selectedLesson]);

  const hasAiProAccess = isAuthenticated && Boolean(aiProEnabled || (user && user.aiProActive));

  const detectMessageLanguage = (question, fallbackLanguage) => {
    const text = String(question || "");
    if (/[өӨүҮңНқҚғҒһҺ]/.test(text)) return "ky";
    if (/[А-Яа-яЁё]/.test(text)) return "ru";
    return fallbackLanguage || "en";
  };

  const getFallbackAssistantReply = (question, currentLanguage) => {
    const text = String(question || "").toLowerCase();
    const detectedLanguage = detectMessageLanguage(question, currentLanguage);
    const isRussian = detectedLanguage === "ru";
    const isKyrgyz = detectedLanguage === "ky";

    const isHtmlQuestion = /(html|тег|элемент|header|body|form|markup|разметк|структура страницы|html-документ)/.test(text);
    const isCssQuestion = /(css|style|layout|макет|стиль|grid|flex|mobile|responsive|display|вёрстк|layout)/.test(text);
    const isJavaScriptQuestion = /(javascript|js|function|event|loop|array|code|функц|событ|массив|цикл|переменная|условие)/.test(text);
    const isProgrammingQuestion = /(programming|it|developer|coding|software|программ|кодинг|программист|it|it skills)/.test(text);
    const isWebDevQuestion = /(web development|website|web app|frontend|backend|frontend|веб|сайт|веб-разработка|фронтенд|бэкенд)/.test(text);
    const isMathOrPhysicsQuestion = /(math|матем|algebra|equation|geometry|fraction|physics|физик|скорость|force|velocity|newton|equation|формула|скорость|движение)/.test(text);
    const isEnglishQuestion = /(english|grammar|vocabulary|speaking|word|англ|слово|лексика|грамм|говорение|writing|reading)/.test(text);
    const isLearningQuestion = /(course|lesson|study|learn|plan|план|курс|урок|учить|обуч|learning|strategy|стратегия|учеб)/.test(text);

    if (isHtmlQuestion) {
      if (isRussian) return "HTML задаёт структуру страницы: заголовки, абзацы, кнопки, формы и ссылки. Сначала создайте логичную иерархию, затем добавьте стили и интерактивность на основе этой структуры.";
      if (isKyrgyz) return "HTML веб-баракчанын түзүмүн аныктайт: аталыштар, абзацтар, баскычтар, формалар жана шилтемелер. Алгач логикалык иерархия түзүңүз, андан кийин стиль жана интерактивдүүлүктү кошуңуз.";
      return "HTML creates the structure of a page: headings, paragraphs, buttons, forms, and links. Build a clear hierarchy first, then add styling and interactivity on top of that structure.";
    }

    if (isCssQuestion) {
      if (isRussian) return "CSS отвечает за внешний вид и адаптацию. Сначала определите цвета, шрифты, отступы и сетку, а затем проверьте, как страница выглядит на мобильном экране.";
      if (isKyrgyz) return "CSS беттин көрүнүшүн жана адаптациясын камсыздайт. Алгач түстөрдү, шрифттерди, аралыкты жана сетканы аныктаңыз, андан кийин мобилдик экранында кантип көрүнөрүн текшериңиз.";
      return "CSS controls the appearance and responsiveness of a page. Start with colors, fonts, spacing, and layout, then test how it behaves on mobile screens.";
    }

    if (isJavaScriptQuestion) {
      if (isRussian) return "JavaScript добавляет поведение. Начните с переменных, условий, функций и событий, а затем практикуйте их на небольших примерах: кнопки, формы, фильтры и смена содержимого.";
      if (isKyrgyz) return "JavaScript бетке жүрүм-турум кошот. Өзгөрмөлөр, шарттар, функциялар жана оқиғалар менен баштаңыз, андан кийин кичинекей мисалдарда машыктырыңыз: баскычтар, формалар, фильтрлер жана мазмунду өзгөртүү.";
      return "JavaScript adds behavior. Start with variables, conditions, functions, and events, then practice them in small examples like buttons, forms, filters, and content updates.";
    }

    if (isProgrammingQuestion || isWebDevQuestion) {
      if (isRussian) return "Для программирования и IT важно учить основы последовательно: синтаксис, логика, практика и разбор ошибок. Начните с одного языка или инструмента, затем закрепляйте знания на небольших задачах.";
      if (isKyrgyz) return "Программалоо жана IT үчүн негиздерди ырааттуу үйрөнүү маанилүү: синтаксис, логика, практика жана каталарды талдоо. Бир тил же инструменттен баштаңыз, андан кийин кичинекей тапшырмалар менен бекемдеңиз.";
      return "For programming and IT, it helps to learn fundamentals in order: syntax, logic, practice, and debugging. Start with one language or tool, then reinforce it with small coding tasks.";
    }

    if (isMathOrPhysicsQuestion) {
      if (isRussian) return "В математике и физике сначала выделите формулу или идею, затем решайте простой пример шаг за шагом. Разбор по этапам помогает понять логику и не теряться в деталях.";
      if (isKyrgyz) return "Математикада жана физикада алгач формуланы же түшүнүктү аныктаңыз, андан кийин кадам-кадам жөнөкөй мисалды чечиңиз. Кадам-кадам талдоо логиканы түшүнүүгө жардам берет.";
      return "In mathematics and physics, start by identifying the formula or core idea, then solve a simple example step by step. Breaking the problem into stages makes the logic much easier to follow.";
    }

    if (isEnglishQuestion) {
      if (isRussian) return "Для английского полезно комбинировать чтение, прослушивание и устную практику. Учите 5–10 новых слов в контексте и используйте их в коротких фразах, чтобы запоминание было лучше.";
      if (isKyrgyz) return "Англис тилин үйрөнүүдө окуу, тыңдоо жана сүйлөө практикаларын бириктирүү эң эффективдүү. 5–10 жаңы сөздү контекстте үйрөнүп, кыска сүйлөмдөрдө колдонуу жакшы geheugenди жогорулатат.";
      return "For English, combine reading, listening, and speaking practice. Learn 5–10 new words in context and use them in short sentences to improve retention.";
    }

    if (isLearningQuestion) {
      if (isRussian) return "Лучший путь — изучать один модуль за раз, закреплять примером и проверять себя коротким вопросом. Так информация запоминается быстрее и стабильнее.";
      if (isKyrgyz) return "Эң жакшы ыкма — бир модулду бир убакта үйрөнүү, мисал менен бекемдөө жана кыска суроолор менен текшерүү. Бул маалыматты тез жана туруктуу жаттоого жардам берет.";
      return "A strong learning approach is to study one module at a time, reinforce it with an example, and test yourself with a short question. This keeps the information more stable and easier to remember.";
    }

    if (isRussian) return "Пожалуйста, уточните, о каком именно теме вы хотите узнать: HTML, CSS, JavaScript, программировании, веб-разработке, математике, физике или английском языке?";
    if (isKyrgyz) return "Сураныч, кайсы теманы билгиңиз келет: HTML, CSS, JavaScript, программалоо, веб-иштетүү, математика, физика же англис тили?";
    return "Could you clarify which topic you want to learn about: HTML, CSS, JavaScript, programming, web development, mathematics, physics, or English?";
  };

  const getAiAssistantErrorText = () => {
    if (language === "ru") return "ИИ временно недоступен. Попробуйте позже.";
    if (language === "ky") return "ИИ учурда жеткиликсиз. Kийинчерээк кайра аракет кылыңыз.";
    return "The AI assistant is temporarily unavailable. Please try again later.";
  };

  const getAssistantReply = async (question, previousMessages = []) => {
    const trimmedQuestion = String(question || "").trim();
    if (!trimmedQuestion) {
      return getFallbackAssistantReply("", language);
    }

    const conversationHistory = previousMessages.slice(-6).map((message) => ({
      role: message.role === "user" ? "user" : "assistant",
      content: String(message.text || "").trim(),
    }));

    const response = await fetch("/api/ai-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "GigaChat-2",
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content: "You are the LevelUp AI tutor for an educational platform. Answer only the user’s actual question, stay within educational topics (HTML, CSS, JavaScript, programming, IT, web development, mathematics, physics, English), and respond in the same language as the user. If the question is unclear, ask one brief clarifying question instead of guessing. Keep explanations simple, useful, and directly relevant.",
          },
          ...conversationHistory,
          { role: "user", content: trimmedQuestion },
        ],
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.error) {
      throw new Error(payload?.error || "assistant_api_error");
    }

    const assistantMessage = payload.answer || payload.output_text || payload.choices?.[0]?.message?.content;
    if (typeof assistantMessage !== "string" || assistantMessage.trim().length === 0) {
      throw new Error("assistant_response_empty");
    }

    return assistantMessage.trim();
  };

  const handleAiProActivation = () => {
    if (!isAuthenticated) {
      navigateTo(ROUTE_AUTH, "register");
      return;
    }

    const nextUser = {
      ...user,
      aiProActive: true,
    };

    setUser(nextUser);
    setAiProEnabled(true);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    setIsAiAssistantOpen(true);
    setIsAiAssistantMinimized(false);
    setAiAssistantError("");
    setChatMessages([{ role: "bot", text: locale.content.chat.welcome }]);
    setShowAiPaymentModal(false);
  };

  const handleAiProPurchase = () => {
    if (!isAuthenticated) {
      navigateTo(ROUTE_AUTH, "register");
      return;
    }

    setShowAiPaymentModal(true);
  };

  const handleAssistantSubmit = async (question) => {
    const trimmed = String(question || "").trim();
    if (!trimmed || aiAssistantLoading) {
      return;
    }

    const nextMessages = [...chatMessages, { role: "user", text: trimmed }];
    setChatMessages(nextMessages);
    setChatInput("");
    setAiAssistantError("");
    setAiAssistantLoading(true);

    try {
      const reply = await getAssistantReply(trimmed, nextMessages);
      setChatMessages([...nextMessages, { role: "bot", text: reply }]);
      setAiAssistantError("");
    } catch {
      setAiAssistantError(getAiAssistantErrorText());
      setChatMessages((previous) => [...previous, { role: "bot", text: getFallbackAssistantReply(trimmed, language) }]);
    } finally {
      setAiAssistantLoading(false);
    }
  };

  const handleChatSubmit = () => {
    const trimmedMessage = String(chatInput || "").trim();
    if (!trimmedMessage || aiAssistantLoading) {
      return;
    }
    handleAssistantSubmit(trimmedMessage);
  };

  const handleAssistantKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleChatSubmit();
      return;
    }

    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      const textarea = event.target;
      const cursorPosition = textarea.selectionStart;
      const nextValue = `${chatInput.slice(0, cursorPosition)}\n${chatInput.slice(cursorPosition)}`;
      setChatInput(nextValue);
      requestAnimationFrame(() => {
        textarea.selectionStart = cursorPosition + 1;
        textarea.selectionEnd = cursorPosition + 1;
      });
    }
  };

  const handleAssistantInputChange = (event) => {
    const nextValue = event.target.value;
    setChatInput(nextValue);
    const textarea = event.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    const nextLocale = locales[newLanguage] || locales[DEFAULT_LANGUAGE];
    setChatMessages([{ role: "bot", text: nextLocale.content.chat.welcome }]);
    setChatInput("");
  };

  const handleReviewSubmit = (event) => {
    event.preventDefault();

    if (!user || !isAuthenticated) {
      setReviewError(t.reviewSignInRequired || "Please sign in to leave a review.");
      return;
    }

    const cleanText = reviewText.trim();
    if (!cleanText || cleanText.length < 8) {
      setReviewError(t.reviewValidationError);
      return;
    }

    const normalizedText = cleanText.replace(/\s+/g, " ");
    const duplicateExists = websiteReviews.some(
      (item) =>
        item &&
        item.text &&
        item.name === (user.name || user.fullName || t.studentFallback) &&
        item.text.trim().toLowerCase() === normalizedText.toLowerCase()
    );

    if (duplicateExists) {
      setReviewError(t.reviewDuplicate || "You have already submitted this review.");
      return;
    }

    const newReview = {
      id: `review-${Date.now()}`,
      name: user?.name || user?.fullName || t.studentFallback,
      text: normalizedText,
      rating: reviewRating,
      createdAt: new Date().toISOString(),
      userEmail: user?.email || "",
    };

    setWebsiteReviews((previous) => [newReview, ...previous]);
    setReviewText("");
    setReviewRating(5);
    setReviewError("");
  };

  const renderFooter = () => (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <a href="#/home" className="brand footer-brand" aria-label={t.brandHomeAria} onClick={() => navigateTo(ROUTE_PUBLIC_HOME)}>
            <span className="brand-mark">
              <img src={siteLogo} alt={t.siteLogoAlt} className="brand-logo" />
            </span>
            <span className="brand-copy">
              <strong>{t.brand}</strong>
              <small>{t.slogan}</small>
            </span>
          </a>
          <p className="footer-copy">{t.footerCopy}</p>
        </div>
        <div>
          <h4>{t.platform}</h4>
          <ul>
            <li><a href="#courses">{t.courses}</a></li>
            <li><a href="#learning">{t.learning}</a></li>
            <li><a href="#dashboard">{t.dashboard}</a></li>
          </ul>
        </div>
        <div>
          <h4>{t.company}</h4>
          <ul>
            <li><a href="#pricing">{t.pricing}</a></li>
            <li><a href="#faq">{t.faq}</a></li>
          </ul>
        </div>
        <div>
          <h4>{t.followUs}</h4>
          <div className="social-links">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label={t.socialInstagram}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5zm5.75-3.25a1.25 1.25 0 1 1-1.25 1.25 1.25 1.25 0 0 1 1.25-1.25z" /></svg>
            </a>
            <a href="https://telegram.org" target="_blank" rel="noopener noreferrer" aria-label={t.socialTelegram}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.5 4.1 2.8 11.2c-1.2.5-1.2 1.1-.2 1.4l4.5 1.5 1.7 5.4c.2.6.9.8 1.3.4l2.4-2.3 4.7 3.5c.9.6 1.6.3 1.8-.8l2.8-13.3c.3-1.3-.4-1.8-1.5-1.4zM18.2 6.5 9.1 13.3l-.7 4.8-2-6.4 11.8-5.2z" /></svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label={t.socialFacebook}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 22v-8h2.7l.4-3.1h-3.1V7.6c0-.9.3-1.5 1.6-1.5h1.7V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.4v2.4H7v3.1h3.1v8h3.4z" /></svg>
            </a>
            <a href="https://wa.me/996555123456" target="_blank" rel="noopener noreferrer" aria-label={t.socialWhatsApp}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.7 15.2L2 22l5-1.4A10 10 0 1 0 12 2zm0 1.8A8.2 8.2 0 0 1 18.8 16l-.7 2.2-2.6-.8a7.1 7.1 0 0 1-4.4 1.5 8.2 8.2 0 0 1-8.2-8.2 8.2 8.2 0 0 1 8.1-8.1zm-2.6 4.1c-.2 0-.5.1-.7.3-.2.2-.8.8-.8 2s.9 2.3 1 2.5.3.5.1.9c-.2.4-.8 1.4-1 1.7-.3.3-.6.3-1 .2-.4-.1-1.7-.6-3.1-2a11.7 11.7 0 0 1-2.3-2.8c-.5-.8-.6-1.5-.1-1.9.2-.2.4-.3.6-.4.2-.1.4-.1.6 0 .2 0 .3.1.5.3.2.2.7.8.9 1 .2.2.1.4 0 .6-.1.2-.3.4-.4.6-.2.2-.2.4-.1.6.1.2.3.4.6.7.5.5 1 .8 1.3 1.1.4.3.8.3 1.1.1.3-.2.9-.9 1.1-1.2.2-.2.4-.1.7-.1s.9.4 1.1.6c.2.2.4.5.3.9-.1.4-1.1 2-1.6 2.7-.4.6-.8.7-1.3.7a4.4 4.4 0 0 1-2.1-.9 11.8 11.8 0 0 1-3.2-3.5c-.4-.7-.4-1.5.1-2.3.1-.2.3-.4.5-.8z" /></svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label={t.socialLinkedIn}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.9 8.4A1.7 1.7 0 1 1 6.9 5a1.7 1.7 0 0 1 0 3.4zM5.3 9.7h3.2v9.3H5.3V9.7zm5.2 0h3.1v1.3h.1c.4-.8 1.5-1.7 3.1-1.7 3.3 0 3.9 2.2 3.9 5v6.7h-3.2v-6.1c0-1.5 0-3.4-2.1-3.4s-2.4 1.6-2.4 3.3v6.2H10.5V9.7z" /></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );

  const renderCodingBackground = () => (
    <div className="coding-bg" aria-hidden="true">
      <div className="coding-bg__halo coding-bg__halo--one" />
      <div className="coding-bg__halo coding-bg__halo--two" />
      <div className="coding-bg__halo coding-bg__halo--three" />
      <div className="coding-bg__tokens">
        {backgroundTokens.map((token) => (
          <span
            key={token.id}
            className="coding-bg__token"
            style={{
              "--token-left": `${token.left}%`,
              "--token-top": `${token.top}%`,
              "--token-size": token.size,
              "--token-drift-x": `${token.driftX}px`,
              "--token-drift-y": `${token.driftY}px`,
              "--token-duration": `${token.duration}s`,
              "--token-delay": `${token.delay}s`,
              "--token-rotate-start": `${token.rotateStart}deg`,
              "--token-rotate-mid": `${token.rotateMid}deg`,
              "--token-alpha": token.alpha,
              "--token-hue": token.hue,
              "--token-blur": `${token.blur}px`,
              "--token-layer-depth": token.layerDepth,
            }}
          >
            <span className="coding-bg__token-text">{token.value}</span>
          </span>
        ))}
      </div>
    </div>
  );

  const renderCommonHeader = ({ navItems, showAuthActions = false, showBackToHome = false }) => {
    const loggedInHeader = showBackToHome || route === ROUTE_MEMBER_HOME;
    const navLinkItems = navItems.filter((item) => item && item.href && item.label && item.label !== t.home && item.label !== t.logout && item.label !== t.exit);
    const visibleNavItems = navLinkItems;
    const logoutMenuLabel = t.exit || t.logout;
    const adminMenuLabel = "Admin Panel";

    return (
      <header className={`site-header ${route === ROUTE_MEMBER_HOME ? "dashboard-header" : ""} ${loggedInHeader ? "logged-in-header" : ""}`.trim()}>
        <div className="container nav-wrap">
          <a
            href={route === ROUTE_MEMBER_HOME ? "#/member-home" : "#/home"}
            className="brand"
            aria-label={t.brandHomeAria}
            onClick={() => navigateTo(route === ROUTE_MEMBER_HOME ? ROUTE_MEMBER_HOME : ROUTE_PUBLIC_HOME)}
          >
            <span className="brand-mark">
              <img src={siteLogo} alt={t.siteLogoAlt} className="brand-logo" />
            </span>
            <span className="brand-copy">
              <strong>{t.brand}</strong>
              <small>{t.slogan}</small>
            </span>
          </a>

          <div
            className={`mobile-nav-overlay ${isMobileMenuOpen ? "open" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden={!isMobileMenuOpen}
          />

          <nav className={`primary-nav ${isMobileMenuOpen ? "open" : ""}`} aria-label={t.mainNavigationLabel}>
            {visibleNavItems.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                {item.label}
              </a>
            ))}

            {isCurrentUserAdmin ? (
              <button
                type="button"
                className="profile-menu-item admin-link"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateTo(ROUTE_ADMIN);
                }}
              >
                <span aria-hidden="true">🛡️</span>
                {adminMenuLabel}
              </button>
            ) : null}

            {loggedInHeader ? (
              <button
                type="button"
                className="profile-menu-item danger"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                {logoutMenuLabel}
              </button>
            ) : null}

            <div className="mobile-menu-controls">
              <button
                type="button"
                className="theme-toggle"
                aria-label={theme === "dark" ? t.dayMode : t.nightMode}
                onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>

              <label className="lang-picker mobile-lang" aria-label={t.languageLabel}>
                <select value={language} onChange={(event) => handleLanguageChange(event.target.value)} className="language-select">
                  {languageOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </nav>

          <div className="header-actions">
            <div className="desktop-header-controls">
              <button
                type="button"
                className="theme-toggle"
                aria-label={theme === "dark" ? t.dayMode : t.nightMode}
                onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>

              <label className="lang-picker" aria-label={t.languageLabel}>
                <select value={language} onChange={(event) => handleLanguageChange(event.target.value)} className="language-select">
                  {languageOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {isCurrentUserAdmin ? (
                <button type="button" className="secondary-btn admin-link-btn" onClick={() => navigateTo(ROUTE_ADMIN)}>
                  <span aria-hidden="true">🛡️</span>
                  {adminMenuLabel}
                </button>
              ) : null}

              {loggedInHeader ? (
                <button type="button" className="secondary-btn" onClick={() => navigateTo(ROUTE_PUBLIC_HOME)}>
                  {t.home}
                </button>
              ) : showBackToHome ? (
                <button type="button" className="secondary-btn" onClick={() => navigateTo(ROUTE_PUBLIC_HOME)}>
                  {t.home}
                </button>
              ) : null}

              {showAuthActions && !isAuthenticated ? (
                <>
                  <button type="button" className="ghost-btn" onClick={() => navigateTo(ROUTE_AUTH, "login")}>
                    {t.login}
                  </button>
                  <button type="button" className="primary-btn" onClick={() => navigateTo(ROUTE_AUTH, "register")}>
                    {t.register}
                  </button>
                </>
              ) : (
                !loggedInHeader && (
                  <div className="profile-menu-wrap">
                    <button type="button" className="profile-trigger" onClick={() => setIsProfileOpen((prev) => !prev)}>
                      <span className="user-badge">{user?.name?.charAt(0)?.toUpperCase() || "S"}</span>
                      <span className="profile-name">{userName}</span>
                      <span className="caret">▾</span>
                    </button>

                    <div className={`profile-menu ${isProfileOpen ? "open" : ""}`}>
                      <button type="button" className="profile-menu-item" onClick={() => navigateTo(ROUTE_MEMBER_HOME)}>
                        {t.dashboard}
                      </button>
                      <button type="button" className="profile-menu-item" onClick={() => navigateTo(ROUTE_PROFILE_SETTINGS)}>
                        {t.profileSettings}
                      </button>
                      <button type="button" className="profile-menu-item" onClick={() => navigateTo(ROUTE_PROFILE_DATA)}>
                        {t.myInfo}
                      </button>
                      <button type="button" className="profile-menu-item danger" onClick={handleLogout}>
                        {t.logout}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {loggedInHeader ? (
              <div className="profile-menu-wrap profile-inline">
                <button type="button" className="profile-trigger" onClick={() => setIsProfileOpen((prev) => !prev)}>
                  <span className="user-badge">{user?.name?.charAt(0)?.toUpperCase() || "S"}</span>
                  <span className="profile-name">{userName}</span>
                  <span className="caret">▾</span>
                </button>

                <div className={`profile-menu ${isProfileOpen ? "open" : ""}`}>
                  <button type="button" className="profile-menu-item" onClick={() => navigateTo(ROUTE_MEMBER_HOME)}>
                    {t.dashboard}
                  </button>
                  <button type="button" className="profile-menu-item" onClick={() => navigateTo(ROUTE_PROFILE_SETTINGS)}>
                    {t.profileSettings}
                  </button>
                  <button type="button" className="profile-menu-item" onClick={() => navigateTo(ROUTE_PROFILE_DATA)}>
                    {t.myInfo}
                  </button>
                  <button type="button" className="profile-menu-item danger" onClick={handleLogout}>
                    {t.logout}
                  </button>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              className={`nav-toggle ${isMobileMenuOpen ? "open" : ""}`}
              aria-label={isMobileMenuOpen ? t.closeMenu : t.openMenu}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>
    );
  };

  const renderProfileSettingsPage = () => {
    const safeUser = normalizeUserProfile(user) || {};
    const currentAvatar = profileForm.avatar || safeUser.avatar || "";

    return (
      <div className="levelup-app" ref={appRootRef}>
        {renderCodingBackground()}
        {renderCommonHeader({ navItems: [{ href: "#/member-home", label: t.dashboard }], showBackToHome: false })}
        <main className="page-main profile-page-main">
          <div className="container profile-page-shell">
            <button type="button" className="secondary-btn back-button" onClick={handleBackFromProfile}>
              ← {t.back}
            </button>

            <div className="profile-page-card card-surface">
              <div className="profile-page-header">
                <div className="profile-avatar large">
                  {currentAvatar ? <img src={currentAvatar} alt={t.profilePhotoAlt || t.profile} /> : <span>{(safeUser.fullName || safeUser.name || userName || "U").charAt(0).toUpperCase()}</span>}
                </div>
                <div>
                  <span className="eyebrow subtle">{t.profile}</span>
                  <h1>{t.profileSettings}</h1>
                  <p>{t.profileSettingsSubtitle || t.profileSettings}</p>
                </div>
              </div>

              <form className="profile-settings-form" onSubmit={handleProfileSave}>
                <div className="profile-photo-row">
                  <div className="profile-photo-control">
                    <div className="profile-avatar small">
                      {currentAvatar ? <img src={currentAvatar} alt={t.profilePhotoAlt || t.profile} /> : <span>{(safeUser.fullName || safeUser.name || userName || "U").charAt(0).toUpperCase()}</span>}
                    </div>
                    <div>
                      <strong>{t.profilePhotoLabel || t.profile}</strong>
                      <p>{t.profilePhotoHint || t.profileSettings}</p>
                    </div>
                  </div>
                  <label className="secondary-btn profile-photo-upload">
                    <input type="file" accept="image/*" onChange={(event) => {
                      const file = event.target.files && event.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setProfileForm((previous) => ({ ...previous, avatar: String(reader.result) }));
                      };
                      reader.readAsDataURL(file);
                    }} />
                    {t.changePhoto || t.profile}
                  </label>
                </div>

                <div className="profile-form-grid">
                  <label className="profile-field">
                    <span>{t.usernameLabel || t.profile}</span>
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(event) => setProfileForm((previous) => ({ ...previous, username: event.target.value }))}
                    />
                  </label>

                  <label className="profile-field">
                    <span>{t.fullName}</span>
                    <input
                      type="text"
                      value={profileForm.fullName}
                      onChange={(event) => setProfileForm((previous) => ({ ...previous, fullName: event.target.value }))}
                    />
                  </label>

                  <label className="profile-field">
                    <span>{t.emailAddress}</span>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(event) => setProfileForm((previous) => ({ ...previous, email: event.target.value }))}
                    />
                  </label>

                  <label className="profile-field">
                    <span>{t.phoneNumber || t.phone}</span>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(event) => setProfileForm((previous) => ({ ...previous, phone: event.target.value }))}
                    />
                  </label>

                  <label className="profile-field">
                    <span>{t.languageLabel}</span>
                    <select value={profileForm.language} onChange={(event) => setProfileForm((previous) => ({ ...previous, language: event.target.value }))}>
                      {languageOptions.map((option) => (
                        <option key={option.code} value={option.code}>{option.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="profile-field full-width">
                    <span>{t.themeLabel || t.nightMode}</span>
                    <select
                      value={profileForm.theme}
                      onChange={(event) => {
                        const nextTheme = event.target.value;
                        setProfileForm((previous) => ({ ...previous, theme: nextTheme }));
                        setTheme(nextTheme);
                      }}
                    >
                      <option value="light">{t.dayMode}</option>
                      <option value="dark">{t.nightMode}</option>
                    </select>
                  </label>
                </div>

                {profileSaveMessage ? <p className="auth-success">{profileSaveMessage}</p> : null}
                {profileSaveError ? <p className="auth-error">{profileSaveError}</p> : null}

                <div className="profile-page-actions">
                  <button type="submit" className="primary-btn">{t.saveChanges}</button>
                </div>
              </form>

              <form className="profile-settings-form profile-password-form" onSubmit={handlePasswordChange}>
                <h3>{t.changePasswordTitle || "Change password"}</h3>

                <label className="profile-field">
                  <span>{t.currentPasswordLabel || "Current password"}</span>
                  <div className="password-input-wrap">
                    <input
                      type={passwordVisibility.current ? "text" : "password"}
                      value={passwordForm.current}
                      onChange={(event) => setPasswordForm((previous) => ({ ...previous, current: event.target.value }))}
                      placeholder={t.currentPasswordPlaceholder || "Enter current password"}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      className="password-input-toggle"
                      aria-label={passwordVisibility.current ? (t.hidePasswordLabel || "Hide password") : (t.showPasswordLabel || "Show password")}
                      onClick={() => setPasswordVisibility((previous) => ({ ...previous, current: !previous.current }))}
                    >
                      {passwordVisibility.current ? "🙈" : "👁️"}
                    </button>
                  </div>
                </label>

                <label className="profile-field">
                  <span>{t.newPasswordLabel || "New password"}</span>
                  <div className="password-input-wrap">
                    <input
                      type={passwordVisibility.next ? "text" : "password"}
                      value={passwordForm.next}
                      onChange={(event) => setPasswordForm((previous) => ({ ...previous, next: event.target.value }))}
                      placeholder={t.newPasswordPlaceholder || t.enterPassword}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      className="password-input-toggle"
                      aria-label={passwordVisibility.next ? (t.hidePasswordLabel || "Hide password") : (t.showPasswordLabel || "Show password")}
                      onClick={() => setPasswordVisibility((previous) => ({ ...previous, next: !previous.next }))}
                    >
                      {passwordVisibility.next ? "🙈" : "👁️"}
                    </button>
                  </div>
                </label>

                <label className="profile-field">
                  <span>{t.confirmNewPasswordLabel || "Confirm new password"}</span>
                  <div className="password-input-wrap">
                    <input
                      type={passwordVisibility.confirm ? "text" : "password"}
                      value={passwordForm.confirm}
                      onChange={(event) => setPasswordForm((previous) => ({ ...previous, confirm: event.target.value }))}
                      placeholder={t.confirmNewPasswordPlaceholder || t.reEnterPassword}
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      className="password-input-toggle"
                      aria-label={passwordVisibility.confirm ? (t.hidePasswordLabel || "Hide password") : (t.showPasswordLabel || "Show password")}
                      onClick={() => setPasswordVisibility((previous) => ({ ...previous, confirm: !previous.confirm }))}
                    >
                      {passwordVisibility.confirm ? "🙈" : "👁️"}
                    </button>
                  </div>
                </label>

                {passwordUpdateMessage ? <p className="auth-success">{passwordUpdateMessage}</p> : null}
                {passwordUpdateError ? <p className="auth-error">{passwordUpdateError}</p> : null}

                <div className="profile-page-actions">
                  <button type="submit" className="primary-btn" disabled={passwordUpdating}>
                    {passwordUpdating ? (t.loadingLabel || "Loading...") : (t.changePasswordAction || "Update password")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
        {renderFooter()}
      </div>
    );
  };

  const renderProfileDataPage = () => {
    const safeUser = normalizeUserProfile(user) || {};
    const fullName = safeUser.fullName || safeUser.name || "";
    const username = safeUser.username || (fullName ? fullName.trim().split(/\s+/)[0] : "");
    const registeredAt = safeUser.registrationDate ? new Date(safeUser.registrationDate).toLocaleDateString(language) : "—";
    const selectedLanguage = languageOptions.find((option) => option.code === (safeUser.language || language))?.label || (safeUser.language || language);

    return (
      <div className="levelup-app" ref={appRootRef}>
        {renderCodingBackground()}
        {renderCommonHeader({ navItems: [{ href: "#/member-home", label: t.dashboard }], showBackToHome: false })}
        <main className="page-main profile-page-main">
          <div className="container profile-page-shell">
            <button type="button" className="secondary-btn back-button" onClick={handleBackFromProfile}>
              ← {t.back}
            </button>

            <div className="profile-page-card card-surface">
              <div className="profile-page-header">
                <div className="profile-avatar large">
                  {safeUser.avatar ? <img src={safeUser.avatar} alt={t.profilePhotoAlt || t.profile} /> : <span>{(fullName || userName || "U").charAt(0).toUpperCase()}</span>}
                </div>
                <div>
                  <span className="eyebrow subtle">{t.profile}</span>
                  <h1>{t.myInfo}</h1>
                  <p>{t.profileDataSubtitle || t.myInfo}</p>
                </div>
              </div>

              <div className="profile-data-grid">
                <div className="profile-data-card">
                  <h3>{t.accountInformation || t.profile}</h3>
                  <div className="profile-data-row"><span>{t.fullName}</span><strong>{fullName || "—"}</strong></div>
                  <div className="profile-data-row"><span>{t.usernameLabel || t.profile}</span><strong>{username || "—"}</strong></div>
                  <div className="profile-data-row"><span>{t.emailAddress}</span><strong>{safeUser.email || "—"}</strong></div>
                  <div className="profile-data-row"><span>{t.phoneNumber || t.phone}</span><strong>{safeUser.phone || "—"}</strong></div>
                </div>

                <div className="profile-data-card">
                  <h3>{t.accountInfoDetails || t.accountInformation || t.profile}</h3>
                  <div className="profile-data-row"><span>{t.registrationDate || t.accountDetails}</span><strong>{registeredAt}</strong></div>
                  <div className="profile-data-row"><span>{t.selectedLanguage || t.languageLabel}</span><strong>{selectedLanguage}</strong></div>
                  <div className="profile-data-row"><span>{t.currentTheme || t.nightMode}</span><strong>{safeUser.theme === "dark" ? t.nightMode : t.dayMode}</strong></div>
                  <div className="profile-data-row"><span>{t.accountStatus || t.profile}</span><strong>{safeUser.email ? t.activeAccount || "Active" : "—"}</strong></div>
                </div>
              </div>
            </div>
          </div>
        </main>
        {renderFooter()}
      </div>
    );
  };

  const renderAiAssistantSection = () => {
    const isUnlocked = hasAiProAccess;

    return (
      <section className="content-section assistant-section">
        <div className="container">
          <div className="section-head simple">
            <span className="eyebrow subtle">{t.aiPro || "AI Pro"}</span>
            <h2>{t.aiAssistantSectionTitle || "ИИ-помощник"}</h2>
            <p className="section-description">{t.aiAssistantSectionDescription || "Получайте быстрые ответы по учебным темам и курсам."}</p>
          </div>

          {isUnlocked ? (
            <div className="assistant-section-shell card-surface">
              <div className="ai-assistant-header">
                <div className="ai-assistant-brand">
                  <img src={siteLogo} alt={t.siteLogoAlt} className="ai-assistant-brand-logo" />
                  <div>
                    <strong>{t.assistantWindowTitle}</strong>
                    <span>{t.aiPro}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="ai-assistant-icon-btn"
                  onClick={() => setIsAiAssistantMinimized((previous) => !previous)}
                  aria-label={t.assistantMinimize}
                >
                  {t.assistantMinimize}
                </button>
              </div>

              {!isAiAssistantMinimized ? (
                <>
                  <button type="button" className="assistant-quick-actions" onClick={() => setShowReadyQuestions((previous) => !previous)}>
                    {t.assistantReadyQuestions}
                  </button>

                  {showReadyQuestions ? (
                    <div className="assistant-question-list">
                      {getAiAssistantQuestionsByLanguage(language).map((question, index) => (
                        <button
                          key={`${question}-${index}`}
                          type="button"
                          className="assistant-question-item"
                          onClick={() => {
                            setShowReadyQuestions(false);
                            handleAssistantSubmit(question);
                          }}
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <div className="ai-assistant-chat-window" ref={assistantChatScrollRef}>
                    {chatMessages.map((message, index) => (
                      <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
                        {message.text}
                      </div>
                    ))}
                    {aiAssistantLoading ? (
                      <div className="message bot is-typing" aria-live="polite">
                        <span />
                        <span />
                        <span />
                      </div>
                    ) : null}
                    {aiAssistantError ? <p className="ai-assistant-error">{aiAssistantError}</p> : null}
                  </div>

                  <div className="chat-input-row">
                    <textarea
                      ref={assistantInputRef}
                      rows={1}
                      value={chatInput}
                      onChange={handleAssistantInputChange}
                      onKeyDown={handleAssistantKeyDown}
                      placeholder={t.assistantInputPlaceholder}
                      aria-label={t.assistantInputPlaceholder}
                      className="assistant-textarea"
                    />
                    <button type="button" className="primary-btn small assistant-send-btn" onClick={handleChatSubmit} aria-label={t.send}>
                      <span aria-hidden="true">➤</span>
                      <span>{t.send}</span>
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="ai-pro-promo card-surface">
              <div className="ai-pro-promo-copy">
                <span className="eyebrow subtle">AI Pro</span>
                <h3>{t.aiProTitle || "Улучшите обучение с помощью ИИ"}</h3>
                <p>{t.aiProDescription || "Получайте персональные подсказки, ответы на темы курса и поддержку по учебному плану."}</p>
                <ul>
                  {pricingFeatures.aiPro.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
              <button type="button" className="primary-btn" onClick={handleAiProPurchase}>
                {t.getAiPro}
              </button>
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderRatingsSection = ({ allowSubmission = true } = {}) => {
    const totalStars = [5, 4, 3, 2, 1];
    const averageRatingText = ratingSummary.total ? ratingSummary.average.toFixed(1) : "0.0";
    const activeCourseName = ratingCourseOptions.find((item) => item.id === ratingsFilter)?.label || t.allCourses;
    const reviewCourseNameLabel = language === "ru" ? "Курс" : language === "ky" ? "Курс" : "Course";
    const reviewLessonNameLabel = language === "ru" ? "Урок" : language === "ky" ? "Сабак" : "Lesson";
    const reviewSelectionError = language === "ru"
      ? "Пожалуйста, выберите курс и урок для отзыва."
      : language === "ky"
        ? "Сураныч, курс менен сабакты тандаңыз."
        : "Please select both a course and a lesson before submitting your review.";
    const selectedReviewCourse = courseCatalog.find((course) => course.id === reviewCourseId) || courseCatalog[0] || null;
    const selectedReviewLesson = selectedReviewCourse?.lessons?.find((lesson) => lesson.id === reviewLessonId) || selectedReviewCourse?.lessons?.[0] || null;

    const handleRatingsSubmit = (event) => {
      event.preventDefault();
      if (ratingsSubmitting) return;

      if (!user || !isAuthenticated) {
        setRatingsError(t.reviewSignInRequired || "Please sign in to leave a review.");
        return;
      }

      const trimmedText = ratingsText.trim();
      if (!trimmedText || trimmedText.length < 8) {
        setRatingsError(t.reviewValidationError || "Please enter at least 8 characters in your review.");
        return;
      }

      if (!reviewCourseId || reviewCourseId === "all" || !reviewLessonId || !selectedReviewCourse || !selectedReviewLesson) {
        setRatingsError(reviewSelectionError);
        return;
      }

      const normalizedText = trimmedText.replace(/\s+/g, " ");
      const candidateCourse = reviewCourseId;
      const candidateLesson = reviewLessonId;
      const duplicateExists = websiteReviews.some((item) => {
        if (!item || !item.text) return false;
        if (editingReviewId && item.id === editingReviewId) return false;
        const sameUser = (item.userEmail || item.name || "") === (user.email || user.name || "");
        const sameText = item.text.trim().toLowerCase() === normalizedText.toLowerCase();
        const sameCourse = (item.courseId || "all") === candidateCourse;
        const sameLesson = (item.lessonId || "") === candidateLesson;
        return sameUser && sameText && sameCourse && sameLesson;
      });

      if (duplicateExists) {
        setRatingsError(t.reviewDuplicate || "You have already submitted this review.");
        return;
      }

      setRatingsSubmitting(true);
      const nextReview = {
        id: editingReviewId || `rating-review-${Date.now()}`,
        name: user?.name || user?.fullName || t.studentFallback,
        text: normalizedText,
        rating: ratingsValue,
        createdAt: new Date().toISOString(),
        userEmail: user?.email || "",
        userId: user?.email || user?.username || user?.name || "student",
        courseId: candidateCourse,
        courseTitle: selectedReviewCourse.title,
        lessonId: candidateLesson,
        lessonTitle: selectedReviewLesson.title,
      };

      if (editingReviewId) {
        setWebsiteReviews((previous) => previous.map((review) => (review.id === editingReviewId ? { ...review, ...nextReview } : review)));
        setRatingsSuccess(t.reviewUpdated || "Review updated successfully.");
      } else {
        setWebsiteReviews((previous) => [nextReview, ...previous]);
        setRatingsSuccess(t.reviewSubmitted || "Review submitted successfully.");
      }

      setRatingsText("");
      setRatingsValue(5);
      setRatingsCourse("all");
      setReviewCourseId(courseCatalog[0]?.id || "all");
      setReviewLessonId(courseCatalog[0]?.lessons?.[0]?.id || "");
      setEditingReviewId(null);
      setRatingsError("");
      setIsRatingsFormOpen(false);
      setRatingsSubmitting(false);
    };

    return (
      <section id="ratings" className="content-section ratings-page-main">
        <div className="container ratings-page-shell">
            <div className="section-head simple">
              <span className="eyebrow subtle">{t.ratingsLabel || t.reviewsSectionHeading}</span>
              <h2>{t.ratingsTitle || t.reviewsSectionHeading}</h2>
              <p className="section-description">{t.ratingsDescription || t.reviewsSectionDescription}</p>
            </div>

            <div className="ratings-summary-grid">
              <div className="ratings-summary-card card-surface">
                <span className="eyebrow subtle">{t.averageRating || "Average rating"}</span>
                <div className="ratings-average-row">
                  <strong>{averageRatingText}</strong>
                  <span>/ 5</span>
                </div>
                <div className="stars large-stars">{"★".repeat(Math.round(ratingSummary.average || 0))}{"☆".repeat(Math.max(0, 5 - Math.round(ratingSummary.average || 0)))}</div>
              </div>

              <div className="ratings-summary-card card-surface">
                <span className="eyebrow subtle">{t.totalReviews || "Total reviews"}</span>
                <strong className="ratings-metric-value">{ratingSummary.total}</strong>
                <p>{t.ratingsStudents || "Verified student feedback"}</p>
              </div>

              <div className="ratings-summary-card card-surface">
                <span className="eyebrow subtle">{t.course || "Course"}</span>
                <strong className="ratings-metric-value small">{activeCourseName}</strong>
                <p>{t.ratingsFilterHint || "Filter by course"}</p>
              </div>
            </div>

            <div className="ratings-layout">
              <div className="ratings-insights card-surface">
                <div className="ratings-score-header">
                  <span className="eyebrow subtle">{t.ratingDistribution || "Rating distribution"}</span>
                  <strong>{averageRatingText}/5</strong>
                </div>
                {totalStars.map((star) => {
                  const count = ratingSummary.distribution[star] || 0;
                  const percentage = ratingSummary.total ? (count / ratingSummary.total) * 100 : 0;
                  return (
                    <div key={star} className="distribution-row">
                      <span>{star}★</span>
                      <div className="distribution-bar"><span style={{ width: `${percentage}%` }} /></div>
                      <b>{count}</b>
                    </div>
                  );
                })}
              </div>

              <div className="ratings-cta card-surface">
                <h3>{t.leaveReviewHeading}</h3>
                <p>{isAuthenticated ? (t.ratingsStudents || "Verified student feedback") : (t.reviewSignInRequired || "Please sign in to leave a review.")}</p>
                {allowSubmission ? (
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => {
                      setRatingsError("");
                      setRatingsSuccess("");
                      if (!isAuthenticated) {
                        navigateTo(ROUTE_AUTH, "login");
                        return;
                      }
                      setIsRatingsFormOpen(true);
                    }}
                  >
                    {t.leaveReviewHeading}
                  </button>
                ) : null}
                {ratingsSuccess ? <p className="auth-success">{ratingsSuccess}</p> : null}
                {ratingsError ? <p className="auth-error">{ratingsError}</p> : null}
              </div>
            </div>

            <div className="ratings-toolbar card-surface">
              <label className="review-label compact-label">
                {t.sortBy || "Sort by"}
                <select value={ratingsSortBy} onChange={(event) => setRatingsSortBy(event.target.value)} className="rating-select">
                  <option value="newest">{t.sortNewest || "Newest"}</option>
                  <option value="highest">{t.sortHighest || "Highest rating"}</option>
                  <option value="lowest">{t.sortLowest || "Lowest rating"}</option>
                </select>
              </label>

              <label className="review-label compact-label">
                {t.filterReviews || "Filter"}
                <select value={ratingsFilter} onChange={(event) => setRatingsFilter(event.target.value)} className="rating-select">
                  {ratingCourseOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="testimonial-grid review-grid">
              {ratingsLoading ? (
                <div className="empty-state card-surface">
                  <h3>{t.loadingLabel || "Loading..."}</h3>
                </div>
              ) : visibleReviews.length > 0 ? (
                visibleReviews.slice(0, 6).map((review) => {
                  const isOwner = user && ((review.userEmail && user.email && review.userEmail === user.email) || (review.userId && user.email && review.userId === user.email) || (review.userId && user.username && review.userId === user.username));
                  const avatarLetter = (review.name || "S").charAt(0).toUpperCase();
                  return (
                    <article key={review.id} className="testimonial-card card-surface ratings-review-card">
                      <div className="review-card-header">
                        <div className="review-avatar">{avatarLetter}</div>
                        <div className="review-card-meta">
                          <strong>{review.name}</strong>
                          <span>
                            {review.courseTitle || (review.courseId === "all" ? "Platform" : review.courseId)}
                            {review.lessonTitle ? ` • ${review.lessonTitle}` : ""}
                          </span>
                        </div>
                      </div>
                      <div className="stars">{"★".repeat(review.rating || 5)}{"☆".repeat(5 - (review.rating || 5))}</div>
                      <p>“{review.text}”</p>
                      <div className="person-meta review-meta-row">
                        <span>{new Date(review.createdAt || Date.now()).toLocaleDateString(language)}</span>
                        {isOwner ? (
                          <div className="review-actions">
                            <button
                              type="button"
                              className="text-btn"
                              onClick={() => {
                                const reviewCourse = review.courseId && review.courseId !== "all"
                                  ? review.courseId
                                  : (courseCatalog[0]?.id || "all");
                                const reviewLesson = review.lessonId || (courseCatalog.find((course) => course.id === reviewCourse)?.lessons?.[0]?.id || "");
                                setEditingReviewId(review.id);
                                setRatingsValue(Number(review.rating) || 5);
                                setRatingsText(review.text || "");
                                setRatingsCourse(review.courseId || "all");
                                setReviewCourseId(reviewCourse);
                                setReviewLessonId(reviewLesson);
                                setRatingsError("");
                                setRatingsSuccess("");
                                setIsRatingsFormOpen(true);
                              }}
                            >
                              {t.editReview || "Edit"}
                            </button>
                            <button
                              type="button"
                              className="text-btn danger-text-btn"
                              onClick={() => {
                                setWebsiteReviews((previous) => previous.filter((item) => item.id !== review.id));
                                if (editingReviewId === review.id) {
                                  setEditingReviewId(null);
                                  setRatingsText("");
                                  setRatingsValue(5);
                                  setRatingsCourse("all");
                                }
                                setRatingsSuccess(t.reviewDeleteSuccess || "Review deleted.");
                              }}
                            >
                              {t.deleteReview || "Delete"}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="empty-state card-surface">
                  <h3>{t.reviewEmptyState}</h3>
                </div>
              )}
            </div>
        </div>

        {isRatingsFormOpen ? (
          <div className="modal-backdrop" onClick={() => setIsRatingsFormOpen(false)}>
            <div className="ratings-form-modal review-form card-surface" onClick={(event) => event.stopPropagation()}>
              <form onSubmit={handleRatingsSubmit}>
                <h3>{editingReviewId ? t.editReview || "Edit review" : t.leaveReviewHeading}</h3>

                <div className="review-selection-grid">
                  <label className="review-label">
                    {reviewCourseNameLabel}
                    <select value={reviewCourseId} onChange={(event) => setReviewCourseId(event.target.value)} className="rating-select review-select">
                      {courseCatalog.map((course) => (
                        <option key={course.id} value={course.id}>{course.title}</option>
                      ))}
                    </select>
                  </label>

                  <label className="review-label">
                    {reviewLessonNameLabel}
                    <select
                      value={reviewLessonId}
                      onChange={(event) => setReviewLessonId(event.target.value)}
                      className="rating-select review-select"
                      disabled={!selectedReviewCourse || !selectedReviewCourse.lessons || selectedReviewCourse.lessons.length === 0}
                    >
                      {selectedReviewCourse && selectedReviewCourse.lessons && selectedReviewCourse.lessons.length > 0 ? (
                        selectedReviewCourse.lessons.map((lesson) => (
                          <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                        ))
                      ) : (
                        <option value="">{language === "ru" ? "Нет уроков" : language === "ky" ? "Сабактар жок" : "No lessons"}</option>
                      )}
                    </select>
                  </label>
                </div>

                <label className="review-label">
                  {t.ratingLabel}
                  <div className="rating-stars" role="radiogroup" aria-label={t.ratingLabel}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={ratingsValue >= star ? "star-btn active" : "star-btn"}
                        aria-label={`${star}`}
                        onClick={() => setRatingsValue(star)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </label>

                <label className="review-label">
                  {t.reviewTextLabel}
                  <textarea
                    value={ratingsText}
                    onChange={(event) => setRatingsText(event.target.value)}
                    placeholder={t.reviewPlaceholder}
                    rows={5}
                  />
                </label>

                {ratingsError ? <p className="auth-error">{ratingsError}</p> : null}
                {ratingsSuccess ? <p className="auth-success">{ratingsSuccess}</p> : null}

                <div className="ratings-form-actions">
                  <button type="submit" className="primary-btn" disabled={ratingsSubmitting}>
                    {ratingsSubmitting ? (t.loadingLabel || "Loading...") : (editingReviewId ? t.saveChanges : t.submitReview)}
                  </button>
                  <button type="button" className="secondary-btn" onClick={() => setIsRatingsFormOpen(false)}>
                    {t.cancelEdit || "Cancel"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </section>
    );
  };

  const renderPublicHome = () => {
    const navItems = [
      { href: "#home", label: t.home },
      { href: "#courses", label: t.courses },
      { href: "#learning", label: t.learning },
      { href: "#pricing", label: t.pricing },
      { href: "#faq", label: t.faq },
    ];

    return (
      <>
        {renderCommonHeader({ navItems, showAuthActions: true })}
        <main id="home" className="page-main">
          <section className="hero-section">
            <div className="container hero-grid">
              <div className="hero-copy">
                <span className="eyebrow">{t.academy}</span>
                <h1>{t.heroTitle}</h1>
                <p>{t.heroText}</p>
                <div className="hero-actions">
                  <button type="button" className="primary-btn" onClick={() => navigateTo(ROUTE_AUTH, "register")}>
                    {t.start}
                  </button>
                  <button type="button" className="secondary-btn" onClick={scrollToPopularCourses}>
                    {t.explore}
                  </button>
                </div>
              </div>

              <div className="hero-panel">
                <FeaturedPathCard
                  className="top-card"
                  badge={t.featuredPath}
                  title={t.digitalSkillsGrowth}
                  topics={t.courseworkTopics}
                />

                <div className="study-visual">
                  <div className="visual-ring">
                    <div className="ring-content">
                      <strong>83%</strong>
                      <span>{t.lessonProgress}</span>
                    </div>
                  </div>
                </div>

                <div className="mini-card lower-card">
                  <div>
                    <small>{t.currentTopic}</small>
                    <strong>{t.courseProgress}</strong>
                  </div>
                  <button type="button" className="chip-btn" onClick={() => setShowQuiz(true)}>
                    {t.quiz}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="search-strip">
            <div className="container search-wrap">
              <label className="search-area" htmlFor="course-search">
                <span aria-hidden="true">⌕</span>
                <input
                  id="course-search"
                  type="search"
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </label>
              <button type="button" className="primary-btn compact" onClick={() => setFilter("all")}>
                {t.plan}
              </button>
            </div>
          </section>

          <section id="courses" className="content-section courses-section">
            <div className="container">
              <div className="section-head">
                <div>
                  <span className="eyebrow subtle">{t.popular}</span>
                  <h2>{t.chooseCourse}</h2>
                </div>
                <div className="filter-bar" aria-label={t.courseFiltersAria}>
                  {categoryFilters.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={activeFilter === option.id ? "filter-btn active" : "filter-btn"}
                      onClick={() => setFilter(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="course-grid">
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course) => (
                    <article key={course.id} className="course-card card-surface">
                      <div className={`course-icon ${course.accent}`}>{course.icon}</div>
                      <div className="course-body">
                        <div className="course-meta">
                          <span>{course.category}</span>
                          <span>{course.level}</span>
                        </div>
                        <h3>{course.title}</h3>
                        <p>{course.description}</p>
                        <div className="course-foot">
                          <span>
                            {Array.isArray(course.lessons) ? course.lessons.length : 0} {t.lessons}
                          </span>
                          <button type="button" className="small-btn" onClick={() => openLesson(course)}>
                            {t.startCourse}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state card-surface">
                    <h3>{t.noCourses}</h3>
                    <p>{t.noCoursesHint}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {renderAiAssistantSection()}

          {renderRatingsSection({ allowSubmission: false })}

          <section id="learning" className="content-section learning-section">
            <div className="container learning-layout">
              <div className="learning-copy">
                <span className="eyebrow subtle">{t.interactiveLesson}</span>
                <h2>{t.studyStepByStep}</h2>
                <p>{t.learningSectionText}</p>
                <div className="path-list">
                  {learningPaths.map((item, index) => (
                    <div key={item.title} className="path-item">
                      <span className="path-number">0{index + 1}</span>
                      <div>
                        <small>{item.badge}</small>
                        <strong>{item.title}</strong>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lesson-preview card-surface">
                <div className="lesson-preview-head">
                  <span className="lesson-tag">{t.lessonCourse}</span>
                  <span className="lesson-score">72% {t.completion}</span>
                </div>
                <h3>{currentLesson.title}</h3>
                <p>{currentLesson.text}</p>
                <div className="code-block">
                  <pre>{currentLesson.code}</pre>
                </div>
                <div className="concept-box">
                  <strong>{t.keyConcept}</strong>
                  <p>{currentLesson.keyPoint}</p>
                </div>
                <div className="lesson-actions">
                  <button type="button" className="secondary-btn small" onClick={() => setSlideIndex((current) => Math.max(0, current - 1))}>
                    {t.previous}
                  </button>
                  <button type="button" className="primary-btn small" onClick={() => setSlideIndex((current) => (current + 1) % lessonSlides.length)}>
                    {t.next}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="content-section benefits-section">
            <div className="container">
              <div className="section-head simple">
                <span className="eyebrow subtle">{t.benefits}</span>
                <h2>{t.builtForLearning}</h2>
              </div>
              <div className="benefit-grid">
                {benefits.map((benefit, index) => (
                  <div key={benefit} className="benefit-card card-surface">
                    <span className="benefit-number">0{index + 1}</span>
                    <p>{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="content-section testimonials-section">
            <div className="container">
              <div className="section-head simple">
                <span className="eyebrow subtle">{t.testimonials}</span>
                <h2>{t.whatStudentsSay}</h2>
              </div>
              <div className="testimonial-grid">
                {renderedReviews.length > 0 ? (
                  renderedReviews.map((review) => (
                    <article key={review.id} className="testimonial-card card-surface">
                      <div className="stars">{"★".repeat(review.rating || 5)}{"☆".repeat(5 - (review.rating || 5))}</div>
                      <p>“{review.quote}”</p>
                      <div className="person-meta">
                        <strong>{review.name}</strong>
                        <span>{review.role}</span>
                        {review.createdAt ? <span>{new Date(review.createdAt).toLocaleDateString(language)}</span> : null}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state card-surface">
                    <h3>{t.reviewEmptyState}</h3>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section id="pricing" className="content-section pricing-section">
            <div className="container">
              <div className="section-head simple">
                <span className="eyebrow subtle">{t.pricing}</span>
                <h2>{t.pricingTitle}</h2>
              </div>
              <div className="pricing-grid pricing-grid--single">
                <article className="pricing-card pricing-card--single card-surface">
                  <span className="plan-label">{t.aiPro}</span>
                  <h3>$29<span>{t.monthlySuffix}</span></h3>
                  <ul>
                    {pricingFeatures.aiPro.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <button type="button" className="secondary-btn full" onClick={handleAiProPurchase}>{t.getAiPro}</button>
                </article>
              </div>
            </div>
          </section>

          <section id="faq" className="content-section faq-section">
            <div className="container">
              <div className="section-head simple">
                <span className="eyebrow subtle">{t.questions}</span>
                <h2>{t.faqHeading}</h2>
              </div>
              <div className="faq-list">
                {faqs.map((faq) => (
                  <details key={faq.question} className="faq-item card-surface" open={faq.question === faqs[0].question}>
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </main>
        {renderFooter()}
      </>
    );
  };

  const renderMemberHome = () => {
    const navItems = [
      { href: "#search", label: t.courses },
      { href: "#subjects", label: t.categories },
      { href: "#reviews", label: t.reviewsSectionHeading },
      { href: "#pricing", label: t.pricing },
    ];

    return (
      <>
        {renderCommonHeader({ navItems, showBackToHome: true })}
        <main id="home" className="page-main">
          <section id="search" className="search-strip">
            <div className="container">
              <span id="courses" className="anchor-target" aria-hidden="true" />
              <div className="section-head simple">
                <span className="eyebrow subtle">{t.searchCoursesHeading}</span>
                <h2>{t.chooseCourse}</h2>
                <p className="section-description">{t.searchCoursesDescription}</p>
              </div>

              <div className="search-wrap">
                <label className="search-area" htmlFor="course-search-member">
                  <span aria-hidden="true">⌕</span>
                  <input
                    id="course-search-member"
                    type="search"
                    placeholder={t.search}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </label>
                <button type="button" className="primary-btn compact" onClick={() => setSearchQuery((prev) => prev.trim())}>
                  {t.searchButton}
                </button>
                <button type="button" className="secondary-btn compact" onClick={() => setShowQuiz(true)}>
                  {t.quiz}
                </button>
              </div>

              <div id="subjects" className="section-head search-results-head">
                <div className="filter-bar" aria-label={t.courseFiltersAria}>
                  {categoryFilters.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={activeFilter === option.id ? "filter-btn active" : "filter-btn"}
                      onClick={() => setFilter(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="course-grid">
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course) => (
                    <article key={course.id} className="course-card card-surface">
                      <div className={`course-icon ${course.accent}`}>{course.icon}</div>
                      <div className="course-body">
                        <div className="course-meta">
                          <span>{course.category}</span>
                          <span>{course.level}</span>
                        </div>
                        <h3>{course.title}</h3>
                        <p>{course.description}</p>
                        <div className="course-foot">
                          <span>
                            {Array.isArray(course.lessons) ? course.lessons.length : 0} {t.lessons}
                          </span>
                          <button type="button" className="small-btn" onClick={() => openLesson(course)}>
                            {t.startCourse}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state card-surface">
                    <h3>{t.noCourses}</h3>
                    <p>{t.noCoursesHint}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {renderAiAssistantSection()}

          {renderRatingsSection({ allowSubmission: true })}

          <section id="pricing" className="content-section pricing-section">
            <div className="container">
              <div className="section-head simple">
                <span className="eyebrow subtle">{t.pricing}</span>
                <h2>{t.pricingTitle}</h2>
              </div>
              <div className="pricing-grid pricing-grid--single">
                <article className="pricing-card pricing-card--single card-surface">
                  <span className="plan-label">{t.aiPro}</span>
                  <h3>$29<span>{t.monthlySuffix}</span></h3>
                  <ul>
                    {pricingFeatures.aiPro.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <button type="button" className="secondary-btn full" onClick={handleAiProPurchase}>{t.getAiPro}</button>
                </article>
              </div>
            </div>
          </section>
        </main>
        {renderFooter()}
      </>
    );
  };

  if (route === ROUTE_ADMIN) {
    return (
      <AdminPanel
        language={language}
        onBack={() => navigateTo(ROUTE_PUBLIC_HOME)}
        onLogout={() => navigateTo(ROUTE_AUTH, "login")}
        onAuthenticated={() => navigateTo(ROUTE_ADMIN, "login")}
      />
    );
  }

  if (route === ROUTE_AUTH) {
    return (
      <div className="levelup-app" ref={appRootRef}>
        {renderCodingBackground()}
        <header className="site-header">
          <div className="container nav-wrap auth-nav-wrap">
            <a href="#/home" className="brand" aria-label={t.brandHomeAria} onClick={() => navigateTo(ROUTE_PUBLIC_HOME)}>
              <span className="brand-mark">
                <img src={siteLogo} alt={t.siteLogoAlt} className="brand-logo" />
              </span>
              <span className="brand-copy">
                <strong>{t.brand}</strong>
                <small>{t.slogan}</small>
              </span>
            </a>

            <div className="desktop-header-controls">
              <button
                type="button"
                className="theme-toggle"
                aria-label={theme === "dark" ? t.dayMode : t.nightMode}
                onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>

              <label className="lang-picker" aria-label={t.languageLabel}>
                <select value={language} onChange={(event) => handleLanguageChange(event.target.value)} className="language-select">
                  {languageOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </header>

        <main className="auth-page-main">
          <div className="container auth-page-container">
            {authMode === "register" ? (
              <div className="auth-back-row">
                <button type="button" className="secondary-btn back-button" onClick={() => navigateTo(ROUTE_PUBLIC_HOME)}>
                  ← {t.back}
                </button>
              </div>
            ) : null}

            <Auth
              key={authMode}
              standalone
              t={t}
              language={language}
              initialMode={authMode}
              onModeChange={setAuthMode}
              onLogin={(userData, mode) => {
                setUser(userData);
                if (userData?.language) {
                  setLanguage(userData.language);
                }
                if (userData?.theme) {
                  setTheme(userData.theme);
                }
                if (pendingAccessCourseId) {
                  setSelectedCourseId(pendingAccessCourseId);
                  setSelectedLessonId(pendingAccessLessonId || null);
                  setPendingAccessCourseId(null);
                  setPendingAccessLessonId(null);
                  setShowLessonAccessNotice(false);
                  navigateTo(ROUTE_MEMBER_HOME);
                  return;
                }
                if (mode === "register") {
                  navigateTo(ROUTE_MEMBER_HOME);
                } else {
                  navigateTo(ROUTE_PUBLIC_HOME);
                }
              }}
            />
          </div>
        </main>
      </div>
    );
  }

  if (route === ROUTE_PROFILE_SETTINGS) {
    return renderProfileSettingsPage();
  }

  if (route === ROUTE_PROFILE_DATA) {
    return renderProfileDataPage();
  }

  return (
    <div className="levelup-app" ref={appRootRef}>
      {renderCodingBackground()}
      {route === ROUTE_MEMBER_HOME ? renderMemberHome() : renderPublicHome()}

      {selectedCourse && (
        <div className="modal-backdrop" onClick={closeCourseLessons}>
          <div className="lesson-modal card-surface" onClick={(event) => event.stopPropagation()}>
            {!selectedLesson ? (
              <>
                <div className="course-lesson-topbar">
                  <button
                    type="button"
                    className="secondary-btn small"
                    onClick={() => {
                      setSelectedLessonId(null);
                      setSelectedCourseId(null);
                      setShowLessonAccessNotice(false);
                      navigateTo(ROUTE_MEMBER_HOME);
                    }}
                  >
                    Чыгуу
                  </button>
                </div>
                <span className="eyebrow subtle">{selectedCourse.category}</span>
                <h3>{selectedCourse.title}</h3>
                <p className="course-modal-description">{selectedCourse.description}</p>

                <div className="course-modal-meta">
                  <span>{activeCourseLessons.length} {t.lessons}</span>
                  <span>{t.completedLabel}: {completedCourseLessons}</span>
                </div>
                {lessonCompletionNotice === LESSON_VIDEO_LOCK_NOTICE ? <p className="lesson-video-status warning">{t.lessonVideoLockNotice}</p> : null}

                <div className="course-lesson-list">
                  {activeCourseLessons.length > 0 ? (
                    activeCourseLessons.map((lesson, index) => (
                      <button
                        key={lesson.id}
                        type="button"
                        className="lesson-list-item"
                        onClick={() => openLessonCard(selectedCourse, lesson)}
                      >
                        <span className={`lesson-list-icon ${selectedCourse.accent || ""}`}>
                          <LessonIcon lesson={lesson} course={selectedCourse} size={20} />
                        </span>
                        <span className="lesson-list-copy">
                          <strong>{t.lessonNumber.replace("{number}", String(index + 1))}</strong>
                          <small>{lesson.description}</small>
                        </span>
                        <span className="lesson-list-meta">
                          <em>{lesson.duration || "—"}</em>
                          <b>
                            {isLessonCompleted(selectedCourse.id, lesson.id)
                              ? `✓ ${getStatusLabel("completed", t)}`
                              : isLessonLockedByProgress(selectedCourse, lesson)
                                ? "🔒"
                                : getStatusLabel("not-started", t)}
                          </b>
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="empty-state course-empty-state">
                      <h3>{t.noLessonsTitle}</h3>
                      <p>{t.noLessonsText}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="course-lesson-topbar lesson-detail-topbar">
                  <span className="eyebrow subtle">{selectedCourse.title}</span>
                  {selectedCourse.id === "mathematics" ? (
                    <button
                      type="button"
                      className="secondary-btn small math-course-return-btn"
                      onClick={() => setSelectedLessonId(null)}
                      title="Back to Mathematics course"
                      aria-label="Back to Mathematics course"
                    >
                      ←
                    </button>
                  ) : null}
                </div>

                <h3>{selectedLesson.title}</h3>
                <div className="modal-progress">
                  <span>{activeLessonIndex + 1}/{activeCourseLessons.length}</span>
                  <div className="progress-line"><span style={{ width: `${((activeLessonIndex + 1) / Math.max(activeCourseLessons.length, 1)) * 100}%` }} /></div>
                </div>

                <div className="lesson-hero-box">
                  <span className={`lesson-hero-icon ${selectedCourse.accent || ""}`}>
                    <LessonIcon lesson={selectedLesson} course={selectedCourse} size={24} />
                  </span>
                  <div>
                    <strong>{selectedLesson.title}</strong>
                    <p>{selectedLesson.description || selectedCourse.description}</p>
                  </div>
                </div>

                {displayLessonVideo && lessonVideoConfig ? (
                <div className="lesson-video-wrap">
                   <div className="lesson-video-header">{lessonVideoConfig.title}</div>
                   <div className="lesson-video-frame">
                     <div ref={lessonVideoPlayerRef} className="lesson-youtube-player" />
                   </div>
                   {isCurrentLessonCompleted ? <p className="lesson-video-status complete">✓ {t.lessonCompleted}</p> : <p className="lesson-video-status">{t.lessonVideoLockNotice}</p>}
                   {lessonPlaybackError ? <p className="lesson-video-status error">{lessonPlaybackError}</p> : null}
                   {lessonCompletionNotice === LESSON_VIDEO_LOCK_NOTICE ? <p className="lesson-video-status warning">{t.lessonVideoLockNotice}</p> : null}
                 </div>
                ) : null}

                <div className="lesson-actions">
                  <button
                    type="button"
                    className="secondary-btn small"
                    onClick={() => {
                      if (activeLessonIndex > 0) {
                        setLessonCompletionNotice("");
                        setLessonPlaybackError("");
                        setSelectedLessonId(activeCourseLessons[activeLessonIndex - 1].id);
                      }
                    }}
                    disabled={activeLessonIndex <= 0}
                  >
                    {t.previous}
                  </button>

                  {activeLessonIndex === activeCourseLessons.length - 1 ? (
                    <button type="button" className="primary-btn small" onClick={closeCourseLessons}>
                      {t.finish}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`primary-btn small ${isNextLessonLockedByVideo ? "lesson-next-locked" : ""}`.trim()}
                      onClick={() => {
                        if (isNextLessonLockedByVideo) {
                          setLessonCompletionNotice(LESSON_VIDEO_LOCK_NOTICE);
                          return;
                        }
                        if (activeLessonIndex >= 0 && activeLessonIndex < activeCourseLessons.length - 1) {
                          const nextLesson = activeCourseLessons[activeLessonIndex + 1];
                          if (isRestrictedLessonForGuest(selectedCourse, nextLesson)) {
                            showRestrictedLessonNotice(selectedCourse);
                            return;
                          }
                          setLessonCompletionNotice("");
                          setLessonPlaybackError("");
                          setSelectedLessonId(nextLesson.id);
                        }
                      }}
                      aria-disabled={isNextLessonLockedByVideo}
                    >
                      {nextLessonButtonText}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showLessonAccessNotice && selectedCourse ? (
        <div className="modal-backdrop lesson-access-overlay" onClick={() => setShowLessonAccessNotice(false)}>
          <div className="lesson-access-dialog card-surface" onClick={(event) => event.stopPropagation()}>
            <p className="lesson-access-message">{t.lessonAccessMessage}</p>
            <div className="lesson-access-actions">
              <button
                type="button"
                className="primary-btn small"
                onClick={() => {
                  setShowLessonAccessNotice(false);
                  const targetCourseId = selectedCourse?.id || pendingAccessCourseId;
                  const targetLessonId = selectedLesson?.id || pendingAccessLessonId;
                  setPendingAccessCourseId(targetCourseId);
                  setPendingAccessLessonId(targetLessonId);
                  setSelectedCourseId(null);
                  setSelectedLessonId(null);
                  syncSelectionToUrl(null, null);
                  navigateTo(ROUTE_AUTH, "register");
                }}
              >
                {t.registerAction}
              </button>
              <button
                type="button"
                className="secondary-btn small"
                onClick={() => setShowLessonAccessNotice(false)}
              >
                {t.laterAction}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {hasAiProAccess ? (
        <div className="ai-assistant-root">
          {!isAiAssistantOpen ? (
            <button
              type="button"
              className="ai-assistant-toggle"
              aria-label={t.assistantFloating || "Open AI assistant"}
              onClick={() => {
                setIsAiAssistantOpen(true);
                setIsAiAssistantMinimized(false);
              }}
            >
              <img src={siteLogo} alt={t.siteLogoAlt} className="ai-assistant-toggle-logo" />
            </button>
          ) : (
            <div className={`ai-assistant-panel card-surface ${isAiAssistantMinimized ? "is-minimized" : ""}`}>
              <div className="ai-assistant-header">
                <div className="ai-assistant-brand">
                  <img src={siteLogo} alt={t.siteLogoAlt} className="ai-assistant-brand-logo" />
                  <div>
                    <strong>{t.assistantWindowTitle}</strong>
                    <span>{t.aiPro}</span>
                  </div>
                </div>
                <div className="ai-assistant-header-actions">
                  <button
                    type="button"
                    className="ai-assistant-icon-btn"
                    onClick={() => setIsAiAssistantMinimized((previous) => !previous)}
                    aria-label={t.assistantMinimize}
                  >
                    {t.assistantMinimize}
                  </button>
                  <button
                    type="button"
                    className="ai-assistant-icon-btn"
                    onClick={() => setIsAiAssistantOpen(false)}
                    aria-label={t.assistantClose}
                  >
                    {t.assistantClose}
                  </button>
                </div>
              </div>

              {!isAiAssistantMinimized ? (
                <>
                  <button type="button" className="assistant-quick-actions" onClick={() => setShowReadyQuestions((previous) => !previous)}>
                    {t.assistantReadyQuestions}
                  </button>

                  {showReadyQuestions ? (
                    <div className="assistant-question-list">
                      {getAiAssistantQuestionsByLanguage(language).map((question, index) => (
                        <button
                          key={`${question}-${index}`}
                          type="button"
                          className="assistant-question-item"
                          onClick={() => {
                            setShowReadyQuestions(false);
                            handleAssistantSubmit(question);
                          }}
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <div className="ai-assistant-chat-window" ref={assistantChatScrollRef}>
                    {chatMessages.map((message, index) => (
                      <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
                        {message.text}
                      </div>
                    ))}
                    {aiAssistantLoading ? (
                      <div className="message bot is-typing" aria-live="polite">
                        <span />
                        <span />
                        <span />
                      </div>
                    ) : null}
                    {aiAssistantError ? <p className="ai-assistant-error">{aiAssistantError}</p> : null}
                  </div>

                  <div className="chat-input-row">
                    <textarea
                      ref={assistantInputRef}
                      rows={1}
                      value={chatInput}
                      onChange={handleAssistantInputChange}
                      onKeyDown={handleAssistantKeyDown}
                      placeholder={t.assistantInputPlaceholder}
                      aria-label={t.assistantInputPlaceholder}
                      className="assistant-textarea"
                    />
                    <button type="button" className="primary-btn small assistant-send-btn" onClick={handleChatSubmit} aria-label={t.send}>
                      <span aria-hidden="true">➤</span>
                      <span>{t.send}</span>
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {showAiPaymentModal ? (
        <div className="modal-backdrop" onClick={() => setShowAiPaymentModal(false)}>
          <div className="payment-modal card-surface" onClick={(event) => event.stopPropagation()}>
            <div className="payment-modal-head">
              <div>
                <span className="eyebrow subtle">AI Pro</span>
                <h3>{t.aiPro}</h3>
              </div>
              <button type="button" className="ai-assistant-icon-btn" onClick={() => setShowAiPaymentModal(false)} aria-label={t.assistantClose}>
                {t.assistantClose}
              </button>
            </div>

            <p className="payment-notice">{t.paymentNotice || "Please proceed with payment"}</p>

            <div className="payment-options">
              {[
                { id: "card", label: t.paymentCard || "Bank card" },
                { id: "wallet", label: t.paymentWallet || "Digital wallet" },
                { id: "crypto", label: t.paymentCrypto || "Crypto" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={selectedPaymentMethod === option.id ? "payment-option selected" : "payment-option"}
                  onClick={() => setSelectedPaymentMethod(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="payment-summary">
              <span>{t.aiPro}</span>
              <strong>$29</strong>
            </div>

            <div className="payment-actions">
              <button type="button" className="secondary-btn" onClick={() => setShowAiPaymentModal(false)}>
                {t.cancelPayment || t.cancelEdit || "Cancel"}
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  setShowAiPaymentModal(false);
                  handleAiProActivation();
                }}
              >
                {t.payNow || "Pay now"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showQuiz && <Quiz t={t} questions={quizQuestions} onClose={() => setShowQuiz(false)} />}
    </div>
  );
}

export default App;
