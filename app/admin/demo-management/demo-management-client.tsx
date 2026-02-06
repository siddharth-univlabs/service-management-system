"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import PageHeader from "@/components/layout/page-header";
import MetricCard from "@/components/ui/metric-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { demoStatusTone } from "@/lib/utils/status";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type DemoSummary = {
  in_use: number;
  idle_deployed: number;
  returned: number;
  last_used_at: string | null;
};

type DemoDeviceRow = {
  id: string;
  serial_number: string;
  status: string;
  demo_status: string | null;
  demo_last_used_at: string | null;
  demo_assigned_hospital?: { name: string | null } | null;
  current_location_type?: string | null;
  current_hospital_id?: string | null;
  current_hospital?: { name: string | null } | null;
  device_model?: {
    id: string;
    model_name: string | null;
    device_category?: { name: string | null } | null;
  } | null;
};

type MovementRow = {
  id: string;
  moved_at: string | null;
  reason: string | null;
  device?: { serial_number: string | null } | null;
  from_hospital?: { name: string | null } | null;
  to_hospital?: { name: string | null } | null;
  from_warehouse?: { name: string | null } | null;
  to_warehouse?: { name: string | null } | null;
};

type HospitalOption = {
  id: string;
  name: string;
  region_id: string;
  subregion: string | null;
};

type CategoryOption = {
  id: string;
  name: string;
};

type ModelOption = {
  id: string;
  model_name: string | null;
  category_name: string | null;
};

type DemoSession = {
  id: string;
  start_date: string;
  end_date: string;
  created_at: string;
  owner_profile_id?: string | null;
  owner?: { user_id: string; full_name: string | null } | null;
  hospital?: { name: string | null } | null;
  devices: { id: string; serial_number: string | null; demo_status: string | null }[];
};

type DemoManagementClientProps = {
  summary: DemoSummary;
  demoDevices: DemoDeviceRow[];
  demoMovements: MovementRow[];
  hospitals: HospitalOption[];
  categories: CategoryOption[];
  models: ModelOption[];
  demoSessions: DemoSession[];
  teamMembers: { user_id: string; full_name: string | null }[];
  regionMemberIdsByRegionId: Record<string, string[]>;
};

type CreatedDemo = {
  id: string;
  created_at: string;
};

type DemoStatus = "IN_USE" | "AVAILABLE" | "RETURNED";
type DemoTab = "ongoing" | "upcoming" | "past";
type PastDeviceStatus = "Returned" | "Expired" | "In Transit";

export default function DemoManagementClient({
  summary,
  demoDevices,
  demoMovements,
  hospitals,
  categories,
  models,
  demoSessions,
  teamMembers,
  regionMemberIdsByRegionId,
}: DemoManagementClientProps) {
  const [currentDevices, setCurrentDevices] = useState(demoDevices);
  const [currentSessions, setCurrentSessions] = useState(demoSessions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DemoTab>("ongoing");
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [selectedOwnerProfileId, setSelectedOwnerProfileId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDemoStatus, setSelectedDemoStatus] = useState<DemoStatus>("IN_USE");
  const [serialSearch, setSerialSearch] = useState("");
  const [globalSerialSearch, setGlobalSerialSearch] = useState("");
  const [visibleDeviceCount, setVisibleDeviceCount] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdDemo, setCreatedDemo] = useState<CreatedDemo | null>(null);
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  const availableCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const availableModels = useMemo(() => {
    if (!selectedCategory) return [];
    return models
      .filter((model) => model.category_name === selectedCategory)
      .map((model) => ({
        id: model.id,
        name: model.model_name ?? "Unknown SKU",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [models, selectedCategory]);

  const selectedHospital = useMemo(
    () => hospitals.find((hospital) => hospital.id === selectedHospitalId) ?? null,
    [hospitals, selectedHospitalId]
  );

  const selectedHospitalRegionId = selectedHospital?.region_id ?? null;
  const primaryOwnerIds = useMemo(() => {
    if (!selectedHospitalRegionId) return [];
    return regionMemberIdsByRegionId[selectedHospitalRegionId] ?? [];
  }, [regionMemberIdsByRegionId, selectedHospitalRegionId]);

  const primaryOwners = useMemo(() => {
    if (!primaryOwnerIds.length) return [];
    return teamMembers
      .filter((member) => primaryOwnerIds.includes(member.user_id))
      .sort((a, b) => (a.full_name ?? a.user_id).localeCompare(b.full_name ?? b.user_id));
  }, [primaryOwnerIds, teamMembers]);

  const otherOwners = useMemo(() => {
    const primarySet = new Set(primaryOwnerIds);
    return teamMembers
      .filter((member) => !primarySet.has(member.user_id))
      .sort((a, b) => (a.full_name ?? a.user_id).localeCompare(b.full_name ?? b.user_id));
  }, [primaryOwnerIds, teamMembers]);

  const availableDevices = useMemo(() => {
    return currentDevices
      .filter((device) => device.demo_status === "AVAILABLE")
      .sort((a, b) => a.serial_number.localeCompare(b.serial_number));
  }, [currentDevices]);

  const modelSerials = useMemo(() => {
    if (!selectedModelId) return [];
    const query = serialSearch.trim().toLowerCase();
    return availableDevices
      .filter((device) => device.device_model?.id === selectedModelId)
      .filter((device) => (query ? device.serial_number.toLowerCase().includes(query) : true));
  }, [availableDevices, selectedModelId, serialSearch]);

  const globalSearchResults = useMemo(() => {
    const query = globalSerialSearch.trim().toLowerCase();
    if (!query) return [];
    return availableDevices
      .filter((device) => device.serial_number.toLowerCase().includes(query))
      .slice(0, 10);
  }, [availableDevices, globalSerialSearch]);

  const highlightedDeviceIds = useMemo(() => {
    if (!selectedHospitalId) return new Set<string>();
    const targetSubregion = selectedHospital?.subregion ?? null;
    if (!targetSubregion) return new Set<string>();

    const subregionByHospitalId = hospitals.reduce<Record<string, string | null>>((acc, hospital) => {
      acc[hospital.id] = hospital.subregion ?? null;
      return acc;
    }, {});

    const ids = new Set<string>();
    availableDevices.forEach((device) => {
      if (device.current_location_type !== "HOSPITAL") return;
      if (!device.current_hospital_id) return;
      if (device.current_hospital_id === selectedHospitalId) return;
      const deviceSubregion = subregionByHospitalId[device.current_hospital_id] ?? null;
      if (deviceSubregion && deviceSubregion === targetSubregion) {
        ids.add(device.id);
      }
    });
    return ids;
  }, [availableDevices, hospitals, selectedHospital, selectedHospitalId]);

  const addDeviceToBin = (deviceId: string) => {
    setSelectedDeviceIds((prev) => (prev.includes(deviceId) ? prev : [...prev, deviceId]));
  };

  const removeDeviceFromBin = (deviceId: string) => {
    setSelectedDeviceIds((prev) => prev.filter((id) => id !== deviceId));
  };

  const handleSerialDragStart = (
    event: React.DragEvent<HTMLElement>,
    deviceId: string
  ) => {
    event.dataTransfer.setData("text/plain", deviceId);
    event.dataTransfer.effectAllowed = "copy";
  };

  const handleBinDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const deviceId = event.dataTransfer.getData("text/plain");
    if (!deviceId) return;
    addDeviceToBin(deviceId);
  };

  const formatDate = (value: string) => value.slice(0, 10);
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const getPastStatus = (devices: DemoSession["devices"]): PastDeviceStatus => {
    if (!devices.length) return "Expired";
    if (devices.every((device) => device.demo_status === "RETURNED")) return "Returned";
    if (devices.some((device) => device.demo_status === "IN_USE")) return "Expired";
    return "In Transit";
  };

  const pastStatusTone: Record<PastDeviceStatus, "success" | "critical" | "warning"> = {
    Returned: "success",
    Expired: "critical",
    "In Transit": "warning",
  };

  const filteredSessions = useMemo(() => {
    return currentSessions.filter((session) => {
      const startDate = new Date(session.start_date);
      const endDate = new Date(session.end_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      if (activeTab === "ongoing") {
        return startDate <= today && endDate >= today;
      }
      if (activeTab === "upcoming") {
        return startDate > today;
      }
      return endDate < today;
    });
  }, [activeTab, currentSessions, today]);

  const openModal = () => {
    setIsModalOpen(true);
    setSelectedHospitalId("");
    setSelectedOwnerProfileId("");
    setSelectedCategory("");
    setSelectedModelId("");
    setSelectedDeviceIds([]);
    setStartDate("");
    setEndDate("");
    setSelectedDemoStatus("IN_USE");
    setSerialSearch("");
    setGlobalSerialSearch("");
    setVisibleDeviceCount(5);
    setError(null);
    setCreatedDemo(null);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
  };

  const handleCreateDemo = async () => {
    if (!selectedHospitalId) {
      setError("Select a hospital for this demo.");
      return;
    }
    if (!selectedOwnerProfileId) {
      setError("Assign a demo owner.");
      return;
    }
    if (!selectedDeviceIds.length) {
      setError("Select at least one device serial for this demo.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Select the demo start and end dates.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setCreatedDemo(null);

    const supabase = createSupabaseBrowserClient();
    const { data: demo, error: demoError } = await supabase
      .from("demo_sessions")
      .insert({
        hospital_id: selectedHospitalId,
        owner_profile_id: selectedOwnerProfileId,
        start_date: startDate,
        end_date: endDate,
      })
      .select("id, created_at")
      .single();

    if (demoError || !demo) {
      setError(demoError?.message ?? "Unable to create demo session.");
      setIsSaving(false);
      return;
    }

    const { error: deviceLinkError } = await supabase
      .from("demo_session_devices")
      .insert(
        selectedDeviceIds.map((deviceId) => ({
          demo_id: demo.id,
          device_id: deviceId,
        }))
      );

    if (deviceLinkError) {
      setError(deviceLinkError.message);
      setIsSaving(false);
      return;
    }

    const nowIso = new Date().toISOString();
    const { error: deviceUpdateError } = await supabase
      .from("devices")
      .update({
        demo_status: selectedDemoStatus,
        demo_assigned_hospital_id: selectedHospitalId,
        demo_last_used_at: nowIso,
      })
      .in("id", selectedDeviceIds);

    if (deviceUpdateError) {
      setError(deviceUpdateError.message);
      setIsSaving(false);
      return;
    }

    setCurrentDevices((prev) =>
      prev.map((device) =>
        selectedDeviceIds.includes(device.id)
          ? {
              ...device,
              demo_status: selectedDemoStatus,
              demo_last_used_at: nowIso,
              demo_assigned_hospital: {
                name: selectedHospital?.name ?? null,
              },
            }
          : device
      )
    );

    const selectedDevices = currentDevices
      .filter((device) => selectedDeviceIds.includes(device.id))
      .map((device) => ({
        id: device.id,
        serial_number: device.serial_number,
        demo_status: selectedDemoStatus,
      }));

    const selectedOwner =
      teamMembers.find((member) => member.user_id === selectedOwnerProfileId) ?? null;

    setCurrentSessions((prev) => [
      {
        id: demo.id,
        start_date: startDate,
        end_date: endDate,
        created_at: demo.created_at,
        owner_profile_id: selectedOwnerProfileId,
        owner: selectedOwner
          ? { user_id: selectedOwner.user_id, full_name: selectedOwner.full_name }
          : null,
        hospital: selectedHospital ? { name: selectedHospital.name } : null,
        devices: selectedDevices,
      },
      ...prev,
    ]);

    setCreatedDemo({ id: demo.id, created_at: demo.created_at });
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Demo Device Management"
        description="Track demo device utilization, last used dates, and movement history."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Demo In Use"
          value={summary.in_use.toString()}
          helper="Active in hospitals"
        />
        <MetricCard
          label="Idle Deployed"
          value={summary.idle_deployed.toString()}
          helper="Available on-site"
        />
        <MetricCard
          label="Returned"
          value={summary.returned.toString()}
          helper="Back in warehouse"
        />
        <MetricCard
          label="Last Movement"
          value={summary.last_used_at?.slice(0, 10) ?? "-"}
          helper="Most recent transfer"
        />
      </section>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Demo Sessions</h3>
            <p className="text-sm text-slate-400">
              Track active schedules and status by timeline.
            </p>
          </div>
          <Button onClick={openModal}>Create Demo</Button>
        </div>
        <div className="flex flex-wrap gap-2 rounded-full border border-slate-800/70 bg-slate-950/70 p-1">
          {[
            { key: "ongoing" as const, label: "Ongoing demos" },
            { key: "upcoming" as const, label: "Upcoming demos" },
            { key: "past" as const, label: "Past demos" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-teal-400 text-slate-950"
                  : "text-slate-300 hover:bg-slate-900/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Demo ID</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Hospital</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Devices</TableHead>
              <TableHead>Created</TableHead>
              {activeTab === "past" ? <TableHead>Device Status</TableHead> : null}
            </tr>
          </TableHeader>
          <TableBody>
            {filteredSessions.length ? (
              filteredSessions.map((session) => {
                const pastStatus = activeTab === "past" ? getPastStatus(session.devices) : null;
                return (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium text-slate-100">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(session.id);
                              setCopiedSessionId(session.id);
                              window.setTimeout(() => setCopiedSessionId(null), 1500);
                            } catch {
                              setError("Unable to copy demo ID.");
                            }
                          }}
                          aria-label="Copy demo ID"
                        >
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                        {copiedSessionId === session.id ? (
                          <span className="text-xs text-slate-400">Copied</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{session.owner?.full_name ?? "-"}</TableCell>
                    <TableCell>{session.hospital?.name ?? "-"}</TableCell>
                    <TableCell>
                      {formatDate(session.start_date)} → {formatDate(session.end_date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setViewingSessionId(session.id)}
                          aria-label="View demo devices"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <span className="text-xs text-slate-400">
                          {session.devices.length ? `${session.devices.length} device(s)` : "No devices"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(session.created_at)}</TableCell>
                    {activeTab === "past" ? (
                      <TableCell>
                        <Badge tone={pastStatusTone[pastStatus as PastDeviceStatus]}>
                          {pastStatus}
                        </Badge>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={activeTab === "past" ? 7 : 6}>
                  <div className="rounded-2xl border border-dashed border-slate-800/70 p-4 text-sm text-slate-400">
                    No demos found for this timeline.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {viewingSessionId ? (
        <DemoDevicesModal
          session={currentSessions.find((entry) => entry.id === viewingSessionId) ?? null}
          devices={currentDevices}
          onClose={() => setViewingSessionId(null)}
        />
      ) : null}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-100">Recent Demo Movements</h3>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Device</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Reason</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {demoMovements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell className="font-medium text-slate-100">
                  {movement.device?.serial_number ?? "-"}
                </TableCell>
                <TableCell>
                  {movement.from_hospital?.name ?? movement.from_warehouse?.name ?? "-"}
                </TableCell>
                <TableCell>
                  {movement.to_hospital?.name ?? movement.to_warehouse?.name ?? "-"}
                </TableCell>
                <TableCell>{movement.moved_at?.slice(0, 10) ?? "-"}</TableCell>
                <TableCell>{movement.reason ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-8xl overflow-y-auto rounded-3xl border border-slate-800/70 bg-slate-950/90 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.7)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  New demo
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-100">
                  Create Demo Session
                </h3>
                <p className="text-sm text-slate-400">
                  Assign demo devices, schedule the period, and save a new demo ID.
                </p>
              </div>
              <Button variant="ghost" onClick={closeModal}>
                Close
              </Button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Select
                label="Hospital"
                value={selectedHospitalId}
                onChange={(event) => {
                  setSelectedHospitalId(event.target.value);
                  setSelectedOwnerProfileId("");
                }}
              >
                <option value="">Select hospital</option>
                {hospitals.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </option>
                ))}
              </Select>
              <Select
                label="Demo owner"
                value={selectedOwnerProfileId}
                onChange={(event) => setSelectedOwnerProfileId(event.target.value)}
                disabled={!selectedHospitalId}
              >
                <option value="">Select team member</option>
                {selectedHospitalId && primaryOwners.length ? (
                  <optgroup label="In region">
                    {primaryOwners.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.full_name ?? member.user_id}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
                {selectedHospitalId && otherOwners.length ? (
                  <optgroup label="Other">
                    {otherOwners.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.full_name ?? member.user_id}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </Select>
              <Input
                label="From date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                onFocus={(event) =>
                  (event.currentTarget as HTMLInputElement & { showPicker?: () => void })
                    .showPicker?.()
                }
                onClick={(event) =>
                  (event.currentTarget as HTMLInputElement & { showPicker?: () => void })
                    .showPicker?.()
                }
              />
              <Input
                label="To date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                onFocus={(event) =>
                  (event.currentTarget as HTMLInputElement & { showPicker?: () => void })
                    .showPicker?.()
                }
                onClick={(event) =>
                  (event.currentTarget as HTMLInputElement & { showPicker?: () => void })
                    .showPicker?.()
                }
              />
              <Select
                label="Demo status"
                value={selectedDemoStatus}
                onChange={(event) =>
                  setSelectedDemoStatus(event.target.value as DemoStatus)
                }
              >
                <option value="IN_USE">In use</option>
                <option value="AVAILABLE">Available</option>
                <option value="RETURNED">Returned</option>
              </Select>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Categories
                      </p>
                      <h4 className="text-lg font-semibold text-slate-100">
                        Choose a category
                      </h4>
                    </div>
                    <div className="text-xs text-slate-400">
                      {availableCategories.length} total
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {availableCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(category.name);
                          setSelectedModelId("");
                          setSerialSearch("");
                          setVisibleDeviceCount(5);
                        }}
                        className={`rounded-3xl border px-4 py-4 text-left transition-all ${
                          selectedCategory === category.name
                            ? "border-teal-400/70 bg-teal-500/10"
                            : "border-slate-800/70 bg-slate-950/60 hover:border-slate-600"
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-100">
                          {category.name}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Devices
                      </p>
                      <h4 className="text-lg font-semibold text-slate-100">
                        Choose a device model
                      </h4>
                    </div>
                    <div className="text-xs text-slate-400">
                      {selectedCategory ? availableModels.length : 0} available
                    </div>
                  </div>

                  <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
                    {selectedCategory ? (
                      availableModels.length ? (
                        availableModels.map((model) => (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => {
                              setSelectedModelId(model.id);
                              setSerialSearch("");
                              setVisibleDeviceCount(5);
                            }}
                            className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                              selectedModelId === model.id
                                ? "border-teal-400/70 bg-teal-500/10"
                                : "border-slate-800/70 bg-slate-950/70 hover:border-teal-400/60"
                            }`}
                          >
                            <div>
                              <p className="font-semibold text-slate-100">{model.name}</p>
                              <p className="text-xs text-slate-400">Tap to view serials</p>
                            </div>
                            <Badge tone="neutral">Select</Badge>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-800/70 p-4 text-sm text-slate-400">
                          No models found for this category.
                        </div>
                      )
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-800/70 p-4 text-sm text-slate-400">
                        Select a category to see models.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Serials
                      </p>
                      <h4 className="text-lg font-semibold text-slate-100">
                        Drag serials into the demo bin
                      </h4>
                      <p className="mt-1 text-sm text-slate-400">
                        Showing demo devices with status AVAILABLE.
                      </p>
                    </div>
                    <div className="text-xs text-slate-400">
                      {selectedDeviceIds.length} in bin
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Input
                      label="Search serial (within model)"
                      placeholder="Type serial number"
                      value={serialSearch}
                      onChange={(event) => {
                        setSerialSearch(event.target.value);
                        setVisibleDeviceCount(5);
                      }}
                      disabled={!selectedModelId}
                    />
                    <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
                      {selectedHospital ? (
                        <div>
                          Target subregion: <span className="font-semibold text-slate-100">{selectedHospital.subregion ?? "-"}</span>
                        </div>
                      ) : (
                        <div>Select a hospital to enable nearby highlighting.</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {selectedModelId ? (
                      modelSerials.length ? (
                        modelSerials.slice(0, visibleDeviceCount).map((device) => {
                          const isHighlighted = highlightedDeviceIds.has(device.id);
                          const locationLabel =
                            device.current_location_type === "HOSPITAL"
                              ? device.current_hospital?.name ?? "Hospital"
                              : "Warehouse";

                          return (
                            <div
                              key={device.id}
                              role="button"
                              tabIndex={0}
                              draggable
                              onDragStart={(event) => handleSerialDragStart(event, device.id)}
                              onDoubleClick={() => addDeviceToBin(device.id)}
                              className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-sm transition-all ${
                                isHighlighted
                                  ? "border-amber-400/70 bg-amber-500/10"
                                  : "border-slate-800/70 bg-slate-950/70 hover:border-teal-400/50"
                              }`}
                            >
                              <div>
                                <p className="font-semibold text-slate-100">{device.serial_number}</p>
                                <p className="text-xs text-slate-400">
                                  {device.device_model?.model_name ?? "-"} · {locationLabel}
                                  {isHighlighted ? " · Nearby available" : ""}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge tone={demoStatusTone(device.demo_status ?? undefined)}>
                                  {device.demo_status ?? "-"}
                                </Badge>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={() => addDeviceToBin(device.id)}
                                >
                                  Add
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-800/70 p-4 text-sm text-slate-400">
                          No available demo devices found for this model.
                        </div>
                      )
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-800/70 p-4 text-sm text-slate-400">
                        Select a model to see device serials.
                      </div>
                    )}

                    {selectedModelId && modelSerials.length > visibleDeviceCount ? (
                      <div className="pt-2">
                        <Button
                          variant="secondary"
                          type="button"
                          onClick={() => setVisibleDeviceCount((prev) => prev + 10)}
                        >
                          See more
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div
                className="flex min-h-[280px] flex-col rounded-3xl border border-dashed border-slate-700/70 bg-slate-950/60 p-5"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleBinDrop}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Demo bin
                    </p>
                    <h4 className="text-lg font-semibold text-slate-100">Selected serials</h4>
                  </div>
                  <div className="text-xs text-slate-400">{selectedDeviceIds.length} added</div>
                </div>

                <div className="mt-4">
                  <Input
                    label="Search & add any serial"
                    placeholder="Type serial number"
                    value={globalSerialSearch}
                    onChange={(event) => setGlobalSerialSearch(event.target.value)}
                  />

                  {globalSearchResults.length ? (
                    <div className="mt-3 space-y-2">
                      {globalSearchResults.map((device) => {
                        const inBin = selectedDeviceIds.includes(device.id);
                        return (
                          <div
                            key={`global-${device.id}`}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/70 px-4 py-3 text-sm"
                          >
                            <div>
                              <div className="font-semibold text-slate-100">{device.serial_number}</div>
                              <div className="text-xs text-slate-400">
                                {device.device_model?.model_name ?? "-"}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant={inBin ? "ghost" : "secondary"}
                              onClick={() => (inBin ? removeDeviceFromBin(device.id) : addDeviceToBin(device.id))}
                            >
                              {inBin ? "Remove" : "Add"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : globalSerialSearch.trim() ? (
                    <div className="mt-3 rounded-2xl border border-dashed border-slate-800/70 p-3 text-sm text-slate-400">
                      No available serials match that search.
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 flex-1 overflow-y-auto">
                  {selectedDeviceIds.length ? (
                    <div className="space-y-2">
                      {selectedDeviceIds.map((deviceId) => {
                        const device = currentDevices.find((entry) => entry.id === deviceId);
                        if (!device) return null;
                        return (
                          <div
                            key={`bin-${deviceId}`}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/70 px-4 py-3 text-sm"
                          >
                            <div>
                              <div className="font-semibold text-slate-100">{device.serial_number}</div>
                              <div className="text-xs text-slate-400">
                                {device.device_model?.model_name ?? "-"}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => removeDeviceFromBin(deviceId)}
                            >
                              Remove
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-800/70 p-4 text-sm text-slate-400">
                      Drag serials here (or search above) to add them.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            {createdDemo && (
              <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                <p className="font-semibold text-emerald-100">Demo created successfully.</p>
                <p>Demo ID: {createdDemo.id}</p>
                <p>
                  Created at: {new Date(createdDemo.created_at).toLocaleString()}
                </p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={closeModal} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleCreateDemo} disabled={isSaving}>
                {isSaving ? "Saving..." : "Create Demo"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function DemoDevicesModal({
  session,
  devices,
  onClose,
}: {
  session: DemoSession | null;
  devices: DemoDeviceRow[];
  onClose: () => void;
}) {
  const detailedDevices = useMemo(() => {
    if (!session) return [];
    const deviceById = devices.reduce<Record<string, DemoDeviceRow>>((acc, device) => {
      acc[device.id] = device;
      return acc;
    }, {});

    return session.devices
      .map((entry) => {
        const device = deviceById[entry.id];
        return {
          id: entry.id,
          serial_number: device?.serial_number ?? entry.serial_number ?? null,
          demo_status: entry.demo_status ?? device?.demo_status ?? null,
          model_name: device?.device_model?.model_name ?? null,
          category_name: device?.device_model?.device_category?.name ?? null,
          location_type: device?.current_location_type ?? null,
          location_name:
            device?.current_location_type === "HOSPITAL"
              ? device?.current_hospital?.name ?? null
              : "Warehouse",
        };
      })
      .sort((a, b) => (a.serial_number ?? a.id).localeCompare(b.serial_number ?? b.id));
  }, [devices, session]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-800/70 bg-slate-950/90 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.7)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Demo devices
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-100">
              Assigned devices
            </h3>
            <p className="text-sm text-slate-400">
              Demo ID: {session?.id.slice(0, 8) ?? "-"}
            </p>
          </div>
          <Button variant="ghost" type="button" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-6">
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Category</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Serial</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {detailedDevices.length ? (
                detailedDevices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>{device.category_name ?? "-"}</TableCell>
                    <TableCell>{device.model_name ?? "-"}</TableCell>
                    <TableCell className="font-medium text-slate-100">
                      {device.serial_number ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge tone={demoStatusTone(device.demo_status ?? undefined)}>
                        {device.demo_status ?? "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-300">
                      {device.location_name ?? "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="rounded-2xl border border-dashed border-slate-800/70 p-4 text-sm text-slate-400">
                      No devices assigned to this demo.
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
