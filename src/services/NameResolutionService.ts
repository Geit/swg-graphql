import { Service } from 'typedi';

import { UnenrichedServerObject } from '../types/ServerObject';

import { StringFileLoader } from './StringFileLoader';

@Service()
export class NameResolutionService {
  constructor(private readonly stringFileService: StringFileLoader) {
    // Do nothing
  }

  async resolveName(object: UnenrichedServerObject, resolveCustomNames = true) {
    const trimmedName = object.name?.trim();

    if (resolveCustomNames && trimmedName) return trimmedName;

    if (object.staticItemName) {
      const strings = await this.stringFileService.load('static_item_n');

      return strings[object.staticItemName] || `@static_item_n:${object.staticItemName}`;
    }

    if (object.nameStringTable && object.nameStringText) {
      const strings = await this.stringFileService.load(object.nameStringTable);

      return strings[object.nameStringText] || `@${object.nameStringTable}:${object.nameStringText}`;
    }

    // TODO: Come up with some better default name (perhaps based on the object type or template?)
    return object.nameStringText || 'UNKNOWN';
  }
}
