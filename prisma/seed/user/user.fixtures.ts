import type { Prisma } from '@prisma/client';

const ROLE_USER = 'ROLE_USER';
const ROLE_ADMIN = 'ROLE_ADMIN';
const ROLE_MODERATOR = 'ROLE_MODERATEUR';

const USER_STATUS_INACTIVE = 0;
const USER_STATUS_ACTIVE = 1;

const DEV_USER_COUNT = 30;
const TEST_USER_COUNT_BY_ROLE = 10;
const ACTIVATION_RAW_TOKEN = 'valid-activation-token-123';

type UserFixtureInput = {
  firstname?: string | null;
  lastname?: string | null;
  username: string;
  email: string;
  password: string;
  roles?: string[];
  status?: number;
  security?: Prisma.InputJsonObject;
  activeEmail?: Prisma.InputJsonObject;
  resetPassword?: Prisma.InputJsonObject;
  preferences?: Prisma.InputJsonObject;
  avatarName?: string | null;
  nbLogin?: number;
};

export type UserFixture = Required<Omit<UserFixtureInput, 'roles' | 'security' | 'activeEmail' | 'resetPassword' | 'preferences'>> & {
  roles: string[];
  security: Prisma.InputJsonObject;
  activeEmail: Prisma.InputJsonObject;
  resetPassword: Prisma.InputJsonObject;
  preferences: Prisma.InputJsonObject;
};

export function buildDevUsers(): UserFixture[] {
  const users: UserFixtureInput[] = [
    {
      firstname: 'Eddy',
      lastname: 'Neller',
      username: 'venom',
      password: 'userVenom1@',
      email: 'venom@en-develop.fr',
      avatarName: 'mxqvlpbpkx5gn3hm9r4e6pyo740ik4jj.jpg',
      roles: [ROLE_ADMIN]
    },
    {
      firstname: 'Marine',
      username: 'marine',
      password: 'user_marine',
      email: 'marine@en-develop.fr',
      roles: [ROLE_MODERATOR]
    },
    {
      firstname: 'Anna',
      username: 'anna',
      password: 'user_anna',
      email: 'anna@en-develop.fr'
    }
  ];

  for (let index = 1; index <= DEV_USER_COUNT; index += 1) {
    users.push({
      firstname: `User${index}`,
      lastname: 'Fixture',
      username: `user_${index}`,
      password: `user_${index}`,
      email: `user_${index}@fixtures.en-develop.fr`
    });
  }

  return users.map(withUserDefaults);
}

export function buildTestUsers(): UserFixture[] {
  const users: UserFixtureInput[] = [
    {
      username: 'user_admin',
      password: 'user_admin',
      email: 'user_admin@en-develop.fr',
      roles: [ROLE_ADMIN]
    },
    {
      username: 'user_moder',
      password: 'user_moder',
      email: 'user_moder@en-develop.fr',
      roles: [ROLE_MODERATOR]
    },
    {
      username: 'user_member',
      password: 'user_member',
      email: 'user_member@en-develop.fr'
    }
  ];

  for (let index = 1; index <= TEST_USER_COUNT_BY_ROLE; index += 1) {
    users.push({
      username: `user_admin_${index}`,
      password: `user_admin_${index}`,
      email: `user_admin_${index}@en-develop.fr`,
      roles: [ROLE_ADMIN]
    });
  }

  for (let index = 1; index <= TEST_USER_COUNT_BY_ROLE; index += 1) {
    users.push({
      username: `user_moder_${index}`,
      password: `user_moder_${index}`,
      email: `user_moder_${index}@en-develop.fr`,
      roles: [ROLE_MODERATOR]
    });
  }

  for (let index = 1; index <= TEST_USER_COUNT_BY_ROLE; index += 1) {
    users.push({
      username: `user_member_${index}`,
      password: `user_member_${index}`,
      email: `user_member_${index}@en-develop.fr`
    });
  }

  users.push({
    username: 'user_activation',
    password: 'user_activation',
    email: 'user_activation@en-develop.fr',
    status: USER_STATUS_INACTIVE,
    activeEmail: {
      mailSent: 0,
      token: ACTIVATION_RAW_TOKEN,
      tokenTtl: tenYearsFromNowTimestamp(),
      lastAttempt: null
    },
    resetPassword: {
      mailSent: 0,
      token: ACTIVATION_RAW_TOKEN,
      tokenTtl: tenYearsFromNowTimestamp()
    }
  });

  return users.map((user) =>
    withUserDefaults({
      firstname: user.firstname ?? 'Test',
      lastname: user.lastname ?? 'Fixture',
      avatarName: user.avatarName ?? 'avatar.png',
      ...user
    })
  );
}

function withUserDefaults(user: UserFixtureInput): UserFixture {
  return {
    firstname: user.firstname ?? null,
    lastname: user.lastname ?? null,
    username: user.username,
    email: user.email,
    password: user.password,
    roles: user.roles ?? [ROLE_USER],
    status: user.status ?? USER_STATUS_ACTIVE,
    security: user.security ?? {
      totalWrongPassword: 0,
      totalWrongTwoFactorCode: 0,
      totalTwoFactorSmsSent: 0
    },
    activeEmail: user.activeEmail ?? {
      mailSent: 0,
      token: null,
      tokenTtl: null,
      lastAttempt: null
    },
    resetPassword: user.resetPassword ?? {
      mailSent: 0,
      token: null,
      tokenTtl: null
    },
    preferences: user.preferences ?? {
      lang: 'fr'
    },
    avatarName: user.avatarName ?? null,
    nbLogin: user.nbLogin ?? 0
  };
}

function tenYearsFromNowTimestamp(): number {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() + 10);

  return Math.floor(date.getTime() / 1000);
}
