import { respondToOfferPublic } from '../services/offerService';
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  setDoc,
  doc,
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

describe('respondToOfferPublic', () => {
  beforeAll(() => {
    const app = initializeApp({
      apiKey: 'fake',
      projectId: 'test',
      appId: 'test',
      authDomain: 'test',
      messagingSenderId: 'test',
    });
    connectFirestoreEmulator(getFirestore(app), 'localhost', 8080);
  });

  it('accepts a public offer', async () => {
    // Arrange: Offer with pending status and publicLink
    const db = getFirestore();
    const offerRef = doc(collection(db, 'offers'));
    await setDoc(offerRef, {
      status: 'pending',
      publicLink: 'public-token',
      customerName: 'Anna',
      title: 'Testrun',
      totalAmount: 1000,
      currency: 'SEK',
      createdBy: 'inspector-uid',
    });

    // Simulate callable through mock (integration would need cloud functions emulator)
    // Here just call the exported method, would need emulator setup for full test
    await expect(respondToOfferPublic(offerRef.id, 'accept')).resolves.not.toThrow();
  });

  it('rejects a public offer with reason', async () => {
    // Arrange: Offer with pending status and publicLink
    const db = getFirestore();
    const offerRef = doc(collection(db, 'offers'));
    await setDoc(offerRef, {
      status: 'pending',
      publicLink: 'public-token',
      customerName: 'Anna',
      title: 'Testrun',
      totalAmount: 1000,
      currency: 'SEK',
      createdBy: 'inspector-uid',
    });

    await expect(
      respondToOfferPublic(offerRef.id, 'reject', 'Too expensive')
    ).resolves.not.toThrow();
  });
});
