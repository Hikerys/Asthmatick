import React, { useState } from "react";
import { AttackRecord, Severity } from "../types";
import { formatDateKey } from "../storage";

interface AddAttackModalProps {
  initial?: AttackRecord | null;
  targetDate?: string;
  onClose: () => void;
  onSave: (attack: Omit<AttackRecord, "id" | "createdAt">) => void;
}

export function AddAttackModal({ initial, targetDate, onClose, onSave }: AddAttackModalProps) {
  const [severity, setSeverity] = useState<Severity>(initial?.severity || "medium");
  const [date, setDate] = useState(initial?.date || targetDate || formatDateKey(new Date()));
  const [time, setTime] = useState(
    initial?.time ||
      new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  );
  const [trigger, setTrigger] = useState(initial?.trigger || "");
  const [note, setNote] = useState(initial?.note || "");

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
    <div
      className="ov on"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet">
        <div className="grab" />
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
                  borderRadius: "14px",
                  border: "none",
                  backgroundColor: "#f9e46b",
                  color: "#0f2b46",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  minHeight: "56px",
                  boxShadow: severity === "light" ? "0 0 0 2px var(--card), 0 0 0 4px #eab308" : "none",
                  opacity: severity === "light" ? 1 : 0.65,
                  transition: "opacity .2s, box-shadow .2s",
                }}
              >
                <span>Легкая одышка</span>
              </button>

              {/* Medium */}
              <button
                type="button"
                onClick={() => setSeverity("medium")}
                className="tap"
                style={{
                  padding: "12px 6px",
                  borderRadius: "14px",
                  border: "none",
                  backgroundColor: "#f8b04b",
                  color: "#0f2b46",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  minHeight: "56px",
                  boxShadow: severity === "medium" ? "0 0 0 2px var(--card), 0 0 0 4px #f97316" : "none",
                  opacity: severity === "medium" ? 1 : 0.65,
                  transition: "opacity .2s, box-shadow .2s",
                }}
              >
                <span>Выраженная одышка</span>
              </button>

              {/* Heavy */}
              <button
                type="button"
                onClick={() => setSeverity("heavy")}
                className="tap"
                style={{
                  padding: "12px 6px",
                  borderRadius: "14px",
                  border: "none",
                  backgroundColor: "#f06a68",
                  color: "#0f2b46",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  minHeight: "56px",
                  boxShadow: severity === "heavy" ? "0 0 0 2px var(--card), 0 0 0 4px #ef4444" : "none",
                  opacity: severity === "heavy" ? 1 : 0.65,
                  transition: "opacity .2s, box-shadow .2s",
                }}
              >
                <span>Удушье</span>
              </button>
            </div>
          </div>

          {/* Time & Date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }} className="form-group">
            <div>
              <label className="form-label">Время</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Дата</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
              />
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
      </div>
    </div>
  );
}
