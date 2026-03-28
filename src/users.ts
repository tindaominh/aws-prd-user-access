export type roleName = 'read-only' | 'power-user' | 'admin';

interface UserInfo {
  email: string;
  roles: {
    production: roleName[];
  };
}

export const users: UserInfo[] = [
  {
    email: 'affiliate.contact@gmail.com',
    roles: {
      production: ['read-only', 'power-user'],
    },
  },
];
