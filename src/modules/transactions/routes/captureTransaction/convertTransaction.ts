import { randomUUID } from 'crypto';

import { uniqBy } from 'lodash';

import gqlSdk from '../../gqlSdk';
import { GetObjectsWithContentsQuery, TransactionType } from '../../gqlSdk/graphql.generated';

import { TransactionLog } from './captureTransaction';

interface Transaction {
  '@timestamp': string;
  id: string;
  type: `${TransactionType}`;
  transactionValue: number;
  itemCount: number;
  arePartiesSameAccount: boolean;
  parties: TransactionParty[];
}

interface TransactionItem {
  oid: string;
  name: string;
  basicName: string;
  template: string;
  staticName?: string;
  count: number;
}

interface TransactionParty {
  stationId: string;
  oid: string;
  name: string;
  itemsReceived: TransactionItem[];
  creditsReceived: number;
  wasOnline: boolean;
  containedById?: string;
  worldspaceLocation?: number[];
  scene?: string;
}

const convertQueryItemToTransactionItem = (
  item: NonNullable<GetObjectsWithContentsQuery['objects']>[number]
): TransactionItem => {
  return {
    oid: item.id,
    name: item.resolvedName,
    basicName: item.basicName,
    template: `${item.template || item.templateId}`,
    staticName: item.staticItemName ?? undefined,
    count: Math.max('count' in item ? item.count ?? 1 : 1, 1),
  };
};

const extractItemsReceived = (itemIds: string[], itemDetails: GetObjectsWithContentsQuery): TransactionItem[] => {
  return itemIds.flatMap(oid => {
    const item = itemDetails.objects?.find(detail => detail.id === oid);

    if (!item) return [];

    const convertedItem = convertQueryItemToTransactionItem(item);
    const convertedContents = item.contents?.map(convertQueryItemToTransactionItem);

    return uniqBy([convertedItem, ...(convertedContents ?? [])], i => i.oid);
  });
};

export const convertTransactionLogToTransaction = async (tlog: TransactionLog): Promise<Transaction> => {
  const itemOidsToLookup = new Set([...tlog.transaction_party_a_items, ...tlog.transaction_party_b_items]);
  const [involvedCharacters, enrichedItemDetails] = await Promise.all([
    gqlSdk.getCharacters({
      objectIds: [tlog.transaction_party_a_oid, tlog.transaction_party_b_oid],
      limit: 2,
    }),
    gqlSdk.getObjectsWithContents({
      objectIds: [...itemOidsToLookup],
      limit: itemOidsToLookup.size,
    }),
  ]);

  const PartyADetails = involvedCharacters.objects?.find(o => o.id === tlog.transaction_party_a_oid);
  const PartyBDetails = involvedCharacters.objects?.find(o => o.id === tlog.transaction_party_b_oid);

  if (!PartyADetails || PartyADetails?.__typename !== 'PlayerCreatureObject' || !PartyADetails.account)
    throw new Error('Party A is not a player character!');

  if (!PartyBDetails || PartyBDetails?.__typename !== 'PlayerCreatureObject' || !PartyBDetails.account)
    throw new Error('Party B is not a player character!');

  const PartyA: TransactionParty = {
    stationId: PartyADetails.account.id,
    oid: PartyADetails.id,
    name: PartyADetails.resolvedName,
    creditsReceived: parseInt(tlog.transaction_party_a_credits),
    itemsReceived: extractItemsReceived(tlog.transaction_party_a_items, enrichedItemDetails),
    wasOnline: PartyADetails.session?.currentState === 'Playing' ?? false,
    worldspaceLocation: PartyADetails.worldspaceLocation ?? undefined,
    scene: PartyADetails.scene,
    containedById: PartyADetails.containedById ?? undefined,
  };

  const PartyB: TransactionParty = {
    stationId: PartyBDetails.account.id,
    oid: PartyBDetails.id,
    name: PartyBDetails.resolvedName,
    creditsReceived: parseInt(tlog.transaction_party_b_credits),
    itemsReceived: extractItemsReceived(tlog.transaction_party_b_items, enrichedItemDetails),
    wasOnline: PartyBDetails.session?.currentState === 'Playing' ?? false,
    worldspaceLocation: PartyBDetails.worldspaceLocation ?? undefined,
    scene: PartyBDetails.scene,
    containedById: PartyBDetails.containedById ?? undefined,
  };

  return {
    '@timestamp': tlog['@timestamp'],
    id: randomUUID(),
    type: tlog.transaction_type,
    transactionValue: Math.abs(PartyA.creditsReceived - PartyB.creditsReceived),
    itemCount: PartyA.itemsReceived.length + PartyB.itemsReceived.length,
    arePartiesSameAccount: PartyA.stationId === PartyB.stationId,
    parties: [PartyA, PartyB],
  };
};
