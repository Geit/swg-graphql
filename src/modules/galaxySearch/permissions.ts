import { PERMISSIONS as CORE_PERMISSIONS, type AuthContribution } from '@core/auth';

export const PERMISSIONS = {
  SEARCH_READ: 'search:read',
} as const;

export type GalaxySearchPermission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const galaxySearchAuth: AuthContribution = {
  permissions: Object.values(PERMISSIONS),
  roleContributions: {
    csrReadonly: [PERMISSIONS.SEARCH_READ],
    csrAnalyst: [PERMISSIONS.SEARCH_READ],
  },
  kibanaPrivileges: {
    'feature_galaxySearch.read': [PERMISSIONS.SEARCH_READ, CORE_PERMISSIONS.OBJECTS_READ],
  },
};
