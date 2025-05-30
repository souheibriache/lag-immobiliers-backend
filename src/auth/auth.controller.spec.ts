import { Test, type TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './services/auth.service'
import type { LoginDto } from './dto/login.dto'
import type { VerifyAccountDto } from './dto/verify-account-dto'
import type { RequestResetPasswordDto } from './dto/request-reset-password.dto'
import type { ResetPasswordDto } from './dto/reset-password.dto'
import type { UpdatePasswordDto } from './dto/update-password.dto'
import type { RefreshTokenDto } from './dto/refresh-token.dto'
import { UserRoles } from '../user/enums/user-roles.enum'
import type { Request } from 'express'
import { UnauthorizedException } from '@nestjs/common'
import { SignupDto } from './dto'
import { UpdateUserDto } from './dto/update-profile.dto'
import { ResendVerificationEmailDto } from './dto/resend-activation-email.dto'
import { extractTokenFromHeader } from '@app/common/utils/methods'

jest.mock('@libs/common/src/utils/methods/extract-token-from-header.method')

describe('AuthController', () => {
  let controller: AuthController
  let authService: AuthService

  const mockAuthService = {
    signUp: jest.fn(),
    login: jest.fn(),
    verifyAccount: jest.fn(),
    requestResetPassword: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
    updateProfile: jest.fn(),
    resendActivationEmail: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    authService = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('signUp', () => {
    it('should call authService.signUp with the provided dto', async () => {
      const signUpDto: SignupDto = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        userName: 'johndoe',
      }

      await controller.signUp(signUpDto)

      expect(authService.signup).toHaveBeenCalledWith(signUpDto)
    })
  })

  describe('login', () => {
    it('should call authService.login with the provided dto and return the result', async () => {
      const loginDto: LoginDto = {
        login: 'test@example.com',
        password: 'Password123!',
      }

      const expectedResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-id',
          email: 'test@example.com',
          role: UserRoles.CLIENT,
        },
      }

      mockAuthService.login.mockResolvedValue(expectedResult)

      const result = await controller.login(loginDto)

      expect(authService.login).toHaveBeenCalledWith(loginDto)
      expect(result).toEqual(expectedResult)
    })
  })

  describe('verifyAccount', () => {
    it('should call authService.verifyAccount with the provided dto', async () => {
      const verifyAccountDto: VerifyAccountDto = {
        verificationToken: 'verification-token',
      }

      await controller.verifyAccount(verifyAccountDto)

      expect(authService.verifyAccount).toHaveBeenCalledWith(verifyAccountDto)
    })
  })

  describe('requestResetPassword', () => {
    it('should call authService.requestResetPassword with the provided dto', async () => {
      const requestResetPasswordDto: RequestResetPasswordDto = {
        login: 'test@example.com',
      }

      await controller.requestResetPassword(requestResetPasswordDto)

      expect(authService.requestResetPassword).toHaveBeenCalledWith(
        requestResetPasswordDto,
      )
    })
  })

  describe('resetPassword', () => {
    it('should call authService.resetPassword with the provided dto', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        token: 'reset-token',
        password: 'NewPassword123!',
      }

      await controller.resetPassword(resetPasswordDto)

      expect(authService.resetPassword).toHaveBeenCalledWith(resetPasswordDto)
    })
  })

  describe('updatePassword', () => {
    it('should call authService.updatePassword with the provided dto and user id', async () => {
      const updatePasswordDto: UpdatePasswordDto = {
        oldPassword: 'CurrentPassword123!',
        newPassword: 'NewPassword123!',
      }

      const req = {
        user: {
          sub: 'user-id',
        },
      } as unknown as Request

      await controller.updatePassword(updatePasswordDto, req)

      expect(authService.updatePassword).toHaveBeenCalledWith(
        updatePasswordDto,
        'user-id',
      )
    })
  })

  describe('updateProfile', () => {
    it('should call authService.updateProfile with the provided dto and user id', async () => {
      const updateProfileDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'User',
      }

      const req = {
        user: {
          sub: 'user-id',
        },
      } as unknown as Request

      const expectedResult = {
        id: 'user-id',
        ...updateProfileDto,
      }

      mockAuthService.updateProfile.mockResolvedValue(expectedResult)

      const result = await controller.updateProfile(updateProfileDto, req)

      expect(authService.updateUserProfile).toHaveBeenCalledWith(
        updateProfileDto,
        'user-id',
      )
      expect(result).toEqual(expectedResult)
    })
  })

  describe('resendActivationEmail', () => {
    it('should call authService.resendActivationEmail with the provided dto', async () => {
      const resendActivationEmailDto: ResendVerificationEmailDto = {
        email: 'test@example.com',
      }

      await controller.resendVerificationEmail(resendActivationEmailDto)

      expect(authService.resendVerificationEmail).toHaveBeenCalledWith(
        resendActivationEmailDto,
      )
    })
  })

  describe('refreshToken', () => {
    it('should call authService.refreshToken with the provided dto', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'refresh-token',
      }

      const expectedResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      }

      mockAuthService.refreshToken.mockResolvedValue(expectedResult)

      const result = await controller.refreshToken(refreshTokenDto)

      expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto)
      expect(result).toEqual(expectedResult)
    })
  })
})
