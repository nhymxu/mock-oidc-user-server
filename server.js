const { OAuth2Server } = require('oauth2-mock-server');

const serverPort = process.env.PORT || 8080;
const issuerURL = process.env.ISSUER_URL || false;

async function startServer() {
    const optionKey = undefined;
    const optionCert = undefined;
    const oauth2Optioons = {
        'endpoints': {
            wellKnownDocument: '/.well-known/openid-configuration',
            token: '/as/token.oauth2',
            jwks: '/jwks',
            authorize: '/as/authorization.oauth2',
            userinfo: '/idp/userinfo.openid',
            revoke: '/revoke',
            endSession: '/idp/startSLO.ping',
            introspect: '/introspect',
        }
    }
    let server = new OAuth2Server(optionKey, optionCert, oauth2Optioons);
    server.service.once('beforeUserinfo', (userInfoResponse, req) => {
        userInfoResponse.body = {
            uid: '171717',
            email: 'testeadeo17@gmail.com',
            sub: 'johndoe'
        };
        userInfoResponse.statusCode = 200;
    });
    
    if (issuerURL) {
        server.issuer.url = issuerURL;
    }

    // Generate a new RSA key and add it to the keystore
    await server.issuer.keys.generate('RS256');

    // Start the server
    await server.start(serverPort);
    console.log('Issuer URL:', server.issuer.url); // -> http://localhost:8080
    
    // Do some work with the server
    // ...
    
    // Stop the server
    // await server.stop();
}

module.exports = startServer();
