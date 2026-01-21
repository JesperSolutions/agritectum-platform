# Roof Image Annotation Feature

## Overview

New feature that allows roofers to upload a roof overview image and add interactive pins marking issue locations. This provides a visual reference for the inspection report and helps customers understand exactly where problems are located.

## Problem Solved

**Before**: Roofers could only add individual photos to specific issues, but there was no way to show the overall roof with all issues marked visually.

**After**: Roofers can:

1. Upload a roof overview/snapshot image
2. Click on the image to add pins marking where issues are located
3. Link pins to specific issues for context
4. Color-code pins by severity (Low = Green, Medium = Yellow, High = Orange, Critical = Red)

## User Flow

### 1. Uploading Roof Image

- Roofer starts creating a report
- In the inspection section, they can upload a roof overview image
- Options: Take a photo with camera OR select from gallery
- Image is automatically compressed and stored in Firebase

### 2. Adding Issue Pins

- Once image is uploaded, roofer can click anywhere on the image
- A pin appears at the clicked location
- Pin is color-coded by severity (initially defaults to "medium")
- Roofer can add multiple pins to mark different issue locations

### 3. Linking Pins to Issues

- When creating an issue in the issue form, roofer gets option to "Link to pin on roof image"
- Or after creating issues, they can:
  - Click a pin on the roof image
  - Use the dropdown to select which issue this pin represents
- Pin label shows the linked issue name

### 4. Visual Context

- Customers viewing the report see:
  - Full roof image with colored pins marking issues
  - Pin colors indicate severity (Green/Yellow/Orange/Red)
  - Pin labels show which issue it represents
  - Detailed issue information in the issues list

## Technical Implementation

### New Components

**File:** `src/components/RoofImageAnnotation.tsx`

Features:

- Image upload with camera/gallery support
- Click-to-add pin functionality
- Pin management (select, remove, configure)
- Issue linking via dropdown
- Color coding by severity
- Responsive design

### Data Model Changes

**File:** `src/types/index.ts`

```typescript
export interface Report {
  // ... existing fields ...
  roofImageUrl?: string; // Roof overview image URL
  roofImagePins?: RoofPinMarker[]; // Pins marking issues on roof image
}

export interface RoofPinMarker {
  id: string;
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from top (0-100)
  issueId?: string; // Link to specific issue
  severity: IssueSeverity;
}
```

### Integration Points

**ReportForm Integration:**
To use this feature in the report form:

1. Import the component:

```typescript
import RoofImageAnnotation from './RoofImageAnnotation';
import { RoofPinMarker } from '../types';
```

2. Add state for roof image:

```typescript
const [roofImageUrl, setRoofImageUrl] = useState<string | undefined>(undefined);
const [roofPins, setRoofPins] = useState<RoofPinMarker[]>([]);
```

3. Add to form section:

```typescript
<RoofImageAnnotation
  roofImageUrl={roofImageUrl}
  pins={roofPins}
  availableIssues={formData.issuesFound || []}
  reportId={tempReportId}
  onImageChange={(url) => {
    setRoofImageUrl(url);
    setFormData(prev => ({ ...prev, roofImageUrl: url }));
  }}
  onPinsChange={(pins) => {
    setRoofPins(pins);
    setFormData(prev => ({ ...prev, roofImagePins: pins }));
  }}
  disabled={loading}
/>
```

## Benefits

### For Roofers

✅ **Visual Documentation**: Show the whole roof with all issues marked  
✅ **Easy Location Marking**: Click to add pins, no complex coordinates needed  
✅ **Professional Reports**: More visually appealing for customers  
✅ **Issue Context**: Link issues to specific roof locations

### For Customers

✅ **Clear Understanding**: Visual representation of where problems are  
✅ **Severity Visualization**: Color coding shows urgency at a glance  
✅ **Professional Presentation**: High-quality visual inspection reports

### For Business

✅ **Professional Image**: Modern, tech-forward reporting  
✅ **Customer Trust**: Visual proof of thorough inspection  
✅ **Competitive Advantage**: Better than basic photo attachments

## Usage Scenarios

### Scenario 1: Complete Inspection Report

1. Roofer uploads satellite photo or photo from ladder
2. Identifies 3 issues: crack near chimney (critical), missing tiles (medium), wear on north side (low)
3. Adds 3 pins on roof image at problem locations
4. Links each pin to the corresponding issue
5. Customer receives report showing visual layout of all issues

### Scenario 2: Quick Visual Reference

1. Roofer takes drone photo of roof
2. During inspection, adds pins as they find issues
3. Later links pins to detailed issue descriptions
4. Visual + detailed documentation in one report

### Scenario 3: Customer Presentation

1. Roofer shows customer the roof image with color-coded pins
2. Explains: "Red pins are critical issues requiring immediate attention"
3. Customer understands severity and locations immediately
4. Visual helps explain why certain repairs are necessary

## Measurable Outcomes

- **User Satisfaction**: Visual issue marking improves customer understanding
- **Report Quality**: More professional inspection reports
- **Issue Tracking**: Better spatial awareness of roof problems
- **Time Savings**: Quick pin placement vs. detailed text descriptions
- **Visual Appeal**: More engaging than text-only reports

## Next Steps for Full Implementation

### 1. Integrate into ReportForm

- Add roof image section before issues section
- Connect to form data state
- Save roofImageUrl and roofImagePins when report is saved

### 2. Display in Report View

- Show roof image with pins on report page
- Allow clicking pins to jump to issue details
- Add zoom functionality for larger roofs

### 3. Export to PDF

- Include annotated roof image in PDF export
- Maintain pin positions and colors
- Add legend explaining severity colors

### 4. Mobile Optimization

- Ensure image upload works on mobile cameras
- Touch-friendly pin selection and configuration
- Responsive layout for different screen sizes

## Future Enhancements

- **Draggable Pins**: Move pins after placing them
- **Pin Images**: Attach photos to individual pins
- **Before/After Comparison**: Upload multiple images over time
- **Multiple Roof Sections**: Support complex roof layouts
- **Measurement Tools**: Add distance/area measurements to image
- **Drawing Tools**: Draw circles, arrows, lines on image

## Technical Notes

### Image Storage

- Roof images stored in: `reports/{reportId}/roof-overview/`
- Automatic compression to reduce storage costs
- Max file size: 10MB (configurable)

### Pin Coordinates

- Stored as percentages (0-100) for responsive display
- Independent of image size - works on any screen
- Persistent across different image displays

### Performance

- Debounced pin updates for smooth interaction
- Image lazy loading for better performance
- Optimized rendering for multiple pins

## Conclusion

This feature enhances the roof inspection workflow by providing visual context for issues. It makes reports more professional, helps customers understand problems better, and improves the overall inspection experience.
