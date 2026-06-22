import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import {
  buildDevUsers,
  buildTestUsers,
  type UserFixture,
} from "./user.fixtures";

const fixturesByGroup = {
  dev: buildDevUsers,
  test: buildTestUsers,
};

type FixtureGroup = keyof typeof fixturesByGroup;

export async function seedUsers(
  prisma: PrismaClient,
  group: string,
): Promise<void> {
  if (!isFixtureGroup(group)) {
    throw new Error(
      `Unsupported FIXTURE_GROUP "${group}". Expected "dev" or "test".`,
    );
  }

  const buildFixtures = fixturesByGroup[group];

  const fixtures = buildFixtures();

  for (const [index, userFixture] of fixtures.entries()) {
    await seedUser(prisma, userFixture, index);
  }

  console.info(`Seeded ${fixtures.length} ${group} user fixtures.`);
}

function isFixtureGroup(group: string): group is FixtureGroup {
  return Object.hasOwn(fixturesByGroup, group);
}

async function seedUser(
  prisma: PrismaClient,
  userFixture: UserFixture,
  index: number,
): Promise<void> {
  const passwordHash = await bcrypt.hash(
    userFixture.password,
    Number(process.env.BCRYPT_SALT_ROUNDS ?? 12),
  );
  const timestamps = generateTimestamps(index);

  await prisma.user.upsert({
    where: {
      email: userFixture.email,
    },
    create: {
      id: randomUUID(),
      firstname: userFixture.firstname,
      lastname: userFixture.lastname,
      username: userFixture.username,
      email: userFixture.email,
      passwordHash,
      roles: userFixture.roles,
      status: userFixture.status,
      security: userFixture.security,
      activeEmail: userFixture.activeEmail,
      resetPassword: userFixture.resetPassword,
      preferences: userFixture.preferences,
      avatarName: userFixture.avatarName,
      lastVisit: timestamps.updatedAt,
      nbLogin: userFixture.nbLogin,
      createdAt: timestamps.createdAt,
      updatedAt: timestamps.updatedAt,
    },
    update: {
      firstname: userFixture.firstname,
      lastname: userFixture.lastname,
      username: userFixture.username,
      passwordHash,
      roles: userFixture.roles,
      status: userFixture.status,
      security: userFixture.security,
      activeEmail: userFixture.activeEmail,
      resetPassword: userFixture.resetPassword,
      preferences: userFixture.preferences,
      avatarName: userFixture.avatarName,
      nbLogin: userFixture.nbLogin,
    },
  });
}

function generateTimestamps(index: number): {
  createdAt: Date;
  updatedAt: Date;
} {
  const createdAt = new Date(Date.UTC(2020, 0, 1 + index));
  const updatedAt = new Date(createdAt);
  updatedAt.setUTCDate(createdAt.getUTCDate() + 1);

  return { createdAt, updatedAt };
}
