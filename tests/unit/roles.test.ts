import { test } from "node:test";
import assert from "node:assert/strict";
import * as roles from "../../src/lib/roles.ts";

test("v2 exposes only student and admin environments; unknown/legacy roles yield empty list", () => {
  assert.deepEqual(roles.normalizeUserRoles(["promoter", "hub", "staff", "unknown"]), []);
  assert.deepEqual(roles.normalizeUserRoles([]), []);
  assert.deepEqual(roles.normalizeUserRoles(["admin"]), ["admin"]);
  assert.deepEqual(roles.normalizeUserRoles(["client"]), ["student"]);
  assert.deepEqual(roles.normalizeUserRoles(["client", "admin"]), ["student", "admin"]);
  assert.equal(roles.getPrimaryEnvironment(["admin"]), "admin");
  assert.equal(roles.getPrimaryEnvironment(["client"]), "student");
  assert.equal(roles.getPrimaryEnvironment([]), null);
});

test("entry routes cover all v2 student statuses, pre_enrolled substatuses, and admin dashboard", () => {
  const destination = (role: string, status?: string, substatus?: string) =>
    roles.getRoleDestination({
      roles: [role],
      role_statuses: status ? { [role]: status } : undefined,
      substatus,
    });

  assert.equal(destination("client", "lead"), "/student/lead/payment");
  assert.equal(destination("client", "payment_pending"), "/student/lead/payment");
  assert.equal(destination("client", "pre_enrolled", "rg_pending"), "/student/enrollment/rg");
  assert.equal(destination("client", "pre_enrolled", "address_pending"), "/student/enrollment/address");
  assert.equal(destination("client", "pre_enrolled", "needs_kinship"), "/student/enrollment/address");
  assert.equal(destination("client", "pre_enrolled", "education_pending"), "/student/enrollment/education");
  assert.equal(destination("client", "pre_enrolled", "selfie_pending"), "/student/enrollment/selfie");
  assert.equal(destination("client", "pre_enrolled", "pending_siga"), "/student/enrollment");
  assert.equal(destination("client", "enrolled"), "/student/active/dashboard");
  assert.equal(destination("client", "exam_scheduled"), "/student/active/assessments");
  assert.equal(destination("client", "awaiting_pickup"), "/student/veteran/dashboard");
  assert.equal(destination("client", "graduated"), "/student/veteran/dashboard");
  assert.equal(destination("client", "cancelled"), "/student/active/finance");
  assert.equal(destination("admin", "active"), "/admin/dashboard");
  assert.equal(
    roles.getRoleDestination({ roles: ["client", "admin"], role_statuses: { client: "lead" }, active_role: "admin" }),
    "/admin/dashboard"
  );
});

test("missing or unrecognized status does not manufacture a successful state", () => {
  assert.equal(roles.getRoleDestination({ roles: ["promoter"] }), null);
  assert.equal(roles.getRoleDestination({ roles: ["client"], role_statuses: { client: "unknown" } }), null);
  assert.equal(roles.getRoleDestination({ roles: ["admin"] }, "student"), null);
});

test("canVisitRolePath restricts /admin/* and student phases strictly", () => {
  assert.equal(roles.canVisitRolePath({ roles: ["client"], status: "lead" }, "/admin/dashboard"), false);
  assert.equal(roles.canVisitRolePath({ roles: ["admin"] }, "/admin/documentos"), true);
  assert.equal(roles.canVisitRolePath({ roles: ["client"], status: "pre_enrolled" }, "/student/enrollment/rg"), true);
  assert.equal(roles.canVisitRolePath({ roles: ["client"], status: "lead" }, "/student/enrollment/rg"), false);
  assert.equal(roles.canVisitRolePath({ roles: ["client"], status: "cancelled" }, "/student/active/finance"), true);
  assert.equal(roles.canVisitRolePath({ roles: ["client"], status: "cancelled" }, "/student/active/documents"), false);
});
