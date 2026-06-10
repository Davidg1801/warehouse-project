import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import Keycloak from 'keycloak-js';

export const canActivateAuthRole: CanActivateFn = (route, state) => {
  const keycloak = inject(Keycloak);
  //   const router = inject(Router);

  console.log(route);
  console.log(state);

  // Jeśli Keycloak mówi, że jesteśmy zalogowani – wchodzisz
  if (keycloak.authenticated) {
    return true;
  }

  // Jeśli nie, to na wszelki wypadek kopiemy do logowania ręcznie
  keycloak.login();
  return false;
};
