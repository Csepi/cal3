import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';
import { clientLogger } from './src/utils/clientLogger';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  clientLogger.setLevel('error');
});

afterEach(() => {
  jest.restoreAllMocks();
});
