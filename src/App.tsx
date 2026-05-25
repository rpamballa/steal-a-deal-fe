import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {Toaster, toast} from './lib/toast';
import {toUserMessage} from './lib/userMessage';
import {onUrlPop, readUrlState, writeUrlState} from './lib/urlState';
import {AuthScreen} from './components/AuthScreen';
import {ConfirmDialog} from './components/ConfirmDialog';
import {DealScoreBadge} from './components/DealScoreBadge';
import {AdminAudit} from './components/AdminAudit';
import {AdminFAndIProducts} from './components/AdminFAndIProducts';
import {DealFAndIPanel} from './components/DealFAndIPanel';
import {DealerInventoryView} from './components/DealerInventoryView';
import {InventoryFeedPanel} from './components/InventoryFeedPanel';
import {DealerProfileView} from './components/DealerProfileView';
import {GarageView} from './components/GarageView';
import {
  AboutView,
  ContactView,
  DealerTermsView,
  FaqView,
  PrivacyView,
  TermsView,
} from './components/SiteInfo';
import {Lightbox} from './components/Lightbox';
import {MatchQuiz} from './components/MatchQuiz';
import {Pagination} from './components/Pagination';
import {ReadinessMeter, type ReadinessStep} from './components/ReadinessMeter';
import {
  dealScore,
  matchPercent,
  type DealScore,
  type MatchAnswers,
} from './lib/buyerMatch';
import {PlatformDisclaimer} from './components/PlatformDisclaimer';
import {
  DetailRow,
  EmptyState,
  PanelHeader,
  SummaryBox,
  VehicleSummaryCard,
} from './components/primitives';
import {
  formatCurrency,
  formatDateTime,
  formatLabel,
  formatMileage,
  getErrorMessage,
  getVehicleGallery,
} from './lib/format';
import {
  ResourceBlock,
  useRemoteResource,
  type AsyncState,
} from './lib/useRemoteResource';
import {CompareDrawer} from './components/CompareDrawer';
import {CompareView} from './components/CompareView';
import {DealTimeline} from './components/DealTimeline';
import {KanbanBoard} from './components/KanbanBoard';
import {NotificationsBell} from './components/NotificationsBell';
import {DealerDashboard} from './components/DealerDashboard';
import {OnboardingChecklist} from './components/OnboardingChecklist';
import {OperationsDashboard} from './components/OperationsDashboard';
import {PaymentSlider} from './components/PaymentSlider';
import {TaskList} from './components/TaskList';
import {featureFlags} from './featureFlags';
import {
  api,
  setAuthSession,
  clearAuthSession,
  MAX_VEHICLE_PHOTOS,
  vehicleHistoryReportUrl,
  type Appointment,
  type CreateVehicleRequest,
  type CurrentUser,
  type Dealer,
  type Deal,
  type DealActivity,
  type DealDocument,
  type DealReadiness,
  type DealStage,
  type DealTaskStatus,
  type DealTask,
  type DealerInbox,
  type DealerOnboardingView,
  type DealerPortal,
  type Favorite,
  type SavedSearch,
  type SavedSearchInput,
  type VehicleHistoryReport,
  type DealerQueue,
  type Dashboard,
  type DocumentStatus,
  type InventoryUploadMode,
  type InventoryUploadResponse,
  type Lead,
  type Notification,
  type ParticipantInbox,
  type ParticipantType,
  type PortalAppointmentItem,
  type PortalDealItem,
  type PortalDocumentItem,
  type PortalInvoice,
  type PortalLeadItem,
  type PortalSubscription,
  type SubscriptionPlan,
  type SubscriptionStatus,
  type UserRole,
  type Vehicle,
} from './api';

type NavView =
  | 'overview'
  | 'inventory'
  | 'vehicle'
  | 'compare'
  | 'garage'
  | 'leads'
  | 'appointments'
  | 'deal-room'
  | 'deal-desk'
  | 'dealers'
  | 'reporting'
  | 'fni-catalog'
  | 'audit'
  | 'about'
  | 'terms'
  | 'dealer-terms'
  | 'privacy'
  | 'faq'
  | 'contact'
  | 'dealer-profile';


const navItems: Array<{id: NavView; label: string; roles?: Array<CurrentUser['role']>}> = [
  {id: 'overview', label: 'Overview'},
  {id: 'inventory', label: 'Inventory'},
  {id: 'vehicle', label: 'Vehicle Detail', roles: ['BUYER', 'ADMIN']},
  {id: 'compare', label: 'Compare', roles: ['BUYER']},
  {id: 'garage', label: 'My Garage', roles: ['BUYER']},
  {id: 'deal-room', label: 'Deal Room', roles: ['BUYER', 'DEALER', 'ADMIN']},
  {id: 'deal-desk', label: 'Deal Desk', roles: ['DEALER', 'ADMIN']},
  {id: 'leads', label: 'Leads', roles: ['DEALER', 'ADMIN']},
  {id: 'appointments', label: 'Appointments', roles: ['DEALER', 'ADMIN']},
  {id: 'dealers', label: 'Dealers', roles: ['ADMIN']},
  {id: 'reporting', label: 'Reporting', roles: ['DEALER', 'ADMIN']},
  {id: 'fni-catalog', label: 'F&I Catalog', roles: ['ADMIN']},
  {id: 'audit', label: 'Audit', roles: ['ADMIN']},
];

const dealStages: DealStage[] = [
  'INITIATED',
  'OFFER_SENT',
  'BUYER_CONFIRMED',
  'DEPOSIT_PAID',
  'DOCUMENTS_PENDING',
  'READY_FOR_HANDOFF',
  'COMPLETED',
  'CANCELED',
];

const subscriptionPlans: SubscriptionPlan[] = ['STARTER', 'GROWTH', 'PERFORMANCE'];
const subscriptionStatuses: SubscriptionStatus[] = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED'];

const demoAccounts = [
  {label: 'Admin', email: 'admin@stealadeal.local', password: 'Admin123!'},
  {label: 'Dealer', email: 'dealer1@stealadeal.local', password: 'Dealer123!'},
  {label: 'Buyer', email: 'jordan@example.com', password: 'Buyer123!'},
];

const MAX_COMPARE = 3;
// Client-side estimate so the budget slider reflects an all-in number
// (final tax is set by the dealer at contract). ~7% blended sales tax.
const EST_TAX_RATE = 0.07;
const INVENTORY_PAGE_SIZE = 12;

const NAV_VIEWS: NavView[] = [
  'overview',
  'inventory',
  'vehicle',
  'compare',
  'garage',
  'leads',
  'appointments',
  'deal-room',
  'deal-desk',
  'dealers',
  'reporting',
  'fni-catalog',
  'audit',
  'about',
  'terms',
  'dealer-terms',
  'privacy',
  'faq',
  'contact',
  'dealer-profile',
];

export default function App() {
  const initialUrl = useMemo(() => readUrlState(), []);
  const [activeView, setActiveView] = useState<NavView>(
    initialUrl.view && (NAV_VIEWS as string[]).includes(initialUrl.view)
      ? (initialUrl.view as NavView)
      : 'overview',
  );
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    initialUrl.vehicle,
  );
  const [depositConfirmOpen, setDepositConfirmOpen] = useState(false);
  const [dealerProfileId, setDealerProfileId] = useState<number | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [lightbox, setLightbox] = useState<{
    images: string[];
    index: number;
    alt: string;
  } | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authReason, setAuthReason] = useState<string | null>(null);
  const [matchAnswers, setMatchAnswers] = useState<MatchAnswers | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [readinessAck, setReadinessAck] = useState({
    financing: false,
    paperwork: false,
  });
  const [readinessHidden, setReadinessHidden] = useState(false);
  const [compareVehicleIds, setCompareVehicleIds] = useState<number[]>([]);
  const toggleCompareVehicle = useCallback((vehicleId: number) => {
    setCompareVehicleIds(current => {
      if (current.includes(vehicleId)) {
        return current.filter(id => id !== vehicleId);
      }
      if (current.length >= MAX_COMPARE) {
        return current;
      }
      return [...current, vehicleId];
    });
  }, []);
  const removeCompareVehicle = useCallback((vehicleId: number) => {
    setCompareVehicleIds(current => current.filter(id => id !== vehicleId));
  }, []);
  const clearCompare = useCallback(() => setCompareVehicleIds([]), []);
  const [listingQuery, setListingQuery] = useState('');
  const [listingStatus, setListingStatus] = useState<'ALL' | Vehicle['status']>('LIVE');
  const [maxListingPrice, setMaxListingPrice] = useState(45000);
  const [filterMake, setFilterMake] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterMinYear, setFilterMinYear] = useState(0);
  const [filterMaxMileage, setFilterMaxMileage] = useState(0);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [listingActiveImages, setListingActiveImages] = useState<Record<number, string>>({});
  const [detailActiveImage, setDetailActiveImage] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [pendingAuthEmail, setPendingAuthEmail] = useState<string | null>(null);
  const [pendingRegister, setPendingRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    displayName: '',
    email: '',
    password: '',
    role: 'BUYER' as UserRole,
    dealerId: '',
  });

  const loadVehicles = useCallback(() => api.listVehicles(), []);
  const loadLiveVehicles = useCallback(() => api.listVehicles({status: 'LIVE'}), []);
  const loadDealers = useCallback(() => api.listDealers(), []);
  const loadLeads = useCallback(() => api.listLeads(), []);
  const loadAppointments = useCallback(() => api.listAppointments(), []);
  const loadDeals = useCallback(() => api.listDeals(), []);
  const loadDashboard = useCallback(() => api.getDashboard(), []);
  const loadCurrentUser = useCallback(() => api.getCurrentUser(), []);
  const vehicles = useRemoteResource(loadVehicles);
  const liveVehicles = useRemoteResource(loadLiveVehicles);
  const dealers = useRemoteResource(loadDealers);
  const leads = useRemoteResource(loadLeads);
  const appointments = useRemoteResource(loadAppointments);
  const deals = useRemoteResource(loadDeals);
  const dashboard = useRemoteResource<Dashboard>(loadDashboard);
  const currentUser = useRemoteResource<CurrentUser>(loadCurrentUser);
  const currentRole = currentUser.data?.role ?? 'BUYER';
  const authChecked = !currentUser.loading || currentUser.data != null;
  const isGuest = authChecked && !currentUser.data;
  const wasAuthed = React.useRef(false);

  // Buyers & guests shop on a light canvas (conversion/trust);
  // dealer/admin operate on the dark ops theme.
  const themeMode =
    currentUser.data?.role === 'DEALER' || currentUser.data?.role === 'ADMIN'
      ? 'dark'
      : 'light';
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = themeMode;
    }
  }, [themeMode]);
  useEffect(() => {
    if (currentUser.data) {
      wasAuthed.current = true;
    }
  }, [currentUser.data]);

  // Views a signed-out visitor may browse freely.
  const guestViews: NavView[] = ['inventory', 'vehicle', 'compare'];
  const visibleNavItems = useMemo(() => {
    const byRole = navItems.filter(
      item => !item.roles || item.roles.includes(currentRole),
    );
    if (isGuest) {
      return byRole.filter(item => guestViews.includes(item.id));
    }
    return byRole;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRole, isGuest]);
  // Footer-only informational pages are valid for every role even
  // though they are not in the sidebar nav.
  const STANDALONE_VIEWS: NavView[] = [
    'about',
    'terms',
    'dealer-terms',
    'privacy',
    'faq',
    'contact',
    'dealer-profile',
  ];
  useEffect(() => {
    if (
      !STANDALONE_VIEWS.includes(activeView) &&
      !visibleNavItems.some(item => item.id === activeView)
    ) {
      setActiveView(
        visibleNavItems[0]?.id ?? (isGuest ? 'inventory' : 'overview'),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, visibleNavItems, isGuest]);

  const requireAuth = useCallback(
    (reason: string): boolean => {
      if (currentUser.data) {
        return true;
      }
      setAuthReason(reason);
      setShowAuth(true);
      return false;
    },
    [currentUser.data],
  );

  // Buyer engagement: favorites + saved searches (auth-only; guarded
  // loaders avoid spurious 401s while browsing as a guest).
  const loadFavorites = useCallback(
    () =>
      currentUser.data
        ? api.listFavorites()
        : Promise.resolve([] as Favorite[]),
    [currentUser.data],
  );
  const favorites = useRemoteResource(loadFavorites);
  const favoriteIds = useMemo(
    () => new Set((favorites.data ?? []).map(f => f.vehicleId)),
    [favorites.data],
  );
  const loadSavedSearches = useCallback(
    () =>
      currentUser.data
        ? api.listSavedSearches()
        : Promise.resolve([] as SavedSearch[]),
    [currentUser.data],
  );
  const savedSearches = useRemoteResource(loadSavedSearches);
  const [pendingFavoriteId, setPendingFavoriteId] = useState<number | null>(
    null,
  );
  const toggleFavorite = useCallback(
    async (vehicleId: number) => {
      if (
        !requireAuth('Create a free account to save cars to your garage.')
      ) {
        return;
      }
      setPendingFavoriteId(vehicleId);
      try {
        if (favoriteIds.has(vehicleId)) {
          await api.removeFavorite(vehicleId);
          toast.success('Removed from your garage.');
        } else {
          await api.addFavorite(vehicleId);
          toast.success('Saved to your garage.');
        }
        await favorites.refresh();
      } catch (error) {
        toast.error(toUserMessage(error));
      } finally {
        setPendingFavoriteId(null);
      }
    },
    [favoriteIds, favorites, requireAuth],
  );

  const applySavedSearch = useCallback(
    (s: SavedSearch) => {
      const q = s.query;
      setListingQuery(q.q ?? '');
      setFilterMake(q.make ?? '');
      setFilterModel(q.model ?? '');
      setFilterMinYear(q.minYear ?? 0);
      setFilterMaxMileage(q.maxMileage ?? 0);
      setListingStatus(
        q.status && q.status !== 'LIVE'
          ? (q.status as 'ALL' | Vehicle['status'])
          : 'LIVE',
      );
      if (q.maxPrice) setMaxListingPrice(q.maxPrice);
      setInventoryPage(1);
      setActiveView('inventory');
      toast.success(`Applied “${s.name}”.`);
    },
    [],
  );

  const buildCurrentQuery = useCallback(
    (): SavedSearchInput['query'] => ({
      q: listingQuery.trim() || null,
      make: filterMake || null,
      model: filterModel || null,
      minPrice: null,
      maxPrice: maxListingPrice,
      minYear: filterMinYear || null,
      maxMileage: filterMaxMileage || null,
      status: listingStatus === 'ALL' ? null : listingStatus,
    }),
    [
      listingQuery,
      filterMake,
      filterModel,
      maxListingPrice,
      filterMinYear,
      filterMaxMileage,
      listingStatus,
    ],
  );

  const saveCurrentSearch = useCallback(async () => {
    if (!requireAuth('Create a free account to save searches and alerts.')) {
      return;
    }
    const query = buildCurrentQuery();
    const name =
      [filterMake, filterModel, listingQuery.trim()]
        .filter(Boolean)
        .join(' ') || 'My search';
    try {
      await api.createSavedSearch({name, query, alertOnPriceDrop: true});
      await savedSearches.refresh();
      toast.success(`Saved “${name}” — manage it in My Garage.`);
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }, [
    requireAuth,
    buildCurrentQuery,
    filterMake,
    filterModel,
    listingQuery,
    savedSearches,
  ]);

  const toggleSavedSearchAlert = useCallback(
    async (s: SavedSearch) => {
      try {
        await api.updateSavedSearch(s.id, {
          name: s.name,
          query: s.query,
          alertOnPriceDrop: !s.alertOnPriceDrop,
        });
        await savedSearches.refresh();
      } catch (error) {
        toast.error(toUserMessage(error));
      }
    },
    [savedSearches],
  );

  const renameSavedSearch = useCallback(
    async (s: SavedSearch, name: string) => {
      try {
        await api.updateSavedSearch(s.id, {
          name,
          query: s.query,
          alertOnPriceDrop: s.alertOnPriceDrop,
        });
        await savedSearches.refresh();
        toast.success(`Renamed to “${name}”.`);
      } catch (error) {
        toast.error(toUserMessage(error));
      }
    },
    [savedSearches],
  );

  const deleteSavedSearch = useCallback(
    async (id: number) => {
      try {
        await api.deleteSavedSearch(id);
        await savedSearches.refresh();
        toast.success('Saved search deleted.');
      } catch (error) {
        toast.error(toUserMessage(error));
      }
    },
    [savedSearches],
  );

  const participantContext = useMemo(() => {
    if (!currentUser.data) {
      return {type: 'BUYER' as ParticipantType, reference: 'buyer@example.com'};
    }

    if (currentUser.data.role === 'DEALER' && currentUser.data.dealerId) {
      return {type: 'DEALER' as ParticipantType, reference: String(currentUser.data.dealerId)};
    }

    if (currentUser.data.role === 'ADMIN') {
      return {type: 'ADMIN' as ParticipantType, reference: currentUser.data.email};
    }

    return {type: 'BUYER' as ParticipantType, reference: currentUser.data.email};
  }, [currentUser.data]);
  const buyerIdentity = useMemo(
    () => ({
      name: currentUser.data?.displayName ?? 'Guest',
      email: currentUser.data?.email ?? 'buyer@example.com',
    }),
    [currentUser.data],
  );
  const loadAssigneeTasks = useCallback(
    () =>
      api.listTasksForAssignee({
        assigneeType: participantContext.type,
        assigneeReference: participantContext.reference,
      }),
    [participantContext.reference, participantContext.type],
  );
  const loadNotifications = useCallback(
    () =>
      api.listNotifications({
        recipientType: participantContext.type,
        recipientReference: participantContext.reference,
      }),
    [participantContext.reference, participantContext.type],
  );
  const loadBuyerInbox = useCallback(
    () => api.getBuyerInbox(buyerIdentity.email),
    [buyerIdentity.email],
  );
  const assigneeTasks = useRemoteResource(loadAssigneeTasks);
  const notifications = useRemoteResource(loadNotifications);
  const buyerInbox = useRemoteResource(loadBuyerInbox);
  const [selectedDealerId, setSelectedDealerId] = useState<number | null>(
    initialUrl.dealer,
  );

  useEffect(() => {
    if (!selectedDealerId && (dealers.data?.length ?? 0) > 0) {
      setSelectedDealerId(dealers.data?.[0].id ?? null);
    }
  }, [dealers.data, selectedDealerId]);

  // Self-serve: a signed-in DEALER always operates on their own
  // dealership — no admin dealer picker. Bind dealer-scoped resources
  // (portal, onboarding, queue, subscription, leads, appointments) to
  // the JWT's dealerId.
  useEffect(() => {
    const u = currentUser.data;
    if (
      u?.role === 'DEALER' &&
      u.dealerId != null &&
      selectedDealerId !== u.dealerId
    ) {
      setSelectedDealerId(u.dealerId);
    }
  }, [currentUser.data, selectedDealerId]);

  // Keep the URL in sync so deep links, refresh, and Back all work.
  const lastViewRef = React.useRef(activeView);
  useEffect(() => {
    const pushEntry = lastViewRef.current !== activeView;
    lastViewRef.current = activeView;
    writeUrlState(
      {view: activeView, vehicle: selectedVehicleId, dealer: selectedDealerId},
      pushEntry,
    );
  }, [activeView, selectedVehicleId, selectedDealerId]);

  useEffect(
    () =>
      onUrlPop(state => {
        if (state.view && (NAV_VIEWS as string[]).includes(state.view)) {
          setActiveView(state.view as NavView);
        }
        setSelectedVehicleId(state.vehicle);
        if (state.dealer != null) {
          setSelectedDealerId(state.dealer);
        }
      }),
    [],
  );

  useEffect(() => {
    const onUnauthorized = () => {
      // Only a *real* timeout (user was signed in) shows the expiry
      // banner. A guest's initial /api/auth/me probe is not an error.
      if (wasAuthed.current) {
        setSessionExpired(true);
        setShowAuth(true);
      }
    };
    window.addEventListener('stealadeal:unauthorized', onUnauthorized);
    return () =>
      window.removeEventListener('stealadeal:unauthorized', onUnauthorized);
  }, []);

  const loadDealerPortal = useCallback(
    () =>
      selectedDealerId
        ? api.getDealerPortal(selectedDealerId)
        : Promise.resolve(null),
    [selectedDealerId],
  );
  const loadDealerQueue = useCallback(
    () =>
      selectedDealerId
        ? api.getDealerDealQueue(selectedDealerId)
        : Promise.resolve(null),
    [selectedDealerId],
  );
  const loadDealerOnboarding = useCallback(
    () =>
      selectedDealerId
        ? api.getDealerOnboarding(selectedDealerId)
        : Promise.resolve(null),
    [selectedDealerId],
  );
  const loadDealerInbox = useCallback(
    () =>
      selectedDealerId
        ? api.getDealerInbox(selectedDealerId)
        : Promise.resolve(null),
    [selectedDealerId],
  );
  const loadDealerSubscription = useCallback(
    () =>
      selectedDealerId
        ? api.getDealerPortalSubscription(selectedDealerId)
        : Promise.resolve(null),
    [selectedDealerId],
  );
  const loadDealerInvoices = useCallback(
    () =>
      selectedDealerId
        ? api.listDealerPortalInvoices(selectedDealerId)
        : Promise.resolve([]),
    [selectedDealerId],
  );
  const loadDealerPortalDeals = useCallback(
    () =>
      selectedDealerId
        ? api.listDealerPortalDeals(selectedDealerId)
        : Promise.resolve([] as PortalDealItem[]),
    [selectedDealerId],
  );
  const loadDealerPortalLeads = useCallback(
    () =>
      selectedDealerId
        ? api.listDealerPortalLeads(selectedDealerId)
        : Promise.resolve([] as PortalLeadItem[]),
    [selectedDealerId],
  );
  const loadDealerPortalAppointments = useCallback(
    () =>
      selectedDealerId
        ? api.listDealerPortalAppointments(selectedDealerId)
        : Promise.resolve([] as PortalAppointmentItem[]),
    [selectedDealerId],
  );
  const loadDealerPortalDocuments = useCallback(
    () =>
      selectedDealerId
        ? api.listDealerPortalDocuments(selectedDealerId)
        : Promise.resolve([] as PortalDocumentItem[]),
    [selectedDealerId],
  );
  const loadDealerProfile = useCallback(
    () =>
      dealerProfileId
        ? api.getDealer(dealerProfileId)
        : Promise.resolve(null),
    [dealerProfileId],
  );
  const loadDealerProfileVehicles = useCallback(
    () =>
      dealerProfileId
        ? api.listVehicles({dealerId: dealerProfileId})
        : Promise.resolve([] as Vehicle[]),
    [dealerProfileId],
  );
  const dealerProfile = useRemoteResource(loadDealerProfile);
  const dealerProfileVehicles = useRemoteResource(loadDealerProfileVehicles);
  const dealerPortal = useRemoteResource(loadDealerPortal);
  const dealerOnboarding = useRemoteResource(loadDealerOnboarding);
  const dealerQueue = useRemoteResource(loadDealerQueue);
  const dealerInbox = useRemoteResource(loadDealerInbox);
  const dealerSubscription = useRemoteResource(loadDealerSubscription);
  const dealerInvoices = useRemoteResource(loadDealerInvoices);
  const dealerPortalDeals = useRemoteResource(loadDealerPortalDeals);
  const dealerPortalLeads = useRemoteResource(loadDealerPortalLeads);
  const dealerPortalAppointments = useRemoteResource(loadDealerPortalAppointments);
  const dealerPortalDocuments = useRemoteResource(loadDealerPortalDocuments);

  useEffect(() => {
    if (!selectedVehicleId && vehicles.data && vehicles.data.length > 0) {
      setSelectedVehicleId(vehicles.data[0].id);
    }
  }, [selectedVehicleId, vehicles.data]);

  const selectedVehicle = useMemo(
    () =>
      vehicles.data?.find(vehicle => vehicle.id === selectedVehicleId) ??
      liveVehicles.data?.[0] ??
      null,
    [liveVehicles.data, selectedVehicleId, vehicles.data],
  );

  useEffect(() => {
    if (!selectedVehicle) {
      setDetailActiveImage(null);
      return;
    }

    const gallery = getVehicleGallery(selectedVehicle);
    setDetailActiveImage(current =>
      current && gallery.includes(current) ? current : gallery[0] ?? null,
    );
  }, [selectedVehicle]);

  const loadVehicleDetail = useCallback(
    () =>
      selectedVehicleId
        ? api.getVehicle(selectedVehicleId)
        : Promise.resolve(null as Vehicle | null),
    [selectedVehicleId],
  );
  const vehicleDetail = useRemoteResource(loadVehicleDetail);
  const loadVehicleHistory = useCallback(
    () =>
      selectedVehicleId
        ? api.getVehicleHistory(selectedVehicleId)
        : Promise.resolve(null as VehicleHistoryReport | null),
    [selectedVehicleId],
  );
  const vehicleHistory = useRemoteResource(loadVehicleHistory);

  const filteredAppointments = useMemo(
    () =>
      appointments.data?.filter(appointment =>
        selectedVehicleId ? appointment.vehicleId === selectedVehicleId : true,
      ) ?? [],
    [appointments.data, selectedVehicleId],
  );
  const selectedDeal = useMemo(
    () =>
      deals.data?.find(deal =>
        selectedVehicleId ? deal.vehicleId === selectedVehicleId : false,
      ) ?? null,
    [deals.data, selectedVehicleId],
  );
  const loadSelectedDealDocuments = useCallback(
    () =>
      selectedDeal ? api.listDealDocuments(selectedDeal.id) : Promise.resolve([] as DealDocument[]),
    [selectedDeal],
  );
  const loadSelectedDealReadiness = useCallback(
    () => (selectedDeal ? api.getDealReadiness(selectedDeal.id) : Promise.resolve(null)),
    [selectedDeal],
  );
  const loadSelectedDealTasks = useCallback(
    () => (selectedDeal ? api.listDealTasks(selectedDeal.id) : Promise.resolve([] as DealTask[])),
    [selectedDeal],
  );
  const loadSelectedDealActivity = useCallback(
    () =>
      selectedDeal ? api.listDealActivity(selectedDeal.id) : Promise.resolve([] as DealActivity[]),
    [selectedDeal],
  );
  const dealDocuments = useRemoteResource(loadSelectedDealDocuments);
  const dealReadiness = useRemoteResource<DealReadiness | null>(loadSelectedDealReadiness);
  const dealTasks = useRemoteResource(loadSelectedDealTasks);
  const dealActivity = useRemoteResource(loadSelectedDealActivity);

  const buyerListingVehicles = useMemo(() => {
    const normalizedQuery = listingQuery.trim().toLowerCase();

    return (vehicles.data ?? []).filter(vehicle => {
      const matchesStatus =
        listingStatus === 'ALL' ? true : vehicle.status === listingStatus;
      // Budget slider is all-in: vehicle price + estimated tax.
      const matchesPrice =
        Math.round(vehicle.price * (1 + EST_TAX_RATE)) <= maxListingPrice;
      const matchesMake =
        !filterMake || vehicle.make === filterMake;
      const matchesModel =
        !filterModel || vehicle.model === filterModel;
      const matchesYear =
        !filterMinYear || vehicle.modelYear >= filterMinYear;
      const matchesMileage =
        !filterMaxMileage || vehicle.mileage <= filterMaxMileage;
      const haystack = [
        vehicle.make,
        vehicle.model,
        vehicle.trim,
        vehicle.dealerName,
        String(vehicle.modelYear),
      ]
        .join(' ')
        .toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 || haystack.includes(normalizedQuery);

      return (
        matchesStatus &&
        matchesPrice &&
        matchesMake &&
        matchesModel &&
        matchesYear &&
        matchesMileage &&
        matchesQuery
      );
    });
  }, [
    listingQuery,
    listingStatus,
    maxListingPrice,
    filterMake,
    filterModel,
    filterMinYear,
    filterMaxMileage,
    vehicles.data,
  ]);

  const inventoryPageCount = Math.max(
    1,
    Math.ceil(buyerListingVehicles.length / INVENTORY_PAGE_SIZE),
  );
  // Clamp the page when the filtered result set shrinks/changes.
  useEffect(() => {
    if (inventoryPage > inventoryPageCount) {
      setInventoryPage(1);
    }
  }, [inventoryPage, inventoryPageCount]);
  // Reset to page 1 whenever the filters/search change.
  useEffect(() => {
    setInventoryPage(1);
  }, [
    listingQuery,
    listingStatus,
    maxListingPrice,
    filterMake,
    filterModel,
    filterMinYear,
    filterMaxMileage,
  ]);
  // Per-vehicle buyer insights (deal score always; match % when the
  // quiz has been taken). Transparent, derived from listed inventory.
  const vehicleInsights = useMemo(() => {
    const all = vehicles.data ?? [];
    const map = new Map<
      number,
      {deal: ReturnType<typeof dealScore>; matchPct: number | null}
    >();
    for (const vehicle of all) {
      map.set(vehicle.id, {
        deal: dealScore(vehicle, all),
        matchPct: matchAnswers
          ? matchPercent(vehicle, matchAnswers, all)
          : null,
      });
    }
    return map;
  }, [vehicles.data, matchAnswers]);

  // When the quiz is active, rank the filtered list by match % so the
  // best fits surface first (applied before pagination).
  const rankedListingVehicles = useMemo(() => {
    if (!matchAnswers) return buyerListingVehicles;
    return [...buyerListingVehicles].sort(
      (a, b) =>
        (vehicleInsights.get(b.id)?.matchPct ?? 0) -
        (vehicleInsights.get(a.id)?.matchPct ?? 0),
    );
  }, [buyerListingVehicles, matchAnswers, vehicleInsights]);

  const pagedListingVehicles = useMemo(
    () =>
      rankedListingVehicles.slice(
        (inventoryPage - 1) * INVENTORY_PAGE_SIZE,
        inventoryPage * INVENTORY_PAGE_SIZE,
      ),
    [rankedListingVehicles, inventoryPage],
  );

  const readinessSteps = useMemo(
    () => [
      {
        id: 'budget',
        label: 'Know your all-in budget',
        done: matchAnswers != null,
        help: 'Your real budget includes sales tax, title, and fees — not just the sticker price. Use "Find your match" to set an all-in number; the budget slider already factors in an estimated tax.',
      },
      {
        id: 'financing',
        label: 'Understand monthly payment basics',
        done: readinessAck.financing,
        ackable: true,
        onAck: () =>
          setReadinessAck(prev => ({...prev, financing: true})),
        help: 'Your payment is driven by price, down payment, loan term, and APR. A bigger down payment or shorter term lowers total interest. Open any car to try the payment estimator — it is an estimate, not an offer.',
      },
      {
        id: 'compare',
        label: 'Compare at least 2 cars',
        done: compareVehicleIds.length >= 2,
        help: 'Comparing side by side keeps you from anchoring on the first car you liked. Tick "Compare" on a few listings, then open the Compare view — the best value in each row is highlighted.',
      },
      {
        id: 'paperwork',
        label: 'Know the paperwork you’ll need',
        done: readinessAck.paperwork,
        ackable: true,
        onAck: () =>
          setReadinessAck(prev => ({...prev, paperwork: true})),
        help: "You'll typically need a driver's license, proof of insurance, the buyer's agreement, and an odometer disclosure. The dealer prepares these — you review and sign in the deal room.",
      },
      {
        id: 'shortlist',
        label: 'Shortlist a car to act on',
        done: selectedVehicleId != null,
        help: 'Open a vehicle’s details to shortlist it. From there you can ask the dealer a question, book a test drive, or start a purchase — no obligation.',
      },
    ],
    [matchAnswers, readinessAck, compareVehicleIds.length, selectedVehicleId],
  );

  const compareVehicles = useMemo(() => {
    const lookup = new Map((vehicles.data ?? []).map(vehicle => [vehicle.id, vehicle]));
    return compareVehicleIds
      .map(id => lookup.get(id))
      .filter((vehicle): vehicle is Vehicle => Boolean(vehicle));
  }, [compareVehicleIds, vehicles.data]);

  const [leadMessage, setLeadMessage] = useState<string | null>(null);
  const [appointmentMessage, setAppointmentMessage] = useState<string | null>(null);
  const [dealMessage, setDealMessage] = useState<string | null>(null);
  const [pendingLead, setPendingLead] = useState(false);
  const [pendingAppointment, setPendingAppointment] = useState(false);
  const [pendingDeal, setPendingDeal] = useState(false);
  const [pendingDeposit, setPendingDeposit] = useState(false);
  const [pendingDocument, setPendingDocument] = useState(false);
  const [pendingStageUpdate, setPendingStageUpdate] = useState(false);
  const [pendingFulfillment, setPendingFulfillment] = useState(false);
  const [tradeInEnabled, setTradeInEnabled] = useState(false);
  const [tradeInVin, setTradeInVin] = useState('');
  const [tradeInMileage, setTradeInMileage] = useState('');
  const tradeInVinError =
    tradeInEnabled && tradeInVin.trim().length > 0 &&
    !/^[A-HJ-NPR-Z0-9]{11,17}$/i.test(tradeInVin.trim())
      ? 'Enter a valid VIN (11–17 letters and numbers).'
      : null;
  const tradeInMileageError =
    tradeInEnabled && tradeInMileage.trim().length > 0 &&
    !/^\d{1,7}$/.test(tradeInMileage.trim())
      ? 'Mileage must be a whole number.'
      : null;
  const tradeInValid =
    !tradeInEnabled || (!tradeInVinError && !tradeInMileageError);
  const [pendingNotificationId, setPendingNotificationId] = useState<number | null>(null);
  const [pendingTaskId, setPendingTaskId] = useState<number | null>(null);
  const [pendingLeadId, setPendingLeadId] = useState<number | null>(null);
  const [pendingAppointmentId, setPendingAppointmentId] = useState<number | null>(null);
  const [pendingDealerId, setPendingDealerId] = useState<number | null>(null);
  const [pendingDealerInventoryId, setPendingDealerInventoryId] = useState<number | null>(null);
  const [pendingInventoryUpload, setPendingInventoryUpload] = useState(false);
  const [inventoryUploadMode, setInventoryUploadMode] =
    useState<InventoryUploadMode>('UPSERT');
  const [inventoryUploadFile, setInventoryUploadFile] = useState<File | null>(null);
  const [inventoryUploadMessage, setInventoryUploadMessage] = useState<string | null>(null);
  const [inventoryUploadResult, setInventoryUploadResult] = useState<InventoryUploadResponse | null>(
    null,
  );
  const [dealerInventoryCounts, setDealerInventoryCounts] = useState<Record<number, number>>({});
  const [dealerInventoryRows, setDealerInventoryRows] = useState<Vehicle[]>([]);
  const [dealerInventoryLabel, setDealerInventoryLabel] = useState<string | null>(null);
  const [dealerActionMessages, setDealerActionMessages] = useState<Record<number, string>>({});
  const [dealerForm, setDealerForm] = useState({
    name: '',
    licenseNumber: '',
    city: '',
    state: '',
  });
  const [editingDealerId, setEditingDealerId] = useState<number | null>(null);
  const [pendingDealerSave, setPendingDealerSave] = useState(false);
  const [pendingDocumentStatuses, setPendingDocumentStatuses] = useState<
    Record<number, boolean>
  >({});
  const [vehicleForm, setVehicleForm] = useState({
    dealerId: '',
    vin: '',
    modelYear: '',
    make: '',
    model: '',
    trim: '',
    imageUrls: '',
    mileage: '',
    price: '',
    status: 'DRAFT' as Vehicle['status'],
  });
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [pendingVehicleSave, setPendingVehicleSave] = useState(false);
  const [pendingSubscriptionSave, setPendingSubscriptionSave] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState<{
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    autoRenew: boolean;
  } | null>(null);

  useEffect(() => {
    if (!dealerSubscription.data) {
      setSubscriptionForm(null);
      return;
    }

    setSubscriptionForm({
      plan: dealerSubscription.data!.plan,
      status: dealerSubscription.data!.status,
      autoRenew: dealerSubscription.data!.autoRenew,
    });
  }, [dealerSubscription.data]);

  const createLead = useCallback(async () => {
    if (!selectedVehicleId) {
      return;
    }

    setPendingLead(true);
    setLeadMessage(null);

    try {
      const lead = await api.createLead(selectedVehicleId, {
        buyerName: buyerIdentity.name,
        buyerEmail: buyerIdentity.email,
        buyerPhone: '555-0100',
        message: "Hi — I'm interested in this car. Can you share pricing details and next steps?",
      });
      await leads.refresh();
      setLeadMessage(`Lead #${lead.id} created with status ${lead.status}.`);
      setActiveView('leads');
    } catch (error) {
      setLeadMessage(getErrorMessage(error));
    } finally {
      setPendingLead(false);
    }
  }, [buyerIdentity.email, buyerIdentity.name, leads, selectedVehicleId]);

  const createAppointment = useCallback(async () => {
    if (!selectedVehicleId) {
      return;
    }

    setPendingAppointment(true);
    setAppointmentMessage(null);

    try {
      const appointment = await api.createAppointment(selectedVehicleId, {
        buyerName: buyerIdentity.name,
        buyerEmail: buyerIdentity.email,
        type: 'TEST_DRIVE',
        scheduledAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      });
      await appointments.refresh();
      setAppointmentMessage(
        `Appointment #${appointment.id} requested for ${formatDateTime(
          appointment.scheduledAt,
        )}.`,
      );
      setActiveView('appointments');
    } catch (error) {
      setAppointmentMessage(getErrorMessage(error));
    } finally {
      setPendingAppointment(false);
    }
  }, [appointments, buyerIdentity.email, buyerIdentity.name, selectedVehicleId]);

  const createDeal = useCallback(async () => {
    if (!selectedVehicleId) {
      return;
    }

    setPendingDeal(true);
    setDealMessage(null);

    try {
      const deal = await api.createDeal({
        vehicleId: selectedVehicleId,
        buyerName: buyerIdentity.name,
        buyerEmail: buyerIdentity.email,
        buyerPhone: '555-0100',
        buyerAddressLine1: '100 Market Street',
        buyerAddressLine2: null,
        buyerCity: 'San Francisco',
        buyerState: 'CA',
        buyerPostalCode: '94105',
        fulfillmentType: 'PICKUP',
        tradeIn: tradeInEnabled,
        tradeInVin: tradeInEnabled && tradeInVin.trim() ? tradeInVin.trim().toUpperCase() : null,
        tradeInMileage:
          tradeInEnabled && tradeInMileage.trim()
            ? Number.parseInt(tradeInMileage.trim(), 10)
            : null,
        tradeInOffer: 0,
        deliveryFee: 0,
        discountAmount: 250,
      });
      await deals.refresh();
      setDealMessage(`Deal #${deal.id} started for ${deal.vehicleTitle}.`);
      setActiveView('deal-room');
    } catch (error) {
      setDealMessage(getErrorMessage(error));
    } finally {
      setPendingDeal(false);
    }
  }, [
    buyerIdentity.email,
    buyerIdentity.name,
    deals,
    selectedVehicleId,
    tradeInEnabled,
    tradeInMileage,
    tradeInVin,
  ]);

  const scheduleFulfillment = useCallback(async () => {
    if (!selectedDeal) {
      return;
    }

    setPendingFulfillment(true);
    setDealMessage(null);

    try {
      const updatedDeal = await api.updateDealFulfillment(selectedDeal.id, {
        status: 'SCHEDULED',
        scheduledAt: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
        location: 'Main dealership lot',
        notes: 'Buyer confirmed pickup window.',
      });
      await deals.refresh();
      await dealReadiness.refresh();
      setDealMessage(
        `Fulfillment updated to ${formatLabel(updatedDeal.fulfillmentStatus)} for deal #${updatedDeal.id}.`,
      );
    } catch (error) {
      setDealMessage(getErrorMessage(error));
    } finally {
      setPendingFulfillment(false);
    }
  }, [dealReadiness, deals, selectedDeal]);

  const payDeposit = useCallback(async () => {
    if (!selectedDeal) {
      return;
    }

    setPendingDeposit(true);
    setDealMessage(null);

    const amount = selectedDeal.depositAmount;
    try {
      await api.payDealDeposit(selectedDeal.id, {amount});
      await deals.refresh();
      const paidMessage = `Deposit of ${formatCurrency(amount)} received. A confirmation has been added to your purchase.`;
      setDealMessage(paidMessage);
      toast.success(paidMessage);
      setDepositConfirmOpen(false);
    } catch (error) {
      const message = getErrorMessage(error);
      setDealMessage(message);
      toast.error(message);
      throw error;
    } finally {
      setPendingDeposit(false);
    }
  }, [deals, selectedDeal]);

  const createInsuranceDocument = useCallback(async () => {
    if (!selectedDeal) {
      return;
    }

    setPendingDocument(true);
    setDealMessage(null);

    try {
      const document = await api.createDealDocument(selectedDeal.id, {
        type: 'INSURANCE_PROOF',
        fileName: 'insurance-proof.pdf',
      });
      await dealDocuments.refresh();
      setDealMessage(`Document "${document.fileName}" added.`);
      setActiveView('deal-room');
    } catch (error) {
      setDealMessage(getErrorMessage(error));
    } finally {
      setPendingDocument(false);
    }
  }, [dealDocuments, selectedDeal]);

  const advanceDealStage = useCallback(async () => {
    if (!selectedDeal) {
      return;
    }

    const currentIndex = dealStages.indexOf(selectedDeal.stage);
    const nextStage = dealStages[currentIndex + 1];

    if (!nextStage || selectedDeal.stage === 'COMPLETED' || selectedDeal.stage === 'CANCELED') {
      return;
    }

    setPendingStageUpdate(true);
    setDealMessage(null);

    try {
      const updatedDeal = await api.updateDealStage(selectedDeal.id, {stage: nextStage});
      await deals.refresh();
      setDealMessage(`Deal moved to ${formatLabel(updatedDeal.stage)}.`);
    } catch (error) {
      setDealMessage(getErrorMessage(error));
    } finally {
      setPendingStageUpdate(false);
    }
  }, [deals, selectedDeal]);

  const updateDocumentStatus = useCallback(
    async (documentId: number, status: DocumentStatus) => {
      if (!selectedDeal) {
        return;
      }

      setPendingDocumentStatuses(current => ({...current, [documentId]: true}));
      setDealMessage(null);

      try {
        const updatedDocument = await api.updateDealDocumentStatus(selectedDeal.id, documentId, {
          status,
        });
        await dealDocuments.refresh();
        setDealMessage(
          `${formatLabel(updatedDocument.type)} is now ${formatLabel(updatedDocument.status)}.`,
        );
      } catch (error) {
        setDealMessage(getErrorMessage(error));
      } finally {
        setPendingDocumentStatuses(current => ({...current, [documentId]: false}));
      }
    },
    [dealDocuments, selectedDeal],
  );

  const markNotificationAsRead = useCallback(
    async (notificationId: number) => {
      setPendingNotificationId(notificationId);
      setDealMessage(null);

      try {
        const updated = await api.markNotificationRead(notificationId, true);
        await notifications.refresh();
        setDealMessage(`Notification "${updated.title}" marked as read.`);
      } catch (error) {
        setDealMessage(getErrorMessage(error));
      } finally {
        setPendingNotificationId(null);
      }
    },
    [notifications],
  );

  const markAllNotificationsRead = useCallback(async () => {
    const unread = (notifications.data ?? []).filter(item => !item.read);
    if (unread.length === 0) {
      return;
    }
    try {
      await Promise.all(
        unread.map(item => api.markNotificationRead(item.id, true)),
      );
      await notifications.refresh();
      toast.success('All notifications marked as read.');
    } catch (error) {
      toast.error(toUserMessage(error));
    }
  }, [notifications]);

  // Poll notifications so the bell stays current without a manual refresh.
  useEffect(() => {
    if (!currentUser.data) {
      return;
    }
    const id = window.setInterval(() => {
      notifications.refresh().catch(() => {});
    }, 30000);
    return () => window.clearInterval(id);
  }, [currentUser.data, notifications]);

  const updateBuyerTaskStatus = useCallback(
    async (taskId: number, status: DealTaskStatus) => {
      setPendingTaskId(taskId);
      setDealMessage(null);

      try {
        const updatedTask = await api.updateTaskStatus(taskId, {status});
        await Promise.all([
          buyerInbox.refresh(),
          notifications.refresh(),
          dealTasks.refresh(),
        ]);
        setDealMessage(`Task "${updatedTask.title}" moved to ${formatLabel(updatedTask.status)}.`);
      } catch (error) {
        setDealMessage(getErrorMessage(error));
      } finally {
        setPendingTaskId(null);
      }
    },
    [buyerInbox, dealTasks, notifications],
  );

  const updateLeadStatus = useCallback(
    async (leadId: number, status: Lead['status']) => {
      setPendingLeadId(leadId);
      setLeadMessage(null);

      try {
        const updatedLead = await api.updateLeadStatus(leadId, {status});
        await leads.refresh();
        setLeadMessage(`Lead #${updatedLead.id} moved to ${formatLabel(updatedLead.status)}.`);
      } catch (error) {
        setLeadMessage(getErrorMessage(error));
      } finally {
        setPendingLeadId(null);
      }
    },
    [leads],
  );

  const updateAppointmentStatus = useCallback(
    async (appointmentId: number, status: Appointment['status']) => {
      setPendingAppointmentId(appointmentId);
      setAppointmentMessage(null);

      try {
        const updatedAppointment = await api.updateAppointmentStatus(appointmentId, {status});
        await appointments.refresh();
        setAppointmentMessage(
          `Appointment #${updatedAppointment.id} moved to ${formatLabel(updatedAppointment.status)}.`,
        );
      } catch (error) {
        setAppointmentMessage(getErrorMessage(error));
      } finally {
        setPendingAppointmentId(null);
      }
    },
    [appointments],
  );

  const toggleDealerApproval = useCallback(
    async (dealer: Dealer) => {
      setPendingDealerId(dealer.id);

      try {
        const updatedDealer = await api.updateDealerApproval(dealer.id, {
          approved: !dealer.approved,
        });
        await dealers.refresh();
        setDealerActionMessages(current => ({
          ...current,
          [dealer.id]: `${updatedDealer.name} is now ${
            updatedDealer.approved ? 'approved' : 'pending approval'
          }.`,
        }));
      } catch (error) {
        setDealerActionMessages(current => ({
          ...current,
          [dealer.id]: getErrorMessage(error),
        }));
      } finally {
        setPendingDealerId(null);
      }
    },
    [dealers],
  );

  const loadDealerInventory = useCallback(async (dealer: Dealer) => {
    setPendingDealerInventoryId(dealer.id);

    try {
      const inventory = await api.listDealerInventory(dealer.id);
      setDealerInventoryCounts(current => ({...current, [dealer.id]: inventory.length}));
      setDealerInventoryRows(inventory);
      setDealerInventoryLabel(`${dealer.name} (#${dealer.id})`);
      setDealerActionMessages(current => ({
        ...current,
        [dealer.id]: `${inventory.length} inventory vehicle${inventory.length === 1 ? '' : 's'} found.`,
      }));
    } catch (error) {
      setDealerInventoryRows([]);
      setDealerInventoryLabel(null);
      setDealerActionMessages(current => ({
        ...current,
        [dealer.id]: getErrorMessage(error),
      }));
    } finally {
      setPendingDealerInventoryId(null);
    }
  }, []);

  const uploadDealerInventoryCsv = useCallback(async () => {
    if (!selectedDealerId) {
      setInventoryUploadMessage('Select a dealer before uploading inventory CSV.');
      setInventoryUploadResult(null);
      return;
    }

    if (!inventoryUploadFile) {
      setInventoryUploadMessage('Select a CSV file to upload.');
      setInventoryUploadResult(null);
      return;
    }

    setPendingInventoryUpload(true);
    setInventoryUploadMessage(null);

    try {
      const response = await api.uploadDealerInventoryCsv(
        selectedDealerId,
        {
          mode: inventoryUploadMode,
          file: inventoryUploadFile,
        },
      );
      await vehicles.refresh();
      const loadedInventory = await api.listDealerInventory(selectedDealerId);
      setDealerInventoryCounts(current => ({
        ...current,
        [selectedDealerId]: loadedInventory.length,
      }));
      setInventoryUploadResult(response);
      setInventoryUploadMessage(
        `Uploaded ${response.totalRows} rows (${response.createdCount} created, ${response.updatedCount} updated, ${response.rejectedCount} rejected).`,
      );
      setInventoryUploadFile(null);
    } catch (error) {
      setInventoryUploadResult(null);
      setInventoryUploadMessage(getErrorMessage(error));
    } finally {
      setPendingInventoryUpload(false);
    }
  }, [inventoryUploadFile, inventoryUploadMode, selectedDealerId, vehicles]);

  const resetDealerForm = useCallback(() => {
    setDealerForm({
      name: '',
      licenseNumber: '',
      city: '',
      state: '',
    });
    setEditingDealerId(null);
  }, []);

  const startDealerEdit = useCallback((dealer: Dealer) => {
    setDealerForm({
      name: dealer.name,
      licenseNumber: dealer.licenseNumber,
      city: dealer.city,
      state: dealer.state,
    });
    setEditingDealerId(dealer.id);
  }, []);

  const saveDealer = useCallback(async () => {
    const payload = {
      name: dealerForm.name.trim(),
      licenseNumber: dealerForm.licenseNumber.trim(),
      city: dealerForm.city.trim(),
      state: dealerForm.state.trim().toUpperCase(),
    };

    if (!payload.name || !payload.licenseNumber || !payload.city || payload.state.length !== 2) {
      setDealMessage('Dealer name, license, city, and a 2-letter state are required.');
      return;
    }

    setPendingDealerSave(true);
    setDealMessage(null);

    try {
      const dealer = editingDealerId
        ? await api.updateDealer(editingDealerId, payload)
        : await api.createDealer(payload);
      await dealers.refresh();
      setDealMessage(
        editingDealerId
          ? `Dealer ${dealer.name} updated.`
          : `Dealer ${dealer.name} created.`,
      );
      resetDealerForm();
    } catch (error) {
      setDealMessage(getErrorMessage(error));
    } finally {
      setPendingDealerSave(false);
    }
  }, [dealerForm, dealers, editingDealerId, resetDealerForm]);

  const resetVehicleForm = useCallback(() => {
    setVehicleForm({
      dealerId: '',
      vin: '',
      modelYear: '',
      make: '',
      model: '',
      trim: '',
      imageUrls: '',
      mileage: '',
      price: '',
      status: 'DRAFT',
    });
    setEditingVehicleId(null);
  }, []);

  const startVehicleEdit = useCallback((vehicle: Vehicle) => {
    setVehicleForm({
      dealerId: String(vehicle.dealerId),
      vin: vehicle.vin,
      modelYear: String(vehicle.modelYear),
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      imageUrls: vehicle.imageUrls.join(', '),
      mileage: String(vehicle.mileage),
      price: String(vehicle.price),
      status: vehicle.status,
    });
    setEditingVehicleId(vehicle.id);
  }, []);

  const saveVehicle = useCallback(async () => {
    const parsedImageUrls = vehicleForm.imageUrls
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);

    const payload: CreateVehicleRequest = {
      dealerId: Number(vehicleForm.dealerId),
      vin: vehicleForm.vin.trim().toUpperCase(),
      modelYear: Number(vehicleForm.modelYear),
      make: vehicleForm.make.trim(),
      model: vehicleForm.model.trim(),
      trim: vehicleForm.trim.trim(),
      imageUrls: parsedImageUrls,
      mileage: Number(vehicleForm.mileage),
      price: Number(vehicleForm.price),
      status: vehicleForm.status,
    };

    if (payload.imageUrls.length > MAX_VEHICLE_PHOTOS) {
      setDealMessage(
        `A listing can have at most ${MAX_VEHICLE_PHOTOS} photos. Remove ${
          payload.imageUrls.length - MAX_VEHICLE_PHOTOS
        } to continue.`,
      );
      return;
    }

    if (
      !Number.isFinite(payload.dealerId) ||
      !payload.vin ||
      payload.vin.length !== 17 ||
      !Number.isFinite(payload.modelYear) ||
      !payload.make ||
      !payload.model ||
      !payload.trim ||
      payload.imageUrls.length === 0 ||
      !Number.isFinite(payload.mileage) ||
      !Number.isFinite(payload.price)
    ) {
      setDealMessage('Vehicle form is incomplete. Include dealer, VIN, specs, one image URL, mileage, and price.');
      return;
    }

    setPendingVehicleSave(true);
    setDealMessage(null);

    try {
      const vehicle = editingVehicleId
        ? await api.updateVehicle(editingVehicleId, payload)
        : await api.createVehicle(payload);
      await vehicles.refresh();
      await liveVehicles.refresh();
      setDealMessage(
        editingVehicleId
          ? `Vehicle ${vehicle.modelYear} ${vehicle.make} ${vehicle.model} updated.`
          : `Vehicle ${vehicle.modelYear} ${vehicle.make} ${vehicle.model} created.`,
      );
      resetVehicleForm();
    } catch (error) {
      setDealMessage(getErrorMessage(error));
    } finally {
      setPendingVehicleSave(false);
    }
  }, [editingVehicleId, liveVehicles, resetVehicleForm, vehicleForm, vehicles]);

  const [pendingVin, setPendingVin] = useState(false);
  const createVehicleFromVin = useCallback(async () => {
    const dealerId =
      currentUser.data?.role === 'DEALER'
        ? currentUser.data.dealerId
        : Number(vehicleForm.dealerId);
    if (!dealerId || !Number.isFinite(dealerId)) {
      toast.error('A dealership is required to add a vehicle.');
      return;
    }
    const vin = vehicleForm.vin.trim().toUpperCase();
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      toast.error('Enter a valid 17-character VIN.');
      return;
    }
    const imageUrls = vehicleForm.imageUrls
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (imageUrls.length > MAX_VEHICLE_PHOTOS) {
      toast.error(`A listing can have at most ${MAX_VEHICLE_PHOTOS} photos.`);
      return;
    }
    setPendingVin(true);
    try {
      const v = await api.createVehicleFromVin(dealerId, {
        vin,
        modelYear: vehicleForm.modelYear
          ? Number(vehicleForm.modelYear)
          : null,
        make: vehicleForm.make.trim() || null,
        model: vehicleForm.model.trim() || null,
        trim: vehicleForm.trim.trim() || null,
        imageUrls,
        mileage: Number(vehicleForm.mileage) || 0,
        price: Number(vehicleForm.price) || 0,
        status: vehicleForm.status,
      });
      await Promise.all([vehicles.refresh(), liveVehicles.refresh()]);
      toast.success(
        `Added ${v.modelYear} ${v.make} ${v.model} (decoded from VIN).`,
      );
      resetVehicleForm();
    } catch (error) {
      toast.error(toUserMessage(error));
    } finally {
      setPendingVin(false);
    }
  }, [currentUser.data, vehicleForm, vehicles, liveVehicles, resetVehicleForm]);

  const [pendingHistoryVehicleId, setPendingHistoryVehicleId] = useState<
    number | null
  >(null);
  const uploadVehicleHistoryFile = useCallback(
    async (vehicleId: number, file: File) => {
      const dealerId =
        currentUser.data?.role === 'DEALER'
          ? currentUser.data.dealerId
          : null;
      const targetDealer =
        dealerId ??
        (vehicles.data ?? []).find(v => v.id === vehicleId)?.dealerId ??
        null;
      if (!targetDealer) {
        toast.error('Could not resolve the dealership for this vehicle.');
        return;
      }
      setPendingHistoryVehicleId(vehicleId);
      try {
        await api.uploadVehicleHistory(targetDealer, vehicleId, file);
        toast.success('History report uploaded.');
      } catch (error) {
        toast.error(toUserMessage(error));
      } finally {
        setPendingHistoryVehicleId(null);
      }
    },
    [currentUser.data, vehicles.data],
  );

  const [pendingVehiclePublishId, setPendingVehiclePublishId] = useState<
    number | null
  >(null);
  const toggleVehiclePublish = useCallback(
    async (vehicle: Vehicle) => {
      const next: Vehicle['status'] =
        vehicle.status === 'LIVE' ? 'DRAFT' : 'LIVE';
      setPendingVehiclePublishId(vehicle.id);
      try {
        await api.updateVehicle(vehicle.id, {
          dealerId: vehicle.dealerId,
          vin: vehicle.vin,
          modelYear: vehicle.modelYear,
          make: vehicle.make,
          model: vehicle.model,
          trim: vehicle.trim,
          imageUrls: vehicle.imageUrls ?? [],
          mileage: vehicle.mileage,
          price: vehicle.price,
          status: next,
        });
        setDealerInventoryRows(rows =>
          rows.map(row =>
            row.id === vehicle.id ? {...row, status: next} : row,
          ),
        );
        await Promise.all([vehicles.refresh(), liveVehicles.refresh()]);
        toast.success(
          `${vehicle.modelYear} ${vehicle.make} ${vehicle.model} ${
            next === 'LIVE' ? 'published — now visible to buyers' : 'unpublished'
          }.`,
        );
      } catch (error) {
        toast.error(toUserMessage(error));
      } finally {
        setPendingVehiclePublishId(null);
      }
    },
    [liveVehicles, vehicles],
  );

  const saveSubscription = useCallback(async () => {
    if (!selectedDealerId || !subscriptionForm) {
      setDealMessage('Select a dealer with subscription data before saving changes.');
      return;
    }

    setPendingSubscriptionSave(true);
    setDealMessage(null);

    try {
      const updatedSubscription = await api.updateDealerPortalSubscription(
        selectedDealerId,
        subscriptionForm,
      );
      await dealerSubscription.refresh();
      setSubscriptionForm({
        plan: updatedSubscription.plan,
        status: updatedSubscription.status,
        autoRenew: updatedSubscription.autoRenew,
      });
      setDealMessage(`Subscription updated to ${formatLabel(updatedSubscription.plan)}.`);
    } catch (error) {
      setDealMessage(getErrorMessage(error));
    } finally {
      setPendingSubscriptionSave(false);
    }
  }, [dealerSubscription, selectedDealerId, subscriptionForm]);

  const signInDemoAccount = useCallback(async (account: (typeof demoAccounts)[number]) => {
    setPendingAuthEmail(account.email);
    setAuthMessage(null);

    try {
      const auth = await api.login({email: account.email, password: account.password});
      setAuthSession({token: auth.token, refreshToken: auth.refreshToken});
      window.location.reload();
    } catch (error) {
      setAuthMessage(getErrorMessage(error));
    } finally {
      setPendingAuthEmail(null);
    }
  }, []);

  const signOut = useCallback(() => {
    clearAuthSession();
    window.location.reload();
  }, []);

  const registerAccount = useCallback(async () => {
    const dealerId = Number(registerForm.dealerId);
    const payload = {
      displayName: registerForm.displayName.trim(),
      email: registerForm.email.trim(),
      password: registerForm.password,
      role: registerForm.role,
      ...(registerForm.role === 'DEALER' && Number.isFinite(dealerId) && dealerId > 0
        ? {dealerId}
        : {}),
    };

    if (!payload.displayName || !payload.email || payload.password.length < 8) {
      setAuthMessage('Name, email, and an 8+ character password are required.');
      return;
    }

    setPendingRegister(true);
    setAuthMessage(null);

    try {
      const auth = await api.registerAccount(payload);
      setAuthSession({token: auth.token, refreshToken: auth.refreshToken});
      window.location.reload();
    } catch (error) {
      setAuthMessage(getErrorMessage(error));
    } finally {
      setPendingRegister(false);
    }
  }, [registerForm]);

  const authResolved = authChecked;

  // Auth screen only when explicitly requested (Sign in, or a gated
  // action) — never as a wall in front of public browsing.
  if (showAuth && !currentUser.data) {
    return (
      <>
        <Toaster />
        <AuthScreen
          sessionExpired={sessionExpired}
          reason={authReason}
          onCancel={() => {
            setShowAuth(false);
            setAuthReason(null);
          }}
          onAuthenticated={() => {
            // Tokens live in memory — never reload (it would lose them).
            // Re-fetch the session-scoped user and dismiss the gate.
            setShowAuth(false);
            setAuthReason(null);
            setSessionExpired(false);
            currentUser.refresh().catch(() => {});
          }}
        />
      </>
    );
  }

  if (!authResolved) {
    return (
      <>
        <Toaster />
        <div className="auth-screen">
          <div className="auth-screen-card">
            <p className="brand-kicker">Steal A Deal</p>
            <p className="empty-state">Loading…</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
    <Toaster />
    <ConfirmDialog
      open={depositConfirmOpen}
      title="Confirm your deposit"
      tone="primary"
      pending={pendingDeposit}
      confirmLabel={
        selectedDeal ? `Pay ${formatCurrency(selectedDeal.depositAmount)}` : 'Pay deposit'
      }
      cancelLabel="Not yet"
      body={
        selectedDeal ? (
          <div className="stack">
            <p>
              You're about to pay a deposit of{' '}
              <strong>{formatCurrency(selectedDeal.depositAmount)}</strong> toward{' '}
              <strong>{selectedDeal.vehicleTitle}</strong>.
            </p>
            <p className="dialog-fine">
              This is applied to your purchase total of{' '}
              {formatCurrency(selectedDeal.totalAmount)}. You'll get a confirmation
              on this page once it's processed.
            </p>
          </div>
        ) : null
      }
      onCancel={() => setDepositConfirmOpen(false)}
      onConfirm={() => {
        payDeposit().catch(() => {});
      }}
    />
    {lightbox ? (
      <Lightbox
        images={lightbox.images}
        startIndex={lightbox.index}
        alt={lightbox.alt}
        onClose={() => setLightbox(null)}
      />
    ) : null}
    <MatchQuiz
      open={quizOpen}
      initial={matchAnswers}
      onClose={() => setQuizOpen(false)}
      onApply={answers => {
        setMatchAnswers(answers);
        setQuizOpen(false);
        setInventoryPage(1);
        setActiveView('inventory');
      }}
    />
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
    <div className="shell">
      <aside className="sidebar">
        <div>
          <p className="brand-kicker">Steal A Deal</p>
          <h1 className="brand-title">Find your car, your way</h1>
          <p className="brand-copy">
            Browse dealer-verified cars with transparent pricing. No pressure, no haggling.
          </p>
        </div>

        <nav className="nav" aria-label="Primary">
          {visibleNavItems.map(item => (
            <button
              key={item.id}
              className={item.id === activeView ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveView(item.id)}
              aria-current={item.id === activeView ? 'page' : undefined}
              type="button">
              {item.label}
            </button>
          ))}
        </nav>

        <div className="auth-panel">
          {currentUser.data ? (
            <>
              <p className="auth-panel-title">Signed in</p>
              <div className="auth-identity">
                <strong>{currentUser.data.displayName}</strong>
                <span>{currentUser.data.email}</span>
                <span className="auth-role-chip">
                  {formatLabel(currentUser.data.role)}
                </span>
              </div>
              <button type="button" className="ghost-button" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <p className="auth-panel-title">Browsing as guest</p>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setAuthReason(null);
                  setShowAuth(true);
                }}>
                Sign in / Create account
              </button>
            </>
          )}
        </div>

      </aside>

      <main className="content" id="main-content" tabIndex={-1}>
        <header className="hero">
          <div>
            <p className="hero-eyebrow">Find your car</p>
            <h2 className="hero-title">Find the right car, without the dealership noise.</h2>
            <p className="hero-copy">
              Explore live inventory, compare cars, and estimate your payment —
              then message a dealer or book a test drive when you're ready.
            </p>
          </div>
          <div className="hero-actions hero-actions-row">
            {featureFlags.notificationsBell ? (
              <NotificationsBell
                notifications={notifications.data ?? []}
                pendingNotificationId={pendingNotificationId}
                onMarkRead={notificationId => markNotificationAsRead(notificationId)}
                onMarkAllRead={markAllNotificationsRead}
              />
            ) : null}
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                vehicles.refresh().catch((error: unknown) => toast.error(toUserMessage(error)));
              }}>
              Refresh inventory
            </button>
            <button type="button" className="secondary-button" onClick={() => setActiveView('vehicle')}>
              Open selected vehicle
            </button>
          </div>
        </header>

        {leadMessage ? (
          <div className={leadMessage.includes('created') ? 'notice success' : 'notice error'}>
            {leadMessage}
          </div>
        ) : null}
        {appointmentMessage ? (
          <div
            className={
              appointmentMessage.includes('Appointment #') ? 'notice success' : 'notice error'
            }>
            {appointmentMessage}
          </div>
        ) : null}
        {dealMessage ? (
          <div className={dealMessage.includes('#') ? 'notice success' : 'notice error'}>
            {dealMessage}
          </div>
        ) : null}

        <div className="desktop-grid">
          <section className="panel panel-wide">
            {renderMainPanel({
              activeView,
              liveVehicles,
              vehicles,
              buyerListingVehicles,
              pagedListingVehicles,
              vehicleInsights,
              matchActive: matchAnswers != null,
              onOpenQuiz: () => setQuizOpen(true),
              onClearMatch: () => {
                setMatchAnswers(null);
                setInventoryPage(1);
              },
              readinessSteps,
              readinessHidden,
              onHideReadiness: () => setReadinessHidden(true),
              favorites: favorites.data ?? [],
              savedSearches: savedSearches.data ?? [],
              favoriteIds,
              pendingFavoriteId,
              onToggleFavorite: toggleFavorite,
              onSaveSearch: saveCurrentSearch,
              onApplySavedSearch: applySavedSearch,
              onToggleSavedSearchAlert: toggleSavedSearchAlert,
              onRenameSavedSearch: renameSavedSearch,
              onDeleteSavedSearch: deleteSavedSearch,
              inventoryPage,
              inventoryPageCount,
              inventoryPageSize: INVENTORY_PAGE_SIZE,
              onInventoryPageChange: setInventoryPage,
              compareVehicles,
              compareVehicleIds,
              onToggleCompare: (vehicleId: number) => {
                if (
                  !compareVehicleIds.includes(vehicleId) &&
                  !requireAuth('Create a free account to save and compare cars.')
                ) {
                  return;
                }
                toggleCompareVehicle(vehicleId);
              },
              onRemoveCompare: removeCompareVehicle,
              onClearCompare: clearCompare,
              selectedVehicle,
              vehicleDetail,
              vehicleHistory,
              leads,
              appointments,
              deals,
              selectedDeal,
              dashboard,
              currentUser,
              assigneeTasks,
              dealDocuments,
              dealReadiness,
              dealTasks,
              dealActivity,
              dealers,
              filteredAppointments,
              notifications,
              buyerInbox,
              selectedDealerId,
              dealerPortal,
              dealerOnboarding,
              dealerQueue,
              dealerInbox,
              dealerSubscription,
              dealerInvoices,
              dealerPortalDeals,
              dealerPortalLeads,
              dealerPortalAppointments,
              dealerPortalDocuments,
              onSelectVehicle: setSelectedVehicleId,
              onSelectDealer: setSelectedDealerId,
              onOpenVehicle: () => setActiveView('vehicle'),
              onNavigate: setActiveView,
              dealerProfile,
              dealerProfileVehicles,
              onOpenDealerProfile: (id: number) => {
                setDealerProfileId(id);
                setActiveView('dealer-profile');
              },
              listingQuery,
              listingStatus,
              maxListingPrice,
              filterMake,
              filterModel,
              filterMinYear,
              filterMaxMileage,
              onListingQueryChange: setListingQuery,
              onListingStatusChange: setListingStatus,
              onMaxListingPriceChange: setMaxListingPrice,
              onFilterMakeChange: (value: string) => {
                setFilterMake(value);
                setFilterModel('');
              },
              onFilterModelChange: setFilterModel,
              onFilterMinYearChange: setFilterMinYear,
              onFilterMaxMileageChange: setFilterMaxMileage,
              onOpenLightbox: (images: string[], index: number, alt: string) =>
                setLightbox({images, index, alt}),
              listingActiveImages,
              onListingActiveImageChange: (vehicleId, imageUrl) => {
                setListingActiveImages(current => ({...current, [vehicleId]: imageUrl}));
              },
              detailActiveImage,
              onDetailActiveImageChange: setDetailActiveImage,
              onCreateDeal: createDeal,
              onPayDeposit: payDeposit,
              onRequestPayDeposit: () => setDepositConfirmOpen(true),
              onCreateInsuranceDocument: createInsuranceDocument,
              onAdvanceDealStage: advanceDealStage,
              onScheduleFulfillment: scheduleFulfillment,
              onUpdateDocumentStatus: updateDocumentStatus,
              pendingDeal,
              pendingDeposit,
              pendingDocument,
              pendingStageUpdate,
              pendingFulfillment,
              pendingDocumentStatuses,
              pendingNotificationId,
              pendingTaskId,
              pendingLeadId,
              pendingAppointmentId,
              pendingDealerId,
              pendingDealerInventoryId,
              pendingInventoryUpload,
              inventoryUploadMode,
              inventoryUploadFile,
              inventoryUploadMessage,
              inventoryUploadResult,
              dealerInventoryCounts,
              dealerInventoryRows,
              dealerInventoryLabel,
              dealerActionMessages,
              dealerForm,
              editingDealerId,
              pendingDealerSave,
              vehicleForm,
              editingVehicleId,
              pendingVehicleSave,
              pendingSubscriptionSave,
              subscriptionForm,
              onMarkNotificationAsRead: markNotificationAsRead,
              onUpdateBuyerTaskStatus: updateBuyerTaskStatus,
              onUpdateLeadStatus: updateLeadStatus,
              onUpdateAppointmentStatus: updateAppointmentStatus,
              onToggleDealerApproval: toggleDealerApproval,
              onLoadDealerInventory: loadDealerInventory,
              onInventoryUploadModeChange: setInventoryUploadMode,
              onInventoryUploadFileChange: setInventoryUploadFile,
              onUploadDealerInventoryCsv: uploadDealerInventoryCsv,
              onDealerFormChange: (field, value) => {
                setDealerForm(current => ({...current, [field]: value}));
              },
              onStartDealerEdit: startDealerEdit,
              onCancelDealerEdit: resetDealerForm,
              onSaveDealer: saveDealer,
              onVehicleFormChange: (field, value) => {
                setVehicleForm(current => ({...current, [field]: value}));
              },
              onStartVehicleEdit: startVehicleEdit,
              onToggleVehiclePublish: toggleVehiclePublish,
              onCreateVehicleFromVin: createVehicleFromVin,
              pendingVin,
              onUploadVehicleHistoryFile: uploadVehicleHistoryFile,
              pendingHistoryVehicleId,
              pendingVehiclePublishId,
              onCancelVehicleEdit: resetVehicleForm,
              onSaveVehicle: saveVehicle,
              onSubscriptionFormChange: setSubscriptionForm,
              onSaveSubscription: saveSubscription,
            })}
          </section>

          <section className="panel">
            <h3 className="panel-title">Selected vehicle</h3>
            {selectedVehicle ? (
              <VehicleSummaryCard
                vehicle={selectedVehicle}
                activeImage={detailActiveImage}
                onSelectImage={setDetailActiveImage}
              />
            ) : (
              <EmptyState message="No vehicle is currently selected." />
            )}

            <div className="stack">
              <label>
                <input
                  type="checkbox"
                  checked={tradeInEnabled}
                  onChange={event => {
                    const enabled = event.target.checked;
                    setTradeInEnabled(enabled);
                    if (!enabled) {
                      setTradeInVin('');
                      setTradeInMileage('');
                    }
                  }}
                />{' '}
                Include trade-in
              </label>
              {tradeInEnabled ? (
                <>
                  <div className="field">
                    <input
                      type="text"
                      className="text-input"
                      placeholder="Trade-in VIN"
                      value={tradeInVin}
                      aria-invalid={Boolean(tradeInVinError)}
                      onChange={event => {
                        setTradeInVin(event.target.value);
                      }}
                    />
                    {tradeInVinError ? (
                      <span className="field-error">{tradeInVinError}</span>
                    ) : null}
                  </div>
                  <div className="field">
                    <input
                      type="number"
                      className="text-input"
                      placeholder="Trade-in mileage"
                      value={tradeInMileage}
                      min={0}
                      aria-invalid={Boolean(tradeInMileageError)}
                      onChange={event => {
                        setTradeInMileage(event.target.value);
                      }}
                    />
                    {tradeInMileageError ? (
                      <span className="field-error">{tradeInMileageError}</span>
                    ) : null}
                  </div>
                </>
              ) : null}
              <button
                type="button"
                className="primary-button"
                disabled={!selectedVehicleId || pendingDeal || !tradeInValid}
                onClick={() => {
                  if (!requireAuth('Create a free account to start your purchase.')) return;
                  createDeal().catch((error: unknown) => toast.error(toUserMessage(error)));
                }}>
                {pendingDeal ? 'Starting…' : selectedDeal ? 'View your purchase' : 'Start your purchase'}
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={!selectedVehicleId || pendingLead}
                onClick={() => {
                  if (!requireAuth('Sign in to message the dealer about this car.')) return;
                  createLead().catch((error: unknown) => toast.error(toUserMessage(error)));
                }}>
                {pendingLead ? 'Sending…' : 'Ask a question'}
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={!selectedVehicleId || pendingAppointment}
                onClick={() => {
                  if (!requireAuth('Sign in to book a test drive.')) return;
                  createAppointment().catch((error: unknown) => toast.error(toUserMessage(error)));
                }}>
                {pendingAppointment ? 'Requesting…' : 'Request a test drive'}
              </button>
            </div>
          </section>
        </div>
        <PlatformDisclaimer
          variant="footer"
          onNavigate={view => setActiveView(view)}
        />
      </main>
    </div>
    </>
  );
}

function renderMainPanel(args: {
  activeView: NavView;
  liveVehicles: AsyncState<Vehicle[]>;
  vehicles: AsyncState<Vehicle[]>;
  buyerListingVehicles: Vehicle[];
  pagedListingVehicles: Vehicle[];
  vehicleInsights: Map<number, {deal: DealScore; matchPct: number | null}>;
  matchActive: boolean;
  onOpenQuiz: () => void;
  onClearMatch: () => void;
  readinessSteps: ReadinessStep[];
  readinessHidden: boolean;
  onHideReadiness: () => void;
  favorites: Favorite[];
  savedSearches: SavedSearch[];
  favoriteIds: Set<number>;
  pendingFavoriteId: number | null;
  onToggleFavorite: (vehicleId: number) => void;
  onSaveSearch: () => void;
  onApplySavedSearch: (search: SavedSearch) => void;
  onToggleSavedSearchAlert: (search: SavedSearch) => void;
  onRenameSavedSearch: (search: SavedSearch, name: string) => void;
  onDeleteSavedSearch: (id: number) => void;
  inventoryPage: number;
  inventoryPageCount: number;
  inventoryPageSize: number;
  onInventoryPageChange: (page: number) => void;
  compareVehicles: Vehicle[];
  compareVehicleIds: number[];
  onToggleCompare: (vehicleId: number) => void;
  onRemoveCompare: (vehicleId: number) => void;
  onClearCompare: () => void;
  selectedVehicle: Vehicle | null;
  vehicleDetail: AsyncState<Vehicle | null>;
  vehicleHistory: AsyncState<VehicleHistoryReport | null>;
  leads: AsyncState<Lead[]>;
  appointments: AsyncState<Appointment[]>;
  deals: AsyncState<Deal[]>;
  selectedDeal: Deal | null;
  dashboard: AsyncState<Dashboard>;
  currentUser: AsyncState<CurrentUser>;
  assigneeTasks: AsyncState<DealTask[]>;
  dealDocuments: AsyncState<DealDocument[]>;
  dealReadiness: AsyncState<DealReadiness | null>;
  dealTasks: AsyncState<DealTask[]>;
  dealActivity: AsyncState<DealActivity[]>;
  dealers: AsyncState<Dealer[]>;
  filteredAppointments: Appointment[];
  notifications: AsyncState<Notification[]>;
  buyerInbox: AsyncState<ParticipantInbox>;
  selectedDealerId: number | null;
  dealerPortal: AsyncState<DealerPortal | null>;
  dealerOnboarding: AsyncState<DealerOnboardingView | null>;
  dealerQueue: AsyncState<DealerQueue | null>;
  dealerInbox: AsyncState<DealerInbox | null>;
  dealerSubscription: AsyncState<PortalSubscription | null>;
  dealerInvoices: AsyncState<PortalInvoice[]>;
  dealerPortalDeals: AsyncState<PortalDealItem[]>;
  dealerPortalLeads: AsyncState<PortalLeadItem[]>;
  dealerPortalAppointments: AsyncState<PortalAppointmentItem[]>;
  dealerPortalDocuments: AsyncState<PortalDocumentItem[]>;
  onSelectVehicle: (vehicleId: number) => void;
  onSelectDealer: (dealerId: number | null) => void;
  onOpenVehicle: () => void;
  onNavigate: (view: NavView) => void;
  dealerProfile: AsyncState<Dealer | null>;
  dealerProfileVehicles: AsyncState<Vehicle[]>;
  onOpenDealerProfile: (dealerId: number) => void;
  listingQuery: string;
  listingStatus: 'ALL' | Vehicle['status'];
  maxListingPrice: number;
  filterMake: string;
  filterModel: string;
  filterMinYear: number;
  filterMaxMileage: number;
  onListingQueryChange: (value: string) => void;
  onListingStatusChange: (value: 'ALL' | Vehicle['status']) => void;
  onMaxListingPriceChange: (value: number) => void;
  onFilterMakeChange: (value: string) => void;
  onFilterModelChange: (value: string) => void;
  onFilterMinYearChange: (value: number) => void;
  onFilterMaxMileageChange: (value: number) => void;
  onOpenLightbox: (images: string[], index: number, alt: string) => void;
  listingActiveImages: Record<number, string>;
  onListingActiveImageChange: (vehicleId: number, imageUrl: string) => void;
  detailActiveImage: string | null;
  onDetailActiveImageChange: (imageUrl: string) => void;
  onCreateDeal: () => Promise<void>;
  onPayDeposit: () => Promise<void>;
  onRequestPayDeposit: () => void;
  onCreateInsuranceDocument: () => Promise<void>;
  onAdvanceDealStage: () => Promise<void>;
  onScheduleFulfillment: () => Promise<void>;
  onUpdateDocumentStatus: (documentId: number, status: DocumentStatus) => Promise<void>;
  pendingDeal: boolean;
  pendingDeposit: boolean;
  pendingDocument: boolean;
  pendingStageUpdate: boolean;
  pendingFulfillment: boolean;
  pendingDocumentStatuses: Record<number, boolean>;
  pendingNotificationId: number | null;
  pendingTaskId: number | null;
  pendingLeadId: number | null;
  pendingAppointmentId: number | null;
  pendingDealerId: number | null;
  pendingDealerInventoryId: number | null;
  pendingInventoryUpload: boolean;
  inventoryUploadMode: InventoryUploadMode;
  inventoryUploadFile: File | null;
  inventoryUploadMessage: string | null;
  inventoryUploadResult: InventoryUploadResponse | null;
  dealerInventoryCounts: Record<number, number>;
  dealerInventoryRows: Vehicle[];
  dealerInventoryLabel: string | null;
  dealerActionMessages: Record<number, string>;
  dealerForm: {
    name: string;
    licenseNumber: string;
    city: string;
    state: string;
  };
  editingDealerId: number | null;
  pendingDealerSave: boolean;
  vehicleForm: {
    dealerId: string;
    vin: string;
    modelYear: string;
    make: string;
    model: string;
    trim: string;
    imageUrls: string;
    mileage: string;
    price: string;
    status: Vehicle['status'];
  };
  editingVehicleId: number | null;
  pendingVehicleSave: boolean;
  pendingSubscriptionSave: boolean;
  subscriptionForm: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    autoRenew: boolean;
  } | null;
  onMarkNotificationAsRead: (notificationId: number) => Promise<void>;
  onUpdateBuyerTaskStatus: (taskId: number, status: DealTaskStatus) => Promise<void>;
  onUpdateLeadStatus: (leadId: number, status: Lead['status']) => Promise<void>;
  onUpdateAppointmentStatus: (
    appointmentId: number,
    status: Appointment['status'],
  ) => Promise<void>;
  onToggleDealerApproval: (dealer: Dealer) => Promise<void>;
  onLoadDealerInventory: (dealer: Dealer) => Promise<void>;
  onInventoryUploadModeChange: (value: InventoryUploadMode) => void;
  onInventoryUploadFileChange: (file: File | null) => void;
  onUploadDealerInventoryCsv: () => Promise<void>;
  onDealerFormChange: (
    field: 'name' | 'licenseNumber' | 'city' | 'state',
    value: string,
  ) => void;
  onStartDealerEdit: (dealer: Dealer) => void;
  onCancelDealerEdit: () => void;
  onSaveDealer: () => Promise<void>;
  onVehicleFormChange: (
    field:
      | 'dealerId'
      | 'vin'
      | 'modelYear'
      | 'make'
      | 'model'
      | 'trim'
      | 'imageUrls'
      | 'mileage'
      | 'price'
      | 'status',
    value: string,
  ) => void;
  onStartVehicleEdit: (vehicle: Vehicle) => void;
  onToggleVehiclePublish: (vehicle: Vehicle) => Promise<void>;
  onCreateVehicleFromVin: () => Promise<void>;
  pendingVin: boolean;
  onUploadVehicleHistoryFile: (
    vehicleId: number,
    file: File,
  ) => Promise<void>;
  pendingHistoryVehicleId: number | null;
  pendingVehiclePublishId: number | null;
  onCancelVehicleEdit: () => void;
  onSaveVehicle: () => Promise<void>;
  onSubscriptionFormChange: (
    value: {plan: SubscriptionPlan; status: SubscriptionStatus; autoRenew: boolean} | null,
  ) => void;
  onSaveSubscription: () => Promise<void>;
}) {
  const {
    activeView,
    liveVehicles,
    vehicles,
    buyerListingVehicles,
    pagedListingVehicles,
    vehicleInsights,
    matchActive,
    onOpenQuiz,
    onClearMatch,
    readinessSteps,
    readinessHidden,
    onHideReadiness,
    favorites,
    savedSearches,
    favoriteIds,
    pendingFavoriteId,
    onToggleFavorite,
    onSaveSearch,
    onApplySavedSearch,
    onToggleSavedSearchAlert,
    onRenameSavedSearch,
    onDeleteSavedSearch,
    inventoryPage,
    inventoryPageCount,
    inventoryPageSize,
    onInventoryPageChange,
    compareVehicles,
    compareVehicleIds,
    onToggleCompare,
    onRemoveCompare,
    onClearCompare,
    selectedVehicle,
    vehicleDetail,
    vehicleHistory,
    leads,
    appointments,
    deals,
    selectedDeal,
    dashboard,
    currentUser,
    assigneeTasks,
    dealDocuments,
    dealReadiness,
    dealTasks,
    dealActivity,
    dealers,
    filteredAppointments,
    notifications,
    buyerInbox,
    selectedDealerId,
    dealerPortal,
    dealerOnboarding,
    dealerQueue,
    dealerInbox,
    dealerSubscription,
    dealerInvoices,
    dealerPortalDeals,
    dealerPortalLeads,
    dealerPortalAppointments,
    dealerPortalDocuments,
    onSelectVehicle,
    onSelectDealer,
    onOpenVehicle,
    onNavigate,
    dealerProfile,
    dealerProfileVehicles,
    onOpenDealerProfile,
    listingQuery,
    listingStatus,
    maxListingPrice,
    filterMake,
    filterModel,
    filterMinYear,
    filterMaxMileage,
    onListingQueryChange,
    onListingStatusChange,
    onMaxListingPriceChange,
    onFilterMakeChange,
    onFilterModelChange,
    onFilterMinYearChange,
    onFilterMaxMileageChange,
    onOpenLightbox,
    listingActiveImages,
    onListingActiveImageChange,
    detailActiveImage,
    onDetailActiveImageChange,
    onCreateDeal,
    onPayDeposit,
    onRequestPayDeposit,
    onCreateInsuranceDocument,
    onAdvanceDealStage,
    onScheduleFulfillment,
    onUpdateDocumentStatus,
    pendingDeal,
    pendingDeposit,
    pendingDocument,
    pendingStageUpdate,
    pendingFulfillment,
    pendingDocumentStatuses,
    pendingNotificationId,
    pendingTaskId,
    pendingLeadId,
    pendingAppointmentId,
    pendingDealerId,
    pendingDealerInventoryId,
    pendingInventoryUpload,
    inventoryUploadMode,
    inventoryUploadFile,
    inventoryUploadMessage,
    inventoryUploadResult,
    dealerInventoryCounts,
    dealerInventoryRows,
    dealerInventoryLabel,
    dealerActionMessages,
    dealerForm,
    editingDealerId,
    pendingDealerSave,
    vehicleForm,
    editingVehicleId,
    pendingVehicleSave,
    pendingSubscriptionSave,
    subscriptionForm,
    onMarkNotificationAsRead,
    onUpdateBuyerTaskStatus,
    onUpdateLeadStatus,
    onUpdateAppointmentStatus,
    onToggleDealerApproval,
    onLoadDealerInventory,
    onInventoryUploadModeChange,
    onInventoryUploadFileChange,
    onUploadDealerInventoryCsv,
    onDealerFormChange,
    onStartDealerEdit,
    onCancelDealerEdit,
    onSaveDealer,
    onVehicleFormChange,
    onStartVehicleEdit,
    onToggleVehiclePublish,
    onCreateVehicleFromVin,
    pendingVin,
    onUploadVehicleHistoryFile,
    pendingHistoryVehicleId,
    pendingVehiclePublishId,
    onCancelVehicleEdit,
    onSaveVehicle,
    onSubscriptionFormChange,
    onSaveSubscription,
  } = args;

  switch (activeView) {
    case 'overview':
      if (currentUser.data?.role === 'DEALER') {
        return (
          <>
            <PanelHeader
              title="Dashboard"
              detail="Manage your dealership's activities end to end."
            />
            <DealerDashboard
              dealerName={
                dealerPortal.data?.overview.dealerName ??
                currentUser.data.displayName
              }
              onboarding={dealerOnboarding.data ?? null}
              portal={dealerPortal.data ?? null}
              queue={dealerQueue.data ?? null}
              subscription={dealerSubscription.data ?? null}
              onNavigate={onNavigate}
            />
          </>
        );
      }
      return (
        <>
          <PanelHeader
            title="Overview"
            detail="Your hub for live inventory and recent activity."
          />
          <ResourceBlock state={liveVehicles}>
            <div className="table-card">
              <div className="table-header">
                <h4>Live inventory</h4>
              </div>
              <div className="vehicle-grid">
                {(liveVehicles.data ?? []).map(vehicle => (
                  <button
                    key={vehicle.id}
                    type="button"
                    className="vehicle-tile"
                    onClick={() => onSelectVehicle(vehicle.id)}>
                    <strong>
                      {vehicle.modelYear} {vehicle.make} {vehicle.model}
                    </strong>
                    <span>{vehicle.trim}</span>
                    <span>{vehicle.dealerName}</span>
                    <span>{formatCurrency(vehicle.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          </ResourceBlock>

          <div className="report-grid">
            <ResourceBlock state={currentUser}>
              {currentUser.data ? (
                <div className="table-card">
                  <div className="table-header">
                    <h4>Signed-in profile</h4>
                  </div>
                  <div className="chip-row">
                    <span className="listing-chip">{currentUser.data.displayName}</span>
                    <span className="listing-chip">{currentUser.data.email}</span>
                    <span className="listing-chip">Role {formatLabel(currentUser.data.role)}</span>
                    <span className="listing-chip">
                      Dealer ID {currentUser.data.dealerId ?? 'Not linked'}
                    </span>
                  </div>
                </div>
              ) : null}
            </ResourceBlock>

            <ResourceBlock state={assigneeTasks}>
              <div className="table-card">
                <div className="table-header">
                  <h4>Task inbox ({assigneeTasks.data?.length ?? 0})</h4>
                </div>
                {(assigneeTasks.data ?? []).length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Status</th>
                        <th>Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(assigneeTasks.data ?? []).slice(0, 5).map(task => (
                        <tr key={task.id}>
                          <td>{task.title}</td>
                          <td>{formatLabel(task.status)}</td>
                          <td>{task.dueAt ? formatDateTime(task.dueAt) : 'No due date'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="muted-text">No assigned tasks were returned for this participant.</p>
                )}
              </div>
            </ResourceBlock>
          </div>
        </>
      );
    case 'inventory': {
      const invRole = currentUser.data?.role;
      if (invRole === 'DEALER' || invRole === 'ADMIN') {
        const myDealerId = currentUser.data?.dealerId ?? null;
        const ownVehicles = (vehicles.data ?? []).filter(v =>
          invRole === 'ADMIN'
            ? true
            : myDealerId != null && v.dealerId === myDealerId,
        );
        return (
          <>
            <PanelHeader
              title="Manage inventory"
              detail="Add, edit, and publish the vehicles buyers can see."
            />
            <ResourceBlock state={vehicles}>
              <DealerInventoryView
                vehicles={ownVehicles}
                vehicleForm={vehicleForm}
                editingVehicleId={editingVehicleId}
                pendingVehicleSave={pendingVehicleSave}
                pendingVehiclePublishId={pendingVehiclePublishId}
                onVehicleFormChange={onVehicleFormChange}
                onSaveVehicle={onSaveVehicle}
                onCancelVehicleEdit={onCancelVehicleEdit}
                onStartVehicleEdit={onStartVehicleEdit}
                onToggleVehiclePublish={onToggleVehiclePublish}
                pendingVin={pendingVin}
                onCreateFromVin={onCreateVehicleFromVin}
                pendingHistoryVehicleId={pendingHistoryVehicleId}
                onUploadHistory={onUploadVehicleHistoryFile}
                inventoryUploadMode={inventoryUploadMode}
                pendingInventoryUpload={pendingInventoryUpload}
                inventoryUploadMessage={inventoryUploadMessage}
                inventoryUploadResult={inventoryUploadResult}
                onInventoryUploadModeChange={onInventoryUploadModeChange}
                onInventoryUploadFileChange={onInventoryUploadFileChange}
                onUploadDealerInventoryCsv={onUploadDealerInventoryCsv}
              />
            </ResourceBlock>
            {myDealerId != null ? (
              <InventoryFeedPanel dealerId={myDealerId} />
            ) : null}
          </>
        );
      }
      return (
        <>
          <PanelHeader
            title="Browse cars"
            detail="Live, dealer-verified cars with transparent pricing."
          />
          <ResourceBlock state={vehicles}>
            <div className="listing-shell">
              <section className="listing-hero">
                <div>
                  <p className="hero-eyebrow">Browse cars</p>
                  <h3 className="listing-title">Shop confidently with clear pricing and live availability.</h3>
                  <p className="listing-copy">
                    Browse active vehicles, narrow by budget, and open full details
                    or compare without losing your place.
                  </p>
                </div>
                <div className="listing-summary">
                  <span>
                    {buyerListingVehicles.length} match
                    {buyerListingVehicles.length === 1 ? '' : 'es'}
                  </span>
                  <span>Max budget {formatCurrency(maxListingPrice)}</span>
                  <span>Status {listingStatus}</span>
                  {matchActive ? (
                    <span className="match-active-row">
                      <button
                        type="button"
                        className="primary-button compact-button"
                        onClick={onOpenQuiz}>
                        Edit my match
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={onClearMatch}>
                        Clear
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="primary-button compact-button match-cta"
                      onClick={onOpenQuiz}>
                      ✨ Find your match
                    </button>
                  )}
                  <button
                    type="button"
                    className="secondary-button compact-button"
                    onClick={onSaveSearch}>
                    ♥ Save this search
                  </button>
                </div>
              </section>

              {(() => {
                const all = vehicles.data ?? [];
                const makes = Array.from(
                  new Set(all.map(v => v.make).filter(Boolean)),
                ).sort();
                const models = Array.from(
                  new Set(
                    all
                      .filter(v => !filterMake || v.make === filterMake)
                      .map(v => v.model)
                      .filter(Boolean),
                  ),
                ).sort();
                return (
                  <section className="listing-toolbar">
                    <label className="field">
                      <span>Search</span>
                      <input
                        value={listingQuery}
                        onChange={event => onListingQueryChange(event.target.value)}
                        placeholder="Try Honda, Tesla, family SUV..."
                      />
                    </label>

                    <label className="field compact">
                      <span>Make</span>
                      <select
                        value={filterMake}
                        onChange={event => onFilterMakeChange(event.target.value)}>
                        <option value="">Any make</option>
                        {makes.map(make => (
                          <option key={make} value={make}>
                            {make}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field compact">
                      <span>Model</span>
                      <select
                        value={filterModel}
                        disabled={models.length === 0}
                        onChange={event => onFilterModelChange(event.target.value)}>
                        <option value="">Any model</option>
                        {models.map(model => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field compact">
                      <span>Min year</span>
                      <input
                        type="number"
                        min={1990}
                        max={2030}
                        placeholder="Any"
                        value={filterMinYear || ''}
                        onChange={event =>
                          onFilterMinYearChange(Number(event.target.value) || 0)
                        }
                      />
                    </label>

                    <label className="field compact">
                      <span>Max mileage</span>
                      <input
                        type="number"
                        min={0}
                        step={5000}
                        placeholder="Any"
                        value={filterMaxMileage || ''}
                        onChange={event =>
                          onFilterMaxMileageChange(Number(event.target.value) || 0)
                        }
                      />
                    </label>

                    <label className="field compact">
                      <span>Status</span>
                      <select
                        value={listingStatus}
                        onChange={event =>
                          onListingStatusChange(
                            event.target.value as 'ALL' | Vehicle['status'],
                          )
                        }>
                        <option value="ALL">All</option>
                        <option value="LIVE">Live</option>
                        <option value="RESERVED">Reserved</option>
                        <option value="SOLD">Sold</option>
                        <option value="DRAFT">Draft</option>
                      </select>
                    </label>

                    <label className="field compact">
                      <span>Budget {formatCurrency(maxListingPrice)} (incl. est. tax)</span>
                      <input
                        type="range"
                        min="10000"
                        max="90000"
                        step="2500"
                        value={maxListingPrice}
                        onChange={event =>
                          onMaxListingPriceChange(Number(event.target.value))
                        }
                      />
                    </label>
                  </section>
                );
              })()}

              <div className="chip-row">
                {[
                  'Transparent pricing',
                  'Live dealer inventory',
                  'Instant payment estimates',
                  'Side-by-side compare',
                ].map(chip => (
                  <span key={chip} className="listing-chip">
                    {chip}
                  </span>
                ))}
              </div>

              {currentUser.data?.role !== 'DEALER' &&
              currentUser.data?.role !== 'ADMIN' &&
              !readinessHidden ? (
                <ReadinessMeter
                  steps={readinessSteps}
                  onDismiss={onHideReadiness}
                />
              ) : null}

              {buyerListingVehicles.length > 0 ? (
                <div className="listing-grid">
                  {pagedListingVehicles.map(vehicle => (
                    <article key={vehicle.id} className="listing-card">
                      {(() => {
                        const galleryImages = getVehicleGallery(vehicle);
                        const activeImage =
                          listingActiveImages[vehicle.id] &&
                          galleryImages.includes(listingActiveImages[vehicle.id])
                            ? listingActiveImages[vehicle.id]
                            : galleryImages[0];

                        return (
                          <>
                      <div className="listing-image-wrap">
                        <img
                          className="listing-image"
                          src={activeImage}
                          alt={`${vehicle.modelYear} ${vehicle.make} ${vehicle.model}`}
                        />
                      </div>
                      <div className="listing-gallery-row">
                        {galleryImages.slice(0, 4).map((imageUrl, index) => (
                          <button
                            key={`${vehicle.id}-${index}`}
                            type="button"
                            className={
                              imageUrl === activeImage
                                ? 'listing-gallery-thumb active'
                                : 'listing-gallery-thumb'
                            }
                            onClick={() => onListingActiveImageChange(vehicle.id, imageUrl)}>
                            <img
                              className="listing-gallery-image"
                              src={imageUrl}
                              alt={`${vehicle.make} ${vehicle.model} view ${index + 1}`}
                            />
                          </button>
                        ))}
                        <span className="listing-gallery-count">
                          {galleryImages.length} photos
                        </span>
                      </div>
                      <div className="listing-card-top">
                        <span className={`listing-badge status-${vehicle.status.toLowerCase()}`}>
                          {vehicle.status}
                        </span>
                        <div className="listing-card-top-right">
                          <strong>{formatCurrency(vehicle.price)}</strong>
                          <button
                            type="button"
                            className={
                              favoriteIds.has(vehicle.id)
                                ? 'fav-heart on'
                                : 'fav-heart'
                            }
                            aria-pressed={favoriteIds.has(vehicle.id)}
                            aria-label={
                              favoriteIds.has(vehicle.id)
                                ? 'Remove from garage'
                                : 'Save to garage'
                            }
                            disabled={pendingFavoriteId === vehicle.id}
                            onClick={() => onToggleFavorite(vehicle.id)}>
                            {favoriteIds.has(vehicle.id) ? '♥' : '♡'}
                          </button>
                        </div>
                      </div>
                      <h4>
                        {vehicle.modelYear} {vehicle.make} {vehicle.model}
                      </h4>
                      <p className="listing-trim">{vehicle.trim}</p>
                      {(() => {
                        const insight = vehicleInsights.get(vehicle.id);
                        const matchPct = insight?.matchPct ?? null;
                        const deal = insight?.deal;
                        if (matchPct == null && (!deal || !deal.tier)) {
                          return null;
                        }
                        return (
                          <div className="insight-row">
                            {matchPct != null ? (
                              <span
                                className={
                                  matchPct >= 75
                                    ? 'match-pct strong'
                                    : 'match-pct'
                                }
                                title="How well this fits your quiz answers">
                                {matchPct}% match
                              </span>
                            ) : null}
                            {deal ? <DealScoreBadge score={deal} /> : null}
                          </div>
                        );
                      })()}
                      <div className="listing-meta">
                        <span>{formatMileage(vehicle.mileage)}</span>
                        <span>{vehicle.dealerName}</span>
                      </div>
                      <div className="listing-points">
                        <span>Live pricing</span>
                        <span>Dealer response enabled</span>
                        <span>Test-drive request ready</span>
                      </div>
                      <div className="listing-actions">
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => {
                            onSelectVehicle(vehicle.id);
                            onOpenVehicle();
                          }}>
                          View details
                        </button>
                        {featureFlags.buyerCompare ? (
                          <label className="compare-check">
                            <input
                              type="checkbox"
                              checked={compareVehicleIds.includes(vehicle.id)}
                              disabled={
                                !compareVehicleIds.includes(vehicle.id) &&
                                compareVehicleIds.length >= 3
                              }
                              onChange={() => onToggleCompare(vehicle.id)}
                            />
                            <span>Compare</span>
                          </label>
                        ) : null}
                      </div>
                          </>
                        );
                      })()}
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState message="No vehicles match the current filters. Expand the budget or clear the search." />
              )}
              {buyerListingVehicles.length > 0 ? (
                <Pagination
                  page={inventoryPage}
                  pageCount={inventoryPageCount}
                  total={buyerListingVehicles.length}
                  pageSize={inventoryPageSize}
                  onPageChange={page => {
                    onInventoryPageChange(page);
                    if (typeof window !== 'undefined') {
                      window.scrollTo({top: 0, behavior: 'smooth'});
                    }
                  }}
                />
              ) : null}
            </div>
          </ResourceBlock>
          {featureFlags.buyerCompare ? (
            <CompareDrawer
              vehicles={compareVehicles}
              onRemove={onRemoveCompare}
              onOpen={() => onNavigate('compare')}
              onClear={onClearCompare}
            />
          ) : null}
        </>
      );
    }
    case 'vehicle':
      return (
        <>
          <PanelHeader title="Vehicle details" detail="Full details for the car you selected." />
          <ResourceBlock state={vehicleDetail}>
            {vehicleDetail.data ? (
              <div className="detail-layout">
                <div>
                  <VehicleSummaryCard
                    vehicle={vehicleDetail.data}
                    large
                    activeImage={detailActiveImage}
                    onSelectImage={onDetailActiveImageChange}
                  />
                  <button
                    type="button"
                    className="secondary-button gallery-open-button"
                    onClick={() => {
                      const data = vehicleDetail.data!;
                      const gallery = getVehicleGallery(data);
                      const start = Math.max(
                        0,
                        gallery.indexOf(detailActiveImage ?? gallery[0]),
                      );
                      onOpenLightbox(
                        gallery,
                        start,
                        `${data.modelYear} ${data.make} ${data.model}`,
                      );
                    }}>
                    View all photos ({getVehicleGallery(vehicleDetail.data).length})
                  </button>
                </div>
                <div className="detail-stack">
                  <button
                    type="button"
                    className={
                      favoriteIds.has(vehicleDetail.data.id)
                        ? 'fav-button on'
                        : 'fav-button'
                    }
                    aria-pressed={favoriteIds.has(vehicleDetail.data.id)}
                    disabled={pendingFavoriteId === vehicleDetail.data.id}
                    onClick={() => onToggleFavorite(vehicleDetail.data!.id)}>
                    {favoriteIds.has(vehicleDetail.data.id)
                      ? '♥ Saved to your garage'
                      : '♡ Save to garage'}
                  </button>
                  <DetailRow label="VIN" value={vehicleDetail.data.vin} />
                  <div className="detail-row">
                    <span>Dealer</span>
                    <button
                      type="button"
                      className="footer-link detail-dealer-link"
                      onClick={() =>
                        onOpenDealerProfile(vehicleDetail.data!.dealerId)
                      }>
                      {vehicleDetail.data.dealerName} ›
                    </button>
                  </div>
                  <DetailRow label="Status" value={vehicleDetail.data.status} />
                  <DetailRow label="Mileage" value={formatMileage(vehicleDetail.data.mileage)} />
                  {vehicleDetail.data.bodyType || vehicleDetail.data.fuelType ? (
                    <DetailRow
                      label="Type"
                      value={[
                        vehicleDetail.data.bodyType
                          ? formatLabel(vehicleDetail.data.bodyType)
                          : null,
                        vehicleDetail.data.fuelType
                          ? formatLabel(vehicleDetail.data.fuelType)
                          : null,
                        vehicleDetail.data.combinedMpg
                          ? `${vehicleDetail.data.combinedMpg} MPG`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    />
                  ) : null}
                  <DetailRow label="Price" value={formatCurrency(vehicleDetail.data.price)} />
                  {(() => {
                    const insight = vehicleInsights.get(vehicleDetail.data.id);
                    if (!insight) return null;
                    return (
                      <div className="insight-row insight-row-detail">
                        {insight.matchPct != null ? (
                          <span
                            className={
                              insight.matchPct >= 75
                                ? 'match-pct strong'
                                : 'match-pct'
                            }>
                            {insight.matchPct}% match for you
                          </span>
                        ) : null}
                        {insight.deal.tier ? (
                          <DealScoreBadge score={insight.deal} showLabel />
                        ) : null}
                      </div>
                    );
                  })()}
                  {featureFlags.buyerPaymentSlider ? (
                    <PaymentSlider vehiclePrice={vehicleDetail.data.price} />
                  ) : null}
                  <section
                    className="disclosures"
                    aria-label="Vehicle history & disclosures">
                    <p className="card-kicker">History &amp; disclosures</p>
                    <ul className="disclosures-list">
                      <li>
                        <strong>VIN</strong>
                        <span>{vehicleDetail.data.vin}</span>
                      </li>
                      <li>
                        <strong>Odometer (as listed)</strong>
                        <span>
                          {formatMileage(vehicleDetail.data.mileage)}
                        </span>
                      </li>
                      <li>
                        <strong>Listing status</strong>
                        <span>{formatLabel(vehicleDetail.data.status)}</span>
                      </li>
                    </ul>

                    {(() => {
                      const h = vehicleHistory.data;
                      if (h && h.available && h.summary) {
                        const s = h.summary;
                        const rows: [string, string | null][] = [
                          [
                            'Previous owners',
                            s.ownerCount != null ? String(s.ownerCount) : null,
                          ],
                          [
                            'Reported accidents',
                            s.accidentCount != null
                              ? String(s.accidentCount)
                              : null,
                          ],
                          ['Title', s.titleBrand],
                          [
                            'Last reported odometer',
                            s.lastReportedOdometer != null
                              ? formatMileage(s.lastReportedOdometer)
                              : null,
                          ],
                          [
                            'Open recalls',
                            s.openRecallCount != null
                              ? String(s.openRecallCount)
                              : null,
                          ],
                          [
                            'Service records',
                            s.serviceRecordCount != null
                              ? String(s.serviceRecordCount)
                              : null,
                          ],
                        ];
                        return (
                          <div className="history-report">
                            <div className="history-report-head">
                              <span className="history-badge">
                                History report
                              </span>
                              <span className="history-source">
                                {h.providerName
                                  ? `Source: ${h.providerName}`
                                  : h.source === 'DEALER_UPLOAD'
                                    ? 'Provided by the dealer'
                                    : 'Report on file'}
                              </span>
                            </div>
                            {s.odometerRollbackSuspected ? (
                              <p className="history-flag">
                                ⚠ Possible odometer discrepancy reported —
                                verify with the dealer.
                              </p>
                            ) : null}
                            <ul className="disclosures-list">
                              {rows
                                .filter(([, v]) => v != null)
                                .map(([label, value]) => (
                                  <li key={label}>
                                    <strong>{label}</strong>
                                    <span>{value}</span>
                                  </li>
                                ))}
                            </ul>
                            <a
                              className="secondary-button compact-button"
                              href={
                                h.reportUrl &&
                                /^https?:\/\//.test(h.reportUrl)
                                  ? h.reportUrl
                                  : vehicleHistoryReportUrl(
                                      vehicleDetail.data.id,
                                    )
                              }
                              target="_blank"
                              rel="noopener noreferrer">
                              View full report (PDF)
                            </a>
                          </div>
                        );
                      }
                      return (
                        <p className="disclosures-note">
                          No history report is on file for this car yet. A
                          full report (prior owners, accidents, title brands)
                          is provided by the selling dealer — use “Ask a
                          question” to request it before you commit.
                          StealADeal does not generate or warrant vehicle
                          history.
                        </p>
                      );
                    })()}

                    <p className="disclosures-note">
                      At purchase, the dealer captures the digital{' '}
                      <strong>odometer disclosure</strong> and an{' '}
                      <strong>AS-IS disclosure</strong> (unless a written
                      warranty is offered) in the deal room.
                    </p>
                  </section>
                  <PlatformDisclaimer
                    variant="inline"
                    dealerName={vehicleDetail.data.dealerName}
                  />
                </div>
              </div>
            ) : (
              <EmptyState message="Select a vehicle from the inventory views." />
            )}
          </ResourceBlock>
        </>
      );
    case 'garage':
      return (
        <>
          <PanelHeader
            title="My Garage"
            detail="Cars you've saved and searches you're tracking for price drops."
          />
          <GarageView
            favorites={favorites}
            savedSearches={savedSearches}
            pendingFavoriteId={pendingFavoriteId}
            onOpenVehicle={vehicleId => {
              onSelectVehicle(vehicleId);
              onNavigate('vehicle');
            }}
            onRemoveFavorite={onToggleFavorite}
            onApplySearch={onApplySavedSearch}
            onToggleAlert={onToggleSavedSearchAlert}
            onRenameSearch={onRenameSavedSearch}
            onDeleteSearch={onDeleteSavedSearch}
            onBrowse={() => onNavigate('inventory')}
          />
        </>
      );
    case 'compare':
      return (
        <>
          <PanelHeader
            title="Compare vehicles"
            detail="Compare up to three cars side by side. The best value in each row is highlighted."
          />
          <CompareView
            vehicles={compareVehicles}
            insights={vehicleInsights}
            onRemove={onRemoveCompare}
            onClear={onClearCompare}
            onBrowse={() => onNavigate('inventory')}
            onSelect={vehicleId => {
              onSelectVehicle(vehicleId);
              onNavigate('vehicle');
            }}
          />
        </>
      );
    case 'deal-room':
      return (
        <>
          <PanelHeader
            title="Deal room"
            detail="Track your purchase: pricing, deposit, documents, and what happens next."
          />
          {selectedDeal ? (
            <div className="deal-room-grid">
              <div className="deal-room-main">
                <div className="deal-banner">
                  <div>
                    <p className="hero-eyebrow">Active deal</p>
                    <h3 className="listing-title">{selectedDeal.vehicleTitle}</h3>
                    <p className="listing-copy">
                      {formatLabel(selectedDeal.stage)} ·{' '}
                      {selectedDeal.fulfillmentType === 'HOME_DELIVERY'
                        ? 'Home delivery'
                        : 'Pickup'}
                      {selectedDeal.fulfillmentStatus
                        ? ` (${formatLabel(selectedDeal.fulfillmentStatus)})`
                        : ''}
                    </p>
                  </div>
                  <span className="listing-badge status-live">
                    {selectedDeal.depositPaid ? 'Deposit paid' : 'Deposit pending'}
                  </span>
                </div>

                <div className="deal-breakdown">
                  <DetailRow label="Vehicle price" value={formatCurrency(selectedDeal.vehiclePrice)} />
                  <DetailRow label="Tax" value={formatCurrency(selectedDeal.taxAmount)} />
                  <DetailRow
                    label="Registration fee"
                    value={formatCurrency(selectedDeal.registrationFee)}
                  />
                  <DetailRow
                    label="Documentation fee"
                    value={formatCurrency(selectedDeal.documentationFee)}
                  />
                  <DetailRow label="Delivery fee" value={formatCurrency(selectedDeal.deliveryFee)} />
                  <DetailRow label="Discount" value={formatCurrency(selectedDeal.discountAmount)} />
                  <DetailRow
                    label="Deposit"
                    value={formatCurrency(selectedDeal.depositAmount)}
                  />
                  <DetailRow label="Buyer city" value={selectedDeal.buyerCity} />
                  <DetailRow label="Buyer state" value={selectedDeal.buyerState} />
                  <DetailRow
                    label="Trade-in offer"
                    value={formatCurrency(selectedDeal.tradeInOffer)}
                  />
                  {selectedDeal.tradeIn ? (
                    <>
                      <DetailRow
                        label="Trade-in VIN"
                        value={selectedDeal.tradeInVin ?? 'Not provided'}
                      />
                      <DetailRow
                        label="Trade-in mileage"
                        value={
                          selectedDeal.tradeInMileage != null
                            ? formatMileage(selectedDeal.tradeInMileage)
                            : 'Not provided'
                        }
                      />
                    </>
                  ) : null}
                  <DetailRow label="Total" value={formatCurrency(selectedDeal.totalAmount)} />
                  {selectedDeal.depositPaid ? (
                    <div className="receipt-row">
                      <span>Deposit received</span>
                      <strong>{formatCurrency(selectedDeal.depositAmount)} ✓</strong>
                    </div>
                  ) : null}
                  <PlatformDisclaimer
                    variant="inline"
                    dealerName={selectedVehicle?.dealerName}
                  />
                </div>

                <div className="deal-stage-strip">
                  {dealStages.map(stage => (
                    <span
                      key={stage}
                      className={
                        stage === selectedDeal.stage
                          ? 'deal-stage-pill active'
                          : 'deal-stage-pill'
                      }>
                      {formatLabel(stage)}
                    </span>
                  ))}
                </div>

                <div className="listing-actions">
                  <button
                    type="button"
                    className="primary-button"
                    disabled={selectedDeal.depositPaid || pendingDeposit}
                    onClick={onRequestPayDeposit}>
                    {pendingDeposit ? 'Processing…' : selectedDeal.depositPaid ? 'Deposit paid' : `Pay ${formatCurrency(selectedDeal.depositAmount)} deposit`}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={pendingDocument}
                    onClick={() => {
                      onCreateInsuranceDocument().catch((error: unknown) => toast.error(toUserMessage(error)));
                    }}>
                    {pendingDocument ? 'Uploading…' : 'Upload insurance proof'}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={pendingFulfillment}
                    onClick={() => {
                      onScheduleFulfillment().catch((error: unknown) => toast.error(toUserMessage(error)));
                    }}>
                    {pendingFulfillment
                      ? 'Scheduling…'
                      : selectedDeal.fulfillmentType === 'HOME_DELIVERY'
                        ? 'Schedule delivery'
                        : 'Schedule pickup'}
                  </button>
                  {currentUser.data?.role !== 'BUYER' ? (
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={pendingStageUpdate}
                      onClick={() => {
                        onAdvanceDealStage().catch((error: unknown) => toast.error(toUserMessage(error)));
                      }}>
                      {pendingStageUpdate ? 'Updating…' : 'Move to next step'}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="panel-subsection">
                <DealFAndIPanel
                  dealId={selectedDeal.id}
                  canManage={
                    currentUser.data?.role === 'DEALER' ||
                    currentUser.data?.role === 'ADMIN'
                  }
                  onDocsChanged={() => {
                    dealDocuments.refresh().catch(() => {});
                  }}
                />
              </div>

              <div className="panel-subsection">
                <h4 className="panel-title">Required documents</h4>
                <ResourceBlock state={dealDocuments}>
                  {(dealDocuments.data ?? []).length > 0 ? (
                    <div className="stack">
                      {(dealDocuments.data ?? []).map(document => (
                        <div key={document.id} className="document-card">
                          <strong>{formatLabel(document.type)}</strong>
                          <span>{document.fileName}</span>
                          <span>{formatLabel(document.status)}</span>
                          <div className="document-actions">
                            {document.status !== 'UPLOADED' ? (
                              <button
                                type="button"
                                className="secondary-button compact-button"
                                disabled={pendingDocumentStatuses[document.id]}
                                onClick={() => {
                                  onUpdateDocumentStatus(document.id, 'UPLOADED').catch(
                                    () => {},
                                  );
                                }}>
                                Mark uploaded
                              </button>
                            ) : null}
                            {document.status !== 'REJECTED' ? (
                              <button
                                type="button"
                                className="secondary-button compact-button"
                                disabled={pendingDocumentStatuses[document.id]}
                                onClick={() => {
                                  onUpdateDocumentStatus(document.id, 'REJECTED').catch(
                                    () => {},
                                  );
                                }}>
                                Mark rejected
                              </button>
                            ) : null}
                            {document.status !== 'APPROVED' ? (
                              <button
                                type="button"
                                className="secondary-button compact-button"
                                disabled={pendingDocumentStatuses[document.id]}
                                onClick={() => {
                                  onUpdateDocumentStatus(document.id, 'APPROVED').catch(
                                    () => {},
                                  );
                                }}>
                                Mark approved
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="No documents requested yet." />
                  )}
                </ResourceBlock>
              </div>

              <div className="panel-subsection">
                <h4 className="panel-title">What you owe</h4>
                <ResourceBlock state={dealTasks}>
                  {featureFlags.taskChecklist ? (
                    <TaskList
                      tasks={dealTasks.data ?? []}
                      pendingTaskId={pendingTaskId}
                      audience="BUYER"
                      onToggleStatus={onUpdateBuyerTaskStatus}
                      emptyMessage="You're all caught up. The dealer will let you know when something needs you."
                    />
                  ) : null}
                </ResourceBlock>
              </div>

              <div className="panel-subsection">
                <h4 className="panel-title">Deal timeline</h4>
                <ResourceBlock state={dealActivity}>
                  {featureFlags.dealTimeline ? (
                    <DealTimeline
                      currentStage={selectedDeal.stage}
                      activity={dealActivity.data ?? []}
                      readiness={dealReadiness.data ?? null}
                    />
                  ) : null}
                </ResourceBlock>
              </div>
            </div>
          ) : (
            <div className="stack">
              <EmptyState message="You haven\u2019t started a purchase for this car yet." />
              <button
                type="button"
                className="primary-button"
                disabled={!selectedVehicle || pendingDeal}
                onClick={() => {
                  onCreateDeal().catch((error: unknown) => toast.error(toUserMessage(error)));
                }}>
                {pendingDeal ? 'Starting…' : 'Start your purchase'}
              </button>
            </div>
          )}
        </>
      );
    case 'deal-desk':
      return (
        <>
          <PanelHeader
            title="Deal desk"
            detail="Every open deal by stage. Select a card to open it."
          />
          <ResourceBlock state={deals}>
            <KanbanBoard
              deals={deals.data ?? []}
              selectedDealId={selectedDeal?.id ?? null}
              onSelectDeal={dealId => {
                const deal = (deals.data ?? []).find(item => item.id === dealId);
                if (deal) {
                  onSelectVehicle(deal.vehicleId);
                  onNavigate('deal-room');
                }
              }}
            />
          </ResourceBlock>
        </>
      );
    case 'leads':
      return (
        <>
          <PanelHeader title="Lead inbox" detail="Buyer inquiries waiting for a response. Leads waiting over 24h are flagged." />
          <ResourceBlock state={leads}>
            {(leads.data ?? []).length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Buyer</th>
                    <th>Contact</th>
                    <th>Vehicle</th>
                    <th>Status</th>
                    <th>Waiting</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(leads.data ?? []).map(lead => {
                    const ageMs = Date.now() - new Date(lead.createdAt).getTime();
                    const ageHours = Math.max(0, Math.floor(ageMs / 3_600_000));
                    const open = lead.status !== 'CLOSED';
                    const stale = open && ageHours >= 24;
                    const waitingLabel =
                      !open
                        ? '—'
                        : ageHours < 1
                          ? 'just now'
                          : ageHours < 24
                            ? `${ageHours}h`
                            : `${Math.floor(ageHours / 24)}d`;
                    return (
                    <tr key={lead.id} className={stale ? 'lead-row-stale' : undefined}>
                      <td>
                        <strong>{lead.buyerName}</strong>
                      </td>
                      <td>
                        <div className="lead-contact">
                          <span>{lead.buyerEmail}</span>
                          {lead.buyerPhone ? <span>{lead.buyerPhone}</span> : null}
                        </div>
                      </td>
                      <td>#{lead.vehicleId}</td>
                      <td>{formatLabel(lead.status)}</td>
                      <td>
                        <span className={stale ? 'lead-wait stale' : 'lead-wait'}>
                          {stale ? `⚠ ${waitingLabel}` : waitingLabel}
                        </span>
                      </td>
                      <td>
                        {lead.status === 'CLOSED' ? (
                          <span className="muted-text">Finalized</span>
                        ) : (
                          <button
                            type="button"
                            className="ghost-button"
                            disabled={pendingLeadId === lead.id}
                            onClick={() => {
                              const nextStatus =
                                lead.status === 'NEW'
                                  ? 'CONTACTED'
                                  : lead.status === 'CONTACTED'
                                    ? 'QUALIFIED'
                                    : 'CLOSED';
                              onUpdateLeadStatus(lead.id, nextStatus).catch((error: unknown) => toast.error(toUserMessage(error)));
                            }}>
                            {pendingLeadId === lead.id
                              ? 'Updating...'
                              : lead.status === 'NEW'
                                ? 'Mark contacted'
                                : lead.status === 'CONTACTED'
                                  ? 'Mark qualified'
                                  : 'Close lead'}
                          </button>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <EmptyState message="No leads yet. Use the selected vehicle actions to create one." />
            )}
          </ResourceBlock>
        </>
      );
    case 'appointments':
      return (
        <>
          <PanelHeader
            title="Appointments"
            detail="Test drives and delivery appointments."
          />
          <ResourceBlock state={appointments}>
            {filteredAppointments.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Buyer</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Scheduled</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map(appointment => (
                    <tr key={appointment.id}>
                      <td>#{appointment.vehicleId}</td>
                      <td>{appointment.buyerName}</td>
                      <td>{appointment.type}</td>
                      <td>{appointment.status}</td>
                      <td>{formatDateTime(appointment.scheduledAt)}</td>
                      <td>
                        {appointment.status === 'COMPLETED' || appointment.status === 'CANCELED' ? (
                          <span className="muted-text">Finalized</span>
                        ) : (
                          <div className="button-row">
                            <button
                              type="button"
                              className="ghost-button"
                              disabled={pendingAppointmentId === appointment.id}
                              onClick={() => {
                                const nextStatus =
                                  appointment.status === 'REQUESTED' ? 'CONFIRMED' : 'COMPLETED';
                                onUpdateAppointmentStatus(appointment.id, nextStatus).catch(
                                  () => {},
                                );
                              }}>
                              {pendingAppointmentId === appointment.id
                                ? 'Updating...'
                                : appointment.status === 'REQUESTED'
                                  ? 'Confirm'
                                  : 'Mark completed'}
                            </button>
                            <button
                              type="button"
                              className="ghost-button"
                              disabled={pendingAppointmentId === appointment.id}
                              onClick={() => {
                                onUpdateAppointmentStatus(appointment.id, 'CANCELED').catch(
                                  () => {},
                                );
                              }}>
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState message="No appointments for the selected vehicle yet." />
            )}
          </ResourceBlock>
        </>
      );
    case 'dealers':
      return (
        <>
          <PanelHeader
            title="Dealers"
            detail="Manage dealerships, approvals, and inventory."
          />
          <div className="table-card">
            <div className="table-header">
              <h4>Inventory CSV upload</h4>
            </div>
            <p className="muted-text">Upload many vehicles at once with a CSV file.</p>
            <div className="grid-two">
              <label className="field">
                <span>Mode</span>
                <select
                  value={inventoryUploadMode}
                  onChange={event =>
                    onInventoryUploadModeChange(event.target.value as InventoryUploadMode)
                  }>
                  <option value="UPSERT">Upsert existing VINs</option>
                  <option value="CREATE_ONLY">Create only</option>
                </select>
              </label>
              <label className="field">
                <span>CSV file</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={event => onInventoryUploadFileChange(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div className="inline-actions">
              <button
                type="button"
                className="primary-button"
                disabled={pendingInventoryUpload || !selectedDealerId || !inventoryUploadFile}
                onClick={() => {
                  onUploadDealerInventoryCsv().catch((error: unknown) => toast.error(toUserMessage(error)));
                }}>
                {pendingInventoryUpload ? 'Uploading...' : 'Upload CSV inventory'}
              </button>
            </div>
            {inventoryUploadMessage ? <p className="muted-text">{inventoryUploadMessage}</p> : null}
            {inventoryUploadResult ? (
              <div className="table-card">
                <div className="table-header">
                  <h4>Last upload result</h4>
                </div>
                <p className="muted-text">
                  Dealer {inventoryUploadResult.dealerName} (#{inventoryUploadResult.dealerId}) in{' '}
                  {formatLabel(inventoryUploadResult.mode)} mode.
                </p>
                {inventoryUploadResult.rows.length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>VIN</th>
                        <th>Status</th>
                        <th>Vehicle ID</th>
                        <th>Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryUploadResult.rows.map(row => (
                        <tr key={`${row.rowNumber}-${row.vin}`}>
                          <td>{row.rowNumber}</td>
                          <td>{row.vin}</td>
                          <td>{formatLabel(row.status)}</td>
                          <td>{row.vehicleId ?? '-'}</td>
                          <td>{row.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <EmptyState message="Upload completed with no row-level details returned." />
                )}
              </div>
            ) : null}
          </div>
          <div className="table-card">
            <div className="table-header">
              <h4>{editingDealerId ? 'Edit dealer' : 'Add dealer'}</h4>
            </div>
            <div className="grid-two">
              <label className="field">
                <span>Name</span>
                <input
                  value={dealerForm.name}
                  onChange={event => onDealerFormChange('name', event.target.value)}
                  placeholder="Downtown Autos"
                />
              </label>
              <label className="field">
                <span>License</span>
                <input
                  value={dealerForm.licenseNumber}
                  onChange={event => onDealerFormChange('licenseNumber', event.target.value)}
                  placeholder="DLR-00123"
                />
              </label>
              <label className="field">
                <span>City</span>
                <input
                  value={dealerForm.city}
                  onChange={event => onDealerFormChange('city', event.target.value)}
                  placeholder="San Francisco"
                />
              </label>
              <label className="field">
                <span>State</span>
                <input
                  value={dealerForm.state}
                  maxLength={2}
                  onChange={event =>
                    onDealerFormChange('state', event.target.value.toUpperCase())
                  }
                  placeholder="CA"
                />
              </label>
            </div>
            <div className="inline-actions">
              <button
                type="button"
                className="primary-button"
                disabled={pendingDealerSave}
                onClick={() => {
                  onSaveDealer().catch((error: unknown) => toast.error(toUserMessage(error)));
                }}>
                {pendingDealerSave
                  ? 'Saving...'
                  : editingDealerId
                    ? 'Update dealer'
                    : 'Create dealer'}
              </button>
              {editingDealerId ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={onCancelDealerEdit}>
                  Cancel edit
                </button>
              ) : null}
            </div>
          </div>
          <div className="table-card">
            <div className="table-header">
              <h4>{editingVehicleId ? 'Edit vehicle' : 'Add vehicle'}</h4>
            </div>
            <div className="grid-two">
              <label className="field">
                <span>Dealer ID</span>
                <input
                  value={vehicleForm.dealerId}
                  onChange={event => onVehicleFormChange('dealerId', event.target.value)}
                  placeholder="1"
                />
              </label>
              <label className="field">
                <span>VIN</span>
                <input
                  value={vehicleForm.vin}
                  onChange={event => onVehicleFormChange('vin', event.target.value.toUpperCase())}
                  placeholder="1HGCM82633A123456"
                />
              </label>
              <label className="field">
                <span>Model year</span>
                <input
                  value={vehicleForm.modelYear}
                  onChange={event => onVehicleFormChange('modelYear', event.target.value)}
                  placeholder="2024"
                />
              </label>
              <label className="field">
                <span>Make</span>
                <input
                  value={vehicleForm.make}
                  onChange={event => onVehicleFormChange('make', event.target.value)}
                  placeholder="Toyota"
                />
              </label>
              <label className="field">
                <span>Model</span>
                <input
                  value={vehicleForm.model}
                  onChange={event => onVehicleFormChange('model', event.target.value)}
                  placeholder="Camry"
                />
              </label>
              <label className="field">
                <span>Trim</span>
                <input
                  value={vehicleForm.trim}
                  onChange={event => onVehicleFormChange('trim', event.target.value)}
                  placeholder="XSE"
                />
              </label>
              <label className="field">
                <span>Mileage</span>
                <input
                  value={vehicleForm.mileage}
                  onChange={event => onVehicleFormChange('mileage', event.target.value)}
                  placeholder="12000"
                />
              </label>
              <label className="field">
                <span>Price</span>
                <input
                  value={vehicleForm.price}
                  onChange={event => onVehicleFormChange('price', event.target.value)}
                  placeholder="28990"
                />
              </label>
              <label className="field">
                <span>Status</span>
                <select
                  value={vehicleForm.status}
                  onChange={event => onVehicleFormChange('status', event.target.value)}>
                  <option value="DRAFT">Draft</option>
                  <option value="LIVE">Live</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="SOLD">Sold</option>
                </select>
              </label>
              <label className="field">
                <span>Image URLs (comma-separated, max {MAX_VEHICLE_PHOTOS})</span>
                <input
                  value={vehicleForm.imageUrls}
                  onChange={event => onVehicleFormChange('imageUrls', event.target.value)}
                  placeholder="https://img-1, https://img-2"
                  aria-invalid={
                    vehicleForm.imageUrls
                      .split(',')
                      .map(v => v.trim())
                      .filter(Boolean).length > MAX_VEHICLE_PHOTOS
                  }
                />
                {(() => {
                  const count = vehicleForm.imageUrls
                    .split(',')
                    .map(v => v.trim())
                    .filter(Boolean).length;
                  return (
                    <span
                      className={
                        count > MAX_VEHICLE_PHOTOS
                          ? 'field-error'
                          : 'field-hint'
                      }>
                      {count}/{MAX_VEHICLE_PHOTOS} photos
                      {count > MAX_VEHICLE_PHOTOS
                        ? ' — remove some to publish'
                        : ''}
                    </span>
                  );
                })()}
              </label>
            </div>
            <div className="inline-actions">
              <button
                type="button"
                className="primary-button"
                disabled={pendingVehicleSave}
                onClick={() => {
                  onSaveVehicle().catch((error: unknown) => toast.error(toUserMessage(error)));
                }}>
                {pendingVehicleSave
                  ? 'Saving...'
                  : editingVehicleId
                    ? 'Update vehicle'
                    : 'Create vehicle'}
              </button>
              {editingVehicleId ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={onCancelVehicleEdit}>
                  Cancel edit
                </button>
              ) : null}
            </div>
          </div>
          <ResourceBlock state={dealers}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>License</th>
                  <th>Location</th>
                  <th>Approval</th>
                  <th>Inventory</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(dealers.data ?? []).map(dealer => (
                  <tr key={dealer.id}>
                    <td>{dealer.name}</td>
                    <td>{dealer.licenseNumber}</td>
                    <td>{dealer.city}, {dealer.state}</td>
                    <td>{dealer.approved ? 'APPROVED' : 'PENDING'}</td>
                    <td>{dealerInventoryCounts[dealer.id] ?? '-'}</td>
                    <td>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => {
                          onStartDealerEdit(dealer);
                        }}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        disabled={!(vehicles.data ?? []).some(vehicle => vehicle.dealerId === dealer.id)}
                        onClick={() => {
                          const dealerVehicle = (vehicles.data ?? []).find(
                            vehicle => vehicle.dealerId === dealer.id,
                          );
                          if (dealerVehicle) {
                            onStartVehicleEdit(dealerVehicle);
                          }
                        }}>
                        Edit vehicle
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        disabled={pendingDealerId === dealer.id}
                        onClick={() => {
                          onToggleDealerApproval(dealer).catch((error: unknown) => toast.error(toUserMessage(error)));
                        }}>
                        {pendingDealerId === dealer.id
                          ? 'Updating...'
                          : dealer.approved
                            ? 'Set pending'
                            : 'Approve'}
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        disabled={pendingDealerInventoryId === dealer.id}
                        onClick={() => {
                          onLoadDealerInventory(dealer).catch((error: unknown) => toast.error(toUserMessage(error)));
                        }}>
                        {pendingDealerInventoryId === dealer.id ? 'Loading...' : 'Load inventory'}
                      </button>
                      {dealerActionMessages[dealer.id] ? (
                        <p className="muted-text">{dealerActionMessages[dealer.id]}</p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResourceBlock>
          <div className="table-card">
            <div className="table-header">
              <h4>Loaded dealer inventory detail</h4>
            </div>
            {dealerInventoryLabel ? (
              <p className="muted-text">Showing inventory for {dealerInventoryLabel}.</p>
            ) : (
              <p className="muted-text">
                Use "Load inventory" on a dealer to fetch and inspect its inventory rows.
              </p>
            )}
            {dealerInventoryRows.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>VIN</th>
                    <th>Vehicle</th>
                    <th>Status</th>
                    <th>Mileage</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dealerInventoryRows.map(vehicle => {
                    const isLive = vehicle.status === 'LIVE';
                    const publishing = pendingVehiclePublishId === vehicle.id;
                    return (
                    <tr key={vehicle.id}>
                      <td>{vehicle.vin}</td>
                      <td>
                        {vehicle.modelYear} {vehicle.make} {vehicle.model} {vehicle.trim}
                      </td>
                      <td>
                        <span
                          className={`listing-badge status-${vehicle.status.toLowerCase()}`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td>{formatMileage(vehicle.mileage)}</td>
                      <td>{formatCurrency(vehicle.price)}</td>
                      <td>
                        <div className="inline-actions">
                          {vehicle.status === 'SOLD' ? (
                            <span className="muted-text">Sold</span>
                          ) : (
                            <button
                              type="button"
                              className={
                                isLive
                                  ? 'secondary-button compact-button'
                                  : 'primary-button compact-button'
                              }
                              disabled={publishing}
                              onClick={() => {
                                onToggleVehiclePublish(vehicle).catch(
                                  (error: unknown) =>
                                    toast.error(toUserMessage(error)),
                                );
                              }}>
                              {publishing
                                ? 'Saving…'
                                : isLive
                                  ? 'Unpublish'
                                  : 'Publish'}
                            </button>
                          )}
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => onStartVehicleEdit(vehicle)}>
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : dealerInventoryLabel ? (
              <EmptyState message="No inventory rows were returned for this dealer." />
            ) : null}
          </div>
        </>
      );
    case 'reporting':
      return (
        <>
          <PanelHeader
            title="Reporting"
            detail="Operations metrics are live. Revenue performance reporting is coming soon."
          />
          <div className="report-tabs">
            <span className="report-tab active">Operations</span>
            <span className="report-tab disabled">Performance (Phase 2)</span>
          </div>
          <div className="table-card">
            <div className="table-header">
              <h4>Dealer portal focus</h4>
            </div>
            <label className="field">
              <span>Dealer</span>
              <select
                value={selectedDealerId ?? ''}
                onChange={event => {
                  onSelectDealer(event.target.value ? Number(event.target.value) : null);
                }}>
                <option value="">Select dealer</option>
                {(dealers.data ?? []).map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} (#{item.id})
                  </option>
                ))}
              </select>
            </label>
          </div>
          {featureFlags.dealerOnboarding && dealerOnboarding.data ? (
            <OnboardingChecklist onboarding={dealerOnboarding.data} />
          ) : null}
          <ResourceBlock state={dealerPortal}>
            {dealerPortal.data ? <OperationsDashboard portal={dealerPortal.data} /> : null}
          </ResourceBlock>
          <div className="report-grid">
            <SummaryBox title="Selected vehicle" value={selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : 'None'} />
            <SummaryBox title="Lead count" value={String(dashboard.data?.newLeadCount ?? leads.data?.length ?? 0)} />
            <SummaryBox title="Appointment count" value={String(dashboard.data?.requestedAppointmentCount ?? appointments.data?.length ?? 0)} />
            <SummaryBox title="Total dealers" value={String(dashboard.data?.dealerCount ?? dealers.data?.length ?? 0)} />
            <SummaryBox title="Total vehicles" value={String(dashboard.data?.vehicleCount ?? vehicles.data?.length ?? 0)} />
            <SummaryBox title="Live vehicles" value={String(dashboard.data?.liveVehicleCount ?? 0)} />
          </div>
          <ResourceBlock state={dashboard}>
            {dashboard.data ? (
              <div className="table-card">
                <div className="table-header">
                  <h4>System snapshot</h4>
                </div>
                <div className="chip-row">
                  <span className="listing-chip">Dealers {dashboard.data.dealerCount}</span>
                  <span className="listing-chip">Vehicles {dashboard.data.vehicleCount}</span>
                  <span className="listing-chip">Live vehicles {dashboard.data.liveVehicleCount}</span>
                  <span className="listing-chip">New leads {dashboard.data.newLeadCount}</span>
                  <span className="listing-chip">
                    Requested appointments {dashboard.data.requestedAppointmentCount}
                  </span>
                </div>
              </div>
            ) : null}
          </ResourceBlock>
          <ResourceBlock state={dealerPortal}>
            {dealerPortal.data ? (
              <>
                <div className="table-card">
                  <div className="table-header">
                    <h4>Dealer portal overview</h4>
                  </div>
                  <div className="chip-row">
                    <span className="listing-chip">
                      Live inventory {dealerPortal.data.overview.liveInventoryCount}
                    </span>
                    <span className="listing-chip">
                      Active deals {dealerPortal.data.overview.activeDealCount}
                    </span>
                    <span className="listing-chip">
                      Ready for handoff {dealerPortal.data.overview.readyForHandoffCount}
                    </span>
                    <span className="listing-chip">
                      Open tasks {dealerPortal.data.overview.openTaskCount}
                    </span>
                    <span className="listing-chip">
                      Unread notifications {dealerPortal.data.overview.unreadNotificationCount}
                    </span>
                    <span className="listing-chip">
                      Stalled deals {dealerPortal.data.overview.stalledDealCount}
                    </span>
                  </div>
                </div>
                <div className="table-card">
                  <div className="table-header">
                    <h4>Dealer portal pipeline snapshot</h4>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Metric bucket</th>
                        <th>Breakdown</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Inventory statuses</td>
                        <td>
                          {dealerPortal.data.pipeline.inventoryStatusCounts
                            .map(item => `${formatLabel(item.code)} ${item.count}`)
                            .join(' | ') || 'No data'}
                        </td>
                      </tr>
                      <tr>
                        <td>Lead statuses</td>
                        <td>
                          {dealerPortal.data.pipeline.leadStatusCounts
                            .map(item => `${formatLabel(item.code)} ${item.count}`)
                            .join(' | ') || 'No data'}
                        </td>
                      </tr>
                      <tr>
                        <td>Appointment statuses</td>
                        <td>
                          {dealerPortal.data.pipeline.appointmentStatusCounts
                            .map(item => `${formatLabel(item.code)} ${item.count}`)
                            .join(' | ') || 'No data'}
                        </td>
                      </tr>
                      <tr>
                        <td>Deal stages</td>
                        <td>
                          {dealerPortal.data.pipeline.dealStageCounts
                            .map(item => `${formatLabel(item.code)} ${item.count}`)
                            .join(' | ') || 'No data'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {(dealerPortal.data.recentDeals ?? []).length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Recent portal deals</th>
                        <th>Stage</th>
                        <th>Next action</th>
                        <th>Blockers</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dealerPortal.data.recentDeals ?? []).map(item => (
                        <tr key={item.dealId}>
                          <td>{item.vehicleTitle}</td>
                          <td>{formatLabel(item.stage)}</td>
                          <td>{item.nextAction}</td>
                          <td>{item.blockers.length > 0 ? item.blockers.join(', ') : 'None'}</td>
                          <td>{formatDateTime(item.updatedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <EmptyState message="No recent dealer portal deals returned for the selected dealer." />
                )}
                {(dealerPortal.data.recentActivity ?? []).length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Recent activity</th>
                        <th>Type</th>
                        <th>Message</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dealerPortal.data.recentActivity ?? []).map((item, index) => (
                        <tr key={`${item.dealId}-${item.createdAt}-${index}`}>
                          <td>{item.vehicleTitle}</td>
                          <td>{formatLabel(item.eventType)}</td>
                          <td>{item.message}</td>
                          <td>{formatDateTime(item.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <EmptyState message="No recent dealer portal activity returned for the selected dealer." />
                )}
              </>
            ) : (
              <EmptyState message="Select a dealer to view portal metrics." />
            )}
          </ResourceBlock>
          <ResourceBlock state={dealerQueue}>
            {dealerQueue.data ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Queue bucket</th>
                    <th>Deal count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Awaiting buyer</td>
                    <td>{dealerQueue.data.summary.awaitingBuyerCount}</td>
                  </tr>
                  <tr>
                    <td>Needs document review</td>
                    <td>{dealerQueue.data.summary.needsDocumentReviewCount}</td>
                  </tr>
                  <tr>
                    <td>Ready for handoff</td>
                    <td>{dealerQueue.data.summary.readyForHandoffCount}</td>
                  </tr>
                  <tr>
                    <td>Stalled</td>
                    <td>{dealerQueue.data.summary.stalledCount}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <EmptyState message="Dealer queue summary appears here once a dealer is selected." />
            )}
          </ResourceBlock>
          <ResourceBlock state={dealerInbox}>
            {dealerInbox.data ? (
              <div className="table-card">
                <div className="table-header">
                  <h4>Dealer inbox summary</h4>
                </div>
                <div className="chip-row">
                  <span className="listing-chip">
                    Total deals {dealerInbox.data.inbox.summary.totalDeals}
                  </span>
                  <span className="listing-chip">
                    Open tasks {dealerInbox.data.inbox.summary.openTaskCount}
                  </span>
                  <span className="listing-chip">
                    In progress {dealerInbox.data.inbox.summary.inProgressTaskCount}
                  </span>
                  <span className="listing-chip">
                    Ready for handoff {dealerInbox.data.inbox.summary.readyForHandoffCount}
                  </span>
                </div>
              </div>
            ) : (
              <EmptyState message="Dealer inbox summary appears here once a dealer is selected." />
            )}
          </ResourceBlock>
          <ResourceBlock state={dealerSubscription}>
            {dealerSubscription.data ? (
              <div className="table-card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Monthly price</th>
                      <th>Current period</th>
                      <th>Auto renew</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{formatLabel(dealerSubscription.data!.plan)}</td>
                      <td>{formatLabel(dealerSubscription.data!.status)}</td>
                      <td>{formatCurrency(dealerSubscription.data!.monthlyPrice)}</td>
                      <td>
                        {formatDateTime(dealerSubscription.data!.currentPeriodStart)} -{' '}
                        {formatDateTime(dealerSubscription.data!.currentPeriodEnd)}
                      </td>
                      <td>{dealerSubscription.data!.autoRenew ? 'Enabled' : 'Disabled'}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="form-grid">
                  <label className="field">
                    <span>Plan</span>
                    <select
                      value={subscriptionForm?.plan ?? dealerSubscription.data!.plan}
                      onChange={event =>
                        onSubscriptionFormChange({
                          plan: event.target.value as SubscriptionPlan,
                          status: subscriptionForm?.status ?? dealerSubscription.data!.status,
                          autoRenew:
                            subscriptionForm?.autoRenew ?? dealerSubscription.data!.autoRenew,
                        })
                      }>
                      {subscriptionPlans.map(plan => (
                        <option key={plan} value={plan}>
                          {formatLabel(plan)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Status</span>
                    <select
                      value={subscriptionForm?.status ?? dealerSubscription.data!.status}
                      onChange={event =>
                        onSubscriptionFormChange({
                          plan: subscriptionForm?.plan ?? dealerSubscription.data!.plan,
                          status: event.target.value as SubscriptionStatus,
                          autoRenew:
                            subscriptionForm?.autoRenew ?? dealerSubscription.data!.autoRenew,
                        })
                      }>
                      {subscriptionStatuses.map(status => (
                        <option key={status} value={status}>
                          {formatLabel(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={subscriptionForm?.autoRenew ?? dealerSubscription.data!.autoRenew}
                    onChange={event =>
                      onSubscriptionFormChange({
                        plan: subscriptionForm?.plan ?? dealerSubscription.data!.plan,
                        status: subscriptionForm?.status ?? dealerSubscription.data!.status,
                        autoRenew: event.target.checked,
                      })
                    }
                  />
                  <span>Auto renew</span>
                </label>
                <div className="inline-actions">
                  <button
                    type="button"
                    className="primary-button"
                    disabled={pendingSubscriptionSave}
                    onClick={() => {
                      onSaveSubscription().catch((error: unknown) => toast.error(toUserMessage(error)));
                    }}>
                    {pendingSubscriptionSave ? 'Saving subscription...' : 'Save subscription'}
                  </button>
                </div>
              </div>
            ) : (
              <EmptyState message="Subscription details appear here once a dealer is selected." />
            )}
          </ResourceBlock>
          <ResourceBlock state={dealerInvoices}>
            {(dealerInvoices.data ?? []).length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Period</th>
                    <th>Due</th>
                    <th>Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {(dealerInvoices.data ?? []).map(invoice => (
                    <tr key={invoice.id}>
                      <td>{invoice.invoiceNumber}</td>
                      <td>{formatLabel(invoice.status)}</td>
                      <td>{formatCurrency(invoice.amount)}</td>
                      <td>
                        {formatDateTime(invoice.periodStart)} - {formatDateTime(invoice.periodEnd)}
                      </td>
                      <td>{formatDateTime(invoice.dueAt)}</td>
                      <td>{invoice.paidAt ? formatDateTime(invoice.paidAt) : 'Unpaid'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState message="No portal invoices returned for the selected dealer." />
            )}
          </ResourceBlock>
          <ResourceBlock state={dealerPortalDeals}>
            {(dealerPortalDeals.data ?? []).length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Portal deals</th>
                    <th>Stage</th>
                    <th>Next action</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {(dealerPortalDeals.data ?? []).map(item => (
                    <tr key={item.dealId}>
                      <td>{item.vehicleTitle}</td>
                      <td>{formatLabel(item.stage)}</td>
                      <td>{item.nextAction}</td>
                      <td>{formatDateTime(item.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState message="No dealer portal deals returned for the selected dealer." />
            )}
          </ResourceBlock>
          <ResourceBlock state={dealerPortalLeads}>
            {(dealerPortalLeads.data ?? []).length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Portal leads</th>
                    <th>Status</th>
                    <th>Buyer</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(dealerPortalLeads.data ?? []).map(item => (
                    <tr key={item.id}>
                      <td>{item.vehicleTitle}</td>
                      <td>{formatLabel(item.status)}</td>
                      <td>{item.buyerName}</td>
                      <td>{formatDateTime(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState message="No dealer portal leads returned for the selected dealer." />
            )}
          </ResourceBlock>
          <ResourceBlock state={dealerPortalAppointments}>
            {(dealerPortalAppointments.data ?? []).length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Portal appointments</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Scheduled</th>
                  </tr>
                </thead>
                <tbody>
                  {(dealerPortalAppointments.data ?? []).map(item => (
                    <tr key={item.id}>
                      <td>{item.vehicleTitle}</td>
                      <td>{formatLabel(item.status)}</td>
                      <td>{formatLabel(item.type)}</td>
                      <td>{formatDateTime(item.scheduledAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState message="No dealer portal appointments returned for the selected dealer." />
            )}
          </ResourceBlock>
          <ResourceBlock state={dealerPortalDocuments}>
            {(dealerPortalDocuments.data ?? []).length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Portal documents</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {(dealerPortalDocuments.data ?? []).map(item => (
                    <tr key={item.id}>
                      <td>{item.vehicleTitle}</td>
                      <td>{formatLabel(item.type)}</td>
                      <td>{formatLabel(item.status)}</td>
                      <td>{formatDateTime(item.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState message="No dealer portal documents returned for the selected dealer." />
            )}
          </ResourceBlock>
          <ResourceBlock state={buyerInbox}>
            <div className="table-card">
              <div className="table-header">
                <h4>Buyer inbox summary</h4>
              </div>
              <div className="chip-row">
                <span className="listing-chip">Deals {buyerInbox.data?.summary.totalDeals ?? 0}</span>
                <span className="listing-chip">Active {buyerInbox.data?.summary.activeDeals ?? 0}</span>
                <span className="listing-chip">
                  In progress tasks {buyerInbox.data?.summary.inProgressTaskCount ?? 0}
                </span>
                <span className="listing-chip">
                  Ready for handoff {buyerInbox.data?.summary.readyForHandoffCount ?? 0}
                </span>
              </div>
            </div>
            {(buyerInbox.data?.deals ?? []).length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Stage</th>
                    <th>Next action</th>
                    <th>Blockers</th>
                  </tr>
                </thead>
                <tbody>
                  {(buyerInbox.data?.deals ?? []).map(item => (
                    <tr key={item.dealId}>
                      <td>{item.vehicleTitle}</td>
                      <td>{formatLabel(item.stage)}</td>
                      <td>{item.nextAction}</td>
                      <td>{item.blockers.length > 0 ? item.blockers.join(', ') : 'None'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState message="No inbox deals found for this buyer reference." />
            )}
            {(buyerInbox.data?.tasks ?? []).length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Due</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(buyerInbox.data?.tasks ?? []).map(task => (
                    <tr key={task.id}>
                      <td>{task.title}</td>
                      <td>{formatLabel(task.status)}</td>
                      <td>{task.dueAt ? formatDateTime(task.dueAt) : 'No due date'}</td>
                      <td>
                        {task.status === 'COMPLETED' || task.status === 'CANCELED' ? (
                          'No action'
                        ) : (
                          <div className="button-row">
                            <button
                              type="button"
                              className="secondary-button"
                              disabled={pendingTaskId === task.id}
                              onClick={() => {
                                const nextStatus =
                                  task.status === 'OPEN' ? 'IN_PROGRESS' : 'COMPLETED';
                                onUpdateBuyerTaskStatus(task.id, nextStatus).catch((error: unknown) => toast.error(toUserMessage(error)));
                              }}>
                              {pendingTaskId === task.id
                                ? 'Updating...'
                                : task.status === 'OPEN'
                                  ? 'Start task'
                                  : 'Mark complete'}
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              disabled={pendingTaskId === task.id}
                              onClick={() => {
                                onUpdateBuyerTaskStatus(task.id, 'CANCELED').catch((error: unknown) => toast.error(toUserMessage(error)));
                              }}>
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState message="No inbox tasks found for this buyer reference." />
            )}
          </ResourceBlock>
          <ResourceBlock state={notifications}>
            {(notifications.data ?? []).length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Message</th>
                    <th>Created</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(notifications.data ?? []).map(item => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td>{item.message}</td>
                      <td>{formatDateTime(item.createdAt)}</td>
                      <td>
                        {item.read ? (
                          'READ'
                        ) : (
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={pendingNotificationId === item.id}
                            onClick={() => {
                              onMarkNotificationAsRead(item.id).catch((error: unknown) => toast.error(toUserMessage(error)));
                            }}>
                            {pendingNotificationId === item.id ? 'Updating...' : 'Mark read'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState message="No notifications found for this buyer reference." />
            )}
          </ResourceBlock>
        </>
      );
    case 'fni-catalog':
      return (
        <>
          <PanelHeader
            title="F&I product catalog"
            detail="Manage the warranty, GAP, and protection products dealers can attach to deals."
          />
          <AdminFAndIProducts />
        </>
      );
    case 'audit':
      return (
        <>
          <PanelHeader
            title="Audit trail"
            detail="Append-only log of high-value actions across the platform."
          />
          <AdminAudit />
        </>
      );
    case 'dealer-profile':
      return (
        <>
          <PanelHeader
            title="About this dealership"
            detail="The independent, licensed dealer selling this vehicle."
          />
          <ResourceBlock state={dealerProfile}>
            {dealerProfile.data ? (
              <DealerProfileView
                dealer={dealerProfile.data}
                vehicles={dealerProfileVehicles.data ?? []}
                onOpenVehicle={vehicleId => {
                  onSelectVehicle(vehicleId);
                  onNavigate('vehicle');
                }}
                onBrowse={() => onNavigate('inventory')}
              />
            ) : (
              <EmptyState message="Select a vehicle to view its dealer." />
            )}
          </ResourceBlock>
        </>
      );
    case 'about':
      return (
        <>
          <PanelHeader
            title="About StealADeal"
            detail="Who we are and how the platform works."
          />
          <AboutView />
        </>
      );
    case 'terms':
      return (
        <>
          <PanelHeader
            title="Terms & Conditions"
            detail="The terms that govern use of the StealADeal platform."
          />
          <TermsView onNavigate={onNavigate} />
        </>
      );
    case 'dealer-terms':
      return (
        <>
          <PanelHeader
            title="Dealer Subscription Agreement"
            detail="The master agreement between StealADeal and a participating dealer."
          />
          <DealerTermsView />
        </>
      );
    case 'privacy':
      return (
        <>
          <PanelHeader
            title="Privacy Policy"
            detail="What we collect and how it is used."
          />
          <PrivacyView />
        </>
      );
    case 'faq':
      return (
        <>
          <PanelHeader
            title="Help & FAQ"
            detail="Common questions about buying and selling on StealADeal."
          />
          <FaqView />
        </>
      );
    case 'contact':
      return (
        <>
          <PanelHeader
            title="Contact"
            detail="Reach the StealADeal team."
          />
          <ContactView />
        </>
      );
    default:
      return null;
  }
}
