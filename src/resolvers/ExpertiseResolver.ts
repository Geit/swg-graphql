import { Arg, Int, Query, Resolver } from 'type-graphql';
import { Inject, Service } from 'typedi';

import { SkillService } from '../services/SkillService';
import { ExpertiseMeta, ExpertiseTree } from '../types/Expertise';

@Service()
@Resolver()
export class ExpertiseResolver {
  @Inject()
  private readonly skillService: SkillService;

  @Query(() => ExpertiseMeta, {
    description:
      'Expertise header: professions, the cumulative points-per-level curve and the global point/tier constants. No tree node data.',
  })
  expertiseMeta(): Promise<ExpertiseMeta> {
    return this.skillService.getExpertiseMeta();
  }

  @Query(() => [ExpertiseTree], {
    description:
      'Expertise trees, optionally filtered to the given tree ids (e.g. an ExpertiseProfession.treeIds set). Omit ids to return every tree.',
  })
  expertiseTrees(@Arg('ids', () => [Int], { nullable: true }) ids?: number[]): Promise<ExpertiseTree[]> {
    return this.skillService.getExpertiseTrees(ids);
  }
}
