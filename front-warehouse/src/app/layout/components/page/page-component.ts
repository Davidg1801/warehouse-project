import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ModalComponent } from '@shared/components/modal/modal-component';

@Component({
  selector: 'app-page-component',
  imports: [RouterModule, RouterOutlet, ModalComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-component.html',
  styleUrl: './page-component.scss',
})
export class PageComponent {
  private readonly authService = inject(AuthService);

  username = this.authService.username;
  isAdmin = this.authService.isAdmin;

  logout(): void {
    this.authService.logoutUser({
      redirectUri: window.location.origin,
    });
  }
}
