import React, { useState, useEffect } from "react";
import { ModalSheet } from "./ModalSheet";

interface TimePickerModalProps {
  isOpen: boolean;
  value: string; // "HH:mm"
  onChange: (time: string) => void;
  onClose: () => void;
}

export function TimePickerModal({
  isOpen,
  value,
  onChange,
  onClose,
}: TimePickerModalProps) {
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);

  // Sync with initial value when modal opens
  useEffect(() => {
    if (isOpen) {
      const [hStr, mStr] = (value || "08:00").split(":");
      const parsedH = parseInt(hStr, 10);
      const parsedM = parseInt(mStr, 10);
      setHour(isNaN(parsedH) ? 8 : Math.max(0, Math.min(23, parsedH)));
      setMinute(isNaN(parsedM) ? 0 : Math.max(0, Math.min(59, parsedM)));
    }
  }, [isOpen, value]);

  const changeHour = (delta: number) => {
    setHour((prev) => (prev + delta + 24) % 24);
  };

  const changeMinute = (delta: number) => {
    setMinute((prev) => (prev + delta + 60) % 60);
  };

  const adjustMinutes = (delta: number) => {
    const total = (hour * 60 + minute + delta + 1440) % 1440;
    setHour(Math.floor(total / 60));
    setMinute(total % 60);
  };

  const setNow = () => {
    const now = new Date();
    setHour(now.getHours());
    setMinute(now.getMinutes());
  };

  const setPreset = (h: number, m: number) => {
    setHour(h);
    setMinute(m);
  };

  const formattedTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  const handleConfirm = () => {
    onChange(formattedTime);
    onClose();
  };

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose} zIndex={60}>
      <h3 style={{ marginBottom: "6px" }}>Выбор времени</h3>
      <div style={{ fontSize: "14px", color: "var(--sub)", marginBottom: "18px" }}>
        Настройте стрелками или выберите быстрый шаблон
      </div>

      {/* Main Digital Stepper Block */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          background: "var(--tint)",
          borderRadius: "20px",
          padding: "16px 20px",
          marginBottom: "16px",
        }}
      >
        {/* Hours Stepper */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            className="tap"
            onClick={() => changeHour(1)}
            aria-label="Прибавить час"
            style={{
              width: "48px",
              height: "40px",
              borderRadius: "12px",
              border: "none",
              background: "var(--card)",
              color: "var(--teal)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              boxShadow: "var(--shadow)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>

          <div
            style={{
              fontSize: "40px",
              fontWeight: 800,
              color: "var(--text)",
              minWidth: "64px",
              textAlign: "center",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {String(hour).padStart(2, "0")}
          </div>

          <button
            type="button"
            className="tap"
            onClick={() => changeHour(-1)}
            aria-label="Убавить час"
            style={{
              width: "48px",
              height: "40px",
              borderRadius: "12px",
              border: "none",
              background: "var(--card)",
              color: "var(--teal)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              boxShadow: "var(--shadow)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--sub)" }}>часы</span>
        </div>

        {/* Colon separator */}
        <div
          style={{
            fontSize: "36px",
            fontWeight: 800,
            color: "var(--sub)",
            marginBottom: "20px",
            userSelect: "none",
          }}
        >
          :
        </div>

        {/* Minutes Stepper */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            className="tap"
            onClick={() => changeMinute(1)}
            aria-label="Прибавить минуту"
            style={{
              width: "48px",
              height: "40px",
              borderRadius: "12px",
              border: "none",
              background: "var(--card)",
              color: "var(--teal)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              boxShadow: "var(--shadow)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>

          <div
            style={{
              fontSize: "40px",
              fontWeight: 800,
              color: "var(--text)",
              minWidth: "64px",
              textAlign: "center",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {String(minute).padStart(2, "0")}
          </div>

          <button
            type="button"
            className="tap"
            onClick={() => changeMinute(-1)}
            aria-label="Убавить минуту"
            style={{
              width: "48px",
              height: "40px",
              borderRadius: "12px",
              border: "none",
              background: "var(--card)",
              color: "var(--teal)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              boxShadow: "var(--shadow)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--sub)" }}>минуты</span>
        </div>
      </div>

      {/* Quick minute offsets */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button
          type="button"
          onClick={() => adjustMinutes(-15)}
          className="tap"
          style={{
            flex: 1,
            padding: "8px 4px",
            borderRadius: "10px",
            border: "none",
            background: "var(--card)",
            color: "var(--text)",
            fontSize: "13px",
            fontWeight: 700,
            boxShadow: "var(--shadow)",
            cursor: "pointer",
          }}
        >
          −15 мин
        </button>
        <button
          type="button"
          onClick={() => adjustMinutes(-5)}
          className="tap"
          style={{
            flex: 1,
            padding: "8px 4px",
            borderRadius: "10px",
            border: "none",
            background: "var(--card)",
            color: "var(--text)",
            fontSize: "13px",
            fontWeight: 700,
            boxShadow: "var(--shadow)",
            cursor: "pointer",
          }}
        >
          −5 мин
        </button>
        <button
          type="button"
          onClick={() => adjustMinutes(5)}
          className="tap"
          style={{
            flex: 1,
            padding: "8px 4px",
            borderRadius: "10px",
            border: "none",
            background: "var(--card)",
            color: "var(--text)",
            fontSize: "13px",
            fontWeight: 700,
            boxShadow: "var(--shadow)",
            cursor: "pointer",
          }}
        >
          +5 мин
        </button>
        <button
          type="button"
          onClick={() => adjustMinutes(15)}
          className="tap"
          style={{
            flex: 1,
            padding: "8px 4px",
            borderRadius: "10px",
            border: "none",
            background: "var(--card)",
            color: "var(--text)",
            fontSize: "13px",
            fontWeight: 700,
            boxShadow: "var(--shadow)",
            cursor: "pointer",
          }}
        >
          +15 мин
        </button>
      </div>

      {/* Presets Chips */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
          Быстрые шаблоны
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <button
            type="button"
            className="tap"
            onClick={setNow}
            style={{
              padding: "8px 12px",
              borderRadius: "12px",
              border: "none",
              background: "rgba(26, 155, 140, 0.15)",
              color: "var(--teal)",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ⏱️ Сейчас
          </button>
          <button
            type="button"
            className="tap"
            onClick={() => setPreset(8, 0)}
            style={{
              padding: "8px 12px",
              borderRadius: "12px",
              border: "none",
              background: "var(--card)",
              color: "var(--text)",
              fontSize: "13px",
              fontWeight: 600,
              boxShadow: "var(--shadow)",
              cursor: "pointer",
            }}
          >
            🌅 Утро 08:00
          </button>
          <button
            type="button"
            className="tap"
            onClick={() => setPreset(13, 0)}
            style={{
              padding: "8px 12px",
              borderRadius: "12px",
              border: "none",
              background: "var(--card)",
              color: "var(--text)",
              fontSize: "13px",
              fontWeight: 600,
              boxShadow: "var(--shadow)",
              cursor: "pointer",
            }}
          >
            ☀️ День 13:00
          </button>
          <button
            type="button"
            className="tap"
            onClick={() => setPreset(19, 0)}
            style={{
              padding: "8px 12px",
              borderRadius: "12px",
              border: "none",
              background: "var(--card)",
              color: "var(--text)",
              fontSize: "13px",
              fontWeight: 600,
              boxShadow: "var(--shadow)",
              cursor: "pointer",
            }}
          >
            🌆 Вечер 19:00
          </button>
          <button
            type="button"
            className="tap"
            onClick={() => setPreset(22, 0)}
            style={{
              padding: "8px 12px",
              borderRadius: "12px",
              border: "none",
              background: "var(--card)",
              color: "var(--text)",
              fontSize: "13px",
              fontWeight: 600,
              boxShadow: "var(--shadow)",
              cursor: "pointer",
            }}
          >
            🌙 На ночь 22:00
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary"
          style={{ flex: 1 }}
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="btn-primary"
          style={{ flex: 1.4 }}
        >
          Выбрать {formattedTime}
        </button>
      </div>
    </ModalSheet>
  );
}
