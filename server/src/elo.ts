// ============================================================
// Multiplayer Free-For-All ELO — verbatim implementation of the
// spec provided by the user.
//
// For each player in the room, we run virtual 1v1 matchups against
// every other player. Each matchup contributes:
//   M_ij * (S_ij - E_ij)
// where E_ij = standard ELO expected score,
//       S_ij = score_i / (score_i + score_j) (continuous),
//       M_ij = ln(1.718 + |score_i - score_j| / 2000)   (margin multiplier).
// Delta_i = (K / (N-1)) * sum_j M_ij * (S_ij - E_ij), rounded.
// New rating clamped to [MIN_ELO, MAX_ELO].
// ============================================================

export const BASE_ELO = 1400;
export const MIN_ELO = 500;
export const MAX_ELO = 2500;
const K = 32;

export interface PlayerPerformance {
  id: string;
  preGameElo: number;
  finalScore: number;
}

export interface EloChangeResult {
  id: string;
  oldElo: number;
  newElo: number;
  delta: number;
}

export function calculateMultiplayerElo(players: PlayerPerformance[]): EloChangeResult[] {
  const N = players.length;

  if (N < 2) {
    return players.map((p) => ({
      id: p.id,
      oldElo: p.preGameElo,
      newElo: p.preGameElo,
      delta: 0,
    }));
  }

  return players.map((playerI) => {
    let sumMatches = 0;
    players.forEach((playerJ) => {
      if (playerI.id === playerJ.id) return;

      const Ri = playerI.preGameElo;
      const Rj = playerJ.preGameElo;
      const scoreI = playerI.finalScore;
      const scoreJ = playerJ.finalScore;

      // 1. Expected matchup score (standard ELO probability)
      const expectedScore = 1 / (1 + Math.pow(10, (Rj - Ri) / 400));

      // 2. Actual matchup score (continuous ratio)
      let actualScore = 0.5;
      if (scoreI + scoreJ > 0) {
        actualScore = scoreI / (scoreI + scoreJ);
      }

      // 3. Margin-of-victory multiplier
      const scoreDiff = Math.abs(scoreI - scoreJ);
      const multiplier = Math.log(1.718 + scoreDiff / 2000);

      sumMatches += multiplier * (actualScore - expectedScore);
    });

    const rawDelta = (K / (N - 1)) * sumMatches;
    const delta = Math.round(rawDelta);
    const oldElo = playerI.preGameElo;

    const newElo = Math.max(MIN_ELO, Math.min(MAX_ELO, oldElo + delta));
    const finalDelta = newElo - oldElo;

    return { id: playerI.id, oldElo, newElo, delta: finalDelta };
  });
}
