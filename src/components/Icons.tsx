import React from "react";

export function LungLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <use href="#lungs" />
    </svg>
  );
}

export function WatermarkLungs() {
  return (
    <svg className="wm" viewBox="0 0 64 64">
      <use href="#lungs" />
    </svg>
  );
}

export function InhalerIcon({ size = 26 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <use href="#inh" />
    </svg>
  );
}

export function AttackIcon({ size = 26, color = "#7b4bc4" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 6H6.5A1.5 1.5 0 005 7.5v15A1.5 1.5 0 006.5 24h11a1.5 1.5 0 001.5-1.5V19M17 6h2.5A1.5 1.5 0 0121 7.5V10" />
      <path d="M10 4.5h6v3h-6zM9 12h3M9 16h1M9 20h4" />
      <path d="M24 11l-8 8-3 1 1-3 8-8z" />
    </svg>
  );
}

export function NoteIcon({ size = 26, color = "#1a9b8c" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3h10l5 5v15a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
      <path d="M17 3v5h5M9 13h8M9 17h8M9 21h5" />
    </svg>
  );
}

export function DoneCheckIcon({ size = 22 }: { size?: number }) {
  return (
    <div className="done">
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </div>
  );
}

export function PendingClockIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ strokeWidth: 1.8, stroke: "var(--sub)", fill: "none", flexShrink: 0, marginRight: 2 }}
    >
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 6.5V12l3.5 2" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ stroke: "var(--sub)", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", flexShrink: 0 }}
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function MissedIcon({ size = 20 }: { size?: number }) {
  return (
    <div
      className="missed"
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        backgroundColor: "rgba(240, 106, 104, 0.15)",
        border: "1.5px solid rgba(240, 106, 104, 0.4)",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
      title="Пропущено"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{
          stroke: "#f06a68",
          fill: "none",
          strokeWidth: 2.4,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }}
      >
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </div>
  );
}
