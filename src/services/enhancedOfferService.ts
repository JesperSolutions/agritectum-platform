import { Report, Branch } from '../types';
import { EmailTemplate, defaultTemplates, replaceTemplateVariables } from './triggerEmailService';
import { brandConfig } from '../config/brand';

// Email configuration - uses environment variables for white-label deployment
export const EMAIL_CONFIG = {
  domain: import.meta.env.VITE_WEBSITE_URL?.replace(/^https?:\/\//, '').replace(/\/$/, '') || 'example.com',
  noreply: import.meta.env.VITE_FROM_EMAIL || 'noreply@example.com',
  support: import.meta.env.VITE_SUPPORT_EMAIL || 'support@example.com',
};

// Get current email configuration (will switch when domain is ready)
export const getCurrentEmailConfig = () => {
  // For now, use current domain - easy to switch later
  return EMAIL_CONFIG.current;
};

// Offer-specific email templates
export const offerTemplates: EmailTemplate[] = [
  {
    id: 'offer-proposal',
    name: 'Professional Roof Repair Offer',
    subject: 'Takinspektionsoffert - {{customerName}} ({{offerValue}} SEK)',
    body: `Kära {{customerName}},

Tack för att du valde {{brandName}} för din bygginspektion. Baserat på vår grundliga inspektion av din fastighet på {{customerAddress}}, har vi glädjen att presentera ett omfattande reparationsförslag.

🏠 INSPEKTIONSSAMMANFATTNING
- Inspektionsdatum: {{inspectionDate}}
- Inspektör: {{inspectorName}}
- Rapport-ID: {{reportId}}

💰 OFFERTDETALJER
- Totalt offertvärde: {{offerValue}} SEK
- Offert gäller till: {{offerValidUntil}}
- Beräknad arbetstid: {{estimatedDuration}}

🔧 ARBETE SOM INGÅR
{{workDescription}}

✅ VARFÖR VÄLJA {{brandName}}?
- Professionella certifierade takläggare
- Högkvalitativa material och utförande
- Fullständig garanti på allt utfört arbete
- Konkurrenskraftiga priser utan dolda kostnader
- Flexibel schemaläggning som passar dig

📞 FÖR ATT ACCEPTERA DENNA OFFERT
Kontakta oss innan {{offerValidUntil}}:
- Telefon: {{branchPhone}}
- E-post: {{branchEmail}}

Denna offert gäller till {{offerValidUntil}}. Efter detta datum kan priser och tillgänglighet ändras.

Med vänliga hälsningar,
{{branchName}} Team
{{brandName}}

Professionell licens: #{{licenseNumber}}
Försäkring: Fullständigt täckt för ditt skydd`,
    isDefault: false,
  },
  {
    id: 'offer-reminder',
    name: 'Offer Reminder',
    subject: 'Påminnelse: Din offert går ut snart - {{customerName}}',
    body: `Kära {{customerName}},

Vi ville påminna dig om att din offert för takreparation går ut om {{daysLeft}} dagar.

💰 OFFERTDETALJER
- Offertvärde: {{offerValue}} SEK
- Gäller till: {{offerValidUntil}}
- Rapport-ID: {{reportId}}

För att säkra detta pris och boka arbetet, kontakta oss innan offerten går ut:

📞 KONTAKT
- Telefon: {{branchPhone}}
- E-post: {{branchEmail}}

Efter {{offerValidUntil}} kan vi behöva revidera priset baserat på aktuella material- och arbetskostnader.

Med vänliga hälsningar,
{{branchName}} Team
{{brandName}}`,
    isDefault: false,
  },
  {
    id: 'offer-expired',
    name: 'Offer Expired',
    subject: 'Din offert har gått ut - {{customerName}}',
    body: `Kära {{customerName}},

Din offert för takreparation gick ut den {{offerValidUntil}}.

Om du fortfarande är intresserad av att utföra reparationerna kan vi ge dig en ny offert baserat på aktuella priser.

📞 FÖR NY OFFERT
Kontakta oss så hjälper vi dig:
- Telefon: {{branchPhone}}
- E-post: {{branchEmail}}

Vi ser fram emot att höra från dig.

Med vänliga hälsningar,
{{branchName}} Team
{{brandName}}`,
    isDefault: false,
  },
];

// Combine default templates with offer templates
export const getAllTemplates = (): EmailTemplate[] => {
  return [...defaultTemplates, ...offerTemplates];
};

// Generate offer-specific email content
export const generateOfferEmailContent = (
  report: Report,
  template: EmailTemplate,
  branchInfo: Branch,
  reportLink: string
): { subject: string; body: string } => {
  const emailConfig = getCurrentEmailConfig();

  const variables = {
    customerName: report.customerName || 'Värderad kund',
    customerAddress: report.customerAddress || '',
    inspectionDate: new Date(report.inspectionDate).toLocaleDateString('sv-SE'),
    inspectorName: report.createdByName || 'Vår inspektör',
    reportId: report.id,
    branchName: branchInfo?.name || brandConfig.brandName,
    branchPhone: branchInfo?.phone || '+46 470 123 456',
    branchEmail: branchInfo?.email || emailConfig.support,
    branchAddress: branchInfo?.address || 'Professional Roofing Services',
    reportLink: reportLink,
    offerValue: report.offerValue?.toLocaleString('sv-SE') || '0',
    offerValidUntil: report.offerValidUntil
      ? new Date(report.offerValidUntil).toLocaleDateString('sv-SE')
      : 'Ej specificerat',
    workDescription: generateWorkDescription(report),
    estimatedDuration: calculateEstimatedDuration(report),
    daysLeft: report.offerValidUntil
      ? Math.ceil(
          (new Date(report.offerValidUntil).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0,
    licenseNumber: 'ROF-2024-001',
  };

  return {
    subject: replaceTemplateVariables(template.subject, variables),
    body: replaceTemplateVariables(template.body, variables),
  };
};

// Helper function to generate work description from report issues
const generateWorkDescription = (report: Report): string => {
  if (!report.recommendedActions || report.recommendedActions.length === 0) {
    return 'Detaljerad arbetsbeskrivning baserad på inspektionsresultat.';
  }

  return report.recommendedActions
    .map((action, index) => `${index + 1}. ${action.description}`)
    .join('\n');
};

// Helper function to calculate estimated duration
const calculateEstimatedDuration = (report: Report): string => {
  const actionCount = report.recommendedActions?.length || 0;
  if (actionCount <= 2) return '1-2 dagar';
  if (actionCount <= 5) return '3-5 dagar';
  return '1-2 veckor';
};
