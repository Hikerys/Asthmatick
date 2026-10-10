import React from "react";
import { APP_VERSION } from "../types";

export function Header() {
  return (
    <header className="m3-top-app-bar">
      <div className="m3-top-app-bar-lead">
        <svg><use href="#lungs" /></svg>
      </div>
      <h1 className="m3-top-app-bar-title">Asthmatick</h1>
      <span className="m3-chip m3-chip-tonal">v{APP_VERSION}</span>
    </header>
  );
}
