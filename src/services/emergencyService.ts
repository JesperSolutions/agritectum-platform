/**
 * Emergency Protocols Service
 * Manages emergency protocols and incident reporting for buildings
 */

import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  orderBy,
} from 'firebase/firestore';
import { EmergencyProtocol, IncidentReport } from '../types';
import { logger } from '../utils/logger';

/**
 * Create emergency protocol for a building
 */
export const createEmergencyProtocol = async (
  protocol: Omit<EmergencyProtocol, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const protocolsRef = collection(db, 'emergencyProtocols');
    const now = new Date().toISOString();
    
    const docRef = await addDoc(protocolsRef, {
      ...protocol,
      createdAt: now,
      updatedAt: now,
    });
    
    logger.log('Emergency protocol created:', docRef.id);
    return docRef.id;
  } catch (error) {
    logger.error('Error creating emergency protocol:', error);
    throw new Error('Failed to create emergency protocol');
  }
};

/**
 * Get emergency protocols for a building
 */
export const getBuildingEmergencyProtocols = async (
  buildingId: string
): Promise<EmergencyProtocol[]> => {
  try {
    const protocolsRef = collection(db, 'emergencyProtocols');
    const q = query(protocolsRef, where('buildingId', '==', buildingId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as EmergencyProtocol[];
  } catch (error) {
    logger.error('Error getting emergency protocols:', error);
    throw new Error('Failed to load emergency protocols');
  }
};

/**
 * Update emergency protocol
 */
export const updateEmergencyProtocol = async (
  protocolId: string,
  updates: Partial<EmergencyProtocol>
): Promise<void> => {
  try {
    const protocolRef = doc(db, 'emergencyProtocols', protocolId);
    await updateDoc(protocolRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error updating emergency protocol:', error);
    throw new Error('Failed to update emergency protocol');
  }
};

/**
 * Create incident report
 */
export const createIncidentReport = async (
  incident: Omit<IncidentReport, 'id' | 'reportedAt'>
): Promise<string> => {
  try {
    const incidentsRef = collection(db, 'incidentReports');
    const docRef = await addDoc(incidentsRef, {
      ...incident,
      reportedAt: new Date().toISOString(),
    });
    
    logger.log('Incident report created:', docRef.id);
    
    // TODO: Send notifications to relevant parties
    // TODO: Trigger emergency protocol if severity is critical
    
    return docRef.id;
  } catch (error) {
    logger.error('Error creating incident report:', error);
    throw new Error('Failed to create incident report');
  }
};

/**
 * Get incident reports for a building
 */
export const getBuildingIncidentReports = async (
  buildingId: string,
  status?: string
): Promise<IncidentReport[]> => {
  try {
    const incidentsRef = collection(db, 'incidentReports');
    let q = query(
      incidentsRef,
      where('buildingId', '==', buildingId),
      orderBy('reportedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    let incidents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as IncidentReport[];
    
    if (status) {
      incidents = incidents.filter(i => i.status === status);
    }
    
    return incidents;
  } catch (error) {
    logger.error('Error getting incident reports:', error);
    throw new Error('Failed to load incident reports');
  }
};

/**
 * Update incident report
 */
export const updateIncidentReport = async (
  incidentId: string,
  updates: Partial<IncidentReport>
): Promise<void> => {
  try {
    const incidentRef = doc(db, 'incidentReports', incidentId);
    const docSnap = await getDoc(incidentRef);
    
    if (!docSnap.exists()) {
      throw new Error('Incident report not found');
    }
    
    const updateData: any = { ...updates };
    
    // If status is being changed to resolved, add resolvedAt timestamp
    if (updates.status === 'resolved' && !updates.resolvedAt) {
      updateData.resolvedAt = new Date().toISOString();
    }
    
    await updateDoc(incidentRef, updateData);
    logger.log('Incident report updated:', incidentId);
  } catch (error) {
    logger.error('Error updating incident report:', error);
    throw new Error('Failed to update incident report');
  }
};

/**
 * Get incident statistics for a building
 */
export const getBuildingIncidentStats = async (buildingId: string): Promise<{
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  totalCost: number;
  insuranceClaims: number;
}> => {
  try {
    const incidents = await getBuildingIncidentReports(buildingId);
    
    const stats = {
      total: incidents.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      totalCost: 0,
      insuranceClaims: 0,
    };
    
    incidents.forEach(incident => {
      // Count by type
      stats.byType[incident.type] = (stats.byType[incident.type] || 0) + 1;
      
      // Count by severity
      stats.bySeverity[incident.severity] = (stats.bySeverity[incident.severity] || 0) + 1;
      
      // Count by status
      stats.byStatus[incident.status] = (stats.byStatus[incident.status] || 0) + 1;
      
      // Sum costs
      if (incident.cost) {
        stats.totalCost += incident.cost;
      }
      
      // Count insurance claims
      if (incident.insuranceClaim) {
        stats.insuranceClaims++;
      }
    });
    
    return stats;
  } catch (error) {
    logger.error('Error getting incident statistics:', error);
    throw new Error('Failed to get incident statistics');
  }
};

/**
 * Get default emergency protocols template
 */
export const getDefaultEmergencyProtocols = (
  buildingId: string,
  createdBy: string
): Omit<EmergencyProtocol, 'id' | 'createdAt' | 'updatedAt'>[] => {
  return [
    {
      buildingId,
      type: 'fire',
      title: 'Fire Emergency Protocol',
      description: 'Steps to follow in case of fire',
      steps: [
        'Activate fire alarm',
        'Call emergency services (112)',
        'Evacuate building using nearest exit',
        'Do not use elevators',
        'Meet at designated assembly point',
        'Do not re-enter building until cleared by fire department',
      ],
      emergencyContacts: [],
      createdBy,
    },
    {
      buildingId,
      type: 'flood',
      title: 'Flood Emergency Protocol',
      description: 'Steps to follow in case of flooding',
      steps: [
        'Turn off main water supply if safe to do so',
        'Turn off electricity at main breaker',
        'Move to higher ground',
        'Call emergency services if needed',
        'Document damage with photos',
        'Contact insurance company',
      ],
      emergencyContacts: [],
      createdBy,
    },
    {
      buildingId,
      type: 'structural',
      title: 'Structural Damage Protocol',
      description: 'Steps to follow for structural damage',
      steps: [
        'Evacuate building immediately if unsafe',
        'Call emergency services (112)',
        'Do not attempt to enter damaged areas',
        'Contact structural engineer',
        'Document damage with photos',
        'Contact insurance company',
      ],
      emergencyContacts: [],
      createdBy,
    },
    {
      buildingId,
      type: 'weather',
      title: 'Severe Weather Protocol',
      description: 'Steps to follow during severe weather events',
      steps: [
        'Monitor weather alerts',
        'Secure outdoor items',
        'Close and secure all windows and doors',
        'Move to interior rooms away from windows if needed',
        'Have emergency supplies ready',
        'Follow evacuation orders if issued',
      ],
      emergencyContacts: [],
      createdBy,
    },
  ];
};
