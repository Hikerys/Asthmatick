import React, { useState } from "react";
import { LungLogo } from "./Icons";
import { ModalSheet } from "./ModalSheet";
import type { AppSettings } from "../types";

interface OnboardingModalProps {
  isOpen?: boolean;
  onComplete: () => void;
  language: AppSettings["language"];
  onLanguageChange: (language: AppSettings["language"]) => void;
}

export function OnboardingModal({ isOpen = true, onComplete, language, onLanguageChange }: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      badge: "Шаг 1 из 3",
      title: "Добро пожаловать в Asthmatick",
      description: "Удобный и надёжный трекер расписания и контроля приступов астмы.",
      icon: (
        <div
          style={{
            width: "90px",
            height: "90px",
            borderRadius: "50%",
            background: "var(--tint)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 16px",
          }}
        >
          <LungLogo size={58} />
        </div>
      ),
    },
    {
      badge: "Шаг 2 из 3",
      title: "100% конфиденциальность",
      description: "Все ваши данные сохраняются исключительно локально на вашем устройстве.",
      icon: (
        <div
          style={{
            width: "90px",
            height: "90px",
            borderRadius: "50%",
            background: "var(--green)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 16px",
          }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
      ),
    },
    {
      badge: "Шаг 3 из 3",
      title: "Важное предупреждение",
      description: "Данное приложение не является медицинским продуктом и служит только для трекера и дневника.",
      icon: (
        <div
          style={{
            width: "90px",
            height: "90px",
            borderRadius: "50%",
            background: "#fef3c7",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 16px",
          }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
      ),
    },
  ];

  const current = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onComplete}
      className="onboarding-modal"
      sheetStyle={{ textAlign: "center", paddingBottom: "32px" }}
    >
      <div className="onboarding-top-row">
        <span
          className="m3-chip m3-chip-tonal"
          style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
        >
          {current.badge}
        </span>
        <div className="language-switch compact" role="group" aria-label="Language / Язык">
          <button type="button" className={language === "ru" ? "selected" : ""} onClick={() => onLanguageChange("ru")} aria-pressed={language === "ru"}>RU</button>
          <button type="button" className={language === "en" ? "selected" : ""} onClick={() => onLanguageChange("en")} aria-pressed={language === "en"}>EN</button>
        </div>
      </div>
      {current.icon}

      <h3 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>
        {current.title}
      </h3>
      <p style={{ fontSize: "15px", color: "var(--sub)", lineHeight: 1.5, marginBottom: "24px" }}>
        {current.description}
      </p>

      {/* Step dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "24px" }}>
        {steps.map((_, idx) => (
          <div
            key={idx}
            style={{
              height: "6px",
              width: idx === step ? "22px" : "6px",
              borderRadius: "3px",
              background: idx === step ? "var(--teal)" : "var(--sub)",
              opacity: idx === step ? 1 : 0.35,
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="btn-secondary"
            style={{ flex: 1 }}
          >
            Назад
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          className="btn-primary"
          style={{ flex: 1 }}
        >
          {step === steps.length - 1 ? "Начать" : "Далее"}
        </button>
      </div>
    </ModalSheet>
  );
}
