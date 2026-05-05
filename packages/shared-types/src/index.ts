export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from './database';

export type Locale = 'tr' | 'en';
export const SUPPORTED_LOCALES: readonly Locale[] = ['tr', 'en'] as const;
export const DEFAULT_LOCALE: Locale = 'tr';
