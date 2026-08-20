# Last-Mile Delivery Tracker: System Design & Architectural Specification

## 1. Architectural Overview & System Decomposition
The platform is designed around a modular event-driven micro-service architecture separating client portals (Customer, Delivery Partner, Dispatch Administrator) from the core backend logistics engine:
- **Rate Calculation Engine**: Pure functional evaluation pipeline utilizing database-driven tariff cards.
- **Spatial Zone Detection Engine**: Multi-tiered geographic routing service translating addresses to zone clusters.
- **Intelligent Dispatch & Auto-Assignment Engine**: Heuristic multi-factor scoring mechanism over candidate fleet telemetry.
- **Lifecycle & Immutable Audit Service**: Append-only event store guaranteeing complete tamper-proof tracking histories.
- **Resilient Reschedule & Multi-Channel Notification Service**: Webhook-driven notification subsystem with automated queue rebalancing.

---

## 2. Dynamic Rate Calculation Engine
Logistics pricing depends on physical package density, operational zones, order classifications (B2B/B2C), and payment modalities.

```
Package Dimensions (L, W, H) ──> Volumetric Divisor (5000) ──> Volumetric Weight (kg)
                                                                       │
Actual Physical Weight (kg) ───────────────────────────────────────────┴──> Chargeable Weight = max(Actual, Volumetric)
                                                                                        │
Pickup / Drop Zones (Intra vs Inter) + Order Type (B2B / B2C) ─────────> Rate Card Lookup (Base + Incremental Slabs)
                                                                                        │
Payment Type (COD vs Prepaid) ─────────────────────────────────────────> COD Surcharge = max(MinFee, Flat + % Subtotal)
                                                                                        │
                                                                           Total Delivery Tariff
```

### Mathematical Formulation
1. **Volumetric Weight**:
   $$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Width (cm)} \times \text{Height (cm)}}{\text{Volumetric Divisor (e.g. 5000)}}$$
2. **Chargeable Weight**:
   $$\text{Chargeable Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$
3. **Weight Slabs & Fare**:
   $$\text{Excess Weight} = \max(0, \text{Chargeable Weight} - \text{Base Weight})$$
   $$\text{Incremental Slabs} = \lceil \text{Excess Weight} / \text{Incremental Weight Slab} \rceil$$
   $$\text{Subtotal} = \text{Base Rate} + (\text{Incremental Slabs} \times \text{Incremental Rate})$$
4. **COD Surcharge**:
   $$\text{COD Surcharge} = \begin{cases} 0 & \text{if Payment is Prepaid} \\ \max\left(\text{MinFee}, \text{FlatFee} + \frac{\text{Subtotal} \times \text{Percentage}}{100}\right) & \text{if Payment is COD} \end{cases}$$
5. **Total Payable**: $\text{Total Amount} = \text{Subtotal} + \text{COD Surcharge}$.

All tariff parameters (divisors, slabs, rates, and surcharges) reside in database tables (`RateCard`), enabling live changes without code redeployment.

---

## 3. Zone Detection & Geographic Resolution
To avoid expensive polygon ray-casting in high-throughput dispatch loops, zone resolution uses a 4-tier hierarchical resolution strategy:
1. **Exact Postal Code Mapping**: Fast $O(1)$ index lookup matching pickup/drop pincodes against `ZoneArea` records.
2. **Area & Landmark Substring Match**: Normalized token search on area/locality strings.
3. **Radial Coordinate Geofencing**: Proximity checking against zone centroid coordinates $(lat_z, lng_z)$ within designated radius $R_z$.
4. **Postal Circle Prefix Routing**: Fallback matching on first 3 digits of regional postal clusters.

If $\text{PickupZone.id} == \text{DropZone.id}$, the shipment is classified as `INTRA_ZONE`; otherwise it resolves to `INTER_ZONE`.

---

## 4. Intelligent Agent Auto-Assignment Heuristic
When an order is created or rescheduled, the auto-assignment engine identifies active delivery agents (`status == 'AVAILABLE'` and $\text{activeOrderCount} < \text{maxCapacity}$).

### Spatial Distance
Geographic distance $d$ between agent coordinates $(\phi_1, \lambda_1)$ and pickup location $(\phi_2, \lambda_2)$ is computed using the Great-Circle Haversine formula:
$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
$$d = 2 R \cdot \arcsin(\sqrt{a}) \quad (R = 6371\text{ km})$$

### Composite Penalty Score
Candidate agents are evaluated using a multi-factor objective function:
$$\text{Penalty Score} = w_1 \cdot d + w_2 \cdot \text{ActiveLoad} + w_3 \cdot \text{BusyPenalty} - w_4 \cdot \text{HomeZoneAffinity} - w_5 \cdot (\text{Rating} - 3.0)$$
*(Weights: $w_1 = 1.2, w_2 = 3.5, w_3 = 5.0, w_4 = 8.0, w_5 = 2.0$)*

The candidate with the lowest penalty score is atomically assigned inside an isolated database transaction, updating agent load and dispatching alerts.

---

## 5. Order Lifecycle, Rescheduling & Immutable Audit Trail
Orders follow a strict deterministic finite state machine (FSM):
$$\text{CONFIRMED} \longrightarrow \text{ASSIGNED} \longrightarrow \text{PICKED\_UP} \longrightarrow \text{IN\_TRANSIT} \longrightarrow \text{OUT\_FOR\_DELIVERY} \longrightarrow \begin{cases} \text{DELIVERED} \\ \text{FAILED} \longrightarrow \text{RESCHEDULED} \longrightarrow \text{ASSIGNED} \end{cases}$$

### Failed Delivery & Reschedule Flow
1. **Failure Capture**: When delivery cannot be completed, the partner flags the order as `FAILED` with categorized reasons (*Customer Unavailable*, *Incorrect Address*, *Customer Refused*, *Payment Issue*).
2. **Resource De-allocation**: Active agent queue load is decremented immediately.
3. **Proactive Customer Notification**: Multi-channel alerts (Email/SMS) are triggered with a secure one-click reschedule link.
4. **Customer Reschedule**: Customer selects their preferred date and time slot (Morning/Afternoon/Evening).
5. **Auto-Reassignment**: System transitions status to `RESCHEDULED` and immediately triggers the assignment engine to allocate the best available agent for that slot.

### Immutable Tracking History
Every state transition creates an append-only `TrackingHistory` record storing `orderId`, `status`, `actorId`, `actorRole` (`CUSTOMER`/`AGENT`/`ADMIN`/`SYSTEM`), timestamp, geolocation, remarks, and digital proof (signature/OTP), ensuring zero record tampering and total visibility.
