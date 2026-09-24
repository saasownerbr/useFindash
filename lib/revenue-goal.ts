export interface GoalPace {
  /** Share of the goal reached, 0–100 (capped). */
  percentage: number;
  remaining: number;
  /** Days left in the month, counting today. */
  daysLeft: number;
  /** Revenue needed per remaining day to hit the goal (0 once it is hit). */
  dailyNeeded: number;
  /** Month-end revenue if the average so far holds. */
  projection: number;
}

/** Pace of the current month against the revenue goal, measured on the calendar day of `now`. */
export function goalPace(revenue: number, goal: number, now: Date = new Date()): GoalPace {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysLeft = daysInMonth - dayOfMonth + 1;
  const remaining = Math.max(0, goal - revenue);
  return {
    percentage: goal > 0 ? Math.min(100, (revenue / goal) * 100) : 0,
    remaining,
    daysLeft,
    dailyNeeded: remaining / daysLeft,
    projection: (revenue / dayOfMonth) * daysInMonth,
  };
}
