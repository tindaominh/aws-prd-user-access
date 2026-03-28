export type roleName = 'read-only' | 'power-user' | 'admin';

interface UserInfo {
  email: string;
  roles: {
    production: roleName[];
  };
}

export const users: UserInfo[] = [
  {
    email: 'huyen99.nguyenthanh@gmail.com',
    roles: {
      production: ['read-only', 'power-user'],
    },
  },
];
