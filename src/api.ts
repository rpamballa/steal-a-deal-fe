export type Dealer = {
  id: number;
  name: string;
  licenseNumber: string;
  city: string;
  state: string;
  approved: boolean;
};

export type UserRole = 'ADMIN' | 'DEALER' | 'BUYER';

export type AuthResponse = {
  token: string;
  refreshToken: string;
  expiresAt: string;
  userId: number;
  displayName: string;
  email: string;
  role: UserRole;
  dealerId: number | null;
};

export type RefreshRequest = {refreshToken: string};

export type CurrentUser = {
  userId: number;
  displayName: string;
  email: string;
  role: UserRole;
  dealerId: number | null;
};

export type RegisterRequest = {
  displayName: string;
  email: string;
  password: string;
  role: UserRole;
  dealerId?: number;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type UpdateDealerApprovalRequest = {
  approved: boolean;
};

export type CreateDealerRequest = {
  name: string;
  licenseNumber: string;
  city: string;
  state: string;
};

export type UpdateDealerRequest = CreateDealerRequest;

export type VehicleStatus = 'DRAFT' | 'LIVE' | 'RESERVED' | 'SOLD';

export type Vehicle = {
  id: number;
  dealerId: number;
  dealerName: string;
  vin: string;
  modelYear: number;
  make: string;
  model: string;
  trim: string;
  primaryImageUrl: string;
  imageUrls: string[];
  mileage: number;
  price: number;
  status: VehicleStatus;
};

export type CreateVehicleRequest = {
  dealerId: number;
  vin: string;
  modelYear: number;
  make: string;
  model: string;
  trim: string;
  imageUrls: string[];
  mileage: number;
  price: number;
  status: VehicleStatus;
};

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CLOSED';

export type Lead = {
  id: number;
  vehicleId: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  message: string;
  status: LeadStatus;
  createdAt: string;
};

export type AppointmentType = 'TEST_DRIVE' | 'HOME_DELIVERY';
export type AppointmentStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELED';

export type Appointment = {
  id: number;
  vehicleId: number;
  buyerName: string;
  buyerEmail: string;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduledAt: string;
  createdAt: string;
};

export type Dashboard = {
  dealerCount: number;
  vehicleCount: number;
  liveVehicleCount: number;
  newLeadCount: number;
  requestedAppointmentCount: number;
};

export type FulfillmentType = 'PICKUP' | 'HOME_DELIVERY';
export type FulfillmentStatus =
  | 'UNSCHEDULED'
  | 'SCHEDULED'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELED';

export type DealStage =
  | 'INITIATED'
  | 'OFFER_SENT'
  | 'BUYER_CONFIRMED'
  | 'DEPOSIT_PAID'
  | 'DOCUMENTS_PENDING'
  | 'READY_FOR_HANDOFF'
  | 'COMPLETED'
  | 'CANCELED';

export type Deal = {
  id: number;
  vehicleId: number;
  vehicleTitle: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddressLine1: string;
  buyerAddressLine2?: string | null;
  buyerCity: string;
  buyerState: string;
  buyerPostalCode: string;
  fulfillmentType: FulfillmentType;
  fulfillmentStatus?: FulfillmentStatus;
  fulfillmentScheduledAt?: string | null;
  fulfillmentLocation?: string | null;
  fulfillmentNotes?: string | null;
  tradeIn: boolean;
  tradeInVin?: string | null;
  tradeInMileage?: number | null;
  tradeInOffer: number;
  vehiclePrice: number;
  taxAmount: number;
  registrationFee: number;
  documentationFee: number;
  deliveryFee: number;
  discountAmount: number;
  depositAmount: number;
  depositPaid: boolean;
  totalAmount: number;
  stage: DealStage;
  createdAt: string;
  updatedAt: string;
};

export type DocumentType =
  | 'BUYER_AGREEMENT'
  | 'DRIVER_LICENSE'
  | 'INSURANCE_PROOF'
  | 'TITLE_DISCLOSURE';

export type DocumentStatus = 'REQUESTED' | 'UPLOADED' | 'APPROVED' | 'REJECTED';

export type SigningStatus =
  | 'NOT_REQUIRED'
  | 'REQUESTED'
  | 'SENT'
  | 'SIGNED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELED';

export type DealDocument = {
  id: number;
  dealId: number;
  type: DocumentType;
  status: DocumentStatus;
  fileName: string;
  createdAt: string;
  updatedAt: string;
  // Additive fields shipped by the backend (tolerate nulls).
  contentType: string | null;
  sizeBytes: number | null;
  hasContent: boolean;
  signingEnvelopeId: string | null;
  signingStatus: SigningStatus | null;
};

export type DepositIntent = {
  intentId: string;
  clientSecret: string;
  status: string;
  amount: number;
};

export type RejectDealerRequest = {reason: string};

export type CreateLeadRequest = {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  message: string;
};

export type CreateAppointmentRequest = {
  buyerName: string;
  buyerEmail: string;
  type: AppointmentType;
  scheduledAt: string;
};

export type UpdateLeadStatusRequest = {
  status: LeadStatus;
};

export type UpdateAppointmentStatusRequest = {
  status: AppointmentStatus;
};

export type CreateDealRequest = {
  vehicleId: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddressLine1: string;
  buyerAddressLine2?: string | null;
  buyerCity: string;
  buyerState: string;
  buyerPostalCode: string;
  fulfillmentType: FulfillmentType;
  tradeIn: boolean;
  tradeInVin?: string | null;
  tradeInMileage?: number | null;
  tradeInOffer: number;
  deliveryFee: number;
  discountAmount: number;
};

export type PayDepositRequest = {
  amount: number;
};

export type CreateDealDocumentRequest = {
  type: DocumentType;
  fileName: string;
};

export type UpdateDealStageRequest = {
  stage: DealStage;
};

export type UpdateDealDocumentStatusRequest = {
  status: DocumentStatus;
};

export type UpdateFulfillmentRequest = {
  status: FulfillmentStatus;
  scheduledAt: string;
  location: string;
  notes?: string;
};

export type DealActivity = {
  id: number;
  dealId: number;
  eventType: string;
  message: string;
  createdAt: string;
};

export type DealReadiness = {
  dealId: number;
  readyForHandoff: boolean;
  readyForCompletion: boolean;
  completed: boolean;
  blockers: string[];
};

export type DealTaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
export type ParticipantType = 'BUYER' | 'DEALER' | 'ADMIN';

export type DealTask = {
  id: number;
  dealId: number;
  code: string;
  assigneeType: ParticipantType;
  assigneeReference: string;
  title: string;
  description: string;
  status: DealTaskStatus;
  dueAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: number;
  dealId?: number | null;
  recipientType: ParticipantType;
  recipientReference: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type InboxSummary = {
  totalDeals: number;
  activeDeals: number;
  completedDeals: number;
  openTaskCount: number;
  inProgressTaskCount: number;
  unreadNotificationCount: number;
  readyForHandoffCount: number;
};

export type InboxDeal = {
  dealId: number;
  vehicleId: number;
  dealerId: number;
  vehicleTitle: string;
  stage: DealStage;
  depositPaid: boolean;
  fulfillmentScheduledAt?: string | null;
  fulfillmentLocation?: string | null;
  readyForHandoff: boolean;
  readyForCompletion: boolean;
  blockers: string[];
  openTaskCount: number;
  unreadNotificationCount: number;
  nextAction: string;
  updatedAt: string;
};

export type ParticipantInbox = {
  participantType: ParticipantType;
  participantReference: string;
  summary: InboxSummary;
  deals: InboxDeal[];
  tasks: DealTask[];
  notifications: Notification[];
};

export type UpdateTaskStatusRequest = {
  status: DealTaskStatus;
};

export type MarkNotificationReadRequest = {
  read: boolean;
};

export type QueueSummary = {
  awaitingBuyerCount: number;
  needsDocumentReviewCount: number;
  readyForHandoffCount: number;
  stalledCount: number;
};

export type MetricCount = {
  code: string;
  count: number;
};

export type PortalOverview = {
  dealerId: number;
  dealerName: string;
  totalInventoryCount: number;
  liveInventoryCount: number;
  reservedInventoryCount: number;
  soldInventoryCount: number;
  totalInventoryValue: number;
  leadCount: number;
  newLeadCount: number;
  qualifiedLeadCount: number;
  appointmentCount: number;
  requestedAppointmentCount: number;
  activeDealCount: number;
  completedDealCount: number;
  readyForHandoffCount: number;
  openTaskCount: number;
  unreadNotificationCount: number;
  stalledDealCount: number;
};

export type PipelineSnapshot = {
  inventoryStatusCounts: MetricCount[];
  leadStatusCounts: MetricCount[];
  appointmentStatusCounts: MetricCount[];
  dealStageCounts: MetricCount[];
};

export type PortalDealItem = {
  dealId: number;
  vehicleId: number;
  vehicleTitle: string;
  buyerName: string;
  stage: DealStage;
  depositPaid: boolean;
  readyForHandoff: boolean;
  blockers: string[];
  nextAction: string;
  updatedAt: string;
};

export type PortalLeadItem = {
  id: number;
  vehicleId: number;
  vehicleTitle: string;
  buyerName: string;
  buyerEmail: string;
  status: LeadStatus;
  message: string;
  createdAt: string;
};

export type PortalAppointmentItem = {
  id: number;
  vehicleId: number;
  vehicleTitle: string;
  buyerName: string;
  buyerEmail: string;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduledAt: string;
  createdAt: string;
};

export type PortalDocumentItem = {
  id: number;
  dealId: number;
  vehicleTitle: string;
  buyerName: string;
  type: DocumentType;
  status: DocumentStatus;
  fileName: string;
  updatedAt: string;
};

export type PortalActivityItem = {
  dealId: number;
  vehicleTitle: string;
  eventType: string;
  message: string;
  createdAt: string;
};

export type DealerPortal = {
  overview: PortalOverview;
  pipeline: PipelineSnapshot;
  queueSummary: QueueSummary;
  recentDeals: PortalDealItem[];
  recentActivity: PortalActivityItem[];
};

export type DealerInbox = {
  inbox: ParticipantInbox;
  queueSummary: QueueSummary;
};

export type DealerQueue = {
  dealerId: number;
  summary: QueueSummary;
  awaitingBuyer: InboxDeal[];
  needsDocumentReview: InboxDeal[];
  readyForHandoff: InboxDeal[];
  stalled: InboxDeal[];
};

export type SubscriptionPlan = 'STARTER' | 'GROWTH' | 'PERFORMANCE';
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
export type InvoiceStatus = 'DRAFT' | 'OPEN' | 'PAID' | 'VOID';

export type PortalSubscription = {
  id: number;
  dealerId: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  monthlyPrice: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  updatedAt: string;
};

export type UpdateSubscriptionRequest = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  autoRenew: boolean;
};

export type InventoryUploadMode = 'CREATE_ONLY' | 'UPSERT';
export type InventoryUploadRowStatus = 'CREATED' | 'UPDATED' | 'REJECTED';

export type InventoryUploadVehicle = {
  vin: string;
  modelYear: number;
  make: string;
  model: string;
  trim: string;
  imageUrls: string[];
  mileage: number;
  price: number;
  status: VehicleStatus;
};

export type InventoryUploadRequest = {
  mode: InventoryUploadMode;
  vehicles: InventoryUploadVehicle[];
};

export type InventoryCsvUploadRequest = {
  mode: InventoryUploadMode;
  file: File;
};

export type InventoryUploadRow = {
  rowNumber: number;
  vin: string;
  status: InventoryUploadRowStatus;
  vehicleId: number | null;
  message: string;
};

export type InventoryUploadResponse = {
  dealerId: number;
  dealerName: string;
  mode: InventoryUploadMode;
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  rejectedCount: number;
  rows: InventoryUploadRow[];
};

export type PortalInvoice = {
  id: number;
  invoiceNumber: string;
  status: InvoiceStatus;
  amount: number;
  periodStart: string;
  periodEnd: string;
  dueAt: string;
  paidAt?: string | null;
  createdAt: string;
};

export type OnboardingStage =
  | 'REGISTERED'
  | 'APPROVED'
  | 'USER_CREATED'
  | 'SUBSCRIPTION_ACTIVE'
  | 'INVENTORY_LIVE'
  | 'FIRST_LEAD'
  | 'FIRST_DEAL'
  | 'ACTIVATED';

export type DealerOnboardingView = {
  dealerId: number;
  stage: OnboardingStage;
  percentComplete: number;
  complete: boolean;
  nextActionStage: OnboardingStage | null;
  nextAction: string;
  currentStageSince: string | null;
  nudgeCount: number;
  registeredAt: string | null;
  approvedAt: string | null;
  userCreatedAt: string | null;
  subscriptionActiveAt: string | null;
  inventoryLiveAt: string | null;
  firstLeadAt: string | null;
  firstDealAt: string | null;
  activatedAt: string | null;
};

export type ErrorResponse = {
  error: string;
  message: string;
  timestamp?: string;
};

/** Typed error thrown by the API layer for any non-2xx response. */
export class ApiError extends Error {
  readonly status: number;
  readonly error: string;
  readonly timestamp: string | null;
  constructor(
    status: number,
    error: string,
    message: string,
    timestamp: string | null,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.error = error;
    this.timestamp = timestamp;
  }
}

// Base URL comes from the build/runtime env (Dev-Instruction §9.2).
// Falls back to the local dev backend when unset.
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
    /\/+$/,
    '',
  ) || 'http://localhost:8282';
// SECURITY (spec §): tokens are held in MEMORY only — never localStorage
// (XSS). A 15-min access token lost on hard refresh is acceptable; the
// app bootstraps as a guest and the user re-authenticates.
// TODO(auth): spec prefers httpOnly cookies, but the backend currently
// returns tokens in the JSON body. In-memory + refresh-token rotation is
// the correct approach until a coordinated backend change emits
// Set-Cookie (httpOnly) on login/refresh with CSRF handling.
let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setAuthSession(
  session: {token: string; refreshToken: string} | null,
) {
  accessToken = session?.token ?? null;
  refreshToken = session?.refreshToken ?? null;
}

export function clearAuthSession() {
  accessToken = null;
  refreshToken = null;
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

function emitLogout() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('stealadeal:unauthorized'));
  }
}

// Credential endpoints must never trigger refresh-on-401 (avoids loops).
// NOTE: /api/auth/me is Bearer-protected and DOES participate in refresh.
function isAuthPath(path: string) {
  return (
    path === '/api/auth/login' ||
    path === '/api/auth/register' ||
    path === '/api/auth/refresh'
  );
}

async function parseError(
  response: Response,
): Promise<{error: string; message: string; timestamp: string | null}> {
  let error = `HTTP_${response.status}`;
  let message = `Request failed with status ${response.status}`;
  let timestamp: string | null = null;
  try {
    const body = (await response.json()) as Partial<ErrorResponse>;
    if (body.error) error = body.error;
    if (body.message) message = body.message;
    if (body.timestamp) timestamp = body.timestamp;
  } catch {
    // Non-JSON error body — keep defaults.
  }
  return {error, message, timestamp};
}

// Single-flight refresh: concurrent 401s share one refresh attempt.
let refreshInFlight: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const current = refreshToken;
  if (!current) {
    clearAuthSession();
    return false;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({refreshToken: current} satisfies RefreshRequest),
    });
    if (!response.ok) {
      clearAuthSession();
      return false;
    }
    const next = (await response.json()) as AuthResponse;
    setAuthSession({token: next.token, refreshToken: next.refreshToken});
    return true;
  } catch {
    clearAuthSession();
    return false;
  }
}

function ensureRefreshed(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

type QueryValue = string | number | boolean | undefined | null;

function toQueryString(query?: Record<string, QueryValue>) {
  if (!query) {
    return '';
  }

  const parts = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    );

  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

async function rawFetch(path: string, init?: RequestInit): Promise<Response> {
  const isFormDataBody =
    typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  if (!isFormDataBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return fetch(`${API_BASE_URL}${path}`, {headers, ...init});
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }
  const {error, message, timestamp} = await parseError(response);
  throw new ApiError(response.status, error, message, timestamp);
}

/**
 * Single centralized API entrypoint. Attaches the in-memory bearer
 * token, parses the standard error body, and on a 401 from a PROTECTED
 * call performs exactly one shared refresh-and-retry. 403 (authorized
 * failure) and /api/auth/* never trigger refresh.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response = await rawFetch(path, init);

  if (
    response.status === 401 &&
    !isAuthPath(path) &&
    getRefreshToken() !== null
  ) {
    const refreshed = await ensureRefreshed();
    if (refreshed) {
      response = await rawFetch(path, init); // retry once with new token
    } else {
      emitLogout();
      const {error, message, timestamp} = await parseError(response);
      throw new ApiError(401, error, message, timestamp);
    }
  } else if (response.status === 401 && !isAuthPath(path)) {
    // No refresh token available (e.g. backend without rotation yet).
    clearAuthSession();
    emitLogout();
  }
  // 403 = authenticated but not authorized: do NOT refresh or clear.

  return handleResponse<T>(response);
}

export const api = {
  registerAccount: (payload: RegisterRequest) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: LoginRequest) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCurrentUser: () => request<CurrentUser>('/api/auth/me'),
  listDealers: () => request<Dealer[]>('/api/dealers'),
  createDealer: (payload: CreateDealerRequest) =>
    request<Dealer>('/api/dealers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getDealer: (dealerId: number) => request<Dealer>(`/api/dealers/${dealerId}`),
  updateDealer: (dealerId: number, payload: UpdateDealerRequest) =>
    request<Dealer>(`/api/dealers/${dealerId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  updateDealerApproval: (dealerId: number, payload: UpdateDealerApprovalRequest) =>
    request<Dealer>(`/api/dealers/${dealerId}/approval`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  listDealerInventory: (dealerId: number) =>
    request<Vehicle[]>(`/api/dealers/${dealerId}/inventory`),
  uploadDealerInventory: (dealerId: number, payload: InventoryUploadRequest) =>
    request<InventoryUploadResponse>(`/api/dealers/${dealerId}/inventory-upload`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  uploadDealerInventoryCsv: (
    dealerId: number,
    payload: InventoryCsvUploadRequest,
  ) => {
    const formData = new FormData();
    formData.append('mode', payload.mode);
    formData.append('file', payload.file);

    return request<InventoryUploadResponse>(`/api/dealers/${dealerId}/inventory-upload`, {
      method: 'POST',
      body: formData,
    });
  },
  listVehicles: (query?: {
    dealerId?: number;
    make?: string;
    model?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: VehicleStatus;
  }) => request<Vehicle[]>(`/api/vehicles${toQueryString(query)}`),
  createVehicle: (payload: CreateVehicleRequest) =>
    request<Vehicle>('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getVehicle: (vehicleId: number) => request<Vehicle>(`/api/vehicles/${vehicleId}`),
  updateVehicle: (vehicleId: number, payload: CreateVehicleRequest) =>
    request<Vehicle>(`/api/vehicles/${vehicleId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  createLead: (vehicleId: number, payload: CreateLeadRequest) =>
    request<Lead>(`/api/vehicles/${vehicleId}/leads`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listLeads: (query?: {vehicleId?: number; status?: LeadStatus}) =>
    request<Lead[]>(`/api/leads${toQueryString(query)}`),
  updateLeadStatus: (leadId: number, payload: UpdateLeadStatusRequest) =>
    request<Lead>(`/api/leads/${leadId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  createAppointment: (vehicleId: number, payload: CreateAppointmentRequest) =>
    request<Appointment>(`/api/vehicles/${vehicleId}/appointments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listAppointments: (query?: {
    vehicleId?: number;
    status?: AppointmentStatus;
  }) => request<Appointment[]>(`/api/appointments${toQueryString(query)}`),
  updateAppointmentStatus: (
    appointmentId: number,
    payload: UpdateAppointmentStatusRequest,
  ) =>
    request<Appointment>(`/api/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  listDeals: (query?: {vehicleId?: number; stage?: DealStage}) =>
    request<Deal[]>(`/api/deals${toQueryString(query)}`),
  createDeal: (payload: CreateDealRequest) =>
    request<Deal>('/api/deals', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getDeal: (dealId: number) => request<Deal>(`/api/deals/${dealId}`),
  updateDealStage: (dealId: number, payload: UpdateDealStageRequest) =>
    request<Deal>(`/api/deals/${dealId}/stage`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  payDealDeposit: (dealId: number, payload: PayDepositRequest) =>
    request<Deal>(`/api/deals/${dealId}/deposit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listDealDocuments: (dealId: number, query?: {status?: DocumentStatus}) =>
    request<DealDocument[]>(
      `/api/deals/${dealId}/documents${toQueryString(query)}`,
    ),
  createDealDocument: (dealId: number, payload: CreateDealDocumentRequest) =>
    request<DealDocument>(`/api/deals/${dealId}/documents`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateDealDocumentStatus: (
    dealId: number,
    documentId: number,
    payload: UpdateDealDocumentStatusRequest,
  ) =>
    request<DealDocument>(`/api/deals/${dealId}/documents/${documentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  updateDealFulfillment: (dealId: number, payload: UpdateFulfillmentRequest) =>
    request<Deal>(`/api/deals/${dealId}/fulfillment`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  listDealActivity: (dealId: number) =>
    request<DealActivity[]>(`/api/deals/${dealId}/activity`),
  getDealReadiness: (dealId: number) =>
    request<DealReadiness>(`/api/deals/${dealId}/readiness`),
  listDealTasks: (dealId: number) => request<DealTask[]>(`/api/deals/${dealId}/tasks`),
  getBuyerInbox: (buyerEmail: string) =>
    request<ParticipantInbox>(`/api/inbox/buyers/${encodeURIComponent(buyerEmail)}`),
  getDealerInbox: (dealerId: number) =>
    request<DealerInbox>(`/api/inbox/dealers/${dealerId}`),
  getDealerDealQueue: (dealerId: number) =>
    request<DealerQueue>(`/api/dealers/${dealerId}/deal-queue`),
  getDealerPortal: (dealerId: number) =>
    request<DealerPortal>(`/api/dealers/${dealerId}/portal`),
  listDealerPortalDeals: (dealerId: number, query?: {stage?: DealStage}) =>
    request<PortalDealItem[]>(
      `/api/dealers/${dealerId}/portal/deals${toQueryString(query)}`,
    ),
  listDealerPortalLeads: (dealerId: number, query?: {status?: LeadStatus}) =>
    request<PortalLeadItem[]>(
      `/api/dealers/${dealerId}/portal/leads${toQueryString(query)}`,
    ),
  listDealerPortalAppointments: (
    dealerId: number,
    query?: {status?: AppointmentStatus},
  ) =>
    request<PortalAppointmentItem[]>(
      `/api/dealers/${dealerId}/portal/appointments${toQueryString(query)}`,
    ),
  listDealerPortalDocuments: (
    dealerId: number,
    query?: {status?: DocumentStatus},
  ) =>
    request<PortalDocumentItem[]>(
      `/api/dealers/${dealerId}/portal/documents${toQueryString(query)}`,
    ),
  getDealerPortalSubscription: (dealerId: number) =>
    request<PortalSubscription>(`/api/dealers/${dealerId}/portal/subscription`),
  updateDealerPortalSubscription: (
    dealerId: number,
    payload: UpdateSubscriptionRequest,
  ) =>
    request<PortalSubscription>(`/api/dealers/${dealerId}/portal/subscription`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  listDealerPortalInvoices: (dealerId: number) =>
    request<PortalInvoice[]>(`/api/dealers/${dealerId}/portal/invoices`),
  listTasksForAssignee: (query: {
    assigneeType: ParticipantType;
    assigneeReference: string;
    status?: DealTaskStatus;
  }) => request<DealTask[]>(`/api/tasks${toQueryString(query)}`),
  updateTaskStatus: (taskId: number, payload: UpdateTaskStatusRequest) =>
    request<DealTask>(`/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  listNotifications: (query: {
    recipientType: ParticipantType;
    recipientReference: string;
    unreadOnly?: boolean;
  }) => request<Notification[]>(`/api/notifications${toQueryString(query)}`),
  markNotificationRead: (notificationId: number, read: boolean) =>
    request<Notification>(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
      body: JSON.stringify({read} satisfies MarkNotificationReadRequest),
    }),
  getDashboard: () => request<Dashboard>('/api/dashboard'),
  getDealerOnboarding: (dealerId: number) =>
    request<DealerOnboardingView>(`/api/dealers/${dealerId}/onboarding`),

  // ── Auth ────────────────────────────────────────────────────
  refreshSession: (refreshTokenValue: string) =>
    request<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({
        refreshToken: refreshTokenValue,
      } satisfies RefreshRequest),
    }),

  // ── Admin: dealer approval ──────────────────────────────────
  adminApproveDealer: (dealerId: number) =>
    request<Dealer>(`/api/admin/dealers/${dealerId}/approve`, {
      method: 'POST',
    }),
  adminRejectDealer: (dealerId: number, reason: string) =>
    request<Dealer>(`/api/admin/dealers/${dealerId}/reject`, {
      method: 'POST',
      body: JSON.stringify({reason} satisfies RejectDealerRequest),
    }),

  // ── Deal documents (generate / upload / download / sign) ────
  generateBuyerAgreement: (dealId: number) =>
    request<DealDocument>(
      `/api/deals/${dealId}/documents/buyer-agreement/generate`,
      {method: 'POST'},
    ),
  uploadDealDocument: (dealId: number, documentId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<DealDocument>(
      `/api/deals/${dealId}/documents/${documentId}/upload`,
      {method: 'POST', body: form},
    );
  },
  downloadDealDocument: async (
    dealId: number,
    documentId: number,
  ): Promise<Blob> => {
    let response = await rawFetch(
      `/api/deals/${dealId}/documents/${documentId}/download`,
    );
    if (response.status === 401 && getRefreshToken() !== null) {
      const refreshed = await ensureRefreshed();
      if (refreshed) {
        response = await rawFetch(
          `/api/deals/${dealId}/documents/${documentId}/download`,
        );
      } else {
        emitLogout();
      }
    }
    if (!response.ok) {
      const {error, message, timestamp} = await parseError(response);
      throw new ApiError(response.status, error, message, timestamp);
    }
    return response.blob();
  },
  signDealDocument: (dealId: number, documentId: number) =>
    request<DealDocument>(
      `/api/deals/${dealId}/documents/${documentId}/sign`,
      {method: 'POST'},
    ),

  // ── Stripe deposit intent (returns PaymentIntent client secret) ─
  createDepositIntent: (dealId: number) =>
    request<DepositIntent>(`/api/deals/${dealId}/deposit/intent`, {
      method: 'POST',
    }),

  // ── Inventory photos (multipart, repeatable "files", max 10) ──
  uploadInventoryPhotos: (
    dealerId: number,
    vehicleId: number,
    files: File[],
  ) => {
    const form = new FormData();
    for (const file of files) {
      form.append('files', file);
    }
    return request<Vehicle>(
      `/api/dealers/${dealerId}/inventory/${vehicleId}/photos`,
      {method: 'POST', body: form},
    );
  },
};

/** Public photo URL for a stored vehicle photo key. */
export function vehiclePhotoUrl(vehicleId: number, key: string): string {
  return `${API_BASE_URL}/api/vehicles/${vehicleId}/photos/${encodeURIComponent(
    key,
  )}`;
}

/** Max photos allowed per listing (backend rejects >10 with HTTP 400). */
export const MAX_VEHICLE_PHOTOS = 10;
