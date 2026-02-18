import { supabase } from '@/services/supabase';

export interface UserInfo {
  id: string;
  displayName: string;
  email: string;
  role: string;
  createdAt: string;
}

export async function getAllUsers(): Promise<UserInfo[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, email, role, created_at')
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    displayName: row.display_name ?? '',
    email: row.email ?? '',
    role: row.role ?? 'member',
    createdAt: row.created_at,
  }));
}

export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}
