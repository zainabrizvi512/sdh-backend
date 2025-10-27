import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        const opts: StrategyOptions = {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            algorithms: ['RS256'],
            issuer: process.env.AUTH0_ISSUER_URL,   // e.g. https://your-tenant.eu.auth0.com/
            audience: process.env.AUTH0_AUDIENCE,   // e.g. https://sdh-backend-api
            secretOrKeyProvider: jwksRsa.passportJwtSecret({
                jwksUri: `${process.env.AUTH0_ISSUER_URL}.well-known/jwks.json`,
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 10,
            }) as any,
        };
        super(opts);
    }

    // Whatever is returned here becomes req.user
    validate(payload: any) {
        // payload will include standard OIDC claims if the client asked for them
        // e.g. sub, email, email_verified, picture, name, etc. (depends on token type and scopes)
        return payload;
    }
}
