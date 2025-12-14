jest.mock('../utils/jwt', () => ({
  verifyToken: jest.fn(),
  signToken: jest.fn(),
}));

const { verifyToken } = require('../utils/jwt');
const { authMiddleware } = require('../middlewares/auth.middleware');

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('authMiddleware', () => {
  beforeEach(() => jest.clearAllMocks());

  test('401 when missing Authorization header', () => {
    const req = { headers: {} };
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('401 when token invalid', () => {
    verifyToken.mockImplementation(() => {
      throw new Error('bad token');
    });

    const req = { headers: { authorization: 'Bearer BAD' } };
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('sets req.user and calls next when token valid', () => {
    verifyToken.mockReturnValue({ id: '1', login: 'user123', role: 'user' });

    const req = { headers: { authorization: 'Bearer GOOD' } };
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(req.user).toEqual({ id: '1', login: 'user123', role: 'user' });
    expect(next).toHaveBeenCalledTimes(1);
  });
});
