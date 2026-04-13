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
  image_path?: string | null;
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

  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedSubregionId, setSelectedSubregionId] = useState<string | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"devices" | "team" | "pocs">("devices");

  const [newHospitalImage, setNewHospitalImage] = useState<File | null>(null);
  const [editHospitalImage, setEditHospitalImage] = useState<File | null>(null);

  const HOSPITAL_IMAGES_BUCKET = "hospital-images";

  const resolveImageSrc = (value: string | null | undefined) => {
    if (!value) return null;
    if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) return value;
    const normalizedPath = value.startsWith("/") ? value.slice(1) : value;
    const supabase = createSupabaseBrowserClient();
    const { data } = supabase.storage.from(HOSPITAL_IMAGES_BUCKET).getPublicUrl(normalizedPath);
    return data.publicUrl;
  };

  const chipClipPath = "polygon(0 8%, 4% 0, 96% 0, 100% 8%, 100% 92%, 96% 100%, 4% 100%, 0 92%)";

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

    let imagePath: string | null = null;
    if (newHospitalImage) {
      const ext = newHospitalImage.name.split(".").pop()?.toLowerCase() || "png";
      imagePath = `hospitals/${data.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(HOSPITAL_IMAGES_BUCKET)
        .upload(imagePath, newHospitalImage, { upsert: true });

      if (!uploadError) {
        await supabase.from("hospitals").update({ image_path: imagePath }).eq("id", data.id);
      }
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
      image_path: imagePath,
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

    let imagePath = editingHospital.image_path ?? null;

    if (editHospitalImage) {
      const ext = editHospitalImage.name.split(".").pop()?.toLowerCase() || "png";
      imagePath = `hospitals/${editingHospital.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(HOSPITAL_IMAGES_BUCKET)
        .upload(imagePath, editHospitalImage, { upsert: true });

      if (uploadError) {
        setEditError(uploadError.message);
        setIsEditSaving(false);
        return;
      }
    }

    const { error: updateError } = await supabase
      .from("hospitals")
      .update({
        address: addressWithPincode || null,
        city: editFormState.city.trim() || null,
        state: editFormState.state.trim() || null,
        zone: regionById[editFormState.primaryRegionId]?.name ?? null,
        region_id: editFormState.subregionId || editFormState.primaryRegionId,
        poc: normalizedPoc,
        image_path: imagePath,
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

  // Hierarchical Data Computing
  const selectedRegion = useMemo(() => regions.find(r => r.id === selectedRegionId), [regions, selectedRegionId]);
  const selectedSubregion = useMemo(() => regions.find(r => r.id === selectedSubregionId), [regions, selectedSubregionId]);
  const selectedHospital = useMemo(() => currentHospitals.find(h => h.id === selectedHospitalId), [currentHospitals, selectedHospitalId]);

  const regionStats = useMemo(() => {
    return primaryRegions.map(region => {
      const hCount = currentHospitals.filter(h => h.zone === region.name).length;
      return { ...region, hospitalCount: hCount };
    });
  }, [primaryRegions, currentHospitals]);

  const subregionStats = useMemo(() => {
    if (!selectedRegionId) return [];
    const subs = subregionsByPrimaryId[selectedRegionId] ?? [];
    return subs.map(sub => {
      const hCount = currentHospitals.filter(h => h.region_id === sub.id).length;
      return { ...sub, hospitalCount: hCount };
    });
  }, [selectedRegionId, subregionsByPrimaryId, currentHospitals]);

  const hospitalsInSubregion = useMemo(() => {
    if (!selectedSubregionId && !selectedRegionId) return [];
    // If a subregion is selected, show hospitals in that subregion
    if (selectedSubregionId) {
      return currentHospitals.filter(h => h.region_id === selectedSubregionId);
    }
    // If only a primary region is selected and we want to show hospitals directly (e.g., if there are no subregions)
    if (selectedRegionId) {
      return currentHospitals.filter(h => h.zone === selectedRegion?.name);
    }
    return [];
  }, [selectedSubregionId, selectedRegionId, selectedRegion, currentHospitals]);

  const hospitalsDirectlyInRegion = useMemo(() => {
    if (!selectedRegionId) return [];
    const subs = subregionsByPrimaryId[selectedRegionId] ?? [];
    const subIds = new Set(subs.map((s) => s.id));
    return currentHospitals.filter(
      (h) =>
        h.zone === selectedRegion?.name &&
        (!h.region_id || !subIds.has(h.region_id))
    );
  }, [selectedRegionId, selectedRegion, subregionsByPrimaryId, currentHospitals]);

  return (
    <div className="space-y-6">
      {/* Top search & add bar */}
      {!selectedHospitalId && (
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
      )}

      {/* Drilldown Views */}
      {!selectedRegionId ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">Regions</h3>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Select a region</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {regionStats.map((region) => (
              <button
                key={region.id}
                type="button"
                onClick={() => {
                  setSelectedRegionId(region.id);
                  setSelectedSubregionId(null);
                  setSelectedHospitalId(null);
                }}
                className="group relative overflow-hidden border border-slate-800/80 bg-slate-950/70 text-left shadow-[0_24px_60px_rgba(2,6,23,0.6)] transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/60 flex flex-col min-h-[160px] p-6"
                style={{ clipPath: chipClipPath }}
              >
                <div className="absolute inset-0 bg-linear-to-br from-teal-500/10 via-transparent to-indigo-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="flex-1 flex flex-col justify-between relative z-10">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-1">Region</p>
                    <p className="text-2xl font-semibold text-slate-100">{region.name}</p>
                  </div>
                  <div className="mt-4 flex flex-col">
                    <span className="text-sm text-slate-400">Hospitals</span>
                    <span className="text-lg font-medium text-teal-400">{region.hospitalCount}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : !selectedSubregionId ? (
        <section className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Region</p>
              <h3 className="text-2xl font-semibold text-slate-100">{selectedRegion?.name}</h3>
            </div>
            <Button variant="ghost" onClick={() => setSelectedRegionId(null)}>Back to regions</Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between mt-6">
              <h3 className="text-lg font-semibold text-slate-100">Subregions</h3>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Select a subregion</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {subregionStats.map((subregion) => (
                <button
                  key={subregion.id}
                  type="button"
                  onClick={() => {
                    setSelectedSubregionId(subregion.id);
                    setSelectedHospitalId(null);
                  }}
                  className="group relative overflow-hidden border border-slate-800/80 bg-slate-950/70 text-left shadow-[0_24px_60px_rgba(2,6,23,0.6)] transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/60 flex flex-col min-h-[160px] p-6"
                  style={{ clipPath: chipClipPath }}
                >
                  <div className="absolute inset-0 bg-linear-to-br from-teal-500/10 via-transparent to-indigo-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="flex-1 flex flex-col justify-between relative z-10">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-1">Subregion</p>
                      <p className="text-xl font-semibold text-slate-100">{subregion.name}</p>
                    </div>
                    <div className="mt-4 flex flex-col">
                      <span className="text-sm text-slate-400">Hospitals</span>
                      <span className="text-lg font-medium text-teal-400">{subregion.hospitalCount}</span>
                    </div>
                  </div>
                </button>
              ))}
              {subregionStats.length === 0 && (
                <div className="col-span-full rounded-3xl border border-dashed border-slate-800/70 bg-slate-950/60 p-6 text-sm text-slate-400">
                  No subregions configured for this region.
                </div>
              )}
            </div>
          </div>

          {hospitalsDirectlyInRegion.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-800/70">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-100">Direct Hospitals</h3>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{hospitalsDirectlyInRegion.length} sites</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {hospitalsDirectlyInRegion.map((hospital) => (
                  <button
                    key={hospital.id}
                    type="button"
                    onClick={() => setSelectedHospitalId(hospital.id)}
                    className="group relative overflow-hidden border border-slate-800/80 bg-slate-950/70 text-left shadow-[0_24px_60px_rgba(2,6,23,0.6)] transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/60 flex flex-col"
                    style={{ clipPath: chipClipPath }}
                  >
                    <div className="absolute inset-0 bg-linear-to-br from-teal-500/10 via-transparent to-indigo-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    {resolveImageSrc(hospital.image_path) ? (
                      <img
                        src={resolveImageSrc(hospital.image_path) ?? ""}
                        alt={hospital.name}
                        className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-32 w-full items-center justify-center bg-slate-900/60 text-sm text-slate-400">
                        No hospital image
                      </div>
                    )}
                    <div className="flex-1 border-t border-slate-800/70 bg-slate-950/80 px-5 py-4 flex flex-col justify-between gap-3 relative z-10">
                      <div>
                        <p className="text-lg font-semibold text-slate-100 line-clamp-1">{hospital.name}</p>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-1">{hospital.city || hospital.address || "No address"}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
                        <div className="flex flex-col">
                          <span className="text-slate-500">Devices</span>
                          <span className="text-teal-400">{hospital.devices_deployed}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-500">Engineers</span>
                          <span>{hospital.engineers_assigned}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : !selectedHospitalId ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Subregion</p>
              <h3 className="text-2xl font-semibold text-slate-100">{selectedSubregion?.name}</h3>
            </div>
            <Button variant="ghost" onClick={() => setSelectedSubregionId(null)}>Back to subregions</Button>
          </div>
          <div className="flex items-center justify-between mt-6">
            <h3 className="text-lg font-semibold text-slate-100">Hospitals</h3>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{hospitalsInSubregion.length} sites</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {hospitalsInSubregion.map((hospital) => (
              <button
                key={hospital.id}
                type="button"
                onClick={() => setSelectedHospitalId(hospital.id)}
                className="group relative overflow-hidden border border-slate-800/80 bg-slate-950/70 text-left shadow-[0_24px_60px_rgba(2,6,23,0.6)] transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/60 flex flex-col"
                style={{ clipPath: chipClipPath }}
              >
                <div className="absolute inset-0 bg-linear-to-br from-teal-500/10 via-transparent to-indigo-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {resolveImageSrc(hospital.image_path) ? (
                  <img
                    src={resolveImageSrc(hospital.image_path) ?? ""}
                    alt={hospital.name}
                    className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center bg-slate-900/60 text-sm text-slate-400">
                    No hospital image
                  </div>
                )}
                <div className="flex-1 border-t border-slate-800/70 bg-slate-950/80 px-5 py-4 flex flex-col justify-between gap-3 relative z-10">
                  <div>
                    <p className="text-lg font-semibold text-slate-100 line-clamp-1">{hospital.name}</p>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-1">{hospital.city || hospital.address || "No address"}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
                    <div className="flex flex-col">
                      <span className="text-slate-500">Devices</span>
                      <span className="text-teal-400">{hospital.devices_deployed}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500">Engineers</span>
                      <span>{hospital.engineers_assigned}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {hospitalsInSubregion.length === 0 && (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-800/70 bg-slate-950/60 p-6 text-sm text-slate-400">
                No hospitals found in this subregion.
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          {selectedHospital && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-4">
                  {resolveImageSrc(selectedHospital.image_path) && (
                    <img
                      src={resolveImageSrc(selectedHospital.image_path) ?? ""}
                      alt={selectedHospital.name}
                      className="h-16 w-16 rounded-full object-cover shadow-lg border border-slate-700/50"
                    />
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Hospital</p>
                    <h3 className="text-3xl font-semibold text-slate-100">{selectedHospital.name}</h3>
                    <p className="text-sm text-slate-400 mt-1">{selectedHospital.address} {selectedHospital.city ? `, ${selectedHospital.city}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="secondary" onClick={() => openEditModal(selectedHospital)}>Edit Hospital</Button>
                  <Button variant="ghost" onClick={() => setSelectedHospitalId(null)}>Back to hospitals</Button>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800/70 bg-slate-950/60 p-6 shadow-[0_20px_50px_rgba(2,6,23,0.45)]">
                <div className="flex space-x-6 border-b border-slate-800/70 mb-6">
                  <button
                    onClick={() => setActiveTab("devices")}
                    className={`pb-3 text-sm font-medium transition-colors ${activeTab === "devices" ? "border-b-2 border-teal-400 text-teal-400" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Devices ({selectedHospital.devices.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("team")}
                    className={`pb-3 text-sm font-medium transition-colors ${activeTab === "team" ? "border-b-2 border-teal-400 text-teal-400" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Engineers / Sales ({selectedHospital.engineers.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("pocs")}
                    className={`pb-3 text-sm font-medium transition-colors ${activeTab === "pocs" ? "border-b-2 border-teal-400 text-teal-400" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Point of Contacts ({(selectedHospital.poc ?? []).length})
                  </button>
                </div>

                {activeTab === "devices" && (
                  <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/70">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-800/80 bg-slate-900/50">
                          <th className="h-12 px-6 font-semibold uppercase tracking-wider text-slate-400">Model</th>
                          <th className="h-12 px-6 font-semibold uppercase tracking-wider text-slate-400">Category</th>
                          <th className="h-12 px-6 font-semibold uppercase tracking-wider text-slate-400">Serial Number</th>
                          <th className="h-12 px-6 font-semibold uppercase tracking-wider text-slate-400">Usage</th>
                          <th className="h-12 px-6 font-semibold uppercase tracking-wider text-slate-400">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedHospital.devices.map((device) => (
                          <tr key={device.id} className="border-b border-slate-800/50 transition-colors hover:bg-slate-800/30">
                            <td className="px-6 py-4 font-medium text-slate-200">{device.model_name ?? "N/A"}</td>
                            <td className="px-6 py-4 text-slate-300">{device.category_name ?? "N/A"}</td>
                            <td className="px-6 py-4 text-slate-300">{device.serial_number}</td>
                            <td className="px-6 py-4 text-slate-300">{formatDevicePurpose(device.usage_type)}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                device.status === "DEPLOYED" ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-slate-800 text-slate-300"
                              }`}>
                                {formatDeviceStatus(device.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {selectedHospital.devices.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                              No devices deployed here.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === "team" && (
                  <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/70">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-800/80 bg-slate-900/50">
                          <th className="h-12 px-6 font-semibold uppercase tracking-wider text-slate-400">Name</th>
                          <th className="h-12 px-6 font-semibold uppercase tracking-wider text-slate-400">Phone</th>
                          <th className="h-12 px-6 font-semibold uppercase tracking-wider text-slate-400">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedHospital.engineers.map((engineer) => (
                          <tr key={engineer.user_id} className="border-b border-slate-800/50 transition-colors hover:bg-slate-800/30">
                            <td className="px-6 py-4 font-medium text-slate-200">{engineer.full_name ?? "Unnamed"}</td>
                            <td className="px-6 py-4 text-slate-300">{engineer.phone ?? "N/A"}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                engineer.is_active ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}>
                                {engineer.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {selectedHospital.engineers.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                              No team members assigned here.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === "pocs" && (
                  <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/70">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-800/80 bg-slate-900/50">
                          <th className="h-12 px-6 font-semibold uppercase tracking-wider text-slate-400">Name</th>
                          <th className="h-12 px-6 font-semibold uppercase tracking-wider text-slate-400">Phone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedHospital.poc ?? []).map((poc, idx) => (
                          <tr key={idx} className="border-b border-slate-800/50 transition-colors hover:bg-slate-800/30">
                            <td className="px-6 py-4 font-medium text-slate-200">{poc.name}</td>
                            <td className="px-6 py-4 text-slate-300">{poc.phone}</td>
                          </tr>
                        ))}
                        {(selectedHospital.poc ?? []).length === 0 && (
                          <tr>
                            <td colSpan={2} className="px-6 py-12 text-center text-slate-400">
                              No Points of Contact defined.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      )}

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
                
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Hospital Photo
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="hospitalImage"
                    accept="image/*"
                    onChange={(e) => setNewHospitalImage(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => document.getElementById("hospitalImage")?.click()}
                    className="w-full justify-start text-left font-normal h-10 border border-slate-700/50 bg-slate-900/50"
                  >
                    <span className="truncate text-slate-300">
                      {newHospitalImage ? newHospitalImage.name : "Upload image (optional)"}
                    </span>
                  </Button>
                </div>
              </div>

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
                
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Hospital Photo
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="editHospitalImage"
                    accept="image/*"
                    onChange={(e) => setEditHospitalImage(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => document.getElementById("editHospitalImage")?.click()}
                    className="w-full justify-start text-left font-normal h-10 border border-slate-700/50 bg-slate-900/50"
                  >
                    <span className="truncate text-slate-300">
                      {editHospitalImage ? editHospitalImage.name : editingHospital.image_path ? "Replace existing image" : "Upload image (optional)"}
                    </span>
                  </Button>
                </div>
              </div>

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
