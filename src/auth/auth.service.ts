import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CreateAuthDto, UpdateAuthDto } from './dto';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { CreateAuthDto2 } from './dto/create-auth.dto2';
import { JwtPayload, Tokens } from './types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtservice: JwtService,
  ) {}

  async getTokens(userId: number, email: string): Promise<Tokens> {
    const jwtPayload: JwtPayload = {
      sub: userId,
      email: email,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtservice.signAsync(jwtPayload, {
        secret: process.env.ACCESS_TOKEN_KEY,
        expiresIn: process.env.ACCESS_TOKEN_TIME,
      }),
      this.jwtservice.signAsync(jwtPayload, {
        secret: process.env.REFRESH_TOKEN_KEY,
        expiresIn: process.env.REFRESH_TOKEN_TIME,
      }),
    ]);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async signUp(createAuthDto: CreateAuthDto2, res: Response) {
    let candidate = await this.prismaService.user.findUnique({
      where: { email: createAuthDto.email },
    });

    if (candidate) {
      throw new BadRequestException('This email is already in use');
    }
    const password1 = await bcrypt.hash(createAuthDto.password, 7);

    candidate = await this.prismaService.user.create({
      data: {
        email: createAuthDto.email,
        hashedPassword: password1,
      },
    });

    const tokens = await this.getTokens(candidate.id, candidate.email);
    await this.updateany(candidate.id, tokens.refresh_token);
    res.cookie('refresh_token', tokens.refresh_token, {
      maxAge: Number(process.env.COOKIE_TIME),
      httpOnly: true,
    });
    return tokens;
  }
  async updateany(userId: number, data: string) {
    const data2 = await bcrypt.hash(data, 7);
    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: { hashedRefreshToken: data2 },
    });
  }

  async signIn(createAuthDto: CreateAuthDto, res: Response) {
    console.log("OK");
    
    let candidate = await this.prismaService.user.findUnique({
      where: { email: createAuthDto.email },
    });

    if (!candidate) {
      throw new BadRequestException('This email is not in use');
    }

    const password1 = await bcrypt.compare(
      createAuthDto.password,
      candidate.hashedPassword,
    );
    if (!password1) {
      throw new BadRequestException('Password is wrong!');
    }

    const tokens = await this.getTokens(candidate.id, candidate.email);
    await this.updateany(candidate.id, tokens.refresh_token);
    res.cookie('refresh_token', tokens.refresh_token, {
      maxAge: Number(process.env.COOKIE_TIME),
      httpOnly: true,
    });
    return tokens;
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
