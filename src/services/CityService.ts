import { Service } from 'typedi';

import { CITY_UPDATE_INTERVAL } from '../config';
import { City, Citizen, CityStructure } from '../types';
import { PropertyListIds } from '../types/PropertyList';

import knexDb from './db';
import { PropertyListService } from './PropertyListService';

/**
 * Derived from city_objects.tab
 */
interface CityObjectRecord {
  OBJECT_ID: number;
}

@Service({
  global: true,
  eager: true,
})
export class CityService {
  private _cities: Map<string, Partial<City>> = new Map();
  private _citizenIdToCityId: Map<Citizen['id'], City['id']> = new Map();
  private _structureIdToCityId: Map<CityStructure['id'], City['id']> = new Map();
  private _currentUpdateCycle: Promise<void> | null = null;

  constructor(private readonly propertyListService: PropertyListService) {
    // Do nothing

    this.updateCities();
    setInterval(() => this.updateCities(), CITY_UPDATE_INTERVAL);
  }

  async getAllCities() {
    if (this._currentUpdateCycle) await this._currentUpdateCycle;

    return this._cities;
  }

  async getCity(id: string) {
    if (this._currentUpdateCycle) await this._currentUpdateCycle;

    return this._cities.get(id) ?? null;
  }

  async getCityForPlayer(playerId: string) {
    if (this._currentUpdateCycle) await this._currentUpdateCycle;

    const cityId = this._citizenIdToCityId.get(playerId);

    if (cityId) {
      return this._cities.get(cityId) ?? null;
    }

    return null;
  }

  async getCityForStructure(structureId: string) {
    if (this._currentUpdateCycle) await this._currentUpdateCycle;

    const cityId = this._structureIdToCityId.get(structureId);

    if (cityId) {
      return this._cities.get(cityId) ?? null;
    }

    return null;
  }

  async dataPopulated() {
    await this._currentUpdateCycle;
  }

  async updateCities() {
    if (!this._currentUpdateCycle) {
      this._currentUpdateCycle = this._updateCities();
    }

    await this._currentUpdateCycle;

    this._currentUpdateCycle = null;
    console.log('Cities Updated');
  }

  private async _updateCities() {
    const results = await knexDb.first().from<CityObjectRecord>('CITY_OBJECTS');

    if (!results) {
      return;
    }

    // This should give us
    const pLists = await this.propertyListService.load({ objectId: String(results.OBJECT_ID) });

    const cities = new Map();
    const citizenIdToCityId: Map<Citizen['id'], City['id']> = new Map();
    const structureIdToCityId: Map<CityStructure['id'], City['id']> = new Map();
    const updateCityData = (data: Partial<City> & Pick<City, 'id'>) => {
      const cityToUpdate = cities.get(data.id);

      if (cityToUpdate) {
        cities.set(data.id, {
          ...cityToUpdate,
          ...data,
        });
      } else {
        cities.set(data.id, data);
      }
    };

    pLists.forEach(pList => {
      switch (pList.listId) {
        case PropertyListIds.Cities: {
          // Cities is in the following formats
          // - `v2:cityId:cityName:cityHallId:cityPlanet:locX:locZ:radius:creationTime:leaderId:incomeTax:propertyTax:salesTax:travelLocX:travelLocY:travelLocZ:travelCost:travelInterplanetary:cloneLocX:cloneLocY:cloneLocZ:cloneRespawnX:cloneRespawnY:cloneRespawnZ:cloneRespawnCell:cloneId",
          // - `cityId:cityName:cityHallId:cityPlanet:locX:locZ:radius:leaderId:incomeTax:propertyTax:salesTax:travelLocX:travelLocY:travelLocZ:travelCost:travelInterplanetary:cloneLocX:cloneLocY:cloneLocZ:cloneRespawnX:cloneRespawnY:cloneRespawnZ:cloneRespawnCell:cloneId",

          if (pList.value.startsWith('v2:')) {
            const [
              ,
              id,
              name,
              cityHallId,
              planet,
              locX,
              locZ,
              radius,
              creationTime,
              mayorId,
              incomeTax,
              propertyTax,
              salesTax,
              travelLocX,
              travelLocY,
              travelLocZ,
              travelCost,
              travelInterplanetary,
              cloneLocX,
              cloneLocY,
              cloneLocZ,
              cloneRespawnX,
              cloneRespawnY,
              cloneRespawnZ,
              cloneRespawnCellId,
              cloneId,
            ] = pList.value.split(':');

            updateCityData({
              id,
              name,
              cityHallId,
              planet,
              location: [parseInt(locX), parseInt(locZ)],
              radius: parseInt(radius),
              creationTime: parseInt(creationTime),
              mayorId,
              incomeTax: parseInt(incomeTax),
              propertyTax: parseInt(propertyTax),
              salesTax: parseInt(salesTax),
              travelLocation: [parseFloat(travelLocX), parseFloat(travelLocY), parseFloat(travelLocZ)],
              travelCost: parseInt(travelCost),
              travelInterplanetary: Boolean(travelInterplanetary),
              cloneLocation: [parseFloat(cloneLocX), parseFloat(cloneLocY), parseFloat(cloneLocZ)],
              cloneRespawnLocation: [parseFloat(cloneRespawnX), parseFloat(cloneRespawnY), parseFloat(cloneRespawnZ)],
              cloneRespawnCellId,
              cloneId,
            });
          } else {
            const [
              ,
              id,
              name,
              cityHallId,
              planet,
              locX,
              locZ,
              radius,
              mayorId,
              incomeTax,
              propertyTax,
              salesTax,
              travelLocX,
              travelLocY,
              travelLocZ,
              travelCost,
              travelInterplanetary,
              cloneLocX,
              cloneLocY,
              cloneLocZ,
              cloneRespawnX,
              cloneRespawnY,
              cloneRespawnZ,
              cloneRespawnCellId,
              cloneId,
            ] = pList.value.split(':');

            updateCityData({
              id,
              name,
              cityHallId,
              planet,
              location: [parseInt(locX), parseInt(locZ)],
              radius: parseInt(radius),
              creationTime: null,
              mayorId,
              incomeTax: parseInt(incomeTax),
              propertyTax: parseInt(propertyTax),
              salesTax: parseInt(salesTax),
              travelLocation: [parseFloat(travelLocX), parseFloat(travelLocY), parseFloat(travelLocZ)],
              travelCost: parseInt(travelCost),
              travelInterplanetary: Boolean(travelInterplanetary),
              cloneLocation: [parseFloat(cloneLocX), parseFloat(cloneLocY), parseFloat(cloneLocZ)],
              cloneRespawnLocation: [parseFloat(cloneRespawnX), parseFloat(cloneRespawnY), parseFloat(cloneRespawnZ)],
              cloneRespawnCellId,
              cloneId,
            });
          }
          break;
        }

        case PropertyListIds.Citizens: {
          // Citizens is in formats
          // - `v2:cityId:citizenId:name:skillTemplate:level:title:allegiance:permissions:rank`
          // - `cityId:citizenId:name:allegiance:permissions`

          if (pList.value.startsWith('v3:')) {
            // V3 is chronicler data. I don't know why these are in the city object's PList.
            // Do nothing
          } else if (pList.value.startsWith('v2:')) {
            const [, id, citizenId, name, skillTemplate, level, title, allegiance, permissions, rank] =
              pList.value.split(':');
            const citizens = cities.get(id)?.citizens ?? [];

            citizens.push({
              id: citizenId,
              name,
              skillTemplate,
              level: parseInt(level),
              title,
              allegiance,
              permissions: parseInt(permissions),
              rank,
            });

            citizenIdToCityId.set(citizenId, id);
            updateCityData({
              id,
              citizens,
            });
          } else {
            const [id, citizenId, name, allegiance, permissions] = pList.value.split(':');
            const citizens = cities.get(id)?.citizens ?? [];

            citizens.push({
              id,
              citizenId,
              name,
              skillTemplate: null,
              level: null,
              title: null,
              allegiance,
              permissions: parseInt(permissions),
              rank: null,
            });

            citizenIdToCityId.set(citizenId, id);
            updateCityData({
              id,
              citizens,
            });
          }
          break;
        }

        case PropertyListIds.CityStructures: {
          // CityStructures is in format `cityId:structureId:type:valid`
          const [id, structureId, type, valid] = pList.value.split(':');
          const structures = cities.get(id)?.structures ?? [];

          structures.push({
            id: structureId,
            type: parseInt(type),
            isValid: Boolean(valid),
          });

          structureIdToCityId.set(structureId, id);
          updateCityData({
            id,
            structures,
          });
          break;
        }
        default:
          break;
      }
    });

    this._cities = cities;
    this._citizenIdToCityId = citizenIdToCityId;
    this._structureIdToCityId = structureIdToCityId;
  }
}
