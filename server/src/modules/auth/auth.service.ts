import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/api-error';
import { signAccessToken } from '../../utils/jwt';

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    nickname: string;
    createdAt: string;
  };
};

function toAuthResponse(user: {
  id: string;
  email: string;
  nickname: string;
  createdAt: Date;
}): AuthResponse {
  const token = signAccessToken({
    sub: user.id,
    email: user.email,
    nickname: user.nickname
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      createdAt: user.createdAt.toISOString()
    }
  };
}

export async function registerUser(data: {
  email: string;
  nickname: string;
  password: string;
}): Promise<AuthResponse> {
  const passwordHash = await bcrypt.hash(data.password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        nickname: data.nickname,
        passwordHash
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        createdAt: true
      }
    });

    return toAuthResponse(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ApiError(409, 'Email or nickname already exists');
    }

    throw error;
  }
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: {
      email: data.email.toLowerCase()
    }
  });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);

  if (!isValidPassword) {
    throw new ApiError(401, 'Invalid email or password');
  }

  return toAuthResponse(user);
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      nickname: true,
      createdAt: true
    }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return {
    ...user,
    createdAt: user.createdAt.toISOString()
  };
}
