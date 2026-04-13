"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
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

type DeviceRow = {
  id: string;
  serial_number: string;
  ownership_type: string;
  usage_type: string;
  status: string;
  demo_status: string | null;
  demo_last_used_at: string | null;
  current_location_type: string;
  current_hospital?: { name: string | null } | null;
  current_warehouse?: { name: string | null } | null;
  device_model?: {
    id: string;
    model_name: string | null;
    device_category?: { name: string | null } | null;
  } | null;
};

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  image_path: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
  image_path: string | null;
  project_id: string | null;
};

type DeviceModelRow = {
  id: string;
  model_name: string;
  manufacturer: string | null;
  model_code: string;
  description: string | null;
  specs: unknown | null;
  category_name: string | null;
};

type DevicesClientProps = {
  projects: ProjectRow[];
  categories: CategoryRow[];
  models: DeviceModelRow[];
  devices: DeviceRow[];
  initialProjectId?: string | null;
  initialCategory?: string | null;
  initialModelId?: string | null;
};

type NewSku = {
  model_name: string;
  manufacturer: string;
  model_code: string;
  description: string;
  specs: string;
};

function isValidJson(value: string) {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

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

const chipClipPath =
  "polygon(0 8%, 4% 0, 96% 0, 100% 8%, 100% 92%, 96% 100%, 4% 100%, 0 92%)";

const CATEGORY_IMAGES_BUCKET = "category-images";
const PROJECT_IMAGES_BUCKET = "project-images";

const resolveCategoryImageSrc = (value: string | null) => {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
    return value;
  }

  const normalizedPath = value.startsWith("/") ? value.slice(1) : value;
  const supabase = createSupabaseBrowserClient();
  const { data } = supabase.storage.from(CATEGORY_IMAGES_BUCKET).getPublicUrl(normalizedPath);
  return data.publicUrl;
};

const resolveProjectImageSrc = (value: string | null) => {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
    return value;
  }

  const normalizedPath = value.startsWith("/") ? value.slice(1) : value;
  const supabase = createSupabaseBrowserClient();
  const { data } = supabase.storage.from(PROJECT_IMAGES_BUCKET).getPublicUrl(normalizedPath);
  return data.publicUrl;
};

export default function DevicesClient({
  projects,
  categories,
  models,
  devices,
  initialProjectId,
  initialCategory,
  initialModelId,
}: DevicesClientProps) {
  const router = useRouter();
  const initialModel = useMemo(() => {
    if (!initialModelId) return null;
    return models.find((model) => model.id === initialModelId) ?? null;
  }, [models, initialModelId]);

  const initialCat = useMemo(() => {
    const catName = initialModel?.category_name ?? initialCategory;
    if (!catName) return null;
    return categories.find(c => c.name === catName) ?? null;
  }, [initialModel, initialCategory, categories]);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    initialProjectId ?? initialCat?.project_id ?? null
  );

  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialCat?.name ?? null
  );
  
  const [selectedModelId, setSelectedModelId] = useState<string | null>(
    initialModel ? initialModel.id : null
  );

  // Filter categories by selected project
  const filteredCategories = useMemo(() => {
    if (!selectedProjectId) return [];
    return categories.filter(c => c.project_id === selectedProjectId);
  }, [categories, selectedProjectId]);

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddSkuOpen, setIsAddSkuOpen] = useState(false);
  const [newSkuName, setNewSkuName] = useState("");
  const [newSkuCode, setNewSkuCode] = useState("");
  const [newSkuManufacturer, setNewSkuManufacturer] = useState("");
  const [newSkuDescription, setNewSkuDescription] = useState("");
  const [newSkuSpecs, setNewSkuSpecs] = useState("");
  const [addSkuError, setAddSkuError] = useState<string | null>(null);
  const [isSavingSku, setIsSavingSku] = useState(false);

  const [editingSku, setEditingSku] = useState<DeviceModelRow | null>(null);
  const [isEditSkuOpen, setIsEditSkuOpen] = useState(false);
  const [editSkuName, setEditSkuName] = useState("");
  const [editSkuCode, setEditSkuCode] = useState("");
  const [editSkuManufacturer, setEditSkuManufacturer] = useState("");
  const [editSkuDescription, setEditSkuDescription] = useState("");
  const [editSkuSpecs, setEditSkuSpecs] = useState("");
  const [editSkuError, setEditSkuError] = useState<string | null>(null);
  const [isSavingEditSku, setIsSavingEditSku] = useState(false);
  const [isDeleteSkuOpen, setIsDeleteSkuOpen] = useState(false);
  const [deleteSkuConfirmValue, setDeleteSkuConfirmValue] = useState("");
  const [isDeletingSku, setIsDeletingSku] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState<File | null>(null);
  const [newSkus, setNewSkus] = useState<NewSku[]>([
    { model_name: "", manufacturer: "", model_code: "", description: "", specs: "" },
  ]);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [addCategoryError, setAddCategoryError] = useState<string | null>(null);

  const modelCounts = useMemo(() => {
    return devices.reduce<Record<string, number>>((acc, device) => {
      const modelId = device.device_model?.id;
      if (!modelId) return acc;
      acc[modelId] = (acc[modelId] ?? 0) + 1;
      return acc;
    }, {});
  }, [devices]);

  const filteredModels = useMemo(() => {
    if (!selectedCategory) return [];
    return models.filter((model) => model.category_name === selectedCategory);
  }, [models, selectedCategory]);

  const selectedModel = useMemo(() => {
    if (!selectedModelId) return null;
    return models.find((model) => model.id === selectedModelId) ?? null;
  }, [models, selectedModelId]);

  const selectedCategoryName = selectedModel?.category_name ?? selectedCategory;

  const selectedCategoryRow = useMemo(() => {
    if (!selectedCategoryName) return null;
    return categories.find((category) => category.name === selectedCategoryName) ?? null;
  }, [categories, selectedCategoryName]);

  const filteredDevices = useMemo(() => {
    if (!selectedModelId) return [];
    return devices.filter((device) => device.device_model?.id === selectedModelId);
  }, [devices, selectedModelId]);

  const openAddCategory = () => {
    setAddCategoryError(null);
    setNewCategoryName("");
    setNewCategoryDescription("");
    setNewCategoryImage(null);
    setIsAddCategoryOpen(true);
  };

  const closeAddCategory = () => {
    if (isSavingCategory) return;
    setIsAddCategoryOpen(false);
  };

  const openAddSku = () => {
    if (!selectedCategoryRow) return;
    setAddSkuError(null);
    setNewSkuName("");
    setNewSkuCode("");
    setNewSkuManufacturer("");
    setNewSkuDescription("");
    setNewSkuSpecs("");
    setIsAddSkuOpen(true);
  };

  const closeAddSku = () => {
    if (isSavingSku) return;
    setIsAddSkuOpen(false);
  };

  const handleCreateSku = async () => {
    if (!selectedCategoryRow) {
      setAddSkuError("Select a category first.");
      return;
    }

    const model_name = newSkuName.trim();
    const model_code = newSkuCode.trim();
    const manufacturer = newSkuManufacturer.trim();
    const description = newSkuDescription.trim();
    const specsText = newSkuSpecs.trim();

    if (!model_name) {
      setAddSkuError("SKU name is required.");
      return;
    }

    if (!model_code) {
      setAddSkuError("SKU code is required.");
      return;
    }

    let specs: any = null;
    if (specsText) {
      try {
        specs = JSON.parse(specsText);
      } catch {
        setAddSkuError("Specs must be valid JSON.");
        return;
      }
    }

    setIsSavingSku(true);
    setAddSkuError(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("device_models").insert({
      category_id: selectedCategoryRow.id,
      model_name,
      model_code,
      manufacturer: manufacturer || null,
      description: description || null,
      specs,
    });

    if (error) {
      setAddSkuError(error.message);
      setIsSavingSku(false);
      return;
    }

    setIsSavingSku(false);
    setIsAddSkuOpen(false);
    router.refresh();
  };

  const openEditSku = (model: DeviceModelRow) => {
    setEditingSku(model);
    setEditSkuError(null);
    setEditSkuName(model.model_name ?? "");
    setEditSkuCode(model.model_code ?? "");
    setEditSkuManufacturer(model.manufacturer ?? "");
    setEditSkuDescription(model.description ?? "");
    setEditSkuSpecs(model.specs ? JSON.stringify(model.specs, null, 2) : "");
    setIsDeleteSkuOpen(false);
    setDeleteSkuConfirmValue("");
    setIsEditSkuOpen(true);
  };

  const closeEditSku = () => {
    if (isSavingEditSku || isDeletingSku) return;
    setIsEditSkuOpen(false);
  };

  const handleUpdateSku = async () => {
    if (!editingSku) return;

    const model_name = editSkuName.trim();
    const model_code = editSkuCode.trim();
    const manufacturer = editSkuManufacturer.trim();
    const description = editSkuDescription.trim();
    const specsText = editSkuSpecs.trim();

    if (!model_name) {
      setEditSkuError("SKU name is required.");
      return;
    }

    if (!model_code) {
      setEditSkuError("SKU code is required.");
      return;
    }

    let specs: any = null;
    if (specsText) {
      try {
        specs = JSON.parse(specsText);
      } catch {
        setEditSkuError("Specs must be valid JSON.");
        return;
      }
    }

    setIsSavingEditSku(true);
    setEditSkuError(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("device_models")
      .update({
        model_name,
        model_code,
        manufacturer: manufacturer || null,
        description: description || null,
        specs,
      })
      .eq("id", editingSku.id);

    if (error) {
      setEditSkuError(error.message);
      setIsSavingEditSku(false);
      return;
    }

    setIsSavingEditSku(false);
    setIsEditSkuOpen(false);
    router.refresh();
  };

  const handleDeleteSku = async () => {
    if (!editingSku) return;

    setIsDeletingSku(true);
    setEditSkuError(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("device_models").delete().eq("id", editingSku.id);

    if (error) {
      setEditSkuError(error.message);
      setIsDeletingSku(false);
      return;
    }

    setIsDeletingSku(false);
    setIsEditSkuOpen(false);
    router.refresh();
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setAddCategoryError("Project must be selected to add a category.");
      return;
    }

    const name = newCategoryName.trim();
    if (!name) {
      setAddCategoryError("Category name is required.");
      return;
    }

    setIsSavingCategory(true);
    setAddCategoryError(null);

    const supabase = createSupabaseBrowserClient();

    // Try to find existing category first to handle unique constraint
    const { data: existingCategory } = await supabase
      .from("device_categories")
      .select("id")
      .ilike("name", name)
      .single();

    let categoryId = existingCategory?.id;

    if (!categoryId) {
      const { data: newCategory, error: categoryError } = await supabase
        .from("device_categories")
        .insert({ name, description: newCategoryDescription.trim() || null })
        .select("id")
        .single();

      if (categoryError || !newCategory) {
        setAddCategoryError(`Failed to save category: ${categoryError?.message || "Unknown error"}`);
        setIsSavingCategory(false);
        return;
      }
      categoryId = newCategory.id;
    }

    // Link category to selected project
    const { error: mappingError } = await supabase
      .from("project_device_categories")
      .insert({ project_id: selectedProjectId, category_id: categoryId });

    if (mappingError && mappingError.code !== "23505") { // Ignore if already linked
      console.error("Failed to link category to project:", mappingError);
    }

    let imagePath: string | null = null;

    if (newCategoryImage && categoryId) {
      const ext = newCategoryImage.name.split(".").pop()?.toLowerCase() || "png";
      imagePath = `device-categories/${categoryId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(CATEGORY_IMAGES_BUCKET)
        .upload(imagePath, newCategoryImage, { upsert: true });

      if (uploadError) {
        setAddCategoryError(uploadError.message);
        setIsSavingCategory(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("device_categories")
        .update({ image_path: imagePath })
        .eq("id", categoryId);

      if (updateError) {
        setAddCategoryError(updateError.message);
        setIsSavingCategory(false);
        return;
      }
    }

    setIsSavingCategory(false);
    setIsAddCategoryOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {!selectedProjectId ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">
              Projects
            </h3>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Select a project
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => {
                  setSelectedProjectId(project.id);
                  setSelectedCategory(null);
                  setSelectedModelId(null);
                }}
                className="group relative overflow-hidden border border-slate-800/80 bg-slate-950/70 text-left shadow-[0_24px_60px_rgba(2,6,23,0.6)] transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/60"
                style={{ clipPath: chipClipPath }}
              >
                <div className="absolute inset-0 bg-linear-to-br from-teal-500/10 via-transparent to-indigo-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {resolveProjectImageSrc(project.image_path) ? (
                  <img
                    src={resolveProjectImageSrc(project.image_path) ?? ""}
                    alt={project.name}
                    className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center bg-slate-900/60 text-sm text-slate-400">
                    No image
                  </div>
                )}
                <div className="border-t border-slate-800/70 bg-slate-950/80 px-5 py-4">
                  <p className="text-lg font-semibold text-slate-100">{project.name}</p>
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => router.push("/admin/projects")}
              className="group relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border border-dashed border-slate-700/70 bg-slate-950/40 px-6 py-10 text-center text-sm text-slate-300 shadow-[0_24px_60px_rgba(2,6,23,0.55)] transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/60"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-700/70 bg-slate-950/70 text-2xl text-slate-100 transition group-hover:border-teal-400/60">
                +
              </div>
              <div>
                <p className="text-base font-semibold text-slate-100">Manage projects</p>
                <p className="mt-1 text-xs text-slate-400">Go to projects page</p>
              </div>
            </button>
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
                {projects.find(p => p.id === selectedProjectId)?.name}
              </h3>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedProjectId(null);
                setSelectedCategory(null);
                setSelectedModelId(null);
              }}
            >
              Back to projects
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">
              Device Categories
            </h3>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Visual catalog
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(category.name);
                  setSelectedModelId(null);
                }}
                className="group relative overflow-hidden border border-slate-800/80 bg-slate-950/70 text-left shadow-[0_24px_60px_rgba(2,6,23,0.6)] transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/60"
                style={{ clipPath: chipClipPath }}
              >
                <div className="absolute inset-0 bg-linear-to-br from-teal-500/10 via-transparent to-indigo-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {resolveCategoryImageSrc(category.image_path) ? (
                  <img
                    src={resolveCategoryImageSrc(category.image_path) ?? ""}
                    alt={category.name}
                    className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center bg-slate-900/60 text-sm text-slate-400">
                    No image
                  </div>
                )}
                <div className="border-t border-slate-800/70 bg-slate-950/80 px-5 py-4">
                  <p className="text-lg font-semibold text-slate-100">{category.name}</p>
                </div>
              </button>
            ))}

            <button
              type="button"
              onClick={openAddCategory}
              className="group relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border border-dashed border-slate-700/70 bg-slate-950/40 px-6 py-10 text-center text-sm text-slate-300 shadow-[0_24px_60px_rgba(2,6,23,0.55)] transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/60"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-700/70 bg-slate-950/70 text-2xl text-slate-100 transition group-hover:border-teal-400/60">
                +
              </div>
              <div>
                <p className="text-base font-semibold text-slate-100">Add new category</p>
                <p className="mt-1 text-xs text-slate-400">Create category + upload image + add SKUs</p>
              </div>
            </button>
          </div>
        </section>
      ) : !selectedModelId ? (
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
                setSelectedModelId(null);
              }}
            >
              Back to categories
            </Button>
          </div>

          <div className="flex items-center justify-between mt-8">
            <h3 className="text-lg font-semibold text-slate-100">
              Device Models
            </h3>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              SKUs
            </span>
          </div>

          {filteredModels.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredModels.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => setSelectedModelId(model.id)}
                  className={`group relative overflow-hidden border bg-slate-950/70 text-left shadow-[0_18px_45px_rgba(2,6,23,0.5)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/60 ${
                    selectedModelId === model.id
                      ? "border-cyan-400/70"
                      : "border-slate-800/80"
                  }`}
                  style={{ clipPath: chipClipPath }}
                >
                  <div className="absolute inset-0 bg-linear-to-br from-cyan-500/10 via-transparent to-indigo-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openEditSku(model);
                    }}
                    className="absolute right-4 top-4 z-10 inline-flex items-center justify-center rounded-full border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-600"
                    aria-label="Edit SKU"
                    title="Edit SKU"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <div className="flex h-full flex-col gap-4 px-6 py-6">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                        SKU
                      </p>
                      <p className="text-xl font-semibold text-slate-100">
                        {model.model_name}
                      </p>
                    </div>
                    <div className="text-sm text-slate-400">
                      {modelCounts[model.id] ?? 0} serialized devices
                    </div>
                  </div>
                </button>
              ))}

              <button
                type="button"
                onClick={openAddSku}
                className="group relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border border-dashed border-slate-700/70 bg-slate-950/40 px-6 py-10 text-center text-sm text-slate-300 shadow-[0_18px_45px_rgba(2,6,23,0.5)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/60"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-700/70 bg-slate-950/70 text-2xl text-slate-100 transition group-hover:border-cyan-400/60">
                  +
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-100">Add another SKU</p>
                  <p className="mt-1 text-xs text-slate-400">Create a new SKU code</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-800/70 bg-slate-950/60 p-6 text-center text-sm text-slate-400">
              <p>No SKUs found for this category yet.</p>
              <Button variant="secondary" className="mt-4" onClick={openAddSku}>
                Add First SKU
              </Button>
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                SKU
              </p>
              <h3 className="text-2xl font-semibold text-slate-100">
                {selectedModel?.model_name}
              </h3>
            </div>
            <Button
              variant="ghost"
              onClick={() => setSelectedModelId(null)}
            >
              Back to SKUs
            </Button>
          </div>
          
          <div className="mt-8 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">
              Serialized Devices
            </h3>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Inventory List
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/70 shadow-[0_30px_80px_rgba(2,6,23,0.6)]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800/80 bg-slate-900/50 hover:bg-slate-900/50">
                    <th className="h-12 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400 text-left">
                      Serial No
                    </th>
                    <th className="h-12 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400 text-left">
                      Status
                    </th>
                    <th className="h-12 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400 text-left">
                      Ownership
                    </th>
                    <th className="h-12 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400 text-left">
                      Usage
                    </th>
                    <th className="h-12 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400 text-left">
                      Location
                    </th>
                    <th className="h-12 px-6 text-xs font-semibold uppercase tracking-wider text-slate-400 text-left">
                      Actions
                    </th>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={6}
                        className="h-32 px-6 text-center text-sm text-slate-400"
                      >
                        No devices found for {selectedModel?.model_name}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDevices.map((device) => {
                      const isHospital = device.current_location_type === "HOSPITAL";
                      const locationName = isHospital
                        ? device.current_hospital?.name ?? "Unknown Hospital"
                        : device.current_warehouse?.name ?? "Unknown Warehouse";

                      const st = deviceStatusTone(device.status);
                      const isDemo = device.usage_type === "DEMO";
                      const dt = isDemo && device.demo_status ? demoStatusTone(device.demo_status) : null;

                      return (
                        <TableRow
                          key={device.id}
                          className="border-slate-800/50 transition-colors hover:bg-slate-800/30"
                        >
                          <TableCell className="px-6 py-4">
                            <span className="font-mono text-sm font-medium text-slate-200">
                              {device.serial_number}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex flex-col items-start gap-2">
                              <Badge tone={st}>{device.status.replace(/_/g, " ")}</Badge>
                              {isDemo && device.demo_status && dt && (
                                <Badge tone={dt}>Demo: {device.demo_status.replace(/_/g, " ")}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className="text-sm text-slate-300">
                              {device.ownership_type}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className="text-sm text-slate-300">
                              {device.usage_type}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className="text-sm text-slate-300">
                              {locationName}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <Button
                              variant="secondary"
                              onClick={() => router.push(`/engineer/devices/${device.id}`)}
                              className="h-8 border-slate-700/70 bg-slate-900/50 text-xs text-slate-300 hover:bg-slate-800/80 hover:text-slate-100"
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="border-t border-slate-800/80 bg-slate-950/80 px-6 py-4">
              <Button
                onClick={() => router.push(`/admin/inventory/new?model_id=${selectedModelId}`)}
                className="w-full bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 sm:w-auto"
              >
                + Register New Device
              </Button>
            </div>
          </div>
        </section>
      )}

      {isAddSkuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="w-full max-w-xl rounded-3xl border border-slate-800/70 bg-slate-950/90 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.7)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Add SKU
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-100">New SKU</h3>
                <p className="text-sm text-slate-400">
                  Category: {selectedCategoryName ?? "-"}
                </p>
              </div>
              <Button variant="ghost" onClick={closeAddSku}>
                Close
              </Button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input label="Manufacturer" value={newSkuManufacturer} onChange={(event) => setNewSkuManufacturer(event.target.value)} placeholder="Optional" className="md:col-span-2" />
              <Input label="Model name" value={newSkuName} onChange={(event) => setNewSkuName(event.target.value)} placeholder="e.g. Iris Infusion Pump" required className="md:col-span-2" />
              <Input label="SKU code" value={newSkuCode} onChange={(event) => setNewSkuCode(event.target.value)} placeholder="e.g. SKU-IRIS-01" required className="md:col-span-2" />
              <Textarea label="Description" value={newSkuDescription} onChange={(event) => setNewSkuDescription(event.target.value)} placeholder="Optional" className="md:col-span-2" />
              <Textarea label="Specs (JSON)" value={newSkuSpecs} onChange={(event) => setNewSkuSpecs(event.target.value)} placeholder='{"power": "220V"}' className="md:col-span-2" />
            </div>

            {addSkuError && (
              <div className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {addSkuError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={closeAddSku} disabled={isSavingSku}>
                Cancel
              </Button>
              <Button onClick={handleCreateSku} disabled={isSavingSku}>
                {isSavingSku ? "Saving..." : "Create SKU"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isEditSkuOpen && editingSku ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-800/70 bg-slate-950/90 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.7)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Edit SKU</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-100">{editingSku.model_name}</h3>
                <p className="text-sm text-slate-400">Update details or delete this SKU.</p>
              </div>
              <Button variant="ghost" onClick={closeEditSku}>
                Close
              </Button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input
                label="Manufacturer"
                value={editSkuManufacturer}
                onChange={(event) => setEditSkuManufacturer(event.target.value)}
                placeholder="Optional"
                className="md:col-span-2"
              />
              <Input
                label="Model name"
                value={editSkuName}
                onChange={(event) => setEditSkuName(event.target.value)}
                required
                className="md:col-span-2"
              />
              <Input
                label="SKU code"
                value={editSkuCode}
                onChange={(event) => setEditSkuCode(event.target.value)}
                required
                className="md:col-span-2"
              />
              <Textarea
                label="Description"
                value={editSkuDescription}
                onChange={(event) => setEditSkuDescription(event.target.value)}
                placeholder="Optional"
                className="md:col-span-2"
              />
              <Textarea
                label="Specs (JSON)"
                value={editSkuSpecs}
                onChange={(event) => setEditSkuSpecs(event.target.value)}
                placeholder='{"power": "220V"}'
                className="md:col-span-2"
              />
            </div>

            {editSkuError ? (
              <div className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {editSkuError}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsDeleteSkuOpen(true);
                  setDeleteSkuConfirmValue("");
                }}
                className="border border-rose-500/40 bg-rose-500/10 text-rose-200 hover:border-rose-500/70"
              >
                <span className="inline-flex items-center gap-2">
                  <TrashIcon className="h-4 w-4" />
                  Delete SKU
                </span>
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeEditSku}
                  disabled={isSavingEditSku || isDeletingSku}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleUpdateSku}
                  disabled={isSavingEditSku || isDeletingSku}
                >
                  {isSavingEditSku ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>

            {isDeleteSkuOpen ? (
              <div className="mt-6 rounded-3xl border border-rose-500/40 bg-rose-500/10 p-5">
                <p className="text-sm font-semibold text-rose-200">Confirm deletion</p>
                <p className="mt-1 text-sm text-rose-200/80">
                  Type <span className="font-semibold text-rose-100">{editingSku.model_name}</span> to confirm.
                </p>

                {(modelCounts[editingSku.id] ?? 0) > 0 ? (
                  <p className="mt-3 text-sm text-rose-200/80">
                    This SKU has serialized devices attached. Delete will fail until devices are reassigned or removed.
                  </p>
                ) : null}

                <div className="mt-4">
                  <Input
                    label="Confirm model name"
                    value={deleteSkuConfirmValue}
                    onChange={(event) => setDeleteSkuConfirmValue(event.target.value)}
                    placeholder={editingSku.model_name}
                  />
                </div>

                <div className="mt-4 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsDeleteSkuOpen(false)}
                    disabled={isDeletingSku}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleDeleteSku}
                    disabled={isDeletingSku || deleteSkuConfirmValue.trim() !== editingSku.model_name}
                  >
                    {isDeletingSku ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {selectedModel && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800/70 bg-slate-950/70 px-6 py-5 shadow-[0_20px_50px_rgba(2,6,23,0.5)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Selected SKU
              </p>
              <h4 className="text-2xl font-semibold text-slate-100">
                {selectedModel.model_name}
              </h4>
              <p className="text-sm text-slate-400">
                Category: {selectedCategoryName ?? "-"}
              </p>
            </div>
            <Button variant="ghost" onClick={() => setSelectedModelId(null)}>
              Back to SKUs
            </Button>
          </div>

          <Table>
            <TableHeader>
              <tr>
                <TableHead>Serial</TableHead>
                <TableHead>Ownership</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Demo Status</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {filteredDevices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium text-slate-100">
                    {device.serial_number}
                  </TableCell>
                  <TableCell>{device.ownership_type}</TableCell>
                  <TableCell>{device.usage_type}</TableCell>
                  <TableCell>
                    <Badge tone={deviceStatusTone(device.status)}>
                      {device.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {device.current_location_type === "HOSPITAL"
                      ? device.current_hospital?.name ?? "Hospital"
                      : device.current_warehouse?.name ?? "Warehouse"}
                  </TableCell>
                  <TableCell>
                    {device.demo_status ? (
                      <Badge tone={demoStatusTone(device.demo_status)}>
                        {device.demo_status}
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!filteredDevices.length && (
            <div className="rounded-3xl border border-dashed border-slate-800/70 bg-slate-950/60 p-6 text-sm text-slate-400">
              No serialized devices yet for this SKU.
            </div>
          )}
        </section>
      )}

      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-800/70 bg-slate-950/90 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.7)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Add Category
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-100">New Device Category</h3>
                <p className="text-sm text-slate-400">Upload an image and add SKUs under this category.</p>
              </div>
              <Button variant="ghost" onClick={closeAddCategory}>
                Close
              </Button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-300">
                  <span>Category name</span>
                  <input
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_35px_rgba(2,6,23,0.4)] focus:border-teal-400 focus:outline-none"
                    placeholder="e.g. Pump"
                    required
                  />
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-300">
                  <span>Description</span>
                  <textarea
                    value={newCategoryDescription}
                    onChange={(event) => setNewCategoryDescription(event.target.value)}
                    className="min-h-[90px] w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_35px_rgba(2,6,23,0.4)] focus:border-teal-400 focus:outline-none"
                    placeholder="Optional"
                  />
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-300">
                  <span>Category image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setNewCategoryImage(event.target.files?.[0] ?? null)}
                    className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 shadow-[0_18px_35px_rgba(2,6,23,0.4)] file:mr-4 file:rounded-full file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-slate-100 hover:file:bg-slate-700"
                  />
                  <p className="text-xs text-slate-500">
                    Stored in Supabase Storage bucket <code>{CATEGORY_IMAGES_BUCKET}</code>.
                  </p>
                </label>
              </div>
            </div>

            {addCategoryError && (
              <div className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {addCategoryError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={closeAddCategory} disabled={isSavingCategory}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory} disabled={isSavingCategory}>
                {isSavingCategory ? "Saving..." : "Create category"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
