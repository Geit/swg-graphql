import { AuthChecker } from 'type-graphql';

import { ContextType } from '@core/context/types';

export const customAuthChecker: AuthChecker<ContextType> = ({ context }, rolesRequired) => {
  const hasRolesRequired = rolesRequired.length > 0;
  const hasAllRoles = rolesRequired.every(roleRequired => context.roles?.has(roleRequired));

  if (hasRolesRequired && !hasAllRoles) {
    console.info(
      {
        hasAllRoles,
        hasRolesRequired,
        rolesRequired,
        roles: context.roles,
      },
      'Authorization for user rejected'
    );
    return false;
  }

  return context.isAuthenticated;
};
