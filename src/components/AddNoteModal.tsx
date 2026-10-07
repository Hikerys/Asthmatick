import React, { useState } from "react";
import { NoteRecord } from "../types";
import { formatDateKey } from "../storage";

interface AddNoteModalProps {
  initial?: NoteRecord | null;
  targetDate?: string;
  onClose: () => void;
  onSave: (note: Omit<NoteRecord, "id" | "createdAt">) => void;
}

export function AddNoteModal({ initial, targetDate, onClose, onSave }: AddNoteModalProps) {
  const [title, setTitle] = useState(initial?.title || "");
  const [date, setDate] = useState(initial?.date || targetDate || formatDateKey(new Date()));
  const [time, setTime] = useState(
    initial?.time ||
      new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  );
  const [description, setDescription] = useState(initial?.description || "");

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
    <div
      className="ov on"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet">
        <div className="grab" />
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
      </div>
    </div>
  );
}
