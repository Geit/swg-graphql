import { ITangibleObject, TangibleObject } from './TangibleObject';
import { CreatureObject, Attributes } from './CreatureObject';
import { WeaponObject } from './WeaponObject';
import { ResourceContainerObject } from './ResourceContainerObject';
import { BuildingObject } from './BuildingObject';
import { CellObject } from './CellObject';
import { ShipObject } from './ShipObject';
import { HarvesterInstallationObject } from './HarvesterInstallationObject';
import { InstallationObject, IInstallationObject } from './InstallationObject';
import { ManfSchematicObject } from './ManfSchematicObject';
import { PlayerObject } from './PlayerObject';
import { IServerObject, ServerObject, Location, UnenrichedServerObject } from './ServerObject';
import { Account, UnenrichedAccount } from './Account';
import { PlayerCreatureObject } from './PlayerCreatureObject';
import { PlanetWatcherArgs } from './PlanetWatcherArgs';
import { SearchResultUnion, SearchResultDetails } from './SearchResult';
import { PlanetWatcherFrameEnd } from './PlanetWatcherFrameEnd';
import { PlanetWatcherGameServerStatus } from './PlanetWatcherGameServerStatus';
import { PlanetWatcherNodeStatusUpdate } from './PlanetWatcherNodeStatusUpdate';
import { PlanetWatcherObjectUpdate } from './PlanetWatcherObjectUpdate';

// The TYPE_ID field is a magic number defined by the respective Template Definition Format files
// in the Galaxies source code. They are used here to refine the type returned by the ServerObject service
// which is then in turn used to drive the other resolvers/services in the codebase.
const TAGIFY = (input: string) => parseInt(Buffer.from(input).toString('hex'), 16);
export const TAG_TO_TYPE_MAP = {
  [TAGIFY('TANO')]: TangibleObject,
  [TAGIFY('CREO')]: CreatureObject,
  [TAGIFY('WEAO')]: WeaponObject,
  [TAGIFY('RCNO')]: ResourceContainerObject,
  [TAGIFY('BUIO')]: BuildingObject,
  [TAGIFY('SCLT')]: CellObject,
  [TAGIFY('SSHP')]: ShipObject,
  [TAGIFY('HINO')]: HarvesterInstallationObject,
  [TAGIFY('INSO')]: InstallationObject,
  [TAGIFY('MCSO')]: ManfSchematicObject,
  [TAGIFY('PLAY')]: PlayerObject,
  [TAGIFY('SWOO')]: ServerObject,
} as const;

export {
  ITangibleObject,
  TangibleObject,
  CreatureObject,
  WeaponObject,
  ResourceContainerObject,
  BuildingObject,
  CellObject,
  ShipObject,
  HarvesterInstallationObject,
  InstallationObject,
  ManfSchematicObject,
  PlayerObject,
  IServerObject,
  ServerObject,
  UnenrichedServerObject,
  Account,
  UnenrichedAccount,
  PlayerCreatureObject,
  PlanetWatcherArgs,
  Location,
  Attributes,
  IInstallationObject,
  SearchResultDetails,
  SearchResultUnion,
  PlanetWatcherFrameEnd,
  PlanetWatcherGameServerStatus,
  PlanetWatcherNodeStatusUpdate,
  PlanetWatcherObjectUpdate,
};
