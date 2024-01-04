import { Arg, FieldResolver, Int, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Service } from 'typedi';

import { ENABLE_STRUCTURE_SHORTCUT } from '../config';
import { AccountService } from '../services/AccountService';
import { DataTableService } from '../services/DataTableService';
import { PlayerCreatureObjectService } from '../services/PlayerCreatureObjectService';
import { ServerObjectService } from '../services/ServerObjectService';
import { StringFileLoader } from '../services/StringFileLoader';
import { Account, UnenrichedAccount } from '../types';
import { AccountVeteranRewardEntry } from '../types/Account';
import { STRUCTURE_TYPE_IDS } from '../utils/tagify';
import { isPresent, subsetOf } from '../utils/utility-types';

interface EventDataTableRow {
  id: string;
  Items: string;
  'Include Items From': string;
  Category: number;
  'Feature Bit Reward Exclusion Mask': number;
  'Account Flags': number;
  'Account Feature Id': number;
  'Feature Id Blocked by Subscription Bit': number;
  'Consume Account Feature Id': number;
  'Account Age Days': number;
  'Character Age Days': number;
  'Character Objvar': string;
  'Once Per Account': number;
  'Announcement Message': string;
  Description: string;
  URL: string;
  'Start Date yyyy': number;
  'Start Date mm': number;
  'Start Date dd': number;
  'End Date yyyy': number;
  'End Date mm': number;
  'End Date dd': number;
  'Buddy Points': number;
}

interface VetRewardItemDataTableRow {
  id: string;
  Description: string;
  'Object Template': string;
  Money: number;
  'Once Per Account': number;
  'Once Per Account Feature Id': number;
  'Once Per Character': number;
  'Can Trade In': number;
}

@Resolver(() => Account)
@Service()
export class AccountResolver implements ResolverInterface<Account> {
  constructor(
    private readonly accountService: AccountService,
    private readonly objectService: ServerObjectService,
    private readonly dataTable: DataTableService,
    private readonly stringService: StringFileLoader,
    private readonly playerCreatureObjectService: PlayerCreatureObjectService
  ) {
    // Do nothing
  }

  @FieldResolver()
  async characters(
    @Root() account: UnenrichedAccount,
    @Arg('excludeDeleted', { defaultValue: false }) excludeDeleted: boolean
  ) {
    const characters = await this.accountService.getAllCharactersForAccount(account.id);

    const characterIds = characters.filter(isPresent).map(char => String(char.OBJECT_ID));

    return this.objectService.getMany({ excludeDeleted, objectIds: characterIds });
  }

  @FieldResolver()
  accountName(@Root() account: UnenrichedAccount) {
    return this.accountService.getAccountNameFromStationId(account.id);
  }

  @FieldResolver()
  async ownedObjects(
    @Root() account: UnenrichedAccount,
    @Arg('objectTypes', () => [Int], { nullable: true }) objectTypes: number[] | null,
    @Arg('excludeDeleted', { defaultValue: true }) excludeDeleted: boolean,
    @Arg('structuresOnly', { defaultValue: false }) structuresOnly: boolean
  ) {
    // eslint-disable-next-line no-param-reassign
    if (structuresOnly) objectTypes = STRUCTURE_TYPE_IDS;

    const characters = await this.accountService.getAllCharactersForAccount(account.id);

    const characterIds = characters.filter(isPresent).map(char => String(char.OBJECT_ID));

    if (ENABLE_STRUCTURE_SHORTCUT && objectTypes && subsetOf(objectTypes, STRUCTURE_TYPE_IDS)) {
      const structureOids = (
        await Promise.all(characterIds.map(cid => this.playerCreatureObjectService.getCheapStructuresForCharacter(cid)))
      ).flat();

      return this.objectService.getMany({
        objectTypes,
        excludeDeleted,
        objectIds: structureOids,
      });
    }

    const ownedObjects = await this.objectService.getMany({
      ownedBy: characterIds,
      objectTypes,
      excludeDeleted,
    });

    return ownedObjects;
  }

  private async getVetRewardName(record: { type: 'item'; itemId: string } | { type: 'event'; eventId: string }) {
    if (record.type === 'event') {
      const events = (await this.dataTable.load({ fileName: 'veteran_rewards/events.iff' })) as EventDataTableRow[];

      const eventDefinition = events.find(e => e.id === record.eventId);

      const [stringFile, stringId] = eventDefinition?.['Announcement Message'].split(':') ?? [];

      if (!stringFile || !stringId) return null;

      return (await this.stringService.load(stringFile))?.[stringId] ?? null;
    }

    const items = (await this.dataTable.load({ fileName: 'veteran_rewards/items.iff' })) as VetRewardItemDataTableRow[];

    const itemDefinition = items.find(e => e.id === record.itemId);

    const [stringFile, stringId] = itemDefinition?.Description.split(':') ?? [];

    if (!stringFile || !stringId) return null;

    return (await this.stringService.load(stringFile))?.[stringId] ?? null;
  }

  @FieldResolver()
  async veteranRewards(@Root() account: UnenrichedAccount): Promise<AccountVeteranRewardEntry[]> {
    const [claimedEvents, claimedItems] = await Promise.all([
      this.accountService.getAllOneTimeEvents(account.id),
      this.accountService.getAllOneTimeItems(account.id),
    ]);

    const enrichedEvents = await Promise.all(
      [...claimedEvents, ...claimedItems]
        .sort((a, b) => b.dateConsumed.getTime() - a.dateConsumed.getTime())
        .flatMap(async (evt): Promise<AccountVeteranRewardEntry | null> => {
          const id = evt.type === 'event' ? evt.eventId : evt.itemId;

          const characterId = String(evt.characterId);

          return {
            type: evt.type,
            id,
            claimDate: evt.dateConsumed.toISOString(),
            name: await this.getVetRewardName(evt),
            characterId,
            character: await this.objectService.getOne(characterId),
          };
        })
    );

    return enrichedEvents.filter(isPresent);
  }
}
