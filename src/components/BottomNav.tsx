import React from "react";

export type NavTab = "myday" | "calendar" | "settings";

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export function BottomNav({ currentTab, onSelectTab }: BottomNavProps) {
  return (
    <nav>
      <button
        type="button"
        className={`tap ${currentTab === "myday" ? "on" : ""}`}
        onClick={() => onSelectTab("myday")}
      >
        <svg viewBox="0 0 28 28">
          <path d="M4 13.5L14 4l10 9.5V23a1.5 1.5 0 01-1.5 1.5h-4.5v-7h-8v7H5.5A1.5 1.5 0 014 23z" />
        </svg>
        Мой день
      </button>

      <button
        type="button"
        className={`tap ${currentTab === "calendar" ? "on" : ""}`}
        onClick={() => onSelectTab("calendar")}
      >
        <svg viewBox="0 0 28 28">
          <rect x="4" y="5.5" width="20" height="19" rx="3.5" />
          <path d="M9.5 3v5M18.5 3v5M4 11h20M9 16h1.5M13.5 16h1.5M9 20h1.5" />
        </svg>
        Календарь
      </button>

      <button
        type="button"
        className={`tap ${currentTab === "settings" ? "on" : ""}`}
        onClick={() => onSelectTab("settings")}
      >
        <svg viewBox="0 0 24 24">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        Настройки
      </button>
    </nav>
  );
}
