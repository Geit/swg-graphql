import DataLoader from 'dataloader';
import { Service } from 'typedi';

import { PropertyListEntry } from '../types/PropertyList';

import knexDb from './db';

/**
 * Derived from property_lists.tab
 *
 */
interface PropertyListRecord {
  OBJECT_ID: number;
  LIST_ID: number;
  VALUE: string;
}

interface PropertyListArgs {
  objectId: string;
  listId?: number | null;
}

@Service()
export class PropertyListService {
  private dataloader = new DataLoader(PropertyListService.batchFunction);
  load = this.dataloader.load.bind(this.dataloader);

  private static convertRecordToObject(record: PropertyListRecord): PropertyListEntry {
    return {
      listId: record.LIST_ID,
      value: record.VALUE,
    };
  }

  static async batchFunction(keys: readonly PropertyListArgs[]) {
    const query = knexDb.select().from<PropertyListRecord>('PROPERTY_LISTS');

    keys.forEach(({ listId, objectId }) => {
      query.orWhere(builder => {
        builder.where('OBJECT_ID', objectId);

        if (listId) {
          builder.andWhere('LIST_ID', listId);
        }
      });
    });

    const results = await query;

    return keys.map(({ listId, objectId }) =>
      results
        .filter(result => String(result.OBJECT_ID) === objectId && (!listId || result.LIST_ID === listId))
        .map(PropertyListService.convertRecordToObject)
    );
  }
}
