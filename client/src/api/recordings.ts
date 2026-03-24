import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Recording } from '../types';

export async function getRecordings() {
  return apiGet<Recording[]>('/api/recordings');
}

export async function saveRecording(recording: Recording) {
  return apiPost('/api/recordings', recording);
}

export async function deleteRecording(id: string) {
  return apiDelete(`/api/recordings/${id}`);
}

export async function updateRecordingJournal(id: string, journalNote: string) {
  return apiPut(`/api/recordings/${id}/journal`, { journalNote });
}
