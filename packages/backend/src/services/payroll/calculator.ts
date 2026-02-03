import { ClockEvent, ClockType, AnomalyType, PayrollAnomaly } from '@prisma/client';
import { WorkSession, DailyHours, CalculationResult } from './types';

// Constants
const MS_PER_HOUR = 1000 * 60 * 60;
const STANDARD_WORK_DAY_HOURS = 8.0;
const OT_MULTIPLIER = 1.5;

export class PayrollCalculator {

  /**
   * Main entry point to calculate payroll for a single user given their events and rate.
   */
  public calculatePayrollForUser(
    userId: string,
    events: ClockEvent[],
    hourlyRate: number
  ): CalculationResult {
    // 1. Group raw events into logical sessions (IN-OUT pairs)
    const sessions = this.groupEventsIntoSessions(events);

    // 2. Aggregate sessions into daily buckets and apply overtime rules
    const dailyBreakdown = this.calculateDailyHours(sessions);

    // 3. Compute totals
    let totalRegularHours = 0;
    let totalOvertimeHours = 0;
    let totalHours = 0;
    let shiftCount = 0;
    const allAnomalies: Partial<PayrollAnomaly>[] = [];

    dailyBreakdown.forEach(day => {
      totalRegularHours += day.regularHours;
      totalOvertimeHours += day.overtimeHours;
      totalHours += day.totalHours;

      if (day.totalHours > 0) {
        shiftCount++;
      }

      // Collect anomalies from sessions in this day
      day.sessions.forEach(session => {
        if (session.anomaly) {
          allAnomalies.push({
            type: session.anomaly,
            date: session.inEvent ? session.inEvent.timestamp : (session.outEvent?.timestamp || new Date()),
            description: this.getAnomalyDescription(session),
            clockEventId: session.inEvent?.id || session.outEvent?.id
          });
        }
      });

      // Also add day-level anomalies if any (like EXCESSIVE_HOURS)
      day.anomalies.forEach(anomalyType => {
        // Avoid duplicates if already added from session
         if (!day.sessions.some(s => s.anomaly === anomalyType)) {
             allAnomalies.push({
                 type: anomalyType,
                 date: new Date(day.date),
                 description: `Day ${day.date}: ${anomalyType}`,
             });
         }
      });
    });

    const grossPay = (totalRegularHours * hourlyRate) + (totalOvertimeHours * hourlyRate * OT_MULTIPLIER);

    return {
      userId,
      totalRegularHours,
      totalOvertimeHours,
      totalHours,
      grossPay,
      shiftCount,
      dailyBreakdown,
      anomalies: allAnomalies,
      hasAnomalies: allAnomalies.length > 0
    };
  }

  /**
   * Pairs IN/OUT events. Handles missing punches.
   */
  private groupEventsIntoSessions(events: ClockEvent[]): WorkSession[] {
    const sortedEvents = [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const sessions: WorkSession[] = [];

    let currentSession: Partial<WorkSession> | null = null;

    for (const event of sortedEvents) {
      if (event.type === ClockType.IN) {
        if (currentSession) {
          // Anomaly: Double IN. We close the previous one as MISSING_OUT and start new.
          currentSession.isValid = false;
          currentSession.anomaly = AnomalyType.MISSING_OUT;
          currentSession.duration = 0;
          sessions.push(currentSession as WorkSession);
        }

        currentSession = {
          inEvent: event,
          outEvent: null,
          duration: 0,
          isValid: true
        };
      } else if (event.type === ClockType.OUT) {
        if (currentSession) {
          // Normal close
          currentSession.outEvent = event;
          currentSession.duration = event.timestamp.getTime() - currentSession.inEvent!.timestamp.getTime();

          // Sanity check: negative duration? (Shouldn't happen due to sort)
          if (currentSession.duration < 0) currentSession.duration = 0;

          sessions.push(currentSession as WorkSession);
          currentSession = null;
        } else {
          // Anomaly: OUT without IN
          sessions.push({
            inEvent: null as any, // Only for type, logic handles check
            outEvent: event,
            duration: 0,
            isValid: false,
            anomaly: AnomalyType.MISSING_IN
          });
        }
      }
    }

    // Handle dangling session
    if (currentSession) {
      currentSession.isValid = false;
      currentSession.anomaly = AnomalyType.MISSING_OUT;
      currentSession.duration = 0;
      sessions.push(currentSession as WorkSession);
    }

    return sessions;
  }

  /**
   * Aggregates sessions by day (based on IN time).
   */
  private calculateDailyHours(sessions: WorkSession[]): DailyHours[] {
    const daysMap = new Map<string, WorkSession[]>();

    for (const session of sessions) {
        if (!session.inEvent && !session.outEvent) continue;

        // Use IN time for date, fallback to OUT time if missing IN
        const refDate = session.inEvent ? session.inEvent.timestamp : session.outEvent!.timestamp;
        const dateKey = refDate.toISOString().split('T')[0]; // YYYY-MM-DD

        if (!daysMap.has(dateKey)) {
            daysMap.set(dateKey, []);
        }
        daysMap.get(dateKey)!.push(session);
    }

    const result: DailyHours[] = [];

    daysMap.forEach((dailySessions, date) => {
        let totalMs = 0;
        const anomalies: AnomalyType[] = [];

        for (const s of dailySessions) {
            if (s.isValid) {
                totalMs += s.duration;
            } else if (s.anomaly) {
                // If invalid session, we don't add duration but we note the anomaly
                // anomalies.push(s.anomaly); // Already captured in session
            }
        }

        const totalHours = totalMs / MS_PER_HOUR;

        // Overtime Calculation (Simple > 8h rule)
        let regularHours = totalHours;
        let overtimeHours = 0;

        if (totalHours > STANDARD_WORK_DAY_HOURS) {
            regularHours = STANDARD_WORK_DAY_HOURS;
            overtimeHours = totalHours - STANDARD_WORK_DAY_HOURS;
        }

        // Day-level anomalies
        if (totalHours > 16) {
            anomalies.push(AnomalyType.EXCESSIVE_HOURS);
        }

        result.push({
            date,
            totalHours,
            regularHours,
            overtimeHours,
            sessions: dailySessions,
            anomalies
        });
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  private getAnomalyDescription(session: WorkSession): string {
      if (session.anomaly === AnomalyType.MISSING_OUT) {
          return `Clock IN at ${session.inEvent?.timestamp.toISOString()} has no matching OUT.`;
      }
      if (session.anomaly === AnomalyType.MISSING_IN) {
          return `Clock OUT at ${session.outEvent?.timestamp.toISOString()} has no matching IN.`;
      }
      return `Anomaly detected: ${session.anomaly}`;
  }
}
