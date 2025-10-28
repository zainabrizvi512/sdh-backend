import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        forwardRef(() => UsersModule),
    ],
    providers: [JwtStrategy],
    exports: [PassportModule],
})
export class AuthModule { }
