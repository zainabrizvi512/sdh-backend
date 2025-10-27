import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

type MgmtToken = { token: string; exp: number };

@Injectable()
export class UsersService {
    private mgmtToken: MgmtToken | null = null;

    private async getManagementToken(): Promise<string> {
        const now = Math.floor(Date.now() / 1000);
        if (this.mgmtToken && this.mgmtToken.exp - 30 > now) {
            return this.mgmtToken.token;
        }

        try {
            const url = `https://${process.env.AUTH0_DOMAIN}/oauth/token`;
            const { data } = await axios.post(url, {
                grant_type: 'client_credentials',
                client_id: process.env.AUTH0_MGMT_CLIENT_ID,
                client_secret: process.env.AUTH0_MGMT_CLIENT_SECRET,
                audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
            });

            this.mgmtToken = {
                token: data.access_token,
                exp: now + (data.expires_in ?? 3600),
            };

            return this.mgmtToken.token;
        } catch (e) {
            throw new InternalServerErrorException('Auth0 management token error');
        }
    }

    // sub looks like: "auth0|1234567890" or "google-oauth2|abcdef"
    async getUserBySub(sub: string) {
        const token = await this.getManagementToken();
        const url = `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(sub)}`;
        const { data } = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
        });

        // Example shape:
        // {
        //   "user_id": "auth0|abc",
        //   "email": "x@y.com",
        //   "name": "John Doe",
        //   "picture": "https://.../pic.jpg",
        //   "identities": [{ "provider": "auth0", "connection": "Username-Password-Authentication", ...}],
        //   ...
        // }

        const connectionType =
            Array.isArray(data.identities) && data.identities[0]?.connection
                ? data.identities[0].connection
                : null;

        return {
            sub: data.user_id,
            email: data.email ?? null,
            name: data.name ?? null,
            picture: data.picture ?? null,
            connectionType,
            raw: data, // keep if you want everything
        };
    }
}
