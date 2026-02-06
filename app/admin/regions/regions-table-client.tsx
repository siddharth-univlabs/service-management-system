"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSubregion, deleteSubregion, type ActionResult, updateSubregion } from "./actions";

type RegionRow = {
  id: string;
  name: string;
  code: string;
  parent_region_id: string | null;
  is_locked: boolean;
};

type Props = {
  parentRegions: RegionRow[];
  subregionsByParentId: Record<string, RegionRow[]>;
  managerByRegionId: Record<string, string | null>;
};

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

function PlusIcon({ className }: { className?: string }) {
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
      <path d="M12 5v14" />
      <path d="M5 12h14" />
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

function ChevronIcon({ open, className }: { open: boolean; className?: string }) {
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
      {open ? <path d="M6 15l6-6 6 6" /> : <path d="M6 9l6 6 6-6" />}
    </svg>
  );
}

export default function RegionsTableClient({ parentRegions, subregionsByParentId, managerByRegionId }: Props) {
  const router = useRouter();
  const [expandedRegionId, setExpandedRegionId] = useState<string | null>(null);
  const [addingRegionId, setAddingRegionId] = useState<string | null>(null);
  const [editingSubregionId, setEditingSubregionId] = useState<string | null>(null);
  const [editingSubregion, setEditingSubregion] = useState<{ id: string; name: string; code: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; code: string; name: string } | null>(null);
  const [deleteConfirmValue, setDeleteConfirmValue] = useState("");
  const [savingByParentId, setSavingByParentId] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  const rows = useMemo(() => {
    const items: Array<
      | { kind: "parent"; region: RegionRow }
      | { kind: "sub"; parentId: string; region: RegionRow }
      | { kind: "adder"; parentId: string }
    > = [];

    for (const parent of parentRegions) {
      items.push({ kind: "parent", region: parent });

      if (expandedRegionId === parent.id) {
        const subs = subregionsByParentId[parent.id] ?? [];
        for (const sub of subs) {
          items.push({ kind: "sub", parentId: parent.id, region: sub });
        }
      }

      if (addingRegionId === parent.id) {
        items.push({ kind: "adder", parentId: parent.id });
      }
    }

    return items;
  }, [addingRegionId, expandedRegionId, parentRegions, subregionsByParentId]);

  return (
    <div className="space-y-4">
      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-slate-800/80 bg-slate-950/95 px-4 py-3 text-sm text-slate-100 shadow-[0_20px_60px_rgba(2,6,23,0.65)]">
          <div className={toast.variant === "error" ? "text-rose-200" : "text-emerald-200"}>{toast.message}</div>
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <tr>
            <TableHead>Region</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Regional Manager</TableHead>
            <TableHead>Actions</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
          if (row.kind === "parent") {
            const region = row.region;
            const isExpanded = expandedRegionId === region.id;
            const isAdding = addingRegionId === region.id;
            const managerName = managerByRegionId[region.id] ?? null;
            const subCount = (subregionsByParentId[region.id] ?? []).length;

            return (
              <TableRow key={region.id}>
                <TableCell className="align-top font-medium">{region.name}</TableCell>
                <TableCell className="align-top">{region.code}</TableCell>
                <TableCell className="align-top">{managerName ?? "Unassigned"}</TableCell>
                <TableCell className="align-top">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-600"
                      onClick={() => setExpandedRegionId(isExpanded ? null : region.id)}
                    >
                      <ChevronIcon open={isExpanded} className="h-4 w-4" />
                      Subregions ({subCount})
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-600"
                      onClick={() => {
                        setAddingRegionId(isAdding ? null : region.id);
                        setExpandedRegionId(region.id);
                      }}
                      aria-label="Add subregion"
                      title="Add subregion"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          }

          if (row.kind === "sub") {
            const subregion = row.region;
            const isEditing = editingSubregionId === subregion.id;

            const handleSaveEdit = async () => {
              if (!editingSubregion || editingSubregion.id !== subregion.id) return;
              const formData = new FormData();
              formData.set("id", editingSubregion.id);
              formData.set("name", editingSubregion.name);
              formData.set("code", editingSubregion.code);

              try {
                await updateSubregion(formData);
                setToast({ message: "Subregion updated.", variant: "success" });
                setEditingSubregionId(null);
                setEditingSubregion(null);
                router.refresh();
              } catch (err) {
                setToast({
                  message: err instanceof Error ? err.message : "Unable to update subregion.",
                  variant: "error",
                });
              } finally {
                setTimeout(() => setToast(null), 2500);
              }
            };

            return (
              <TableRow key={subregion.id}>
                <TableCell className="pl-10 text-slate-200">
                  {isEditing ? (
                    <input
                      value={editingSubregion?.name ?? ""}
                      onChange={(event) =>
                        setEditingSubregion((prev) =>
                          prev ? { ...prev, name: event.target.value } : prev
                        )
                      }
                      className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 shadow-[0_18px_35px_rgba(2,6,23,0.4)] focus:border-teal-400 focus:outline-none"
                      required
                    />
                  ) : (
                    subregion.name
                  )}
                </TableCell>
                <TableCell className="text-slate-300">
                  {isEditing ? (
                    <input
                      value={editingSubregion?.code ?? ""}
                      onChange={(event) =>
                        setEditingSubregion((prev) =>
                          prev ? { ...prev, code: event.target.value } : prev
                        )
                      }
                      className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 shadow-[0_18px_35px_rgba(2,6,23,0.4)] focus:border-teal-400 focus:outline-none"
                      required
                    />
                  ) : (
                    subregion.code
                  )}
                </TableCell>
                <TableCell className="text-slate-500">—</TableCell>
                <TableCell className="align-top">
                  <div className="flex flex-wrap items-center gap-2">
                    {isEditing ? (
                      <>
                        <Button type="button" variant="secondary" onClick={handleSaveEdit}>
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setEditingSubregionId(null);
                            setEditingSubregion(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-600"
                          onClick={() => {
                            setEditingSubregionId(subregion.id);
                            setEditingSubregion({
                              id: subregion.id,
                              name: subregion.name,
                              code: subregion.code,
                            });
                          }}
                          aria-label="Edit subregion"
                          title="Edit subregion"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:border-rose-500/70"
                          onClick={() => {
                            setDeleteConfirm({
                              id: subregion.id,
                              code: subregion.code,
                              name: subregion.name,
                            });
                            setDeleteConfirmValue("");
                          }}
                          aria-label="Delete subregion"
                          title="Delete subregion"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          }

          const parentId = row.parentId;
          const parent = parentRegions.find((r) => r.id === parentId);
          const isSaving = savingByParentId[parentId] ?? false;

          const handleCreate = async (formData: FormData) => {
            setSavingByParentId((prev) => ({ ...prev, [parentId]: true }));
            try {
              const result = (await createSubregion(formData)) as ActionResult;
              if (!result.success) {
                setToast({ message: result.message ?? "Unable to add subregion.", variant: "error" });
                return;
              }

              setToast({ message: "Subregion added.", variant: "success" });
              router.refresh();
            } catch (err) {
              setToast({
                message: err instanceof Error ? err.message : "Unable to add subregion.",
                variant: "error",
              });
            } finally {
              setSavingByParentId((prev) => ({ ...prev, [parentId]: false }));
              setTimeout(() => setToast(null), 2500);
            }
          };

          return (
            <TableRow key={`adder-${parentId}`}>
              <TableCell colSpan={4} className="bg-slate-950/30">
                <div className="space-y-6">
                  <form action={handleCreate} className="grid gap-4 md:grid-cols-3">
                    <input type="hidden" name="parent_region_id" value={parentId} />
                    <Input label="Subregion Name" name="name" placeholder={parent ? `${parent.name} 1` : "Subregion"} required />
                    <Input label="Code" name="code" placeholder={parent ? `${parent.code}-1` : "CODE"} required />
                    <div className="flex items-end">
                      <Button type="submit" className="w-full" disabled={isSaving}>
                        {isSaving ? "Adding..." : "Add"}
                      </Button>
                    </div>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          );
        })}

        {parentRegions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-slate-400">
              No primary regions found.
            </TableCell>
          </TableRow>
        ) : null}
        </TableBody>
      </Table>

      {deleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800/70 bg-slate-950/90 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.7)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Delete subregion
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-100">
                  {deleteConfirm.name}
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  Type <span className="font-semibold text-slate-200">{deleteConfirm.code}</span> to confirm deletion.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteConfirmValue("");
                }}
              >
                Close
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              <Input
                label="Confirm code"
                value={deleteConfirmValue}
                onChange={(event) => setDeleteConfirmValue(event.target.value)}
                placeholder={deleteConfirm.code}
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteConfirmValue("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={deleteConfirmValue.trim() !== deleteConfirm.code}
                onClick={async () => {
                  const target = deleteConfirm;
                  if (!target) return;

                  const formData = new FormData();
                  formData.set("id", target.id);

                  try {
                    await deleteSubregion(formData);
                    setToast({ message: "Subregion deleted.", variant: "success" });
                    setDeleteConfirm(null);
                    setDeleteConfirmValue("");
                    router.refresh();
                  } catch (err) {
                    setToast({
                      message: err instanceof Error ? err.message : "Unable to delete subregion.",
                      variant: "error",
                    });
                  } finally {
                    setTimeout(() => setToast(null), 2500);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
