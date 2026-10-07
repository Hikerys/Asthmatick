import React, { useState } from "react";
import { ScheduleEvent } from "../types";

interface AddScheduleModalProps {
  initial?: ScheduleEvent | null;
  onClose: () => void;
  onSave: (event: Omit<ScheduleEvent, "id" | "createdAt" | "completedDates">) => void;
}

const WEEKDAYS = [
  { id: 1, label: "Пн" },
  { id: 2, label: "Вт" },
  { id: 3, label: "Ср" },
  { id: 4, label: "Чт" },
  { id: 5, label: "Пт" },
  { id: 6, label: "Сб" },
  { id: 7, label: "Вс" },
];

export function AddScheduleModal({ initial, onClose, onSave }: AddScheduleModalProps) {
  const [title, setTitle] = useState(initial?.title || "");
  const [time, setTime] = useState(initial?.time || "08:00");
  const [days, setDays] = useState<number[]>(initial?.days || [1, 2, 3, 4, 5, 6, 7]);
  const [note, setNote] = useState(initial?.note || "");

  const toggleDay = (dayId: number) => {
    if (days.includes(dayId)) {
      if (days.length > 1) {
        setDays(days.filter((d) => d !== dayId));
      }
    } else {
      setDays([...days, dayId].sort());
    }
  };

  const selectAllDays = () => setDays([1, 2, 3, 4, 5, 6, 7]);
  const selectWeekdays = () => setDays([1, 2, 3, 4, 5]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      time,
      days,
      note: note.trim() || undefined,
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
        <h3>{initial ? "Редактировать событие" : "Событие в расписание"}</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Название или лекарство</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Респисальф"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Время приёма</label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="form-input"
              style={{ fontSize: "18px", fontWeight: 700 }}
            />
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label className="form-label" style={{ margin: 0 }}>
                Дни недели ({days.length} из 7)
              </label>
              <div style={{ display: "flex", gap: "8px", fontSize: "13px", fontWeight: 700 }}>
                <span
                  onClick={selectAllDays}
                  style={{ color: "var(--teal)", cursor: "pointer" }}
                >
                  Все
                </span>
                <span style={{ color: "var(--sub)" }}>|</span>
                <span
                  onClick={selectWeekdays}
                  style={{ color: "var(--teal)", cursor: "pointer" }}
                >
                  Будни
                </span>
              </div>
            </div>

            {/* Days row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
              {WEEKDAYS.map((wd) => {
                const isSelected = days.includes(wd.id);
                return (
                  <button
                    type="button"
                    key={wd.id}
                    onClick={() => toggleDay(wd.id)}
                    className="tap"
                    style={{
                      aspectRatio: "1",
                      borderRadius: "50%",
                      border: "none",
                      background: isSelected ? "var(--teal)" : "var(--day)",
                      color: isSelected ? "#fff" : "var(--text)",
                      fontWeight: 700,
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: isSelected ? "0 0 0 2px var(--card), 0 0 0 4px var(--teal)" : "none",
                      cursor: "pointer",
                      transition: "background .25s, box-shadow .2s",
                    }}
                  >
                    {wd.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Заметка (необязательно)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Дозировка, после еды, примечание"
              className="form-input"
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
