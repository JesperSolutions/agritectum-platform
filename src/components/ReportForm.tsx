import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { useReports } from '../contexts/ReportContextSimple';
import { useAuth } from '../contexts/AuthContext';
import { useReportNotifications } from '../hooks/useNotificationEvents';
import * as appointmentService from '../services/appointmentService';
import { notifyBranchManagersOnReportCreation } from '../services/notificationService';
import FormErrorBoundary from './FormErrorBoundary';
import { useIntl } from '../hooks/useIntl';
import { logger } from '../utils/logger';
import { getCurrencyCode, getPhoneCountryCode } from '../utils/currency';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import {
  Report,
  RoofType,
  ReportStatus,
  Issue,
  RecommendedAction,
  IssueType,
  IssueSeverity,
  ActionPriority,
  ActionUrgency,
  Customer,
  Building,
  MapMarker,
  RoofPinMarker,
} from '../types';
import {
  Save,
  Plus,
  Trash2,
  Calendar,
  User,
  Mail,
  FileText,
  AlertTriangle,
  Ruler,
  DollarSign,
  Camera,
  X,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import LoadingSpinner from './common/LoadingSpinner';
import NotificationToast from './common/NotificationToast';
import IssueImageUpload from './IssueImageUpload';
import IssueTemplateSelector from './IssueTemplateSelector';
import RoofSizeMeasurer from './RoofSizeMeasurer';
import DefectCameraCapture from './DefectCameraCapture';
import DefectQuickDescription from './DefectQuickDescription';
import CustomerSearchInline from './CustomerSearchInline';
import InspectionChecklistItem, {
  type InspectionChecklistItemData,
} from './ReportForm/InspectionChecklistItem';
import { IssueTemplate } from '../constants/issueTemplates';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import AddressInput from './AddressInput';
import { lazy, Suspense } from 'react';
import {
  safeParseNumber,
  safeParseInt,
  sanitizeDraftData,
  validateCoordinates,
  validateDateString,
  validateStepNumber,
  validateRoofPins,
} from '../utils/formDataValidation';

// Lazy load heavy components for better initial load performance
const RoofImageAnnotation = lazy(() => import('./RoofImageAnnotation'));
const InteractiveRoofMap = lazy(() => import('./InteractiveRoofMap'));
import {
  MaterialFormField,
  MaterialInput,
  MaterialTextarea,
  MaterialSelect,
  MaterialDateInput,
} from './ui/material-form-field';

// Form Constants - Extracted from magic numbers
const FORM_CONSTANTS = {
  AUTO_SAVE_INTERVAL_MS: 30000,
  AUTO_SAVE_DEBOUNCE_MS: 3000,
  CUSTOMER_SEARCH_DEBOUNCE_MS: 1000,
  DRAFT_EXPIRY_HOURS: 24,
  MAX_IMAGES_PER_ISSUE: 5,
  NOTIFICATION_DISPLAY_MS: 2000,
  NOTIFICATION_THROTTLE_MS: 60000, // Only show notification once per minute
  TOTAL_STEPS: 4,
} as const;

interface ReportFormProps {
  mode: 'create' | 'edit';
}

const ReportForm: React.FC<ReportFormProps> = ({ mode }) => {
  const { reportId } = useParams<{ reportId: string }>();
  const { currentUser } = useAuth();
  const { t, locale, formatCurrency } = useIntl();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Generate a temporary reportId for image uploads in create mode
  const tempReportId = reportId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const { createReport, updateReport, getReport } = useReports();
  const { notifyReportCreated, notifyReportUpdated, notifyReportCompleted } =
    useReportNotifications();
  const navigate = useNavigate();

  // Helper function to get local date string in CET timezone
  const getLocalDateString = useCallback((date: Date = new Date()) => {
    // Use Swedish timezone for consistent date handling
    const swedishDate = new Date(date.toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' }));
    const year = swedishDate.getFullYear();
    const month = String(swedishDate.getMonth() + 1).padStart(2, '0');
    const day = String(swedishDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Helper function to parse date string without timezone issues
  const parseLocalDate = useCallback((dateString: string | Date | undefined | null | any): Date => {
    // Handle different input types safely
    let dateStr: string;

    // Handle Firestore Timestamp objects
    if (dateString && typeof dateString === 'object') {
      if (dateString.toDate && typeof dateString.toDate === 'function') {
        // Firestore Timestamp
        const date = dateString.toDate();
        dateStr = date.toISOString().split('T')[0];
      } else if (dateString.seconds) {
        // Firestore Timestamp with seconds
        const date = new Date(dateString.seconds * 1000);
        dateStr = date.toISOString().split('T')[0];
      } else if (dateString._seconds) {
        // Alternative Firestore Timestamp format
        const date = new Date(dateString._seconds * 1000);
        dateStr = date.toISOString().split('T')[0];
      } else {
        // Try to convert any object to string first
        logger.warn('Unknown date object format:', dateString);
        dateStr = String(dateString);
      }
    } else if (typeof dateString === 'string') {
      dateStr = dateString;
    } else if (dateString instanceof Date) {
      dateStr = dateString.toISOString().split('T')[0];
    } else if (dateString) {
      dateStr = String(dateString);
    } else {
      // Default to today's date if no valid input
      return new Date();
    }

    // Validate the date string format
    if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) {
      logger.warn('Invalid date string provided to parseLocalDate:', dateString);
      return new Date();
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    // Create date in local timezone without time conversion
    const localDate = new Date(year, month - 1, day);
    return localDate;
  }, []);

  // Get appointment data from navigation state (when coming from appointment)
  const appointmentData = React.useMemo(() => {
    try {
      const state = location.state as {
        appointmentId?: string;
        customerName?: string;
        customerAddress?: string;
        customerPhone?: string;
        customerEmail?: string;
      } | null;

      if (state) {
        logger.log('🔍 ReportForm - Appointment data received:', {
          appointmentId: state.appointmentId,
          customerName: state.customerName,
          hasAddress: !!state.customerAddress,
        });
      }

      return state;
    } catch (error) {
      console.error('❌ ReportForm - Error reading navigation state:', error);
      return null;
    }
  }, [location.state]);

  // Get customer data from URL query parameters (when coming from customer management)
  const urlCustomerData = React.useMemo(() => {
    if (mode !== 'create') return null;

    const customerId = searchParams.get('customerId');
    const customerName = searchParams.get('customerName');
    const customerAddress = searchParams.get('customerAddress');

    if (customerId || customerName) {
      return {
        customerId: customerId || undefined,
        customerName: customerName ? decodeURIComponent(customerName) : undefined,
        customerAddress: customerAddress ? decodeURIComponent(customerAddress) : undefined,
      };
    }

    return null;
  }, [searchParams, mode]);

  // Load full customer data if customerId is provided
  useEffect(() => {
    if (mode === 'create' && urlCustomerData?.customerId && currentUser) {
      const loadCustomerData = async () => {
        setLoadingCustomerData(true);
        try {
          const { getCustomerById } = await import('../services/customerService');
          const customer = await getCustomerById(urlCustomerData.customerId!);

          // Verify customer belongs to user's branch or main branch
          if (
            customer &&
            (customer.branchId === currentUser.branchId ||
              currentUser.branchId === 'main' ||
              currentUser.role === 'superadmin')
          ) {
            setFormData(prev => ({
              ...prev,
              customerName: prev.customerName || customer.name || '',
              customerAddress: prev.customerAddress || customer.address || '',
              customerEmail: prev.customerEmail || customer.email || '',
              customerPhone: prev.customerPhone || customer.phone || '',
            }));
          }
        } catch (error) {
          console.error('Error loading customer data:', error);
          // Fall back to URL params if customer load fails
        } finally {
          setLoadingCustomerData(false);
        }
      };

      loadCustomerData();
    }
  }, [urlCustomerData?.customerId, mode, currentUser]);

  const [formData, setFormData] = useState<Partial<Report>>(() => {
    try {
      // Prioritize URL params (from customer management), then appointment data (from appointments)
      const customerName = urlCustomerData?.customerName || appointmentData?.customerName || '';
      const customerAddress =
        urlCustomerData?.customerAddress || appointmentData?.customerAddress || '';

      // Safely extract appointment data with fallbacks
      const safeAppointmentData = {
        customerName,
        customerAddress,
        customerPhone: appointmentData?.customerPhone || '',
        customerEmail: appointmentData?.customerEmail || '',
        appointmentId: appointmentData?.appointmentId || undefined,
      };

      return {
        ...safeAppointmentData,
        customerType: 'company' as 'individual' | 'company',
        buildingAddress: undefined,
        inspectionDate: getLocalDateString(),
        roofType: 'flat' as RoofType,
        roofAge: undefined,
        conditionNotes: '',
        inspectionChecklist: {},
        issuesFound: [],
        recommendedActions: [],
        status: 'draft' as ReportStatus,
        isShared: false,
        isOffer: true, // Default to offer
        offerValue: undefined,
        offerValidUntil: undefined,
        priorReportId: undefined,
        laborCost: undefined,
        materialCost: undefined,
        travelCost: undefined,
        overheadCost: undefined,
      };
    } catch (error) {
      console.error('❌ ReportForm - Error initializing form data:', error);
      // Return safe defaults
      return {
        customerName: '',
        customerAddress: '',
        customerPhone: '',
        customerEmail: '',
        customerType: 'company' as 'individual' | 'company',
        buildingAddress: undefined,
        appointmentId: undefined,
        inspectionDate: getLocalDateString(),
        roofType: 'flat' as RoofType,
        roofAge: undefined,
        conditionNotes: '',
        issuesFound: [],
        recommendedActions: [],
        status: 'draft' as ReportStatus,
        isShared: false,
        isOffer: true,
        offerValue: undefined,
        offerValidUntil: undefined,
        priorReportId: undefined,
      };
    }
  });

  // Store address coordinates separately (not part of Report type)
  const [addressCoordinates, setAddressCoordinates] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [pendingRoofSizeMeasure, setPendingRoofSizeMeasure] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  // Store map markers
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoSaving, setAutoSaving] = useState(false);
  const [loadingCustomerData, setLoadingCustomerData] = useState(false);
  // const [loadingPriorReports, setLoadingPriorReports] = useState(false); // Disabled - prior reports not currently used
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDraftDialog, setShowDeleteDraftDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showAutoCompleteDialog, setShowAutoCompleteDialog] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [foundReport, setFoundReport] = useState<Report | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [customerBuildings, setCustomerBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [customerIdForBuildings, setCustomerIdForBuildings] = useState<string | null>(null);
  const [isCreatingNewBuilding, setIsCreatingNewBuilding] = useState(false);
  const [creatingBuildingLoading, setCreatingBuildingLoading] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const totalSteps = FORM_CONSTANTS.TOTAL_STEPS;
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showRoofSizeMeasurer, setShowRoofSizeMeasurer] = useState(false);
  const [roofSnapshot, setRoofSnapshot] = useState<string | undefined>(undefined);
  const [roofPolygonPoints, setRoofPolygonPoints] = useState<any[] | undefined>(undefined);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);
  const lastNotificationTimeRef = useRef<number>(0);

  // Defect flow state for camera capture and description
  const [defectFlowStep, setDefectFlowStep] = useState<'idle' | 'camera' | 'describe'>('idle');
  const [draftDefect, setDraftDefect] = useState<{
    image?: string;
    title?: string;
    description?: string;
    severity?: IssueSeverity;
    type?: IssueType;
  } | null>(null);
  const [showRepeatOption, setShowRepeatOption] = useState(false);

  // Refs for focus management between steps
  const stepRefs = {
    1: useRef<HTMLInputElement>(null),
    2: useRef<HTMLInputElement>(null),
    3: useRef<HTMLDivElement>(null),
    4: useRef<HTMLDivElement>(null),
  };

  // Load prior reports for the selected customer (disabled - not currently used in UI)
  // useEffect(() => {
  //   const loadPriorReports = async () => {
  //     if (formData.customerName && currentUser && formData.customerName.length >= 3) {
  //       setLoadingPriorReports(true);
  //       try {
  //         const { getReports } = await import('../services/reportService');
  //         const reportsData = await getReports(currentUser);
  //         const customerPriorReports = reportsData.filter(
  //           report => report.customerName === formData.customerName && report.id !== reportId
  //         );
  //         // Prior reports loading disabled
  //       } catch (error) {
  //         console.error('Error loading prior reports:', error);
  //       } finally {
  //         setLoadingPriorReports(false);
  //       }
  //     }
  //   };

  //   // Debounce prior reports loading to avoid excessive API calls
  //   const timeoutId = setTimeout(() => {
  //     loadPriorReports();
  //   }, 500);

  //   return () => clearTimeout(timeoutId);
  // }, [formData.customerName, currentUser, reportId]);

  // Save current step to localStorage for persistence
  useEffect(() => {
    if (mode === 'create') {
      const stepKey = `reportFormStep_${currentUser?.uid || 'anonymous'}`;
      localStorage.setItem(stepKey, currentStep.toString());
    }
  }, [currentStep, mode, currentUser?.uid]);

  // Restore current step from localStorage on mount
  useEffect(() => {
    if (mode === 'create' && currentUser?.uid) {
      const stepKey = `reportFormStep_${currentUser.uid}`;
      const savedStep = localStorage.getItem(stepKey);
      if (savedStep) {
        // Validate step number to prevent invalid navigation
        const stepNum = validateStepNumber(savedStep, totalSteps);
        setCurrentStep(stepNum);
      }
    }
  }, [mode, currentUser?.uid, totalSteps]);

  // Log addressCoordinates changes for debugging
  useEffect(() => {
    console.log('[ReportForm] addressCoordinates updated:', addressCoordinates);
  }, [addressCoordinates]);

  // Consolidated Auto-save functionality
  useEffect(() => {
    // Don't auto-save if loading or if form is completely empty
    if (loading) {
      return;
    }

    // Save draft even with partial data - better than losing work
    const hasAnyData =
      formData.customerName ||
      formData.customerAddress ||
      formData.inspectionDate ||
      (formData.issuesFound && formData.issuesFound.length > 0) ||
      (formData.recommendedActions && formData.recommendedActions.length > 0);

    if (!hasAnyData) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setAutoSaving(true);

        if (mode === 'edit' && reportId && !reportId.startsWith('temp_')) {
          // Update existing report (skip temp reports)
          await updateReport(reportId, formData);
        } else if (mode === 'create') {
          // Save draft to localStorage for offline support
          // Save even with partial data to prevent work loss
          const draftKey = `report_draft_${currentUser?.uid || 'anonymous'}`;
          const draftData = {
            ...formData,
            lastSaved: new Date().toISOString(),
          };
          try {
            localStorage.setItem(draftKey, JSON.stringify(draftData));
            // Also save to legacy location for backward compatibility
            if (currentUser?.uid) {
              localStorage.setItem('reportDraft', JSON.stringify(draftData));
            }
          } catch (storageError) {
            // Handle quota exceeded or other storage errors
            logger.error('Failed to save draft to localStorage:', storageError);
          }

          // Show auto-save notification only once per minute to avoid spam
          const now = Date.now();
          const timeSinceLastNotification = now - lastNotificationTimeRef.current;
          if (timeSinceLastNotification >= FORM_CONSTANTS.NOTIFICATION_THROTTLE_MS) {
            setNotification({
              message: t('form.messages.draftSaved'),
              type: 'success',
            });
            setTimeout(() => setNotification(null), FORM_CONSTANTS.NOTIFICATION_DISPLAY_MS);
            lastNotificationTimeRef.current = now;
          }
        }
      } catch (error) {
        logger.error('Auto-save error:', error);
        // Show user-visible error for critical auto-save failures
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.includes('quota') || errorMessage.includes('permission')) {
          // Only show for critical errors that user should know about
          const now = Date.now();
          const timeSinceLastNotification = now - lastNotificationTimeRef.current;
          if (timeSinceLastNotification >= FORM_CONSTANTS.NOTIFICATION_THROTTLE_MS) {
            setNotification({
              message: t('form.messages.autoSaveFailed'),
              type: 'error',
            });
            setTimeout(() => setNotification(null), FORM_CONSTANTS.NOTIFICATION_DISPLAY_MS * 2);
            lastNotificationTimeRef.current = now;
          }
        }
      } finally {
        setAutoSaving(false);
      }
    }, FORM_CONSTANTS.AUTO_SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [formData, mode, reportId, currentUser, loading, t, updateReport]);

  // Auto-completion logic for existing customers (only in create mode)
  const checkForExistingCustomer = useCallback(
    async (customerName: string) => {
      if (!customerName || customerName.length < 3 || !currentUser || mode === 'edit') return;

      try {
        // Search for existing customers
        const { searchCustomers } = await import('../services/customerService');
        const existingCustomers = await searchCustomers(customerName, currentUser.branchId);

        if (existingCustomers.length > 0) {
          const customer = existingCustomers[0]; // Take the first match

          // Get the latest report for this customer
          const { getLatestReportForCustomer } = await import('../services/reportService');
          const latestReport = await getLatestReportForCustomer(
            customerName,
            customer.email,
            customer.phone,
            currentUser.branchId
          );

          if (latestReport) {
            setFoundCustomer(customer);
            setFoundReport(latestReport);
            setShowAutoCompleteDialog(true);
            // Load buildings for this customer
            setCustomerIdForBuildings(customer.id);
          }
        }
      } catch (error) {
        console.error('Error checking for existing customer:', error);
      }
    },
    [currentUser, mode]
  );

  // Check for existing customer when customer name changes (only in create mode)
  useEffect(() => {
    if (mode === 'create' && formData.customerName && formData.customerName.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkForExistingCustomer(formData.customerName!);
      }, FORM_CONSTANTS.CUSTOMER_SEARCH_DEBOUNCE_MS);

      return () => clearTimeout(timeoutId);
    }
  }, [mode, formData.customerName, checkForExistingCustomer]);

  // Load buildings when customerId is available (works in both create and edit modes)
  useEffect(() => {
    if (customerIdForBuildings && currentUser) {
      const loadBuildings = async () => {
        setLoadingBuildings(true);
        try {
          const { getBuildingsByCustomer } = await import('../services/buildingService');
          const buildings = await getBuildingsByCustomer(
            customerIdForBuildings,
            currentUser.branchId
          );
          setCustomerBuildings(buildings);

          // If there's only one building and no building is selected, auto-select it
          if (buildings.length === 1 && !selectedBuildingId) {
            const building = buildings[0];
            console.log('[ReportForm] Auto-selecting single building:', building.id);
            setSelectedBuildingId(building.id);
            setFormData(prev => ({
              ...prev,
              buildingAddress: building.address,
              buildingId: building.id,
              roofType: building.roofType || prev.roofType,
              roofSize: building.roofSize || prev.roofSize,
            }));

            // Geocode building address for map measurer with fallback logic
            if (building.address) {
              console.log('[ReportForm] Auto-geocoding building address:', building.address);
              try {
                // Try multiple versions of the address for better geocoding success
                const addressVariants = [
                  building.address, // Full address
                  building.address.split(',').slice(0, 2).join(',').trim(), // Just street and first location
                  building.address.split(',')[0].trim(), // Just the street
                ];

                let geocoded = false;
                for (const variant of addressVariants) {
                  if (geocoded) break;
                  
                  console.log('[ReportForm] Trying geocoding with variant:', variant);
                  const query = encodeURIComponent(variant);
                  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=1`;
                  
                  try {
                    const response = await fetch(url);
                    if (response.ok) {
                      const data = await response.json();
                      if (data && data.length > 0) {
                        const coords = {
                          lat: parseFloat(data[0].lat),
                          lon: parseFloat(data[0].lon),
                        };
                        console.log('[ReportForm] Auto-geocoding successful with variant:', variant);
                        console.log('[ReportForm] Setting coordinates:', coords);
                        setAddressCoordinates(coords);
                        geocoded = true;
                        break;
                      }
                    }
                  } catch (variantError) {
                    console.warn('[ReportForm] Variant geocoding failed:', variantError);
                  }
                }

                if (!geocoded) {
                  console.warn('[ReportForm] Auto-geocoding failed for all address variants');
                }
              } catch (error) {
                console.error('[ReportForm] Auto-geocoding error:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error loading buildings:', error);
        } finally {
          setLoadingBuildings(false);
        }
      };

      loadBuildings();
    }
  }, [customerIdForBuildings, currentUser, selectedBuildingId]);

  // Handle building selection - use building data as source of truth
  const handleBuildingSelect = useCallback(
    async (buildingId: string) => {
      console.log('[ReportForm] Building selected:', buildingId);
      const building = customerBuildings.find(b => b.id === buildingId);
      console.log('[ReportForm] Building found:', building);
      
      if (building) {
        setSelectedBuildingId(buildingId);
        setFormData(prev => ({
          ...prev,
          buildingAddress: building.address,
          buildingId: building.id,
          roofType: building.roofType || prev.roofType,
          roofSize: building.roofSize || prev.roofSize,
        }));
        console.log('[ReportForm] Form data updated with building address:', building.address);

        // Geocode building address to get coordinates for map measurer
        if (building.address) {
          console.log('[ReportForm] Starting geocoding for address:', building.address);
          try {
            // Try multiple versions of the address for better geocoding success
            const addressVariants = [
              building.address, // Full address
              building.address.split(',').slice(0, 2).join(',').trim(), // Just street and first location
              building.address.split(',')[0].trim(), // Just the street
            ];

            let geocoded = false;
            for (const variant of addressVariants) {
              if (geocoded) break;
              
              console.log('[ReportForm] Trying geocoding with variant:', variant);
              const query = encodeURIComponent(variant);
              const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=1`;
              
              try {
                const response = await fetch(url);
                console.log('[ReportForm] Geocoding response status:', response.status);
                
                if (response.ok) {
                  const data = await response.json();
                  console.log('[ReportForm] Geocoding response data:', data);
                  
                  if (data && data.length > 0) {
                    const coords = {
                      lat: parseFloat(data[0].lat),
                      lon: parseFloat(data[0].lon),
                    };
                    console.log('[ReportForm] Setting address coordinates:', coords);
                    setAddressCoordinates(coords);
                    geocoded = true;
                    break;
                  }
                }
              } catch (variantError) {
                console.warn('[ReportForm] Variant geocoding failed:', variantError);
              }
            }

            if (!geocoded) {
              console.warn('[ReportForm] Geocoding failed for all address variants');
            }
          } catch (error) {
            console.error('[ReportForm] Geocoding error:', error);
          }
        } else {
          console.warn('[ReportForm] Building address is empty');
        }
      } else {
        console.warn('[ReportForm] Building not found in customerBuildings:', buildingId);
      }
    },
    [customerBuildings]
  );

  // Handle creating a new building
  const handleCreateNewBuilding = useCallback(async () => {
    if (!formData.buildingAddress?.trim()) {
      setValidationErrors(prev => ({
        ...prev,
        buildingAddress:
          t('form.validation.buildingAddressRequired') || 'Building address is required',
      }));
      return;
    }

    if (!customerIdForBuildings) {
      setError(t('form.errors.customerNotSelected') || 'Please select a customer first');
      return;
    }

    setCreatingBuildingLoading(true);
    try {
      const { createBuilding } = await import('../services/buildingService');

      // Infer buildingType from customerType (companies = commercial, individuals = residential)
      const buildingType = formData.customerType === 'company' ? 'commercial' : 'residential';

      const newBuildingId = await createBuilding({
        customerId: customerIdForBuildings,
        branchId: currentUser?.branchId || '',
        address: formData.buildingAddress,
        buildingType: buildingType,
        roofType: formData.roofType as RoofType,
        roofSize: formData.roofSize,
        roofAge: formData.roofAge,
      });

      // Refresh buildings list
      const { getBuildingsByCustomer } = await import('../services/buildingService');
      const updatedBuildings = await getBuildingsByCustomer(customerIdForBuildings);
      setCustomerBuildings(updatedBuildings);

      // Select the newly created building
      setSelectedBuildingId(newBuildingId);
      setIsCreatingNewBuilding(false);
      setFormData(prev => ({
        ...prev,
        buildingId: newBuildingId,
      }));

      setNotification({
        message: t('form.messages.buildingCreatedSuccess') || 'Building created successfully!',
        type: 'success',
      });
    } catch (err) {
      console.error('Error creating building:', err);
      setError(
        t('form.errors.buildingCreationFailed') || 'Failed to create building. Please try again.'
      );
    } finally {
      setCreatingBuildingLoading(false);
    }
  }, [
    formData.buildingAddress,
    formData.roofType,
    formData.roofSize,
    formData.roofAge,
    customerIdForBuildings,
    currentUser?.branchId,
    t,
  ]);

  // Update form data when URL customer params are provided (for customer-to-report flow)
  useEffect(() => {
    if (mode === 'create' && urlCustomerData) {
      setFormData(prev => {
        // Only update if fields are empty to avoid overwriting user input
        if (!prev.customerName && urlCustomerData.customerName) {
          return {
            ...prev,
            customerName: urlCustomerData.customerName,
            customerAddress: urlCustomerData.customerAddress || prev.customerAddress || '',
          };
        }
        return prev;
      });
    }
  }, [urlCustomerData, mode]);

  // Focus management when step changes
  useEffect(() => {
    // Focus first field of current step
    setTimeout(() => {
      const ref = stepRefs[currentStep as keyof typeof stepRefs];
      if (ref?.current) {
        ref.current.focus();
      }
    }, 100);
  }, [currentStep]);

  // Keyboard shortcuts for power users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default if we're handling the shortcut
      if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd+S to save draft
        if (e.key === 's' && e.shiftKey === false) {
          e.preventDefault();
          // Trigger form submission programmatically
          const form = document.querySelector('form');
          if (form) {
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            (form as any).dispatchEvent(submitEvent);
          }
        }
      }

      // Escape to go back or close dialogs
      if (e.key === 'Escape') {
        if (showCancelDialog) {
          setShowCancelDialog(false);
        } else if (showDeleteDraftDialog) {
          setShowDeleteDraftDialog(false);
        } else if (showAutoCompleteDialog) {
          setShowAutoCompleteDialog(false);
        } else if (showTemplateSelector) {
          setShowTemplateSelector(false);
        } else if (currentStep > 1) {
          setCurrentStep(prev => prev - 1);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    currentStep,
    totalSteps,
    showCancelDialog,
    showDeleteDraftDialog,
    showAutoCompleteDialog,
    showTemplateSelector,
  ]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      setShowCancelDialog(false);
      setNotification(null);
    };
  }, []);

  // Track if report has been loaded to prevent infinite loops
  const reportLoadedRef = useRef<string | null>(null);
  const draftLoadedRef = useRef(false);

  // Load existing report for edit mode
  useEffect(() => {
    if (mode === 'edit' && reportId && reportLoadedRef.current !== reportId) {
      const loadReport = async () => {
        reportLoadedRef.current = reportId; // Mark as loading
        setLoading(true);
        try {
          const report = await getReport(reportId);
          if (report) {
            // Validate and sanitize data when loading report
            const validatedInspectionDate = validateDateString(report.inspectionDate);
            const validatedOfferValidUntil = validateDateString(report.offerValidUntil);

            // If report has a customerId, set it for building loading
            if (report.customerId) {
              setCustomerIdForBuildings(report.customerId);
            }

            // If report has a buildingId, set it as selected
            if (report.buildingId) {
              setSelectedBuildingId(report.buildingId);
            }

            setFormData({
              customerName: report.customerName || '',
              customerAddress: report.customerAddress || '',
              customerPhone: report.customerPhone || '',
              customerEmail: report.customerEmail || '',
              customerType: report.customerType || 'company',
              buildingAddress: report.buildingAddress,
              inspectionDate: validatedInspectionDate || getLocalDateString(),
              roofType: report.roofType || 'flat',
              roofAge: safeParseInt(report.roofAge, 0, 100),
              roofSize: report.roofSize,
              conditionNotes: report.conditionNotes || '',
              // Validate arrays are actually arrays
              issuesFound: Array.isArray(report.issuesFound)
                ? report.issuesFound.filter(
                    issue => issue && typeof issue === 'object' && typeof issue.id === 'string'
                  )
                : [],
              recommendedActions: Array.isArray(report.recommendedActions)
                ? report.recommendedActions.filter(
                    action => action && typeof action === 'object' && typeof action.id === 'string'
                  )
                : [],
              status: report.status || 'draft',
              isShared: typeof report.isShared === 'boolean' ? report.isShared : false,
              isOffer: typeof report.isOffer === 'boolean' ? report.isOffer : true,
              offerValue: safeParseNumber(report.offerValue, 0, 10000000),
              offerValidUntil: validatedOfferValidUntil || undefined,
              priorReportId:
                typeof report.priorReportId === 'string' ? report.priorReportId : undefined,
              // Load cost fields
              laborCost: typeof report.laborCost === 'number' ? report.laborCost : undefined,
              materialCost:
                typeof report.materialCost === 'number' ? report.materialCost : undefined,
              travelCost: typeof report.travelCost === 'number' ? report.travelCost : undefined,
              overheadCost:
                typeof report.overheadCost === 'number' ? report.overheadCost : undefined,
              // Load roof image and pins with validation
              roofImageUrl:
                typeof report.roofImageUrl === 'string' ? report.roofImageUrl : undefined,
              roofImagePins: validateRoofPins(report.roofImagePins || []).map(pin => ({
                ...pin,
                severity: (pin.severity || 'medium') as IssueSeverity,
              })) as RoofPinMarker[],
              // Store customerId and buildingId for tracking
              customerId: report.customerId,
              buildingId: report.buildingId,
            });
            // Load map markers if they exist
            if (report.roofMapMarkers) {
              setMapMarkers(report.roofMapMarkers);
            }

            // Geocode the address to get coordinates for the map
            if (report.customerAddress) {
              try {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(report.customerAddress)}&limit=1`
                );
                if (response.ok) {
                  const data = await response.json();
                  if (data && data.length > 0) {
                    // Validate coordinates before setting
                    const coords = validateCoordinates(data[0].lat, data[0].lon);
                    if (coords) {
                      setAddressCoordinates(coords);
                    }
                  }
                }
              } catch (error) {
                logger.warn('Could not geocode address for map:', error);
              }
            }
          } else {
            setError(t('form.messages.reportNotFound'));
          }
        } catch (error) {
          console.error('Error loading report:', error);
          setError(t('form.messages.failedToLoadReport'));
        } finally {
          setLoading(false);
        }
      };

      loadReport();
    }
  }, [mode, reportId, getReport, getLocalDateString, parseLocalDate, t]);

  // Load draft from localStorage on component mount (only once)
  // Load draft even if URL params are present - user might want to restore previous work
  useEffect(() => {
    // Only load draft once on initial mount, not on every render
    if (draftLoadedRef.current) return;

    // Load draft in create mode, or when editing a temp report
    if (mode === 'create' || (mode === 'edit' && reportId?.startsWith('temp_'))) {
      // Prefer currentUser uid, but also support anonymous drafts
      const userId = currentUser?.uid || 'anonymous';
      const draftKey = `report_draft_${userId}`;
      const savedDraft = localStorage.getItem(draftKey);

      // Also check legacy location for backward compatibility
      const legacyDraft = !savedDraft ? localStorage.getItem('reportDraft') : null;
      const draftToLoad = savedDraft || legacyDraft;

      if (draftToLoad) {
        try {
          const draftData = JSON.parse(draftToLoad);

          // Validate lastSaved timestamp
          const lastSavedStr = draftData.lastSaved || draftData.lastAutoSaved;
          if (!lastSavedStr) {
            // No timestamp, treat as invalid
            localStorage.removeItem(draftKey);
            localStorage.removeItem('reportDraft');
            return;
          }

          const lastSaved = new Date(lastSavedStr);
          if (isNaN(lastSaved.getTime())) {
            // Invalid date, clear draft
            localStorage.removeItem(draftKey);
            localStorage.removeItem('reportDraft');
            return;
          }

          const hoursSinceLastSave =
            (new Date().getTime() - lastSaved.getTime()) / (1000 * 60 * 60);

          // Only load draft if it's less than configured expiry time
          if (hoursSinceLastSave < FORM_CONSTANTS.DRAFT_EXPIRY_HOURS) {
            // Sanitize and validate draft data before loading
            const sanitized = sanitizeDraftData(draftData);

            // Only update formData if we have at least some valid data
            if (sanitized.customerName || sanitized.customerAddress) {
              setFormData(prev => {
                // Preserve issuesFound if current form has issues (user has added them)
                // Only use draft issues if current form is empty
                const currentIssuesCount = prev.issuesFound?.length || 0;
                const draftIssuesCount = sanitized.issuesFound?.length || 0;
                const shouldUseDraftIssues = currentIssuesCount === 0 && draftIssuesCount > 0;

                // Preserve recommendedActions if current form has actions (user has added them)
                // Only use draft actions if current form is empty
                const currentActionsCount = prev.recommendedActions?.length || 0;
                const draftActionsCount = sanitized.recommendedActions?.length || 0;
                const shouldUseDraftActions = currentActionsCount === 0 && draftActionsCount > 0;

                return {
                  ...prev,
                  ...sanitized,
                  // Only overwrite issues if draft has them and current form is empty
                  issuesFound: shouldUseDraftIssues
                    ? sanitized.issuesFound
                    : prev.issuesFound || [],
                  // Only overwrite actions if draft has them and current form is empty
                  recommendedActions: shouldUseDraftActions
                    ? sanitized.recommendedActions
                    : prev.recommendedActions || [],
                };
              });

              setNotification({
                message: t('form.messages.draftLoaded'),
                type: 'success',
              });
              draftLoadedRef.current = true; // Mark as loaded
            } else {
              // Draft has no valid data, clear it
              localStorage.removeItem(draftKey);
              localStorage.removeItem('reportDraft');
              draftLoadedRef.current = true; // Mark as processed even if invalid
            }
          } else {
            // Clear old draft from both locations
            localStorage.removeItem(draftKey);
            localStorage.removeItem('reportDraft');
            draftLoadedRef.current = true; // Mark as processed
          }
        } catch (error) {
          logger.error('Error loading draft:', error);
          // Clear corrupted draft silently
          try {
            localStorage.removeItem(draftKey);
            localStorage.removeItem('reportDraft');
          } catch {
            // Ignore errors clearing localStorage
          }
          draftLoadedRef.current = true; // Mark as processed even on error
        }
      } else {
        // No draft to load, mark as processed
        draftLoadedRef.current = true;
      }
    }
  }, [mode, currentUser, reportId, t]);

  // Clear draft when report is successfully created
  // Clears both modern and legacy draft locations
  const clearDraft = useCallback(() => {
    if (currentUser?.uid) {
      const draftKey = `report_draft_${currentUser.uid}`;
      localStorage.removeItem(draftKey);
      // Also clear legacy location for backward compatibility
      localStorage.removeItem('reportDraft');
    }
  }, [currentUser?.uid]);

  // Validate specific step
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      // Step 1: Customer Information - Only require essential fields
      if (!formData.customerName?.trim()) {
        errors.customerName = t('form.validation.customerNameRequired');
      }

      // For individual customers, address is required. For companies, building address is used instead.
      if (formData.customerType === 'individual' && !formData.customerAddress?.trim()) {
        errors.customerAddress = t('form.validation.customerAddressRequired');
      }

      if (!formData.inspectionDate || !formData.inspectionDate.trim()) {
        errors.inspectionDate = t('form.validation.inspectionDateRequired');
      } else {
        // Validate that the date is parseable and reasonable
        try {
          const inspectionDate = parseLocalDate(formData.inspectionDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const inspectionDateStart = new Date(inspectionDate);
          inspectionDateStart.setHours(0, 0, 0, 0);

          // Only validate if date is unreasonably far in the past (more than 1 year ago)
          // Future dates are allowed for scheduled inspections
          const oneYearAgo = new Date(today);
          oneYearAgo.setFullYear(today.getFullYear() - 1);

          if (inspectionDateStart < oneYearAgo) {
            errors.inspectionDate =
              t('form.validation.inspectionDateTooOld') ||
              'Inspektionsdatumet är för långt tillbaka i tiden';
          }
          // Note: We allow future dates for scheduled inspections, so no validation needed for that
        } catch (parseError) {
          // Date parsing failed
          errors.inspectionDate =
            t('form.validation.inspectionDateInvalid') || 'Ogiltigt inspektionsdatum';
        }
      }

      // Email validation - only if provided (improved robust pattern)
      if (formData.customerEmail && formData.customerEmail.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.customerEmail.trim())) {
          errors.customerEmail = t('form.validation.customerEmailInvalid');
        }
      }

      // Phone validation - only if provided
      if (
        formData.customerPhone &&
        formData.customerPhone.trim() &&
        !/^[+]?[0-9\s\-()]{8,}$/.test(formData.customerPhone)
      ) {
        errors.customerPhone = t('form.validation.phoneInvalid');
      }
    }

    if (step === 2) {
      // Step 2: Inspection Details - Require roof type (must be explicitly selected)
      // Check that roofType exists and is a valid non-empty value
      if (
        !formData.roofType ||
        (typeof formData.roofType === 'string' && formData.roofType.trim() === '')
      ) {
        errors.roofType = t('form.validation.roofTypeRequired');
      }

      // Roof age validation - only if provided and invalid
      if (formData.roofAge && (formData.roofAge < 0 || formData.roofAge > 100)) {
        errors.roofAge = t('form.validation.roofAgeRange');
      }
    }

    if (step === 3) {
      // Step 3: Issues - Make issues optional for better UX
      // Only validate if issues are provided
      if (formData.issuesFound && formData.issuesFound.length > 0) {
        // Validate each issue
        formData.issuesFound.forEach((issue, index) => {
          if (!issue.title?.trim()) {
            errors[`issue_${index}_title`] = t('form.validation.issueTitleRequired');
          }
          if (!issue.description?.trim()) {
            errors[`issue_${index}_description`] = t('form.validation.issueDescriptionRequired');
          }
          if (!issue.severity) {
            errors[`issue_${index}_severity`] = t('form.validation.issueSeverityRequired');
          }
        });
      }
    }

    if (step === 4) {
      // Step 4: Recommended Actions
      if (formData.offerValue && formData.offerValue < 0) {
        errors.offerValue = t('form.validation.offerValuePositive');
      }

      if (formData.offerValidUntil && formData.inspectionDate) {
        const offerDate = parseLocalDate(formData.offerValidUntil);
        const inspectionDate = parseLocalDate(formData.inspectionDate);
        if (offerDate <= inspectionDate) {
          errors.offerValidUntil = t('form.validation.offerValidUntilAfterInspection');
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.customerName?.trim()) {
      errors.customerName = t('form.validation.customerNameRequired');
    }

    if (!formData.customerAddress?.trim()) {
      errors.customerAddress = t('form.validation.customerAddressRequired');
    }

    if (!formData.inspectionDate) {
      errors.inspectionDate = t('form.validation.inspectionDateRequired');
    } else {
      const inspectionDate = parseLocalDate(formData.inspectionDate);
      const today = new Date();
      // Set today to start of day for fair comparison
      today.setHours(0, 0, 0, 0);

      // Set inspection date to start of day for fair comparison
      const inspectionDateStart = new Date(inspectionDate);
      inspectionDateStart.setHours(0, 0, 0, 0);

      // Allow future dates for scheduled inspections, only reject dates more than 1 year in the past
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      if (inspectionDateStart < oneYearAgo) {
        errors.inspectionDate = t('form.validation.inspectionDateTooOld');
      }
    }

    if (formData.customerEmail && formData.customerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.customerEmail.trim())) {
        errors.customerEmail = t('form.validation.customerEmailInvalid');
      }
    }

    if (
      formData.customerPhone &&
      formData.customerPhone.trim() &&
      !/^[+]?[0-9\s\-()]{8,}$/.test(formData.customerPhone)
    ) {
      errors.customerPhone = t('form.validation.phoneInvalid');
    }

    if (formData.roofAge && (formData.roofAge < 0 || formData.roofAge > 100)) {
      errors.roofAge = t('form.validation.roofAgeRange');
    }

    if (formData.offerValue && (formData.offerValue < 0 || formData.offerValue > 10000000)) {
      errors.offerValue = t('form.validation.offerValueRange');
    }

    if (formData.offerValidUntil && formData.inspectionDate) {
      const offerDate = parseLocalDate(formData.offerValidUntil);
      const inspectionDate = parseLocalDate(formData.inspectionDate);
      if (offerDate <= inspectionDate) {
        errors.offerValidUntil = t('form.validation.offerValidUntilAfterInspection');
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Clear validation errors when fields are corrected
  const clearFieldError = (fieldName: string) => {
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Trigger validation without submitting (for showing errors early)
  const triggerValidation = () => {
    validateForm();
  };

  const handleSubmit = async (e: React.FormEvent, status?: ReportStatus) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    if (!currentUser) {
      setError(t('form.errors.userNotAuthenticated'));
      return;
    }

    if (!currentUser.branchId && currentUser.role !== 'superadmin') {
      setError(t('form.errors.userNoBranch'));
      return;
    }

    if (!validateForm()) {
      setError(t('form.errors.fixValidation'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const reportData = {
        ...formData,
        estimatedCost: formData.offerValue || 0,
        status: status || formData.status || 'draft',
        roofMapMarkers: mapMarkers.length > 0 ? mapMarkers : undefined,
        appointmentId: appointmentData?.appointmentId || formData.appointmentId, // Link to appointment
      } as Omit<Report, 'id' | 'createdAt' | 'lastEdited'>;

      if (mode === 'create') {
        const newReportId = await createReport(reportData);

        // Construct created report object for notifications
        const createdReport: Report = {
          ...reportData,
          id: newReportId,
          createdAt: new Date().toISOString(),
          lastEdited: new Date().toISOString(),
        } as Report;

        // Send notifications (non-blocking)
        try {
          await notifyReportCreated(createdReport);
          await notifyBranchManagersOnReportCreation(
            createdReport.branchId,
            newReportId,
            createdReport.customerName || t('form.defaults.untitledReport'),
            'created'
          );
        } catch (notificationError) {
          console.error('❌ Error sending notifications (non-blocking):', notificationError);
          // Don't fail report creation if notifications fail
        }

        // If this report was created from an appointment, complete the appointment
        if (appointmentData?.appointmentId) {
          try {
            await appointmentService.completeAppointment(
              appointmentData.appointmentId,
              newReportId
            );
            logger.log('✅ Report linked to appointment successfully', {
              appointmentId: appointmentData.appointmentId,
              reportId: newReportId,
            });
          } catch (error) {
            console.error('❌ Failed to link report to appointment:', error);
            // Don't fail the report creation if appointment linking fails
          }
        }

        // Best-effort cleanup of any temporary uploads used during creation
        try {
          if (tempReportId && tempReportId.startsWith('temp_')) {
            const { ref, listAll, deleteObject } = await import('firebase/storage');
            const rootRef = ref(storage, `roof-images/${tempReportId}`);
            const listing = await listAll(rootRef);
            await Promise.all(listing.items.map(item => deleteObject(item).catch(() => {})));
          }
        } catch {}

        // Clear the saved draft after successful creation
        clearDraft();

        // Also clear step persistence
        if (currentUser?.uid) {
          const stepKey = `reportFormStep_${currentUser.uid}`;
          localStorage.removeItem(stepKey);
        }

        setNotification({
          message: t('form.messages.saved'),
          type: 'success',
        });

        // Increase timeout for slower networks and ensure navigation happens
        setTimeout(() => {
          navigate(`/report/view/${newReportId}`);
        }, 2000);
      } else if (mode === 'edit' && reportId) {
        await updateReport(reportId, reportData);

        // Get updated report for notifications
        try {
          const updatedReport = await getReport(reportId);
          if (updatedReport) {
            // Check if status changed to completed
            const isNowCompleted = (reportData.status || updatedReport.status) === 'completed';
            const wasCompleted = updatedReport.status === 'completed';

            if (isNowCompleted && !wasCompleted) {
              // Status changed to completed
              await notifyReportCompleted(updatedReport);
              await notifyBranchManagersOnReportCreation(
                updatedReport.branchId,
                reportId,
                updatedReport.customerName || t('form.defaults.untitledReport'),
                'completed'
              );

              // Update customer status and notify customer if report is public
              if (updatedReport.isPublic || updatedReport.isShared) {
                try {
                  const { updateScheduledVisit, getScheduledVisitsByCustomer } = await import(
                    '../services/scheduledVisitService'
                  );
                  const { getAppointment } = await import('../services/appointmentService');
                  const { collection, query, where, getDocs } = await import('firebase/firestore');
                  const { db } = await import('../config/firebase');

                  // Find scheduled visit linked to this report's appointment
                  if (updatedReport.appointmentId) {
                    const appointment = await getAppointment(updatedReport.appointmentId);
                    if (appointment?.scheduledVisitId) {
                      await updateScheduledVisit(appointment.scheduledVisitId, {
                        status: 'completed',
                        reportId: reportId,
                        completedAt: new Date().toISOString(),
                      });

                      // Notify customer
                      if (appointment.customerId || appointment.customerEmail) {
                        const { collection: mailCollection, addDoc } = await import(
                          'firebase/firestore'
                        );
                        const { serverTimestamp } = await import('firebase/firestore');
                        const { enqueueEmail } = await import('../services/emailCenter');
                        const reportLink = `${window.location.origin}/report/view/${reportId}`;

                        if (appointment.customerEmail) {
                          await enqueueEmail(
                            {
                              to: appointment.customerEmail,
                              template: {
                                name: 'report-completed',
                                data: {
                                  customerName: appointment.customerName,
                                  reportLink: reportLink,
                                  appointmentDate: appointment.scheduledDate,
                                },
                              },
                            },
                            {
                              reportId: reportId,
                              customerName: appointment.customerName,
                              sentBy: updatedReport.createdBy,
                            }
                          );
                        }

                        if (appointment.customerId) {
                          const notificationsRef = mailCollection(db, 'notifications');
                          await addDoc(notificationsRef, {
                            userId: appointment.customerId,
                            type: 'report_completed',
                            title: 'Inspection Report Completed',
                            message: `Your roof inspection report is now available. View it here.`,
                            link: `/portal/scheduled-visits`,
                            read: false,
                            metadata: {
                              reportId: reportId,
                              appointmentId: updatedReport.appointmentId,
                              scheduledVisitId: appointment.scheduledVisitId,
                              category: 'report',
                              priority: 'medium',
                            },
                            createdAt: serverTimestamp(),
                          });
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.error('Error updating customer status on report completion:', error);
                  // Don't fail report completion if customer notification fails
                }
              }
            } else {
              // Regular update
              await notifyReportUpdated(updatedReport);
              await notifyBranchManagersOnReportCreation(
                updatedReport.branchId,
                reportId,
                updatedReport.customerName || t('form.defaults.untitledReport'),
                'updated'
              );
            }
          }
        } catch (notificationError) {
          console.error('❌ Error sending update notifications (non-blocking):', notificationError);
          // Don't fail report update if notifications fail
        }

        setNotification({
          message: t('form.messages.saved'),
          type: 'success',
        });

        // Increase timeout for slower networks
        setTimeout(() => {
          navigate(`/report/view/${reportId}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving report:', error);

      // Provide more specific error messages
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check if there are validation errors first
      const hasValidationErrors = Object.keys(validationErrors).length > 0;
      if (hasValidationErrors) {
        // Show specific field errors instead of generic message
        const firstError = Object.values(validationErrors)[0];
        setError(firstError || t('form.validation.stepValidationFailed'));
      } else if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
        setError(t('form.validation.permissionDeniedDetailed'));
      } else if (
        errorMessage.includes('network') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('Failed to fetch')
      ) {
        setError(t('form.validation.networkErrorDetailed'));
      } else if (errorMessage.includes('quota') || errorMessage.includes('Quota')) {
        setError(t('form.validation.quotaExceeded'));
      } else if (errorMessage.includes('validation') || errorMessage.includes('required')) {
        // If error mentions validation/required, show step validation message
        setError(t('form.validation.stepValidationFailed'));
      } else {
        // Generic error with more context
        const genericMessage =
          errorMessage && errorMessage.length > 0
            ? `${t('form.validation.validationErrorDetailed')} (${errorMessage.slice(0, 50)})`
            : t('form.validation.validationErrorDetailed');
        setError(genericMessage);
      }

      // Clear error after 5 seconds to prevent stale errors
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const addIssue = useCallback(() => {
    const newIssue: Issue = {
      id: `issue_${Date.now()}`,
      title: '',
      type: 'other',
      severity: 'medium',
      description: '',
      location: '',
    };

    setFormData(prev => {
      const updatedIssues = [...(prev.issuesFound || []), newIssue];
      logger.log('🔍 ReportForm - Adding issue:', {
        newIssueId: newIssue.id,
        currentIssuesCount: prev.issuesFound?.length || 0,
        updatedIssuesCount: updatedIssues.length,
      });
      return {
        ...prev,
        issuesFound: updatedIssues,
      };
    });
  }, []);

  const handleTemplateSelect = (template: IssueTemplate) => {
    const newIssue: Issue = {
      id: `issue_${Date.now()}`,
      title: template.title || '',
      type: template.type,
      severity: template.severity,
      description: template.description,
      location: template.location,
    };
    setFormData(prev => {
      const updatedIssues = [...(prev.issuesFound || []), newIssue];
      return {
        ...prev,
        issuesFound: updatedIssues,
      };
    });
  };

  const updateIssue = (index: number, updates: Partial<Issue>) => {
    setFormData(prev => ({
      ...prev,
      issuesFound:
        prev.issuesFound?.map((issue, i) => (i === index ? { ...issue, ...updates } : issue)) || [],
    }));
  };

  const removeIssue = (index: number) => {
    const issueToRemove = formData.issuesFound?.[index];
    const newIssues = (formData.issuesFound || []).filter((_, i) => i !== index);

    // Remove linked markers when issue is deleted
    if (issueToRemove?.id) {
      // Remove roof image pins linked to this issue
      const updatedRoofImagePins = (formData.roofImagePins || []).filter(
        pin => pin.issueId !== issueToRemove.id
      );

      // Remove map markers linked to this issue
      const updatedMapMarkers = mapMarkers.filter(marker => marker.issueId !== issueToRemove.id);

      setFormData(prev => ({
        ...prev,
        issuesFound: newIssues,
        roofImagePins: updatedRoofImagePins,
      }));
      setMapMarkers(updatedMapMarkers);
    } else {
      setFormData(prev => ({ ...prev, issuesFound: newIssues }));
    }

    clearFieldError(`issue_${index}_title`);
    clearFieldError(`issue_${index}_description`);
    clearFieldError(`issue_${index}_severity`);
  };

  const addRecommendedAction = () => {
    const newAction: RecommendedAction = {
      id: `action_${Date.now()}`,
      priority: 'medium',
      description: '',
      urgency: 'short_term',
    };

    setFormData(prev => ({
      ...prev,
      recommendedActions: [...(prev.recommendedActions || []), newAction],
    }));
  };

  const updateRecommendedAction = (index: number, updates: Partial<RecommendedAction>) => {
    setFormData(prev => ({
      ...prev,
      recommendedActions:
        prev.recommendedActions?.map((action, i) =>
          i === index ? { ...action, ...updates } : action
        ) || [],
    }));
  };

  const removeRecommendedAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recommendedActions: prev.recommendedActions?.filter((_, i) => i !== index) || [],
    }));
  };

  const saveDraftDefect = async (defectData: {
    title: string;
    description: string;
    type: IssueType;
    severity: IssueSeverity;
  }) => {
    try {
      // Upload image first if it exists
      let imageUrl: string | undefined;
      if (draftDefect?.image) {
        try {
          const response = await fetch(draftDefect.image);
          const blob = await response.blob();
          const fileName = `defect_${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`;
          const storageRef = ref(storage, `reports/${tempReportId}/issues/${fileName}`);
          await uploadBytes(storageRef, blob);
          imageUrl = await getDownloadURL(storageRef);
        } catch (error) {
          console.error('Error uploading image:', error);
          // Continue without image URL
        }
      }

      // Create issue from draft
      const existingIssuesCount = formData.issuesFound?.length || 0;
      const issueTitle =
        defectData.title ||
        `${t('reports.public.problem') || 'Problem'} ${existingIssuesCount + 1}`;
      const newIssue: Issue = {
        id: `issue_${Date.now()}`,
        title: issueTitle,
        type: defectData.type,
        severity: defectData.severity,
        description: defectData.description || '',
        location: '',
        images: imageUrl ? [imageUrl] : [],
      };
      setFormData(prev => ({
        ...prev,
        issuesFound: [...(prev.issuesFound || []), newIssue],
      }));

      setDefectFlowStep('idle');
      setDraftDefect(null);
      setShowRepeatOption(true);
    } catch (error) {
      console.error('Error saving defect:', error);
      setNotification({
        message: t('form.messages.errorSavingDefect') || 'Error saving defect',
        type: 'error',
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleCancel = () => {
    try {
      // Check if there are any changes
      const hasChanges =
        formData.customerName ||
        formData.customerAddress ||
        (formData.issuesFound && formData.issuesFound.length > 0) ||
        (formData.recommendedActions && formData.recommendedActions.length > 0);

      if (hasChanges) {
        setShowCancelDialog(true);
      } else {
        // No changes, navigate directly
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error in handleCancel:', error);
      // Fallback navigation with error boundary
      try {
        navigate('/dashboard');
      } catch (navError) {
        console.error('Navigation error:', navError);
        // Last resort - reload the page
        window.location.href = '/dashboard';
      }
    }
  };

  const confirmCancel = () => {
    try {
      setShowCancelDialog(false);
      // Best-effort cleanup of temporary uploads when abandoning a draft
      (async () => {
        try {
          if (tempReportId && tempReportId.startsWith('temp_')) {
            const { ref, listAll, deleteObject } = await import('firebase/storage');
            const rootRef = ref(storage, `roof-images/${tempReportId}`);
            const listing = await listAll(rootRef);
            await Promise.all(listing.items.map(item => deleteObject(item).catch(() => {})));
          }
        } catch {}
      })();
      // Use setTimeout to ensure state updates are complete before navigation
      setTimeout(() => {
        navigate('/dashboard');
      }, 0);
    } catch (error) {
      console.error('Error in confirmCancel:', error);
      // Fallback navigation
      navigate('/dashboard');
    }
  };

  const handleDeleteDraft = () => {
    setShowDeleteDraftDialog(true);
  };

  const resetFormToInitial = () => {
    // Guard against autosave racing with reset: briefly disable autosave via a flag
    setAutoSaving(true);

    // Remove both legacy and per-user draft keys
    try {
      localStorage.removeItem('reportDraft');
      if (currentUser?.uid) {
        localStorage.removeItem(`report_draft_${currentUser.uid}`);
      }
    } catch {}
    setFormData({
      customerName: '',
      customerAddress: '',
      customerPhone: '',
      customerEmail: '',
      inspectionDate: getLocalDateString(),
      roofType: 'tile' as RoofType,
      roofAge: undefined,
      conditionNotes: '',
      issuesFound: [],
      recommendedActions: [],
      status: 'draft' as ReportStatus,
      isShared: false,
      offerValue: undefined,
      offerValidUntil: undefined,
      priorReportId: undefined,
    });
    setValidationErrors({});
    setFormResetKey(prev => prev + 1);

    // Re-enable autosave and let it save the clean state
    setTimeout(() => setAutoSaving(false), 0);
  };

  const confirmDeleteDraft = () => {
    try {
      resetFormToInitial();

      // Close dialog
      setShowDeleteDraftDialog(false);

      // Show success message
      setNotification({
        message: t('form.messages.draftDeleted'),
        type: 'success',
      });

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error deleting draft:', error);
      setNotification({
        message: t('form.messages.failedToDeleteDraft'),
        type: 'error',
      });
    }
  };

  // Handle auto-completion
  const handleAutoCompleteImport = () => {
    if (foundCustomer && foundReport) {
      setFormData(prev => ({
        ...prev,
        customerName: foundCustomer.name,
        customerAddress: foundCustomer.address,
        customerPhone: foundCustomer.phone || '',
        customerEmail: foundCustomer.email || '',
        // Link to the latest report
        linkedReportId: foundReport.id,
      }));

      setNotification({
        message: t('form.messages.customerImported', {
          date: foundReport.createdAt
            ? new Date(foundReport.createdAt).toLocaleDateString()
            : t('form.labels.unknownDate'),
        }),
        type: 'success',
      });
    }

    setShowAutoCompleteDialog(false);
    setFoundCustomer(null);
    setFoundReport(null);
  };

  const handleAutoCompleteSkip = () => {
    resetFormToInitial();
    setShowAutoCompleteDialog(false);
    setFoundCustomer(null);
    setFoundReport(null);
  };

  if (loading && mode === 'edit') {
    return (
      <div className='max-w-4xl mx-auto font-material'>
        <div className='bg-white rounded-xl shadow-sm p-8 border border-slate-200 mb-6'>
          <div className='animate-pulse'>
            <div className='h-8 bg-slate-200 rounded w-1/3 mb-4'></div>
            <div className='h-4 bg-slate-200 rounded w-1/4'></div>
          </div>
        </div>
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200'>
          <div className='space-y-6'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='space-y-2'>
                <div className='h-4 bg-slate-200 rounded w-1/4'></div>
                <div className='h-10 bg-slate-200 rounded'></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <FormErrorBoundary>
      <div className='max-w-4xl mx-auto bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen py-8 px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden'>
          <div className='flex items-center justify-between flex-wrap gap-4'>
            <div>
              <h1 className='text-2xl font-bold text-slate-900'>
                {mode === 'create'
                  ? formData.isOffer
                    ? t('form.title.createOffer')
                    : t('form.title.create')
                  : formData.isOffer
                    ? t('form.title.editOffer')
                    : t('form.title.edit')}
              </h1>
              <div className='mt-1 flex items-center space-x-2'>
                {autoSaving && <p className='text-sm text-slate-700'>{t('form.autoSaving')}</p>}
                {loadingCustomerData && (
                  <p className='text-sm text-slate-500'>{t('form.loadingCustomerData')}</p>
                )}
                {/* Prior reports loading disabled */}
              </div>
            </div>
          </div>

          {/* ARIA Live Region for Screen Readers */}
          <div aria-live='polite' aria-atomic='true' className='sr-only'>
            {t('form.steps.currentStep', { step: currentStep, total: totalSteps })}
          </div>

          {/* Progress Indicator - Mobile Optimized */}
          <div className='mt-6'>
            <div className='flex flex-col space-y-3'>
              <div className='flex items-center justify-center space-x-1 sm:space-x-2'>
                {[1, 2, 3, 4].map(step => (
                  <div key={step} className='flex items-center'>
                    <div
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                        step <= currentStep
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {step}
                    </div>
                    {step < 4 && (
                      <div
                        className={`w-4 sm:w-8 h-0.5 mx-1 sm:mx-2 ${
                          step < currentStep ? 'bg-slate-700' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className='text-xs sm:text-sm text-slate-500 text-center'>
                {t('form.steps.stepOf', { current: currentStep, total: totalSteps })}
                {currentStep === totalSteps && ` - ${t('form.steps.finalReview')}`}
              </div>
            </div>
            <div className='mt-2 text-sm text-slate-600'>
              {currentStep === 1 && t('form.sections.customerInfo')}
              {currentStep === 2 && t('form.sections.inspectionDetails')}
              {currentStep === 3 && t('form.sections.issues')}
              {currentStep === 4 && t('form.sections.recommendedActions')}
            </div>
            {/* Step-specific help text */}
            <div className='mt-2 text-xs text-slate-500 bg-blue-50 p-2 rounded-md border border-blue-100'>
              <span className='font-medium text-blue-700'>💡 </span>
              {currentStep === 1 && t('form.help.step1')}
              {currentStep === 2 && t('form.help.step2')}
              {currentStep === 3 && t('form.help.step3')}
              {currentStep === 4 && t('form.help.step4')}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className='mb-6 bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex'>
              <AlertTriangle className='w-5 h-5 text-red-400 flex-shrink-0' />
              <div className='ml-3'>
                <h3 className='text-sm font-medium text-red-800'>{error}</h3>
                {/* Add contextual guidance based on error type */}
                {error.includes(
                  t('form.validation.permissionDeniedDetailed')?.substring(0, 20) || 'permission'
                ) && (
                  <p className='text-xs text-red-600 mt-1'>
                    {t('form.errors.sessionExpired') ||
                      'Try logging out and back in, or contact your administrator.'}
                  </p>
                )}
                {error.includes(
                  t('form.validation.networkErrorDetailed')?.substring(0, 20) || 'network'
                ) && (
                  <p className='text-xs text-red-600 mt-1'>
                    {t('form.errors.connectionLost') ||
                      'Check your internet connection and try again.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors Summary */}
        {Object.keys(validationErrors).length > 0 && (
          <div className='mb-6 bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex'>
              <AlertTriangle className='w-5 h-5 text-red-400 flex-shrink-0' />
              <div className='ml-3 flex-1'>
                <h3 className='text-sm font-medium text-red-800'>
                  {t('form.validation.summaryTitle')}
                </h3>
                <p className='text-sm text-red-700 mt-1'>
                  {t('form.validation.summaryGuidance') || t('form.validation.summaryDescription')}
                </p>
                <ul className='mt-3 text-sm text-red-700 space-y-2'>
                  {Object.entries(validationErrors).map(([field, message]) => {
                    // Get field-specific guidance
                    const guidanceKey = `form.validation.${field}Guidance`;
                    const guidance = t(guidanceKey);
                    const hasGuidance = guidance && guidance !== guidanceKey;

                    return (
                      <li key={field} className='flex items-start'>
                        <span className='text-red-500 mr-2 mt-0.5'>•</span>
                        <div>
                          <span className='font-medium'>{message}</span>
                          {hasGuidance && (
                            <p className='text-xs text-red-600 mt-0.5 italic'>{guidance}</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-8'>
          {/* Step 1: Customer Information */}
          {currentStep === 1 && (
            <div className='bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-hidden'>
              <h2 className='text-lg sm:text-xl font-semibold text-slate-900 mb-6 flex items-center truncate-smart'>
                <User className='w-6 h-6 mr-3 text-slate-600 flex-shrink-0' />
                <span className='truncate'>{t('form.sections.customerInfo')}</span>
              </h2>

              {/* Customer Search Section - for finding existing customers */}
              {/* Show in create mode, or in edit mode when report has no customerId */}
              {(mode === 'create' || (mode === 'edit' && !formData.customerId)) &&
                !customerIdForBuildings && (
                  <div className='mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200'>
                    <label className='block text-sm font-medium text-slate-700 mb-2'>
                      {mode === 'edit'
                        ? t('form.customerSearch.attachCustomer') || 'Tilknyt eksisterende kunde'
                        : t('form.customerSearch.title') || 'Søg efter eksisterende kunde'}
                    </label>
                    {mode === 'edit' && (
                      <p className='text-xs text-amber-600 mb-2 flex items-center gap-1'>
                        <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                          <path
                            fillRule='evenodd'
                            d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                            clipRule='evenodd'
                          />
                        </svg>
                        {t('form.customerSearch.noCustomerAttached') ||
                          'Denne rapport har ingen kunde tilknyttet'}
                      </p>
                    )}
                    <CustomerSearchInline
                      onCustomerSelect={customer => {
                        // Set customer data including customerId
                        setFormData(prev => ({
                          ...prev,
                          customerName: customer.name,
                          customerAddress: customer.address,
                          customerPhone: customer.phone || '',
                          customerEmail: customer.email || '',
                          customerType: customer.customerType || 'company',
                          customerId: customer.id,
                        }));
                        // Set customer ID to load buildings
                        setCustomerIdForBuildings(customer.id);
                        // Clear any existing building selection (new customer = new building options)
                        setSelectedBuildingId(null);
                        setCustomerBuildings([]);
                        // Show notification
                        setNotification({
                          message:
                            mode === 'edit'
                              ? t('form.customerSearch.customerAttached') ||
                                'Kunde tilknyttet rapporten'
                              : t('form.customerSearch.customerSelected') || 'Kunde valgt',
                          type: 'success',
                        });
                        setTimeout(() => setNotification(null), 2000);
                      }}
                      placeholder={
                        t('form.customerSearch.placeholder') ||
                        'Søg kunde (navn, email, telefon...)'
                      }
                    />
                    <p className='text-xs text-slate-500 mt-2'>
                      {t('form.customerSearch.hint') ||
                        'Vælg en eksisterende kunde, eller udfyld felterne nedenfor for at oprette ny'}
                    </p>
                  </div>
                )}

              {/* Selected Customer Info Banner */}
              {customerIdForBuildings && (
                <div className='mb-6 p-4 bg-green-50 rounded-lg border border-green-200'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center'>
                      <CheckCircle className='w-5 h-5 text-green-600 mr-2' />
                      <span className='text-sm font-medium text-green-800'>
                        {t('form.customerSearch.existingCustomer') || 'Eksisterende kunde valgt'}:{' '}
                        {formData.customerName}
                      </span>
                    </div>
                    <button
                      type='button'
                      onClick={() => {
                        setCustomerIdForBuildings(null);
                        setCustomerBuildings([]);
                        setSelectedBuildingId(null);
                        resetFormToInitial();
                      }}
                      className='text-sm text-green-700 hover:text-green-900 underline'
                    >
                      {t('form.customerSearch.clearSelection') || 'Ryd valg'}
                    </button>
                  </div>
                </div>
              )}

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                <MaterialFormField
                  label={t('form.fields.customerName')}
                  error={validationErrors.customerName}
                  touched={!!validationErrors.customerName}
                  required
                >
                  <MaterialInput
                    ref={stepRefs[1]}
                    type='text'
                    id='customerName'
                    required
                    value={formData.customerName || ''}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, customerName: e.target.value }));
                      clearFieldError('customerName');
                    }}
                    placeholder={t('form.fields.customerNamePlaceholder')}
                    autoComplete='name'
                    minLength={2}
                    maxLength={100}
                    title={t('form.validation.fillThisField')}
                    onInvalid={e => {
                      e.preventDefault();
                      (e.target as HTMLInputElement).setCustomValidity(
                        t('form.validation.customerNameRequired')
                      );
                    }}
                    onInput={e => {
                      (e.target as HTMLInputElement).setCustomValidity('');
                    }}
                    enterKeyHint='next'
                  />
                </MaterialFormField>

                <MaterialFormField
                  label={t('form.fields.customerType') || 'Kundetype'}
                  error={validationErrors.customerType}
                  touched={!!validationErrors.customerType}
                >
                  <MaterialSelect
                    id='customerType'
                    value={formData.customerType || 'company'}
                    onChange={e => {
                      setFormData(prev => ({
                        ...prev,
                        customerType: e.target.value as 'individual' | 'company',
                        buildingAddress:
                          e.target.value === 'company' ? prev.buildingAddress : undefined,
                      }));
                      clearFieldError('customerType');
                    }}
                    options={[
                      {
                        value: 'individual',
                        label: t('form.fields.customerTypeIndividual') || 'Privatperson',
                      },
                      { value: 'company', label: t('form.fields.customerTypeCompany') || 'Firma' },
                    ]}
                  />
                </MaterialFormField>

                <MaterialFormField
                  label={t('form.fields.customerPhoneLabel')}
                  error={validationErrors.customerPhone}
                  touched={!!validationErrors.customerPhone}
                >
                  <div className='relative z-10'>
                    <PhoneInput
                      className='w-full'
                      defaultCountry={getPhoneCountryCode(locale as any)}
                      preferredCountries={['se', 'no', 'dk', 'de', 'fi', 'gb', 'us']}
                      value={formData.customerPhone || ''}
                      onChange={value => {
                        setFormData(prev => ({ ...prev, customerPhone: value }));
                        clearFieldError('customerPhone');
                      }}
                      inputClassName={`w-full h-10 leading-10 py-0 rounded-lg border focus:ring-2 focus:ring-slate-600 focus:border-slate-600 ${
                        validationErrors.customerPhone ? 'border-red-500' : 'border-slate-300'
                      }`}
                      countrySelectorStyleProps={{
                        buttonClassName:
                          'h-10 rounded-l-md border border-slate-300 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-slate-600 focus:border-slate-600',
                        dropdownClassName: 'z-50',
                        dropdownArrowClassName: 'text-slate-600',
                      }}
                      placeholder={`+${getPhoneCountryCode(locale as any).toUpperCase()} 70 123 45 67`}
                    />
                  </div>
                </MaterialFormField>

                <div className='md:col-span-2'>
                  {/* Only show customer address field for individual customers. Companies use building address instead. */}
                  {formData.customerType === 'individual' && (
                    <AddressInput
                      ref={addressInputRef}
                      value={formData.customerAddress || ''}
                      onChange={(address, coordinates) => {
                        console.log('[ReportForm] AddressInput onChange triggered');
                        console.log('[ReportForm] Address:', address);
                        console.log('[ReportForm] Coordinates from AddressInput:', coordinates);
                        setFormData(prev => ({ ...prev, customerAddress: address }));
                        if (coordinates) {
                          console.log('[ReportForm] Setting addressCoordinates:', coordinates);
                          setAddressCoordinates(coordinates);
                          // If user was waiting to measure, open measurer now
                          if (pendingRoofSizeMeasure) {
                            setPendingRoofSizeMeasure(false);
                            setTimeout(() => setShowRoofSizeMeasurer(true), 100);
                          }
                        } else {
                          console.warn('[ReportForm] No coordinates received from AddressInput');
                        }
                        clearFieldError('customerAddress');
                      }}
                      placeholder={t('form.fields.customerAddressPlaceholder')}
                      error={validationErrors.customerAddress}
                      required
                    />
                  )}
                </div>

                {/* Building Selection Section - Gallery View */}
                {customerIdForBuildings && (
                  <div className='md:col-span-2 space-y-4'>
                    <h3 className='text-sm font-semibold text-slate-900'>
                      {t('form.fields.selectExistingBuilding') || 'Select Building'}
                    </h3>

                    {loadingBuildings ? (
                      <div className='flex items-center justify-center py-8'>
                        <div className='w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin' />
                        <span className='ml-2 text-sm text-slate-500'>
                          {t('form.messages.loadingBuildings')}
                        </span>
                      </div>
                    ) : (
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                        {/* Building Cards */}
                        {customerBuildings.map(building => (
                          <button
                            key={building.id}
                            type='button'
                            onClick={() => {
                              handleBuildingSelect(building.id);
                              setIsCreatingNewBuilding(false);
                              clearFieldError('buildingId');
                            }}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${
                              selectedBuildingId === building.id && !isCreatingNewBuilding
                                ? 'border-green-500 bg-green-50 shadow-lg'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                            }`}
                          >
                            <div className='flex justify-between items-start'>
                              <div className='flex-1 min-w-0'>
                                <p className='text-sm font-medium text-slate-900 truncate'>
                                  {building.address}
                                </p>
                                <div className='mt-2 flex flex-wrap gap-2'>
                                  {building.roofType && (
                                    <span className='inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded'>
                                      {building.roofType}
                                    </span>
                                  )}
                                  {building.roofSize && (
                                    <span className='inline-block px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded'>
                                      {building.roofSize} m²
                                    </span>
                                  )}
                                </div>
                              </div>
                              {selectedBuildingId === building.id && !isCreatingNewBuilding && (
                                <div className='ml-2 flex-shrink-0'>
                                  <div className='flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white'>
                                    <svg
                                      className='w-3 h-3'
                                      fill='currentColor'
                                      viewBox='0 0 20 20'
                                    >
                                      <path
                                        fillRule='evenodd'
                                        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                        clipRule='evenodd'
                                      />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}

                        {/* Add New Building Card */}
                        <button
                          type='button'
                          onClick={() => {
                            setIsCreatingNewBuilding(true);
                            setSelectedBuildingId(null);
                          }}
                          className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center min-h-[120px] ${
                            isCreatingNewBuilding
                              ? 'border-blue-500 bg-blue-50 shadow-lg'
                              : 'border-dashed border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          <Plus
                            className={`w-6 h-6 mb-2 ${isCreatingNewBuilding ? 'text-blue-600' : 'text-slate-500'}`}
                          />
                          <span
                            className={`text-sm font-medium ${isCreatingNewBuilding ? 'text-blue-700' : 'text-slate-700'}`}
                          >
                            {t('form.fields.createNewBuildingSection') || 'Add New Building'}
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Create New Building Form - Shows when user clicks Add New Building card */}
                    {isCreatingNewBuilding && (
                      <div className='mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3'>
                        <div>
                          <label className='block text-sm font-medium text-slate-700 mb-2'>
                            {t('form.fields.buildingAddress')} *
                          </label>
                          <AddressInput
                            value={formData.buildingAddress || ''}
                            onChange={(address, coordinates) => {
                              setFormData(prev => ({ ...prev, buildingAddress: address }));
                              clearFieldError('buildingAddress');
                            }}
                            placeholder={
                              t('form.fields.buildingAddressPlaceholder') ||
                              'Enter building address'
                            }
                            error={validationErrors.buildingAddress}
                          />
                        </div>

                        <button
                          type='button'
                          onClick={handleCreateNewBuilding}
                          disabled={creatingBuildingLoading || !formData.buildingAddress?.trim()}
                          className='w-full px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
                        >
                          {creatingBuildingLoading ? (
                            <>
                              <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                              {t('form.messages.creatingBuilding') || 'Creating...'}
                            </>
                          ) : (
                            <>
                              <Plus className='w-4 h-4' />
                              {t('buildings.createBuilding') || 'Create Building'}
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {customerBuildings.length === 0 && !loadingBuildings && (
                      <div className='text-sm text-amber-700 bg-amber-50 p-3 rounded-lg'>
                        {t('form.messages.noBuildingsFound') ||
                          'No buildings found for this customer. Create one to get started.'}
                      </div>
                    )}
                  </div>
                )}

                {/* Fallback: Building Address for companies without customer records or individuals */}
                {!customerIdForBuildings && formData.customerType === 'company' && (
                  <div className='md:col-span-2'>
                    <MaterialFormField
                      label={t('form.fields.buildingAddress')}
                      error={validationErrors.buildingAddress}
                      touched={!!validationErrors.buildingAddress}
                    >
                      <AddressInput
                        value={formData.buildingAddress || ''}
                        onChange={(address, coordinates) => {
                          setFormData(prev => ({ ...prev, buildingAddress: address }));
                          clearFieldError('buildingAddress');
                        }}
                        placeholder={t('form.fields.buildingAddressPlaceholder')}
                        error={validationErrors.buildingAddress}
                      />
                    </MaterialFormField>
                  </div>
                )}

                <MaterialFormField
                  label={t('form.fields.emailAddressLabel')}
                  error={validationErrors.customerEmail}
                  touched={!!validationErrors.customerEmail}
                >
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <Mail className='h-4 w-4 text-slate-400' />
                    </div>
                    <MaterialInput
                      type='email'
                      id='customerEmail'
                      value={formData.customerEmail || ''}
                      onChange={e => {
                        const emailValue = e.target.value;
                        setFormData(prev => ({ ...prev, customerEmail: emailValue }));
                        // Real-time validation if field has been touched
                        if (emailValue.trim()) {
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                          if (!emailRegex.test(emailValue.trim())) {
                            setValidationErrors(prev => ({
                              ...prev,
                              customerEmail: t('form.validation.customerEmailInvalid'),
                            }));
                          } else {
                            clearFieldError('customerEmail');
                          }
                        } else {
                          clearFieldError('customerEmail');
                        }
                      }}
                      onBlur={() => {
                        // Validate on blur
                        if (formData.customerEmail && formData.customerEmail.trim()) {
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                          if (!emailRegex.test(formData.customerEmail.trim())) {
                            setValidationErrors(prev => ({
                              ...prev,
                              customerEmail: t('form.validation.customerEmailInvalid'),
                            }));
                          } else {
                            clearFieldError('customerEmail');
                          }
                        }
                      }}
                      className='pl-10'
                      placeholder='customer@example.com'
                      autoComplete='email'
                      inputMode='email'
                      pattern='[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
                      title={t('form.validation.emailHint') || 'Ange en giltig e-postadress'}
                      onInvalid={e => {
                        e.preventDefault();
                        (e.target as HTMLInputElement).setCustomValidity(
                          t('form.validation.customerEmailInvalid') || 'Ange en giltig e-postadress'
                        );
                      }}
                      onInput={e => {
                        (e.target as HTMLInputElement).setCustomValidity('');
                      }}
                      enterKeyHint='next'
                    />
                  </div>
                </MaterialFormField>

                <div className='space-y-2'>
                  <div className='flex gap-2 items-end'>
                    <div className='flex-1'>
                      <MaterialFormField
                        label='Roof Size (m²)'
                        error={validationErrors.roofSize}
                        touched={!!validationErrors.roofSize}
                      >
                        <MaterialInput
                          type='number'
                          id='roofSize'
                          value={formData.roofSize || ''}
                          onChange={e => {
                            const value = e.target.value ? Math.round(parseFloat(e.target.value) * 100) / 100 : undefined;
                            setFormData(prev => ({ ...prev, roofSize: value }));
                            clearFieldError('roofSize');
                          }}
                          placeholder='0.00'
                          min='0'
                          step='0.01'
                        />
                      </MaterialFormField>
                    </div>
                    <button
                      type='button'
                      onClick={() => {
                        console.log('[ReportForm] Measure button clicked');
                        console.log('[ReportForm] addressCoordinates current state:', addressCoordinates);
                        console.log('[ReportForm] formData.buildingAddress:', formData.buildingAddress);
                        console.log('[ReportForm] formData.customerAddress:', formData.customerAddress);
                        
                        if (!addressCoordinates) {
                          console.warn('[ReportForm] No addressCoordinates available');
                          // Focus address input and wait for coordinates
                          setPendingRoofSizeMeasure(true);
                          if (addressInputRef.current) {
                            addressInputRef.current.focus();
                            addressInputRef.current.scrollIntoView({
                              behavior: 'smooth',
                              block: 'center',
                            });
                          }
                          setNotification({
                            message:
                              'Please enter and select an address first to use the map measurer',
                            type: 'warning',
                          });
                          return;
                        }
                        console.log('[ReportForm] Opening roof size measurer with coords:', addressCoordinates);
                        setShowRoofSizeMeasurer(true);
                      }}
                      className='px-3 py-2 h-10 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm text-slate-700 whitespace-nowrap shadow-sm'
                      title='Measure roof size on map'
                    >
                      <Ruler className='w-4 h-4' />
                      <span className='hidden sm:inline'>Measure</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Inspection Details */}
          {currentStep === 2 && (
            <div className='bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200'>
              <h2 className='text-lg font-semibold text-slate-900 mb-4 flex items-center'>
                <Calendar className='w-5 h-5 mr-2' />
                {t('form.sections.inspectionDetails')}
              </h2>

              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                <MaterialFormField
                  label={t('form.fields.inspectionDate')}
                  error={validationErrors.inspectionDate}
                  touched={!!validationErrors.inspectionDate}
                  required
                >
                  <MaterialDateInput
                    ref={stepRefs[2]}
                    id='inspectionDate'
                    value={formData.inspectionDate || ''}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, inspectionDate: e.target.value }));
                      clearFieldError('inspectionDate');
                    }}
                    onBlur={triggerValidation}
                    required
                    placeholder={
                      t('form.placeholder.date') ||
                      (currentUser && currentUser.branchId ? 'dd/mm/åååå' : 'åååå-mm-dd')
                    }
                  />
                </MaterialFormField>

                <MaterialFormField
                  label={t('form.fields.roofTypeLabel')}
                  error={validationErrors.roofType}
                  touched={!!validationErrors.roofType}
                  required
                >
                  <MaterialSelect
                    id='roofType'
                    required
                    value={formData.roofType || 'flat'}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, roofType: e.target.value as RoofType }))
                    }
                    options={[
                      { value: 'tile', label: t('roofTypes.tile') },
                      { value: 'metal', label: t('roofTypes.metal') },
                      { value: 'shingle', label: t('roofTypes.shingle') },
                      { value: 'slate', label: t('roofTypes.slate') },
                      { value: 'flat', label: t('roofTypes.flat') },
                      { value: 'flat_bitumen_2layer', label: t('roofTypes.flat_bitumen_2layer') },
                      { value: 'flat_bitumen_3layer', label: t('roofTypes.flat_bitumen_3layer') },
                      { value: 'flat_rubber', label: t('roofTypes.flat_rubber') },
                      { value: 'flat_pvc', label: t('roofTypes.flat_pvc') },
                      { value: 'flat_tpo', label: t('roofTypes.flat_tpo') },
                      { value: 'flat_epdm', label: t('roofTypes.flat_epdm') },
                      { value: 'other', label: t('roofTypes.other') },
                    ]}
                    placeholder='Select roof type'
                  />
                </MaterialFormField>

                <MaterialFormField
                  label={`${t('form.fields.roofAgeLabel')} (${t('form.labels.years')})`}
                  error={validationErrors.roofAge}
                  touched={!!validationErrors.roofAge}
                >
                  <MaterialInput
                    type='number'
                    id='roofAge'
                    min='0'
                    max='100'
                    value={formData.roofAge || ''}
                    onChange={e => {
                      // Use safe integer parsing to prevent NaN
                      const ageValue = safeParseInt(e.target.value, 0, 100);
                      setFormData(prev => ({
                        ...prev,
                        roofAge: ageValue,
                      }));
                      clearFieldError('roofAge');
                    }}
                    onKeyPress={e => {
                      // Only allow numeric input
                      if (
                        !/[0-9]/.test(e.key) &&
                        e.key !== 'Backspace' &&
                        e.key !== 'Delete' &&
                        e.key !== 'ArrowLeft' &&
                        e.key !== 'ArrowRight' &&
                        e.key !== 'Tab'
                      ) {
                        e.preventDefault();
                      }
                    }}
                    placeholder={t('form.fields.roofAgePlaceholder')}
                    inputMode='numeric'
                    pattern='[0-9]*'
                    title={t('form.validation.ageHint')}
                    enterKeyHint='next'
                  />
                </MaterialFormField>
              </div>

              <div className='mt-4'>
                <MaterialFormField
                  label={t('form.fields.conditionNotesLabel')}
                  error={validationErrors.conditionNotes}
                  touched={!!validationErrors.conditionNotes}
                >
                  <MaterialTextarea
                    id='conditionNotes'
                    rows={4}
                    value={formData.conditionNotes || ''}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, conditionNotes: e.target.value }))
                    }
                    placeholder={t('form.fields.conditionNotesPlaceholder')}
                    minLength={10}
                    maxLength={2000}
                    title={t('form.validation.notesHint')}
                  />
                </MaterialFormField>
              </div>

              {/* Inspection Checklist */}
              <div className='mt-6 pt-6 border-t border-slate-200'>
                <h3 className='text-base font-semibold text-slate-900 mb-4'>
                  {t('inspection.checklist')}
                </h3>
                <div className='space-y-4'>
                  <InspectionChecklistItem
                    label={t('inspection.roofEdging')}
                    value={formData.inspectionChecklist?.roofEdging}
                    onChange={item =>
                      setFormData(prev => ({
                        ...prev,
                        inspectionChecklist: { ...prev.inspectionChecklist, roofEdging: item },
                      }))
                    }
                    helpText={t('inspection.roofEdgingHint')}
                  />
                  <InspectionChecklistItem
                    label={t('inspection.technicalSpecifications')}
                    value={formData.inspectionChecklist?.technicalSpecifications}
                    onChange={item =>
                      setFormData(prev => ({
                        ...prev,
                        inspectionChecklist: {
                          ...prev.inspectionChecklist,
                          technicalSpecifications: item,
                        },
                      }))
                    }
                    helpText={t('inspection.technicalSpecificationsHint')}
                  />
                  <InspectionChecklistItem
                    label={t('inspection.welds')}
                    value={formData.inspectionChecklist?.welds}
                    onChange={item =>
                      setFormData(prev => ({
                        ...prev,
                        inspectionChecklist: { ...prev.inspectionChecklist, welds: item },
                      }))
                    }
                    helpText={t('inspection.weldsHint')}
                  />
                  <InspectionChecklistItem
                    label={t('inspection.drainage')}
                    value={formData.inspectionChecklist?.drainage}
                    onChange={item =>
                      setFormData(prev => ({
                        ...prev,
                        inspectionChecklist: { ...prev.inspectionChecklist, drainage: item },
                      }))
                    }
                    helpText={t('inspection.drainageHint')}
                  />
                  <InspectionChecklistItem
                    label={t('inspection.cornersCrowns')}
                    value={formData.inspectionChecklist?.cornersCrowns}
                    onChange={item =>
                      setFormData(prev => ({
                        ...prev,
                        inspectionChecklist: { ...prev.inspectionChecklist, cornersCrowns: item },
                      }))
                    }
                    helpText={t('inspection.cornersCrownsHint')}
                  />
                  <InspectionChecklistItem
                    label={t('inspection.skylights')}
                    value={formData.inspectionChecklist?.skylights}
                    onChange={item =>
                      setFormData(prev => ({
                        ...prev,
                        inspectionChecklist: { ...prev.inspectionChecklist, skylights: item },
                      }))
                    }
                    helpText={t('inspection.skylightsHint')}
                  />
                  <InspectionChecklistItem
                    label={t('inspection.technicalInstallations')}
                    value={formData.inspectionChecklist?.technicalInstallations}
                    onChange={item =>
                      setFormData(prev => ({
                        ...prev,
                        inspectionChecklist: {
                          ...prev.inspectionChecklist,
                          technicalInstallations: item,
                        },
                      }))
                    }
                    helpText={t('inspection.technicalInstallationsHint')}
                  />
                  <InspectionChecklistItem
                    label={t('inspection.insulationAssessment')}
                    value={formData.inspectionChecklist?.insulationAssessment}
                    onChange={item =>
                      setFormData(prev => ({
                        ...prev,
                        inspectionChecklist: {
                          ...prev.inspectionChecklist,
                          insulationAssessment: item,
                        },
                      }))
                    }
                    helpText={t('inspection.insulationAssessmentHint')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Issues & Actions */}
          {currentStep === 3 && (
            <>
              {/* Issues Found */}
              <div className='bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4'>
                  <h2 className='text-lg sm:text-xl font-semibold text-slate-900 flex items-center'>
                    <AlertTriangle className='w-5 h-5 sm:w-6 sm:h-6 mr-2' />
                    {t('form.sections.issuesFound')}
                  </h2>
                  <div className='flex items-center justify-end'>
                    {defectFlowStep === 'idle' ? (
                      <button
                        type='button'
                        onClick={() => {
                          setDefectFlowStep('camera');
                          setDraftDefect({});
                        }}
                        className='inline-flex items-center justify-center px-6 sm:px-8 py-4 sm:py-3 border border-transparent text-lg sm:text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 min-h-[56px] sm:min-h-[52px]'
                      >
                        <Camera className='w-6 h-6 sm:w-5 sm:h-5 mr-3 sm:mr-2 flex-shrink-0' />
                        <span className='whitespace-nowrap'>
                          {t('form.buttons.takeDefectPhoto') || 'Take Photo of Defect'}
                        </span>
                      </button>
                    ) : (
                      <button
                        type='button'
                        onClick={() => {
                          setDefectFlowStep('idle');
                          setDraftDefect(null);
                        }}
                        className='inline-flex items-center justify-center px-4 sm:px-3 py-3 sm:py-2 border border-slate-300 text-base sm:text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 shadow-sm min-h-[44px] sm:min-h-0 transition-colors'
                      >
                        <X className='w-5 h-5 sm:w-4 sm:h-4 mr-2 sm:mr-1 flex-shrink-0' />
                        <span className='whitespace-nowrap'>
                          {t('form.buttons.cancel') || 'Cancel'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Indicator for Defect Flow */}
                {defectFlowStep !== 'idle' && (
                  <div className='mb-6'>
                    <div className='flex items-center justify-center gap-2 sm:gap-4'>
                      {/* Step 1: Camera */}
                      <div className='flex items-center gap-2'>
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                            defectFlowStep === 'camera'
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : defectFlowStep === 'describe'
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'bg-slate-100 border-slate-300 text-slate-400'
                          }`}
                        >
                          {defectFlowStep === 'camera' ? (
                            <Camera className='w-5 h-5' />
                          ) : defectFlowStep === 'describe' ? (
                            <CheckCircle className='w-5 h-5' />
                          ) : (
                            <Camera className='w-5 h-5' />
                          )}
                        </div>
                        <span
                          className={`hidden sm:block text-sm font-medium ${
                            defectFlowStep === 'camera' ? 'text-blue-600' : 'text-slate-600'
                          }`}
                        >
                          {t('form.defectFlow.step.camera') || 'Take Photo'}
                        </span>
                      </div>

                      {/* Connector Line */}
                      <div
                        className={`h-0.5 w-8 sm:w-16 transition-all ${
                          defectFlowStep === 'describe' ? 'bg-green-500' : 'bg-slate-300'
                        }`}
                      />

                      {/* Step 2: Describe */}
                      <div className='flex items-center gap-2'>
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                            defectFlowStep === 'describe'
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-slate-100 border-slate-300 text-slate-400'
                          }`}
                        >
                          {defectFlowStep === 'describe' ? (
                            <FileText className='w-5 h-5' />
                          ) : (
                            <FileText className='w-5 h-5 opacity-50' />
                          )}
                        </div>
                        <span
                          className={`hidden sm:block text-sm font-medium ${
                            defectFlowStep === 'describe' ? 'text-blue-600' : 'text-slate-600'
                          }`}
                        >
                          {t('form.defectFlow.step.describe') || 'Describe'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Defect Flow: Camera Step */}
                {defectFlowStep === 'camera' && (
                  <DefectCameraCapture
                    onImageCapture={imageDataUrl => {
                      setDraftDefect(prev => ({ ...prev, image: imageDataUrl }));
                      setDefectFlowStep('describe');
                    }}
                    onCancel={() => {
                      setDefectFlowStep('idle');
                      setDraftDefect(null);
                    }}
                  />
                )}

                {/* Defect Flow: Map Step - Pin Placement */}
                {defectFlowStep === 'map' && draftDefect?.image && (
                  <div className='mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4'>
                    <p className='text-sm text-blue-800 mb-4 text-center'>
                      {t('form.instructions.pinPlacement') ||
                        'Click on the roof where the problem is'}
                    </p>

                    {/* Show map or roof image annotation based on what exists */}
                    {!formData.roofImageUrl && addressCoordinates ? (
                      <Suspense fallback={<LoadingSpinner size='sm' />}>
                        <InteractiveRoofMap
                          key='roof-map-defect-pin'
                          lat={addressCoordinates.lat}
                          lon={addressCoordinates.lon}
                          availableIssues={[]}
                          existingMarkers={mapMarkers}
                          onMarkersChange={setMapMarkers}
                          pinMode={true}
                          draftImageUrl={draftDefect.image}
                          onPinPlace={position => {
                            setDraftDefect(prev => ({ ...prev, pinPosition: position }));
                            setDefectFlowStep('describe');
                          }}
                          onImageCapture={async () => {}}
                        />
                      </Suspense>
                    ) : formData.roofImageUrl ? (
                      <Suspense fallback={<LoadingSpinner size='sm' />}>
                        <RoofImageAnnotation
                          roofImageUrl={formData.roofImageUrl}
                          pins={formData.roofImagePins || []}
                          availableIssues={formData.issuesFound || []}
                          reportId={tempReportId}
                          onImageChange={url =>
                            setFormData(prev => ({ ...prev, roofImageUrl: url || undefined }))
                          }
                          onPinsChange={pins =>
                            setFormData(prev => ({ ...prev, roofImagePins: pins }))
                          }
                          disabled={false}
                          pinMode={true}
                          draftImageUrl={draftDefect.image}
                          onPinPlace={position => {
                            setDraftDefect(prev => ({ ...prev, pinPosition: position }));
                            setDefectFlowStep('describe');
                          }}
                        />
                      </Suspense>
                    ) : null}

                    {/* Action buttons for map step */}
                    <div className='mt-4 flex flex-col sm:flex-row gap-3'>
                      <button
                        type='button'
                        onClick={() => {
                          // Skip pin placement and proceed to describe step
                          setDefectFlowStep('describe');
                        }}
                        className='px-4 py-3 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 font-medium min-h-[44px] transition-colors'
                      >
                        {t('form.buttons.skip') || 'Skip'}
                      </button>
                      {draftDefect.pinPosition && (
                        <button
                          type='button'
                          onClick={() => {
                            setDraftDefect(prev => {
                              const { pinPosition, ...rest } = prev || {};
                              return rest;
                            });
                          }}
                          className='px-4 py-3 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 font-medium min-h-[44px] transition-colors'
                        >
                          {t('form.buttons.removePin') || 'Remove Pin'}
                        </button>
                      )}
                      <button
                        type='button'
                        onClick={() => {
                          setDraftDefect(prev => {
                            const { image, ...rest } = prev || {};
                            return rest;
                          });
                          setDefectFlowStep('camera');
                        }}
                        className='px-4 py-3 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 font-medium min-h-[44px] transition-colors'
                      >
                        {t('form.buttons.deleteImage') || 'Delete Image'}
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          setDefectFlowStep('idle');
                          setDraftDefect(null);
                        }}
                        className='px-4 py-3 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 font-medium min-h-[44px] transition-colors'
                      >
                        {t('form.buttons.cancel') || 'Cancel'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Defect Flow: Description Step */}
                {defectFlowStep === 'describe' && draftDefect && (
                  <DefectQuickDescription
                    draftDefect={draftDefect}
                    onSave={defectData => {
                      saveDraftDefect(defectData);
                    }}
                    onMoreDetails={async () => {
                      // Upload image first if it exists
                      let imageUrl: string | undefined;
                      if (draftDefect?.image) {
                        try {
                          const response = await fetch(draftDefect.image);
                          const blob = await response.blob();
                          const fileName = `defect_${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`;
                          const storageRef = ref(
                            storage,
                            `reports/${tempReportId}/issues/${fileName}`
                          );
                          await uploadBytes(storageRef, blob);
                          imageUrl = await getDownloadURL(storageRef);
                        } catch (error) {
                          console.error('Error uploading image:', error);
                          // Continue without image URL
                        }
                      }

                      // Create issue from draft and open in full form with automatic title
                      const existingIssuesCount = formData.issuesFound?.length || 0;
                      const issueTitle =
                        draftDefect?.title?.trim() ||
                        '' ||
                        `${t('reports.public.problem') || 'Problem'} ${existingIssuesCount + 1}`;
                      const newIssue: Issue = {
                        id: `issue_${Date.now()}`,
                        title: issueTitle,
                        type: draftDefect?.type || 'other',
                        severity: draftDefect?.severity || 'medium',
                        description: draftDefect?.description || '',
                        location: draftDefect?.pinPosition ? t('reportView.location') : '',
                        images: imageUrl ? [imageUrl] : [],
                      };
                      setFormData(prev => ({
                        ...prev,
                        issuesFound: [...(prev.issuesFound || []), newIssue],
                      }));

                      // Update pins if position exists
                      if (draftDefect?.pinPosition) {
                        if ('lat' in draftDefect.pinPosition) {
                          const newMarker: MapMarker = {
                            id: `marker_${Date.now()}`,
                            lat: draftDefect.pinPosition.lat,
                            lon: draftDefect.pinPosition.lon,
                            severity: newIssue.severity,
                            issueId: newIssue.id,
                          };
                          setMapMarkers(prev => [...prev, newMarker]);
                        } else if ('x' in draftDefect.pinPosition) {
                          const newPin: RoofPinMarker = {
                            id: `pin_${Date.now()}`,
                            x: draftDefect.pinPosition.x,
                            y: draftDefect.pinPosition.y,
                            severity: newIssue.severity,
                            issueId: newIssue.id,
                          };
                          setFormData(prev => ({
                            ...prev,
                            roofImagePins: [...(prev.roofImagePins || []), newPin],
                          }));
                        }
                      }

                      setDefectFlowStep('idle');
                      setDraftDefect(null);
                    }}
                    onCancel={() => {
                      setDefectFlowStep('idle');
                      setDraftDefect(null);
                    }}
                  />
                )}

                {/* Repeat loop: Show "Take Next Photo" after successful save */}
                {defectFlowStep === 'idle' && showRepeatOption && (
                  <div className='mb-6 bg-green-50 border border-green-200 rounded-lg p-4'>
                    <div className='flex items-center justify-between'>
                      <p className='text-sm text-green-800'>
                        {t('form.messages.defectSaved') || 'Defect saved'}
                      </p>
                      <button
                        type='button'
                        onClick={() => {
                          setDefectFlowStep('camera');
                          setDraftDefect({});
                          setShowRepeatOption(false);
                        }}
                        className='inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-semibold min-h-[52px]'
                      >
                        <Camera className='w-5 h-5' />
                        {t('form.buttons.takeNextPhoto') || 'Take Next Photo'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Interactive Roof Map - Only show if we have coordinates but no image yet */}
                {defectFlowStep === 'idle' && !formData.roofImageUrl && addressCoordinates && (
                  <div
                    className='mb-6'
                    style={{ position: 'relative', zIndex: 1 }}
                    onClick={e => {
                      // Stop event propagation to prevent form submission
                      e.stopPropagation();
                    }}
                    onMouseDown={e => {
                      // Stop event propagation to prevent form submission
                      e.stopPropagation();
                    }}
                  >
                    <Suspense fallback={<LoadingSpinner size='sm' />}>
                      <InteractiveRoofMap
                        key='roof-map-interactive'
                        lat={addressCoordinates.lat}
                        lon={addressCoordinates.lon}
                        availableIssues={(formData.issuesFound || []).map((issue, index) => ({
                          id: issue.id,
                          title: issue.title
                            ? `${issue.type} - ${issue.title}`
                            : `${t(`issueTypes.${issue.type}`) || issue.type} - ${t('reportView.issueNumber')} #${index + 1}`,
                        }))}
                        existingMarkers={mapMarkers}
                        onMarkersChange={setMapMarkers}
                        onImageCapture={async dataUrl => {
                          try {
                            // Upload to Firebase Storage
                            const response = await fetch(dataUrl);
                            const blob = await response.blob();
                            const storageRef = ref(
                              storage,
                              `roof-images/${tempReportId}/${Date.now()}.png`
                            );
                            await uploadBytes(storageRef, blob);
                            const url = await getDownloadURL(storageRef);

                            setFormData(prev => ({ ...prev, roofImageUrl: url }));
                            setNotification({
                              message: t('address.map.captureSuccess'),
                              type: 'success',
                            });
                          } catch (error) {
                            console.error('Error uploading roof image:', error);
                            setNotification({
                              message: t('address.map.captureError'),
                              type: 'error',
                            });
                          }
                        }}
                      />
                    </Suspense>
                  </div>
                )}

                {/* Roof Image Annotation - Show if roof image exists (only when not in defect flow) */}
                {defectFlowStep === 'idle' && formData.roofImageUrl && (
                  <div className='mb-6'>
                    <Suspense fallback={<LoadingSpinner size='sm' />}>
                      <RoofImageAnnotation
                        roofImageUrl={formData.roofImageUrl}
                        pins={formData.roofImagePins || []}
                        availableIssues={formData.issuesFound || []}
                        reportId={tempReportId}
                        onImageChange={url =>
                          setFormData(prev => ({ ...prev, roofImageUrl: url || undefined }))
                        }
                        onPinsChange={pins =>
                          setFormData(prev => ({ ...prev, roofImagePins: pins }))
                        }
                        disabled={false}
                      />
                    </Suspense>
                  </div>
                )}

                {formData.issuesFound?.map((issue, index) => (
                  <div
                    key={issue.id}
                    className='border border-slate-200 rounded-xl p-4 mb-4 last:mb-0 bg-slate-50'
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <h4 className='text-sm font-medium text-gray-900'>
                        {t('form.labels.issue')} #{index + 1}
                      </h4>
                      <button
                        type='button'
                        onClick={() => removeIssue(index)}
                        className='text-red-600 hover:text-red-800 transition-colors'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>

                    <div className='mb-4'>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        {t('form.labels.issueTitle')} *
                      </label>
                      <input
                        type='text'
                        value={issue.title || ''}
                        onChange={e => updateIssue(index, { title: e.target.value })}
                        onBlur={() => validateStep(currentStep)}
                        className={`block w-full text-sm border-slate-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500 ${
                          validationErrors[`issue_${index}_title`] ? 'border-red-300' : ''
                        }`}
                        placeholder={t('form.fields.issueTitlePlaceholder')}
                        required
                      />
                      {validationErrors[`issue_${index}_title`] && (
                        <p className='mt-1 text-sm text-red-600'>
                          {validationErrors[`issue_${index}_title`]}
                        </p>
                      )}
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-3'>
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          {t('form.labels.issueType')}
                        </label>
                        <select
                          value={issue.type}
                          onChange={e => updateIssue(index, { type: e.target.value as IssueType })}
                          className='block w-full text-sm border-slate-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500'
                        >
                          <option value='leak'>Leak</option>
                          <option value='damage'>Damage</option>
                          <option value='wear'>Wear</option>
                          <option value='structural'>Structural</option>
                          <option value='ventilation'>Ventilation</option>
                          <option value='gutters'>Gutters</option>
                          <option value='flashing'>Flashing</option>
                          <option value='other'>Other</option>
                        </select>
                      </div>

                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          {t('form.labels.issueSeverity')}
                        </label>
                        <select
                          value={issue.severity}
                          onChange={e =>
                            updateIssue(index, { severity: e.target.value as IssueSeverity })
                          }
                          className='block w-full text-sm border-slate-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500'
                        >
                          <option value='low'>{t('severity.low')}</option>
                          <option value='medium'>{t('severity.medium')}</option>
                          <option value='high'>{t('severity.high')}</option>
                          <option value='critical'>{t('severity.critical')}</option>
                        </select>
                      </div>

                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          {t('form.labels.issueLocation')}
                        </label>
                        <input
                          type='text'
                          value={issue.location}
                          onChange={e => updateIssue(index, { location: e.target.value })}
                          className='block w-full text-sm border-slate-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500'
                          placeholder='e.g., North side, near chimney'
                        />
                      </div>
                    </div>

                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        {t('form.labels.issueDescription')}
                      </label>
                      <textarea
                        rows={2}
                        value={issue.description}
                        onChange={e => updateIssue(index, { description: e.target.value })}
                        className='block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500'
                        placeholder='Detailed description of the issue...'
                      />
                    </div>

                    <div className='mt-3'>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        {t('form.labels.issueImages')} ({t('form.labels.optional')})
                      </label>
                      <IssueImageUpload
                        key={`issues-${formResetKey}`}
                        images={issue.images || []}
                        onChange={images => updateIssue(index, { images })}
                        disabled={loading}
                        reportId={tempReportId}
                        issueId={issue.id}
                        maxImages={FORM_CONSTANTS.MAX_IMAGES_PER_ISSUE}
                      />
                    </div>
                  </div>
                ))}

                {(!formData.issuesFound || formData.issuesFound.length === 0) &&
                  defectFlowStep === 'idle' && (
                    <div className='text-center py-8 text-slate-500'>
                      <AlertTriangle className='w-8 h-8 text-slate-400 mx-auto mb-2' />
                      <p>{t('form.labels.noIssuesYet')}</p>
                      <button
                        type='button'
                        onClick={addIssue}
                        className='mt-2 text-slate-700 hover:text-slate-900 text-sm font-medium'
                      >
                        {t('form.labels.addFirstIssue')}
                      </button>
                    </div>
                  )}
              </div>

              {/* Recommended Actions */}
              <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
                <div className='flex items-center justify-between mb-4'>
                  <h2 className='text-lg font-medium text-gray-900 flex items-center'>
                    <FileText className='w-5 h-5 mr-2' />
                    {t('form.sections.recommendedActions')}
                  </h2>
                  <button
                    type='button'
                    onClick={addRecommendedAction}
                    className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 shadow-sm'
                  >
                    <Plus className='w-4 h-4 mr-1' />
                    {t('form.buttons.addAction')}
                  </button>
                </div>

                {formData.recommendedActions?.map((action, index) => (
                  <div
                    key={action.id}
                    className='border border-slate-200 rounded-xl p-4 mb-4 last:mb-0 bg-slate-50'
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <h4 className='text-sm font-semibold text-slate-900'>Action #{index + 1}</h4>
                      <button
                        type='button'
                        onClick={() => removeRecommendedAction(index)}
                        className='text-red-600 hover:text-red-800 transition-colors'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-3'>
                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          {t('form.labels.actionPriority')}
                        </label>
                        <select
                          value={action.priority}
                          onChange={e =>
                            updateRecommendedAction(index, {
                              priority: e.target.value as ActionPriority,
                            })
                          }
                          className='block w-full text-sm border-slate-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500'
                        >
                          <option value='low'>{t('severity.low')}</option>
                          <option value='medium'>{t('severity.medium')}</option>
                          <option value='high'>{t('severity.high')}</option>
                        </select>
                      </div>

                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          {t('form.labels.actionUrgency')}
                        </label>
                        <select
                          value={action.urgency}
                          onChange={e =>
                            updateRecommendedAction(index, {
                              urgency: e.target.value as ActionUrgency,
                            })
                          }
                          className='block w-full text-sm border-slate-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500'
                        >
                          <option value='immediate'>{t('urgency.immediate')}</option>
                          <option value='short_term'>{t('urgency.short_term')}</option>
                          <option value='long_term'>{t('urgency.long_term')}</option>
                        </select>
                      </div>

                      <div>
                        <label className='block text-xs font-medium text-slate-700 mb-1'>
                          {t('form.labels.estimatedCost')}
                        </label>
                        <select
                          value={action.estimatedCost || ''}
                          onChange={e =>
                            updateRecommendedAction(index, {
                              estimatedCost: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                          }
                          className='block w-full text-sm border-slate-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500'
                        >
                          <option value=''>{t('form.placeholders.selectCostRange')}</option>
                          <option value='250'>0-500 {getCurrencyCode(locale)}</option>
                          <option value='750'>500-1000 {getCurrencyCode(locale)}</option>
                          <option value='1250'>1000-1500 {getCurrencyCode(locale)}</option>
                          <option value='1750'>1500-2000 {getCurrencyCode(locale)}</option>
                          <option value='2250'>2000-2500 {getCurrencyCode(locale)}</option>
                          <option value='2750'>2500-3000 {getCurrencyCode(locale)}</option>
                          <option value='3250'>3000-3500 {getCurrencyCode(locale)}</option>
                          <option value='3750'>3500-4000 {getCurrencyCode(locale)}</option>
                          <option value='4250'>4000-4500 {getCurrencyCode(locale)}</option>
                          <option value='4750'>4500-5000 {getCurrencyCode(locale)}</option>
                          <option value='5500'>5000+ {getCurrencyCode(locale)}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className='block text-xs font-medium text-slate-700 mb-1'>
                        {t('form.labels.actionDescription')}
                      </label>
                      <textarea
                        rows={2}
                        value={action.description}
                        onChange={e =>
                          updateRecommendedAction(index, { description: e.target.value })
                        }
                        className='block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500'
                        placeholder={t('form.fields.actionDescriptionPlaceholder')}
                      />
                    </div>
                  </div>
                ))}

                {(!formData.recommendedActions || formData.recommendedActions.length === 0) && (
                  <div className='text-center py-8 text-gray-500'>
                    <FileText className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                    <p>{t('form.labels.noActionsYet')}</p>
                    <button
                      type='button'
                      onClick={addRecommendedAction}
                      className='mt-2 text-slate-700 hover:text-slate-900 text-sm font-medium'
                    >
                      {t('form.labels.addFirstRecommendation')}
                    </button>
                  </div>
                )}
              </div>

              {/* Cost Estimation Section */}
              <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6'>
                <h2 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                  <DollarSign className='w-5 h-5 mr-2' />
                  {t('costEstimate.title') || 'Kostnadsuppskattning'}
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      {t('costEstimate.labor') || 'Arbetskostnad'} ({getCurrencyCode(locale)})
                    </label>
                    <input
                      type='number'
                      value={formData.laborCost || ''}
                      onChange={e => {
                        const value = e.target.value ? parseFloat(e.target.value) : undefined;
                        setFormData(prev => ({ ...prev, laborCost: value }));
                      }}
                      className='block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500'
                      placeholder='0'
                      min='0'
                      step='100'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      {t('costEstimate.material') || 'Materialkostnad'} ({getCurrencyCode(locale)})
                    </label>
                    <input
                      type='number'
                      value={formData.materialCost || ''}
                      onChange={e => {
                        const value = e.target.value ? parseFloat(e.target.value) : undefined;
                        setFormData(prev => ({ ...prev, materialCost: value }));
                      }}
                      className='block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500'
                      placeholder='0'
                      min='0'
                      step='100'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      {t('costEstimate.travel') || 'Resekostnad'} ({getCurrencyCode(locale)})
                    </label>
                    <input
                      type='number'
                      value={formData.travelCost || ''}
                      onChange={e => {
                        const value = e.target.value ? parseFloat(e.target.value) : undefined;
                        setFormData(prev => ({ ...prev, travelCost: value }));
                      }}
                      className='block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500'
                      placeholder='0'
                      min='0'
                      step='100'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      {t('costEstimate.overhead') || 'Omkostnader'} ({getCurrencyCode(locale)})
                    </label>
                    <input
                      type='number'
                      value={formData.overheadCost || ''}
                      onChange={e => {
                        const value = e.target.value ? parseFloat(e.target.value) : undefined;
                        setFormData(prev => ({ ...prev, overheadCost: value }));
                      }}
                      className='block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500'
                      placeholder='0'
                      min='0'
                      step='100'
                    />
                  </div>
                </div>
                <div className='mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200'>
                  <div className='text-sm text-slate-600 mb-1'>
                    {t('costEstimate.total') || 'Total uppskattning'}:
                  </div>
                  <div className='text-xl font-bold text-slate-900'>
                    {(() => {
                      const recommendedActionsTotal = (formData.recommendedActions || []).reduce(
                        (sum, action) => sum + (action.estimatedCost || 0),
                        0
                      );
                      const total =
                        recommendedActionsTotal +
                        (formData.laborCost || 0) +
                        (formData.materialCost || 0) +
                        (formData.travelCost || 0) +
                        (formData.overheadCost || 0);
                      return formatCurrency(total);
                    })()}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
              <h2 className='text-lg font-medium text-gray-900 mb-4 flex items-center'>
                <FileText className='w-5 h-5 mr-2' />
                {t('form.labels.reviewReportTitle')}
              </h2>

              <div className='space-y-4'>
                <div>
                  <h3 className='text-sm font-medium text-gray-700'>
                    {t('form.labels.customerLabel')}
                  </h3>
                  <p className='text-sm text-gray-900'>{formData.customerName}</p>
                  <p className='text-sm text-gray-600'>{formData.customerAddress}</p>
                  {formData.customerPhone && (
                    <p className='text-sm text-gray-600'>{formData.customerPhone}</p>
                  )}
                  {formData.customerEmail && (
                    <p className='text-sm text-gray-600'>{formData.customerEmail}</p>
                  )}
                </div>

                <div>
                  <h3 className='text-sm font-medium text-gray-700'>
                    {t('form.labels.inspectionDetailsLabel')}
                  </h3>
                  <p className='text-sm text-gray-900'>
                    {t('form.labels.dateLabel')}: {formData.inspectionDate}
                  </p>
                  <p className='text-sm text-gray-900'>
                    {t('form.labels.roofTypeLabel')}: {formData.roofType}
                  </p>
                  {formData.roofAge && (
                    <p className='text-sm text-gray-900'>
                      {t('form.labels.ageLabel')}: {formData.roofAge} {t('form.labels.years')}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className='text-sm font-medium text-gray-700'>
                    {t('form.sections.issuesFound')}
                  </h3>
                  <p className='text-sm text-gray-900'>
                    {formData.issuesFound?.length || 0} {t('form.labels.issuesIdentified')}
                  </p>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-gray-700'>
                    {t('form.sections.recommendedActions')}
                  </h3>
                  <p className='text-sm text-gray-900'>
                    {formData.recommendedActions?.length || 0} {t('form.labels.actionsRecommended')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
            <div className='flex flex-wrap gap-3 justify-between'>
              <div className='flex gap-3'>
                <button
                  type='button'
                  onClick={handleCancel}
                  className='px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500'
                >
                  {t('form.buttons.cancel')}
                </button>

                <button
                  type='button'
                  onClick={handleDeleteDraft}
                  className='px-4 py-2 border border-red-300 rounded-lg shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                >
                  {t('form.buttons.deleteDraft')}
                </button>

                {currentStep > 1 && (
                  <button
                    type='button'
                    onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                    className='px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500'
                  >
                    {t('form.buttons.previous')}
                  </button>
                )}
              </div>

              <div className='flex flex-col sm:flex-row gap-3 relative z-50'>
                {currentStep < totalSteps ? (
                  <button
                    type='button'
                    onClick={() => {
                      // Validate current step before proceeding
                      const isStepValid = validateStep(currentStep);

                      if (isStepValid) {
                        setCurrentStep(prev => Math.min(totalSteps, prev + 1));
                      } else {
                        // Show validation errors for current step
                        // Scroll to top to show error summary
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        setNotification({
                          message:
                            t('form.validation.stepValidationFailed') ||
                            'Please fix the validation errors before continuing',
                          type: 'error',
                        });
                        setTimeout(() => setNotification(null), 5000);
                      }
                    }}
                    className='w-full sm:w-auto px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 relative z-50 shadow-sm'
                  >
                    {t('form.buttons.next')}
                  </button>
                ) : (
                  <>
                    <button
                      type='button'
                      onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                      className='w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500'
                    >
                      {t('form.buttons.previous')}
                    </button>

                    <button
                      type='submit'
                      disabled={loading}
                      className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 shadow-sm'
                    >
                      {loading ? <LoadingSpinner size='sm' /> : <Save className='w-4 h-4 mr-2' />}
                      {t('form.buttons.saveAsDraft')}
                    </button>

                    <button
                      type='button'
                      onClick={e => handleSubmit(e, 'completed')}
                      disabled={loading}
                      className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 shadow-sm'
                    >
                      {loading ? <LoadingSpinner size='sm' /> : <Save className='w-4 h-4 mr-2' />}
                      {t('form.buttons.completeReport')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Cancel Confirmation Dialog */}
        {showCancelDialog && (
          <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
            <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
              <div className='mt-3 text-center'>
                <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100'>
                  <AlertTriangle className='h-6 w-6 text-yellow-600' />
                </div>
                <h3 className='text-lg font-medium text-gray-900 mt-4'>
                  {t('form.dialogs.discardChanges')}
                </h3>
                <div className='mt-2 px-7 py-3'>
                  <p className='text-sm text-gray-500'>{t('form.dialogs.unsavedChanges')}</p>
                </div>
                <div className='flex justify-center gap-3 mt-4'>
                  <button
                    onClick={() => setShowCancelDialog(false)}
                    className='px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500'
                  >
                    {t('form.buttons.continueEditing')}
                  </button>
                  <button
                    onClick={confirmCancel}
                    className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500'
                  >
                    {t('form.buttons.discardChanges')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Draft Confirmation Dialog */}
        {showDeleteDraftDialog && (
          <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
            <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
              <div className='mt-3 text-center'>
                <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100'>
                  <Trash2 className='h-6 w-6 text-red-600' />
                </div>
                <h3 className='text-lg font-medium text-gray-900 mt-4'>
                  {t('form.dialogs.deleteDraft')}
                </h3>
                <div className='mt-2 px-7 py-3'>
                  <p className='text-sm text-gray-500'>{t('form.dialogs.deleteDraftWarning')}</p>
                </div>
                <div className='flex justify-center gap-3 mt-4'>
                  <button
                    onClick={() => setShowDeleteDraftDialog(false)}
                    className='px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500'
                  >
                    {t('form.buttons.cancel')}
                  </button>
                  <button
                    onClick={confirmDeleteDraft}
                    className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500'
                  >
                    {t('form.buttons.deleteDraft')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Complete Customer Dialog */}
        {showAutoCompleteDialog && foundCustomer && foundReport && (
          <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
            <div className='relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white'>
              <div className='mt-3 text-center'>
                <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-slate-100'>
                  <User className='h-6 w-6 text-slate-600' />
                </div>
                <h3 className='text-lg font-semibold text-slate-900 mt-4'>
                  {t('form.existingCustomer.title')}
                </h3>
                <div className='mt-2 px-7 py-3'>
                  <p className='text-sm text-slate-500 mb-2'>
                    {t('form.existingCustomer.message', { name: foundCustomer.name })}
                  </p>
                  <p className='text-sm text-slate-500 mb-2'>
                    {t('form.existingCustomer.latestReport', {
                      date: foundReport.createdAt
                        ? new Date(foundReport.createdAt).toLocaleDateString('sv-SE')
                        : t('common.unknown') || 'Okänt datum',
                    })}
                  </p>
                  <p className='text-sm text-gray-500'>
                    {t('form.existingCustomer.importQuestion')}
                  </p>
                </div>
                <div className='flex justify-center gap-3 mt-4'>
                  <button
                    onClick={handleAutoCompleteSkip}
                    className='px-4 py-2 bg-slate-300 text-slate-800 rounded-lg hover:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-sm'
                  >
                    {t('form.existingCustomer.no')}
                  </button>
                  <button
                    onClick={handleAutoCompleteImport}
                    className='px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-sm'
                  >
                    {t('form.existingCustomer.yes')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Template Selector */}
        {showTemplateSelector && (
          <IssueTemplateSelector
            onSelectTemplate={handleTemplateSelect}
            onClose={() => setShowTemplateSelector(false)}
          />
        )}

        {showRoofSizeMeasurer && addressCoordinates && (
          <RoofSizeMeasurer
            lat={addressCoordinates.lat}
            lon={addressCoordinates.lon}
            address={formData.buildingAddress || formData.customerAddress}
            onAreaCalculated={(area, snapshotDataUrl, polygonPoints) => {
              setFormData(prev => ({ ...prev, roofSize: area }));
              setRoofSnapshot(snapshotDataUrl);
              setRoofPolygonPoints(polygonPoints);
              setShowRoofSizeMeasurer(false);
              setNotification({
                message: `Roof size set to ${area.toFixed(2)} m²`,
                type: 'success',
              });
            }}
            onClose={() => setShowRoofSizeMeasurer(false)}
            initialArea={formData.roofSize}
            initialSnapshot={roofSnapshot}
            initialPolygonPoints={roofPolygonPoints}
          />
        )}

        {/* Notification Toast */}
        {notification && (
          <NotificationToast
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </FormErrorBoundary>
  );
};

export default ReportForm;
