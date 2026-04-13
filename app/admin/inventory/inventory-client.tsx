"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Button from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const PROJECT_IMAGES_BUCKET = "project-images";
const CATEGORY_IMAGES_BUCKET = "category-images";

const resolveImageSrc = (bucket: string, value: string | null) => {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
    return value;
  }

  const normalizedPath = value.startsWith("/") ? value.slice(1) : value;
  const supabase = createSupabaseBrowserClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(normalizedPath);
  return data.publicUrl;
};

const chipClipPath =
  "polygon(0 8%, 4% 0, 96% 0, 100% 8%, 100% 92%, 96% 100%, 4% 100%, 0 92%)";

type InventoryModelRow = {
  model_id: string;
  model_name: string;
  category: string;
  project_id: string | null;
  total: number;
  in_inventory: number;
  deployed: number;
  demo_deployed: number;
  sold_deployed: number;
  model_code: string | null;
  manufacturer: string | null;
  description: string | null;
};

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  image_path: string | null;
};

type InventoryClientProps = {
  rows: InventoryModelRow[];
  projects: ProjectRow[];
};

export default function InventoryClient({ rows, projects }: InventoryClientProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Derive categories that have inventory data
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    rows.forEach(row => {
      if (row.category) cats.add(row.category);
    });
    return Array.from(cats);
  }, [rows]);

  // Derive project inventory stats
  const projectStats = useMemo(() => {
    return projects.map((project) => {
      const projectRows = rows.filter((r) => r.project_id === project.id);
      return {
        ...project,
        total_models: projectRows.length,
        total_devices: projectRows.reduce((sum, r) => sum + r.total, 0),
        in_inventory: projectRows.reduce((sum, r) => sum + r.in_inventory, 0),
      };
    });
  }, [projects, rows]);

  // Add an "Unassigned" project for categories/models without a project
  const unassignedRows = useMemo(() => rows.filter(r => !r.project_id), [rows]);
  const allProjects = useMemo(() => {
    const list = [...projectStats];
    if (unassignedRows.length > 0) {
      list.push({
        id: "unassigned",
        name: "Unassigned",
        description: "Models not assigned to any project",
        image_path: null,
        total_models: unassignedRows.length,
        total_devices: unassignedRows.reduce((sum, r) => sum + r.total, 0),
        in_inventory: unassignedRows.reduce((sum, r) => sum + r.in_inventory, 0),
      });
    }
    return list;
  }, [projectStats, unassignedRows]);

  // Categories for the selected project
  const categoriesInProject = useMemo(() => {
    if (!selectedProjectId) return [];
    const filteredRows = selectedProjectId === "unassigned" 
      ? unassignedRows 
      : rows.filter(r => r.project_id === selectedProjectId);
    
    const cats = new Set<string>();
    filteredRows.forEach(r => cats.add(r.category || "Uncategorized"));
    
    return Array.from(cats).map(categoryName => {
      const catRows = filteredRows.filter(r => (r.category || "Uncategorized") === categoryName);
      return {
        name: categoryName,
        total_models: catRows.length,
        total_devices: catRows.reduce((sum, r) => sum + r.total, 0),
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedProjectId, rows, unassignedRows]);

  // Models for the selected category
  const modelsInCategory = useMemo(() => {
    if (!selectedProjectId || !selectedCategory) return [];
    
    const filteredRows = selectedProjectId === "unassigned" 
      ? unassignedRows 
      : rows.filter(r => r.project_id === selectedProjectId);
      
    return filteredRows
      .filter(r => (r.category || "Uncategorized") === selectedCategory)
      .sort((a, b) => a.model_name.localeCompare(b.model_name));
  }, [selectedProjectId, selectedCategory, rows, unassignedRows]);

  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-800/70 bg-slate-950/60 p-6 text-sm text-slate-400">
        No inventory data yet. Add device models and devices to populate the view.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!selectedProjectId ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">
              Projects Overview
            </h3>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Select a project
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {allProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => {
                  setSelectedProjectId(project.id);
                  setSelectedCategory(null);
                }}
                className="group relative overflow-hidden border border-slate-800/80 bg-slate-950/70 text-left shadow-[0_24px_60px_rgba(2,6,23,0.6)] transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/60 flex flex-col"
                style={{ clipPath: chipClipPath }}
              >
                <div className="absolute inset-0 bg-linear-to-br from-teal-500/10 via-transparent to-indigo-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {resolveImageSrc(PROJECT_IMAGES_BUCKET, project.image_path) ? (
                  <img
                    src={resolveImageSrc(PROJECT_IMAGES_BUCKET, project.image_path) ?? ""}
                    alt={project.name}
                    className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-32 w-full items-center justify-center bg-slate-900/60 text-sm text-slate-400">
                    No project image
                  </div>
                )}
                <div className="flex-1 border-t border-slate-800/70 bg-slate-950/80 px-5 py-4 flex flex-col justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-100">{project.name}</p>
                    {project.description && (
                      <p className="text-xs text-slate-400 line-clamp-1 mt-1">{project.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
                    <div className="flex flex-col">
                      <span className="text-slate-500">Models</span>
                      <span>{project.total_models}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500">Total Units</span>
                      <span>{project.total_devices}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500">Available</span>
                      <span className="text-teal-400">{project.in_inventory}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : !selectedCategory ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Project
              </p>
              <h3 className="text-2xl font-semibold text-slate-100">
                {allProjects.find(p => p.id === selectedProjectId)?.name}
              </h3>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedProjectId(null);
                setSelectedCategory(null);
              }}
            >
              Back to projects
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-6">
            <h3 className="text-lg font-semibold text-slate-100">
              Device Categories
            </h3>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Select a category
            </span>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {categoriesInProject.map((category) => (
              <button
                key={category.name}
                type="button"
                onClick={() => {
                  setSelectedCategory(category.name);
                }}
                className="group relative overflow-hidden border border-slate-800/80 bg-slate-950/70 text-left shadow-[0_24px_60px_rgba(2,6,23,0.6)] transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/60 flex flex-col"
                style={{ clipPath: chipClipPath }}
              >
                <div className="absolute inset-0 bg-linear-to-br from-teal-500/10 via-transparent to-indigo-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="flex-1 bg-slate-950/80 px-5 py-6 flex flex-col gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-1">Category</p>
                    <p className="text-xl font-semibold text-slate-100">{category.name}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-medium text-slate-300">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500">Models</span>
                      <span>{category.total_models}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500">Total Units</span>
                      <span>{category.total_devices}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
            
            {categoriesInProject.length === 0 && (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-800/70 bg-slate-950/60 p-6 text-sm text-slate-400">
                No inventory data for this project yet.
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Category
              </p>
              <h3 className="text-2xl font-semibold text-slate-100">
                {selectedCategory}
              </h3>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedCategory(null);
              }}
            >
              Back to categories
            </Button>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-800/70 bg-slate-950/60 p-6 shadow-[0_20px_50px_rgba(2,6,23,0.45)]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h3 className="text-lg font-semibold text-slate-100">
                Hardware Models
              </h3>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {modelsInCategory.length} models
              </div>
            </div>
            
            <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/70">
              <Table className="bg-slate-950/70 shadow-none">
                <TableHeader>
                  <TableRow className="border-slate-800/80 bg-slate-900/50 hover:bg-slate-900/50">
                    <th className="h-12 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400 text-left">SKU / Model</th>
                    <th className="h-12 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400 text-left">Total</th>
                    <th className="h-12 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400 text-left">In Inventory</th>
                    <th className="h-12 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400 text-left">Deployed</th>
                    <th className="h-12 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400 text-left">Demo</th>
                    <th className="h-12 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400 text-left">Sold</th>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modelsInCategory.map((model) => (
                    <TableRow key={model.model_id} className="border-slate-800/50 transition-colors hover:bg-slate-800/30">
                      <TableCell className="px-6 py-4 font-medium text-slate-100">
                        <Link
                          href={`/admin/inventory/${model.model_id}`}
                          className="text-slate-100 underline-offset-4 hover:underline"
                        >
                          {model.model_name}
                        </Link>
                      </TableCell>
                      <TableCell className="px-6 py-4">{model.total}</TableCell>
                      <TableCell className="px-6 py-4 text-teal-400 font-medium">{model.in_inventory}</TableCell>
                      <TableCell className="px-6 py-4">{model.deployed}</TableCell>
                      <TableCell className="px-6 py-4">{model.demo_deployed}</TableCell>
                      <TableCell className="px-6 py-4">{model.sold_deployed}</TableCell>
                    </TableRow>
                  ))}
                  {modelsInCategory.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6} className="h-32 px-6 text-center text-sm text-slate-400">
                        No models found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
