import React, { useState, useEffect } from "react";
import { AttackRecord, Severity } from "../types";
import { formatDateKey } from "../storage";
import { ModalSheet } from "./ModalSheet";
import { TimePickerModal } from "./TimePickerModal";
import { DatePickerModal } from "./DatePickerModal";

interface AddAttackModalProps {
  isOpen?: boolean;
  initial?: AttackRecord | null;
  targetDate?: string;
  onClose: () => void;
  onSave: (attack: Omit<AttackRecord, "id" | "createdAt">) => void;
}

export function AddAttackModal({
  isOpen = true,
  initial,
  targetDate,
  onClose,
  onSave,
}: AddAttackModalProps) {
  const [severity, setSeverity] = useState<Severity>(initial?.severity || "medium");
  const [date, setDate] = useState(initial?.date || targetDate || formatDateKey(new Date()));
  const [time, setTime] = useState(
    initial?.time ||
      new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  );
  const [trigger, setTrigger] = useState(initial?.trigger || "");
  const [note, setNote] = useState(initial?.note || "");
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSeverity(initial?.severity || "medium");
      setDate(initial?.date || targetDate || formatDateKey(new Date()));
      setTime(
        initial?.time ||
          new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
      );
      setTrigger(initial?.trigger || "");
      setNote(initial?.note || "");
    }
  }, [isOpen, initial, targetDate]);

  const getDateLabel = () => {
    const todayStr = formatDateKey(new Date());
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yestStr = formatDateKey(yest);

    if (date === todayStr) return "Сегодня";
    if (date === yestStr) return "Вчера";
    const [y, m, d] = date.split("-").map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const parsed = new Date(y, m - 1, d);
      return parsed.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
    }
    return date;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date,
      time,
      severity,
      trigger: trigger.trim() || undefined,
      note: note.trim() || undefined,
      completed: true,
    });
  };

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose}>
      <h3>{initial ? "Редактировать состояние" : "Зафиксировать приступ / состояние"}</h3>

      <form onSubmit={handleSubmit}>
        {/* Severity selector */}
        <div className="form-group">
          <label className="form-label">Тяжесть состояния</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            {/* Light */}
            <button
              type="button"
              onClick={() => setSeverity("light")}
              className="tap"
              style={{
                padding: "12px 6px",
                borderRadius: "12px",
                border: severity === "light" ? "2px solid #b45309" : "1px solid var(--border)",
                backgroundColor: "#f9e46b",
                color: "#0f2b46",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                minHeight: "64px",
                boxShadow: severity === "light" ? "0 2px 6px rgba(180, 83, 9, 0.35)" : "none",
                opacity: severity === "light" ? 1 : 0.6,
                transition: "all .2s cubic-bezier(0.2, 0, 0, 1)",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 700, lineHeight: 1.2 }}>Легкое</span>
              <span style={{ fontSize: "11px", fontWeight: 500, opacity: 0.85, marginTop: "4px", lineHeight: 1.2 }}>
                Легкая одышка
              </span>
            </button>

            {/* Medium */}
            <button
              type="button"
              onClick={() => setSeverity("medium")}
              className="tap"
              style={{
                padding: "12px 6px",
                borderRadius: "12px",
                border: severity === "medium" ? "2px solid #c2410c" : "1px solid var(--border)",
                backgroundColor: "#f8b04b",
                color: "#0f2b46",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                minHeight: "64px",
                boxShadow: severity === "medium" ? "0 2px 6px rgba(194, 65, 12, 0.35)" : "none",
                opacity: severity === "medium" ? 1 : 0.6,
                transition: "all .2s cubic-bezier(0.2, 0, 0, 1)",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 700, lineHeight: 1.2 }}>Среднее</span>
              <span style={{ fontSize: "11px", fontWeight: 500, opacity: 0.85, marginTop: "4px", lineHeight: 1.2 }}>
                Выраженная одышка
              </span>
            </button>

            {/* Heavy */}
            <button
              type="button"
              onClick={() => setSeverity("heavy")}
              className="tap"
              style={{
                padding: "12px 6px",
                borderRadius: "12px",
                border: severity === "heavy" ? "2px solid #b91c1c" : "1px solid var(--border)",
                backgroundColor: "#f06a68",
                color: "#0f2b46",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                minHeight: "64px",
                boxShadow: severity === "heavy" ? "0 2px 6px rgba(185, 28, 28, 0.35)" : "none",
                opacity: severity === "heavy" ? 1 : 0.6,
                transition: "all .2s cubic-bezier(0.2, 0, 0, 1)",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 700, lineHeight: 1.2 }}>Тяжелое</span>
              <span style={{ fontSize: "11px", fontWeight: 500, opacity: 0.85, marginTop: "4px", lineHeight: 1.2 }}>
                Удушье
              </span>
            </button>
          </div>
        </div>

        {/* Time & Date */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }} className="form-group">
          <div>
            <label className="form-label">Время</label>
            <button
              type="button"
              onClick={() => setIsTimePickerOpen(true)}
              className="form-input tap"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "16px",
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span>{time}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sub)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
          </div>
          <div>
            <label className="form-label">Дата</label>
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(true)}
              className="form-input tap"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {getDateLabel()}
              </span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sub)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </button>
          </div>
        </div>

        {/* Trigger */}
        <div className="form-group">
          <label className="form-label">Причина / триггер (необязательно)</label>
          <input
            type="text"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            placeholder="Например: Пробежка, холодный воздух"
            className="form-input"
          />
        </div>

        {/* Note */}
        <div className="form-group">
          <label className="form-label">Заметка / принятые меры (необязательно)</label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Дополнительные детали или самочувствие"
            className="form-textarea"
          />
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "18px" }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ flex: 1 }}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="btn-primary"
            style={{ flex: 1 }}
          >
            {initial ? "Сохранить" : "Зафиксировать"}
          </button>
        </div>
      </form>

      <TimePickerModal
        isOpen={isTimePickerOpen}
        value={time}
        onChange={(newTime) => setTime(newTime)}
        onClose={() => setIsTimePickerOpen(false)}
      />

      <DatePickerModal
        isOpen={isDatePickerOpen}
        value={date}
        onChange={(newDate) => setDate(newDate)}
        onClose={() => setIsDatePickerOpen(false)}
      />
    </ModalSheet>
  );
}
