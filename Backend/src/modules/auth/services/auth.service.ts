import { Injectable, ConflictException, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../../users/users.service";
import { RegisterDto } from "../dto/register.dto";
import { LoginDto } from "../dto/login.dto";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { ConfigService } from "@nestjs/config";
import { db } from "../../../database/drizzle";
import { profiles } from "../../../database/schema/profiles";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      fullName: dto.fullName,
      avatarUrl: dto.avatarUrl,
      linkedinUrl: dto.linkedinUrl,
      githubUrl: dto.githubUrl,
      portfolioUrl: dto.portfolioUrl,
      location: dto.location,
      experience: dto.experience,
      preferredRole: dto.preferredRole,
      salaryExpectation: dto.salaryExpectation,
    });

    // Automatically create a profile for the user
    await db.insert(profiles).values({
      userId: newUser.id,
      fullName: dto.fullName,
      avatarUrl: dto.avatarUrl,
      linkedinUrl: dto.linkedinUrl,
      githubUrl: dto.githubUrl,
      portfolioUrl: dto.portfolioUrl,
      preferredRole: dto.preferredRole,
      salaryExpectation: dto.salaryExpectation,
      preferredLocation: dto.location,
    });

    const { password, refreshToken, ...userWithoutSecrets } = newUser;
    return userWithoutSecrets;
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const tokens = await this.generateTokens(user.id, user.email);

    // Save refresh token to database
    await this.usersService.update(user.id, {
      refreshToken: tokens.refreshToken,
    });

    const { password, refreshToken, ...userWithoutSecrets } = user;

    return {
      user: userWithoutSecrets,
      ...tokens,
    };
  }

  async refresh(refreshTokenStr: string) {
    try {
      const payload = this.jwtService.verify(refreshTokenStr, {
        secret: this.configService.get<string>("JWT_SECRET") || "supersecret",
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || user.refreshToken !== refreshTokenStr) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const tokens = await this.generateTokens(user.id, user.email);

      // Update refresh token in db
      await this.usersService.update(user.id, {
        refreshToken: tokens.refreshToken,
      });

      return tokens;
    } catch (e) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  async logout(userId: string) {
    await this.usersService.update(userId, {
      refreshToken: null,
    });
    return { message: "Logged out successfully" };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: "15m",
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: "7d",
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
