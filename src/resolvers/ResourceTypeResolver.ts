import { Field, FieldResolver, Float, ObjectType, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';
import { CamelCasedProperties } from 'type-fest';

import { ClusterClockService } from '../services/ClusterClockService';
import { DataTableService } from '../services/DataTableService';
import { PlanetObjectService } from '../services/PlanetObjectService';
import { StringFileLoader } from '../services/StringFileLoader';
import {
  ResourceType,
  ResourceTypeAttribute,
  ResourceTypeFractalData,
  ResourceTypePlanetDistribution,
} from '../types/ResourceType';

import { ResourceContainerObjectService } from '@core/services/ResourceContainerObjectService';

type ResourceTreeDatatableRow = CamelCasedProperties<{
  INDEX: number;
  ENUM: string;
}>;

type ResourceDistributionRow = CamelCasedProperties<{
  'Resource Index#': number;
  Planet: string;
  'Pool Size Min': number;
  'Pool Size Max': number;
  'Fractal Type': 'A' | 'B';
  'Fractal X Scale': number;
  'Fractal Y Scale': number;
  'Fractal Bias': number;
  'Fractal Gain': number;
  'Fractal Combo Rule': number;
  'Fractal Frequency': number;
  'Fractal Amplitude': number;
  'Fractal Octaves': number;
}>;

@ObjectType()
export class ResourceCirculationData {
  @Field(() => Float, { description: 'Total amount of this resource available on the server.' })
  totalQuantity: number;

  @Field(() => Float, { description: 'Number of unique objects containing this resource on the server.' })
  containerObjects: number;
}

@Resolver(() => ResourceType)
@Service()
export class ResourceTypeResolver {
  constructor(
    private readonly stringService: StringFileLoader,
    private readonly clusterClock: ClusterClockService,
    private readonly dataTable: DataTableService,
    private readonly rcObjectService: ResourceContainerObjectService
  ) {
    // Do nothing
  }

  @FieldResolver(() => String, { nullable: true, description: 'Name of the resource' })
  async name(@Root() resource: ResourceType) {
    if (!resource.name || !resource.name?.startsWith('@')) return resource.name;

    const parts = resource.name.replace('@', '').split(':');

    const strings = await this.stringService.load(parts[0]);

    return strings?.[parts[1]] ?? null;
  }

  @FieldResolver(() => String, { nullable: true, description: 'Name of the resource class' })
  async className(@Root() resource: ResourceType) {
    if (!resource.classId) return null;

    const resourceClassNames = await this.stringService.load('resource/resource_names');

    return resourceClassNames?.[resource.classId] ?? null;
  }

  @FieldResolver(() => String, { nullable: true })
  async depletedTimeReal(@Root() resource: ResourceType) {
    if (!resource.depletedTime) return null;

    const time = await this.clusterClock.getRealTime(resource.depletedTime);

    return time?.toISOString();
  }

  @FieldResolver(() => ResourceTypeFractalData, {
    nullable: true,
    description: 'Shared fractal data for this resource',
  })
  async fractalData(@Root() resource: ResourceType): Promise<ResourceTypeFractalData | null> {
    const resourceTree = (await this.dataTable.load({
      fileName: 'resource/resource_tree.iff',
      camelcase: true,
    })) as ResourceTreeDatatableRow[];

    const resourceRow = resourceTree.find(row => row.enum === resource.classId);

    if (!resourceRow) return null;

    const resourceDistributions = (await this.dataTable.load({
      fileName: 'resource/resource_distribution.iff',
    })) as ResourceDistributionRow[];

    const dist = resourceDistributions.find(d => d['resourceIndex#'] === resourceRow.index);

    if (!dist) return null;

    return {
      poolSizeMin: dist.poolSizeMin,
      poolSizeMax: dist.poolSizeMax,
      type: dist.fractalType,
      xScale: dist.fractalXScale,
      yScale: dist.fractalYScale,
      bias: dist.fractalBias,
      gain: dist.fractalGain,
      comboRule: dist.fractalComboRule,
      frequency: dist.fractalFrequency,
      amplitude: dist.fractalAmplitude,
      octaves: dist.fractalOctaves,
    };
  }

  @FieldResolver(() => ResourceCirculationData)
  circulationData(@Root() resource: ResourceType): Promise<ResourceCirculationData> {
    return this.rcObjectService.getCirculationAmountForResourceTypeId(Number(resource.id));
  }
}

@Resolver(() => ResourceTypeAttribute)
@Service()
export class ResourceTypeAttributeResolver {
  constructor(private readonly stringService: StringFileLoader) {
    // Do nothing
  }

  @FieldResolver(() => String, { nullable: true, description: 'Resolved name of the attribute' })
  async attributeName(@Root() attribute: ResourceTypeAttribute) {
    if (!attribute.attributeId) return null;

    const attributeNames = await this.stringService.load('obj_attr_n');

    return attributeNames?.[attribute.attributeId] ?? null;
  }
}

@Resolver(() => ResourceTypePlanetDistribution)
@Service()
export class ResourceTypePlanetDistributionResolver {
  constructor(
    private readonly stringService: StringFileLoader,
    private readonly planetObjectService: PlanetObjectService
  ) {
    // Do nothing
  }

  @FieldResolver(() => String, { nullable: true, description: 'Resolved name of the planet' })
  async sceneId(@Root() planetDistribution: ResourceTypePlanetDistribution) {
    if (!planetDistribution.planetId) return null;

    const planetData = await this.planetObjectService.load(planetDistribution.planetId);

    return planetData?.PLANET_NAME ?? null;
  }

  @FieldResolver(() => String, { nullable: true, description: 'Resolved name of the planet' })
  async sceneName(@Root() fractalData: ResourceTypePlanetDistribution) {
    const sceneId = await this.sceneId(fractalData);

    const sceneNames = await this.stringService.load('planet_n');

    return sceneNames[sceneId ?? ''] ?? null;
  }
}
