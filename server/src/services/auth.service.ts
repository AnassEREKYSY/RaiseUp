import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { RegisterDto, LoginDto } from '../dtos/auth.dto';
import { AuthErrorEnum, Role } from '../enums/enums';
import { AuthError } from '../errors/auth-error';


export class AuthService {
  async register(data: RegisterDto) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AuthError(AuthErrorEnum.EMAIL_TAKEN, 'This email is already registered.', 409);

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
    if (!user) throw new AuthError(AuthErrorEnum.USER_NOT_FOUND, 'No account found with this email.', 404);

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) throw new AuthError(AuthErrorEnum.WRONG_PASSWORD, 'Incorrect password.', 401);

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
