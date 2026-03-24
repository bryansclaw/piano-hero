import { apiGet, apiPost, apiDelete } from './client';
import type { Friend } from '../types';

export async function getFriends() {
  return apiGet<Friend[]>('/api/friends');
}

export async function addFriend(username: string) {
  return apiPost<Friend>('/api/friends', { username });
}

export async function removeFriend(username: string) {
  return apiDelete(`/api/friends/${username}`);
}
