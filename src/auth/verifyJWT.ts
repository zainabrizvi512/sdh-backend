// src/auth/verifyJwt.ts
import * as jose from 'jose';

const ISSUER = `https://${process.env.AUTH0_DOMAIN}/`;   // e.g. dev-xxx.us.auth0.com
const AUDIENCE = process.env.AUTH0_AUDIENCE!;            // your API audience

// Cache JWKS
const jwks = jose.createRemoteJWKSet(new URL(`${ISSUER}.well-known/jwks.json`));

export async function verifyJwt(token: string) {
    const { payload } = await jose.jwtVerify(token, jwks, {
        issuer: ISSUER,
        audience: AUDIENCE,
    });
    return payload; // contains sub, email, name, etc.
}
