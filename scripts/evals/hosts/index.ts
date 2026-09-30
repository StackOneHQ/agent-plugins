// Registry of host adapters. Adding a host is one file exporting a HostAdapter
// and one line here.

import type { HostAdapter, HostName } from '../types.ts';
import { antigravity } from './antigravity.ts';
import { claude } from './claude.ts';
import { codex } from './codex.ts';
import { cursor } from './cursor.ts';

export const adapters: Record<HostName, HostAdapter> = {
  claude,
  antigravity,
  cursor,
  codex,
};

export function isHostName(value: string): value is HostName {
  return Object.hasOwn(adapters, value);
}
