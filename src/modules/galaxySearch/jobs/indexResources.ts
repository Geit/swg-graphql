import { isPresent } from '@core/utils/utility-types';

import { saveDocument } from '../utils/saveDocuments';
import { ResourceTypeDocument } from '../types';
import gqlSdk, { GetResourceListingQuery } from '../gqlSdk';

export type JobLogger = (message: string) => Promise<number>;

export interface IndexResourcesJob {
  jobName: 'indexResources';
  full: boolean;
}

type ResourceResultType = GetResourceListingQuery['resources']['results'][number];

const RESOURCES_PER_PAGE = 5000;

export async function indexResources(log: JobLogger, fullIndex: boolean) {
  let hasMorePages = true;
  const limit = RESOURCES_PER_PAGE;
  let offset = 0;

  do {
    ({ hasMorePages } = await indexPageOfResources(log, limit, offset, fullIndex));
    offset += limit;
  } while (hasMorePages);
}

async function indexPageOfResources(log: JobLogger, limit = RESOURCES_PER_PAGE, offset = 0, fullIndex = false) {
  const startFind = Date.now();

  const resourceListingResult = await gqlSdk.getResourceListing({
    limit,
    offset,
  });

  const resources = resourceListingResult.resources.results;

  await log(`Finding new resources: ${Date.now() - startFind}ms`);
  if (resources.length === 0) return { hasMorePages: false };

  const startProduce = Date.now();
  await log(`Producing documents for ${resources.length} resources`);

  const documentPromises = resources.map(async resource => {
    const documentToCommit = produceDocumentForResource(resource);

    if (documentToCommit) {
      const result = await saveDocument(documentToCommit);
      return result;
    }
  });
  const results = await Promise.all(documentPromises);

  // We have more new resources to process as long as every document was "new" and we had a full page of results.
  const hasMorePages =
    (results.every(r => r && r.result === 'created') && results.length === limit) ||
    (fullIndex && results.length === limit);

  await log(`Producing resource docs: ${Date.now() - startProduce}ms`);
  return { hasMorePages };
}

function produceDocumentForResource(resource: ResourceResultType): ResourceTypeDocument | null {
  if (!resource || !resource.name || !resource.classId || !resource.depletedTimeReal || !resource.className)
    return null;

  const document: ResourceTypeDocument = {
    type: 'ResourceType',
    id: resource.id,
    resourceName: resource.name,
    resourceClass: resource.className,
    resourceClassId: resource.classId,
    resourcePlanets: resource.planetDistribution?.map(pd => pd.sceneId).filter(isPresent) ?? [],
    resourceDepletedTime: new Date(resource.depletedTimeReal),
    resourceAttributes: Object.fromEntries(resource.attributes?.map(attr => [attr.attributeId, attr.value]) ?? []),
    resourceCirculationData: {
      ...resource.circulationData,
    },
    lastSeen: new Date().toISOString(),
  };

  return document;
}
