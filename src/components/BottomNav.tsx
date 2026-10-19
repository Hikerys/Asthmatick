import React from "react";

export type NavTab = "myday" | "calendar" | "statistics";

interface BottomNavProps {
  currentTab: NavTab | "settings";
  onSelectTab: (tab: NavTab) => void;
}

export function BottomNav({ currentTab, onSelectTab }: BottomNavProps) {
  return (
    <nav className="m3-navigation-bar">
      <button
        type="button"
        className={`m3-nav-item tap ${currentTab === "myday" ? "on" : ""}`}
        onClick={() => onSelectTab("myday")}
        aria-label="Мой день"
      >
        <div className="m3-nav-indicator">
          <svg viewBox="0 0 28 28">
            <path d="M4 13.5L14 4l10 9.5V23a1.5 1.5 0 01-1.5 1.5h-4.5v-7h-8v7H5.5A1.5 1.5 0 014 23z" />
          </svg>
        </div>
        <span className="m3-nav-label">Мой день</span>
      </button>

      <button
        type="button"
        className={`m3-nav-item tap ${currentTab === "calendar" ? "on" : ""}`}
        onClick={() => onSelectTab("calendar")}
        aria-label="Календарь"
      >
        <div className="m3-nav-indicator">
          <svg viewBox="0 0 28 28">
            <rect x="4" y="5.5" width="20" height="19" rx="3.5" />
            <path d="M9.5 3v5M18.5 3v5M4 11h20M9 16h1.5M13.5 16h1.5M9 20h1.5" />
          </svg>
        </div>
        <span className="m3-nav-label">Календарь</span>
      </button>

      <button
        type="button"
        className={`m3-nav-item tap ${currentTab === "statistics" ? "on" : ""}`}
        onClick={() => onSelectTab("statistics")}
        aria-label="Статистика"
      >
        <div className="m3-nav-indicator">
          <svg viewBox="0 0 28 28">
            <path d="M5 23V15M11 23V10M17 23V5M23 23V12M3 23h22" />
          </svg>
        </div>
        <span className="m3-nav-label">Статистика</span>
      </button>
    </nav>
  );
}
