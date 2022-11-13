import pLimit from 'p-limit';

import { AccountService } from '../../services/AccountService';
import { NameResolutionService } from '../../services/NameResolutionService';
import { PlayerCreatureObjectService, PlayerRecord } from '../../services/PlayerCreatureObjectService';
import { ServerObjectService } from '../../services/ServerObjectService';
import { StringFileLoader } from '../../services/StringFileLoader';
import TAGIFY from '../../utils/tagify';
import { saveDocuments } from '../utils/saveDocuments';
import { AccountDocument, ObjectDocument, SearchDocument } from '../types';
import { SEARCH_INDEXER_RECENT_LOGGED_IN_TIME } from '../../config';
import { ObjVarService } from '../../services/ObjVarService';

const objectService = new ServerObjectService();
const objvarService = new ObjVarService();
const stringFileService = new StringFileLoader();
const nameResolutionService = new NameResolutionService(stringFileService);
const playerCreatureService = new PlayerCreatureObjectService(objvarService);
const accountService = new AccountService();

export async function indexRecentLogins() {
  console.log('Finding recently logged in characters');
  console.time('Finding recently logged in characters');

  const characters = await playerCreatureService.getRecentlyLoggedInCharacters(SEARCH_INDEXER_RECENT_LOGGED_IN_TIME);

  console.timeEnd('Finding recently logged in characters');
  console.time('Producing docs');

  console.log(`Producing documents for ${characters.length} characters`);
  const limit = pLimit(10);

  const documentPromises = characters.map(character =>
    limit(async () => {
      const slug = `Processing OID ${character.CHARACTER_OBJECT}`;
      console.time(slug);
      const documentsToCommit = await produceDocumentsRelatedToPlayer(character);
      console.log(
        `Processing OID ${character.CHARACTER_OBJECT} resulted in ${documentsToCommit.length} documents being produced`
      );

      if (documentsToCommit.length > 0) {
        const documentSaves = saveDocuments(documentsToCommit);
        await Promise.all(documentSaves);
      }

      console.timeEnd(slug);
    })
  );

  await Promise.all(documentPromises);

  console.timeEnd('Producing docs');
}

async function produceDocumentsForPlayerContents(character: PlayerRecord): Promise<Promise<SearchDocument>[]> {
  // We're going to recursively get the object, and anything that loads with it.
  // This probably won't include stuff that's in demand-loaded containers, like the bank,
  // so it may be worth adding those manually at some point.
  const objects = await objectService.getMany({
    loadsWith: character.CHARACTER_OBJECT,
    excludeDeleted: true,
    limit: 10000,
  });

  if (objects.length > 0) {
    const documentPromises: Promise<ObjectDocument>[] = objects.map(async object => {
      const [objectName, basicName] = await Promise.all([
        nameResolutionService.resolveName(object),
        nameResolutionService.resolveName(object, false),
      ]);

      const document: ObjectDocument = {
        type: 'Object',
        id: object.id,
        objectName,
        basicName,
        lastSeen: new Date().toISOString(),
        ...(object.typeId === TAGIFY('CREO') ? { relevancyBump: 10 } : {}),
        ...(object.id === character.CHARACTER_OBJECT.toString() && character.STATION_ID
          ? { stationId: character.STATION_ID.toString() }
          : {}),
      };

      return document;
    });

    return documentPromises;
  }

  return [];
}

async function produceAccountDocumentForPlayer(character: PlayerRecord): Promise<SearchDocument[]> {
  if (!character || !character.STATION_ID) {
    return [];
  }

  const [accountName] = await Promise.all([accountService.getAccountNameFromStationId(character.STATION_ID)]);

  const document: AccountDocument = {
    type: 'Account',
    id: character.STATION_ID.toString(),
    stationId: character.STATION_ID.toString(),
    lastSeen: new Date().toISOString(),
    relevancyBump: 30,
    accountName: accountName ?? '',
  };

  return [document];
}

export async function produceDocumentsRelatedToPlayer(character: PlayerRecord): Promise<SearchDocument[]> {
  const fetchers = await Promise.all([
    produceDocumentsForPlayerContents(character),
    produceAccountDocumentForPlayer(character),
  ]);

  const documents = await Promise.all(fetchers.flat());

  // If the initial object was a PC creature, we're also going to find all their strucutures and add them to the processing queue.

  return documents;
}
