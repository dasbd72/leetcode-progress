import { setupServer } from 'msw/node';

import { handlers } from '@/mocks/handlers';

/** Shared MSW server for the test suite. */
export const server = setupServer(...handlers);
