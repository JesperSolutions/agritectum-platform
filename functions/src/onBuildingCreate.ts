import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

/**
 * Cloud Function triggered when a building document is created
 * Geocodes the address if coordinates are not already set
 */
export const onBuildingCreate = onDocumentCreated('buildings/{buildingId}', async event => {
  const buildingData = event.data?.data();
  const buildingId = event.params.buildingId;

  if (!buildingData) {
    console.error('No building data found for buildingId:', buildingId);
    return;
  }

  // Skip if coordinates already exist
  if (buildingData.latitude && buildingData.longitude) {
    console.log('Building already has coordinates, skipping geocoding:', buildingId);
    return;
  }

  // Skip if no address
  if (!buildingData.address) {
    console.log('Building has no address, skipping geocoding:', buildingId);
    return;
  }

  try {
    console.log('Geocoding address for building:', buildingId, buildingData.address);

    // Geocode using Nominatim API
    const encodedAddress = encodeURIComponent(buildingData.address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'Agritectum Platform Cloud Function',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const latitude = parseFloat(data[0].lat);
      const longitude = parseFloat(data[0].lon);

      // Update building document with coordinates
      const buildingRef = admin.firestore().doc(`buildings/${buildingId}`);
      await buildingRef.update({
        latitude,
        longitude,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log('✅ Building geocoded successfully:', buildingId, { latitude, longitude });
    } else {
      console.warn('⚠️ No geocoding results found for building:', buildingId);
    }
  } catch (error) {
    console.error('❌ Error geocoding building:', buildingId, error);
    // Don't throw - geocoding failure shouldn't break building creation
  }
});
