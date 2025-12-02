#!/usr/bin/env node
// Query reports from Firestore (Emulator or Production)
// Usage (Emulator):
//   node scripts/check-reports.cjs --email="linus.hollberg@taklagetentreprenad.se" --emulator
// Usage (Production):
//   node scripts/check-reports.cjs --email="linus..." --serviceAccount=./path/to/service-account.json

/* eslint-disable no-console */
const admin = require('firebase-admin');

function parseArgs(argv) {
	const args = {};
	for (const arg of argv.slice(2)) {
		const m = arg.match(/^--([^=]+)=(.*)$/);
		if (m) {
			args[m[1]] = m[2];
		} else if (arg === '--emulator') {
			args.emulator = true;
		}
	}
	return args;
}

async function initAdmin({ emulator, serviceAccount }) {
	if (emulator) {
		process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
		process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
		// Emulator does not require credentials
		admin.initializeApp({ projectId: 'agritectum-platform' });
		console.log('🔥 Using Firestore Emulator at', process.env.FIRESTORE_EMULATOR_HOST);
		return;
	}

	if (!serviceAccount) {
		throw new Error('Missing --serviceAccount=./path/to/key.json for production use');
	}
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sa = require(require('path').resolve(process.cwd(), serviceAccount));
	admin.initializeApp({
		credential: admin.credential.cert(sa),
		projectId: sa.project_id || 'agritectum-platform',
	});
	console.log('🔐 Using Production with service account for project:', sa.project_id || 'agritectum-platform');
}

async function main() {
	const args = parseArgs(process.argv);
	const email = args.email || 'linus.hollberg@taklagetentreprenad.se';
	await initAdmin({ emulator: !!args.emulator, serviceAccount: args.serviceAccount });

	const db = admin.firestore();
	console.log(`\n🔎 Looking up user by email: ${email}`);

	// 1) Find user in users collection
	const usersSnap = await db.collection('users').where('email', '==', email).get();
	if (usersSnap.empty) {
		console.log('❌ No user found in users collection with that email');
		return;
	}

	const userDoc = usersSnap.docs[0];
	const userData = userDoc.data();
	const uid = userDoc.id;
	console.log('✅ Found user:', {
		id: uid,
		displayName: userData.displayName,
		role: userData.role,
		permissionLevel: userData.permissionLevel,
		branchId: userData.branchId,
	});

	// 2) Reports created by user
	console.log('\n📄 Querying reports created by user...');
	const createdSnap = await db.collection('reports').where('createdBy', '==', uid).get();
	console.log(`   Found ${createdSnap.size} reports created by ${userData.displayName || email}`);
	createdSnap.forEach(d => {
		const r = d.data();
		console.log(`   - ${d.id}: ${r.title || 'No title'} (${r.status || 'No status'}) | customer: ${r.customerName || 'N/A'}`);
	});

	// 3) Reports in user's branch
	if (userData.branchId) {
		console.log(`\n🏢 Querying reports in branch: ${userData.branchId}`);
		const branchSnap = await db.collection('reports').where('branchId', '==', userData.branchId).get();
		console.log(`   Found ${branchSnap.size} reports in branch ${userData.branchId}`);
	}

	// 4) Aggregate counts by status (sample KPI)
	console.log('\n📊 Aggregating status counts for created reports...');
	const statusCounts = {};
	createdSnap.forEach(d => {
		const s = (d.get('status') || 'unknown');
		statusCounts[s] = (statusCounts[s] || 0) + 1;
	});
	console.log('   Status breakdown:', statusCounts);

	console.log('\n✅ Done');
}

main().catch(err => {
	console.error('❌ Error:', err?.message || err);
	process.exit(1);
});


