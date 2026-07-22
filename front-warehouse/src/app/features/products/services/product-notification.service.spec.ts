import { TestBed } from '@angular/core/testing';

import { ProductNotificationService } from './product-notification.service';

describe('ProductNotificationService', () => {
  let service: ProductNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
