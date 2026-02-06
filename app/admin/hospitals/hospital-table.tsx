"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deviceStatusTone } from "@/lib/utils/status";

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
  devices_deployed: number | null;
  engineers_assigned: number | null;
  poc?: PocEntry[];
  devices: DeviceDetail[];
  engineers: EngineerDetail[];
};

type TabKey = "devices" | "engineers" | "poc";

type HospitalTableProps = {
  hospitals: HospitalDetail[];
  onEdit?: (hospital: HospitalDetail) => void;
};

const formatLabel = (value: string) => value.replaceAll("_", " ");

export default function HospitalTable({ hospitals, onEdit }: HospitalTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("devices");

  const selectedHospital = useMemo(
    () => hospitals.find((hospital) => hospital.id === selectedId) ?? null,
    [hospitals, selectedId]
  );

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <tr>
            <TableHead>Hospital</TableHead>
            <TableHead>Zone</TableHead>
            <TableHead>Subregion</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Devices</TableHead>
            <TableHead>Engineers</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {hospitals.map((hospital) => (
            <TableRow key={hospital.id}>
              <TableCell className="font-medium text-slate-100">
                {hospital.name}
              </TableCell>
              <TableCell>{hospital.zone ?? "-"}</TableCell>
              <TableCell>{hospital.subregion ?? "-"}</TableCell>
              <TableCell>
                <div className="text-sm text-slate-300">
                  {hospital.address ?? "-"}
                </div>
                <div className="text-xs text-slate-400">
                  {hospital.city ?? "-"}
                </div>
              </TableCell>
              <TableCell>{hospital.devices_deployed ?? 0}</TableCell>
              <TableCell>{hospital.engineers_assigned ?? 0}</TableCell>
              <TableCell>
                <Badge tone="success">Active</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedId(hospital.id);
                      setActiveTab("devices");
                    }}
                    className="px-3"
                  >
                    <span className="sr-only">View details</span>
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5 stroke-slate-300"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </Button>
                  {onEdit ? (
                    <Button
                      variant="ghost"
                      onClick={() => onEdit(hospital)}
                      className="px-3"
                    >
                      <span className="sr-only">Edit hospital</span>
                      <svg
                        aria-hidden
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-5 w-5 stroke-slate-300"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 20h4l10-10-4-4L4 16v4z" />
                        <path d="M14 6l4 4" />
                      </svg>
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedHospital ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-800/70 bg-slate-950/80 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.7)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-100">
                  {selectedHospital.name}
                </h3>
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-slate-400">
                    {selectedHospital.address ?? "-"}
                  </p>
                  <p className="text-sm text-slate-400">
                    {selectedHospital.subregion ?? "-"}
                  </p>
                  <p className="text-sm text-slate-400">
                    {selectedHospital.zone ?? "-"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" onClick={() => setSelectedId(null)} className="px-3">
                Close
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant={activeTab === "devices" ? "primary" : "secondary"}
                onClick={() => setActiveTab("devices")}
              >
                Devices
              </Button>
              <Button
                variant={activeTab === "engineers" ? "primary" : "secondary"}
                onClick={() => setActiveTab("engineers")}
              >
                Engineers + Devices
              </Button>
              <Button
                variant={activeTab === "poc" ? "primary" : "secondary"}
                onClick={() => setActiveTab("poc")}
              >
                POC
              </Button>
            </div>

            {activeTab === "devices" ? (
              <div className="mt-6 space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Devices at this hospital
                </h4>
                {selectedHospital.devices.length ? (
                  <Table>
                    <TableHeader>
                      <tr>
                        <TableHead>Serial</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Ownership</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Status</TableHead>
                      </tr>
                    </TableHeader>
                    <TableBody>
                      {selectedHospital.devices.map((device) => (
                        <TableRow key={device.id}>
                          <TableCell className="font-medium text-slate-100">
                            {device.serial_number}
                          </TableCell>
                          <TableCell>{device.model_name ?? "-"}</TableCell>
                          <TableCell>{device.category_name ?? "-"}</TableCell>
                          <TableCell>{formatLabel(device.ownership_type)}</TableCell>
                          <TableCell>{formatLabel(device.usage_type)}</TableCell>
                          <TableCell>
                            <Badge tone={deviceStatusTone(device.status)}>
                              {formatLabel(device.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">
                    No devices assigned to this hospital yet.
                  </p>
                )}
              </div>
            ) : activeTab === "engineers" ? (
              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Engineers assigned
                </h4>
                {selectedHospital.engineers.length ? (
                  <Table>
                    <TableHeader>
                      <tr>
                        <TableHead>Engineer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Devices responsible</TableHead>
                      </tr>
                    </TableHeader>
                    <TableBody>
                      {selectedHospital.engineers.map((engineer) => (
                        <TableRow key={engineer.user_id}>
                          <TableCell className="font-medium text-slate-100">
                            {engineer.full_name ?? "Unnamed engineer"}
                          </TableCell>
                          <TableCell>{engineer.phone ?? "-"}</TableCell>
                          <TableCell>
                            {selectedHospital.devices.length ? (
                              <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                                {selectedHospital.devices.map((device) => (
                                  <span
                                    key={`${engineer.user_id}-${device.id}`}
                                    className="rounded-full border border-slate-700/80 bg-slate-950/70 px-2.5 py-1"
                                  >
                                    {device.serial_number} · {device.model_name ?? "-"}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">No devices yet.</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">
                    No engineers assigned yet.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Point of contact
                </h4>

                {(selectedHospital.poc ?? []).length ? (
                  <div className="space-y-2">
                    {(selectedHospital.poc ?? []).map((entry, index) => (
                      <div
                        key={`${selectedHospital.id}-poc-${index}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/70 px-4 py-3"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-100">
                            {entry.name}
                          </div>
                          <div className="text-sm text-slate-400">{entry.phone}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">
                    No POC added for this hospital.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
