#!/usr/bin/env node
/**
 * Seed script to create the first administrator account.
 *
 * SPEC.md §2.3: pnpm seed:admin creates the first Administrator
 * - Prompts for email, nickname, and password
 * - Hashes password using Argon2id
 * - Creates account with active Admin role (is_admin = true)
 * - Safe to run multiple times (detects existing admin)
 *
 * Usage: pnpm seed:admin
 */

import { config } from 'dotenv';
import { createInterface } from 'readline';
import { stdin, stdout } from 'process';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { hashPassword } from '../src/lib/server/auth/password';
import { users } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

config({ path: '.env.local' });
config({ path: '.env' });

interface AdminCredentials {
  email: string;
  nickname: string;
  password: string;
}

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    if (!stdin.isTTY) {
      const rl = createInterface({ input: stdin, output: stdout });
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
      return;
    }

    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';

    const cleanup = () => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
    };

    const onData = (chunk: string) => {
      for (const char of chunk.toString()) {
        if (char === '\n' || char === '\r' || char === '\u0004') {
          cleanup();
          stdout.write('\n');
          resolve(password);
          return;
        }
        if (char === '\u0003') {
          cleanup();
          stdout.write('\n');
          process.exit(1);
        }
        if (char === '\u007f' || char === '\b') {
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.write('\b \b');
          }
          continue;
        }
        if (char >= ' ' && char <= '~') {
          password += char;
          stdout.write('*');
        }
      }
    };

    stdin.on('data', onData);
  });
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.toLowerCase().endsWith('@up.edu.ph');
}

function validateNickname(nickname: string): boolean {
  return /^[a-z0-9_.]{3,32}$/.test(nickname);
}

function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password must not exceed 128 characters' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
}

async function getCredentials(): Promise<AdminCredentials> {
  console.log('\n=== MEssentials Admin Account Setup ===\n');
  console.log('This script creates the first administrator account.');
  console.log('The account will have full admin access to the Admin Dashboard.\n');

  let email = '';
  while (!email) {
    email = (await prompt('Admin email (@up.edu.ph): ')).toLowerCase();
    if (!validateEmail(email)) {
      console.log('Error: Email must be a valid @up.edu.ph address');
      email = '';
    }
  }

  let nickname = '';
  while (!nickname) {
    nickname = (await prompt('Admin nickname (username, 3-32 chars, lowercase/numbers/_.): ')).toLowerCase();
    if (!validateNickname(nickname)) {
      console.log('Error: Nickname must be 3-32 characters, lowercase letters, numbers, underscore, or dot only');
      nickname = '';
    }
  }

  let password = '';
  while (!password) {
    password = await promptHidden('Admin password (min 8 chars, letter + number): ');
    const validation = validatePassword(password);
    if (!validation.valid) {
      console.log(`Error: ${validation.message}`);
      password = '';
    }
  }

  const confirmPassword = await promptHidden('Confirm password: ');
  if (password !== confirmPassword) {
    throw new Error('Passwords do not match');
  }

  return { email, nickname, password };
}

async function checkExistingAdmin(db: ReturnType<typeof drizzle>): Promise<{ exists: boolean; email?: string }> {
  const existingAdmins = await db
    .select({ email: users.email, nickname: users.username })
    .from(users)
    .where(eq(users.isAdmin, true))
    .limit(1);

  if (existingAdmins.length > 0) {
    return { exists: true, email: existingAdmins[0].email };
  }

  return { exists: false };
}

async function createAdminAccount(
  db: ReturnType<typeof drizzle>,
  credentials: AdminCredentials
): Promise<void> {
  const passwordHash = await hashPassword(credentials.password);

  await db.insert(users).values({
    id: randomUUID(),
    email: credentials.email,
    username: credentials.nickname,
    passwordHash,
    googleSub: `seed-admin-${randomUUID()}`,
    firstName: 'Admin',
    lastName: credentials.nickname,
    isActive: true,
    isEnrolled: true,
    isAdmin: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('\nAdministrator account created successfully!');
  console.log(`   Email: ${credentials.email}`);
  console.log(`   Nickname: ${credentials.nickname}`);
  console.log('   Role: Administrator (is_admin = true)');
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL_MIGRATE || process.env.DATABASE_URL_MIGRATE_DIRECT;

  if (!databaseUrl) {
    console.error('Error: DATABASE_URL_MIGRATE or DATABASE_URL_MIGRATE_DIRECT must be set');
    console.error('Configure the Supabase session pooler connection string for migrations.');
    process.exit(1);
  }

  let sql: ReturnType<typeof postgres> | null = null;

  try {
    sql = postgres(databaseUrl, {
      prepare: false,
      max: 1,
    });

    const db = drizzle(sql, { schema: { users } });

    const { exists, email } = await checkExistingAdmin(db);

    if (exists) {
      console.log('\nAn administrator account already exists.');
      console.log(`   Email: ${email}`);
      console.log('\nThis script is safe to run multiple times but will not create duplicate admins.');
      console.log('If you need to reset the admin account, delete it from the database first.\n');
      return;
    }

    const credentials = await getCredentials();
    await createAdminAccount(db, credentials);

    console.log('\nSetup complete! You can now log in at /admin/login');
    console.log('   The session will persist across application restarts.\n');
  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
    }
  }
}

main();
