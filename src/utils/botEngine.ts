/**
 * Solo Bot Practice Engine
 * Implements intelligent human-like Hand Cricket AI heuristics
 */

export type BotDifficulty = 'rookie' | 'pro' | 'legend';

export class HandCricketBot {
  public difficulty: BotDifficulty;

  constructor(difficulty: BotDifficulty = 'pro') {
    this.difficulty = difficulty;
  }

  /**
   * Decide bot's pick based on game context and psychological patterns
   */
  public makePick(
    isBotBatting: boolean,
    target: number | null,
    currentRuns: number,
    ballsLeft: number | null,
    playerHistory: number[],
    recentBalls: number[]
  ): number {
    if (this.difficulty === 'rookie') {
      // Rookie: mostly random with a slight bias towards middle numbers 2, 3, 4
      const roll = Math.random();
      if (roll < 0.15) return 0;
      return Math.floor(Math.random() * 6) + 1; // 1..6
    }

    if (this.difficulty === 'pro') {
      // Pro: adapts to player tendencies and situational math
      if (isBotBatting) {
        // In 2nd innings, calculate needed runs
        if (target !== null && ballsLeft !== null && ballsLeft > 0) {
          const needed = target - currentRuns;
          if (needed <= 2) return 1;
          if (needed <= 4 && Math.random() < 0.5) return 2;
          if (needed > ballsLeft * 4) {
            // High risk needed! Go for 4s or 6s
            return Math.random() < 0.5 ? 4 : 6;
          }
        }

        // Avoid repeating the number player just bowled if player is a repeater
        const lastPlayerPick = playerHistory[playerHistory.length - 1];
        if (lastPlayerPick !== undefined && Math.random() < 0.4) {
          // Player might repeat or counter
          const safeNumbers = [0, 1, 2, 3, 4, 5, 6].filter((n) => n !== lastPlayerPick);
          return safeNumbers[Math.floor(Math.random() * safeNumbers.length)];
        }

        // Mix up defensive 0 with boundaries
        const roll = Math.random();
        if (roll < 0.12) return 0; // occasional defensive dot
        if (roll < 0.40) return 4;
        if (roll < 0.65) return 6;
        if (roll < 0.85) return 2;
        return 1;
      } else {
        // Bot is Bowling: try to read the human batter
        if (playerHistory.length > 0) {
          const lastPlayerPick = playerHistory[playerHistory.length - 1];
          // Humans frequently avoid picking the exact same number twice in a row
          // But when chasing big runs, humans love 4 and 6
          if (Math.random() < 0.45) {
            return Math.random() < 0.5 ? 4 : 6;
          }
          // Predict player will change from previous pick
          const candidates = [1, 2, 3, 4, 5, 6].filter((n) => n !== lastPlayerPick);
          return candidates[Math.floor(Math.random() * candidates.length)];
        }
        return [1, 2, 3, 4, 6][Math.floor(Math.random() * 5)];
      }
    }

    // Legend: High psychological modeling and counters
    if (isBotBatting) {
      if (recentBalls.length >= 2) {
        // Counter bowler patterns
        const lastBowler = recentBalls[recentBalls.length - 1];
        if (lastBowler === 6 || lastBowler === 4) {
          // Bowler likely to stay aggressive or switch to 0
          return Math.random() < 0.3 ? 0 : [1, 2, 3][Math.floor(Math.random() * 3)];
        }
      }
      return [0, 1, 2, 3, 4, 6][Math.floor(Math.random() * 6)];
    } else {
      // Legend Bowling: hunts for player repeats or popular numbers
      if (playerHistory.length >= 2) {
        const last = playerHistory[playerHistory.length - 1];
        const prev = playerHistory[playerHistory.length - 2];
        if (last === prev) {
          // Human is unlikely to do 3 in a row
          return [1, 2, 4, 6].find((n) => n !== last) || 3;
        }
      }
      return Math.random() < 0.35 ? 4 : Math.random() < 0.6 ? 6 : Math.floor(Math.random() * 7);
    }
  }
}
