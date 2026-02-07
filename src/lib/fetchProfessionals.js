export async function fetchProfessionals() {
  // Replace with actual API endpoint
  const response = await fetch('/api/professionals/list');
  if (!response.ok) throw new Error('Failed to fetch professionals');
  return response.json();
}
