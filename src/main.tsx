import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { loadSettings } from "./storage";
import "./index.css";

// Apply initial theme immediately before rendering
try {
  const initialTheme = loadSettings().theme;
  document.documentElement.setAttribute("data-theme", initialTheme);
  document.documentElement.className = initialTheme;
  document.body.setAttribute("data-theme", initialTheme);
  document.body.className = initialTheme;
} catch (e) {
  console.warn("Could not load initial theme:", e);
}

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
