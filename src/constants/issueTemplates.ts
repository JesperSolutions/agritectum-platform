import { IssueType, IssueSeverity } from '../../types';

export interface IssueTemplate {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  title: string;
  description: string;
  location: string;
  icon: string;
  color: string;
}

export const ISSUE_TEMPLATES: IssueTemplate[] = [
  {
    id: 'leak_roof_edge',
    type: 'leak',
    severity: 'high',
    title: 'Roof Edge Leak',
    description:
      'Water infiltration at the roof edge, typically caused by damaged flashing or poor sealing.',
    location: 'Roof edge',
    icon: '💧',
    color: 'text-red-600',
  },
  {
    id: 'leak_chimney',
    type: 'leak',
    severity: 'high',
    title: 'Chimney Leak',
    description:
      'Water penetration around chimney flashing, often due to deteriorated sealant or damaged flashing.',
    location: 'Chimney area',
    icon: '🏠',
    color: 'text-red-600',
  },
  {
    id: 'damage_missing_tiles',
    type: 'damage',
    severity: 'medium',
    title: 'Missing Tiles',
    description: 'Individual tiles have fallen off or are missing, exposing the roof structure.',
    location: 'Various locations',
    icon: '🧱',
    color: 'text-orange-600',
  },
  {
    id: 'damage_cracked_tiles',
    type: 'damage',
    severity: 'medium',
    title: 'Cracked Tiles',
    description: 'Tiles showing visible cracks, which can lead to water penetration.',
    location: 'Various locations',
    icon: '⚡',
    color: 'text-orange-600',
  },
  {
    id: 'wear_general',
    type: 'wear',
    severity: 'low',
    title: 'General Wear',
    description: 'Normal aging and wear patterns on the roof surface.',
    location: 'General roof area',
    icon: '⏰',
    color: 'text-yellow-600',
  },
  {
    id: 'structural_sagging',
    type: 'structural',
    severity: 'critical',
    title: 'Roof Sagging',
    description:
      'Visible sagging or deflection in the roof structure, indicating potential structural issues.',
    location: 'Roof structure',
    icon: '⚠️',
    color: 'text-red-800',
  },
  {
    id: 'ventilation_blocked',
    type: 'ventilation',
    severity: 'medium',
    title: 'Blocked Ventilation',
    description: 'Ventilation openings are blocked or obstructed, reducing air circulation.',
    location: 'Ventilation areas',
    icon: '🌪️',
    color: 'text-blue-600',
  },
  {
    id: 'gutters_clogged',
    type: 'gutters',
    severity: 'low',
    title: 'Clogged Gutters',
    description: 'Gutters are filled with debris, preventing proper water drainage.',
    location: 'Gutter system',
    icon: '🌿',
    color: 'text-green-600',
  },
  {
    id: 'flashing_damaged',
    type: 'flashing',
    severity: 'high',
    title: 'Damaged Flashing',
    description:
      'Metal flashing around penetrations is damaged or missing, creating potential leak points.',
    location: 'Penetrations',
    icon: '🔧',
    color: 'text-red-600',
  },
  {
    id: 'moss_growth',
    type: 'other',
    severity: 'low',
    title: 'Moss Growth',
    description:
      'Moss or algae growth on roof surface, which can retain moisture and cause damage.',
    location: 'Shaded areas',
    icon: '🌿',
    color: 'text-green-600',
  },
];

export const getSeverityIcon = (severity: IssueSeverity): string => {
  switch (severity) {
    case 'critical':
      return '🔴';
    case 'high':
      return '🟠';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '⚪';
  }
};

export const getSeverityColor = (severity: IssueSeverity): string => {
  switch (severity) {
    case 'critical':
      return 'text-red-800 bg-red-100';
    case 'high':
      return 'text-red-600 bg-red-50';
    case 'medium':
      return 'text-orange-600 bg-orange-50';
    case 'low':
      return 'text-green-600 bg-green-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const getTypeIcon = (type: IssueType): string => {
  switch (type) {
    case 'leak':
      return '💧';
    case 'damage':
      return '⚡';
    case 'wear':
      return '⏰';
    case 'structural':
      return '⚠️';
    case 'ventilation':
      return '🌪️';
    case 'gutters':
      return '🌿';
    case 'flashing':
      return '🔧';
    case 'other':
      return '📋';
    default:
      return '❓';
  }
};
