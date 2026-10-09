import React, { useState, useEffect } from "react";
import { NoteRecord } from "../types";
import { formatDateKey } from "../storage";
import { ModalSheet } from "./ModalSheet";
import { TimePickerModal } from "./TimePickerModal";
import { DatePickerModal } from "./DatePickerModal";

interface AddNoteModalProps {
  isOpen?: boolean;
  initial?: NoteRecord | null;
  targetDate?: string;
  onClose: () => void;
  onSave: (note: Omit<NoteRecord, "id" | "createdAt">) => void;
}

export function AddNoteModal({
  isOpen = true,
  initial,
  targetDate,
  onClose,
  onSave,
}: AddNoteModalProps) {
  const [title, setTitle] = useState(initial?.title || "");
  const [date, setDate] = useState(initial?.date || targetDate || formatDateKey(new Date()));
  const [time, setTime] = useState(
    initial?.time ||
      new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  );
  const [description, setDescription] = useState(initial?.description || "");
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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

  useEffect(() => {
    if (isOpen) {
      setTitle(initial?.title || "");
      setDate(initial?.date || targetDate || formatDateKey(new Date()));
      setTime(
        initial?.time ||
          new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
      );
      setDescription(initial?.description || "");
    }
  }, [isOpen, initial, targetDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      date,
      time,
      description: description.trim() || undefined,
      completed: true,
    });
  };

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose}>
      <h3>{initial ? "Редактировать заметку" : "Новая заметка"}</h3>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Заголовок / описание события</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Прогулка на свежем воздухе"
            className="form-input"
          />
        </div>

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

        <div className="form-group">
          <label className="form-label">Подробности (необязательно)</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Самочувствие, комментарий, детали"
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
            {initial ? "Сохранить" : "Добавить"}
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
