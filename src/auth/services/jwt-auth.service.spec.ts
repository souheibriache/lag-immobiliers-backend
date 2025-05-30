import { Test, type TestingModule } from '@nestjs/testing'
import { JwtAuthService } from './jwt-auth.service'
import { JwtService } from '@nestjs/jwt'
import { getRepositoryToken } from '@nestjs/typeorm'
import { RefreshToken } from '../entities/refresh-token.entity'
import { UserRoles } from '../../user/enums/user-roles.enum'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { UserService } from '../../user/user.service'
import type { UserDto } from '../dto/user.dto'
import { RedisTokenTypes } from '../enums/token-types.enum'
import type { Repository } from 'typeorm'
import type { Cache } from 'cache-manager'
import Redis from 'ioredis'
import { ConfigService } from '@app/config'

jest.mock('ioredis')

describe('JwtAuthService', () => {
  let service: JwtAuthService
  let jwtService: JwtService
  let configService: ConfigService
  let userService: UserService
  let refreshTokenRepository: Repository<RefreshToken>
  let cacheService: Cache
  let redisClient: Redis

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
    verify: jest.fn(),
  }

  const mockConfigService = {
    get: jest.fn(),
  }

  const mockUserService = {
    getOneById: jest.fn(),
  }

  const mockRefreshTokenRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  }

  const mockCacheService = {
    del: jest.fn(),
  }

  const mockRedisClient = {
    set: jest.fn(),
    keys: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()

    // Mock Redis constructor
    ;(Redis as jest.MockedClass<typeof Redis>).mockImplementation(
      () => mockRedisClient as any,
    )

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheService,
        },
      ],
    }).compile()

    service = module.get<JwtAuthService>(JwtAuthService)
    jwtService = module.get<JwtService>(JwtService)
    configService = module.get<ConfigService>(ConfigService)
    userService = module.get<UserService>(UserService)
    refreshTokenRepository = module.get<Repository<RefreshToken>>(
      getRepositoryToken(RefreshToken),
    )
    cacheService = module.get<Cache>(CACHE_MANAGER)
    redisClient = (service as any).redisClient
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('generateAccessToken', () => {
    it('should generate an access token and store it in Redis', async () => {
      const user: UserDto = {
        id: 'user-id',
        metadata: {
          email: 'test@example.com',

          role: UserRoles.CLIENT,
        },
      }

      mockJwtService.signAsync.mockResolvedValue('access-token')
      mockRedisClient.set.mockResolvedValue('OK')
      mockRedisClient.keys.mockResolvedValue(['key'])

      const result = await service.generateAccessToken(user)

      expect(result).toBe('access-token')
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: user.id, metadata: user.metadata },
        expect.objectContaining({ expiresIn: expect.anything() }),
      )
      expect(mockRedisClient.set).toHaveBeenCalled()
      expect(mockRedisClient.keys).toHaveBeenCalled()
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate a refresh token and store it in Redis', async () => {
      const user: UserDto = {
        id: 'user-id',
        metadata: {
          email: 'test@example.com',
          role: UserRoles.CLIENT,
        },
      }

      const refreshToken = {
        id: 'refresh-token-id',
        user: { id: user.id },
        expires: new Date(),
        isRevoked: false,
      }

      mockRefreshTokenRepository.create.mockReturnValue(refreshToken)
      mockRefreshTokenRepository.save.mockResolvedValue(refreshToken)
      mockJwtService.signAsync.mockResolvedValue('refresh-token')
      mockRedisClient.set.mockResolvedValue('OK')
      mockRedisClient.keys.mockResolvedValue(['key'])

      const result = await service.generateRefreshToken(user)

      expect(result).toBe('refresh-token')
      expect(mockRefreshTokenRepository.create).toHaveBeenCalled()
      expect(mockRefreshTokenRepository.save).toHaveBeenCalled()
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: user.id, metadata: user.metadata, jwtId: refreshToken.id },
        expect.objectContaining({ expiresIn: expect.anything() }),
      )
      expect(mockRedisClient.set).toHaveBeenCalled()
      expect(mockRedisClient.keys).toHaveBeenCalled()
    })
  })

  describe('generateResetPasswordToken', () => {
    it('should generate a reset password token, delete existing tokens, and store the new one in Redis', async () => {
      const user: UserDto = {
        id: 'user-id',
        metadata: {
          email: 'test@example.com',
          role: UserRoles.CLIENT,
        },
      }

      mockJwtService.signAsync.mockResolvedValue('reset-password-token')
      mockRedisClient.keys.mockResolvedValueOnce(['existing-token'])
      mockCacheService.del.mockResolvedValue(undefined)
      mockRedisClient.set.mockResolvedValue('OK')
      mockRedisClient.keys.mockResolvedValueOnce(['new-token'])
      mockConfigService.get.mockImplementation((key) => {
        if (key === 'RESET_PASSWORD_SECRET_KEY') return 'reset-secret'
        if (key === 'FRONTEND_HOST') return 'https://example.com'
        return ''
      })

      const result = await service.generateResetPasswordToken(user)

      expect(result).toBe(
        'https://example.com/reset-password?token=reset-password-token',
      )
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: user.id, metadata: user.metadata },
        expect.objectContaining({
          expiresIn: expect.anything(),
          privateKey: 'reset-secret',
        }),
      )
      expect(mockRedisClient.keys).toHaveBeenCalledTimes(2)
      expect(mockCacheService.del).toHaveBeenCalled()
      expect(mockRedisClient.set).toHaveBeenCalled()
    })
  })

  describe('createRefreshToken', () => {
    it('should create a refresh token in the database', async () => {
      const user = { id: 'user-id' }
      const ttl = 604800000 // 7 days in milliseconds

      const refreshToken = {
        id: 'refresh-token-id',
        user,
        expires: expect.any(Date),
        isRevoked: false,
      }

      mockRefreshTokenRepository.create.mockReturnValue(refreshToken)
      mockRefreshTokenRepository.save.mockResolvedValue(refreshToken)

      const result = await service.createRefreshToken(user, ttl)

      expect(result).toEqual(refreshToken)
      expect(mockRefreshTokenRepository.create).toHaveBeenCalledWith({
        user,
        expires: expect.any(Date),
      })
      expect(mockRefreshTokenRepository.save).toHaveBeenCalledWith(refreshToken)
    })
  })

  describe('verifyToken', () => {
    it('should verify a token and return the payload if valid and exists in Redis', async () => {
      const token = 'valid-token'
      const payload = {
        sub: 'user-id',
        metadata: {
          role: UserRoles.CLIENT,
        },
      }

      mockJwtService.verifyAsync.mockResolvedValue(payload)
      mockRedisClient.keys.mockResolvedValue(['token-key'])

      const result = await service.verifyToken(token)

      expect(result).toEqual(payload)
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(token)
      expect(mockRedisClient.keys).toHaveBeenCalled()
    })

    it('should return null if token is valid but not found in Redis', async () => {
      const token = 'valid-token-not-in-redis'
      const payload = {
        sub: 'user-id',
        metadata: {
          role: UserRoles.CLIENT,
        },
      }

      mockJwtService.verifyAsync.mockResolvedValue(payload)
      mockRedisClient.keys.mockResolvedValue([])

      const result = await service.verifyToken(token)

      expect(result).toBeNull()
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(token)
      expect(mockRedisClient.keys).toHaveBeenCalled()
    })

    it('should return undefined if token verification fails', async () => {
      const token = 'invalid-token'

      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'))

      const result = await service.verifyToken(token)

      expect(result).toBeUndefined()
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(token)
    })
  })

  describe('resolveRefreshToken', () => {
    it('should resolve a valid refresh token and return user and payload', async () => {
      const token = 'valid-refresh-token'
      const payload = {
        sub: 'user-id',
        jwtId: 'refresh-token-id',
        metadata: {
          role: UserRoles.CLIENT,
        },
      }
      const user = {
        id: 'user-id',
        email: 'test@example.com',
      }
      const refreshToken = {
        id: 'refresh-token-id',
        user: { id: 'user-id' },
        isRevoked: false,
      }

      mockJwtService.verify.mockReturnValue(payload)
      mockRedisClient.keys.mockResolvedValue(['token-key'])
      mockRefreshTokenRepository.findOne.mockResolvedValue(refreshToken)
      mockUserService.getOneById.mockResolvedValue(user)

      const result = await service.resolveRefreshToken(token)

      expect(result).toEqual({ user, payload })
      expect(mockJwtService.verify).toHaveBeenCalledWith(token)
      expect(mockRedisClient.keys).toHaveBeenCalled()
      expect(mockRefreshTokenRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.jwtId },
      })
      expect(mockUserService.getOneById).toHaveBeenCalledWith(payload.sub)
    })

    it('should throw an error if the token is invalid (missing sub or jwtId)', async () => {
      const token = 'invalid-token'
      const payload = { metadata: { role: UserRoles.CLIENT } }

      mockJwtService.verify.mockReturnValue(payload)

      await expect(service.resolveRefreshToken(token)).rejects.toThrow(
        'Invalid refresh token !',
      )
      expect(mockJwtService.verify).toHaveBeenCalledWith(token)
    })

    it('should throw an error if the token is not found in Redis', async () => {
      const token = 'token-not-in-redis'
      const payload = {
        sub: 'user-id',
        jwtId: 'refresh-token-id',
        metadata: {
          role: UserRoles.CLIENT,
        },
      }

      mockJwtService.verify.mockReturnValue(payload)
      mockRedisClient.keys.mockResolvedValue([])

      await expect(service.resolveRefreshToken(token)).rejects.toThrow(
        'Invalid refresh token !',
      )
      expect(mockJwtService.verify).toHaveBeenCalledWith(token)
      expect(mockRedisClient.keys).toHaveBeenCalled()
    })

    it('should throw an error if the refresh token is not found in the database', async () => {
      const token = 'token-with-no-db-entry'
      const payload = {
        sub: 'user-id',
        jwtId: 'refresh-token-id',
        metadata: {
          role: UserRoles.CLIENT,
        },
      }

      mockJwtService.verify.mockReturnValue(payload)
      mockRedisClient.keys.mockResolvedValue(['token-key'])
      mockRefreshTokenRepository.findOne.mockResolvedValue(null)

      await expect(service.resolveRefreshToken(token)).rejects.toThrow(
        'Refresh token not found.',
      )
      expect(mockJwtService.verify).toHaveBeenCalledWith(token)
      expect(mockRedisClient.keys).toHaveBeenCalled()
      expect(mockRefreshTokenRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.jwtId },
      })
    })

    it('should throw an error if the refresh token is revoked', async () => {
      const token = 'revoked-token'
      const payload = {
        sub: 'user-id',
        jwtId: 'refresh-token-id',
        metadata: {
          role: UserRoles.CLIENT,
        },
      }
      const refreshToken = {
        id: 'refresh-token-id',
        user: { id: 'user-id' },
        isRevoked: true,
      }

      mockJwtService.verify.mockReturnValue(payload)
      mockRedisClient.keys.mockResolvedValue(['token-key'])
      mockRefreshTokenRepository.findOne.mockResolvedValue(refreshToken)

      await expect(service.resolveRefreshToken(token)).rejects.toThrow(
        'Refresh token revoked.',
      )
      expect(mockJwtService.verify).toHaveBeenCalledWith(token)
      expect(mockRedisClient.keys).toHaveBeenCalled()
      expect(mockRefreshTokenRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.jwtId },
      })
    })

    it('should throw an error if the user is not found', async () => {
      const token = 'token-with-no-user'
      const payload = {
        sub: 'user-id',
        jwtId: 'refresh-token-id',
        metadata: {
          role: UserRoles.CLIENT,
        },
      }
      const refreshToken = {
        id: 'refresh-token-id',
        user: { id: 'user-id' },
        isRevoked: false,
      }

      mockJwtService.verify.mockReturnValue(payload)
      mockRedisClient.keys.mockResolvedValue(['token-key'])
      mockRefreshTokenRepository.findOne.mockResolvedValue(refreshToken)
      mockUserService.getOneById.mockResolvedValue(null)

      await expect(service.resolveRefreshToken(token)).rejects.toThrow(
        'Invalid refresh token !',
      )
      expect(mockJwtService.verify).toHaveBeenCalledWith(token)
      expect(mockRedisClient.keys).toHaveBeenCalled()
      expect(mockRefreshTokenRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.jwtId },
      })
      expect(mockUserService.getOneById).toHaveBeenCalledWith(payload.sub)
    })
  })

  describe('generateEmailVerificationToken', () => {
    it('should generate an email verification token, delete existing tokens, and store the new one in Redis', async () => {
      const user: UserDto = {
        id: 'user-id',
        metadata: {
          email: 'test@example.com',
          role: UserRoles.CLIENT,
        },
      }

      mockJwtService.signAsync.mockResolvedValue('email-verification-token')
      mockRedisClient.keys.mockResolvedValueOnce(['existing-token'])
      mockCacheService.del.mockResolvedValue(undefined)
      mockRedisClient.set.mockResolvedValue('OK')
      mockRedisClient.keys.mockResolvedValueOnce(['new-token'])
      mockConfigService.get.mockImplementation((key) => {
        if (key === 'CONFIRM_ACCOUNT_SECRET_KEY') return 'confirm-secret'
        if (key === 'FRONTEND_HOST') return 'https://example.com'
        return ''
      })

      const result = await service.generateEmailVerificationToken(user)

      expect(result).toBe(
        'https://example.com/account-verification?token=email-verification-token',
      )
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: user.id, metadata: user.metadata },
        expect.objectContaining({
          expiresIn: expect.anything(),
          privateKey: 'confirm-secret',
        }),
      )
      expect(mockRedisClient.keys).toHaveBeenCalledTimes(2)
      expect(mockCacheService.del).toHaveBeenCalled()
      expect(mockRedisClient.set).toHaveBeenCalled()
    })
  })

  describe('verifyAccountValidationToken', () => {
    it('should verify an account validation token and return the payload if valid and exists in Redis', async () => {
      const token = 'valid-account-validation-token'
      const payload = {
        sub: 'user-id',
        metadata: {
          role: UserRoles.CLIENT,
        },
      }

      mockJwtService.verifyAsync.mockResolvedValue(payload)
      mockRedisClient.keys.mockResolvedValue(['token-key'])
      mockConfigService.get.mockReturnValue('confirm-secret')

      const result = await service.verifyAccountValidationToken(token)

      expect(result).toEqual(payload)
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: 'confirm-secret',
      })
      expect(mockRedisClient.keys).toHaveBeenCalled()
    })

    it('should return null if token is valid but not found in Redis', async () => {
      const token = 'valid-token-not-in-redis'
      const payload = {
        sub: 'user-id',
        metadata: {
          role: UserRoles.CLIENT,
        },
      }

      mockJwtService.verifyAsync.mockResolvedValue(payload)
      mockRedisClient.keys.mockResolvedValue([])
      mockConfigService.get.mockReturnValue('confirm-secret')

      const result = await service.verifyAccountValidationToken(token)

      expect(result).toBeNull()
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: 'confirm-secret',
      })
      expect(mockRedisClient.keys).toHaveBeenCalled()
    })
  })

  describe('verifyResetPasswordToken', () => {
    it('should verify a reset password token and return the payload if valid and exists in Redis', async () => {
      const token = 'valid-reset-password-token'
      const payload = {
        sub: 'user-id',
        metadata: {
          role: UserRoles.CLIENT,
        },
      }

      mockJwtService.verifyAsync.mockResolvedValue(payload)
      mockRedisClient.keys.mockResolvedValue(['token-key'])
      mockConfigService.get.mockReturnValue('reset-secret')

      const result = await service.verifyResetPasswordToken(token)

      expect(result).toEqual(payload)
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: 'reset-secret',
      })
      expect(mockRedisClient.keys).toHaveBeenCalled()
    })

    it('should return null if token is valid but not found in Redis', async () => {
      const token = 'valid-token-not-in-redis'
      const payload = {
        sub: 'user-id',
        metadata: {
          role: UserRoles.CLIENT,
        },
      }

      mockJwtService.verifyAsync.mockResolvedValue(payload)
      mockRedisClient.keys.mockResolvedValue([])
      mockConfigService.get.mockReturnValue('reset-secret')

      const result = await service.verifyResetPasswordToken(token)

      expect(result).toBeNull()
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: 'reset-secret',
      })
      expect(mockRedisClient.keys).toHaveBeenCalled()
    })
  })

  describe('searchTokenFromRedis', () => {
    it('should search for tokens in Redis', async () => {
      const args = {
        userId: 'user-id',
        token: 'token',
        tokenType: RedisTokenTypes.ACCESS,
      }

      mockRedisClient.keys.mockResolvedValue(['token-key'])

      const result = await service.searchTokenFromRedis(args)

      expect(result).toEqual(['token-key'])
      expect(mockRedisClient.keys).toHaveBeenCalledWith(
        `USERS/*/${args.userId}/TOKENS/${args.tokenType}/${args.token}`,
      )
    })
  })

  describe('deleteTokensFromRedis', () => {
    it('should delete tokens from Redis', async () => {
      const keys = ['token-key-1', 'token-key-2']

      mockCacheService.del.mockResolvedValue(undefined)

      await service.deleteTokensFromRedis(keys)

      expect(mockCacheService.del).toHaveBeenCalledTimes(2)
      expect(mockCacheService.del).toHaveBeenCalledWith('token-key-1')
      expect(mockCacheService.del).toHaveBeenCalledWith('token-key-2')
    })

    it('should do nothing if keys array is empty', async () => {
      const keys = []

      await service.deleteTokensFromRedis(keys)

      expect(mockCacheService.del).not.toHaveBeenCalled()
    })
  })

  describe('searchAndDeleteTokensFromRedis', () => {
    it('should search for tokens and delete them from Redis', async () => {
      const args = {
        userId: 'user-id',
        token: 'token',
        tokenType: RedisTokenTypes.ACCESS,
      }

      mockRedisClient.keys.mockResolvedValue(['token-key'])
      mockCacheService.del.mockResolvedValue(undefined)

      await service.searchAndDeleteTokensFromRedis(args)

      expect(mockRedisClient.keys).toHaveBeenCalled()
      expect(mockCacheService.del).toHaveBeenCalledWith('token-key')
    })
  })

  describe('insertTokenInRedis', () => {
    it('should insert a token in Redis', async () => {
      const args = {
        userId: 'user-id',
        role: UserRoles.CLIENT,
        token: 'token',
        tokenType: RedisTokenTypes.ACCESS,
        expiresIn: 3600000,
      }

      mockRedisClient.set.mockResolvedValue('OK')
      mockRedisClient.keys.mockResolvedValue(['token-key'])

      const result = await service.insertTokenInRedis(args)

      expect(result).toEqual(['token-key'])
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `USERS/${args.role}/${args.userId}/TOKENS/${args.tokenType}/${args.token}`,
        args.userId,
        'EX',
        args.expiresIn,
      )
      expect(mockRedisClient.keys).toHaveBeenCalled()
    })

    it('should use default token type if not provided', async () => {
      const args = {
        userId: 'user-id',
        role: UserRoles.CLIENT,
        token: 'token',
        expiresIn: 3600000,
      }

      mockRedisClient.set.mockResolvedValue('OK')
      mockRedisClient.keys.mockResolvedValue(['token-key'])

      const result = await service.insertTokenInRedis(args)

      expect(result).toEqual(['token-key'])
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `USERS/${args.role}/${args.userId}/TOKENS/${RedisTokenTypes.ACCESS}/${args.token}`,
        args.userId,
        'EX',
        args.expiresIn,
      )
      expect(mockRedisClient.keys).toHaveBeenCalled()
    })
  })
})
