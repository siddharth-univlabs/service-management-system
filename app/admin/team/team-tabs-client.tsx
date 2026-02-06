"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  activateProfile,
  approveSignupRequest,
  deactivateProfile,
  rejectSignupRequest,
} from "./actions";

type TeamProfileRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  approval_status: "PENDING" | "APPROVED" | "REJECTED";
  role: string | null;
  is_active: boolean;
  rejection_reason?: string | null;
};

type Props = {
  activeMembers: TeamProfileRow[];
  pendingMembers: TeamProfileRow[];
  rejectedMembers: TeamProfileRow[];
};

type TabKey = "active" | "pending" | "rejected";

export default function TeamTabsClient({ activeMembers, pendingMembers, rejectedMembers }: Props) {
  const [tab, setTab] = useState<TabKey>("active");

  const counts = useMemo(() => {
    return {
      active: activeMembers.length,
      pending: pendingMembers.length,
      rejected: rejectedMembers.length,
    };
  }, [activeMembers.length, pendingMembers.length, rejectedMembers.length]);

  const rows = tab === "active" ? activeMembers : tab === "pending" ? pendingMembers : rejectedMembers;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Team Members</h3>
          <p className="text-sm text-slate-400">
            Approve requests, manage roles, and activate or deactivate accounts.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-full border border-slate-800/70 bg-slate-950/70 p-1">
        <button
          type="button"
          onClick={() => setTab("active")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            tab === "active"
              ? "bg-teal-400 text-slate-950"
              : "text-slate-300 hover:bg-slate-900/70"
          }`}
        >
          Active
          <span className="ml-2 text-xs opacity-80">{counts.active}</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("pending")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            tab === "pending"
              ? "bg-teal-400 text-slate-950"
              : "text-slate-300 hover:bg-slate-900/70"
          }`}
        >
          Pending
          <span className="ml-2 text-xs opacity-80">{counts.pending}</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("rejected")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            tab === "rejected"
              ? "bg-teal-400 text-slate-950"
              : "text-slate-300 hover:bg-slate-900/70"
          }`}
        >
          Rejected
          <span className="ml-2 text-xs opacity-80">{counts.rejected}</span>
        </button>
      </div>

      <Card>
        <CardContent className="space-y-4">
          {rows.length ? (
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {rows.map((member) => (
                  <TableRow key={member.user_id}>
                    <TableCell className="font-medium text-slate-100">
                      {member.full_name ?? member.user_id}
                    </TableCell>
                    <TableCell>{member.phone ?? "-"}</TableCell>
                    <TableCell>{member.role ?? "-"}</TableCell>
                    <TableCell>
                      {member.approval_status === "APPROVED" && member.is_active ? (
                        <Badge tone="success">Active</Badge>
                      ) : member.approval_status === "PENDING" ? (
                        <Badge tone="brand">Pending</Badge>
                      ) : (
                        <Badge tone="critical">Rejected</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        {member.approval_status === "PENDING" ? (
                          <>
                            <form action={approveSignupRequest} className="flex items-center gap-2">
                              <input type="hidden" name="userId" value={member.user_id} />
                              <Select name="role" label="Role">
                                <option value="FIELD_ENGINEER">Field engineer</option>
                                <option value="REGIONAL_MANAGER">Regional manager</option>
                                <option value="ADMIN">Admin</option>
                              </Select>
                              <Button type="submit" variant="secondary">
                                Approve
                              </Button>
                            </form>
                            <form action={rejectSignupRequest} className="flex items-center gap-2">
                              <input type="hidden" name="userId" value={member.user_id} />
                              <Input name="reason" label="Reason" placeholder="Optional" />
                              <Button type="submit">Reject</Button>
                            </form>
                          </>
                        ) : null}

                        {member.approval_status === "APPROVED" ? (
                          member.is_active ? (
                            <form action={deactivateProfile}>
                              <input type="hidden" name="userId" value={member.user_id} />
                              <Button variant="ghost" type="submit">
                                Deactivate
                              </Button>
                            </form>
                          ) : (
                            <form action={activateProfile}>
                              <input type="hidden" name="userId" value={member.user_id} />
                              <Button variant="secondary" type="submit">
                                Activate
                              </Button>
                            </form>
                          )
                        ) : null}

                        {member.approval_status === "REJECTED" ? (
                          <form action={approveSignupRequest} className="flex items-center gap-2">
                            <input type="hidden" name="userId" value={member.user_id} />
                            <Select name="role" label="Role">
                              <option value="FIELD_ENGINEER">Field engineer</option>
                              <option value="REGIONAL_MANAGER">Regional manager</option>
                              <option value="ADMIN">Admin</option>
                            </Select>
                            <Button type="submit" variant="secondary">
                              Approve
                            </Button>
                          </form>
                        ) : null}
                      </div>

                      {member.approval_status === "REJECTED" && member.rejection_reason ? (
                        <div className="mt-2 text-xs text-slate-400">
                          Reason: {member.rejection_reason}
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-800/70 p-6 text-sm text-slate-400">
              No members in this tab.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
