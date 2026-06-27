import { describe, it, expect, vi } from 'vitest';

import { ServerObjectService } from '../services/ServerObjectService';
import { ServerFirst } from '../types/ServerFirst';

import { ServerFirstResolver } from './ServerFirstResolver';

vi.mock('../services/db');

function makeResolver(getOne = vi.fn()) {
  const resolver = new ServerFirstResolver();
  (resolver as unknown as { objectService: ServerObjectService }).objectService = {
    getOne,
  } as unknown as ServerObjectService;
  return { resolver, getOne };
}

describe('ServerFirstResolver.character', () => {
  it('loads the character node by its recorded oid', () => {
    const creature = { id: '264553502281' };
    const { resolver, getOne } = makeResolver(vi.fn().mockReturnValue(creature));

    const result = resolver.character({ characterOid: '264553502281' } as ServerFirst);

    expect(getOne).toHaveBeenCalledWith('264553502281');
    expect(result).toBe(creature);
  });

  it('returns null without loading when no oid was recorded', () => {
    const { resolver, getOne } = makeResolver();

    expect(resolver.character({ characterOid: null } as ServerFirst)).toBeNull();
    expect(getOne).not.toHaveBeenCalled();
  });
});
