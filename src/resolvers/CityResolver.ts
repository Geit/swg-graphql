import { FieldResolver, Int, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';

import { ServerObjectService } from '../services/ServerObjectService';
import { StringFileLoader } from '../services/StringFileLoader';
import { BuildingObject, CellObject, PlayerCreatureObject } from '../types';
import { City, Citizen, CityStructure, CityStructureSummary } from '../types/City';

enum StructureTypeFlags {
  Register = 1 << 0,
  CostCityHall = 1 << 1,
  CostCityHigh = 1 << 2,
  CostCityMedium = 1 << 3,
  CostCityLow = 1 << 4,
  MissionTerminal = 1 << 5,
  SkillTrainer = 1 << 6,
  Decoration = 1 << 7,
  SpecSampleRich = 1 << 8,
  SpecFarming = 1 << 9,
  SpecIndustry = 1 << 10,
  SpecResearch = 1 << 11,
  SpecCloning = 1 << 12,
  SpecMissions = 1 << 13,
  SpecEntertainer = 1 << 14,
  SpecDoctor = 1 << 15,
  SpecStronghold = 1 << 16,
  SpecMasterManufacturing = 1 << 17,
  SpecMasterHealing = 1 << 18,
  SpecDecorIncrease = 1 << 19,
  SpecStoryteller = 1 << 20,
  SpecIncubator = 1 << 21,
  SpecUnknown6 = 1 << 22,
  SpecRequireZoneRight = 1 << 23,
}

const specialisationNameLookup = new Map([
  [StructureTypeFlags.SpecSampleRich, 'city_spec_sample_rich'],
  [StructureTypeFlags.SpecFarming, 'city_spec_farming'],
  [StructureTypeFlags.SpecIndustry, 'city_spec_industry'],
  [StructureTypeFlags.SpecResearch, 'city_spec_research'],
  [StructureTypeFlags.SpecCloning, 'city_spec_cloning'],
  [StructureTypeFlags.SpecMissions, 'city_spec_missions'],
  [StructureTypeFlags.SpecEntertainer, 'city_spec_entertainer'],
  [StructureTypeFlags.SpecDoctor, 'city_spec_doctor'],
  [StructureTypeFlags.SpecStronghold, 'city_spec_stronghold'],
  [StructureTypeFlags.SpecMasterManufacturing, 'city_spec_master_manufacturing'],
  [StructureTypeFlags.SpecMasterHealing, 'city_spec_master_healing'],
  [StructureTypeFlags.SpecDecorIncrease, 'city_spec_decor_increase'],
  [StructureTypeFlags.SpecStoryteller, 'city_spec_storyteller'],
  [StructureTypeFlags.SpecIncubator, 'city_spec_bm_incubator'],
  [StructureTypeFlags.SpecUnknown6, 'unknown'],
]);

@Resolver(() => City)
@Service()
export class CityResolver /* implements ResolverInterface<City> */ {
  constructor(private readonly objectService: ServerObjectService, private readonly stringService: StringFileLoader) {
    // Do nothing
  }

  @FieldResolver(() => PlayerCreatureObject, { description: 'The current leader of the city' })
  mayor(@Root() city: City) {
    return this.objectService.getOne(city.mayorId);
  }

  @FieldResolver(() => BuildingObject, { description: 'The building object for the City Hall' })
  cityHall(@Root() city: City) {
    return this.objectService.getOne(city.cityHallId);
  }

  @FieldResolver(() => BuildingObject, { nullable: true, description: 'The building object for the Cloner' })
  cloner(@Root() city: City) {
    return this.objectService.getOne(city.cloneId);
  }

  @FieldResolver(() => CellObject, { nullable: true, description: "The cell object for the Cloner's cloning cell" })
  cloningCell(@Root() city: City) {
    return this.objectService.getOne(city.cloneId);
  }

  @FieldResolver(() => Int, { description: 'Number of citzens in the city' })
  citizenCount(@Root() city: City) {
    return city.citizens.length;
  }

  @FieldResolver(() => Int, { description: 'Number of structures the city has' })
  structureCount(@Root() city: City) {
    return city.structures.length ?? 0;
  }

  @FieldResolver(() => String, { description: 'Current rank of the city' })
  async rank(@Root() city: City) {
    const cityStrings = await this.stringService.load('city/city');

    // @todo - This should be redone if/when I add support for datatables.
    const ranks = [150, 200, 300, 400, 450];
    const rank = ranks.filter(r => city.radius >= r).length;

    return cityStrings[`rank${rank}`] ?? 'UNKNOWN';
  }

  @FieldResolver(() => String, { nullable: true, description: 'Specialization of the city' })
  async specialization(@Root() city: City) {
    const cityStrings = await this.stringService.load('city/city');
    const cityHallStructure = city.structures.find(structure => structure.id === city.cityHallId);

    if (!cityHallStructure) return null;

    for (const [k, v] of specialisationNameLookup) {
      if (cityHallStructure.type & k) {
        return cityStrings[v];
      }
    }

    return null;
  }

  @FieldResolver(() => CityStructureSummary)
  structureSummary(@Root() city: City) {
    const counts = {
      decoCount: 0,
      terminalCount: 0,
      skillTrainerCount: 0,
      lowCostCount: 0,
      mediumCostCount: 0,
      highCostCount: 0,
      registerCount: 0,
    };

    city.structures.forEach(s => {
      if (s.type & StructureTypeFlags.Decoration) counts.decoCount += 1;
      if (s.type & StructureTypeFlags.MissionTerminal) counts.terminalCount += 1;
      if (s.type & StructureTypeFlags.SkillTrainer) counts.skillTrainerCount += 1;
      if (s.type & StructureTypeFlags.CostCityLow) counts.lowCostCount += 1;
      if (s.type & StructureTypeFlags.CostCityMedium) counts.mediumCostCount += 1;
      if (s.type & StructureTypeFlags.CostCityHigh) counts.highCostCount += 1;
      if (s.type & StructureTypeFlags.Register) counts.registerCount += 1;
    });

    return counts;
  }
}

@Resolver(() => Citizen)
@Service()
export class CitizenResolver /* implements ResolverInterface<Citizen> */ {
  constructor(private readonly objectService: ServerObjectService, private readonly stringService: StringFileLoader) {
    // Do nothing
  }

  @FieldResolver(() => PlayerCreatureObject, { nullable: true })
  object(@Root() member: Citizen) {
    return this.objectService.getOne(member.id);
  }

  @FieldResolver(() => String)
  async skillTemplateTitle(@Root() member: Citizen) {
    const skillTitles = await this.stringService.load('ui_roadmap');

    return (member.skillTemplate && skillTitles?.[member.skillTemplate]) ?? 'Unknown';
  }
}

@Resolver(() => CityStructure)
@Service()
export class CityStructureResolver /* implements ResolverInterface<Citizen> */ {
  constructor(private readonly objectService: ServerObjectService) {
    // Do nothing
  }

  @FieldResolver(() => BuildingObject, { description: 'Object for the structure', nullable: true })
  object(@Root() structure: CityStructure) {
    return this.objectService.getOne(structure.id);
  }

  @FieldResolver(() => [String], {
    description: 'Flag names for the type bits set on the structure',
    nullable: false,
  })
  typeBitNames(@Root() structure: CityStructure) {
    return Object.entries(StructureTypeFlags).flatMap(([key, value]) => {
      if (typeof value !== 'string' && structure.type & value) return [key];

      return [];
    });
  }
}
