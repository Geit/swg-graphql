import { Service } from 'typedi';

import { City } from '../types';
import { PropertyListIds } from '../types/PropertyList';

import knexDb from './db';
import { PropertyListService } from './PropertyListService';

/**
 * Derived from property_lists.tab
 *
 */
interface CityObjectRecord {
  OBJECT_ID: number;
}

@Service()
export class CityService {
  constructor(private readonly propertyListService: PropertyListService) {
    // Do nothing
  }

  async getAllCities() {
    const results = await knexDb.first().from<CityObjectRecord>('CITY_OBJECTS');

    if (!results) {
      return null;
    }

    // This should give us
    const pLists = await this.propertyListService.load({ objectId: String(results.OBJECT_ID) });

    const cities: Map<string, Partial<City>> = new Map();

    const updateCityData = (data: Partial<City> & Pick<City, 'id'>) => {
      const cityToUpdate = cities.get(data.id);

      if (cityToUpdate) {
        Object.assign(cityToUpdate, data);
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
              cityPlanet,
              locX,
              locZ,
              radius,
              creationTime,
              leaderId,
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
            ] = pList.value.split(',');

            updateCityData({
              id,
              name,
              cityHallId,
              cityPlanet,
              cityLocation: [parseInt(locX), parseInt(locZ)],
              radius: parseInt(radius),
              creationTime: parseInt(creationTime),
              leaderId,
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
              cityPlanet,
              locX,
              locZ,
              radius,
              leaderId,
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
            ] = pList.value.split(',');

            updateCityData({
              id,
              name,
              cityHallId,
              cityPlanet,
              cityLocation: [parseInt(locX), parseInt(locZ)],
              radius: parseInt(radius),
              creationTime: null,
              leaderId,
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
            break;
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

            updateCityData({
              id,
              citizens,
            });
          } else {
            const [, id, citizenId, name, allegiance, permissions] = pList.value.split(':');
            const citizens = cities.get(id)?.citizens ?? [];

            citizens.push({
              id: citizenId,
              name,
              skillTemplate: null,
              level: null,
              title: null,
              allegiance,
              permissions: parseInt(permissions),
              rank: null,
            });

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

    return cities;
  }

  async getCity(id: string) {
    const cities = await this.getAllCities();

    return cities?.get(id) ?? null;
  }
}
