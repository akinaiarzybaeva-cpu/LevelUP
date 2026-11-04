import localeEn from "./en.js";
import localeRu from "./ru.js";
import localeKy from "./ky.js";

export const DEFAULT_LANGUAGE = "ru";

export const locales = {
  ru: localeRu,
  ky: localeKy,
  en: localeEn,
};

export const languageOptions = [
  { code: "ru", label: "Русский" },
  { code: "ky", label: "Кыргызча" },
  { code: "en", label: "English" },
];

export const isSupportedLanguage = (value) => Object.prototype.hasOwnProperty.call(locales, value);
