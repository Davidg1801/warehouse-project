import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageComponent } from './page-component';
import { ModalService } from '@shared/services/modal.service';
import Keycloak from 'keycloak-js';
import { signal } from '@angular/core';

describe('PageComponent', () => {
  let component: PageComponent;
  let fixture: ComponentFixture<PageComponent>;

  const modalServiceMock = {
    isOpen: signal(false),
    config: signal({
      title: '',
      message: '',
    }),
    open: vi.fn(),
    submitResult: vi.fn(),
  };

  const keycloakMock = {
    tokenParsed: {
      preferred_username: 'test-user',
    },
    logout: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageComponent],
      providers: [
        { provide: ModalService, useValue: modalServiceMock },
        { provide: Keycloak, useValue: keycloakMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
