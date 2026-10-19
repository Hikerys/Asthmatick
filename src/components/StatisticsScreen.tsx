import React, { useMemo, useState } from "react";
import type { AttackRecord, ScheduleEvent } from "../types";
import { formatDateKey, getIsoDayOfWeek, getScheduleStatusInfo } from "../storage";
import { DatePickerModal } from "./DatePickerModal";

type Period = "week" | "month" | "custom";
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const displayDate = (date: Date) => date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

interface Props {
  scheduleEvents: ScheduleEvent[];
  attacks: AttackRecord[];
}

export function StatisticsScreen({ scheduleEvents, attacks }: Props) {
  const [period, setPeriod] = useState<Period>("week");
  const [offset, setOffset] = useState(0);
  const [customStart, setCustomStart] = useState(formatDateKey(addDays(new Date(), -6)));
  const [customEnd, setCustomEnd] = useState(formatDateKey(new Date()));
  const [datePicker, setDatePicker] = useState<"start" | "end" | null>(null);
  const now = new Date();
  const today = startOfDay(now);
  const weekStart = addDays(today, 1 - getIsoDayOfWeek(today));
  const start = period === "week" ? addDays(weekStart, offset * 7)
    : period === "month" ? new Date(today.getFullYear(), today.getMonth() + offset, 1)
    : new Date(`${customStart}T00:00:00`);
  const end = period === "week" ? addDays(start, 6)
    : period === "month" ? new Date(start.getFullYear(), start.getMonth() + 1, 0)
    : new Date(`${customEnd}T00:00:00`);
  const validRange = !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end;

  const stats = useMemo(() => {
    let completed = 0;
    let missed = 0;
    let planned = 0;
    const attackCounts = { light: 0, medium: 0, heavy: 0 };
    const attackDays = new Set<string>();
    if (validRange) {
      const last = end < today ? end : today;
      for (let date = startOfDay(start); date <= last; date = addDays(date, 1)) {
        const key = formatDateKey(date);
        const day = getIsoDayOfWeek(date);
        for (const event of scheduleEvents) {
          if (!event.days.includes(day) || key < formatDateKey(new Date(event.createdAt))) continue;
          const status = getScheduleStatusInfo(event, key, now);
          if (status.isCompleted) completed++;
          else if (status.isMissed) missed++;
          else planned++;
        }
      }
      for (const attack of attacks) {
        if (attack.date >= formatDateKey(start) && attack.date <= formatDateKey(end)) {
          attackCounts[attack.severity]++;
          attackDays.add(attack.date);
        }
      }
    }
    return { completed, missed, planned, attackCounts, attackDays: attackDays.size };
  }, [scheduleEvents, attacks, period, offset, customStart, customEnd, validRange]);

  const totalAttacks = stats.attackCounts.light + stats.attackCounts.medium + stats.attackCounts.heavy;
  const completedTotal = stats.completed + stats.missed;
  const adherence = completedTotal ? Math.round(stats.completed / completedTotal * 100) : null;
  const choosePeriod = (value: Period) => { setPeriod(value); setOffset(0); };

  return (
    <section className="screen on statistics-screen" aria-label="Статистика">
      <h2>Статистика</h2>
      <div className="statistics-period" role="group" aria-label="Период статистики">
        <button type="button" className={period === "week" ? "selected" : ""} onClick={() => choosePeriod("week")}>Неделя</button>
        <button type="button" className={period === "month" ? "selected" : ""} onClick={() => choosePeriod("month")}>Месяц</button>
        <button type="button" className={period === "custom" ? "selected" : ""} onClick={() => choosePeriod("custom")}>Свой период</button>
      </div>
      {period === "custom" ? (
        <div className="statistics-dates">
          <div><span>С</span><button type="button" onClick={() => setDatePicker("start")} aria-label="Выбрать дату начала">{displayDate(start)}</button></div>
          <div><span>По</span><button type="button" onClick={() => setDatePicker("end")} aria-label="Выбрать дату конца">{displayDate(end)}</button></div>
        </div>
      ) : (
        <div className="statistics-range">
          <button type="button" aria-label="Предыдущий период" onClick={() => setOffset(offset - 1)}>‹</button>
          <span>{displayDate(start)} — {displayDate(end)}</span>
          <button type="button" aria-label="Следующий период" disabled={offset >= 0} onClick={() => setOffset(offset + 1)}>›</button>
        </div>
      )}
      {!validRange ? <p className="statistics-hint">Укажите корректный период: дата начала должна быть раньше даты конца.</p> : <>
        <div className="statistics-card">
          <h3>Приёмы по расписанию</h3>
          <div className="statistics-grid">
            <div><strong>{stats.completed}</strong><span>Выполнено</span></div>
            <div><strong>{stats.missed}</strong><span>Пропущено</span></div>
          </div>
          <div className="statistics-progress" role="img" aria-label={adherence === null ? "Нет завершённых приёмов" : `Выполнено ${adherence}% приёмов`}>
            <div style={{ width: `${adherence ?? 0}%` }} />
          </div>
          <p>{adherence === null ? "Пока нет завершённых приёмов" : `Выполнено ${adherence}% приёмов`}</p>
          {stats.planned > 0 && <p>Ещё запланировано сегодня: {stats.planned}</p>}
        </div>
        <div className="statistics-card">
          <h3>Приступы</h3>
          <div className="statistics-total"><strong>{totalAttacks}</strong><span>За выбранный период</span></div>
          <div className="statistics-severities">
            <div><span className="severity-dot light" />Лёгкие <b>{stats.attackCounts.light}</b></div>
            <div><span className="severity-dot medium" />Средние <b>{stats.attackCounts.medium}</b></div>
            <div><span className="severity-dot heavy" />Тяжёлые <b>{stats.attackCounts.heavy}</b></div>
          </div>
          {totalAttacks > 0 && <p>Дней с приступами: {stats.attackDays}</p>}
        </div>
        <p className="statistics-hint">Учитываются записи текущего расписания с даты их создания. Удалённые записи в статистику не входят.</p>
      </>}
      <DatePickerModal
        isOpen={datePicker !== null}
        value={datePicker === "start" ? customStart : customEnd}
        onChange={datePicker === "start" ? setCustomStart : setCustomEnd}
        onClose={() => setDatePicker(null)}
        showQuickSelection={false}
        title={datePicker === "start" ? "Дата начала" : "Дата конца"}
      />
    </section>
  );
}
