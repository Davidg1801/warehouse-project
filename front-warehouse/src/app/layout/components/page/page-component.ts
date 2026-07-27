import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { ModalComponent } from '@shared/components/modal/modal-component';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-page-component',
  imports: [RouterModule, RouterOutlet, ModalComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-component.html',
  styleUrl: './page-component.scss',
})
export class PageComponent {
  private readonly keycloak = inject(Keycloak);
  username = signal<string>(this.keycloak.tokenParsed?.['preferred_username'] ?? '');

  logout(): void {
    this.keycloak.logout({
      redirectUri: window.location.origin,
    });
  }
}
