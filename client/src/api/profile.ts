import { apiGet, apiPut, apiPost } from './client';
import type { PlayerProfile } from '../types';

export async function getProfile() {
  return apiGet<PlayerProfile>('/api/profile');
}

export async function updateProfile(updates: Partial<PlayerProfile>) {
  return apiPut('/api/profile', updates);
}

export async function updateProfileAfterGame(profile: PlayerProfile) {
  return apiPost('/api/profile/xp', profile);
}
