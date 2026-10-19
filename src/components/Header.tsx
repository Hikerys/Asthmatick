import React from "react";
import { APP_VERSION } from "../types";
import { Settings } from "lucide-react";

export function Header({ onOpenSettings, settingsOpen }: { onOpenSettings: () => void; settingsOpen: boolean }) {
  return (
    <header className="m3-top-app-bar">
      <div className="m3-top-app-bar-lead">
        <svg><use href="#lungs" /></svg>
      </div>
      <h1 className="m3-top-app-bar-title">Asthmatick</h1>
      <span className="m3-chip m3-chip-tonal">v{APP_VERSION}</span>
      <button type="button" className={`header-settings tap ${settingsOpen ? "on" : ""}`} onClick={onOpenSettings} aria-label="Настройки" title="Настройки">
        <Settings size={24} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </header>
  );
}
