export const ROLES = {
  ADMIN: 'admin',
  KURIKULUM: 'kurikulum',
  PENILAI: 'penilai',
  GURU: 'guru',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<RoleName, string> = {
  admin: 'Administrator',
  kurikulum: 'Waka Kurikulum',
  penilai: 'Penilai/Supervisor',
  guru: 'Guru',
};
