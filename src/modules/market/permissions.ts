import { PERMISSIONS as CORE_PERMISSIONS, type AuthContribution } from '@core/auth';

export const PERMISSIONS = {
  MARKET_READ: 'market:read',
} as const;

export type MarketPermission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const marketAuth: AuthContribution = {
  permissions: Object.values(PERMISSIONS),
  roleContributions: {
    csrReadonly: [PERMISSIONS.MARKET_READ],
    csrAnalyst: [PERMISSIONS.MARKET_READ],
  },
  kibanaPrivileges: {
    'feature_marketListings.read': [PERMISSIONS.MARKET_READ, CORE_PERMISSIONS.OBJECTS_READ],
  },
};
