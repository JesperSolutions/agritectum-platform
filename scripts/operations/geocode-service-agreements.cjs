#!/usr/bin/env node

/**
 * Script to geocode all service agreements that don't have latitude/longitude coordinates
 * Usage: node scripts/operations/geocode-service-agreements.cjs --project <project-id>
 */

const path = require('path');
const fs = require('fs');

// Try to load firebase-admin
let admin;
try {
  admin = require('firebase-admin');
} catch (e) {
  try {
    const functionsPath = path.join(__dirname, '..', '..', 'functions', 'node_modules', 'firebase-admin');
    admin = require(functionsPath);
  } catch (e2) {
    console.error('❌ Cannot find firebase-admin module');
    console.error('   Please install it: npm install firebase-admin');
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const projectIndex = args.indexOf('--project');
const projectId = projectIndex !== -1 && args[projectIndex + 1] 
  ? args[projectIndex + 1] 
  : 'agritectum-platform';

console.log(`📍 Geocoding service agreements for project: ${projectId}\n`);

// Geocode address using Nominatim API (OpenStreetMap)
async function geocodeAddress(address) {
  try {
    if (!address || address.trim().length < 5) {
      return null;
    }

    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'Taklaget Service App',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error(`Error geocoding address "${address}":`, error.message);
    return null;
  }
}

async function initializeFirebase() {
  try {
    // Find project service account key
    const projectRoot = path.join(__dirname, '..', '..');
    const files = fs.readdirSync(projectRoot);
    const serviceAccountFile = files.find(f => 
      f.startsWith(`${projectId}-firebase-adminsdk-`) && 
      f.endsWith('.json')
    );
    
    if (!serviceAccountFile) {
      console.error('❌ Service account key not found!');
      console.error(`   Expected file pattern: ${projectId}-firebase-adminsdk-*.json`);
      console.error('   Please download it from Firebase Console > Project Settings > Service Accounts');
      process.exit(1);
    }
    
    const serviceAccount = require(path.join(projectRoot, serviceAccountFile));
    
    // Initialize Firebase Admin
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // If already initialized, check if it's the correct project
      const currentProject = admin.app().options.projectId;
      if (currentProject !== projectId) {
        console.log(`⚠️  Reinitializing with ${projectId} project...`);
        admin.app().delete();
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
    }
    
    console.log(`✅ Firebase Admin initialized for project: ${projectId}\n`);
    return admin.firestore();
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
  }
}

async function geocodeAgreements() {
  const db = await initializeFirebase();
  
  try {
    console.log('🔍 Fetching all service agreements...\n');
    
    const agreementsRef = db.collection('serviceAgreements');
    const snapshot = await agreementsRef.get();
    
    if (snapshot.empty) {
      console.log('ℹ️  No service agreements found.');
      return;
    }
    
    const agreements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    console.log(`📋 Found ${agreements.length} service agreements\n`);
    
    // Filter agreements that need geocoding
    const needsGeocoding = agreements.filter(agreement => 
      agreement.customerAddress && 
      (!agreement.latitude || !agreement.longitude)
    );
    
    if (needsGeocoding.length === 0) {
      console.log('✅ All agreements already have coordinates!\n');
      return;
    }
    
    console.log(`📍 Found ${needsGeocoding.length} agreements that need geocoding:\n`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const agreement of needsGeocoding) {
      try {
        console.log(`   Geocoding: ${agreement.title || agreement.id}`);
        console.log(`   Address: ${agreement.customerAddress}`);
        
        const coords = await geocodeAddress(agreement.customerAddress);
        
        if (coords) {
          await agreementsRef.doc(agreement.id).update({
            latitude: coords.lat,
            longitude: coords.lon,
            updatedAt: new Date().toISOString(),
          });
          
          console.log(`   ✅ Added coordinates: ${coords.lat}, ${coords.lon}\n`);
          successCount++;
          
          // Rate limiting - Nominatim requires delays between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log(`   ⚠️  Could not geocode address\n`);
          failCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error processing agreement ${agreement.id}:`, error.message);
        failCount++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Successfully geocoded: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📍 Total processed: ${needsGeocoding.length}\n`);
    
  } catch (error) {
    console.error('❌ Error geocoding agreements:', error);
    process.exit(1);
  }
}

// Run the script
geocodeAgreements()
  .then(() => {
    console.log('✅ Geocoding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

