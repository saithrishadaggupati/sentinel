'use server';

import { revalidatePath } from 'next/cache';

const API_BASE = 'http://localhost:3000';

export async function generateKeyAction(formData: FormData) {
  const name = formData.get('name');
  await fetch(`${API_BASE}/api/keys/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 1, name }),
  });
  revalidatePath('/keys');
}

export async function revokeKeyAction(id: number) {
  await fetch(`${API_BASE}/api/keys/${id}`, { method: 'DELETE' });
  revalidatePath('/keys');
}
