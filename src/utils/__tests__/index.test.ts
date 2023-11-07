import { resolveJSON } from '../index';

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));
import * as fs from 'fs';

describe('resolveJSON', () => {
  it('returns JSON object for valid JSON file', () => {
    const json = {
      name: 'test'
    };
    JSON.parse = jest.fn(() => json);

    const result = resolveJSON('test.json');

    expect(result).toEqual(json);
    expect(JSON.parse).toHaveBeenCalled();
  });

  it('returns undefined for invalid JSON', () => {
    JSON.parse = jest.fn(() => {
      throw new Error('Invalid JSON');
    });

    const result = resolveJSON('invalid.json');

    expect(result).toBeUndefined();
  });

  it('returns undefined if file not found', () => {
    jest.spyOn(fs, 'readFileSync')
      .mockImplementation(() => {
        const error = new Error() as unknown as NodeJS.ErrnoException;
        error.code = 'ENOENT';
        throw error;
      });

    const result = resolveJSON('missing.json');

    expect(result).toBeUndefined();
  });

});
