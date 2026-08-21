import { computed, inject, Injectable, signal } from '@angular/core';
import { UserProfile } from '@core/models/user-profile.model';
import Keycloak, { KeycloakLogoutOptions } from 'keycloak-js';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly keycloak = inject(Keycloak);
  private readonly client = 'angular-frontend';

  private readonly _currentUser = signal<UserProfile | null>(null);

  readonly username = computed(() => this._currentUser()?.username ?? '');
  readonly name = computed(() => this._currentUser()?.name ?? '');
  readonly email = computed(() => this._currentUser()?.email ?? '');
  readonly isAdmin = computed(() => this.hasRole('admin'));

  constructor() {
    this.initUser();
  }

  private initUser(): void {
    if (this.keycloak.authenticated) this.getUserData();
    this.keycloak.onAuthRefreshSuccess = () => this.getUserData();
    this.keycloak.onAuthSuccess = () => this.getUserData();
    this.keycloak.onAuthLogout = () => this._currentUser.set(null);
  }

  private hasRole(role: string): boolean {
    return this._currentUser()?.roles.includes(role) ?? false;
  }

  private getUserData(): void {
    const token = this.keycloak.tokenParsed;
    if (!token) return;

    this._currentUser.set({
      username: token['preferred_username'],
      name: token['name'],
      email: token['email'],
      roles: this.keycloak.resourceAccess?.[this.client]?.roles ?? [],
    });
  }

  logoutUser(redirect: KeycloakLogoutOptions): void {
    this.keycloak.logout(redirect);
  }
}
