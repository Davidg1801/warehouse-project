import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideKeycloak } from 'keycloak-angular';

export function provideAppAuth(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideKeycloak({
      config: {
        url: 'http://localhost:8080',
        realm: 'warehouse-realm',
        clientId: 'angular-frontend',
      },
      initOptions: {
        onLoad: 'login-required',
        checkLoginIframe: false,
      },
    }),
  ]);
}
