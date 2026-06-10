import {
  provideKeycloak,
  withAutoRefreshToken,
  AutoRefreshTokenService,
  UserActivityService,
} from 'keycloak-angular';

const KEYCLOAK_CONFIG = {
  url: 'http://localhost:8080',
  realm: 'warehouse-realm',
  clientId: 'angular-frontend',
};

export const provideKeycloakAngular = () =>
  provideKeycloak({
    config: KEYCLOAK_CONFIG,
    initOptions: {
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
    },
    features: [
      withAutoRefreshToken({
        onInactivityTimeout: 'logout',
        sessionTimeout: 60000,
      }),
    ],
    providers: [AutoRefreshTokenService, UserActivityService],
  });
