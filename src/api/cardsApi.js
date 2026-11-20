import { API_URL } from "./apiConfig.js";

const ENDPOINT = `${API_URL}/cards`;

export async function getCards() {
    const response = await fetch(ENDPOINT);
    if(!response.ok) throw new Error('Error al obtener las cartas');
    return await response.json();
}

export async function postCard(card) {
    const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card)
    });
    if (!response.ok) throw new Error('Error al crear la carta');
    return await response.json();
}

export async function putCard(card, id) {
    const response = await fetch(`${ENDPOINT}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card)
    });
    if (!response.ok) throw new Error('Error al actualizar carta');
    return await response.json();
}

export async function patchCard(data, id) {
    const response = await fetch(`${ENDPOINT}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al modificar el estado de la carta');
    return await response.json();
}

export async function deleteCard(id) {
    const response = await fetch(`${ENDPOINT}/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar carta');
    return await response.json();
}