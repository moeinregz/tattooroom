export function getVoterId() {
  let id = '';
  try {
    id = localStorage.getItem('tattooroom_voter_id') || '';
  } catch {
    return 'v-temp';
  }
  if (!id) {
    id = `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    try {
      localStorage.setItem('tattooroom_voter_id', id);
    } catch {
      /* ignore storage errors (private mode etc.) */
    }
  }
  return id;
}
