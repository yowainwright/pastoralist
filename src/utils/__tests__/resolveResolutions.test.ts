import { resolveResolutions } from '../resolveResolutions';
import { OverridesConfig } from '../../interfaces';

describe('resolveResolutions', () => {

  it('returns empty object if no overrides', () => {
    const config = {};
    const result = resolveResolutions({ config });
    expect(result).toEqual({});
  });

  it('returns overrides if simple overrides exist', () => {
    const config = {
      overrides: {
        foo: '1.0.0'
      }
    };
    const expected = {
      overrides: {
        foo: '1.0.0'
      }
    };
    const result = resolveResolutions({ config });
    expect(result).toEqual(expected);
  });

  it('returns empty object if complex overrides exist', () => {
    const config = {
      overrides: {
        foo: {
          bar: '1.0.0'
        }
      }
    } as unknown as OverridesConfig;
    const result = resolveResolutions({ config });
    expect(result).toEqual({});
  });

});
