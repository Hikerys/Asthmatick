package app.asthma.tick;

import java.time.*;

final class ScheduleRules {
  enum Status { COMPLETED, MISSED, EARLY, AVAILABLE }
  // Preserve the original calendar-day rule, including midnight boundaries.
  static Status status(LocalTime time, LocalDate date, LocalDateTime now, boolean completed) {
    if (completed)
      return Status.COMPLETED;
    int day = date.compareTo(now.toLocalDate());
    if (day < 0)
      return Status.MISSED;
    if (day > 0)
      return Status.EARLY;
    int delta = now.getHour() * 60 + now.getMinute() - time.getHour() * 60 - time.getMinute();
    return delta > 60 ? Status.MISSED : delta < -60 ? Status.EARLY : Status.AVAILABLE;
  }
}
