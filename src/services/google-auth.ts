import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/index';

const client = new OAuth2Client(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  config.GOOGLE_CALLBACK_URL
);

export function getGoogleAuthUrl(state?: string): string {
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    prompt: 'consent',
    state,
  });
}

export async function getGoogleUser(code: string) {
  const { tokens } = await client.getToken(code);

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: config.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload()!;
  return {
    googleId: payload.sub,
    email: payload.email!,
    name: payload.name || payload.email!,
    avatarUrl: payload.picture,
  };
}
