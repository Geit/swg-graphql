import { Arg, FieldResolver, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Service } from 'typedi';

import { AccountService } from '../services/AccountService';
import { ServerObjectService } from '../services/ServerObjectService';
import { Account, UnenrichedAccount } from '../types/Account';

@Resolver(() => Account)
@Service()
export class AccountResolver implements ResolverInterface<Account> {
  constructor(private readonly accountService: AccountService, private readonly objectService: ServerObjectService) {
    // Do nothing
  }

  @FieldResolver()
  async characters(
    @Root() account: UnenrichedAccount,
    @Arg('excludeDeleted', { defaultValue: false }) excludeDeleted: boolean
  ) {
    const characters = await this.accountService.getAllCharactersForAccount(account.stationId);

    const characterIds = characters.map(char => char.CHARACTER_OBJECT);

    return this.objectService.getMany({ excludeDeleted, objectIds: characterIds });
  }
}
