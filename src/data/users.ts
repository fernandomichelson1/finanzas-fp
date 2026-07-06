import type { Usuario, UserId } from '@/types/domain';

export const USERS_SEED: Record<UserId, Usuario> = {
  fer: { id: 'fer', nombre: 'Fer', iniciales: 'FE', color: '#2563EB', rol: 'admin' },
  pao: { id: 'pao', nombre: 'Pao', iniciales: 'PA', color: '#E11D48', rol: 'admin' },
};
