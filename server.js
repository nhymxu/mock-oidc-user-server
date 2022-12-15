import assert from 'assert';
import camelCase from 'camelcase';

import wildcard from 'wildcard';
import psl from 'psl';

import Provider, { errors } from 'oidc-provider';

import * as dotenv from 'dotenv';
dotenv.config();

const host = process.env.SERVER_HOST || 'localhost'
const port = process.env.SERVER_PORT || 8080
const serverProtocol = process.env.SERVER_PROTOCOL || 'http'
const serverIssuer = process.env.SERVER_ISSUER || `${serverProtocol}://${host}:${port}`


console.log(`Environment config\nHost: ${host}\nPort: ${port}\nProtocol: ${serverProtocol}\nIssuer: ${serverIssuer}`);

const config = ['CLIENT_ID', 'CLIENT_SECRET', 'CLIENT_REDIRECT_URI', 'CLIENT_LOGOUT_REDIRECT_URI'].reduce((acc, v) => {
    assert(process.env[v], `${v} config missing`);
    acc[camelCase(v)] = process.env[v];
    return acc;
}, {});

let adapter;
if (process.env.MONGODB_URI) {
    ({ default: adapter } = await import('./adapters/mongodb.js'));
    await adapter.connect();
}

const oidcConfig = {
    // clients: [{
    //     client_id: config.clientId,
    //     client_secret: config.clientSecret,
    //     redirect_uris: [config.clientRedirectUri],
    //     post_logout_redirect_uris: [config.clientLogoutRedirectUri]
    // }],
    // interactions: {
    //     url(ctx, interaction) { // eslint-disable-line no-unused-vars
    //         return `/interaction/${interaction.uid}`;
    //     },
    // },
    cookies: {
        keys: ['some secret key', 'and also the old rotated away some time ago', 'and one more'],
    },
    claims: {
        email: ['email'],
        profile: ['name', 'preferred_username']
    },
    features: {
        devInteractions: { enabled: false }, // defaults to true
        introspection: { enabled: true },
        deviceFlow: { enabled: true }, // defaults to false
        revocation: { enabled: true }, // defaults to false
        registration: { enabled: true }, // defaults to false
        // request: { enabled: true }, // defaults to false
        // sessionManagement: { enabled: true }, // defaults to false
    },
    jwks: {
        keys: [
            {
                d: 'VEZOsY07JTFzGTqv6cC2Y32vsfChind2I_TTuvV225_-0zrSej3XLRg8iE_u0-3GSgiGi4WImmTwmEgLo4Qp3uEcxCYbt4NMJC7fwT2i3dfRZjtZ4yJwFl0SIj8TgfQ8ptwZbFZUlcHGXZIr4nL8GXyQT0CK8wy4COfmymHrrUoyfZA154ql_OsoiupSUCRcKVvZj2JHL2KILsq_sh_l7g2dqAN8D7jYfJ58MkqlknBMa2-zi5I0-1JUOwztVNml_zGrp27UbEU60RqV3GHjoqwI6m01U7K0a8Q_SQAKYGqgepbAYOA-P4_TLl5KC4-WWBZu_rVfwgSENwWNEhw8oQ',
                dp: 'E1Y-SN4bQqX7kP-bNgZ_gEv-pixJ5F_EGocHKfS56jtzRqQdTurrk4jIVpI-ZITA88lWAHxjD-OaoJUh9Jupd_lwD5Si80PyVxOMI2xaGQiF0lbKJfD38Sh8frRpgelZVaK_gm834B6SLfxKdNsP04DsJqGKktODF_fZeaGFPH0',
                dq: 'F90JPxevQYOlAgEH0TUt1-3_hyxY6cfPRU2HQBaahyWrtCWpaOzenKZnvGFZdg-BuLVKjCchq3G_70OLE-XDP_ol0UTJmDTT-WyuJQdEMpt_WFF9yJGoeIu8yohfeLatU-67ukjghJ0s9CBzNE_LrGEV6Cup3FXywpSYZAV3iqc',
                e: 'AQAB',
                kty: 'RSA',
                n: 'xwQ72P9z9OYshiQ-ntDYaPnnfwG6u9JAdLMZ5o0dmjlcyrvwQRdoFIKPnO65Q8mh6F_LDSxjxa2Yzo_wdjhbPZLjfUJXgCzm54cClXzT5twzo7lzoAfaJlkTsoZc2HFWqmcri0BuzmTFLZx2Q7wYBm0pXHmQKF0V-C1O6NWfd4mfBhbM-I1tHYSpAMgarSm22WDMDx-WWI7TEzy2QhaBVaENW9BKaKkJklocAZCxk18WhR0fckIGiWiSM5FcU1PY2jfGsTmX505Ub7P5Dz75Ygqrutd5tFrcqyPAtPTFDk8X1InxkkUwpP3nFU5o50DGhwQolGYKPGtQ-ZtmbOfcWQ',
                p: '5wC6nY6Ev5FqcLPCqn9fC6R9KUuBej6NaAVOKW7GXiOJAq2WrileGKfMc9kIny20zW3uWkRLm-O-3Yzze1zFpxmqvsvCxZ5ERVZ6leiNXSu3tez71ZZwp0O9gys4knjrI-9w46l_vFuRtjL6XEeFfHEZFaNJpz-lcnb3w0okrbM',
                q: '3I1qeEDslZFB8iNfpKAdWtz_Wzm6-jayT_V6aIvhvMj5mnU-Xpj75zLPQSGa9wunMlOoZW9w1wDO1FVuDhwzeOJaTm-Ds0MezeC4U6nVGyyDHb4CUA3ml2tzt4yLrqGYMT7XbADSvuWYADHw79OFjEi4T3s3tJymhaBvy1ulv8M',
                qi: 'wSbXte9PcPtr788e713KHQ4waE26CzoXx-JNOgN0iqJMN6C4_XJEX-cSvCZDf4rh7xpXN6SGLVd5ibIyDJi7bbi5EQ5AXjazPbLBjRthcGXsIuZ3AtQyR0CEWNSdM7EyM5TRdyZQ9kftfz9nI03guW3iKKASETqX2vh0Z8XRjyU',
                use: 'sig',
            },
            {
                crv: 'P-256',
                d: 'K9xfPv773dZR22TVUB80xouzdF7qCg5cWjPjkHyv7Ws',
                kty: 'EC',
                use: 'sig',
                x: 'FWZ9rSkLt6Dx9E3pxLybhdM6xgR5obGsj5_pqmnz5J4',
                y: '_n8G69C-A2Xl4xUW2lF0i8ZGZnk_KPYrhv4GbTGu5G4',
            },
        ],
    },
    // async findAccount (ctx, id) {
    //     return {
    //         accountId: id,
    //         async claims (use, scope) {
    //             return {
    //                 sub: id,
    //                 email: 'test@test.ch',
    //                 name: 'test',
    //                 preferred_username: 'Test'
    //             }
    //         }
    //     }
    // },
    async loadExistingGrant(ctx) {
        const grantId = (ctx.oidc.result
          && ctx.oidc.result.consent
          && ctx.oidc.result.consent.grantId) || ctx.oidc.session.grantIdFor(ctx.oidc.client.clientId);
    
        if (grantId) {
          // keep grant expiry aligned with session expiry
          // to prevent consent prompt being requested when grant expires
          const grant = await ctx.oidc.provider.Grant.find(grantId);
    
          // this aligns the Grant ttl with that of the current session
          // if the same Grant is used for multiple sessions, or is set
          // to never expire, you probably do not want this in your code
          if (ctx.oidc.account && grant.exp < ctx.oidc.session.exp) {
            grant.exp = ctx.oidc.session.exp;
    
            await grant.save();
          }
    
          return grant;
        } else if (isFirstParty(ctx.oidc.client)) {
          const grant = new ctx.oidc.provider.Grant({
            clientId: ctx.oidc.client.clientId,
            accountId: ctx.oidc.session.accountId,
          });
    
          grant.addOIDCScope('openid email profile');
          grant.addOIDCClaims(['first_name']);
          grant.addResourceScope('urn:example:resource-indicator', 'api:read api:write');
          await grant.save();
          return grant;
        }
      }
}

// # TODO: replace auth route to match with setup: https://github.com/destenson/panva--node-oidc-provider/blob/master/docs/configuration.md#routes

const oidc = new Provider(serverIssuer, { adapter, ...oidcConfig });
oidc.proxy = true;

// redirectUriAllowed on a client prototype checks whether a redirect_uri is allowed or not
// const { redirectUriAllowed } = oidc.Client.prototype;

// oidc.Client.prototype.redirectUriAllowed = function wildcardRedirectUriAllowed(redirectUri) {
//     console.log('redirectUriAllowed begin', redirectUri);
//     return redirectUriAllowed.call(this, "https://mada-positive-scorecard-test-frontend-wbk4l7i2dq-ew.a.run.app/login");
// };

// console.log('Before', errors.InvalidClientMetadata.prototype.allow_redirect);
// Object.defineProperty(errors.InvalidClientMetadata.prototype, 'allow_redirect', { value: false });
// console.log('After', errors.InvalidClientMetadata.prototype.allow_redirect);

oidc.callback();

oidc.listen(port, () => {
    console.log(`oidc-provider listening on port ${port}, check http://localhost:${port}/.well-known/openid-configuration`)
});
