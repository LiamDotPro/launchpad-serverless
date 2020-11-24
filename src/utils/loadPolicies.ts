import TypeORMAdapter from "typeorm-adapter";
import { Enforcer, newEnforcer } from "casbin";
import { loadPolicyDefinitions } from "../shared/policies";

import path from "path";

export let enforcer: Enforcer;

export async function loadPolices() {

  const adapater = await TypeORMAdapter.newAdapter({
    type: "postgres",
    host: "db",
    port: 5432,
    username: "admin",
    password: "test1234",
    database: "launchpad"
  });

  enforcer = await newEnforcer("./src/rbac_model.conf", adapater);

  // Load the policy from configuration  file
  await enforcer.loadPolicy();

  // Load the default existing policy schema..
  await loadPolicyDefinitions();
}
