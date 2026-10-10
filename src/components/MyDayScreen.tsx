import React from "react";
import { ScheduleEvent, AttackRecord, NoteRecord, TimelineItem } from "../types";
import {
  InhalerIcon,
  AttackIcon,
  NoteIcon,
  DoneCheckIcon,
  PendingClockIcon,
  ChevronRightIcon,
  MissedIcon,
} from "./Icons";
import { formatDateKey, getIsoDayOfWeek, getScheduleStatusInfo } from "../storage";

interface MyDayScreenProps {
  scheduleEvents: ScheduleEvent[];
  attacks: AttackRecord[];
  notes: NoteRecord[];
  onSelectItem: (item: TimelineItem) => void;
  onToggleCompleteItem?: (item: TimelineItem) => void;
}

export function MyDayScreen({
  scheduleEvents,
  attacks,
  notes,
  onSelectItem,
  onToggleCompleteItem,
}: MyDayScreenProps) {
  const today = new Date();
  const todayStr = formatDateKey(today);
  const currentIsoDay = getIsoDayOfWeek(today);

  // Dynamic greeting based on current hour
  const hour = today.getHours();
  let greeting = "Добрый день!";
  if (hour >= 5 && hour < 12) greeting = "Доброе утро!";
  else if (hour >= 18 && hour < 23) greeting = "Добрый вечер!";
  else if (hour >= 23 || hour < 5) greeting = "Доброй ночи!";

  // Build unified items list for today
  const items: TimelineItem[] = [];

  // 1. Schedule events active today
  for (const ev of scheduleEvents) {
    if (ev.days.includes(currentIsoDay)) {
      const statusInfo = getScheduleStatusInfo(ev, todayStr, today);
      items.push({
        type: "schedule",
        id: ev.id,
        time: statusInfo.displayTime,
        title: ev.title,
        subtitle: ev.note || "",
        completed: statusInfo.isCompleted,
        isMissed: statusInfo.isMissed,
        isTooEarly: statusInfo.isTooEarly,
        canComplete: statusInfo.canComplete,
        windowStartTime: statusInfo.windowStartTime,
        windowEndTime: statusInfo.windowEndTime,
        originalTime: ev.time,
        raw: ev,
      });
    }
  }

  // 2. Attacks logged today
  for (const att of attacks) {
    if (att.date === todayStr) {
      items.push({
        type: "attack",
        id: att.id,
        time: att.time,
        title: att.trigger || "Приступ астмы",
        subtitle:
          att.severity === "light"
            ? "Легкое состояние"
            : att.severity === "medium"
            ? "Среднее состояние"
            : "Тяжелое состояние",
        severity: att.severity,
        completed: att.completed ?? true,
        raw: att,
      });
    }
  }

  // 3. Notes logged today
  for (const note of notes) {
    if (note.date === todayStr) {
      items.push({
        type: "note",
        id: note.id,
        time: note.time,
        title: note.title,
        subtitle: note.description || "",
        completed: note.completed ?? true,
        raw: note,
      });
    }
  }

  // Sort items chronologically by time
  items.sort((a, b) => a.time.localeCompare(b.time));

  return (
    <section className="screen on" id="home">
      {/* Greeting Banner */}
      <div className="greet">
        <svg viewBox="0 0 64 64">
          <use href="#lungs" />
        </svg>
        <div>
          <b>{greeting}</b>
          <small>Следуйте плану — дышите легче</small>
        </div>
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="card" style={{ padding: "24px 18px", textAlign: "center", display: "block" }}>
          <b style={{ fontSize: "18px", marginBottom: "6px" }}>На сегодня расписание пусто</b>
          <div style={{ fontSize: "14px", color: "var(--sub)" }}>
            Нажмите кнопку «+» ниже, чтобы добавить приём лекарств, зафиксировать состояние или сделать заметку.
          </div>
        </div>
      ) : (
        items.map((item) => {
          const isSchedule = item.type === "schedule";
          const isAttack = item.type === "attack";
          const isNote = item.type === "note";

          return (
            <div
              key={`${item.type}-${item.id}`}
              onClick={() => onSelectItem(item)}
              className="card tap"
            >
              {/* Icon */}
              {isSchedule && (
                <div className="ic b">
                  <InhalerIcon size={26} />
                </div>
              )}
              {isAttack && (
                <div className="ic p">
                  <AttackIcon size={26} />
                </div>
              )}
              {isNote && (
                <div className="ic g">
                  <NoteIcon size={26} />
                </div>
              )}

              {/* Text */}
              <div className="t">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "2px" }}>
                  <b>{item.time}</b>
                  {isSchedule && (
                    <span
                      className={`status-chip ${
                        item.completed
                          ? "chip-done"
                          : item.isMissed
                          ? "chip-missed"
                          : "chip-planned"
                      }`}
                    >
                      {item.completed
                        ? "выполнено"
                        : item.isMissed
                        ? "пропущено"
                        : "планируется"}
                    </span>
                  )}
                </div>
                <div>{item.title}</div>
                {item.subtitle && (
                  <em
                    className={
                      isAttack && item.severity
                        ? `sev-text sev-${item.severity}`
                        : undefined
                    }
                  >
                    {item.subtitle}
                  </em>
                )}
              </div>

              {/* Status / Action Indicator */}
              {isSchedule && (
                <div
                  onClick={(e) => {
                    if (onToggleCompleteItem) {
                      e.stopPropagation();
                      onToggleCompleteItem(item);
                    }
                  }}
                  style={{ display: "grid", placeItems: "center" }}
                >
                  {item.completed ? (
                    <DoneCheckIcon />
                  ) : item.isMissed ? (
                    <MissedIcon />
                  ) : (
                    <PendingClockIcon size={30} />
                  )}
                </div>
              )}

              {!isSchedule && <ChevronRightIcon />}
            </div>
          );
        })
      )}

      {/* Decorative background watermark and wave */}
      <svg className="wm" viewBox="0 0 64 64">
        <use href="#lungs" />
      </svg>
      <div className="wave" />
    </section>
  );
}
