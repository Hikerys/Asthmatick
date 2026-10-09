import React, { useState, useEffect } from "react";
import { ModalSheet } from "./ModalSheet";
import { formatDateKey, getIsoDayOfWeek } from "../storage";

interface DatePickerModalProps {
  isOpen: boolean;
  value: string; // "YYYY-MM-DD"
  onChange: (date: string) => void;
  onClose: () => void;
}

const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const WEEKDAY_NAMES = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

export function DatePickerModal({
  isOpen,
  value,
  onChange,
  onClose,
}: DatePickerModalProps) {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [viewDate, setViewDate] = useState(() => new Date());

  // Sync with prop when opened
  useEffect(() => {
    if (isOpen) {
      if (value) {
        const [y, m, d] = value.split("-").map(Number);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          const parsed = new Date(y, m - 1, d);
          setSelectedDate(parsed);
          setViewDate(parsed);
          return;
        }
      }
      const now = new Date();
      setSelectedDate(now);
      setViewDate(now);
    }
  }, [isOpen, value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayWeekday = getIsoDayOfWeek(firstDayOfMonth);
  const daysInMonth = lastDayOfMonth.getDate();

  const blanks = Array.from({ length: firstDayWeekday - 1 }, (_, i) => i);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const selectedDateStr = formatDateKey(selectedDate);
  const today = new Date();
  const todayStr = formatDateKey(today);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = formatDateKey(yesterday);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = formatDateKey(tomorrow);

  const handleSelectQuick = (d: Date) => {
    setSelectedDate(d);
    setViewDate(d);
  };

  const handleConfirm = () => {
    onChange(formatDateKey(selectedDate));
    onClose();
  };

  const formattedSelectedRu = selectedDate.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "short",
  });

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose} zIndex={60}>
      <h3 style={{ marginBottom: "6px" }}>Выбор даты</h3>
      <div style={{ fontSize: "14px", color: "var(--sub)", marginBottom: "16px" }}>
        {formattedSelectedRu}
      </div>

      {/* Quick Selection Chips: Вчера, Сегодня, Завтра */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button
          type="button"
          onClick={() => handleSelectQuick(yesterday)}
          className={`tap ${selectedDateStr === yesterdayStr ? "on" : ""}`}
          style={{
            flex: 1,
            padding: "9px 6px",
            borderRadius: "12px",
            border: "none",
            background: selectedDateStr === yesterdayStr ? "var(--teal)" : "var(--tint)",
            color: selectedDateStr === yesterdayStr ? "#fff" : "var(--text)",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: selectedDateStr === yesterdayStr ? "0 2px 8px rgba(22, 140, 126, .35)" : "none",
            transition: "all .2s ease",
          }}
        >
          Вчера
        </button>
        <button
          type="button"
          onClick={() => handleSelectQuick(today)}
          className={`tap ${selectedDateStr === todayStr ? "on" : ""}`}
          style={{
            flex: 1,
            padding: "9px 6px",
            borderRadius: "12px",
            border: "none",
            background: selectedDateStr === todayStr ? "var(--teal)" : "var(--tint)",
            color: selectedDateStr === todayStr ? "#fff" : "var(--text)",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: selectedDateStr === todayStr ? "0 2px 8px rgba(22, 140, 126, .35)" : "none",
            transition: "all .2s ease",
          }}
        >
          Сегодня
        </button>
        <button
          type="button"
          onClick={() => handleSelectQuick(tomorrow)}
          className={`tap ${selectedDateStr === tomorrowStr ? "on" : ""}`}
          style={{
            flex: 1,
            padding: "9px 6px",
            borderRadius: "12px",
            border: "none",
            background: selectedDateStr === tomorrowStr ? "var(--teal)" : "var(--tint)",
            color: selectedDateStr === tomorrowStr ? "#fff" : "var(--text)",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: selectedDateStr === tomorrowStr ? "0 2px 8px rgba(22, 140, 126, .35)" : "none",
            transition: "all .2s ease",
          }}
        >
          Завтра
        </button>
      </div>

      {/* Mini Calendar View */}
      <div
        style={{
          background: "var(--card)",
          borderRadius: "18px",
          padding: "14px 12px",
          boxShadow: "var(--shadow)",
          marginBottom: "18px",
        }}
      >
        {/* Month Navigation */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "12px", padding: "0 4px" }}>
          <div style={{ flex: 1, fontSize: "17px", fontWeight: 800, color: "var(--text)" }}>
            {MONTH_NAMES[month]} {year}
          </div>
          <button
            type="button"
            className="nv tap"
            onClick={prevMonth}
            aria-label="Предыдущий месяц"
            style={{ width: "32px", height: "32px" }}
          >
            <svg viewBox="0 0 24 24" style={{ width: "18px", height: "18px" }}>
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            className="nv tap"
            onClick={nextMonth}
            aria-label="Следующий месяц"
            style={{ width: "32px", height: "32px" }}
          >
            <svg viewBox="0 0 24 24" style={{ width: "18px", height: "18px" }}>
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Weekday labels */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            textAlign: "center",
            fontSize: "12px",
            fontWeight: 700,
            color: "var(--sub)",
            marginBottom: "8px",
          }}
        >
          {WEEKDAY_NAMES.map((wd) => (
            <span key={wd}>{wd}</span>
          ))}
        </div>

        {/* Days grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "6px 0",
            justifyItems: "center",
          }}
        >
          {blanks.map((b) => (
            <div key={`blank-${b}`} style={{ width: "36px", height: "36px" }} />
          ))}

          {monthDays.map((d) => {
            const dDate = new Date(year, month, d);
            const dStr = formatDateKey(dDate);
            const isSelected = dStr === selectedDateStr;
            const isToday = dStr === todayStr;

            return (
              <button
                type="button"
                key={`day-${d}`}
                onClick={() => setSelectedDate(dDate)}
                className="tap"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: isToday && !isSelected ? "2px solid var(--teal)" : "none",
                  background: isSelected ? "var(--teal)" : "transparent",
                  color: isSelected ? "#fff" : "var(--text)",
                  fontWeight: isSelected || isToday ? 800 : 600,
                  fontSize: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: isSelected ? "0 2px 8px rgba(22, 140, 126, .35)" : "none",
                  transition: "all .15s ease",
                }}
              >
                {d}
              </button>
            );
          })}
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
          Выбрать дату
        </button>
      </div>
    </ModalSheet>
  );
}
