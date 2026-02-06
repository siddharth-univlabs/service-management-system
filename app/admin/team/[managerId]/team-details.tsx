"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deviceStatusTone } from "@/lib/utils/status";
import { deactivateProfile } from "../actions";

type Device = {
  id: string;
  serial_number: string;
  status: string;
  usage_type: string;
  device_model?: { model_name: string | null } | null;
};

type Hospital = {
  id: string;
  name: string;
  city: string | null;
  zone: string | null;
  devices: Device[];
};

type EngineerDetail = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
  hospitalCount: number;
  hospitals: Hospital[];
};

type TeamDetailsProps = {
  engineers: EngineerDetail[];
};

type TabKey = "hospitals";

export default function TeamDetails({ engineers }: TeamDetailsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("hospitals");

  const selectedEngineer = useMemo(
    () => engineers.find((engineer) => engineer.user_id === selectedId) ?? null,
    [engineers, selectedId]
  );

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <tr>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Hospitals Assigned</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {engineers.map((engineer) => (
            <TableRow key={engineer.user_id}>
              <TableCell className="font-medium text-slate-100">
                {engineer.full_name ?? "Unnamed engineer"}
              </TableCell>
              <TableCell>{engineer.phone ?? "-"}</TableCell>
              <TableCell>{engineer.hospitalCount}</TableCell>
              <TableCell>
                <Badge tone={engineer.is_active ? "success" : "warning"}>
                  {engineer.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedId(engineer.user_id);
                    setActiveTab("hospitals");
                  }}
                >
                  More details
                </Button>
                <form action={deactivateProfile}>
                  <input type="hidden" name="userId" value={engineer.user_id} />
                  <Button variant="ghost" type="submit">
                    Remove
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedEngineer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-800/70 bg-slate-950/80 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.7)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-100">
                  {selectedEngineer.full_name ?? "Engineer details"}
                </h3>
                <p className="text-sm text-slate-400">
                  {selectedEngineer.phone ?? "No phone on record"}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedId(null)}
                className="px-3"
              >
                Close
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant={activeTab === "hospitals" ? "primary" : "secondary"}
                onClick={() => setActiveTab("hospitals")}
              >
                Hospitals + Devices
              </Button>
            </div>

            {activeTab === "hospitals" ? (
              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Assigned Hospitals
                </h4>
                {selectedEngineer.hospitals.length ? (
                  selectedEngineer.hospitals.map((hospital) => (
                    <div
                      key={hospital.id}
                      className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-slate-100">
                            {hospital.name}
                          </p>
                          <p className="text-sm text-slate-400">
                            {hospital.city ?? ""} {hospital.zone ? `· ${hospital.zone}` : ""}
                          </p>
                        </div>
                        <Badge tone="info">{hospital.devices.length} devices</Badge>
                      </div>
                      <div className="mt-4">
                        <Table>
                          <TableHeader>
                            <tr>
                              <TableHead>Serial</TableHead>
                              <TableHead>Model</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Usage</TableHead>
                            </tr>
                          </TableHeader>
                          <TableBody>
                            {hospital.devices.map((device) => (
                              <TableRow key={device.id}>
                                <TableCell className="font-medium text-slate-100">
                                  {device.serial_number}
                                </TableCell>
                                <TableCell>
                                  {device.device_model?.model_name ?? "-"}
                                </TableCell>
                                <TableCell>
                                  <Badge tone={deviceStatusTone(device.status)}>
                                    {device.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{device.usage_type}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">
                    No hospital assignments yet.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
