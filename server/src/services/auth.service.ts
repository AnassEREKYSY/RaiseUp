import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { RegisterDto, LoginDto } from '../dtos/auth.dto';
import { Role } from '../models/enums';

export class AuthService {
  async register(data: RegisterDto) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        password: hashedPassword,
        role: data.role ?? Role.STARTUP
      }
    });

    const { password, ...safe } = user as any;
    return { message: 'User registered successfully', user: { ...safe, hasProfile: false } };
  }

  async login(data: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        investorProfile: { select: { id: true } },
        startupProfile: { select: { id: true } }
      }
    });
    if (!user) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) throw new Error('Invalid credentials');

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    const hasProfile = !!(user.investorProfile || user.startupProfile);
    const { password, investorProfile, startupProfile, ...safe } = user as any;

    return {
      token,
      user: { ...safe, hasProfile }
    };
  }
}
