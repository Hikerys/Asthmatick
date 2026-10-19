import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { initializeStorage, loadSettings } from "./storage";
import "./index.css";

async function start() {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;
  try {
    await initializeStorage();
    const initialTheme = loadSettings().theme;
    document.documentElement.setAttribute("data-theme", initialTheme);
    document.documentElement.className = initialTheme;
    document.body.setAttribute("data-theme", initialTheme);
    document.body.className = initialTheme;
    ReactDOM.createRoot(rootElement).render(<React.StrictMode><App /></React.StrictMode>);
  } catch (error) {
    console.error("Could not open Asthmatick database", error);
    rootElement.innerHTML = '<main style="padding:24px;font-family:sans-serif"><h1>Не удалось открыть данные</h1><p>Перезапустите приложение. Не очищайте данные приложения, чтобы сохранить записи.</p></main>';
  }
}

void start();
