import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { LoginDto, RefreshTokenDto, SignupDto } from './dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { IRequestWithUser } from '@app/common/interfaces/request-user.interface.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateUserDto } from './dto/update-profile.dto';

@Controller('accounts')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signupDto: SignupDto) {
    return await this.authService.signup(signupDto);
  }

  @Post('/admin/login')
  async adminLogin(@Body() loginDto: LoginDto) {
    return await this.authService.loginAdmin(loginDto);
  }

  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto);
  }

  @Get('/profile')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  async getMyProfile(@Request() req: IRequestWithUser) {
    const userId = req?.user?.id;
    return await this.authService.getProfile(userId);
  }

  @Put('/update-password')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() req: IRequestWithUser,
  ) {
    const userId = req?.user?.id;
    return await this.authService.updatePassword(userId, updatePasswordDto);
  }

  @Post('/request-reset-password')
  async requestResetPassword(
    @Body() requestResetPasswordDto: RequestResetPasswordDto,
  ) {
    return await this.authService.requestResetPassword(requestResetPasswordDto);
  }

  @Put('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }

  @Put('profile')
  @UseGuards(AccessTokenGuard)
  async updateProfile(
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: IRequestWithUser,
  ) {
    const userId = req.user?.id;
    return this.authService.updateUserProfile(userId, updateUserDto);
  }
}
