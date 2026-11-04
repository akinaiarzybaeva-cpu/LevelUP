import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

try {
  const savedTheme = localStorage.getItem("levelup-theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
} catch {
  document.documentElement.setAttribute("data-theme", "light");
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
