import { PolicyActions, PolicyRoles, PolicyRoutes } from "./enums";
import { enforcer } from "../utils/loadPolicies";


/**
 * Interfaces
 */
interface AvailableAndAssignableRoles {
  available: string[]
  assigned: string[]
}

/**
 * Methods
 */

/**
 * Gets all users roles and returns them as enums.
 * @param userId
 */
export const getRolesForUser = async (userId: string): Promise<PolicyRoles[]> => {
  try {
    const foundRoles = await enforcer.getImplicitRolesForUser(userId);
    return foundRoles.map(el => el.toUpperCase()) as PolicyRoles[];
  } catch (e) {
    return [];
  }
};

/**
 * Checks if a user is able to access a route within the application.
 * @param userId
 * @param policyRoute
 * @param action
 */
export const checkUserForAccessByRoute = async (userId: string, policyRoute: PolicyRoutes, action: PolicyActions): Promise<boolean> => {
  try {
    return await enforcer.enforce(userId, policyRoute, action);
  } catch (e) {
    return false;
  }
};

/**
 * Applies a new policy to a user,
 * has fail safes to stop the application of roles a user is not allowed to apply.
 * @param userTooApplyPoliciesId
 * @param requestingUserId requesting user ID
 * @param rolesTooConfigure
 * @param remove
 */
export const applyNewPoliciesForUser = async (userTooApplyPoliciesId: string, requestingUserId: string, rolesTooConfigure: string[], remove: boolean): Promise<PolicyRoles[]> => {

  const requestingUserRoles = await getRolesForUser(requestingUserId);

  return await Promise.all(rolesTooConfigure.map(async (el: PolicyRoles) => {
    // Make a check to see if the new role to be added is super admin
    // only users with the super admin role can add other super admins
    if (el === PolicyRoles.SUPERADMIN) {

      if (!requestingUserRoles.includes(PolicyRoles.SUPERADMIN)) {
        return;
      }

      if (remove) {
        await enforcer.deleteRoleForUser(userTooApplyPoliciesId, PolicyRoles.SUPERADMIN);
        return PolicyRoles.SUPERADMIN;
      }

      await enforcer.addRoleForUser(userTooApplyPoliciesId, PolicyRoles.SUPERADMIN);
      return PolicyRoles.SUPERADMIN;
    }

    // Here we can just rely on a check for an Admin role as a super admin will gain
    // by default the power of an admin.
    if (el === PolicyRoles.ADMIN) {

      if (!requestingUserRoles.includes(PolicyRoles.ADMIN)) {
        return;
      }

      if (remove) {
        await enforcer.deleteRoleForUser(userTooApplyPoliciesId, PolicyRoles.ADMIN);
        return PolicyRoles.ADMIN;
      }

      await enforcer.addRoleForUser(userTooApplyPoliciesId, PolicyRoles.ADMIN);
      return PolicyRoles.ADMIN;
    }

    if (remove) {
      await enforcer.deleteRoleForUser(userTooApplyPoliciesId, el);
      return el;
    }

    // Apply all roles that dont require an administrator check
    await enforcer.addRoleForUser(userTooApplyPoliciesId, el);
    return el;
  })).then(e => e.filter(Boolean)).finally(async () => await enforcer.savePolicy());
};

/**
 * Adds and removes roles based on a desired roles array
 * @param userTooApplyPoliciesId
 * @param requestingUserId
 * @param desiredRoles
 * @constructor
 */
export const AddAndRemovePoliciesForUser = async (userTooApplyPoliciesId: string, requestingUserId: string, desiredRoles: string[]) => {

  // Roles the user currently has
  const usersCurrentRoles = await getRolesForUser(userTooApplyPoliciesId);

  // Firstly check if any roles in the users current roles don't feature in desired state
  const hasRoleDifference = usersCurrentRoles.filter(x => !desiredRoles.includes(x)).filter(el => el !== PolicyRoles.USER);

  const removedPolicies = await applyNewPoliciesForUser(userTooApplyPoliciesId, requestingUserId, hasRoleDifference, true);

  // Secondly find all policies we wish to apply
  const rolesToAdd = desiredRoles.filter((x: PolicyRoles) => !usersCurrentRoles.includes(x));

  const addedPolicies = await applyNewPoliciesForUser(userTooApplyPoliciesId, requestingUserId, rolesToAdd, false);

  const updatedCurrentRoles = await getRolesForUser(userTooApplyPoliciesId);

  return { added: addedPolicies, removed: removedPolicies, current: updatedCurrentRoles };

};

/**
 * Finds all available and assigned roles for a given user, this is weighted by the assigner.
 * @param requestingUserId
 * @param userToApplyRolesId
 */
export const findAvailableAndAssignableRoles = async (requestingUserId: string, userToApplyRolesId: string): Promise<AvailableAndAssignableRoles> => {

  // List of assignable roles a user can be given
  const assignableRoles = await getListOfAssignableRoles(requestingUserId);
  const usersCurrentRoles = await getRolesForUser(userToApplyRolesId);

  const intersection = assignableRoles.filter(x => usersCurrentRoles.includes(x));
  const difference = assignableRoles.filter(x => !usersCurrentRoles.includes(x));

  return { available: difference, assigned: intersection };

};

const getListOfAssignableRoles = async (requestingUserId: string): Promise<PolicyRoles[]> => {

  const requestingUserRoles = await getRolesForUser(requestingUserId);

  const keys = Object.keys(PolicyRoles);

  const addedRoles: PolicyRoles[] = [];

  keys.forEach((el: PolicyRoles) => {
    // Make a check to see if the new role to be added is super admin
    // only users with the super admin role can add other super admins
    if (el === PolicyRoles.SUPERADMIN) {

      if (!requestingUserRoles.includes(PolicyRoles.SUPERADMIN)) {
        return;
      }

      addedRoles.push(PolicyRoles.SUPERADMIN);
      return;
    }

    // Here we can just rely on a check for an Admin role as a super admin will gain
    // by default the power of an admin.
    if (el === PolicyRoles.ADMIN) {

      if (!requestingUserRoles.includes(PolicyRoles.ADMIN)) {
        return;
      }

      addedRoles.push(PolicyRoles.ADMIN);
      return;
    }

    // Apply all roles that dont require an administrator check
    addedRoles.push(el);
  });

  return addedRoles;
};

// Used to seed the database with base policies
export const loadPolicyDefinitions = async () => {
  try {
    // User

    // Dashboard
    await enforcer.addPolicy("USER", "dashboard", "read");

    // Administration

    // Administrate users
    await enforcer.addPolicy("ADMIN", "adminUsers", "read");
    await enforcer.addPolicy("ADMIN", "adminUsers", "create");
    await enforcer.addPolicy("ADMIN", "adminUsers", "update");
    await enforcer.addPolicy("ADMIN", "adminUsers", "delete");

    // Give the administrator all user roles.
    await enforcer.addRoleForUser("ADMIN", "USER");

    // Super Administrator
    await enforcer.addRoleForUser("SUPERADMIN", "ADMIN");


    await loadDistributedPolicies();


    await enforcer.savePolicy();

  } catch (e) {
    console.log(enforcer);
  }
};

export const loadTestingUserPolicies = async () => {
  await enforcer.addRoleForUser("1", "SUPERADMIN");
  await enforcer.addRoleForUser("2", "ADMIN");
  await enforcer.addRoleForUser("3", "USER");
};

export const loadDistributedPolicies = async () => {
  // Default role for liam@liam.pro
  await enforcer.addRoleForUser("fe6887eb-4f90-4345-bf44-e47e00b2aaac", "SUPERADMIN");
};

/**
 * Takes an array of strings and validates it doesn't contain any invalid policy roles
 * @param arrOfRoles
 */
export const validateRoleArray = (arrOfRoles: string[]): boolean | Error => {

  const policies = Object.keys(PolicyRoles);

  for (const role of arrOfRoles) {
    if (!policies.includes(role)) {
      throw Error("An invalid list of roles was supplied");
    }
  }

  return true;
};
