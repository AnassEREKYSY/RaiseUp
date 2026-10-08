const isProd = process.env.NODE_ENV === 'production';

const secret = process.env.JWT_SECRET;
if (isProd && (!secret || secret === 'secret')) {
  throw new Error('JWT_SECRET must be set in production');
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: secret || 'dev-secret',
  jwtExpiresIn: '7d' as const,
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:4200').split(',').map(s => s.trim()).filter(Boolean),
};
