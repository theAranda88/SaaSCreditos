import '@angular/compiler';
import 'zone.js';
import 'zone.js/testing';
import { ɵresolveComponentResources as resolveComponentResources } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { beforeEach } from 'vitest';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

/** Vitest no usa el loader del CLI; resuelve styleUrl/templateUrl externos. */
beforeEach(async () => {
  await resolveComponentResources(async (url) => ({
    text: async () => {
      try {
        return readFileSync(url, 'utf8');
      } catch {
        return '';
      }
    },
  }));
});
