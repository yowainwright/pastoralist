import { getRootDeps } from '../getRootDeps';

describe('getRootDeps', () => {

  const mockExec = jest.fn();

  beforeEach(() => {
    mockExec.mockReset();
  });

  it('returns empty array if no resolutions', async () => {
    const result = await getRootDeps({
      resolutions: [],
      exec: mockExec
    });
    expect(result).toEqual([]);
  });

  it('returns root deps for each resolution', async () => {
    mockExec.mockResolvedValueOnce({
      dependencies: {
        'dep1': {
          version: '1.0.0'
        },
        'dep2': {
          version: '2.0.0'
        }
      }
    });

    const resolutions = ['foo'];
    const result = await getRootDeps({
      resolutions,
      exec: mockExec
    });

    expect(result).toEqual([
      {
        resolution: 'foo',
        rootDeps: ['dep1@1.0.0', 'dep2@2.0.0']
      }
    ]);

    expect(mockExec).toHaveBeenCalledWith('npm', ['ls', 'foo', '--json']);
  });

  it('returns empty rootDeps if error', async () => {
    mockExec.mockRejectedValue(new Error('test error'));

    const resolutions = ['foo'];
    const result = await getRootDeps({
      resolutions,
      exec: mockExec
    });

    expect(result).toEqual([
      {
        resolution: 'foo',
        rootDeps: []
      }
    ]);
  });

});
