import pLimit from 'p-limit';

import { NameResolutionService } from '../../services/NameResolutionService';
import { StringFileLoader } from '../../services/StringFileLoader';
import { ResourceTypeService } from '../../services/ResourceTypeService';
import TAGIFY from '../../utils/tagify';
import { saveDocument } from '../utils/saveDocuments';
import { ObjectDocument, ResourceTypeDocument, SearchDocument } from '../types';
import { ResourceType } from '../../types/ResourceType';
import { ClusterClockService } from '../../services/ClusterClockService';
import { PlanetObjectService } from '../../services/PlanetObjectService';
import { isPresent } from '../../utils/utility-types';

const stringFileService = new StringFileLoader();
const resourceTypeService = new ResourceTypeService();
const clockService = new ClusterClockService();
const planetService = new PlanetObjectService();

export async function indexResources() {
  let hasMorePages = true;
  const limit = 100;
  let offset = 0;

  do {
    hasMorePages = await indexPageOfResources(limit, offset);
    offset += limit;
  } while (hasMorePages);
}

async function indexPageOfResources(limit = 100, offset = 0) {
  console.log('Finding new resources');
  console.time('Finding new resources');

  const resources = await resourceTypeService.getMany({ limit, offset });

  if (resources.length === 0) return false;

  console.timeEnd('Finding new resources');
  console.time('Producing resource docs');

  console.log(`Producing documents for ${resources.length} resources`);
  const promiseLimit = pLimit(10);

  const documentPromises = resources.map(resource =>
    promiseLimit(async () => {
      const slug = `Processing Resource ${resource.id}`;
      console.time(slug);
      const documentToCommit = await produceDocumentForResource(resource);

      // console.log(documentToCommit);

      if (documentToCommit) {
        const result = await saveDocument(documentToCommit);

        console.timeEnd(slug);
        return result;
      }

      console.timeEnd(slug);
    })
  );

  const results = await Promise.all(documentPromises);

  const hasMorePages = results.some(r => r && r.result === 'created') && results.length === limit;

  return hasMorePages;
}

async function produceDocumentForResource(resource: ResourceType): Promise<ResourceTypeDocument | null> {
  // We're going to recursively get the object, and anything that loads with it.
  // This probably won't include stuff that's in demand-loaded containers, like the bank,
  // so it may be worth adding those manually at some point.

  if (!resource || !resource.name || !resource.classId || !resource.depletedTime) return null;

  const resourceClassNames = await stringFileService.load('resource/resource_names');

  const resourceClass = resourceClassNames?.[resource.classId] ?? null;

  const planetIds = resource.planetDistribution?.map(pd => pd.planetId) ?? [];
  const planetPromises = Promise.all(planetIds?.map(id => planetService.load(id)));

  const [resourceDepletedTime, planets] = await Promise.all([
    clockService.getRealTime(resource.depletedTime),
    planetPromises,
  ]);

  if (!resourceClass || !resourceDepletedTime) return null;

  const document: ResourceTypeDocument = {
    type: 'ResourceType',
    id: resource.id,
    resourceName: resource.name,
    resourceClass,
    resourceClassId: resource.classId,
    resourcePlanets: planets.map(p => p?.PLANET_NAME).filter(isPresent),
    resourceDepletedTime,
    resourceAttributes: Object.fromEntries(resource.attributes?.map(attr => [attr.attributeId, attr.value]) ?? []),
    lastSeen: new Date().toISOString(),
  };

  return document;
}
