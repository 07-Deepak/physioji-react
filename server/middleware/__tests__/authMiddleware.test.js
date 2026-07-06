import jwt from 'jsonwebtoken'
import authMiddleware from '../authMiddleware.js'
import User from '../../models/User.js'

jest.mock('jsonwebtoken')
jest.mock('../../models/User.js')

describe('authMiddleware', () => {
  let req
  let res
  let next

  beforeEach(() => {
    req = { headers: {} }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    next = jest.fn()

    process.env.JWT_SECRET = 'test_secret'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 if Authorization header is missing', async () => {
    await authMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: missing token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 if Authorization header does not start with Bearer', async () => {
    req.headers.authorization = 'Token abc'

    await authMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: missing token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 500 if JWT_SECRET is not configured', async () => {
    delete process.env.JWT_SECRET
    req.headers.authorization = 'Bearer valid.token'

    await authMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'Server misconfiguration' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 with TOKEN_EXPIRED when token expired', async () => {
    req.headers.authorization = 'Bearer expired.token'

    jwt.verify.mockImplementation(() => {
      const err = new Error('expired')
      err.name = 'TokenExpiredError'
      throw err
    })

    await authMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Session expired', code: 'TOKEN_EXPIRED' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 with INVALID_TOKEN on generic jwt errors', async () => {
    req.headers.authorization = 'Bearer invalid.token'

    jwt.verify.mockImplementation(() => {
      throw new Error('bad token')
    })

    await authMiddleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized', code: 'INVALID_TOKEN' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 if user is not found', async () => {
    req.headers.authorization = 'Bearer valid.token'
    jwt.verify.mockReturnValue({ userId: '507f1f77bcf86cd799439011' })

    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    })

    await authMiddleware(req, res, next)

    expect(User.findById).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: invalid token' })
    expect(next).not.toHaveBeenCalled()
  })

  it('sets req.user and calls next() when authenticated', async () => {
    req.headers.authorization = 'Bearer valid.token'
    const userDoc = { _id: '507f1f77bcf86cd799439011', email: 'a@b.com' }

    jwt.verify.mockReturnValue({ userId: '507f1f77bcf86cd799439011' })

    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(userDoc),
    })

    await authMiddleware(req, res, next)

    expect(req.user).toBe(userDoc)
    expect(next).toHaveBeenCalledTimes(1)
  })
})

