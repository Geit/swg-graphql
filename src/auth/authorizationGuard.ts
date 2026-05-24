import { AuthChecker } from 'type-graphql';

import { ContextType } from '@core/context/types';

export const customAuthChecker: AuthChecker<ContextType> = ({ context }, permissionsRequired) => {
  const held = context.permissions as ReadonlySet<string> | undefined;
  const hasPermissionsRequired = permissionsRequired.length > 0;
  const hasAllPermissions = permissionsRequired.every(perm => held?.has(perm));

  if (hasPermissionsRequired && !hasAllPermissions) {
    console.info(
      {
        hasAllPermissions,
        hasPermissionsRequired,
        permissionsRequired,
        permissions: context.permissions,
      },
      'Authorization for user rejected'
    );
    return false;
  }

  return context.isAuthenticated;
};
