import { JwtPayload } from './jwt-payload.type';

export type JwtPayloadWithrefreshToken = JwtPayload & { refreshToken: string };
