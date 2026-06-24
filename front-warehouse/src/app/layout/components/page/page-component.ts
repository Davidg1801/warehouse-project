import { Component, inject, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { ModalComponent } from '@shared/components/modal/modal-component';
import { ModalService } from '@shared/services/modal.service';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-page-component',
  imports: [RouterModule, RouterOutlet, ModalComponent],
  standalone: true,
  templateUrl: './page-component.html',
  styleUrl: './page-component.scss',
})
export class PageComponent implements OnInit {
  protected modalService = inject(ModalService);
  private keycloak = inject(Keycloak);
  username = '';

  ngOnInit(): void {
    if (this.keycloak.tokenParsed) {
      this.username = this.keycloak.tokenParsed['preferred_username'];
    }
  }

  logout(): void {
    this.keycloak.logout({
      redirectUri: window.location.origin,
    });
  }
}
