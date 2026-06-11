import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-page-component',
  imports: [RouterLink, RouterModule, RouterOutlet],
  standalone: true,
  templateUrl: './page-component.html',
  styleUrl: './page-component.scss',
})
export class PageComponent implements OnInit {
  username = '';
  private keycloak = inject(Keycloak);

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
