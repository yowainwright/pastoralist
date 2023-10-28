import { updateAppendix } from '../updateAppendix';

describe('updateAppendix', () => {

  const mockGetRootDeps = jest.fn();
  const mockExec = jest.fn();

  beforeEach(() => {
    mockGetRootDeps.mockReset();
    mockExec.mockReset();
  });

  it('returns empty object if no matching resolutions', async () => {
    const dependencies = {
      foo: '1.0.0'
    };
    const resolutions = {
      bar: '2.0.0'
    };
    const result = await updateAppendix({
      dependencies,
      resolutions,
      name: 'test',
      version: '1.0.0',
      exec: mockExec
    });

    expect(result).toEqual({});
  });

  it('adds entry if dependency matches resolution', async () => {
    const dependencies = {
      foo: '1.0.0'
    };
    const resolutions = {
      foo: '2.0.0'
    };

    mockGetRootDeps.mockResolvedValueOnce([
      {
        resolution: 'foo',
        rootDeps: ['dep']
      }
    ]);

    const result = await updateAppendix({
      dependencies,
      resolutions,
      name: 'test',
      version: '1.0.0',
      exec: mockExec
    });

    expect(result).toEqual({
      'foo@2.0.0': {
        dependents: {
          test: '1.0.0'
        },
        rootDeps: ['dep']
      }
    });

    expect(mockGetRootDeps).toHaveBeenCalledWith({
      resolutions: ['foo'],
      exec: mockExec
    });
  });

  it('merges existing entry if already present', async () => {
    const dependencies = {
      foo: '1.0.0'
    };
    const resolutions = {
      foo: '2.0.0'
    };
    const appendix = {
      'foo@2.0.0': {
        dependents: {
          other: '1.0.0'
        }
      }
    };

    const result = await updateAppendix({
      dependencies,
      resolutions,
      name: 'test',
      version: '1.0.0',
      appendix,
      exec: mockExec
    });

    expect(result).toEqual({
      'foo@2.0.0': {
        dependents: {
          other: '1.0.0',
          test: '1.0.0'
        }
      }
    });
  });

});
