import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import Keycloak from 'keycloak-js';

export const canActivateAuthRole: CanActivateFn = (state) => {
  const keycloak = inject(Keycloak);

  if (keycloak.authenticated) {
    return true;
  }

  keycloak.login({
    redirectUri: window.location.origin + state.url,
  });

  return false;
};
