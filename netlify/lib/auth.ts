import { getUser } from '@netlify/identity';

export const requireAdmin = (user: any): void => {
  if (!user || !user.roles?.includes('admin')) {
    throw new Error('Forbidden: Admin access required');
  }
};

export const getUserFromRequest = async (req: Request): Promise<any> => {
  try {
    const user = await getUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles || []
    };
  } catch (e) {
    console.error('[auth] Error in getUserFromRequest:', e);
    return null;
  }
};
