const STORAGE_KEY = 'naruto_battles_history';

export async function getBattles() {
  const localSaved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  try {
    const response = await fetch('./src/data/db.json');
    const data = await response.json();
    const initialBattles = data.battles || [];
    return [...initialBattles, ...localSaved];
  } catch {
    return localSaved;
  }
}

export async function postBattle(battle) {
  const localSaved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const newBattle = {
    id: Date.now().toString(),
    ...battle
  };
  localSaved.push(newBattle);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localSaved));
  return newBattle;
}