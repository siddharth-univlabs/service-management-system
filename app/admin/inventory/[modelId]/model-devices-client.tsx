"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { demoStatusTone, deviceStatusTone } from "@/lib/utils/status";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function PencilIcon({ className }: { className?: string }) {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
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
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

type DeviceRow = {
  id: string;
  serial_number: string;
  barcode: string | null;
  ownership_type: string;
  usage_type: string;
  status: string;
  current_location_type: string;
  current_hospital_id?: string | null;
  current_warehouse_id?: string | null;
  current_hospital?: { name: string | null } | null;
  current_warehouse?: { name: string | null } | null;
  demo_status: string | null;
};

type WarehouseRow = {
  id: string;
  name: string;
};

type InventoryModelDevicesClientProps = {
  modelId: string;
  modelName: string;
  devices: DeviceRow[];
  warehouses: WarehouseRow[];
};

export default function InventoryModelDevicesClient({
  modelId,
  modelName,
  devices,
  warehouses,
}: InventoryModelDevicesClientProps) {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmValue, setDeleteConfirmValue] = useState("");

  const defaultWarehouseId = warehouses[0]?.id ?? "";

  const [formState, setFormState] = useState({
    serial_number: "",
    barcode: "",
    usage_type: "DEMO",
    ownership_type: "COMPANY",
    status: "IN_INVENTORY",
    demo_status: "AVAILABLE",
    warehouse_id: defaultWarehouseId,
  });

  const [editFormState, setEditFormState] = useState({
    serial_number: "",
    barcode: "",
    usage_type: "DEMO",
    ownership_type: "COMPANY",
    status: "IN_INVENTORY",
    demo_status: "AVAILABLE",
    warehouse_id: defaultWarehouseId,
  });

  const sortedDevices = useMemo(() => {
    return [...devices].sort((a, b) => a.serial_number.localeCompare(b.serial_number));
  }, [devices]);

  const openAdd = () => {
    setError(null);
    setFormState((prev) => ({
      ...prev,
      serial_number: "",
      barcode: "",
      usage_type: "DEMO",
      ownership_type: "COMPANY",
      status: "IN_INVENTORY",
      demo_status: "AVAILABLE",
      warehouse_id: defaultWarehouseId,
    }));
    setIsAddOpen(true);
  };

  const closeAdd = () => {
    if (isSaving) return;
    setIsAddOpen(false);
  };

  const openEdit = (device: DeviceRow) => {
    setError(null);
    setEditingDevice(device);
    setIsDeleteOpen(false);
    setDeleteConfirmValue("");
    setEditFormState({
      serial_number: device.serial_number,
      barcode: device.barcode ?? "",
      usage_type: device.usage_type,
      ownership_type: device.ownership_type,
      status: device.status,
      demo_status: device.demo_status ?? "",
      warehouse_id:
        device.current_location_type === "WAREHOUSE"
          ? device.current_warehouse_id ?? defaultWarehouseId
          : defaultWarehouseId,
    });

    setIsEditOpen(true);
  };

  const closeEdit = () => {
    if (isSaving || isDeleting) return;
    setIsEditOpen(false);
    setEditingDevice(null);
  };

  const handleAddDevice = async () => {
    const serial = formState.serial_number.trim();
    const barcode = formState.barcode.trim();

    if (!serial) {
      setError("Serial number is required.");
      return;
    }

    if (!barcode) {
      setError("Barcode is required.");
      return;
    }

    if (!formState.warehouse_id) {
      setError("Warehouse is required.");
      return;
    }

    if (formState.usage_type === "DEMO" && !formState.demo_status) {
      setError("Demo status is required for DEMO devices.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const payload: any = {
      serial_number: serial,
      barcode,
      device_model_id: modelId,
      ownership_type: formState.ownership_type,
      usage_type: formState.usage_type,
      status: formState.status,
      current_location_type: "WAREHOUSE",
      current_hospital_id: null,
      current_warehouse_id: formState.warehouse_id,
      demo_status: formState.usage_type === "DEMO" ? formState.demo_status : null,
    };

    const { error: insertError } = await supabase.from("devices").insert(payload);

    if (insertError) {
      setError(insertError.message);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setIsAddOpen(false);
    router.refresh();
  };

  const handleUpdateDevice = async () => {
    if (!editingDevice) return;

    const serial = editFormState.serial_number.trim();
    const barcode = editFormState.barcode.trim();

    if (!serial) {
      setError("Serial number is required.");
      return;
    }

    if (!barcode) {
      setError("Barcode is required.");
      return;
    }

    if (!editFormState.warehouse_id) {
      setError("Warehouse is required.");
      return;
    }

    if (editFormState.usage_type === "DEMO" && !editFormState.demo_status) {
      setError("Demo status is required for DEMO devices.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase
      .from("devices")
      .update({
        serial_number: serial,
        barcode,
        ownership_type: editFormState.ownership_type,
        usage_type: editFormState.usage_type,
        status: editFormState.status,
        current_location_type: "WAREHOUSE",
        current_hospital_id: null,
        current_warehouse_id: editFormState.warehouse_id,
        demo_status: editFormState.usage_type === "DEMO" ? editFormState.demo_status : null,
      })
      .eq("id", editingDevice.id);

    if (updateError) {
      setError(updateError.message);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setIsEditOpen(false);
    setEditingDevice(null);
    router.refresh();
  };

  const handleDeleteDevice = async () => {
    if (!editingDevice) return;

    setIsDeleting(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: deleteError } = await supabase
      .from("devices")
      .delete()
      .eq("id", editingDevice.id);

    if (deleteError) {
      setError(deleteError.message);
      setIsDeleting(false);
      return;
    }

    setIsDeleting(false);
    setIsEditOpen(false);
    setEditingDevice(null);
    router.refresh();
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Serialized devices
          </p>
          <h4 className="mt-1 text-lg font-semibold text-slate-100">{modelName}</h4>
        </div>
        <Button onClick={openAdd}>Add device</Button>
      </div>

      <Table>
        <TableHeader>
          <tr>
            <TableHead>Serial</TableHead>
            <TableHead>Barcode</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead>Ownership</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Demo Status</TableHead>
            <TableHead>Edit</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {sortedDevices.map((device) => (
            <TableRow key={device.id}>
              <TableCell className="font-medium text-slate-100">{device.serial_number}</TableCell>
              <TableCell>{device.barcode ?? "-"}</TableCell>
              <TableCell>
                <Badge tone={deviceStatusTone(device.status)}>{device.status}</Badge>
              </TableCell>
              <TableCell>{device.usage_type}</TableCell>
              <TableCell>{device.ownership_type}</TableCell>
              <TableCell>
                {device.current_location_type === "HOSPITAL"
                  ? device.current_hospital?.name ?? "Hospital"
                  : device.current_warehouse?.name ?? "Warehouse"}
              </TableCell>
              <TableCell>
                {device.demo_status ? (
                  <Badge tone={demoStatusTone(device.demo_status)}>{device.demo_status}</Badge>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell className="text-right">
                <button
                  type="button"
                  onClick={() => openEdit(device)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-800/70 bg-slate-950/70 text-sm text-slate-300 transition hover:border-teal-400/70 hover:text-teal-300"
                  aria-label={`Edit ${device.serial_number}`}
                  title="Edit device"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
          {!sortedDevices.length ? (
            <TableRow>
              <TableCell colSpan={8} className="text-slate-400">
                No devices for this model yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>

      {isAddOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="w-full max-w-xl rounded-3xl border border-slate-800/70 bg-slate-950/90 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.7)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Add device
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-100">Add device</h3>
                <p className="text-sm text-slate-400">Model: {modelName}</p>
              </div>
              <Button variant="ghost" onClick={closeAdd} disabled={isSaving}>
                Close
              </Button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input
                label="Serial number"
                value={formState.serial_number}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, serial_number: event.target.value }))
                }
                required
              />
              <Input
                label="Barcode"
                value={formState.barcode}
                onChange={(event) => setFormState((prev) => ({ ...prev, barcode: event.target.value }))}
                required
              />

              <Select
                label="Usage type"
                value={formState.usage_type}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    usage_type: event.target.value,
                    demo_status: event.target.value === "DEMO" ? prev.demo_status : "",
                  }))
                }
              >
                <option value="DEMO">DEMO</option>
                <option value="SOLD">SOLD</option>
              </Select>

              <Select
                label="Ownership"
                value={formState.ownership_type}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, ownership_type: event.target.value }))
                }
              >
                <option value="COMPANY">COMPANY</option>
                <option value="CUSTOMER">CUSTOMER</option>
              </Select>

              <Select
                label="Status"
                value={formState.status}
                onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value }))}
                className="md:col-span-2"
              >
                <option value="IN_INVENTORY">IN_INVENTORY</option>
                <option value="DEPLOYED">DEPLOYED</option>
                <option value="UNDER_SERVICE">UNDER_SERVICE</option>
                <option value="REPAIR">REPAIR</option>
                <option value="SCRAPPED">SCRAPPED</option>
              </Select>

              <Select
                label="Warehouse"
                value={formState.warehouse_id}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, warehouse_id: event.target.value }))
                }
                className="md:col-span-2"
              >
                <option value="" disabled>
                  Select warehouse
                </option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </Select>

              {formState.usage_type === "DEMO" ? (
                <Select
                  label="Demo status"
                  value={formState.demo_status}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, demo_status: event.target.value }))
                  }
                  className="md:col-span-2"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="IN_USE">IN_USE</option>
                  <option value="RETURNED">RETURNED</option>
                </Select>
              ) : null}
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={closeAdd} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleAddDevice} disabled={isSaving}>
                {isSaving ? "Saving..." : "Add device"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isEditOpen && editingDevice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="w-full max-w-xl rounded-3xl border border-slate-800/70 bg-slate-950/90 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.7)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Edit device
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-100">{editingDevice.serial_number}</h3>
                <p className="text-sm text-slate-400">Model: {modelName}</p>
              </div>
              <Button variant="ghost" onClick={closeEdit} disabled={isSaving || isDeleting}>
                Close
              </Button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input
                label="Serial number"
                value={editFormState.serial_number}
                onChange={(event) =>
                  setEditFormState((prev) => ({ ...prev, serial_number: event.target.value }))
                }
                required
              />
              <Input
                label="Barcode"
                value={editFormState.barcode}
                onChange={(event) =>
                  setEditFormState((prev) => ({ ...prev, barcode: event.target.value }))
                }
                required
              />

              <Select
                label="Usage type"
                value={editFormState.usage_type}
                onChange={(event) =>
                  setEditFormState((prev) => ({
                    ...prev,
                    usage_type: event.target.value,
                    demo_status: event.target.value === "DEMO" ? prev.demo_status : "",
                  }))
                }
              >
                <option value="DEMO">DEMO</option>
                <option value="SOLD">SOLD</option>
              </Select>

              <Select
                label="Ownership"
                value={editFormState.ownership_type}
                onChange={(event) =>
                  setEditFormState((prev) => ({ ...prev, ownership_type: event.target.value }))
                }
              >
                <option value="COMPANY">COMPANY</option>
                <option value="CUSTOMER">CUSTOMER</option>
              </Select>

              <Select
                label="Status"
                value={editFormState.status}
                onChange={(event) =>
                  setEditFormState((prev) => ({ ...prev, status: event.target.value }))
                }
                className="md:col-span-2"
              >
                <option value="IN_INVENTORY">IN_INVENTORY</option>
                <option value="DEPLOYED">DEPLOYED</option>
                <option value="UNDER_SERVICE">UNDER_SERVICE</option>
                <option value="REPAIR">REPAIR</option>
                <option value="SCRAPPED">SCRAPPED</option>
              </Select>

              <Select
                label="Warehouse"
                value={editFormState.warehouse_id}
                onChange={(event) =>
                  setEditFormState((prev) => ({ ...prev, warehouse_id: event.target.value }))
                }
                className="md:col-span-2"
              >
                <option value="" disabled>
                  Select warehouse
                </option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </Select>

              {editFormState.usage_type === "DEMO" ? (
                <Select
                  label="Demo status"
                  value={editFormState.demo_status}
                  onChange={(event) =>
                    setEditFormState((prev) => ({ ...prev, demo_status: event.target.value }))
                  }
                  className="md:col-span-2"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="IN_USE">IN_USE</option>
                  <option value="RETURNED">RETURNED</option>
                </Select>
              ) : null}
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsDeleteOpen(true);
                  setDeleteConfirmValue("");
                }}
                className="border border-rose-500/40 bg-rose-500/10 text-rose-200 hover:border-rose-500/70"
                disabled={isSaving || isDeleting}
              >
                <span className="inline-flex items-center gap-2">
                  <TrashIcon className="h-4 w-4" />
                  Delete device
                </span>
              </Button>

              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={closeEdit} disabled={isSaving || isDeleting}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateDevice} disabled={isSaving || isDeleting}>
                  {isSaving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>

            {isDeleteOpen ? (
              <div className="mt-6 rounded-3xl border border-rose-500/40 bg-rose-500/10 p-5">
                <p className="text-sm font-semibold text-rose-200">Confirm deletion</p>
                <p className="mt-1 text-sm text-rose-200/80">
                  Type <span className="font-semibold text-rose-100">{editingDevice.serial_number}</span> to confirm.
                </p>
                <div className="mt-4">
                  <Input
                    label="Confirm serial number"
                    value={deleteConfirmValue}
                    onChange={(event) => setDeleteConfirmValue(event.target.value)}
                    placeholder={editingDevice.serial_number}
                  />
                </div>
                <div className="mt-4 flex items-center justify-end gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (isDeleting) return;
                      setIsDeleteOpen(false);
                      setDeleteConfirmValue("");
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteDevice}
                    disabled={
                      isDeleting ||
                      deleteConfirmValue.trim() !== editingDevice.serial_number
                    }
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
