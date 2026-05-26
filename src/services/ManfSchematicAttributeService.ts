import DataLoader from 'dataloader';
import { Service } from 'typedi';

import knexDb from './db';

/**
 * Derived from the MANF_SCHEMATIC_ATTRIBUTES table.
 *
 * Crafting attribute values applied to a manufacturing schematic.
 * Multiple rows per schematic — one per attribute.
 */
export interface ManfSchematicAttributeRecord {
  OBJECT_ID: number;
  ATTRIBUTE_TYPE: string;
  VALUE: number | null;
}

@Service()
export class ManfSchematicAttributeService {
  private dataloader = new DataLoader(ManfSchematicAttributeService.batchFunction, {
    maxBatchSize: 999,
    cache: false,
  });
  load = this.dataloader.load.bind(this.dataloader);

  static async batchFunction(keys: readonly string[]) {
    const results = await knexDb
      .select<ManfSchematicAttributeRecord[]>()
      .from('MANF_SCHEMATIC_ATTRIBUTES')
      .whereIn('OBJECT_ID', keys);

    const byId = new Map<string, ManfSchematicAttributeRecord[]>();
    for (const result of results) {
      const id = String(result.OBJECT_ID);
      const bucket = byId.get(id);
      if (bucket) bucket.push(result);
      else byId.set(id, [result]);
    }

    return keys.map(key => byId.get(key) ?? []);
  }
}
