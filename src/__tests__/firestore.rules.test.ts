/* eslint-env jest */
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;
beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'test-taklaget',
    firestore: { rules: '../firestore.rules' }
  });
});
afterAll(async () => {
  await testEnv.cleanup();
});

test('superadmin can read any user', async () => {
  const ctx = testEnv.authenticatedContext('u1', { permissionLevel: 2, branchId: 'main', role: 'superadmin' });
  await setDoc(doc(ctx.firestore(), 'users/u2'), { branchId: 'branchX' });
  await expect(getDoc(doc(ctx.firestore(), 'users/u2'))).resolves.toHaveProperty('exists', true);
});

test('branch admin can read only their branch user', async () => {
  const branchAdmin = testEnv.authenticatedContext('ba1', { permissionLevel: 1, branchId: 'branch42', role: 'branchAdmin' });
  await setDoc(doc(branchAdmin.firestore(), 'users/u5'), { branchId: 'branch42' });
  await expect(getDoc(doc(branchAdmin.firestore(), 'users/u5'))).resolves.toHaveProperty('exists', true);
  // Other branch should fail
  await setDoc(doc(branchAdmin.firestore(), 'users/u6'), { branchId: 'otherBranch' });
  await expect(getDoc(doc(branchAdmin.firestore(), 'users/u6'))).rejects.toThrow();
});

test('inspector can only read own branch reports', async () => {
  const insp = testEnv.authenticatedContext('ins1', { permissionLevel: 0, branchId: 'zzz', role: 'inspector' });
  await setDoc(doc(insp.firestore(), 'reports/r1'), { branchId: 'zzz', isPublic: false });
  await expect(getDoc(doc(insp.firestore(), 'reports/r1'))).resolves.toHaveProperty('exists', true);
  await setDoc(doc(insp.firestore(), 'reports/r2'), { branchId: 'xx', isPublic: false });
  await expect(getDoc(doc(insp.firestore(), 'reports/r2'))).rejects.toThrow();
});

test('public offer read allowed for pending/publicLink', async () => {
  const anon = testEnv.unauthenticatedContext();
  await setDoc(doc(anon.firestore(), 'offers/o1'), { status: 'pending', publicLink: 'abc' });
  await expect(getDoc(doc(anon.firestore(), 'offers/o1'))).resolves.toHaveProperty('exists', true);
});

test('public general user/customer read fails', async () => {
  const anon = testEnv.unauthenticatedContext();
  await setDoc(doc(anon.firestore(), 'customers/c1'), { branchId: 'no', name: 'Fake' });
  await expect(getDoc(doc(anon.firestore(), 'customers/c1'))).rejects.toThrow();
});
