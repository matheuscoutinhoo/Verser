export interface UserStreakInfo {
  current: number;
  longest: number;
  /** ISO date (YYYY-MM-DD) of the last day the user wrote anything. */
  lastWriteDay: string | null;
}

export interface UserStats {
  totals: {
    universes: number;
    writings: number;
    words: number;
    characters: number;
    locations: number;
    immutableLaws: number;
  };
  writingActivity: {
    today: number;
    last7Days: number;
    last30Days: number;
  };
  streak: UserStreakInfo;
  ai: {
    callsLast24h: number;
    callsTotal: number;
  };
}
