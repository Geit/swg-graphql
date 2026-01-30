import { Service } from 'typedi';

import { DynamicVariableType } from '../types/ObjVar';

import db from './db';

/**
 * Derived from OBJECT_VARIABLES_VIEW.
 *
 * See {@link ObjVarUnion} for more.
 */
interface ObjectVariablesRecord {
  OBJECT_ID: number;
  NAME: string;
  TYPE: number;
  VALUE: string | null;
}

interface BaseObjvarType {
  name: string;
  type: unknown;
  value: unknown;
}

interface ObjVarString extends BaseObjvarType {
  name: string;
  type: DynamicVariableType.STRING;
  value: string;
}

interface ObjVarNetworkId extends BaseObjvarType {
  name: string;
  type: DynamicVariableType.NETWORK_ID;
  value: string;
}

interface ObjVarStringArray extends BaseObjvarType {
  name: string;
  type: DynamicVariableType.STRING_ARRAY;
  value: string[];
}

interface ObjVarNetworkIdArray extends BaseObjvarType {
  name: string;
  type: DynamicVariableType.NETWORK_ID_ARRAY;
  value: string[];
}

interface ObjVarFloat extends BaseObjvarType {
  name: string;
  type: DynamicVariableType.REAL;
  value: number;
}

interface ObjVarFloatArray extends BaseObjvarType {
  name: string;
  type: DynamicVariableType.REAL_ARRAY;
  value: number[];
}

interface ObjVarInt extends BaseObjvarType {
  name: string;
  type: DynamicVariableType.INT;
  value: number;
}

interface ObjVarIntArray extends BaseObjvarType {
  name: string;
  type: DynamicVariableType.INT_ARRAY;
  value: number[];
}

type ObjVar =
  | ObjVarString
  | ObjVarStringArray
  | ObjVarNetworkId
  | ObjVarNetworkIdArray
  | ObjVarFloatArray
  | ObjVarFloat
  | ObjVarInt
  | ObjVarIntArray;

export const stringArrayObjvar =
  (objvarName: string) =>
  (t: ObjVar): t is ObjVarNetworkIdArray =>
    t.name === objvarName && t.type === DynamicVariableType.STRING_ARRAY;

export const networkIdArrayObjvar =
  (objvarName: string) =>
  (t: ObjVar): t is ObjVarNetworkIdArray =>
    t.name === objvarName && t.type === DynamicVariableType.NETWORK_ID_ARRAY;

export const stringObjvar =
  (objvarName: string) =>
  (t: ObjVar): t is ObjVarString =>
    t.name === objvarName && t.type === DynamicVariableType.STRING;

export const floatObjvar =
  (objvarName: string) =>
  (t: ObjVar): t is ObjVarFloat =>
    t.name === objvarName && t.type === DynamicVariableType.REAL;

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

  static convertObjVar(name: string, type: number, value: string | null): ObjVar {
    if (type === DynamicVariableType.INT || type === DynamicVariableType.REAL) {
      return {
        name,
        type,
        value: Number(value),
      };
    }

    if (type === DynamicVariableType.INT_ARRAY || type === DynamicVariableType.REAL_ARRAY) {
      return {
        name,
        type,
        value: value?.split(':').filter(Boolean).map(Number) ?? [],
      };
    }

    if (type === DynamicVariableType.STRING_ARRAY || type === DynamicVariableType.NETWORK_ID_ARRAY) {
      return {
        name,
        type,
        value: value?.split(':').filter(Boolean) ?? [],
      };
    }

    return {
      name,
      type,
      value: value ?? '',
    };
  }
}
