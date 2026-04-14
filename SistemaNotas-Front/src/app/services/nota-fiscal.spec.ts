import { TestBed } from '@angular/core/testing';

import { NotaFiscal } from './nota-fiscal';

describe('NotaFiscal', () => {
  let service: NotaFiscal;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotaFiscal);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
