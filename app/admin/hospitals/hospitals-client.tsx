"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import HospitalTable from "./hospital-table";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type RegionRow = {
  id: string;
  name: string;
  code: string;
  parent_region_id: string | null;
  is_locked: boolean;
};

type DeviceDetail = {
  id: string;
  serial_number: string;
  ownership_type: string;
  usage_type: string;
  status: string;
  model_name: string | null;
  category_name: string | null;
};

type EngineerDetail = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
};

type DeviceOption = {
  id: string;
  serial_number: string;
  ownership_type: string;
  usage_type: string;
  status: string;
  current_location_type: string;
  current_hospital_id: string | null;
  current_warehouse_id: string | null;
  model_name: string | null;
  category_name: string | null;
};

type WarehouseOption = {
  id: string;
  name: string;
};

type PocEntry = {
  name: string;
  phone: string;
};

type HospitalDetail = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zone: string | null;
  subregion?: string | null;
  region_id?: string | null;
  poc?: PocEntry[];
  devices_deployed: number | null;
  engineers_assigned: number | null;
  devices: DeviceDetail[];
  engineers: EngineerDetail[];
};

type HospitalsClientProps = {
  hospitals: HospitalDetail[];
  engineers: EngineerDetail[];
  devices: DeviceOption[];
  warehouses: WarehouseOption[];
  regions: RegionRow[];
};

type FormState = {
  name: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  primaryRegionId: string;
  subregionId: string;
  poc: PocEntry[];
};

type EditFormState = {
  address: string;
  pincode: string;
  city: string;
  state: string;
  primaryRegionId: string;
  subregionId: string;
  poc: PocEntry[];
};

const emptyForm: FormState = {
  name: "",
  address: "",
  pincode: "",
  city: "",
  state: "",
  primaryRegionId: "",
  subregionId: "",
  poc: [{ name: "", phone: "" }],
};

const emptyEditForm: EditFormState = {
  address: "",
  pincode: "",
  city: "",
  state: "",
  primaryRegionId: "",
  subregionId: "",
  poc: [{ name: "", phone: "" }],
};

const formatDeviceStatus = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDevicePurpose = (value: string) => {
  switch (value) {
    case "DEMO":
      return "Demo unit";
    case "SOLD":
      return "Sold";
    case "CONFERENCE":
      return "Conference";
    default:
      return formatDeviceStatus(value);
  }
};

export default function HospitalsClient({
  hospitals,
  engineers,
  devices,
  warehouses,
  regions,
}: HospitalsClientProps) {
  const defaultWarehouseId = warehouses[0]?.id ?? "";
  const [currentHospitals, setCurrentHospitals] = useState(hospitals);
  const [currentDevices, setCurrentDevices] = useState(devices);
  const [searchValue, setSearchValue] = useState("");
  const [zoneValue, setZoneValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<HospitalDetail | null>(null);
  const [formState, setFormState] = useState<FormState>(emptyForm);
  const [editFormState, setEditFormState] = useState<EditFormState>(emptyEditForm);
  const [editEngineers, setEditEngineers] = useState<EngineerDetail[]>([]);
  const [editDevices, setEditDevices] = useState<DeviceOption[]>([]);
  const [selectedEngineerId, setSelectedEngineerId] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isEditLookup, setIsEditLookup] = useState(false);

  const filteredHospitals = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return currentHospitals.filter((hospital) => {
      const matchesQuery = query
        ? [
            hospital.name,
            hospital.city ?? "",
            hospital.state ?? "",
            hospital.address ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)
        : true;
      const matchesZone = zoneValue ? hospital.zone === zoneValue : true;
      return matchesQuery && matchesZone;
    });
  }, [currentHospitals, searchValue, zoneValue]);

  const primaryRegions = useMemo(() => {
    return regions
      .filter((region) => region.is_locked && region.parent_region_id === null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [regions]);

  const subregionsByPrimaryId = useMemo(() => {
    return regions
      .filter((region) => !region.is_locked && region.parent_region_id)
      .reduce<Record<string, RegionRow[]>>((acc, region) => {
        const parentId = region.parent_region_id as string;
        acc[parentId] ??= [];
        acc[parentId].push(region);
        return acc;
      }, {});
  }, [regions]);

  const regionById = useMemo(() => {
    return regions.reduce<Record<string, RegionRow>>((acc, region) => {
      acc[region.id] = region;
      return acc;
    }, {});
  }, [regions]);

  const deriveSubregionName = (regionId: string | null | undefined) => {
    if (!regionId) return null;
    const region = regionById[regionId];
    if (!region) return null;
    return region.parent_region_id ? region.name : null;
  };

  useEffect(() => {
    setCurrentHospitals((prev) =>
      prev.map((hospital) => {
        if (hospital.subregion) return hospital;
        const derived = deriveSubregionName(hospital.region_id);
        if (!derived) return hospital;
        return { ...hospital, subregion: derived };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionById]);

  const subregionsForCreate = useMemo(() => {
    if (!formState.primaryRegionId) return [];
    return (subregionsByPrimaryId[formState.primaryRegionId] ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [formState.primaryRegionId, subregionsByPrimaryId]);

  const subregionsForEdit = useMemo(() => {
    if (!editFormState.primaryRegionId) return [];
    return (subregionsByPrimaryId[editFormState.primaryRegionId] ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [editFormState.primaryRegionId, subregionsByPrimaryId]);

  const availableEngineers = useMemo(() => {
    return engineers.filter(
      (engineer) =>
        engineer.is_active &&
        !editEngineers.some((assigned) => assigned.user_id === engineer.user_id)
    );
  }, [engineers, editEngineers]);

  const availableDevices = useMemo(() => {
    return currentDevices.filter(
      (device) =>
        device.current_location_type === "WAREHOUSE" &&
        device.status === "IN_INVENTORY" &&
        !device.current_hospital_id &&
        !editDevices.some((assigned) => assigned.id === device.id)
    );
  }, [currentDevices, editDevices]);

  const openModal = () => {
    setError(null);
    setFormState(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (hospital: HospitalDetail) => {
    setEditError(null);
    const address = hospital.address ?? "";
    const pincodeMatch = address.match(/(\d{6})\s*$/);
    const parsedPincode = pincodeMatch?.[1] ?? "";
    const parsedAddress = pincodeMatch
      ? address.replace(pincodeMatch[0], "").replace(/[,\s]+$/, "")
      : address;

    setEditingHospital(hospital);

    const savedRegionId = hospital.region_id ?? null;
    const savedRegion = savedRegionId ? regionById[savedRegionId] : null;
    const primaryRegionId = savedRegion
      ? savedRegion.parent_region_id ?? savedRegion.id
      : "";
    const subregionId = savedRegion && savedRegion.parent_region_id ? savedRegion.id : "";

    setEditFormState({
      address: parsedAddress,
      pincode: parsedPincode,
      city: hospital.city ?? "",
      state: hospital.state ?? "",
      primaryRegionId,
      subregionId,
      poc:
        (hospital.poc?.length
          ? hospital.poc
          : [{ name: "", phone: "" }]) as PocEntry[],
    });
    setEditEngineers(hospital.engineers ?? []);
    setEditDevices(
      currentDevices.filter((device) => device.current_hospital_id === hospital.id)
    );
    setSelectedEngineerId("");
    setSelectedDeviceId("");
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
  };

  const closeEditModal = () => {
    if (isEditSaving) return;
    setEditingHospital(null);
    setEditError(null);
  };

  const handleSave = async () => {
    if (!formState.name.trim()) {
      setError("Hospital name is required.");
      return;
    }

    const normalizedPoc = (formState.poc ?? [])
      .map((entry) => ({
        name: entry.name.trim(),
        phone: entry.phone.trim(),
      }))
      .filter((entry) => entry.name || entry.phone);

    if (!normalizedPoc.length) {
      setError("At least one point of contact (POC) is required.");
      return;
    }

    if (normalizedPoc.some((entry) => !entry.name || !entry.phone)) {
      setError("Each POC must have both name and phone number.");
      return;
    }

    if (!formState.primaryRegionId) {
      setError("Zone is required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const addressLine = formState.address.trim();
    const pincodeValue = formState.pincode.trim();
    const addressWithPincode =
      addressLine && pincodeValue
        ? `${addressLine}, ${pincodeValue}`
        : addressLine || pincodeValue;

    const selectedSubregionName = formState.subregionId
      ? regionById[formState.subregionId]?.name ?? null
      : null;

    const payload = {
      name: formState.name.trim(),
      address: addressWithPincode || null,
      city: formState.city.trim() || null,
      state: formState.state.trim() || null,
      zone: regionById[formState.primaryRegionId]?.name ?? null,
      region_id: formState.subregionId || formState.primaryRegionId,
      poc: normalizedPoc,
    };

    const { data, error: insertError } = await supabase
      .from("hospitals")
      .insert(payload)
      .select("id, name, address, city, state, zone, region_id, poc")
      .single();

    if (insertError) {
      setError(insertError.message);
      setIsSaving(false);
      return;
    }

    const newHospital: HospitalDetail = {
      id: data.id,
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state ?? null,
      zone: data.zone,
      subregion: selectedSubregionName,
      region_id: data.region_id ?? null,
      poc: (data.poc ?? []) as PocEntry[],
      devices_deployed: 0,
      engineers_assigned: 0,
      devices: [],
      engineers: [],
    };

    setCurrentHospitals((prev) =>
      [...prev, newHospital].sort((a, b) => a.name.localeCompare(b.name))
    );
    setIsSaving(false);
    setIsModalOpen(false);
  };

  const updateHospitalState = (
    hospitalId: string,
    options?: {
      engineers?: EngineerDetail[];
      devices?: DeviceOption[];
      details?: Partial<HospitalDetail>;
    }
  ) => {
    const assignedEngineers = options?.engineers ?? editEngineers;
    const deviceSource = options?.devices ?? currentDevices;
    const details = options?.details ?? editingHospital;

    setCurrentHospitals((prev) =>
      prev.map((hospital) => {
        if (hospital.id !== hospitalId) return hospital;
        const assignedDevices = deviceSource.filter(
          (device) => device.current_hospital_id === hospitalId
        );
        return {
          ...hospital,
          address: details?.address ?? hospital.address,
          city: details?.city ?? hospital.city,
          state: details?.state ?? hospital.state,
          zone: details?.zone ?? hospital.zone,
          region_id: details?.region_id ?? hospital.region_id,
          poc: details?.poc ?? hospital.poc,
          devices: assignedDevices.map((device) => ({
            id: device.id,
            serial_number: device.serial_number,
            ownership_type: device.ownership_type,
            usage_type: device.usage_type,
            status: device.status,
            model_name: device.model_name ?? null,
            category_name: device.category_name ?? null,
          })),
          engineers: assignedEngineers,
          devices_deployed: assignedDevices.filter(
            (device) => device.status === "DEPLOYED"
          ).length,
          engineers_assigned: assignedEngineers.length,
        };
      })
    );
  };

  const saveHospitalDetails = async () => {
    if (!editingHospital) return;

    const normalizedPoc = (editFormState.poc ?? [])
      .map((entry) => ({
        name: entry.name.trim(),
        phone: entry.phone.trim(),
      }))
      .filter((entry) => entry.name || entry.phone);

    if (!normalizedPoc.length) {
      setEditError("At least one point of contact (POC) is required.");
      return;
    }

    if (normalizedPoc.some((entry) => !entry.name || !entry.phone)) {
      setEditError("Each POC must have both name and phone number.");
      return;
    }

    if (!editFormState.primaryRegionId) {
      setEditError("Zone is required.");
      return;
    }

    setIsEditSaving(true);
    setEditError(null);
    const supabase = createSupabaseBrowserClient();
    const addressLine = editFormState.address.trim();
    const pincodeValue = editFormState.pincode.trim();
    const addressWithPincode =
      addressLine && pincodeValue
        ? `${addressLine}, ${pincodeValue}`
        : addressLine || pincodeValue;

    const selectedSubregionName = editFormState.subregionId
      ? regionById[editFormState.subregionId]?.name ?? null
      : null;

    const { error: updateError } = await supabase
      .from("hospitals")
      .update({
        address: addressWithPincode || null,
        city: editFormState.city.trim() || null,
        state: editFormState.state.trim() || null,
        zone: regionById[editFormState.primaryRegionId]?.name ?? null,
        region_id: editFormState.subregionId || editFormState.primaryRegionId,
        poc: normalizedPoc,
      })
      .eq("id", editingHospital.id);

    if (updateError) {
      setEditError(updateError.message);
      setIsEditSaving(false);
      return;
    }

    const updatedHospital = {
      ...editingHospital,
      address: addressWithPincode || null,
      city: editFormState.city.trim() || null,
      state: editFormState.state.trim() || null,
      zone: regionById[editFormState.primaryRegionId]?.name ?? null,
      subregion: selectedSubregionName,
      region_id: editFormState.subregionId || editFormState.primaryRegionId,
      poc: normalizedPoc,
    };
    setEditingHospital(updatedHospital);
    updateHospitalState(editingHospital.id, { details: updatedHospital });
    setIsEditSaving(false);
  };

  const assignEngineer = async () => {
    if (!editingHospital || !selectedEngineerId) return;
    setIsEditSaving(true);
    setEditError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: assignError } = await supabase
      .from("engineer_hospitals")
      .upsert({
        engineer_id: selectedEngineerId,
        hospital_id: editingHospital.id,
      }, { onConflict: "engineer_id,hospital_id" });

    if (assignError) {
      setEditError(assignError.message);
      setIsEditSaving(false);
      return;
    }

    const engineer = engineers.find((entry) => entry.user_id === selectedEngineerId);
    if (engineer) {
      const nextEngineers = [...editEngineers, engineer];
      setEditEngineers(nextEngineers);
      updateHospitalState(editingHospital.id, { engineers: nextEngineers });
    }
    setSelectedEngineerId("");
    setIsEditSaving(false);
  };

  const removeEngineer = async (engineerId: string) => {
    if (!editingHospital) return;
    setIsEditSaving(true);
    setEditError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: removeError } = await supabase
      .from("engineer_hospitals")
      .delete()
      .eq("engineer_id", engineerId)
      .eq("hospital_id", editingHospital.id);

    if (removeError) {
      setEditError(removeError.message);
      setIsEditSaving(false);
      return;
    }

    const nextEngineers = editEngineers.filter((entry) => entry.user_id !== engineerId);
    setEditEngineers(nextEngineers);
    updateHospitalState(editingHospital.id, { engineers: nextEngineers });
    setIsEditSaving(false);
  };

  const assignDevice = async () => {
    if (!editingHospital || !selectedDeviceId) return;
    setIsEditSaving(true);
    setEditError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: assignError } = await supabase
      .from("devices")
      .update({
        current_location_type: "HOSPITAL",
        current_hospital_id: editingHospital.id,
        current_warehouse_id: null,
      })
      .eq("id", selectedDeviceId);

    if (assignError) {
      setEditError(assignError.message);
      setIsEditSaving(false);
      return;
    }

    const nextDevices = currentDevices.map((device) =>
      device.id === selectedDeviceId
        ? {
            ...device,
            current_location_type: "HOSPITAL",
            current_hospital_id: editingHospital.id,
            current_warehouse_id: null,
          }
        : device
    );
    setCurrentDevices(nextDevices);

    const updatedDevice = nextDevices.find((device) => device.id === selectedDeviceId);
    if (updatedDevice) {
      const nextEditDevices = [...editDevices, updatedDevice];
      setEditDevices(nextEditDevices);
      updateHospitalState(editingHospital.id, { devices: nextDevices });
    }
    setSelectedDeviceId("");
    setIsEditSaving(false);
  };

  const removeDevice = async (deviceId: string) => {
    if (!editingHospital) return;
    if (!defaultWarehouseId) {
      setEditError("No warehouse available to return this device.");
      return;
    }
    setIsEditSaving(true);
    setEditError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: removeError } = await supabase
      .from("devices")
      .update({
        current_location_type: "WAREHOUSE",
        current_hospital_id: null,
        current_warehouse_id: defaultWarehouseId,
      })
      .eq("id", deviceId);

    if (removeError) {
      setEditError(removeError.message);
      setIsEditSaving(false);
      return;
    }

    const nextDevices = currentDevices.map((device) =>
      device.id === deviceId
        ? {
            ...device,
            current_location_type: "WAREHOUSE",
            current_hospital_id: null,
            current_warehouse_id: defaultWarehouseId,
          }
        : device
    );
    setCurrentDevices(nextDevices);
    const nextEditDevices = editDevices.filter((device) => device.id !== deviceId);
    setEditDevices(nextEditDevices);
    updateHospitalState(editingHospital.id, { devices: nextDevices });
    setIsEditSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-800/70 bg-slate-950/70 p-4 shadow-[0_20px_50px_rgba(2,6,23,0.5)] md:flex-row md:items-end">
        <Input
          label="Search"
          placeholder="Hospital name or city"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
        <Select
          label="Zone"
          value={zoneValue}
          onChange={(event) => setZoneValue(event.target.value)}
        >
          <option value="">All zones</option>
          {primaryRegions.map((region) => (
            <option key={region.id} value={region.name}>
              {region.name}
            </option>
          ))}
        </Select>
        <div className="flex flex-1 items-end justify-between gap-3">
          <Button variant="secondary" onClick={() => {
            setSearchValue("");
            setZoneValue("");
          }}>
            Clear filters
          </Button>
          <Button onClick={openModal}>Add Hospital</Button>
        </div>
      </div>

      <HospitalTable hospitals={filteredHospitals} onEdit={openEditModal} />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-800/70 bg-slate-950/90 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.7)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Add hospital
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-100">
                  New Hospital Details
                </h3>
              </div>
              <Button variant="ghost" onClick={closeModal}>
                Close
              </Button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input
                label="Hospital name"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                required
              />

              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 md:col-span-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Point of contact
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Add one or more contacts for this hospital.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        poc: [...prev.poc, { name: "", phone: "" }],
                      }))
                    }
                  >
                    Add POC
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {formState.poc.map((entry, index) => (
                    <div
                      key={`poc-${index}`}
                      className="grid gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 md:grid-cols-[1fr_1fr_auto]"
                    >
                      <Input
                        label="Name"
                        value={entry.name}
                        onChange={(event) => {
                          const value = event.target.value;
                          setFormState((prev) => ({
                            ...prev,
                            poc: prev.poc.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, name: value } : item
                            ),
                          }));
                        }}
                        placeholder="POC name"
                        required
                      />
                      <Input
                        label="Phone"
                        value={entry.phone}
                        onChange={(event) => {
                          const value = event.target.value;
                          setFormState((prev) => ({
                            ...prev,
                            poc: prev.poc.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, phone: value } : item
                            ),
                          }));
                        }}
                        placeholder="POC phone"
                        inputMode="tel"
                        required
                      />
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          className="border border-slate-800/70"
                          onClick={() =>
                            setFormState((prev) => ({
                              ...prev,
                              poc:
                                prev.poc.length > 1
                                  ? prev.poc.filter((_, itemIndex) => itemIndex !== index)
                                  : prev.poc,
                            }))
                          }
                          disabled={formState.poc.length <= 1}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Input
                label="Address"
                value={formState.address}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    address: event.target.value,
                  }))
                }
              />
              <div className="flex flex-col gap-2 text-sm font-medium text-slate-300">
                <span>Pincode</span>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    className="flex-1"
                    value={formState.pincode}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        pincode: event.target.value,
                      }))
                    }
                    placeholder="Enter pincode"
                    inputMode="numeric"
                  />
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      const trimmed = formState.pincode.trim();
                      if (trimmed.length < 6) {
                        setError("Enter a valid 6 digit pincode.");
                        return;
                      }
                      setError(null);
                      setIsLookingUp(true);
                      try {
                        const response = await fetch(
                          `https://api.postalpincode.in/pincode/${trimmed}`
                        );
                        const data = await response.json();
                        const office = data?.[0]?.PostOffice?.[0];
                        if (!office) {
                          setError("No location found for this pincode.");
                        } else {
                          setFormState((prev) => ({
                            ...prev,
                            city: office.District ?? prev.city,
                            state: office.State ?? prev.state,
                          }));
                        }
                      } catch (lookupError) {
                        setError(
                          lookupError instanceof Error
                            ? lookupError.message
                            : "Unable to fetch location."
                        );
                      } finally {
                        setIsLookingUp(false);
                      }
                    }}
                    disabled={isLookingUp}
                  >
                    {isLookingUp ? "Fetching..." : "Lookup"}
                  </Button>
                </div>
              </div>
              <Input
                label="City"
                value={formState.city}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    city: event.target.value,
                  }))
                }
              />
              <Input
                label="State"
                value={formState.state}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    state: event.target.value,
                  }))
                }
              />
              <Select
                label="Zone"
                value={formState.primaryRegionId}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    primaryRegionId: event.target.value,
                    subregionId: "",
                  }))
                }
              >
                <option value="">Select zone</option>
                {primaryRegions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Subregion"
                value={formState.subregionId}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    subregionId: event.target.value,
                  }))
                }
                disabled={!formState.primaryRegionId || subregionsForCreate.length === 0}
              >
                <option value="">Select subregion (optional)</option>
                {subregionsForCreate.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </Select>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={closeModal} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Hospital"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-800/70 bg-slate-950/90 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.7)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Edit hospital
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-100">
                  {editingHospital.name}
                </h3>
                <p className="text-sm text-slate-400">
                  Update address, engineers, and devices.
                </p>
              </div>
              <Button variant="ghost" onClick={closeEditModal}>
                Close
              </Button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input
                label="Address"
                value={editFormState.address}
                onChange={(event) =>
                  setEditFormState((prev) => ({
                    ...prev,
                    address: event.target.value,
                  }))
                }
              />

              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 md:col-span-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Point of contact
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Add one or more contacts for this hospital.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() =>
                      setEditFormState((prev) => ({
                        ...prev,
                        poc: [...prev.poc, { name: "", phone: "" }],
                      }))
                    }
                  >
                    Add POC
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {editFormState.poc.map((entry, index) => (
                    <div
                      key={`edit-poc-${index}`}
                      className="grid gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 md:grid-cols-[1fr_1fr_auto]"
                    >
                      <Input
                        label="Name"
                        value={entry.name}
                        onChange={(event) => {
                          const value = event.target.value;
                          setEditFormState((prev) => ({
                            ...prev,
                            poc: prev.poc.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, name: value } : item
                            ),
                          }));
                        }}
                        placeholder="POC name"
                        required
                      />
                      <Input
                        label="Phone"
                        value={entry.phone}
                        onChange={(event) => {
                          const value = event.target.value;
                          setEditFormState((prev) => ({
                            ...prev,
                            poc: prev.poc.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, phone: value } : item
                            ),
                          }));
                        }}
                        placeholder="POC phone"
                        inputMode="tel"
                        required
                      />
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          className="border border-slate-800/70"
                          onClick={() =>
                            setEditFormState((prev) => ({
                              ...prev,
                              poc:
                                prev.poc.length > 1
                                  ? prev.poc.filter((_, itemIndex) => itemIndex !== index)
                                  : prev.poc,
                            }))
                          }
                          disabled={editFormState.poc.length <= 1}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 text-sm font-medium text-slate-300">
                <span>Pincode</span>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    className="flex-1"
                    value={editFormState.pincode}
                    onChange={(event) =>
                      setEditFormState((prev) => ({
                        ...prev,
                        pincode: event.target.value,
                      }))
                    }
                    placeholder="Enter pincode"
                    inputMode="numeric"
                  />
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      const trimmed = editFormState.pincode.trim();
                      if (trimmed.length < 6) {
                        setEditError("Enter a valid 6 digit pincode.");
                        return;
                      }
                      setEditError(null);
                      setIsEditLookup(true);
                      try {
                        const response = await fetch(
                          `https://api.postalpincode.in/pincode/${trimmed}`
                        );
                        const data = await response.json();
                        const office = data?.[0]?.PostOffice?.[0];
                        if (!office) {
                          setEditError("No location found for this pincode.");
                        } else {
                          setEditFormState((prev) => ({
                            ...prev,
                            city: office.District ?? prev.city,
                            state: office.State ?? prev.state,
                          }));
                        }
                      } catch (lookupError) {
                        setEditError(
                          lookupError instanceof Error
                            ? lookupError.message
                            : "Unable to fetch location."
                        );
                      } finally {
                        setIsEditLookup(false);
                      }
                    }}
                    disabled={isEditLookup}
                  >
                    {isEditLookup ? "Fetching..." : "Lookup"}
                  </Button>
                </div>
              </div>
              <Input
                label="City"
                value={editFormState.city}
                onChange={(event) =>
                  setEditFormState((prev) => ({
                    ...prev,
                    city: event.target.value,
                  }))
                }
              />
              <Input
                label="State"
                value={editFormState.state}
                onChange={(event) =>
                  setEditFormState((prev) => ({
                    ...prev,
                    state: event.target.value,
                  }))
                }
              />
              <Select
                label="Zone"
                value={editFormState.primaryRegionId}
                onChange={(event) =>
                  setEditFormState((prev) => ({
                    ...prev,
                    primaryRegionId: event.target.value,
                    subregionId: "",
                  }))
                }
              >
                <option value="">Select zone</option>
                {primaryRegions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Subregion"
                value={editFormState.subregionId}
                onChange={(event) =>
                  setEditFormState((prev) => ({
                    ...prev,
                    subregionId: event.target.value,
                  }))
                }
                disabled={!editFormState.primaryRegionId || subregionsForEdit.length === 0}
              >
                <option value="">Select subregion (optional)</option>
                {subregionsForEdit.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Engineers
                    </p>
                    <h4 className="text-lg font-semibold text-slate-100">
                      Assigned engineers
                    </h4>
                  </div>
                  <div className="text-xs text-slate-400">
                    {editEngineers.length} assigned
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Select
                    label="Assign engineer"
                    value={selectedEngineerId}
                    onChange={(event) => setSelectedEngineerId(event.target.value)}
                  >
                    <option value="">Select engineer</option>
                    {availableEngineers.map((engineer) => (
                      <option key={engineer.user_id} value={engineer.user_id}>
                        {engineer.full_name ?? engineer.user_id}
                      </option>
                    ))}
                  </Select>
                  <Button
                    variant="secondary"
                    onClick={assignEngineer}
                    disabled={!selectedEngineerId || isEditSaving}
                  >
                    Assign
                  </Button>
                </div>

                <div className="mt-4 space-y-2">
                  {editEngineers.length ? (
                    editEngineers.map((engineer) => (
                      <div
                        key={engineer.user_id}
                        className="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-950/70 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-100">
                            {engineer.full_name ?? "Unnamed engineer"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {engineer.phone ?? "No phone"}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => removeEngineer(engineer.user_id)}
                          disabled={isEditSaving}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-800/70 p-4 text-sm text-slate-400">
                      No engineers assigned yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Devices
                    </p>
                    <h4 className="text-lg font-semibold text-slate-100">
                      Assigned devices
                    </h4>
                  </div>
                  <div className="text-xs text-slate-400">
                    {editDevices.length} assigned
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <Select
                    label="Assign device"
                    value={selectedDeviceId}
                    onChange={(event) => setSelectedDeviceId(event.target.value)}
                  >
                    <option value="">Select device</option>
                    {availableDevices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.serial_number} · {device.model_name ?? "-"} ·
                        {` ${formatDeviceStatus(device.status)} · ${formatDevicePurpose(device.usage_type)}`}
                      </option>
                    ))}
                  </Select>
                  <Button
                    variant="secondary"
                    onClick={assignDevice}
                    disabled={!selectedDeviceId || isEditSaving}
                  >
                    Assign device
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {editDevices.length ? (
                    editDevices.map((device) => (
                      <div
                        key={device.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-950/70 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-100">
                            {device.serial_number}
                          </p>
                          <p className="text-xs text-slate-400">
                            {device.model_name ?? "-"} · {device.category_name ?? "-"}
                            {` · ${formatDeviceStatus(device.status)} · ${formatDevicePurpose(device.usage_type)}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => removeDevice(device.id)}
                          disabled={isEditSaving}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-800/70 p-4 text-sm text-slate-400">
                      No devices assigned yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {editError && (
              <div className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {editError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={closeEditModal} disabled={isEditSaving}>
                Cancel
              </Button>
              <Button onClick={saveHospitalDetails} disabled={isEditSaving}>
                {isEditSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
