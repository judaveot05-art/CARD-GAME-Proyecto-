export async function getAdmins() {
  const response = await fetch('./src/data/db.json');
  if (!response.ok) throw new Error('Error al cargar credenciales de administrador');
  const data = await response.json();
  return data.admins || [];
}