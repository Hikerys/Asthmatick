import React from "react";
import { TimelineItem } from "../types";
import { InhalerIcon, AttackIcon, NoteIcon } from "./Icons";

interface ItemDetailModalProps {
  item: TimelineItem;
  currentDateStr: string;
  onClose: () => void;
  onToggleComplete: (item: TimelineItem) => void;
  onEdit: (item: TimelineItem) => void;
  onDelete: (item: TimelineItem) => void;
}

export function ItemDetailModal({
  item,
  currentDateStr,
  onClose,
  onToggleComplete,
  onEdit,
  onDelete,
}: ItemDetailModalProps) {
  const isSchedule = item.type === "schedule";
  const isAttack = item.type === "attack";
  const isNote = item.type === "note";

  let typeBadge = "Событие расписания";
  let icon = <InhalerIcon size={26} />;
  let iconClass = "b";

  if (isAttack) {
    typeBadge = "Приступ / Состояние";
    icon = <AttackIcon size={26} />;
    iconClass = "p";
  } else if (isNote) {
    typeBadge = "Заметка";
    icon = <NoteIcon size={26} />;
    iconClass = "g";
  }

  return (
    <div
      className="ov on"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet">
        <div className="grab" />

        {/* Top Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div className={`ic ${iconClass}`}>
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--teal)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {typeBadge}
            </span>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>
              {item.time}
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div
          style={{
            background: "var(--tint)",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <div className="form-label">Название</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>
              {item.title}
            </div>
          </div>

          {isAttack && (
            <div style={{ marginBottom: "12px" }}>
              <div className="form-label">Тяжесть</div>
              <div
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 700,
                  backgroundColor:
                    item.severity === "light"
                      ? "#f9e46b"
                      : item.severity === "medium"
                      ? "#f8b04b"
                      : "#f06a68",
                  color: "#0f2b46",
                }}
              >
                {item.severity === "light" && "Легкое (Легкая одышка)"}
                {item.severity === "medium" && "Среднее (Выраженная одышка)"}
                {item.severity === "heavy" && "Тяжелое (Удушье)"}
              </div>
            </div>
          )}

          {(isAttack ? item.raw.note : item.subtitle) && (
            <div style={{ marginBottom: "12px" }}>
              <div className="form-label">Примечание / Описание</div>
              <div style={{ fontSize: "15px", color: "var(--text)", lineHeight: 1.4 }}>
                {isAttack ? item.raw.note : item.subtitle}
              </div>
            </div>
          )}

          <div>
            <div className="form-label">Статус</div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: item.completed
                  ? "var(--teal)"
                  : isSchedule && item.isMissed
                  ? "#f06a68"
                  : "var(--sub)",
              }}
            >
              {item.completed
                ? isSchedule && item.originalTime && item.originalTime !== item.time
                  ? `✓ Выполнено в ${item.time} (по плану: ${item.originalTime})`
                  : "✓ Выполнено"
                : isSchedule && item.isMissed
                ? `❌ Пропущено (доступно было до ${item.windowEndTime})`
                : isSchedule && item.isTooEarly
                ? `⏳ Запланировано (доступно с ${item.windowStartTime} до ${item.windowEndTime})`
                : "⏳ Запланировано"}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {isSchedule && (
            item.completed ? (
              <button
                type="button"
                onClick={() => onToggleComplete(item)}
                className="btn-secondary"
              >
                Вернуть в запланированные
              </button>
            ) : item.isMissed ? (
              <button
                type="button"
                disabled
                className="btn-secondary"
                style={{ opacity: 0.6, cursor: "not-allowed", color: "#f06a68" }}
              >
                Пропущено (время приёма истекло)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onToggleComplete(item)}
                className="btn-primary"
              >
                Пометить выполненным
              </button>
            )
          )}

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Редактировать
            </button>
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="btn-danger"
              style={{ flex: 1 }}
            >
              Удалить
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ marginTop: "4px" }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
