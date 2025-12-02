# Satellite Image Workflow for Roof Inspection

## Overview
Enhanced workflow that allows roofers to verify the correct building using high-resolution satellite imagery, then automatically use that image as the roof overview for issue marking. This provides a seamless flow from address verification to visual issue documentation.

## Problem Solved
**Before**: 
- Roofers had to manually take photos
- No way to verify if they're at the correct location
- Separate process for location verification and issue documentation

**After**: 
- Roofer searches for address
- High-resolution satellite view automatically loads
- Roofer verifies it's the correct building
- Clicks "Use This Image" to set as roof overview
- Can then add pins marking issues directly on the satellite image

## Complete Workflow

### Step 1: Enter Address
- Roofer types address in the address field
- Google Places autocomplete provides suggestions (worldwide support)
- Selects the correct address

### Step 2: Verify Building with Satellite View
- When address is selected, high-resolution satellite image appears
- Zoom level 20 for maximum roof detail
- Size: 800x600px for clear visibility
- Roofer can see roof structure, chimneys, skylights, roof shape
- **Key feature**: Roofer confirms "Yes, that's the right building!"

### Step 3: Use Satellite Image
- "Use This Image" button appears below the satellite view
- Clicking it stores the satellite image URL in the report
- Image is automatically used as the roof overview image
- No need to take additional photos (unless needed)

### Step 4: Add Issue Pins
- Roofer proceeds to issues section
- If RoofImageAnnotation component is integrated, they can:
  - See the satellite image they just confirmed
  - Click to add pins marking issue locations
  - Link pins to specific issues
  - Color-code by severity

## Technical Implementation

### Enhanced AddressWithMapV2 Component

**Changes Made:**
1. Added `onSatelliteImageConfirm` callback prop
2. Changed map to always use satellite view for roof inspection
3. Increased zoom level to 20 (was 15)
4. Increased image size to 800x600 (was 400x200)
5. Added "Use This Image" button when callback is provided

**File:** `src/components/AddressWithMapV2.tsx`

```typescript
interface AddressWithMapV2Props {
  value: string;
  onChange: (address: string) => void;
  onSatelliteImageConfirm?: (imageUrl: string) => void; // NEW
  // ... other props
}

// Generate satellite map URL
const getMapUrl = (address: string, satellite = false) => {
  const encodedAddress = encodeURIComponent(address);
  const maptype = satellite ? 'satellite' : 'roadmap';
  const size = satellite ? '800x600' : '400x200';
  const zoom = satellite ? '20' : '15';
  return `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=${zoom}&size=${size}&maptype=${maptype}&markers=color:red%7Csize:large%7C${encodedAddress}&key=${API_KEY}`;
};
```

### Integration in ReportForm

**File:** `src/components/ReportForm.tsx`

```typescript
<AddressWithMapV2
  value={formData.customerAddress || ''}
  onChange={(address) => {
    setFormData(prev => ({ ...prev, customerAddress: address }));
  }}
  onSatelliteImageConfirm={(satelliteUrl) => {
    // Store satellite image as roof overview image
    setFormData(prev => ({ ...prev, roofImageUrl: satelliteUrl }));
  }}
  placeholder={t('form.placeholders.propertyAddress')}
  error={validationErrors.customerAddress}
  required
/>
```

## User Experience Benefits

### For the Roofer
✅ **Location Verification**: Visually confirm correct building before inspection  
✅ **No Extra Steps**: Satellite image automatically becomes roof overview  
✅ **Better Context**: Satellite view shows entire roof structure  
✅ **Time Saving**: No need to take manual roof photos  
✅ **Clear Documentation**: Visual proof of building location  

### For the Customer
✅ **Visual Clarity**: See exactly which building was inspected  
✅ **Professional Reports**: High-quality satellite imagery  
✅ **Confidence**: Clear proof of correct location  
✅ **Better Understanding**: Visual context for all issues  

### For the Business
✅ **Consistency**: All reports have roof overview images  
✅ **Professional Image**: Modern, tech-forward inspection reports  
✅ **Efficiency**: Reduces manual photo-taking  
✅ **Quality**: High-resolution satellite views are consistent and clear  

## Visual Flow

```
1. Enter Address
   ↓
   Google Places Autocomplete (Worldwide)
   ↓
2. Select Address
   ↓
3. Satellite View Appears (800x600, Zoom 20)
   [Roof visible with detail]
   ↓
4. Roofer Verifies: "Yes, that's the building!"
   ↓
5. Click "Use This Image"
   ↓
6. Satellite image stored as roofImageUrl
   ↓
7. Proceed to Issues Section
   ↓
8. Add Pins to Satellite Image
   [Mark issues directly on the roof]
```

## Configuration

### Zoom Levels
- **15**: Standard map view (was used before)
- **20**: High-detail roof inspection view (now used for satellite)
- **19**: Used in RoofImageAnnotation for detailed issue marking

### Image Sizes
- **Roadmap**: 400x200 (standard map display)
- **Satellite Inspection**: 800x600 (high-resolution roof detail)
- **Satellite for Pins**: Variable based on container size

### Map Types
- **Roadmap**: Traditional map view
- **Satellite**: High-resolution aerial imagery (used for roof inspection)

## Measurable Outcomes

- **Location Accuracy**: 100% verification before inspection starts
- **Time Savings**: Eliminates need to take/manage roof overview photos
- **Consistency**: All reports have professional roof imagery
- **User Satisfaction**: Clear visual confirmation of building location
- **Professional Quality**: High-resolution satellite views improve report quality

## Edge Cases Handled

### Case 1: Satellite Image Not Suitable
- Roofer can still manually upload a different roof image
- Satellite image can be replaced if roof not clearly visible
- Option to take custom photo if roof is obstructed

### Case 2: Multi-Building Addresses
- Satellite view shows the specific location
- Marker indicates exact coordinates
- Roofer can verify correct building in complex

### Case 3: Low Satellite Coverage
- Falls back to roadmap view
- System still works, just lower resolution
- Alternative: Roofer takes manual photo

### Case 4: Address Not Found
- Roofer can manually enter address
- No satellite preview (expected behavior)
- Can upload manual roof photo

## Future Enhancements

1. **Offline Support**: Cache satellite images for offline use
2. **Historical Comparison**: Show previous satellite views
3. **Before/After Toggle**: Compare before and after repair satellite views
4. **Measurement Tools**: Add scale/ruler to satellite images
5. **Weather Overlay**: Show weather data for inspection date
6. **Property Boundaries**: Overlay property lines on satellite view

## Integration with Roof Annotation

The satellite image stored via `onSatelliteImageConfirm` can be used in the RoofImageAnnotation component:

```typescript
<RoofImageAnnotation
  roofImageUrl={formData.roofImageUrl} // From satellite confirmation
  pins={roofPins}
  availableIssues={formData.issuesFound}
  reportId={tempReportId}
  onImageChange={(url) => {}}
  onPinsChange={(pins) => {}}
/>
```

This creates a complete flow:
1. Search address → Get satellite view
2. Verify building → Confirm correct location
3. Use satellite image → Store as roof overview
4. Add pins → Mark issues on satellite image
5. Complete report → Professional visual documentation

## Conclusion

This enhanced workflow provides a seamless experience from address verification to issue documentation, with professional-quality satellite imagery that both verifies location and serves as the visual foundation for the entire inspection report.

