import React, { useState } from "react";
import { ScheduleEvent, AttackRecord, NoteRecord, TimelineItem } from "../types";
import {
  formatDateKey,
  getIsoDayOfWeek,
  getWorstSeverityForDate,
  getScheduleStatusInfo,
} from "../storage";
import {
  InhalerIcon,
  AttackIcon,
  NoteIcon,
  DoneCheckIcon,
  PendingClockIcon,
  ChevronRightIcon,
  MissedIcon,
} from "./Icons";

interface CalendarScreenProps {
  scheduleEvents: ScheduleEvent[];
  attacks: AttackRecord[];
  notes: NoteRecord[];
  onSelectItem: (item: TimelineItem) => void;
  onToggleCompleteItem?: (item: TimelineItem) => void;
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

export function CalendarScreen({
  scheduleEvents,
  attacks,
  notes,
  onSelectItem,
  onToggleCompleteItem,
}: CalendarScreenProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const firstDayWeekday = getIsoDayOfWeek(firstDayOfMonth);
  const daysInMonth = lastDayOfMonth.getDate();

  const blanks = Array.from({ length: firstDayWeekday - 1 }, (_, i) => i);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const selectedDateStr = formatDateKey(selectedDate);
  const todayStr = formatDateKey(new Date());

  // Get items for selected day
  const selectedIsoDay = getIsoDayOfWeek(selectedDate);
  const dayItems: TimelineItem[] = [];

  for (const ev of scheduleEvents) {
    if (ev.days.includes(selectedIsoDay)) {
      const statusInfo = getScheduleStatusInfo(ev, selectedDateStr, new Date());
      dayItems.push({
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

  for (const att of attacks) {
    if (att.date === selectedDateStr) {
      dayItems.push({
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

  for (const note of notes) {
    if (note.date === selectedDateStr) {
      dayItems.push({
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

  dayItems.sort((a, b) => a.time.localeCompare(b.time));

  // Worst severity on selected day
  const worstSeveritySelected = getWorstSeverityForDate(selectedDateStr, attacks);

  const isSelectedToday = selectedDateStr === todayStr;
  const monthNameRu = selectedDate.toLocaleDateString("ru-RU", { month: "long" });
  const dateHeading = isSelectedToday
    ? `Сегодня, ${selectedDate.getDate()} ${monthNameRu}`
    : `${selectedDate.getDate()} ${monthNameRu}`;

  let statusSubtitle = "Всё в порядке. Продолжайте план.";
  if (worstSeveritySelected === "heavy") {
    statusSubtitle = "Внимание: Зафиксировано удушье!";
  } else if (worstSeveritySelected === "medium") {
    statusSubtitle = "Зафиксирована выраженная одышка.";
  } else if (worstSeveritySelected === "light") {
    statusSubtitle = "Зафиксирована легкая одышка.";
  }

  return (
    <section className="screen on" id="cal">
      {/* Calendar Card */}
      <div className="cal">
        {/* Month title and arrows */}
        <div className="top">
          <h2>{MONTH_NAMES[month]}</h2>
          <button
            type="button"
            className="nv tap"
            onClick={prevMonth}
            aria-label="Предыдущий месяц"
          >
            <svg viewBox="0 0 24 24">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            className="nv tap"
            onClick={nextMonth}
            aria-label="Следующий месяц"
          >
            <svg viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Weekdays row */}
        <div className="wd">
          {WEEKDAY_NAMES.map((wd) => (
            <span key={wd}>{wd}</span>
          ))}
        </div>

        {/* Days grid */}
        <div className="days">
          {blanks.map((b) => (
            <div key={`blank-${b}`} className="d sp" />
          ))}

          {monthDays.map((d) => {
            const dDate = new Date(year, month, d);
            const dStr = formatDateKey(dDate);
            const isSelected = dStr === selectedDateStr;
            const worst = getWorstSeverityForDate(dStr, attacks);
            const dIsoDay = getIsoDayOfWeek(dDate);

            // Check if there is data on this day
            const hasSchedule = scheduleEvents.some((ev) => ev.days.includes(dIsoDay));
            const hasNotes = notes.some((n) => n.date === dStr);
            const hasAttacks = attacks.some((a) => a.date === dStr);
            const hasAnyData = hasSchedule || hasNotes || hasAttacks;

            let colClass = "";
            if (worst === "heavy") colClass = "r";
            else if (worst === "medium") colClass = "o";
            else if (worst === "light") colClass = "y";

            return (
              <button
                type="button"
                key={`day-${d}`}
                onClick={() => setSelectedDate(dDate)}
                className={`d tap ${colClass} ${isSelected ? "s" : ""} ${!hasAnyData ? "has-none" : ""}`}
              >
                {d}
              </button>
            );
          })}
        </div>

        {/* Today status banner */}
        <div
          className="today tap"
          onClick={() => {
            setSelectedDate(new Date());
            setCurrentDate(new Date());
          }}
        >
          <svg className="c" viewBox="0 0 32 32">
            <rect x="4" y="6" width="24" height="22" rx="4" />
            <path d="M10 3v6M22 3v6M4 13h24" />
            <path d="M10 19h2M15 19h2M20 19h2M10 24h2M15 24h2" strokeWidth="2.4" />
          </svg>
          <div className="t">
            <b>{dateHeading}</b>
            <small>{statusSubtitle}</small>
          </div>
          <ChevronRightIcon />
        </div>
      </div>

      {/* Selected day timeline events */}
      <div style={{ marginTop: "16px" }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--sub)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            padding: "0 6px 10px",
          }}
        >
          События на этот день ({dayItems.length})
        </div>

        {dayItems.length === 0 ? (
          <div className="card" style={{ padding: "20px 16px", textAlign: "center", display: "block" }}>
            <div style={{ fontSize: "14px", color: "var(--sub)" }}>
              Нет записей и приступов на выбранный день.
            </div>
          </div>
        ) : (
          dayItems.map((item) => {
            const isSchedule = item.type === "schedule";
            const isAttack = item.type === "attack";
            const isNote = item.type === "note";

            return (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => onSelectItem(item)}
                className="card tap"
              >
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
      </div>
    </section>
  );
}
