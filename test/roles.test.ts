import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as roles from '../src/lib/roles.ts';

test('an administrator or unknown identity never acquires a student environment', () => {
  assert.deepEqual(roles.normalizeUserRoles(['admin', 'staff']), []);
  assert.deepEqual(roles.normalizeUserRoles([]), []);
  assert.deepEqual(roles.normalizeUserRoles(['unknown']), []);
  assert.equal(roles.getPrimaryEnvironment(['admin']), null);
  assert.equal(roles.getPrimaryEnvironment([]), null);
});

test('entry routes follow all backend role statuses and retain business role priority', () => {
  const destination = (role: string, status: string) => roles.getRoleDestination({
    roles: [role], role_statuses: { [role]: status },
  });
  assert.equal(destination('student', 'lead'), '/student/lead/payment');
  assert.equal(destination('student', 'enrollment'), '/student/enrollment');
  assert.equal(destination('student', 'active'), '/student/active/dashboard');
  assert.equal(destination('student', 'veteran'), '/student/veteran/dashboard');
  for (const status of ['candidate', 'training', 'active', 'suspended']) {
    assert.equal(destination('promoter', status), `/promoter/${status}`);
  }
  assert.equal(destination('hub', 'active'), '/hub/active');
  assert.equal(destination('hub', 'review'), '/hub/review');
  assert.equal(destination('admin', 'active'), 'https://admin.supletivo.net.br/');
  assert.equal(roles.getRoleDestination({ roles: ['student', 'promoter', 'hub', 'admin'],
    role_statuses: { student: 'lead', promoter: 'training', hub: 'active', admin: 'active' } }), '/hub/active');
});

test('missing or unrecognized status does not manufacture a successful state', () => {
  assert.equal(roles.getRoleDestination({ roles: ['promoter'] }), null);
  assert.equal(roles.getRoleDestination({ roles: ['student'], role_statuses: { student: 'unknown' } }), null);
  assert.equal(roles.getRoleDestination({ roles: ['hub'], role_statuses: { hub: 'active' } }, 'promoter'), null);
});
