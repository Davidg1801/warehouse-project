import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideKeycloak } from 'keycloak-angular';

export const provideKeycloakAngular2 = () =>
  provideKeycloak({
    config: {
      url: 'http://localhost:8080',
      realm: 'warehouse-realm',
      clientId: 'angular-frontend',
    },
    initOptions: {
      // login-required oznacza: "jeśli nie jesteś zalogowany, od razu przekieruj"
      onLoad: 'login-required',
      checkLoginIframe: false,
    },
  });

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideKeycloakAngular2(),
  ],
};
