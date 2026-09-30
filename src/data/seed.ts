import records from './seed.json';
import type { ContentRecord } from '../lib/types';

export const seedData = records as unknown as Record<string, ContentRecord[]>;
