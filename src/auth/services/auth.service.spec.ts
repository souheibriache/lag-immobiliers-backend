import { Test, type TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { JwtAuthService } from './jwt-auth.service'
import { getRepositoryToken } from '@nestjs/typeorm'
import { User } from '../../user/entities/user.entity'
import { RefreshToken } from '../entities/refresh-token.entity'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { UserRoles } from '../../user/enums/user-roles.enum'
import type { Repository } from 'typeorm'
import type { LoginDto } from '../dto/login.dto'
import type { VerifyAccountDto } from '../dto/verify-account-dto'
import type { RequestResetPasswordDto } from '../dto/request-reset-password.dto'
import type { ResetPasswordDto } from '../dto/reset-password.dto'
import type { UpdatePasswordDto } from '../dto/update-password.dto'
import type { RefreshTokenDto } from '../dto/refresh-token.dto'
import * as bcrypt from 'bcryptjs'
import { MailerService } from '@app/mailer'
import { ConfigService } from '@app/config'
import { Password as PasswordHistory } from '../entities/password-history'
import { SignupDto } from '../dto'
import { UpdateUserDto } from '../dto/update-profile.dto'
import { ResendVerificationEmailDto } from '../dto/resend-activation-email.dto'

jest.mock('bcrypt')

describe('AuthService', () => {
  let service: AuthService
  let jwtAuthService: JwtAuthService
  let userRepository: Repository<User>
  let refreshTokenRepository: Repository<RefreshToken>
  let passwordHistoryRepository: Repository<PasswordHistory>
  let mailerService: MailerService
  let configService: ConfigService

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    findOneBy: jest.fn(),
  }

  const mockRefreshTokenRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  }

  const mockPasswordHistoryRepository = {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  }

  const mockMailerService = {
    sendEmail: jest.fn(),
  }

  const mockConfigService = {
    get: jest.fn(),
  }

  const mockJwtAuthService = {
    generateTokens: jest.fn(),
    verifyToken: jest.fn(),
    generateToken: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtAuthService,
          useValue: mockJwtAuthService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
        },
        {
          provide: getRepositoryToken(PasswordHistory),
          useValue: mockPasswordHistoryRepository,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    jwtAuthService = module.get<JwtAuthService>(JwtAuthService)
    userRepository = module.get<Repository<User>>(getRepositoryToken(User))
    refreshTokenRepository = module.get<Repository<RefreshToken>>(
      getRepositoryToken(RefreshToken),
    )
    passwordHistoryRepository = module.get<Repository<PasswordHistory>>(
      getRepositoryToken(PasswordHistory),
    )
    mailerService = module.get<MailerService>(MailerService)
    configService = module.get<ConfigService>(ConfigService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('signUp', () => {
    const signUpDto: SignupDto = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      userName: 'johndoe',
    }

    it('should register a new user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      mockUserRepository.create.mockReturnValue({
        id: 'user-id',
        ...signUpDto,
        password: 'hashedPassword',
        role: UserRoles.CLIENT,
        isVerified: false,
        verificationToken: 'token',
      })
      mockUserRepository.save.mockResolvedValue({
        id: 'user-id',
        ...signUpDto,
        password: 'hashedPassword',
        role: UserRoles.CLIENT,
        isVerified: false,
        verificationToken: 'token',
      })
      mockConfigService.get.mockReturnValue('http://frontend.com')
      mockMailerService.sendEmail.mockResolvedValue(true)

      await service.signup(signUpDto)

      expect(mockUserRepository.findOne).toHaveBeenCalled()
      expect(bcrypt.hash).toHaveBeenCalledWith(signUpDto.password, 10)
      expect(mockUserRepository.create).toHaveBeenCalled()
      expect(mockUserRepository.save).toHaveBeenCalled()
      expect(mockMailerService.sendEmail).toHaveBeenCalled()
    })

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 'existing-user' })

      await expect(service.signup(signUpDto)).rejects.toThrow(ConflictException)
    })
  })

  describe('login', () => {
    const loginDto: LoginDto = {
      login: 'test@example.com',
      password: 'Password123!',
    }

    it('should login successfully', async () => {
      const user = {
        id: 'user-id',
        email: loginDto.login,
        password: 'hashedPassword',
        isVerified: true,
        role: UserRoles.CLIENT,
      }
      mockUserRepository.findOne.mockResolvedValue(user)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      mockJwtAuthService.generateTokens.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })

      const result = await service.login(loginDto)

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: expect.objectContaining({ id: 'user-id' }),
      })
      expect(mockUserRepository.findOne).toHaveBeenCalled()
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        user.password,
      )
      expect(mockJwtAuthService.generateTokens).toHaveBeenCalled()
    })

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null)

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should throw UnauthorizedException if password is incorrect', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 'user-id',
        email: loginDto.login,
        password: 'hashedPassword',
        isVerified: true,
      })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should throw UnauthorizedException if user is not verified', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 'user-id',
        email: loginDto.login,
        password: 'hashedPassword',
        isVerified: false,
      })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      )
    })
  })

  describe('verifyAccount', () => {
    const verifyAccountDto: VerifyAccountDto = {
      verificationToken: 'verification-token',
    }

    it('should verify account successfully', async () => {
      const user = {
        id: 'user-id',
        verificationToken: 'verification-token',
        isVerified: false,
      }
      mockUserRepository.findOne.mockResolvedValue(user)
      mockUserRepository.save.mockResolvedValue({
        ...user,
        isVerified: true,
        verificationToken: null,
      })

      await service.verifyAccount(verifyAccountDto)

      expect(mockUserRepository.findOne).toHaveBeenCalled()
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...user,
        isVerified: true,
        verificationToken: null,
      })
    })

    it('should throw NotFoundException if token is invalid', async () => {
      mockUserRepository.findOne.mockResolvedValue(null)

      await expect(service.verifyAccount(verifyAccountDto)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('requestResetPassword', () => {
    const requestResetPasswordDto: RequestResetPasswordDto = {
      login: 'test@example.com',
    }

    it('should request password reset successfully', async () => {
      const user = {
        id: 'user-id',
        email: requestResetPasswordDto.login,
        isVerified: true,
      }
      mockUserRepository.findOne.mockResolvedValue(user)
      mockUserRepository.save.mockResolvedValue({
        ...user,
        resetPasswordToken: 'reset-token',
      })
      mockConfigService.get.mockReturnValue('http://frontend.com')
      mockMailerService.sendEmail.mockResolvedValue(true)

      await service.requestResetPassword(requestResetPasswordDto)

      expect(mockUserRepository.findOne).toHaveBeenCalled()
      expect(mockUserRepository.save).toHaveBeenCalled()
      expect(mockMailerService.sendEmail).toHaveBeenCalled()
    })

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null)

      await expect(
        service.requestResetPassword(requestResetPasswordDto),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('resetPassword', () => {
    const resetPasswordDto: ResetPasswordDto = {
      token: 'reset-token',
      password: 'NewPassword123!',
    }

    it('should reset password successfully', async () => {
      const user = {
        id: 'user-id',
        resetPasswordToken: 'reset-token',
      }
      mockUserRepository.findOne.mockResolvedValue(user)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword')
      mockPasswordHistoryRepository.create.mockReturnValue({
        userId: user.id,
        password: 'newHashedPassword',
      })
      mockUserRepository.save.mockResolvedValue({
        ...user,
        password: 'newHashedPassword',
        resetPasswordToken: null,
      })

      await service.resetPassword(resetPasswordDto)

      expect(mockUserRepository.findOne).toHaveBeenCalled()
      expect(bcrypt.hash).toHaveBeenCalledWith(resetPasswordDto.password, 10)
      expect(mockPasswordHistoryRepository.create).toHaveBeenCalled()
      expect(mockPasswordHistoryRepository.save).toHaveBeenCalled()
      expect(mockUserRepository.save).toHaveBeenCalled()
    })

    it('should throw NotFoundException if token is invalid', async () => {
      mockUserRepository.findOne.mockResolvedValue(null)

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('updatePassword', () => {
    const updatePasswordDto: UpdatePasswordDto = {
      oldPassword: 'CurrentPassword123!',
      newPassword: 'NewPassword123!',
    }
    const userId = 'user-id'

    it('should update password successfully', async () => {
      const user = {
        id: userId,
        password: 'hashedCurrentPassword',
      }
      mockUserRepository.findOne.mockResolvedValue(user)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword')
      mockPasswordHistoryRepository.find.mockResolvedValue([])
      mockPasswordHistoryRepository.create.mockReturnValue({
        userId: user.id,
        password: 'newHashedPassword',
      })
      mockUserRepository.save.mockResolvedValue({
        ...user,
        password: 'newHashedPassword',
      })

      await service.updatePassword(userId, updatePasswordDto)

      expect(mockUserRepository.findOne).toHaveBeenCalled()
      expect(bcrypt.compare).toHaveBeenCalledWith(
        updatePasswordDto.oldPassword,
        user.password,
      )
      expect(bcrypt.hash).toHaveBeenCalledWith(
        updatePasswordDto.newPassword,
        10,
      )
      expect(mockPasswordHistoryRepository.find).toHaveBeenCalled()
      expect(mockPasswordHistoryRepository.create).toHaveBeenCalled()
      expect(mockPasswordHistoryRepository.save).toHaveBeenCalled()
      expect(mockUserRepository.save).toHaveBeenCalled()
    })

    it('should throw UnauthorizedException if current password is incorrect', async () => {
      const user = {
        id: userId,
        password: 'hashedCurrentPassword',
      }
      mockUserRepository.findOne.mockResolvedValue(user)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(
        service.updatePassword(userId, updatePasswordDto),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should throw BadRequestException if new password was used recently', async () => {
      const user = {
        id: userId,
        password: 'hashedCurrentPassword',
      }
      mockUserRepository.findOne.mockResolvedValue(user)
      ;(bcrypt.compare as jest.Mock).mockImplementation((pass, hash) => {
        if (pass === updatePasswordDto.oldPassword && hash === user.password)
          return Promise.resolve(true)
        if (pass === updatePasswordDto.newPassword) return Promise.resolve(true)
        return Promise.resolve(false)
      })
      mockPasswordHistoryRepository.find.mockResolvedValue([
        { password: 'recentlyUsedPassword1' },
        { password: 'recentlyUsedPassword2' },
      ])

      await expect(
        service.updatePassword(userId, updatePasswordDto),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('updateUserProfile', () => {
    const updateProfileDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'User',
    }
    const userId = 'user-id'

    it('should update profile successfully', async () => {
      const user = {
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '1234567890',
      }
      mockUserRepository.findOne.mockResolvedValue(user)
      mockUserRepository.save.mockResolvedValue({
        ...user,
        ...updateProfileDto,
      })

      const result = await service.updateUserProfile(userId, updateProfileDto)

      expect(result).toEqual({
        ...user,
        ...updateProfileDto,
      })
      expect(mockUserRepository.findOne).toHaveBeenCalled()
      expect(mockUserRepository.save).toHaveBeenCalled()
    })

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null)

      await expect(
        service.updateUserProfile(userId, updateProfileDto),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('resendVerificationEmail', () => {
    const resendActivationEmailDto: ResendVerificationEmailDto = {
      email: 'test@example.com',
    }

    it('should resend activation email successfully', async () => {
      const user = {
        id: 'user-id',
        email: resendActivationEmailDto.email,
        isVerified: false,
        verificationToken: 'verification-token',
      }
      mockUserRepository.findOne.mockResolvedValue(user)
      mockConfigService.get.mockReturnValue('http://frontend.com')
      mockMailerService.sendEmail.mockResolvedValue(true)

      await service.resendVerificationEmail(resendActivationEmailDto)

      expect(mockUserRepository.findOne).toHaveBeenCalled()
      expect(mockMailerService.sendEmail).toHaveBeenCalled()
    })

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null)

      await expect(
        service.resendVerificationEmail(resendActivationEmailDto),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException if user is already verified', async () => {
      const user = {
        id: 'user-id',
        email: resendActivationEmailDto.email,
        isVerified: true,
      }
      mockUserRepository.findOne.mockResolvedValue(user)

      await expect(
        service.resendVerificationEmail(resendActivationEmailDto),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('refreshToken', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'refresh-token',
    }

    it('should refresh token successfully', async () => {
      mockJwtAuthService.verifyToken.mockResolvedValue({ sub: 'user-id' })
      mockRefreshTokenRepository.findOne.mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        token: 'refresh-token',
      })
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        role: UserRoles.CLIENT,
      }
      mockUserRepository.findOne.mockResolvedValue(user)
      mockJwtAuthService.generateTokens.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      })

      const result = await service.refreshToken(refreshTokenDto)

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      })
      expect(mockJwtAuthService.verifyToken).toHaveBeenCalled()
      expect(mockRefreshTokenRepository.findOne).toHaveBeenCalled()
      expect(mockUserRepository.findOne).toHaveBeenCalled()
      expect(mockJwtAuthService.generateTokens).toHaveBeenCalled()
    })

    it('should throw UnauthorizedException if token is invalid', async () => {
      mockJwtAuthService.verifyToken.mockRejectedValue(
        new Error('Invalid token'),
      )

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should throw UnauthorizedException if token not found in database', async () => {
      mockJwtAuthService.verifyToken.mockResolvedValue({ sub: 'user-id' })
      mockRefreshTokenRepository.findOne.mockResolvedValue(null)

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should throw UnauthorizedException if user not found', async () => {
      mockJwtAuthService.verifyToken.mockResolvedValue({ sub: 'user-id' })
      mockRefreshTokenRepository.findOne.mockResolvedValue({
        id: 'token-id',
        userId: 'user-id',
        token: 'refresh-token',
      })
      mockUserRepository.findOne.mockResolvedValue(null)

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      )
    })
  })
})
