import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageComponent } from './page-component';
import Keycloak from 'keycloak-js';
import { ModalComponent } from '@shared/components/modal/modal-component';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';

describe('PageComponent', () => {
  let component: PageComponent;
  let fixture: ComponentFixture<PageComponent>;

  const modalServiceMock = {
    isOpen: signal(false),
    config: signal({ title: '', message: '' }),
    open: vi.fn(),
    submitResult: vi.fn(),
  };

  const keycloakMock = {
    tokenParsed: {
      preferred_username: 'test-user',
    },
    logout: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageComponent],
      providers: [
        provideRouter([]),
        { provide: Keycloak, useValue: keycloakMock },
        { provide: ModalComponent, useValue: modalServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize username from Keycloak correctly', () => {
    expect(component.username()).toBe('test-user');
  });

  it('should render username in the template', () => {
    const usernameElement = fixture.nativeElement.querySelector(
      '[data-testid="username-field"]',
    ) as HTMLElement;
    expect(usernameElement).toBeTruthy();
    expect(usernameElement.textContent).toContain('test-user');
  });

  it('should not render username field when username signal is empty', async () => {
    // component.username.set('');
    fixture.detectChanges();
    await fixture.whenStable();

    const usernameElement = fixture.nativeElement.querySelector('[data-testid="username-field"]');
    expect(usernameElement).toBeNull();
  });

  it('should trigger logout function when logout button is clicked', () => {
    const logoutBtn = fixture.nativeElement.querySelector('[data-testid="logout-btn"]');
    logoutBtn.click();

    expect(keycloakMock.logout).toHaveBeenCalledTimes(1);
    expect(keycloakMock.logout).toHaveBeenCalledWith({
      redirectUri: window.location.origin,
    });
  });
});
