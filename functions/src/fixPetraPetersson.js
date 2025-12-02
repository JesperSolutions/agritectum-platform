
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const fixPetraPetersson = onRequest(async (req, res) => {
  try {
    const petraData = {
      uid: '1TngdzOaS7Xfd1GHJedLNuGX1g52',
      email: 'petra.petersson@taklaget.se',
      displayName: 'Petra Petersson',
      role: 'inspector',
      permissionLevel: 0,
      branchId: 'malmo',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const petraDocRef = admin.firestore().collection('users').doc(petraData.uid);
    
    // Check if document exists
    const petraDoc = await petraDocRef.get();
    
    if (petraDoc.exists) {
      // Update existing document
      await petraDocRef.update({
        role: petraData.role,
        permissionLevel: petraData.permissionLevel,
        branchId: petraData.branchId,
        isActive: petraData.isActive,
        updatedAt: petraData.updatedAt
      });
      console.log('✅ Petra's document updated');
    } else {
      // Create new document
      await petraDocRef.set(petraData);
      console.log('✅ Petra's document created');
    }

    res.status(200).json({ 
      success: true, 
      message: 'Petra Petersson data fixed successfully',
      data: petraData 
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
