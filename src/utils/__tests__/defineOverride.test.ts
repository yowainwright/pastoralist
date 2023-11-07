import { defineOverride } from '../defineOverride';

describe('defineOverride', () => {

  it('returns empty object if no overrides in config', () => {
    const config = {};
    const result = defineOverride(config);
    expect(result).toEqual({
      type: '',
      overrides: {}
    });
  });

  it('returns overrides if only overrides in config', () => {
    const config = {
      overrides: {
        foo: '1.0.0'
      }
    };
    const result = defineOverride(config);
    expect(result).toEqual({
      type: 'overrides',
      overrides: {
        foo: '1.0.0'
      }
    });
  });

  it('returns pnpm overrides if both pnpm and resolutions', () => {
    const config = {
      pnpm: {
        overrides: {
          foo: '1.0.0'
        }
      },
      resolutions: {
        bar: '1.0.0'
      }
    };
    const result = defineOverride(config);
    expect(result).toEqual({
      type: '',
      overrides: {}
    });
  });

  it('returns resolutions if both resolutions and overrides', () => {
    const config = {
      resolutions: {
        foo: '1.0.0'
      },
      overrides: {
        bar: '1.0.0'
      }
    };
    const result = defineOverride(config);
    expect(result).toEqual({
      type: '',
      overrides: {}
    });
  });

});
