import { Service } from 'typedi';

import { DynamicVariableType } from '../types/ObjVar';

import db from './db';

/**
 * Derived from OBJECT_VARIABLES_VIEW.
 *
 * See {@link ObjVarUnion} for more.
 */
interface ObjectVariablesRecord {
  OBJECT_ID: string;
  NAME: string;
  TYPE: number;
  VALUE: string;
}

@Service()
export class ObjVarService {
  private db = db;

  async getObjVarsForObject(id: string) {
    // The OBJECT_VARIABLES_VIEW view retrieves the base 20 objvars that can be
    // stored on an object within the objects table, and combines them with the
    // extraneous objvars from OBJECT_VARIABLE_NAMES and OBJECT_VARIABLES for us.
    //
    // This could perhaps be refactored later to eliminate the need for a double fetch on the
    // object row, but at the volumes this service is expected to operate at, it's not really a
    // problem for us.
    const objvars = await this.db
      .select('NAME', 'TYPE', 'VALUE')
      .from<ObjectVariablesRecord>('OBJECT_VARIABLES_VIEW')
      .orderBy('NAME')
      .where('OBJECT_ID', id);

    return [...objvars.map(ov => ObjVarService.convertObjVar(ov.NAME, ov.TYPE, ov.VALUE))];
  }

  static convertObjVar(name: string, type: number, value: string) {
    let actualValue: string | string[] | number | number[] = value;

    if (type === DynamicVariableType.INT || type === DynamicVariableType.REAL) {
      actualValue = Number(value);
    } else if (type === DynamicVariableType.INT_ARRAY || type === DynamicVariableType.REAL_ARRAY) {
      actualValue = value.split(':').filter(Boolean).map(Number);
    } else if (type === DynamicVariableType.STRING || type === DynamicVariableType.NETWORK_ID) {
      // no-op, technically.
      actualValue = value;
    } else if (type === DynamicVariableType.STRING_ARRAY || type === DynamicVariableType.NETWORK_ID_ARRAY) {
      actualValue = value.split(':').filter(Boolean);
    }

    return {
      name,
      type,
      value: actualValue,
    };
  }
}
