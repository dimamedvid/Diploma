const request = require('supertest');
const express = require('express');

jest.mock('../utils/fileDb', () => ({
  readUsers: jest.fn(),
  writeUsers: jest.fn(),
}));

jest.mock('../utils/jwt', () => ({
  signToken: jest.fn(() => 'TEST_TOKEN'),
  verifyToken: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(async () => 'HASHED_PASSWORD'),
  compare: jest.fn(async () => true),
}));

const { readUsers, writeUsers } = require('../utils/fileDb');
const { signToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs');

const authRoutes = require('../routes/auth.routes');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
}

describe('Auth API: register/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    test('400 if any required field is missing', async () => {
      readUsers.mockReturnValue([]);

      const res = await request(makeApp())
        .post('/api/auth/register')
        .send({ login: 'user1' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/заповніть усі/i);
      expect(writeUsers).not.toHaveBeenCalled();
    });

    test('400 if login is invalid (must be 4-25 латиниця/цифри)', async () => {
      readUsers.mockReturnValue([]);

      const res = await request(makeApp())
        .post('/api/auth/register')
        .send({
          login: 'a!',
          firstName: 'Dmytro',
          lastName: 'Medvid',
          email: 'test@mail.com',
          password: 'Passw0rd',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/логін/i);
    });

    test('400 if email is invalid', async () => {
      readUsers.mockReturnValue([]);

      const res = await request(makeApp())
        .post('/api/auth/register')
        .send({
          login: 'user123',
          firstName: 'Dmytro',
          lastName: 'Medvid',
          email: 'not-an-email',
          password: 'Passw0rd',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/email/i);
    });

    test('400 if password is invalid (8-20, at least 1 letter and 1 digit)', async () => {
      readUsers.mockReturnValue([]);

      const res = await request(makeApp())
        .post('/api/auth/register')
        .send({
          login: 'user123',
          firstName: 'Dmytro',
          lastName: 'Medvid',
          email: 'test@mail.com',
          password: 'password',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/пароль/i);
    });

    test('409 if login already exists (case-insensitive)', async () => {
      readUsers.mockReturnValue([
        { id: '1', login: 'User123', email: 'a@a.com', passwordHash: 'x' },
      ]);

      const res = await request(makeApp())
        .post('/api/auth/register')
        .send({
          login: 'user123',
          firstName: 'Dmytro',
          lastName: 'Medvid',
          email: 'new@mail.com',
          password: 'Passw0rd',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/логін/i);
      expect(writeUsers).not.toHaveBeenCalled();
    });

    test('409 if email already exists (normalized)', async () => {
      readUsers.mockReturnValue([
        { id: '1', login: 'u1', email: 'Test@Mail.com', passwordHash: 'x' },
      ]);

      const res = await request(makeApp())
        .post('/api/auth/register')
        .send({
          login: 'user123',
          firstName: 'Dmytro',
          lastName: 'Medvid',
          email: '  test@mail.com  ',
          password: 'Passw0rd',
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/email/i);
      expect(writeUsers).not.toHaveBeenCalled();
    });

    test('200 success: stores passwordHash, returns token and user without passwordHash', async () => {
      readUsers.mockReturnValue([]);
      bcrypt.hash.mockResolvedValue('HASHED_PASSWORD');

      const payload = {
        login: 'user123',
        firstName: 'Dmytro',
        lastName: 'Medvid',
        email: 'TEST@MAIL.COM',
        password: 'Passw0rd',
      };

      const res = await request(makeApp()).post('/api/auth/register').send(payload);

      expect(res.status).toBe(200);
      expect(signToken).toHaveBeenCalled();
      expect(res.body.token).toBe('TEST_TOKEN');
      expect(res.body.user).toMatchObject({
        login: 'user123',
        firstName: 'Dmytro',
        lastName: 'Medvid',
        email: 'test@mail.com',
        role: 'user',
      });
      expect(res.body.user.passwordHash).toBeUndefined();

      expect(writeUsers).toHaveBeenCalledTimes(1);
      const savedUsers = writeUsers.mock.calls[0][0];
      expect(savedUsers).toHaveLength(1);
      expect(savedUsers[0].passwordHash).toBe('HASHED_PASSWORD');
      expect(savedUsers[0].password).toBeUndefined();
    });
  });

  describe('POST /api/auth/login', () => {
    test('400 if login or password missing', async () => {
      readUsers.mockReturnValue([]);

      const res = await request(makeApp()).post('/api/auth/login').send({ login: '' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/логін і пароль/i);
    });

    test('401 if user not found by login or email', async () => {
      readUsers.mockReturnValue([{ login: 'abc1', email: 'a@a.com', passwordHash: 'h' }]);

      const res = await request(makeApp())
        .post('/api/auth/login')
        .send({ login: 'missing', password: 'Passw0rd' });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/невірний/i);
    });

    test('401 if password mismatch', async () => {
      readUsers.mockReturnValue([
        { id: '1', login: 'user123', email: 'a@a.com', passwordHash: 'HASH' },
      ]);
      bcrypt.compare.mockResolvedValue(false);

      const res = await request(makeApp())
        .post('/api/auth/login')
        .send({ login: 'user123', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/невірний/i);
    });

    test('200 success when login by email (case-insensitive)', async () => {
      readUsers.mockReturnValue([
        {
          id: '1',
          login: 'user123',
          firstName: 'Dmytro',
          lastName: 'Medvid',
          email: 'test@mail.com',
          role: 'user',
          passwordHash: 'HASH',
        },
      ]);
      bcrypt.compare.mockResolvedValue(true);

      const res = await request(makeApp())
        .post('/api/auth/login')
        .send({ login: 'TEST@MAIL.COM', password: 'Passw0rd' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBe('TEST_TOKEN');
      expect(res.body.user).toMatchObject({
        id: '1',
        login: 'user123',
        firstName: 'Dmytro',
        lastName: 'Medvid',
        email: 'test@mail.com',
        role: 'user',
      });
      expect(res.body.user.passwordHash).toBeUndefined();
    });
  });
});
