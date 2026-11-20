import { API_URL } from "./apiConfig.js";

const ENDPOINT = `${API_URL}/players`;

export async function getPlayers() {
    const response = await fetch(ENDPOINT);
    if (!response.ok) throw new Error('Error al obtener jugadores');
    return await response.json();
}

export async function postPlayer(player) {
    const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type': 'application/json' },
        body: JSON.stringify(player)
    });
    if (!response.ok) throw new Error('Error al registrar jugador');
    return await response.json();
}

export async function putPlayer(player, id) {
  const response = await fetch(`${ENDPOINT}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(player)
  });
  if (!response.ok) throw new Error('Error al actualizar el jugador');
  return await response.json();
}