import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { SignupDto } from '../dto/sign-up.dto';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/user/entities';
import { UserService } from 'src/user/user.service';
import { LoginDto, LoginUserPayload, RefreshTokenDto } from '../dto';
import { MetadataDto } from '../dto/metadata.dto';
import { MailerService } from '@app/mailer';
import { sendEmailDto } from '@app/mailer/dto';
import { VerifyAccountDto } from '../dto/verify-account-dto';
import { ResendVerificationEmailDto } from '../dto/resend-activation-email.dto';
import { Password } from '../entities/password-history';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { RequestResetPasswordDto } from '../dto/request-reset-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { JwtAuthService } from './jwt-auth.service';
import { RedisTokenTypes } from '../enums/token-types.enum';
import { UpdateUserDto } from '../dto/update-profile.dto';
import { UserRoles } from 'src/user/enums/user-roles.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Password)
    private readonly passwordRepository: Repository<Password>,
    private readonly userService: UserService,
    private readonly mailerService: MailerService,
    private readonly jwtAuthService: JwtAuthService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async refreshToken(input: RefreshTokenDto) {
    const { refreshToken } = input;
    const { user } =
      await this.jwtAuthService.resolveRefreshToken(refreshToken);

    const accessToken = await this.jwtAuthService.generateAccessToken({
      metadata: { role: UserRoles.ADMIN, email: user.email },
      ...user,
    });

    return { access_token: accessToken };
  }

  async sendResetPasswordEmail(user: User) {
    const resetPasswordToken =
      await this.jwtAuthService.generateResetPasswordToken({
        id: user.id,
        metadata: { email: user.email, role: user.role },
      });

    const resetPasswprdMail: sendEmailDto = new sendEmailDto();
    resetPasswprdMail.to = user.email;
    resetPasswprdMail.templateId = 'd-60701e6c1fc04c1fb492d3919013935b';
    resetPasswprdMail.subject = 'Mise à jour de votre mot de passe';
    resetPasswprdMail.dynamicTemplateData = {
      firstName: user.firstName,
      resetPasswordToken,
    };

    await this.mailerService.sendSingle(resetPasswprdMail);
  }

  async isValidUserName(username: string) {
    const users = await this.userService.findAll({
      userName: username.trim().toLowerCase(),
    });
    if (users.length > 0) throw new BadRequestException('Invalid username');
    return true;
  }

  async generageUsername(firstName: string, lastName: string, count) {
    const username = firstName + '.' + lastName;
    if (count) {
      count++;
    } else {
      count = 1;
    }

    const users = await this.userService.findAll({ userName: username });
    if (users) return this.generageUsername(firstName, lastName, count);
    else return username;
  }

  async signup(createUserDto: SignupDto) {
    const user = await this.userService.findAll({ email: createUserDto.email });
    if (user.length) throw new BadRequestException('This user already exists!');

    const { password, ...rest } = createUserDto;

    const hashedPassword = await this.hash(password);

    const createdUser = await this.userRepository.create({ ...rest });
    const saved = await this.userRepository.save(createdUser);

    const createdPassword = this.passwordRepository.create({
      user: createdUser,
      hash: hashedPassword,
    });
    await this.passwordRepository.save(createdPassword);

    return this.authenticate(saved, {
      email: createdUser.email,
      isVerified: true,
      role: UserRoles.ADMIN,
    });
  }

  async loginAdmin(loginDto: LoginDto) {
    const { login, password } = loginDto;

    const where: FindOptionsWhere<User> | FindOptionsWhere<User>[] = [
      { email: login, isSuperUser: true },
      { userName: login, isSuperUser: true },
    ];

    const user = await this.userService.findOne({
      select: { id: true, email: true, userName: true, role: true },
      where: where,
    });

    if (!user) throw new ForbiddenException('Wrong credintials');

    const currentPassword = await this.passwordRepository.findOne({
      where: { user: { id: user.id }, isCurrent: true },
    });

    if (!currentPassword) throw new BadRequestException('Wrong credintials');

    const isValidPassword = await this.compare(password, currentPassword.hash);

    if (!isValidPassword) throw new ForbiddenException('Wrong credintials');

    return await this.authenticate(user, {
      role: user.role,
      email: user.email,
    });
  }

  async hash(password: string): Promise<string> {
    const salt: string = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  }

  async compare(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  async authenticate(
    user: User,
    metadata: MetadataDto,
  ): Promise<LoginUserPayload> {
    const access_token = await this.jwtAuthService.generateAccessToken({
      ...user,
      metadata,
    });

    const refresh_token = await this.jwtAuthService.generateRefreshToken({
      ...user,
      metadata,
    });

    return { access_token, refresh_token };
  }

  async isSuperUser(userId: string) {
    const user = await this.userService.findOne({ where: { id: userId } });
    return user?.isSuperUser;
  }

  async getProfile(userId: string) {
    return await this.userService.findOne({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true, userName: true },
    });
  }

  async updatePassword(userId: string, input: UpdatePasswordDto) {
    const { oldPassword, newPassword } = input;
    const user = await this.userService.findOne({ where: { id: userId } });

    const currentPassword = await this.passwordRepository.findOne({
      where: { user: { id: user.id }, isCurrent: true },
    });

    if (!currentPassword) throw new BadRequestException('Wrong credintials');

    const isValidPassword = await this.compare(
      oldPassword,
      currentPassword.hash,
    );
    if (!isValidPassword) throw new BadRequestException('Invalid password');

    const oldPasswords = await this.passwordRepository.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'desc' },
      take: 10,
    });
    for (const oldPassword of oldPasswords) {
      if (await this.compare(newPassword, oldPassword.hash))
        throw new BadRequestException(
          'Cannot use a password from the old 10 passwords',
        );
    }

    const hash = await this.hash(newPassword);

    const createdPassword = this.passwordRepository.create({ user, hash });

    await this.passwordRepository.update(
      { user: { id: user.id }, isCurrent: true },
      { isCurrent: false },
    );
    await this.passwordRepository.save(createdPassword);

    return true;
  }

  async requestResetPassword(input: RequestResetPasswordDto) {
    const { login } = input;

    const where: FindOptionsWhere<User> | FindOptionsWhere<User>[] = [
      { email: login },
      { userName: login },
    ];

    const user = await this.userService.findOne({
      select: { id: true, email: true, userName: true },
      where: where,
    });
    if (user) {
      await this.sendResetPasswordEmail(user);
    }
    return true;
  }

  async resetPassword(input: ResetPasswordDto) {
    const { token, password } = input;
    const payload = await this.jwtAuthService.verifyResetPasswordToken(token);
    if (!payload) throw new BadRequestException('Invalid action');
    const user = await this.userService.findOne({ where: { id: payload.sub } });
    if (!user) throw new NotFoundException('Invalid action');

    const oldPasswords = await this.passwordRepository.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'desc' },
      take: 10,
    });
    for (const oldPassword of oldPasswords) {
      if (await this.compare(password, oldPassword.hash))
        throw new BadRequestException(
          'Cannot use a password from the old 10 passwords',
        );
    }

    const hash = await this.hash(password);
    const newPassword = this.passwordRepository.create({ user, hash });
    await this.passwordRepository.update(
      { user: { id: user.id } },
      { isCurrent: false },
    );
    await this.passwordRepository.save(newPassword);

    await this.jwtAuthService.searchAndDeleteTokensFromRedis({
      userId: user.id,
      token,
      tokenType: RedisTokenTypes.RESET_PASSWORD,
    });

    return true;
  }

  async updateUserProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.userService.findOne({ where: { id: userId } });

    user.firstName = dto.firstName;
    user.lastName = dto.lastName;
    user.userName = dto.userName;

    return await user.save();
  }
}
