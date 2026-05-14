import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {
  api,
  setAuthToken,
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
  type DealerPortal,
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
  | 'leads'
  | 'appointments'
  | 'deal-room'
  | 'dealers'
  | 'reporting';

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const navItems: Array<{id: NavView; label: string; roles?: Array<CurrentUser['role']>}> = [
  {id: 'overview', label: 'Overview'},
  {id: 'inventory', label: 'Inventory'},
  {id: 'vehicle', label: 'Vehicle Detail', roles: ['BUYER', 'ADMIN']},
  {id: 'deal-room', label: 'Deal Room', roles: ['BUYER', 'DEALER', 'ADMIN']},
  {id: 'leads', label: 'Leads', roles: ['DEALER', 'ADMIN']},
  {id: 'appointments', label: 'Appointments', roles: ['DEALER', 'ADMIN']},
  {id: 'dealers', label: 'Dealers', roles: ['ADMIN']},
  {id: 'reporting', label: 'Reporting', roles: ['DEALER', 'ADMIN']},
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

export default function App() {
  const [activeView, setActiveView] = useState<NavView>('overview');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [listingQuery, setListingQuery] = useState('');
  const [listingStatus, setListingStatus] = useState<'ALL' | Vehicle['status']>('LIVE');
  const [maxListingPrice, setMaxListingPrice] = useState(45000);
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
  const visibleNavItems = useMemo(
    () => navItems.filter(item => !item.roles || item.roles.includes(currentRole)),
    [currentRole],
  );
  useEffect(() => {
    if (!visibleNavItems.some(item => item.id === activeView)) {
      setActiveView(visibleNavItems[0]?.id ?? 'overview');
    }
  }, [activeView, visibleNavItems]);
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
      name: currentUser.data?.displayName ?? 'Desktop Demo Buyer',
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
  const [selectedDealerId, setSelectedDealerId] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedDealerId && (dealers.data?.length ?? 0) > 0) {
      setSelectedDealerId(dealers.data?.[0].id ?? null);
    }
  }, [dealers.data, selectedDealerId]);

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
  const dealerPortal = useRemoteResource(loadDealerPortal);
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
      const matchesPrice = vehicle.price <= maxListingPrice;
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

      return matchesStatus && matchesPrice && matchesQuery;
    });
  }, [listingQuery, listingStatus, maxListingPrice, vehicles.data]);

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
        message: 'Requesting pricing clarity and next steps from the desktop experience.',
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

    try {
      const updatedDeal = await api.payDealDeposit(selectedDeal.id, {
        amount: selectedDeal.depositAmount,
      });
      await deals.refresh();
      setDealMessage(
        `Deposit recorded for deal #${updatedDeal.id}. Stage is now ${updatedDeal.stage}.`,
      );
    } catch (error) {
      setDealMessage(getErrorMessage(error));
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
      setDealMessage(`Document ${document.fileName} added to the deal room.`);
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

  const updateBuyerTaskStatus = useCallback(
    async (taskId: number, status: DealTaskStatus) => {
      setPendingTaskId(taskId);
      setDealMessage(null);

      try {
        const updatedTask = await api.updateTaskStatus(taskId, {status});
        await buyerInbox.refresh();
        await notifications.refresh();
        setDealMessage(`Task "${updatedTask.title}" moved to ${formatLabel(updatedTask.status)}.`);
      } catch (error) {
        setDealMessage(getErrorMessage(error));
      } finally {
        setPendingTaskId(null);
      }
    },
    [buyerInbox, notifications],
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
      setAuthToken(auth.token);
      window.location.reload();
    } catch (error) {
      setAuthMessage(getErrorMessage(error));
    } finally {
      setPendingAuthEmail(null);
    }
  }, []);

  const signOut = useCallback(() => {
    setAuthToken(null);
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
      setAuthToken(auth.token);
      window.location.reload();
    } catch (error) {
      setAuthMessage(getErrorMessage(error));
    } finally {
      setPendingRegister(false);
    }
  }, [registerForm]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <p className="brand-kicker">Steal A Deal</p>
          <h1 className="brand-title">Car buying made clearer</h1>
          <p className="brand-copy">
            Browse listings, review details, and take the next step without dealership noise.
          </p>
        </div>

        <nav className="nav">
          {visibleNavItems.map(item => (
            <button
              key={item.id}
              className={item.id === activeView ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveView(item.id)}
              type="button">
              {item.label}
            </button>
          ))}
        </nav>

        <div className="auth-panel">
          <p className="auth-panel-title">Demo access</p>
          <div className="auth-actions">
            {demoAccounts.map(account => (
              <button
                key={account.email}
                type="button"
                className="secondary-button"
                disabled={pendingAuthEmail === account.email}
                onClick={() => {
                  signInDemoAccount(account).catch(() => {});
                }}>
                {pendingAuthEmail === account.email ? 'Signing in...' : account.label}
              </button>
            ))}
          </div>
          <button type="button" className="ghost-button" onClick={signOut}>
            Sign out
          </button>
          <div className="auth-register">
            <p className="auth-panel-title">Create account</p>
            <input
              className="text-input"
              value={registerForm.displayName}
              onChange={event => {
                setRegisterForm(current => ({...current, displayName: event.target.value}));
              }}
              placeholder="Full name"
            />
            <input
              className="text-input"
              type="email"
              value={registerForm.email}
              onChange={event => {
                setRegisterForm(current => ({...current, email: event.target.value}));
              }}
              placeholder="Email"
            />
            <input
              className="text-input"
              type="password"
              value={registerForm.password}
              onChange={event => {
                setRegisterForm(current => ({...current, password: event.target.value}));
              }}
              placeholder="Password"
            />
            <select
              className="text-input"
              value={registerForm.role}
              onChange={event => {
                setRegisterForm(current => ({
                  ...current,
                  role: event.target.value as UserRole,
                  dealerId: event.target.value === 'DEALER' ? current.dealerId : '',
                }));
              }}>
              <option value="BUYER">Buyer</option>
              <option value="DEALER">Dealer</option>
              <option value="ADMIN">Admin</option>
            </select>
            {registerForm.role === 'DEALER' ? (
              <input
                className="text-input"
                type="number"
                min={1}
                value={registerForm.dealerId}
                onChange={event => {
                  setRegisterForm(current => ({...current, dealerId: event.target.value}));
                }}
                placeholder="Dealer ID"
              />
            ) : null}
            <button
              type="button"
              className="secondary-button"
              disabled={pendingRegister}
              onClick={() => {
                registerAccount().catch(() => {});
              }}>
              {pendingRegister ? 'Creating...' : 'Create account'}
            </button>
          </div>
          {authMessage ? <p className="auth-error">{authMessage}</p> : null}
        </div>

      </aside>

      <main className="content">
        <header className="hero">
          <div>
            <p className="hero-eyebrow">Buyer experience</p>
            <h2 className="hero-title">Find the right car with cleaner browsing and faster next steps.</h2>
            <p className="hero-copy">
              Explore live inventory, open vehicle details, and request follow-up or a test drive
              from one focused desktop experience.
            </p>
          </div>
          <div className="hero-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                vehicles.refresh().catch(() => {});
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
              selectedVehicle,
              vehicleDetail,
              leads,
              appointments,
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
              listingQuery,
              listingStatus,
              maxListingPrice,
              onListingQueryChange: setListingQuery,
              onListingStatusChange: setListingStatus,
              onMaxListingPriceChange: setMaxListingPrice,
              listingActiveImages,
              onListingActiveImageChange: (vehicleId, imageUrl) => {
                setListingActiveImages(current => ({...current, [vehicleId]: imageUrl}));
              },
              detailActiveImage,
              onDetailActiveImageChange: setDetailActiveImage,
              onCreateDeal: createDeal,
              onPayDeposit: payDeposit,
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
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Trade-in VIN"
                    value={tradeInVin}
                    onChange={event => {
                      setTradeInVin(event.target.value);
                    }}
                  />
                  <input
                    type="number"
                    className="text-input"
                    placeholder="Trade-in mileage"
                    value={tradeInMileage}
                    min={0}
                    onChange={event => {
                      setTradeInMileage(event.target.value);
                    }}
                  />
                </>
              ) : null}
              <button
                type="button"
                className="primary-button"
                disabled={!selectedVehicleId || pendingDeal}
                onClick={() => {
                  createDeal().catch(() => {});
                }}>
                {pendingDeal ? 'Starting deal...' : selectedDeal ? 'Open deal room' : 'Start checkout'}
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={!selectedVehicleId || pendingLead}
                onClick={() => {
                  createLead().catch(() => {});
                }}>
                {pendingLead ? 'Sending inquiry...' : 'Ask a question'}
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={!selectedVehicleId || pendingAppointment}
                onClick={() => {
                  createAppointment().catch(() => {});
                }}>
                {pendingAppointment ? 'Requesting appointment...' : 'Request test drive'}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function renderMainPanel(args: {
  activeView: NavView;
  liveVehicles: AsyncState<Vehicle[]>;
  vehicles: AsyncState<Vehicle[]>;
  buyerListingVehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  vehicleDetail: AsyncState<Vehicle | null>;
  leads: AsyncState<Lead[]>;
  appointments: AsyncState<Appointment[]>;
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
  listingQuery: string;
  listingStatus: 'ALL' | Vehicle['status'];
  maxListingPrice: number;
  onListingQueryChange: (value: string) => void;
  onListingStatusChange: (value: 'ALL' | Vehicle['status']) => void;
  onMaxListingPriceChange: (value: number) => void;
  listingActiveImages: Record<number, string>;
  onListingActiveImageChange: (vehicleId: number, imageUrl: string) => void;
  detailActiveImage: string | null;
  onDetailActiveImageChange: (imageUrl: string) => void;
  onCreateDeal: () => Promise<void>;
  onPayDeposit: () => Promise<void>;
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
    selectedVehicle,
    vehicleDetail,
    leads,
    appointments,
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
    listingQuery,
    listingStatus,
    maxListingPrice,
    onListingQueryChange,
    onListingStatusChange,
    onMaxListingPriceChange,
    listingActiveImages,
    onListingActiveImageChange,
    detailActiveImage,
    onDetailActiveImageChange,
    onCreateDeal,
    onPayDeposit,
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
    onCancelVehicleEdit,
    onSaveVehicle,
    onSubscriptionFormChange,
    onSaveSubscription,
  } = args;

  switch (activeView) {
    case 'overview':
      return (
        <>
          <PanelHeader
            title="Overview"
            detail="Desktop landing view focused on live inventory, dealers, and recent activity."
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
    case 'inventory':
      return (
        <>
          <PanelHeader
            title="Buyer listing page"
            detail="Live inventory browsing tuned for a car shopper instead of an operations table."
          />
          <ResourceBlock state={vehicles}>
            <div className="listing-shell">
              <section className="listing-hero">
                <div>
                  <p className="hero-eyebrow">Buyer inventory</p>
                  <h3 className="listing-title">Shop confidently with clear pricing and live availability.</h3>
                  <p className="listing-copy">
                    Browse active vehicles, narrow by budget, and jump straight into a detail view
                    or inquiry without leaving the listing page.
                  </p>
                </div>
                <div className="listing-summary">
                  <span>{buyerListingVehicles.length} matches</span>
                  <span>Max budget {formatCurrency(maxListingPrice)}</span>
                  <span>Status {listingStatus}</span>
                </div>
              </section>

              <section className="listing-toolbar">
                <label className="field">
                  <span>Search make, model, trim, dealer</span>
                  <input
                    value={listingQuery}
                    onChange={event => onListingQueryChange(event.target.value)}
                    placeholder="Try Honda, Tesla, family SUV..."
                  />
                </label>

                <label className="field compact">
                  <span>Status</span>
                  <select
                    value={listingStatus}
                    onChange={event =>
                      onListingStatusChange(event.target.value as 'ALL' | Vehicle['status'])
                    }>
                    <option value="ALL">All</option>
                    <option value="LIVE">Live</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="SOLD">Sold</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </label>

                <label className="field compact">
                  <span>Max price</span>
                  <input
                    type="range"
                    min="10000"
                    max="90000"
                    step="2500"
                    value={maxListingPrice}
                    onChange={event => onMaxListingPriceChange(Number(event.target.value))}
                  />
                </label>
              </section>

              <div className="chip-row">
                {[
                  'Transparent pricing',
                  'Live dealer inventory',
                  'Reserve-ready vehicles',
                  'Desktop comparison flow next',
                ].map(chip => (
                  <span key={chip} className="listing-chip">
                    {chip}
                  </span>
                ))}
              </div>

              {buyerListingVehicles.length > 0 ? (
                <div className="listing-grid">
                  {buyerListingVehicles.map(vehicle => (
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
                        <strong>{formatCurrency(vehicle.price)}</strong>
                      </div>
                      <h4>
                        {vehicle.modelYear} {vehicle.make} {vehicle.model}
                      </h4>
                      <p className="listing-trim">{vehicle.trim}</p>
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
                          className="secondary-button"
                          onClick={() => {
                            onSelectVehicle(vehicle.id);
                            onOpenVehicle();
                          }}>
                          View details
                        </button>
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => {
                            onSelectVehicle(vehicle.id);
                          }}>
                          Select vehicle
                        </button>
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
            </div>
          </ResourceBlock>
        </>
      );
    case 'vehicle':
      return (
        <>
          <PanelHeader title="Vehicle detail" detail="Selected inventory item with backend data." />
          <ResourceBlock state={vehicleDetail}>
            {vehicleDetail.data ? (
              <div className="detail-layout">
                <VehicleSummaryCard
                  vehicle={vehicleDetail.data}
                  large
                  activeImage={detailActiveImage}
                  onSelectImage={onDetailActiveImageChange}
                />
                <div className="detail-stack">
                  <DetailRow label="VIN" value={vehicleDetail.data.vin} />
                  <DetailRow label="Dealer" value={vehicleDetail.data.dealerName} />
                  <DetailRow label="Status" value={vehicleDetail.data.status} />
                  <DetailRow label="Mileage" value={formatMileage(vehicleDetail.data.mileage)} />
                  <DetailRow label="Price" value={formatCurrency(vehicleDetail.data.price)} />
                </div>
              </div>
            ) : (
              <EmptyState message="Select a vehicle from the inventory views." />
            )}
          </ResourceBlock>
        </>
      );
    case 'deal-room':
      return (
        <>
          <PanelHeader
            title="Deal room"
            detail="Review checkout totals, deposit status, and required documents for the selected vehicle."
          />
          {selectedDeal ? (
            <div className="deal-room-grid">
              <div className="deal-room-main">
                <div className="deal-banner">
                  <div>
                    <p className="hero-eyebrow">Active deal</p>
                    <h3 className="listing-title">{selectedDeal.vehicleTitle}</h3>
                    <p className="listing-copy">
                      Stage: {formatLabel(selectedDeal.stage)}. Fulfillment: {formatLabel(selectedDeal.fulfillmentType)} ({formatLabel(selectedDeal.fulfillmentStatus)}).
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
                    onClick={() => {
                      onPayDeposit().catch(() => {});
                    }}>
                    {pendingDeposit ? 'Recording deposit...' : selectedDeal.depositPaid ? 'Deposit recorded' : `Pay ${formatCurrency(selectedDeal.depositAmount)} deposit`}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={pendingStageUpdate}
                    onClick={() => {
                      onAdvanceDealStage().catch(() => {});
                    }}>
                    {pendingStageUpdate ? 'Updating stage...' : 'Advance deal stage'}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={pendingDocument}
                    onClick={() => {
                      onCreateInsuranceDocument().catch(() => {});
                    }}>
                    {pendingDocument ? 'Adding document...' : 'Add insurance proof'}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={pendingFulfillment}
                    onClick={() => {
                      onScheduleFulfillment().catch(() => {});
                    }}>
                    {pendingFulfillment ? 'Scheduling fulfillment...' : 'Schedule fulfillment'}
                  </button>
                </div>
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
                    <EmptyState message="No documents in the deal room yet." />
                  )}
                </ResourceBlock>
              </div>

              <div className="panel-subsection">
                <h4 className="panel-title">Readiness & blockers</h4>
                <ResourceBlock state={dealReadiness}>
                  {dealReadiness.data ? (
                    <div className="stack">
                      <DetailRow
                        label="Ready for handoff"
                        value={dealReadiness.data.readyForHandoff ? 'Yes' : 'No'}
                      />
                      <DetailRow
                        label="Ready for completion"
                        value={dealReadiness.data.readyForCompletion ? 'Yes' : 'No'}
                      />
                      <DetailRow
                        label="Completed"
                        value={dealReadiness.data.completed ? 'Yes' : 'No'}
                      />
                      {dealReadiness.data.blockers.length > 0 ? (
                        <div className="stack">
                          {dealReadiness.data.blockers.map(blocker => (
                            <span key={blocker} className="listing-chip">
                              {blocker}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span>No blockers currently reported.</span>
                      )}
                    </div>
                  ) : (
                    <EmptyState message="No readiness details available yet." />
                  )}
                </ResourceBlock>
              </div>

              <div className="panel-subsection">
                <h4 className="panel-title">Deal tasks</h4>
                <ResourceBlock state={dealTasks}>
                  {(dealTasks.data ?? []).length > 0 ? (
                    <div className="stack">
                      {(dealTasks.data ?? []).map(task => (
                        <div key={task.id} className="document-card">
                          <strong>{task.title}</strong>
                          <span>{task.description}</span>
                          <span>
                            {formatLabel(task.status)} • {formatLabel(task.assigneeType)}
                          </span>
                          <span>{task.dueAt ? formatDateTime(task.dueAt) : 'No due date'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="No computed tasks for this deal." />
                  )}
                </ResourceBlock>
              </div>

              <div className="panel-subsection">
                <h4 className="panel-title">Activity timeline</h4>
                <ResourceBlock state={dealActivity}>
                  {(dealActivity.data ?? []).length > 0 ? (
                    <div className="stack">
                      {(dealActivity.data ?? []).map(item => (
                        <div key={item.id} className="document-card">
                          <strong>{formatLabel(item.eventType)}</strong>
                          <span>{item.message}</span>
                          <span>{formatDateTime(item.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="No timeline events returned for this deal." />
                  )}
                </ResourceBlock>
              </div>
            </div>
          ) : (
            <div className="stack">
              <EmptyState message="No deal has been started for the selected vehicle yet." />
              <button
                type="button"
                className="primary-button"
                disabled={!selectedVehicle || pendingDeal}
                onClick={() => {
                  onCreateDeal().catch(() => {});
                }}>
                {pendingDeal ? 'Starting deal...' : 'Start deal room'}
              </button>
            </div>
          )}
        </>
      );
    case 'leads':
      return (
        <>
          <PanelHeader title="Lead queue" detail="Live results from GET /api/leads." />
          <ResourceBlock state={leads}>
            {(leads.data ?? []).length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Buyer</th>
                    <th>Vehicle</th>
                    <th>Status</th>
                    <th>Email</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(leads.data ?? []).map(lead => (
                    <tr key={lead.id}>
                      <td>{lead.buyerName}</td>
                      <td>#{lead.vehicleId}</td>
                      <td>{lead.status}</td>
                      <td>{lead.buyerEmail}</td>
                      <td>{formatDateTime(lead.createdAt)}</td>
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
                              onUpdateLeadStatus(lead.id, nextStatus).catch(() => {});
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
                  ))}
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
            detail="Appointment operations translated into a desktop scheduling view."
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
            detail="Approval, inventory, and dealer account management."
          />
          <div className="table-card">
            <div className="table-header">
              <h4>Inventory CSV upload</h4>
            </div>
            <p className="muted-text">Bulk upload inventory rows using the backend CSV contract.</p>
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
                  onUploadDealerInventoryCsv().catch(() => {});
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
                  onSaveDealer().catch(() => {});
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
                <span>Image URLs (comma-separated)</span>
                <input
                  value={vehicleForm.imageUrls}
                  onChange={event => onVehicleFormChange('imageUrls', event.target.value)}
                  placeholder="https://img-1, https://img-2"
                />
              </label>
            </div>
            <div className="inline-actions">
              <button
                type="button"
                className="primary-button"
                disabled={pendingVehicleSave}
                onClick={() => {
                  onSaveVehicle().catch(() => {});
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
                          onToggleDealerApproval(dealer).catch(() => {});
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
                          onLoadDealerInventory(dealer).catch(() => {});
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
                  </tr>
                </thead>
                <tbody>
                  {dealerInventoryRows.map(vehicle => (
                    <tr key={vehicle.id}>
                      <td>{vehicle.vin}</td>
                      <td>
                        {vehicle.modelYear} {vehicle.make} {vehicle.model} {vehicle.trim}
                      </td>
                      <td>{vehicle.status}</td>
                      <td>{formatMileage(vehicle.mileage)}</td>
                      <td>{formatCurrency(vehicle.price)}</td>
                    </tr>
                  ))}
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
          <PanelHeader title="Reporting" detail="Current backend reporting is count-based, not revenue-based." />
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
                  <h4>Backend dashboard snapshot</h4>
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
                      onSaveSubscription().catch(() => {});
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
                                onUpdateBuyerTaskStatus(task.id, nextStatus).catch(() => {});
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
                                onUpdateBuyerTaskStatus(task.id, 'CANCELED').catch(() => {});
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
                              onMarkNotificationAsRead(item.id).catch(() => {});
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
    default:
      return null;
  }
}

function useRemoteResource<T>(loader: () => Promise<T>): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await loader();
      setData(result);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  return {data, loading, error, refresh};
}

function ResourceBlock<T>({
  state,
  children,
}: {
  state: AsyncState<T>;
  children: React.ReactNode;
}) {
  if (state.loading) {
    return <div className="empty-state">Loading backend data...</div>;
  }

  if (state.error) {
    return (
      <div className="stack">
        <div className="notice error">{state.error}</div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            state.refresh().catch(() => {});
          }}>
          Retry
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

function PanelHeader({title, detail}: {title: string; detail: string}) {
  return (
    <div className="panel-header">
      <h3 className="panel-title">{title}</h3>
      <p className="panel-detail">{detail}</p>
    </div>
  );
}

function VehicleSummaryCard({
  vehicle,
  large = false,
  activeImage,
  onSelectImage,
}: {
  vehicle: Vehicle;
  large?: boolean;
  activeImage?: string | null;
  onSelectImage?: (imageUrl: string) => void;
}) {
  const galleryImages = getVehicleGallery(vehicle);
  const resolvedActiveImage =
    activeImage && galleryImages.includes(activeImage) ? activeImage : galleryImages[0];

  return (
    <article className={large ? 'vehicle-summary large' : 'vehicle-summary'}>
      <div className="vehicle-image-wrap">
        <img
          className="vehicle-image"
          src={resolvedActiveImage}
          alt={`${vehicle.modelYear} ${vehicle.make} ${vehicle.model}`}
        />
      </div>
      {galleryImages.length > 1 ? (
        <div className="vehicle-gallery-row">
          {galleryImages.slice(0, 5).map((imageUrl, index) => (
            <button
              key={`${vehicle.id}-detail-${index}`}
              type="button"
              className={
                imageUrl === resolvedActiveImage
                  ? 'vehicle-gallery-thumb active'
                  : 'vehicle-gallery-thumb'
              }
              onClick={() => onSelectImage?.(imageUrl)}>
              <img
                className="vehicle-gallery-image"
                src={imageUrl}
                alt={`${vehicle.make} ${vehicle.model} detail ${index + 1}`}
              />
            </button>
          ))}
        </div>
      ) : null}
      <p className="card-kicker">{vehicle.dealerName}</p>
      <h4>
        {vehicle.modelYear} {vehicle.make} {vehicle.model}
      </h4>
      <p>{vehicle.trim}</p>
      <div className="summary-meta">
        <span>{vehicle.status}</span>
        <span>{formatMileage(vehicle.mileage)}</span>
      </div>
      <strong>{formatCurrency(vehicle.price)}</strong>
    </article>
  );
}

function SummaryBox({title, value}: {title: string; value: string}) {
  return (
    <article className="summary-box">
      <p>{title}</p>
      <strong>{value}</strong>
    </article>
  );
}

function DetailRow({label, value}: {label: string; value: string}) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return 'Unknown';
  }

  return value
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function EmptyState({message}: {message: string}) {
  return <div className="empty-state">{message}</div>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMileage(value: number) {
  return `${new Intl.NumberFormat('en-US').format(value)} mi`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error';
}

function getVehicleGallery(vehicle: Vehicle) {
  const seen = new Set<string>();
  const ordered = [vehicle.primaryImageUrl, ...(vehicle.imageUrls ?? [])].filter(imageUrl => {
    if (!imageUrl || seen.has(imageUrl)) {
      return false;
    }

    seen.add(imageUrl);
    return true;
  });

  return ordered;
}
