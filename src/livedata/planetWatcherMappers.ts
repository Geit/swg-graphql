import type { PlanetWatcherObjectUpdate } from '../types/PlanetWatcherObjectUpdate';

import type { PlanetObjectStatus } from './messages/PlanetObjectStatusMessage';

export const mapObjectStatus = (obj: PlanetObjectStatus): PlanetWatcherObjectUpdate => ({
  networkId: obj.networkId.toString(),
  location: [obj.locationX, 0, obj.locationZ],
  authoritativeServer: obj.authoritativeServer,
  interestRadius: obj.interestRadius,
  deleteObject: obj.deleteObject,
  objectTypeTag: obj.objectTypeTag,
  level: obj.level,
  hibernating: obj.hibernating,
  templateCrc: obj.templateCrc,
  aiActivity: obj.aiActivity,
  creationType: obj.creationType,
});

// Logging only
export const objectUpdateByteSize = (data: PlanetObjectStatus[]) =>
  Buffer.byteLength(JSON.stringify(data.map(mapObjectStatus)));
