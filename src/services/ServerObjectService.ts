import { Service } from 'typedi';

import { ENABLE_TEXT_SEARCH } from '../config';
import { WeaponObject, CreatureObject, ServerObject, TangibleObject } from '../types';
import { BuildingObject } from '../types/BuildingObject';
import { CellObject } from '../types/CellObject';
import { HarvesterInstallationObject } from '../types/HarvesterInstallationObject';
import { InstallationObject } from '../types/InstallationObject';
import { ManfSchematicObject } from '../types/ManfSchematicObject';
import { PlayerCreatureObject } from '../types/PlayerCreatureObject';
import { PlayerObject } from '../types/PlayerObject';
import { ResourceContainerObject } from '../types/ResourceContainerObject';
import { ShipObject } from '../types/ShipObject';

import knexDb from './db';
import { TangibleObjectRecord } from './TangibleObjectService';

// The TYPE_ID field is a magic number defined by the respective Template Definition Format files
// in the Galaxies source code. They are used here to refine the type returned by the ServerObject service
// which is then in turn used to drive the other resolvers/services in the codebase.
const TAGIFY = (input: string) => parseInt(Buffer.from(input).toString('hex'), 16);
const TAG_TO_TYPE_MAP = {
  [TAGIFY('TANO')]: TangibleObject,
  [TAGIFY('CREO')]: CreatureObject,
  [TAGIFY('WEAO')]: WeaponObject,
  [TAGIFY('RCNO')]: ResourceContainerObject,
  [TAGIFY('BUIO')]: BuildingObject,
  [TAGIFY('SCLT')]: CellObject,
  [TAGIFY('SSHP')]: ShipObject,
  [TAGIFY('HINO')]: HarvesterInstallationObject,
  [TAGIFY('INSO')]: InstallationObject,
  [TAGIFY('MCSO')]: ManfSchematicObject,
  [TAGIFY('PLAY')]: PlayerObject,
} as const;

/**
 * Derived from objects.tab
 *
 * See {@link ServerObject} for descriptions of each field.
 */
interface ServerObjectRecord {
  OBJECT_ID: string;
  X: number | null;
  Y: number | null;
  Z: number | null;
  QUATERNION_W: number | null;
  QUATERNION_X: number | null;
  QUATERNION_Y: number | null;
  QUATERNION_Z: number | null;
  NODE_X: number | null;
  NODE_Y: number | null;
  NODE_Z: number | null;
  TYPE_ID: number | null;
  SCENE_ID: string | null;
  CONTROLLER_TYPE: number | null;
  DELETED: number | null;
  OBJECT_NAME: string | null;
  VOLUME: number | null;
  CONTAINED_BY: string | null;
  SLOT_ARRANGEMENT: number | null;
  PLAYER_CONTROLLED: string | null;
  CACHE_VERSION: number | null;
  LOAD_CONTENTS: string | null;
  CASH_BALANCE: number | null;
  BANK_BALANCE: number | null;
  COMPLEXITY: number | null;
  NAME_STRING_TABLE: string | null;
  NAME_STRING_TEXT: string | null;
  OBJECT_TEMPLATE_ID: number | null;
  STATIC_ITEM_NAME: string | null;
  STATIC_ITEM_VERSION: number | null;
  CONVERSION_ID: number | null;
  DELETED_DATE: Date | null;
  LOAD_WITH: string | null;
  SCRIPT_LIST: string | null;
  OBJECT_SCALE: number | null;
}

interface GetManyFilters {
  excludeDeleted?: boolean;
  limit?: number;
  containedById: string;
  searchText: string;
  objectIds: string[];
  ownedBy: string[];
  objectTypes: number[];
}

@Service()
export class ServerObjectService {
  private db = knexDb;

  prepareManyQuery(filters: Partial<GetManyFilters>) {
    const query = this.db.select().from<ServerObjectRecord>('OBJECTS');

    if (filters.containedById) {
      query.andWhere('CONTAINED_BY', '=', filters.containedById);
    }

    if (filters.objectIds) {
      query.whereIn('OBJECT_ID', filters.objectIds);
    }

    if (filters.ownedBy) {
      query
        .innerJoin<TangibleObjectRecord>('TANGIBLE_OBJECTS', 'OBJECTS.OBJECT_ID', 'TANGIBLE_OBJECTS.OBJECT_ID')
        .whereIn('OWNER_ID', filters.ownedBy);
    }

    if (filters.objectTypes) {
      query.whereIn('TYPE_ID', filters.objectTypes);
    }

    if (filters.searchText) {
      const searchText = filters.searchText.trim();

      if (ENABLE_TEXT_SEARCH) {
        //
        /*
          This requires a specific index to be setup in Oracle. Something like:

          BEGIN
            ctx_ddl.create_preference('object_search_idx', 'MULTI_COLUMN_DATASTORE');
            ctx_ddl.set_attribute('object_search_idx', 'COLUMNS', 'object_name, name_string_text, static_item_name');
          END;


          CREATE INDEX object_search_idx_real
          ON objects(name_string_table)
          INDEXTYPE IS CTXSYS.CONTEXT
          PARAMETERS ('DATASTORE object_search_idx SYNC (EVERY "SYSDATE+1/24")') ONLINE PARALLEL 2;
        */
        query.where(wb => {
          wb.whereRaw('CONTAINS(NAME_STRING_TABLE, ?, 1) > 0', [`${searchText}%`])
            .orWhere('OBJECT_ID', '=', `${searchText}`)
            .orWhere('CONTAINED_BY', '=', `${searchText}`)
            .orWhere('LOAD_WITH', '=', `${searchText}`)
            .orderByRaw('SCORE(1) DESC');
        });
      } else {
        query
          .where(wb => {
            wb.where('OBJECT_ID', '=', searchText)
              .orWhere('CONTAINED_BY', '=', searchText)
              .orWhere('LOAD_WITH', '=', searchText);
          })
          // Poor man's sort to put the actual OID at the top of the results
          .orderByRaw('case when OBJECT_ID = ? then 1 else 2 end, OBJECT_ID', [searchText]);
      }
    }

    if (filters.excludeDeleted) {
      query.whereNull('DELETED_DATE');
    }

    return query;
  }

  async getMany(filters: Partial<GetManyFilters>) {
    const query = this.prepareManyQuery(filters);

    query.limit(filters.limit ?? 50);

    const objects = await query;

    return objects?.map(ServerObjectService.convertRecordToObject);
  }

  async countMany(filters: Partial<GetManyFilters>) {
    const query = this.prepareManyQuery(filters);
    const objects = await query.count('OBJECT_ID', { as: 'count' });
    return Number(objects[0].count);
  }

  async getOne(id: string): Promise<Omit<ServerObject, 'contents' | 'objVars'> | null> {
    const object = await this.db.first().from<ServerObjectRecord>('OBJECTS').where({
      OBJECT_ID: id,
    });

    return object ? ServerObjectService.convertRecordToObject(object) : null;
  }

  private static convertRecordToObject(record: ServerObjectRecord): Omit<ServerObject, 'contents' | 'objVars'> {
    // Refine the type based on the TYPE_ID column.
    let objectSubClass = (record.TYPE_ID && TAG_TO_TYPE_MAP[record.TYPE_ID]) || ServerObject;

    if (record.TYPE_ID === TAGIFY('CREO') && record.PLAYER_CONTROLLED === 'Y') {
      objectSubClass = PlayerCreatureObject;
    }

    return Object.assign(new objectSubClass(), {
      id: record.OBJECT_ID,
      name: record.OBJECT_NAME,
      location: [record.X, record.Y, record.Z],
      rotation: [record.QUATERNION_W, record.QUATERNION_X, record.QUATERNION_Y, record.QUATERNION_Z],
      nodeLocation: [record.NODE_X, record.NODE_Y, record.NODE_Z],
      typeId: record.TYPE_ID,
      scene: record.SCENE_ID,
      controllerType: record.CONTROLLER_TYPE,
      deletionReason: record.DELETED,
      deletionDate: record.DELETED_DATE?.toISOString(),
      volume: record.VOLUME,
      containedById: record.CONTAINED_BY,
      slotArrangement: record.SLOT_ARRANGEMENT,
      playerControlled: record.PLAYER_CONTROLLED === 'Y',
      cacheVersion: record.CACHE_VERSION,
      loadContents: record.LOAD_CONTENTS === 'Y',
      cashBalance: record.CASH_BALANCE,
      bankBalance: record.BANK_BALANCE,
      complexity: record.COMPLEXITY,
      nameStringTable: record.NAME_STRING_TABLE,
      nameStringText: record.NAME_STRING_TEXT,
      templateId: record.OBJECT_TEMPLATE_ID,
      staticItemName: record.STATIC_ITEM_NAME,
      staticItemVersion: record.STATIC_ITEM_VERSION,
      conversionId: record.CONVERSION_ID,
      loadWithId: record.LOAD_WITH,
      scriptList: record.SCRIPT_LIST?.split(':').filter(Boolean) ?? null,
    });
  }
}
