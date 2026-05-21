import { TestBed } from '@angular/core/testing';

import { DownloadManager } from './download-manager';

describe('DownloadManager', () => {
  let service: DownloadManager;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DownloadManager);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
