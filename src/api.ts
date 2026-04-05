export type Dealer = {
  id: number;
  name: string;
  licenseNumber: string;
  city: string;
  state: string;
  approved: boolean;
};

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
  fulfillmentType: FulfillmentType;
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

export type DealDocument = {
  id: number;
  dealId: number;
  type: DocumentType;
  status: DocumentStatus;
  fileName: string;
  createdAt: string;
  updatedAt: string;
};

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

export type CreateDealRequest = {
  vehicleId: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  fulfillmentType: FulfillmentType;
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

export const API_BASE_URL = 'http://localhost:8282';

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const error = (await response.json()) as {message?: string};
      if (error.message) {
        message = error.message;
      }
    } catch {
      // Keep the default message when the server does not return JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  listDealers: () => request<Dealer[]>('/api/dealers'),
  listVehicles: (query?: {
    dealerId?: number;
    make?: string;
    model?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: VehicleStatus;
  }) => request<Vehicle[]>(`/api/vehicles${toQueryString(query)}`),
  getVehicle: (vehicleId: number) => request<Vehicle>(`/api/vehicles/${vehicleId}`),
  createLead: (vehicleId: number, payload: CreateLeadRequest) =>
    request<Lead>(`/api/vehicles/${vehicleId}/leads`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listLeads: (query?: {vehicleId?: number; status?: LeadStatus}) =>
    request<Lead[]>(`/api/leads${toQueryString(query)}`),
  createAppointment: (vehicleId: number, payload: CreateAppointmentRequest) =>
    request<Appointment>(`/api/vehicles/${vehicleId}/appointments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listAppointments: (query?: {
    vehicleId?: number;
    status?: AppointmentStatus;
  }) => request<Appointment[]>(`/api/appointments${toQueryString(query)}`),
  listDeals: (query?: {vehicleId?: number; stage?: DealStage}) =>
    request<Deal[]>(`/api/deals${toQueryString(query)}`),
  createDeal: (payload: CreateDealRequest) =>
    request<Deal>('/api/deals', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
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
  getDashboard: () => request<Dashboard>('/api/dashboard'),
};
