import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
        const issuer = process.env.AUTH0_ISSUER_URL;
        const audience = process.env.AUTH0_AUDIENCE;
        console.log('JWT Strategy initialized');
        console.log('Issuer URL:', process.env.AUTH0_ISSUER_URL);
        console.log('Audience:', process.env.AUTH0_AUDIENCE);
        const opts: StrategyOptions = {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            algorithms: ['RS256'],
            issuer,
            audience,
            secretOrKeyProvider: jwksRsa.passportJwtSecret({
                jwksUri: `${issuer}.well-known/jwks.json`,
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
