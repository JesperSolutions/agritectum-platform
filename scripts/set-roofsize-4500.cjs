const admin = require('firebase-admin');
const serviceAccount = require('./agritectum-platform-firebase-adminsdk-fbsvc-b70ab61919.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function setRoofSize() {
  const buildingId = 'boxcGweJAnWpW3YTO5AS';
  const roofSize = 4500;

  try {
    const buildingRef = db.collection('buildings').doc(buildingId);
    const snap = await buildingRef.get();

    if (!snap.exists) {
      console.error('Building not found:', buildingId);
      return;
    }

    const data = snap.data();
    const solarCapacity = data?.esgMetrics?.features?.solarPanels?.capacity || 0;
    const annualCO2Offset = Math.round(solarCapacity * 1200);
    const carbonFootprint = Math.round(roofSize * 0.5);
    const sustainabilityScore = annualCO2Offset > 0
      ? Math.min(100, Math.round((annualCO2Offset / carbonFootprint) * 100))
      : 0;

    await buildingRef.update({
      roofSize,
      lastVerified: new Date().toISOString(),
      esgMetrics: {
        ...(data.esgMetrics || {}),
        carbonFootprint,
        annualCO2Offset,
        sustainabilityScore,
      },
    });

    console.log('✓ Roof size set to 4500 m² and ESG metrics updated.');
  } catch (error) {
    console.error('Error updating building:', error.message);
  } finally {
    admin.app().delete();
  }
}

setRoofSize();
