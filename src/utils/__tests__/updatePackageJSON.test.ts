import { updatePackageJSON } from '../updatePackageJSON';

describe('updatePackageJSON', () => {

  const originalConfig = {
    name: 'test',
    version: '1.0.0',
    dependencies: {
      foo: '1.0.0'
    }
  };

  it('adds resolutions', () => {
    const resolutions = {
      foo: '2.0.0'
    };

    const updatedConfig = {
      ...originalConfig,
      resolutions,
    }

    const result = updatePackageJSON({
      config: updatedConfig,
      resolutions,
      path: 'test.json',
      isTesting: true
    });

    expect(result).toEqual({
      ...originalConfig,
      resolutions: {
        foo: '2.0.0'
      },
    });
  });

  it('adds appendix', () => {
    const appendix = {
      'foo@2.0.0': {
        dependents: {
          test: '1.0.0'
        }
      }
    };

    const resolutions = {
      foo: '2.0.0'
    };

    const updatedConfig = {
      ...originalConfig,
      resolutions,
    }

    const result = updatePackageJSON({
      config: updatedConfig,
      appendix,
      path: 'test.json',
      isTesting: true
    });

    expect(result?.pastoralist?.appendix).toEqual(appendix);
  });

});
