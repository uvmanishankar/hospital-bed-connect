// Mock data used as fallback when ServiceNow is not configured.
export const mockDashboard = {
  totals: {
    totalBeds: 256,
    availableBeds: 98,
    occupiedBeds: 126,
    maintenance: 24,
    outOfService: 8,
    totalEquipment: 320,
    activeStaff: 128,
    icuAvailable: 32,
    icuTotal: 50,
    equipmentOnline: 256,
    equipmentTotal: 320,
  },
  occupancyTrend: [
    { day: "Mon", occupancy: 62 },
    { day: "Tue", occupancy: 68 },
    { day: "Wed", occupancy: 71 },
    { day: "Thu", occupancy: 65 },
    { day: "Fri", occupancy: 74 },
    { day: "Sat", occupancy: 78 },
    { day: "Sun", occupancy: 70 },
  ],
  bedsByDepartment: [
    { name: "ICU", value: 50, color: "#3b82f6" },
    { name: "General Ward", value: 90, color: "#14b8a6" },
    { name: "Private", value: 60, color: "#f59e0b" },
    { name: "Pediatrics", value: 40, color: "#8b5cf6" },
    { name: "Others", value: 26, color: "#ef4444" },
  ],
  recentRequests: [
    { id: "REQ-BED-1021", ward: "ICU - 2", time: "10 min ago", status: "Pending" },
    { id: "REQ-BED-1030", ward: "General Ward", time: "20 min ago", status: "Approved" },
    { id: "REQ-BED-1008", ward: "Pediatrics", time: "1 hr ago", status: "Pending" },
    { id: "REQ-BED-1007", ward: "Infusion Pump", time: "2 hr ago", status: "In Progress" },
  ],
  admissionTrend: [
    { month: "Jan", admissions: 120, discharges: 110 },
    { month: "Feb", admissions: 145, discharges: 130 },
    { month: "Mar", admissions: 160, discharges: 150 },
    { month: "Apr", admissions: 138, discharges: 142 },
    { month: "May", admissions: 175, discharges: 160 },
    { month: "Jun", admissions: 190, discharges: 178 },
  ],
};

export type BedStatus = "available" | "occupied" | "maintenance" | "blocked";
export interface Bed {
  id: string;
  ward: string;
  number: string;
  status: BedStatus;
  patient?: string;
  patientId?: string;
  age?: number;
  gender?: "M" | "F";
  admittedOn?: string;
  diagnosis?: string;
  doctor?: string;
  expectedDischarge?: string;
  bedType?: string;
  ratePerDay?: number;
}

function makeWard(
  prefix: string,
  count: number,
  occupied: Record<number, { name: string; id: string; diag: string }>,
  maint: number[] = [],
  blocked: number[] = [],
  bedType = "General",
  ratePerDay = 3500,
): Bed[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const num = String(n).padStart(2, "0");
    const id = `${prefix}-${num}`;
    let status: BedStatus = "available";
    if (occupied[n]) status = "occupied";
    else if (maint.includes(n)) status = "maintenance";
    else if (blocked.includes(n)) status = "blocked";
    const o = occupied[n];
    return {
      id,
      ward: prefix,
      number: num,
      status,
      patient: o?.name,
      patientId: o?.id,
      age: o ? 40 + (n % 30) : undefined,
      gender: o ? (n % 2 === 0 ? "M" : "F") : undefined,
      admittedOn: o ? "21 May 2025, 10:30 AM" : undefined,
      diagnosis: o?.diag,
      doctor: o ? "Dr. Amit Verma" : undefined,
      expectedDischarge: o ? "28 May 2025" : undefined,
      bedType,
      ratePerDay,
    };
  });
}

export const mockBeds: Bed[] = [
  ...makeWard(
    "ICU-1",
    10,
    {
      2: { name: "Ravi Kumar", id: "PT-000245", diag: "Severe Pneumonia" },
      6: { name: "Anjali Verma", id: "PT-000246", diag: "Post-op recovery" },
    },
    [5],
    [10],
    "ICU",
    8000,
  ),
  ...makeWard(
    "ICU-2",
    10,
    {
      2: { name: "Suresh Babu", id: "PT-000247", diag: "Cardiac arrest" },
      8: { name: "Meera Reddy", id: "PT-000248", diag: "Sepsis" },
    },
    [5],
    [],
    "ICU",
    8000,
  ),
  ...makeWard(
    "GW-A",
    12,
    {
      3: { name: "Kiran Rao", id: "PT-000301", diag: "Diabetes mgmt" },
      7: { name: "Vikram Shah", id: "PT-000302", diag: "Fracture" },
    },
    [11],
    [],
    "General",
    3500,
  ),
  ...makeWard(
    "PED-1",
    8,
    {
      2: { name: "Aarav Mehta", id: "PT-000401", diag: "Asthma" },
    },
    [],
    [],
    "Pediatric",
    4500,
  ),
  ...makeWard(
    "MAT-1",
    8,
    {
      4: { name: "Sneha Joshi", id: "PT-000501", diag: "Labour" },
    },
    [],
    [8],
    "Maternity",
    5500,
  ),
  ...makeWard(
    "ISO-1",
    6,
    {
      1: { name: "Rahul Nair", id: "PT-000601", diag: "Tuberculosis" },
    },
    [],
    [],
    "Isolation",
    6000,
  ),
];

export type AssetStatus = "available" | "in_use" | "maintenance" | "out_of_service";
export interface Asset {
  id: string;
  tag: string;
  name: string;
  model: string;
  type: string;
  location: string;
  room: string;
  status: AssetStatus;
  assignedTo?: string;
  bed?: string;
  lastUpdated: string;
}

export const mockAssets: Asset[] = [
  {
    id: "1",
    tag: "AST-VENT-001",
    name: "Ventilator - Philips",
    model: "V60",
    type: "Ventilator",
    location: "ICU - 1",
    room: "Room 101",
    status: "in_use",
    assignedTo: "Ravi Kumar",
    bed: "ICU-1-02",
    lastUpdated: "21 May 2025 10:30 AM",
  },
  {
    id: "2",
    tag: "AST-MON-023",
    name: "Patient Monitor",
    model: "Mindray iMEC12",
    type: "Monitor",
    location: "ICU - 1",
    room: "Room 102",
    status: "available",
    lastUpdated: "21 May 2025 09:45 AM",
  },
  {
    id: "3",
    tag: "AST-WCH-015",
    name: "Wheelchair",
    model: "Karma Ergo",
    type: "Wheelchair",
    location: "General Ward",
    room: "Ward A",
    status: "in_use",
    assignedTo: "Meera Reddy",
    bed: "GW-A-05",
    lastUpdated: "21 May 2025 09:10 AM",
  },
  {
    id: "4",
    tag: "AST-INF-007",
    name: "Infusion Pump",
    model: "B. Braun",
    type: "Infusion Pump",
    location: "ICU - 2",
    room: "Room 201",
    status: "maintenance",
    lastUpdated: "21 May 2025 08:50 AM",
  },
  {
    id: "5",
    tag: "AST-OXY-004",
    name: "Oxygen Concentrator",
    model: "Philips EverFlo",
    type: "Oxygen Concentrator",
    location: "Emergency",
    room: "ER-1",
    status: "available",
    lastUpdated: "21 May 2025 08:20 AM",
  },
  {
    id: "6",
    tag: "AST-MON-030",
    name: "Patient Monitor",
    model: "Mindray iMEC12",
    type: "Monitor",
    location: "Pediatrics",
    room: "Room 301",
    status: "out_of_service",
    lastUpdated: "20 May 2025 05:30 PM",
  },
  {
    id: "7",
    tag: "AST-VENT-002",
    name: "Ventilator - Drager",
    model: "Evita V500",
    type: "Ventilator",
    location: "ICU - 3",
    room: "Room 301",
    status: "in_use",
    assignedTo: "Suresh Babu",
    bed: "ICU-3-03",
    lastUpdated: "20 May 2025 04:15 PM",
  },
];

export const mockAssetCategories = [
  { name: "Ventilators", value: 24, color: "#3b82f6" },
  { name: "Monitors", value: 60, color: "#14b8a6" },
  { name: "Infusion Pumps", value: 40, color: "#f59e0b" },
  { name: "Wheelchairs", value: 50, color: "#8b5cf6" },
  { name: "Others", value: 82, color: "#ef4444" },
];

export const mockAssetRequests = [
  {
    id: "REQ-AST-1056",
    asset: "Ventilator",
    location: "ICU - 2",
    status: "Approved",
    time: "10 min ago",
  },
  {
    id: "REQ-AST-1055",
    asset: "Monitor",
    location: "General Ward",
    status: "Pending",
    time: "1 hour ago",
  },
  {
    id: "REQ-AST-1054",
    asset: "Wheelchair",
    location: "Pediatrics",
    status: "In Progress",
    time: "2 hours ago",
  },
  {
    id: "REQ-AST-1053",
    asset: "Infusion Pump",
    location: "ICU - 1",
    status: "Pending",
    time: "3 hours ago",
  },
];
