import { Service } from 'typedi';

import { UnenrichedServerObject } from '../types/ServerObject';

import { StringFileLoader } from './StringFileLoader';

interface ResolveNameOptions {
  resolveCustomNames: boolean;
  stringFileService: StringFileLoader;
}

@Service()
export class NameResolutionService {
  async resolveName(object: UnenrichedServerObject, { resolveCustomNames, stringFileService }: ResolveNameOptions) {
    const trimmedName = object.name?.trim();

    if (resolveCustomNames && trimmedName) return trimmedName;

    if (object.staticItemName) {
      const strings = await stringFileService.load('static_item_n');

      return strings[object.staticItemName] || `@static_item_n:${object.staticItemName}`;
    }

    if (object.nameStringTable && object.nameStringText) {
      const strings = await stringFileService.load(object.nameStringTable);

      return strings[object.nameStringText] || `@${object.nameStringTable}:${object.nameStringText}`;
    }
    // TODO: Come up with some better default name (perhaps based on the object type or template?)
    return 'UNKNOWN';
  }
}
