import { Injectable } from '@angular/core';

import { AbstractSecurityStorage } from 'angular-auth-oidc-client';

@Injectable()
export class LocalSecurityStorage implements AbstractSecurityStorage {
  read(key: string): string | null {
    return localStorage.getItem(key);
  }

  write(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}
