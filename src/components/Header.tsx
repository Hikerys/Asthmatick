import React from "react";
import { APP_VERSION } from "../types";

export function Header() {
  return (
    <header>
      <svg><use href="#lungs" /></svg>
      <h1>Asthmatick</h1>
      <span>v{APP_VERSION}</span>
    </header>
  );
}
