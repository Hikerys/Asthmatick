package app.asthma.tick;

import static app.asthma.tick.ScheduleRules.Status.*;
import static org.junit.Assert.*;

import java.time.*;
import org.junit.Test;

public class ScheduleRulesTest {
  private final LocalDate date = LocalDate.of(2026, 10, 23);
  @Test
  public void completionWindowIncludesBothBoundaryMinutes() {
    assertEquals(EARLY, ScheduleRules.status(LocalTime.of(8, 0), date, date.atTime(6, 59), false));
    assertEquals(
        AVAILABLE, ScheduleRules.status(LocalTime.of(8, 0), date, date.atTime(7, 0), false));
    assertEquals(
        AVAILABLE, ScheduleRules.status(LocalTime.of(8, 0), date, date.atTime(9, 0), false));
    assertEquals(MISSED, ScheduleRules.status(LocalTime.of(8, 0), date, date.atTime(9, 1), false));
  }
  @Test
  public void historicalAndFutureDatesCannotBeCompleted() {
    assertEquals(MISSED,
        ScheduleRules.status(LocalTime.of(23, 30), date.minusDays(1), date.atTime(0, 0), false));
    assertEquals(EARLY,
        ScheduleRules.status(LocalTime.of(0, 30), date.plusDays(1), date.atTime(23, 59), false));
  }
  @Test
  public void completionRemainsCompletedAfterWindowAndOnNextDay() {
    assertEquals(COMPLETED,
        ScheduleRules.status(LocalTime.of(8, 0), date, date.plusDays(1).atTime(9, 0), true));
  }
}
