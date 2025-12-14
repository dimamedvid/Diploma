import { login, register, me } from '../authService';

describe('authService (register/login/me)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('register sends POST /api/auth/register with JSON body', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: 't', user: { id: '1' } }),
    });

    await register({ login: 'user123', firstName: 'A', lastName: 'B', email: 'a@a.com', password: 'Passw0rd' });

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toMatch(/http:\/\/localhost:4000\/api\/auth\/register$/);
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(opts.body)).toEqual({
      login: 'user123',
      firstName: 'A',
      lastName: 'B',
      email: 'a@a.com',
      password: 'Passw0rd',
    });
  });

  test('login throws Error(message) when response not ok', async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Невірний логін або пароль.' }),
    });

    await expect(login({ login: 'user123', password: 'wrong' })).rejects.toThrow(
      'Невірний логін або пароль.'
    );
  });

  test('me sends Authorization Bearer token', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: '1' } }),
    });

    await me('TOKEN123');

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toMatch(/http:\/\/localhost:4000\/api\/auth\/me$/);
    expect(opts.headers.Authorization).toBe('Bearer TOKEN123');
  });
});
