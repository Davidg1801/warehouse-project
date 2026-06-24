import { Provider, EnvironmentProviders } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  createInterceptorCondition,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  IncludeBearerTokenCondition,
  includeBearerTokenInterceptor,
} from 'keycloak-angular';

const urlCondition = createInterceptorCondition<IncludeBearerTokenCondition>({
  urlPattern: /^http:\/\/localhost:5000\/bff\/products(\/.*)?$/i,
  bearerPrefix: 'Bearer',
});

export const provideAppHttpClient = (): (Provider | EnvironmentProviders)[] => [
  {
    provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
    useValue: [urlCondition],
  },
  provideHttpClient(withInterceptors([includeBearerTokenInterceptor])),
];
