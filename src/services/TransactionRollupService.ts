import { Service } from 'typedi';

import { TransactionParty } from '../types/Transaction';
import { TransactionRollup, TransactionRollupParty, TransactionRollupItem } from '../types/TransactionRollup';

import { TransactionService } from './TransactionService';

const doesPartyMatchId = (party: TransactionParty, id: string): boolean => {
  return party.stationId === id || party.oid === id || party.name === id;
};

@Service()
export class TransactionRollupService {
  constructor(
    // constructor injection of a service
    private readonly transactionService: TransactionService
  ) {
    // Do nothing
  }

  async getRollupBetweenParties(
    partyAId: string,
    partyBId: string,
    fromDate: string,
    untilDate: string
  ): Promise<TransactionRollup | null> {
    const transactions = await this.transactionService.getMany({
      parties: [partyAId, partyBId],
      untilDate,
      fromDate,
      size: 10000,
      arePartiesSameAccount: null,
      from: 0,
    });

    const orderedTransactions = transactions.results.reverse();

    const originalOwnershipMap = new Map<string, string>();

    const partyA = {
      identifier: partyAId,
      itemsReceived: new Map<string, TransactionRollupItem>(),
      creditsReceived: 0,
    };

    const partyB = {
      identifier: partyBId,
      itemsReceived: new Map<string, TransactionRollupItem>(),
      creditsReceived: 0,
    };

    orderedTransactions.forEach(transaction => {
      const hasPartyA = transaction.parties.some(party => doesPartyMatchId(party, partyAId));
      const hasPartyB = transaction.parties.some(party => doesPartyMatchId(party, partyBId));

      if (!hasPartyA) {
        throw new Error(`Transaction ${transaction.id} was missing Party A and it is required.`);
      }

      if (!hasPartyB) {
        throw new Error(`Transaction ${transaction.id} was missing Party B and it is required.`);
      }

      transaction.parties.forEach(party => {
        const isPartyA = doesPartyMatchId(party, partyAId);

        const partyToRemoveFrom = isPartyA ? partyB : partyA;
        const partyToAddTo = isPartyA ? partyA : partyB;

        partyToRemoveFrom.creditsReceived -= party.creditsReceived;
        partyToAddTo.creditsReceived += party.creditsReceived;

        party.itemsReceived.forEach(item => {
          if (!originalOwnershipMap.has(item.oid)) {
            originalOwnershipMap.set(item.oid, partyToRemoveFrom.identifier);
          }

          partyToRemoveFrom.itemsReceived.delete(item.oid);

          if (originalOwnershipMap.get(item.oid) !== partyToAddTo.identifier) {
            partyToAddTo.itemsReceived.set(item.oid, {
              ...item,
              wasOriginalOwner: originalOwnershipMap.get(item.oid) === partyToAddTo.identifier,
            });
          }
        });
      });
    });

    const finalPartyA: TransactionRollupParty = {
      ...partyA,
      creditsReceived: Math.max(partyA.creditsReceived, 0),
      itemsReceived: Array.from(partyA.itemsReceived.values()),
    };

    const finalPartyB: TransactionRollupParty = {
      ...partyB,
      creditsReceived: Math.max(partyB.creditsReceived, 0),
      itemsReceived: Array.from(partyB.itemsReceived.values()),
    };

    return {
      fromDate,
      untilDate,
      parties: [finalPartyA, finalPartyB],
      totalTrades: orderedTransactions.length,
      totalItems: finalPartyA.itemsReceived.length + finalPartyB.itemsReceived.length,
      totalValue: Math.abs(finalPartyA.creditsReceived - finalPartyB.creditsReceived),
    };
  }
}
