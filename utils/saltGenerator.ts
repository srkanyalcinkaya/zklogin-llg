import { createHash } from 'crypto';
import { jwtDecode } from "jwt-decode";

// Deterministik salt üretme fonksiyonu
export const generateDeterministicSalt = (jwt: string): string => {
  const decoded = jwtDecode(jwt) as { sub?: string };
  if (!decoded.sub) throw new Error('Invalid JWT: missing sub');
  
  // SHA-256 hash ile daha güvenli salt üretimi
  return createHash('sha256')
    .update(decoded.sub)
    .digest('hex')
    .slice(0, 32); // 32 karakterlik salt
};

// Random salt üretme (yedek mekanizma)
export const generateRandomSalt = (): string => {
  return createHash('sha256')
    .update(Math.random().toString())
    .digest('hex')
    .slice(0, 32);
};
