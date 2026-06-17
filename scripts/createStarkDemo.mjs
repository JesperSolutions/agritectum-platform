/**
 * One-off: create a STARK demo building-owner (customer) account + all STARK buildings.
 * Uses Firebase REST APIs with a gcloud user access token (no ADC / service account).
 *
 * Env required:
 *   GCLOUD_TOKEN   - output of `gcloud auth print-access-token`
 *   FB_API_KEY     - Firebase Web API key (VITE_FIREBASE_API_KEY from .env)
 *
 * Run:
 *   GCLOUD_TOKEN=$(gcloud auth print-access-token) FB_API_KEY=... node scripts/createStarkDemo.mjs
 */
import crypto from 'node:crypto';

const PROJECT_ID = 'agritectum-platform';
const TOKEN = process.env.GCLOUD_TOKEN;
const API_KEY = process.env.FB_API_KEY;

if (!TOKEN || !API_KEY) {
  console.error('Missing GCLOUD_TOKEN or FB_API_KEY env var');
  process.exit(1);
}

const OWNER = { email: 'stark.demo@example.com', displayName: 'STARK Demo' };
const BRANCH = { name: 'STARK', email: OWNER.email, address: '', phone: '', isActive: true };

// name, address, postalCode
const BUILDINGS = [
  ['STARK Allinge', 'Pilegade 33', '3770'],
  ['STARK Assens', 'Sdr. Ringvej 25', '5610'],
  ['STARK Bogense', 'Østre Havnevej 6', '5400'],
  ['STARK Brabrand', 'Edwin Rahrs vej 60', '8220'],
  ['STARK Brande', 'Bonusvej 2', '7330'],
  ['STARK Brøndby', 'Nyager 3A', '2605'],
  ['STARK Brønderslev', 'Østergade 88', '9700'],
  ['STARK City 24-7', 'Fragtvej 9', '2450'],
  ['STARK Fredericia', 'Nordre Ringvej 7', '7000'],
  ['STARK Frederiksberg', 'C.F. Richsvej 111', '2000'],
  ['STARK Frederikssund', 'Askelundsvej 3', '3600'],
  ['STARK Frederiksværk', 'K.A. Larssensgade 7', '3300'],
  ['STARK Glostrup', 'Mosehøjvej 18', '2600'],
  ['STARK Grenå', 'Grønland 22 A', '8500'],
  ['STARK Græsted', 'Græsted Stationsvej 78', '3230'],
  ['STARK Herning', 'Rønnevej 2', '7400'],
  ['STARK Hillerød', 'Industrivænget 16', '3400'],
  ['STARK Ærø', 'Industrivej 5', '5960'],
  ['STARK Kalundborg', 'Nørre Allé 131', '4400'],
  ['STARK Nakskov', 'Rødbyvej 87', '4900'],
  ['STARK Nordhavn', 'Kattegatvej 21', '2150'],
  ['STARK København N', 'Nørrebrogade 55', '2200'],
  ['STARK Odder', '8300 Odder', '8300'],
  ['STARK Odense C', '5000 Odense C', '5000'],
  ['STARK Randers', 'Ydervangen 2', '8920'],
  ['STARK RDC Aarhus', 'Rosbjergvej 25', '8220'],
  ['STARK Ribe', 'Stampemøllevej 6', '6760'],
  ['STARK Shop Frederiksberg', 'Falkoner Alle 75', '2000'],
  ['STARK Shop København S', 'Amagerbrogade 73', '2300'],
  ['STARK Shop København Ø', 'Øster Farimagsgade 23', '2100'],
  ['STARK Hovedkontor', 'Skanderborgvej 277', '8260'],
];

const tempPassword =
  crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '') + 'A1!';

const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const nowIso = new Date().toISOString();

// --- Firestore typed-value helpers ---
const S = v => ({ stringValue: v });
const I = v => ({ integerValue: String(v) });
const B = v => ({ booleanValue: v });
const T = v => ({ timestampValue: v });

async function fsRequest(method, path, fields) {
  const res = await fetch(`${FS}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: fields ? JSON.stringify({ fields }) : undefined,
  });
  if (!res.ok) throw new Error(`Firestore ${method} ${path} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  // 1. Auth user via Identity Toolkit signUp
  const signupRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: OWNER.email,
        password: tempPassword,
        displayName: OWNER.displayName,
        returnSecureToken: false,
      }),
    }
  );
  const signup = await signupRes.json();
  if (!signupRes.ok) throw new Error(`signUp failed: ${JSON.stringify(signup)}`);
  const uid = signup.localId;
  console.log('Auth user created:', uid);

  const companyId = uid;

  // 2. Branch (auto-id)
  const branch = await fsRequest('POST', '/branches', {
    name: S(BRANCH.name),
    email: S(BRANCH.email),
    address: S(BRANCH.address),
    phone: S(BRANCH.phone),
    isActive: B(BRANCH.isActive),
    createdAt: S(nowIso),
  });
  const branchId = branch.name.split('/').pop();
  console.log('Branch created:', branchId, `(${BRANCH.name})`);

  // 3. users/{uid} - portal customer
  await fsRequest('PATCH', `/users/${uid}`, {
    uid: S(uid),
    email: S(OWNER.email),
    displayName: S(OWNER.displayName),
    role: S('customer'),
    userType: S('customer'),
    permissionLevel: I(-1),
    companyId: S(companyId),
    branchId: S(branchId),
    isActive: B(true),
    createdAt: T(nowIso),
    updatedAt: T(nowIso),
  });
  console.log('users/%s created', uid);

  // 4. customers/{uid}
  await fsRequest('PATCH', `/customers/${uid}`, {
    uid: S(uid),
    name: S(OWNER.displayName),
    displayName: S(OWNER.displayName),
    email: S(OWNER.email),
    customerType: S('company'),
    company: S(BRANCH.name),
    companyId: S(companyId),
    branchId: S(branchId),
    createdBy: S(uid),
    isActive: B(true),
    totalReports: I(0),
    totalRevenue: I(0),
    createdAt: T(nowIso),
    updatedAt: T(nowIso),
  });
  console.log('customers/%s created', uid);

  // 4b. Set custom claims on the auth token so security rules resolve
  // isCustomer()/getUserCompanyId() on list queries without the Firestore
  // fallback. Mirrors the onCustomerUserCreate cloud function.
  const claims = {
    role: 'customer',
    permissionLevel: -1,
    userType: 'customer',
    email: OWNER.email,
    companyId,
    branchId,
  };
  const claimsRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:update`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'x-goog-user-project': PROJECT_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ localId: uid, customAttributes: JSON.stringify(claims) }),
    }
  );
  if (!claimsRes.ok) throw new Error(`setClaims failed: ${await claimsRes.text()}`);
  console.log('custom claims set for', uid);

  // 5. buildings (auto-id each)
  let count = 0;
  for (const [name, street, postal] of BUILDINGS) {
    const address = `${street}, ${postal}`;
    await fsRequest('POST', '/buildings', {
      name: S(name),
      address: S(address),
      companyId: S(companyId),
      customerId: S(uid),
      branchId: S(branchId),
      buildingType: S('commercial'),
      createdBy: S(uid),
      createdAt: T(nowIso),
    });
    count++;
    console.log('  building created: %s (%s)', name, address);
  }

  console.log('\n=== DONE ===');
  console.log('Login email:    ', OWNER.email);
  console.log('Temp password:  ', tempPassword);
  console.log('UID:            ', uid);
  console.log('Branch (STARK): ', branchId);
  console.log('Buildings:      ', count);
}

main().catch(err => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
