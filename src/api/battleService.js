import { COMBAT_CONFIG } from "../utils/combatRules.js";

const DEFAULT_PROD_URL = "https://6afe2ad73a0e70bc8d532a8c.mockapi.io";

function resolveApiBaseUrl() {
  const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
  if (env.VITE_API_MODE === "development" && env.VITE_API_DEV_URL) {
    return env.VITE_API_DEV_URL;
  }
  return env.VITE_API_PROD_URL || DEFAULT_PROD_URL;
}

/**
 * Guarda la partida con el modo ("manual" | "automatic"), actualiza el puntaje
 * del jugador (+50 victoria / +10 derrota) y devuelve el leaderboard ordenado.
 */
export async function saveBattleOutcome({
  player,
  won,
  mode = "manual",
  extraBattleData = {}
}) {
  const apiBase = resolveApiBaseUrl();
  const pointsDelta = won ? COMBAT_CONFIG.winPoints : COMBAT_CONFIG.lossPoints;

  const battlePayload = {
    playerId: player.id,
    nickname: player.nickname,
    result: won ? "win" : "loss",
    pointsEarned: pointsDelta,
    mode, // "automatic" | "manual"
    createdAt: new Date().toISOString(),
    ...extraBattleData
  };

  const battleRes = await fetch(`${apiBase}/battles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(battlePayload)
  });
  if (!battleRes.ok) {
    throw new Error(`Error al guardar la batalla (${battleRes.status})`);
  }

  const nextPoints = Number(player.points ?? player.score ?? 0) + pointsDelta;
  const playerRes = await fetch(`${apiBase}/players/${player.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...player,
      points: nextPoints
    })
  });
  if (!playerRes.ok) {
    throw new Error(`Error al actualizar el jugador (${playerRes.status})`);
  }

  const leaderboardRes = await fetch(`${apiBase}/players`);
  if (!leaderboardRes.ok) {
    throw new Error(`Error al cargar el leaderboard (${leaderboardRes.status})`);
  }

  const players = await leaderboardRes.json();
  return Array.isArray(players)
    ? players.sort((a, b) => Number(b.points ?? 0) - Number(a.points ?? 0))
    : [];
}