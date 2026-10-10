import React, { useRef } from "react";
import { TimelineItem } from "../types";
import { InhalerIcon, AttackIcon, NoteIcon } from "./Icons";
import { ModalSheet } from "./ModalSheet";

interface ItemDetailModalProps {
  item: TimelineItem | null;
  isOpen?: boolean;
  currentDateStr: string;
  onClose: () => void;
  onToggleComplete: (item: TimelineItem) => void;
  onEdit: (item: TimelineItem) => void;
  onDelete: (item: TimelineItem) => void;
}

export function ItemDetailModal({
  item,
  isOpen,
  currentDateStr,
  onClose,
  onToggleComplete,
  onEdit,
  onDelete,
}: ItemDetailModalProps) {
  const lastItemRef = useRef<TimelineItem | null>(item);
  if (item) {
    lastItemRef.current = item;
  }
  const currentItem = item || lastItemRef.current;

  if (!currentItem) return null;

  const isSchedule = currentItem.type === "schedule";
  const isAttack = currentItem.type === "attack";
  const isNote = currentItem.type === "note";

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

  const effectiveOpen = isOpen !== undefined ? isOpen : Boolean(item);

  return (
    <ModalSheet isOpen={effectiveOpen} onClose={onClose}>
      {/* Top Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <div className={`ic ${iconClass}`}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            className="m3-chip m3-chip-tonal"
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "4px",
            }}
          >
            {typeBadge}
          </span>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>
            {currentItem.time}
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
            {currentItem.title}
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
                  currentItem.severity === "light"
                    ? "#f9e46b"
                    : currentItem.severity === "medium"
                    ? "#f8b04b"
                    : "#f06a68",
                color: "#0f2b46",
              }}
            >
              {currentItem.severity === "light" && "Легкое (Легкая одышка)"}
              {currentItem.severity === "medium" && "Среднее (Выраженная одышка)"}
              {currentItem.severity === "heavy" && "Тяжелое (Удушье)"}
            </div>
          </div>
        )}

        {(isAttack ? currentItem.raw.note : currentItem.subtitle) && (
          <div style={{ marginBottom: "12px" }}>
            <div className="form-label">Примечание / Описание</div>
            <div style={{ fontSize: "15px", color: "var(--text)", lineHeight: 1.4 }}>
              {isAttack ? currentItem.raw.note : currentItem.subtitle}
            </div>
          </div>
        )}

        {isSchedule && (
          <div>
            <div className="form-label">Статус</div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: currentItem.completed
                  ? "var(--teal)"
                  : currentItem.isMissed
                  ? "#f06a68"
                  : "var(--sub)",
              }}
            >
              {currentItem.completed
                ? currentItem.originalTime && currentItem.originalTime !== currentItem.time
                  ? `✓ Выполнено в ${currentItem.time} (по плану: ${currentItem.originalTime})`
                  : "✓ Выполнено"
                : currentItem.isMissed
                ? `❌ Пропущено (доступно было до ${currentItem.windowEndTime})`
                : currentItem.isTooEarly
                ? `⏳ Запланировано (доступно с ${currentItem.windowStartTime} до ${currentItem.windowEndTime})`
                : "⏳ Запланировано"}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {isSchedule && (
          currentItem.completed ? (
            <button
              type="button"
              onClick={() => onToggleComplete(currentItem)}
              className="btn-secondary"
            >
              Вернуть в запланированные
            </button>
          ) : currentItem.isMissed ? (
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
              onClick={() => onToggleComplete(currentItem)}
              className="btn-primary"
            >
              Пометить выполненным
            </button>
          )
        )}

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => onEdit(currentItem)}
            className="btn-secondary"
            style={{ flex: 1 }}
          >
            Редактировать
          </button>
          <button
            type="button"
            onClick={() => onDelete(currentItem)}
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
    </ModalSheet>
  );
}
