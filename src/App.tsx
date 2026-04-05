import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {
  api,
  type Appointment,
  type Dealer,
  type Deal,
  type DealDocument,
  type DealStage,
  type DocumentStatus,
  type Lead,
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

const navItems: Array<{id: NavView; label: string}> = [
  {id: 'overview', label: 'Overview'},
  {id: 'inventory', label: 'Inventory'},
  {id: 'vehicle', label: 'Vehicle Detail'},
  {id: 'deal-room', label: 'Deal Room'},
  {id: 'leads', label: 'Leads'},
  {id: 'appointments', label: 'Appointments'},
  {id: 'dealers', label: 'Dealers'},
  {id: 'reporting', label: 'Reporting'},
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

export default function App() {
  const [activeView, setActiveView] = useState<NavView>('overview');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [listingQuery, setListingQuery] = useState('');
  const [listingStatus, setListingStatus] = useState<'ALL' | Vehicle['status']>('LIVE');
  const [maxListingPrice, setMaxListingPrice] = useState(45000);
  const [listingActiveImages, setListingActiveImages] = useState<Record<number, string>>({});
  const [detailActiveImage, setDetailActiveImage] = useState<string | null>(null);

  const loadVehicles = useCallback(() => api.listVehicles(), []);
  const loadLiveVehicles = useCallback(() => api.listVehicles({status: 'LIVE'}), []);
  const loadDealers = useCallback(() => api.listDealers(), []);
  const loadLeads = useCallback(() => api.listLeads(), []);
  const loadAppointments = useCallback(() => api.listAppointments(), []);
  const loadDeals = useCallback(() => api.listDeals(), []);

  const vehicles = useRemoteResource(loadVehicles);
  const liveVehicles = useRemoteResource(loadLiveVehicles);
  const dealers = useRemoteResource(loadDealers);
  const leads = useRemoteResource(loadLeads);
  const appointments = useRemoteResource(loadAppointments);
  const deals = useRemoteResource(loadDeals);

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
  const dealDocuments = useRemoteResource(loadSelectedDealDocuments);

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
  const [pendingDocumentStatuses, setPendingDocumentStatuses] = useState<
    Record<number, boolean>
  >({});

  const createLead = useCallback(async () => {
    if (!selectedVehicleId) {
      return;
    }

    setPendingLead(true);
    setLeadMessage(null);

    try {
      const lead = await api.createLead(selectedVehicleId, {
        buyerName: 'Desktop Demo Buyer',
        buyerEmail: 'buyer@example.com',
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
  }, [leads, selectedVehicleId]);

  const createAppointment = useCallback(async () => {
    if (!selectedVehicleId) {
      return;
    }

    setPendingAppointment(true);
    setAppointmentMessage(null);

    try {
      const appointment = await api.createAppointment(selectedVehicleId, {
        buyerName: 'Desktop Demo Buyer',
        buyerEmail: 'buyer@example.com',
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
  }, [appointments, selectedVehicleId]);

  const createDeal = useCallback(async () => {
    if (!selectedVehicleId) {
      return;
    }

    setPendingDeal(true);
    setDealMessage(null);

    try {
      const deal = await api.createDeal({
        vehicleId: selectedVehicleId,
        buyerName: 'Desktop Demo Buyer',
        buyerEmail: 'buyer@example.com',
        buyerPhone: '555-0100',
        fulfillmentType: 'PICKUP',
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
  }, [deals, selectedVehicleId]);

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
          {navItems.map(item => (
            <button
              key={item.id}
              className={item.id === activeView ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveView(item.id)}
              type="button">
              {item.label}
            </button>
          ))}
        </nav>

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
              dealDocuments,
              dealers,
              filteredAppointments,
              onSelectVehicle: setSelectedVehicleId,
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
              onUpdateDocumentStatus: updateDocumentStatus,
              pendingDeal,
              pendingDeposit,
              pendingDocument,
              pendingStageUpdate,
              pendingDocumentStatuses,
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
  dealDocuments: AsyncState<DealDocument[]>;
  dealers: AsyncState<Dealer[]>;
  filteredAppointments: Appointment[];
  onSelectVehicle: (vehicleId: number) => void;
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
  onUpdateDocumentStatus: (documentId: number, status: DocumentStatus) => Promise<void>;
  pendingDeal: boolean;
  pendingDeposit: boolean;
  pendingDocument: boolean;
  pendingStageUpdate: boolean;
  pendingDocumentStatuses: Record<number, boolean>;
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
    dealDocuments,
    dealers,
    filteredAppointments,
    onSelectVehicle,
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
    onUpdateDocumentStatus,
    pendingDeal,
    pendingDeposit,
    pendingDocument,
    pendingStageUpdate,
    pendingDocumentStatuses,
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
                      Stage: {formatLabel(selectedDeal.stage)}. Fulfillment: {formatLabel(selectedDeal.fulfillmentType)}.
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
          <PanelHeader title="Dealers" detail="Approval and location view for current dealer accounts." />
          <ResourceBlock state={dealers}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>License</th>
                  <th>Location</th>
                  <th>Approval</th>
                </tr>
              </thead>
              <tbody>
                {(dealers.data ?? []).map(dealer => (
                  <tr key={dealer.id}>
                    <td>{dealer.name}</td>
                    <td>{dealer.licenseNumber}</td>
                    <td>{dealer.city}, {dealer.state}</td>
                    <td>{dealer.approved ? 'APPROVED' : 'PENDING'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResourceBlock>
        </>
      );
    case 'reporting':
      return (
        <>
          <PanelHeader title="Reporting" detail="Current backend reporting is count-based, not revenue-based." />
          <div className="report-grid">
            <SummaryBox title="Selected vehicle" value={selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : 'None'} />
            <SummaryBox title="Lead count" value={String(leads.data?.length ?? 0)} />
            <SummaryBox title="Appointment count" value={String(appointments.data?.length ?? 0)} />
            <SummaryBox title="Approved dealers" value={String(dealers.data?.filter(item => item.approved).length ?? 0)} />
          </div>
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

function formatLabel(value: string) {
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
