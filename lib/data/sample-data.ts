export type Hospital = {
  id: string;
  name: string;
  address: string;
  city: string;
  zone: string;
  latitude: string;
  longitude: string;
  devicesDeployed: number;
  engineersAssigned: number;
};

export type DeviceCategory = {
  id: string;
  name: string;
};

export type DeviceModel = {
  id: string;
  categoryId: string;
  name: string;
  manufacturer: string;
  modelCode: string;
};

export type DeviceAsset = {
  id: string;
  serialNumber: string;
  modelName: string;
  category: string;
  ownershipType: "COMPANY" | "CUSTOMER";
  usageType: "DEMO" | "SOLD";
  status: "IN_INVENTORY" | "DEPLOYED" | "UNDER_SERVICE" | "SCRAPPED";
  location: string;
  hospital?: string;
  demoStatus?: "AVAILABLE" | "IN_USE" | "RETURNED";
  demoLastUsed?: string;
};

export const hospitals: Hospital[] = [
  {
    id: "hosp-vertis",
    name: "Vertis Surgical Center",
    address: "1187 West Bay Road",
    city: "Bengaluru",
    zone: "South",
    latitude: "12.9716",
    longitude: "77.5946",
    devicesDeployed: 24,
    engineersAssigned: 3,
  },
  {
    id: "hosp-sunrise",
    name: "Sunrise Specialty Hospital",
    address: "42 Old Mahabalipuram Road",
    city: "Chennai",
    zone: "East",
    latitude: "13.0827",
    longitude: "80.2707",
    devicesDeployed: 18,
    engineersAssigned: 2,
  },
  {
    id: "hosp-lakeview",
    name: "Lakeview Medical Institute",
    address: "920 Crescent Avenue",
    city: "Hyderabad",
    zone: "Central",
    latitude: "17.3850",
    longitude: "78.4867",
    devicesDeployed: 31,
    engineersAssigned: 4,
  },
  {
    id: "hosp-briar",
    name: "Briar Oncology Hospital",
    address: "16 Orchard Street",
    city: "Pune",
    zone: "West",
    latitude: "18.5204",
    longitude: "73.8567",
    devicesDeployed: 12,
    engineersAssigned: 1,
  },
];

export const inventoryByModel = [
  {
    model: "4-MOS Camera with Coupler",
    category: "Camera",
    total: 36,
    inInventory: 8,
    deployed: 28,
    demoDeployed: 12,
    soldDeployed: 16,
  },
  {
    model: "2-MOS HD Camera",
    category: "Camera",
    total: 28,
    inInventory: 6,
    deployed: 22,
    demoDeployed: 7,
    soldDeployed: 15,
  },
  {
    model: "VentoFlow Insufflator",
    category: "Insufflator",
    total: 22,
    inInventory: 5,
    deployed: 17,
    demoDeployed: 6,
    soldDeployed: 11,
  },
  {
    model: "LG 32HL710 Monitor",
    category: "Monitor",
    total: 40,
    inInventory: 11,
    deployed: 29,
    demoDeployed: 5,
    soldDeployed: 24,
  },
  {
    model: "Iris Infusion Pump",
    category: "Pump",
    total: 60,
    inInventory: 12,
    deployed: 48,
    demoDeployed: 8,
    soldDeployed: 40,
  },
];

export const deviceCategories: DeviceCategory[] = [
  { id: "cat-camera", name: "Camera" },
  { id: "cat-insufflator", name: "Insufflator" },
  { id: "cat-monitor", name: "Monitor" },
  { id: "cat-pump", name: "Pump" },
  { id: "cat-light", name: "Light Source" },
];

export const deviceModels: DeviceModel[] = [
  {
    id: "model-cam-4mos",
    categoryId: "cat-camera",
    name: "4-MOS Camera with Coupler",
    manufacturer: "MedOptix",
    modelCode: "CAM-4MOS",
  },
  {
    id: "model-cam-2mos",
    categoryId: "cat-camera",
    name: "2-MOS HD Camera",
    manufacturer: "MedOptix",
    modelCode: "CAM-2MOS",
  },
  {
    id: "model-ins-vento",
    categoryId: "cat-insufflator",
    name: "VentoFlow Insufflator",
    manufacturer: "CareDynamics",
    modelCode: "INS-VENTO",
  },
  {
    id: "model-mon-lg32",
    categoryId: "cat-monitor",
    name: "LG 32HL710 Monitor",
    manufacturer: "LG",
    modelCode: "MON-LG32",
  },
  {
    id: "model-pump-iris",
    categoryId: "cat-pump",
    name: "Iris Infusion Pump",
    manufacturer: "VitalPath",
    modelCode: "PMP-IRIS",
  },
];

export const devices: DeviceAsset[] = [
  {
    id: "dev-0001",
    serialNumber: "MD-4MOS-001",
    modelName: "4-MOS Camera with Coupler",
    category: "Camera",
    ownershipType: "COMPANY",
    usageType: "DEMO",
    status: "DEPLOYED",
    location: "Vertis Surgical Center",
    hospital: "Vertis Surgical Center",
    demoStatus: "IN_USE",
    demoLastUsed: "2026-01-15",
  },
  {
    id: "dev-0002",
    serialNumber: "MD-VENTO-018",
    modelName: "VentoFlow Insufflator",
    category: "Insufflator",
    ownershipType: "COMPANY",
    usageType: "DEMO",
    status: "DEPLOYED",
    location: "Lakeview Medical Institute",
    hospital: "Lakeview Medical Institute",
    demoStatus: "AVAILABLE",
    demoLastUsed: "2026-01-08",
  },
  {
    id: "dev-0003",
    serialNumber: "MD-LG32-042",
    modelName: "LG 32HL710 Monitor",
    category: "Monitor",
    ownershipType: "CUSTOMER",
    usageType: "SOLD",
    status: "DEPLOYED",
    location: "Sunrise Specialty Hospital",
    hospital: "Sunrise Specialty Hospital",
  },
  {
    id: "dev-0004",
    serialNumber: "MD-IRIS-004",
    modelName: "Iris Infusion Pump",
    category: "Pump",
    ownershipType: "COMPANY",
    usageType: "DEMO",
    status: "UNDER_SERVICE",
    location: "Central Warehouse",
    demoStatus: "RETURNED",
    demoLastUsed: "2025-12-18",
  },
  {
    id: "dev-0005",
    serialNumber: "MD-2MOS-011",
    modelName: "2-MOS HD Camera",
    category: "Camera",
    ownershipType: "CUSTOMER",
    usageType: "SOLD",
    status: "DEPLOYED",
    location: "Briar Oncology Hospital",
    hospital: "Briar Oncology Hospital",
  },
];

export const inventoryMetrics = {
  totalDevices: 186,
  inInventory: 42,
  deployed: 124,
  underService: 12,
  scrapped: 8,
  demoDeployed: 38,
  soldDeployed: 86,
};

export const demoMetrics = {
  inUse: 22,
  idle: 12,
  returned: 4,
  lastMovement: "2026-01-18",
};

export const demoMovements = [
  {
    id: "move-001",
    device: "MD-4MOS-001",
    from: "Central Warehouse",
    to: "Vertis Surgical Center",
    movedAt: "2026-01-18",
    reason: "New surgeon demo",
  },
  {
    id: "move-002",
    device: "MD-VENTO-018",
    from: "Lakeview Medical Institute",
    to: "Central Warehouse",
    movedAt: "2026-01-12",
    reason: "Rotation return",
  },
  {
    id: "move-003",
    device: "MD-IRIS-004",
    from: "Central Warehouse",
    to: "Briar Oncology Hospital",
    movedAt: "2025-12-20",
    reason: "Emergency demo replacement",
  },
];

export const engineerProfile = {
  name: "Ravi Menon",
  assignedHospitals: 3,
  openTickets: 4,
  priorityTickets: 2,
};
