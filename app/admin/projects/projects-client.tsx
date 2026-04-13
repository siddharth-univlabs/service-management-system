"use client";

import { useState } from "react";
import { Plus, GripVertical, Image as ImageIcon } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import Button from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
};

type ProjectCategoryRow = {
  project_id: string;
  category_id: string;
};

type ProjectsClientProps = {
  initialProjects: ProjectRow[];
  initialCategories: CategoryRow[];
  initialProjectCategories: ProjectCategoryRow[];
};

export default function ProjectsClient({
  initialProjects,
  initialCategories,
  initialProjectCategories,
}: ProjectsClientProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [projects, setProjects] = useState(initialProjects);
  const [projectCategories, setProjectCategories] = useState(initialProjectCategories);

  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectImage, setNewProjectImage] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [editProjectImage, setEditProjectImage] = useState<File | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setIsSaving(true);

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || null,
      })
      .select()
      .single();

    if (projectError || !project) {
      console.error("Failed to create project:", projectError);
      setIsSaving(false);
      return;
    }

    let imagePath: string | null = null;

    if (newProjectImage) {
      const ext = newProjectImage.name.split(".").pop()?.toLowerCase() || "png";
      imagePath = `projects/${project.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("project-images") // Assuming you have or will create this bucket
        .upload(imagePath, newProjectImage, { upsert: true });

      if (!uploadError) {
        await supabase
          .from("projects")
          .update({ image_path: imagePath })
          .eq("id", project.id);
        
        project.image_path = imagePath;
      }
    }

    setProjects([...projects, project]);
    setIsAddProjectOpen(false);
    setNewProjectName("");
    setNewProjectDescription("");
    setNewProjectImage(null);
    setIsSaving(false);
    router.refresh();
  };

  const openEditProject = (project: ProjectRow) => {
    setEditingProject(project);
    setEditProjectName(project.name);
    setEditProjectDescription(project.description ?? "");
    setEditProjectImage(null);
  };

  const handleUpdateProject = async () => {
    if (!editingProject || !editProjectName.trim()) return;
    setIsSavingEdit(true);

    let imagePath = editingProject.image_path;

    if (editProjectImage) {
      const ext = editProjectImage.name.split(".").pop()?.toLowerCase() || "png";
      imagePath = `projects/${editingProject.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("project-images")
        .upload(imagePath, editProjectImage, { upsert: true });

      if (uploadError) {
        console.error("Failed to upload image:", uploadError);
        imagePath = editingProject.image_path; // Revert if upload failed
      }
    }

    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update({
        name: editProjectName.trim(),
        description: editProjectDescription.trim() || null,
        image_path: imagePath,
      })
      .eq("id", editingProject.id)
      .select()
      .single();

    if (updateError || !updatedProject) {
      console.error("Failed to update project:", updateError);
      setIsSavingEdit(false);
      return;
    }

    setProjects(projects.map(p => p.id === editingProject.id ? updatedProject : p));
    setEditingProject(null);
    setIsSavingEdit(false);
    router.refresh();
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const categoryId = draggableId;
    const sourceProjectId = source.droppableId === "unassigned" ? null : source.droppableId;
    const destProjectId = destination.droppableId === "unassigned" ? null : destination.droppableId;

    // Optimistic UI update
    const newMappings = projectCategories.filter(
      pc => !(pc.category_id === categoryId && pc.project_id === sourceProjectId)
    );
    
    if (destProjectId) {
      newMappings.push({ project_id: destProjectId, category_id: categoryId });
    }
    
    setProjectCategories(newMappings);

    // DB Update
    if (sourceProjectId) {
      await supabase
        .from("project_device_categories")
        .delete()
        .match({ project_id: sourceProjectId, category_id: categoryId });
    }
    
    if (destProjectId) {
      await supabase
        .from("project_device_categories")
        .insert({ project_id: destProjectId, category_id: categoryId });
    }

    router.refresh();
  };

  const getCategoriesForProject = (projectId: string) => {
    const assignedIds = projectCategories
      .filter(pc => pc.project_id === projectId)
      .map(pc => pc.category_id);
    return initialCategories.filter(c => assignedIds.includes(c.id));
  };

  const getUnassignedCategories = () => {
    const allAssignedIds = projectCategories.map(pc => pc.category_id);
    return initialCategories.filter(c => !allAssignedIds.includes(c.id));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Projects</h2>
        <Button onClick={() => setIsAddProjectOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Project
        </Button>
      </div>

      {isAddProjectOpen && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-medium text-foreground">New Project</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Name</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
                placeholder="e.g., AmSafex"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Description</label>
              <textarea
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
                placeholder="Brief description of the project"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Project Photo</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="projectImage"
                  accept="image/*"
                  onChange={(e) => setNewProjectImage(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => document.getElementById("projectImage")?.click()}
                  className="w-full justify-start text-left font-normal h-10"
                >
                  <ImageIcon className="w-4 h-4 mr-2 text-muted" />
                  <span className="truncate">
                    {newProjectImage ? newProjectImage.name : "Upload image (optional)"}
                  </span>
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsAddProjectOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateProject} disabled={isSaving || !newProjectName.trim()}>
                {isSaving ? "Saving..." : "Save Project"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingProject && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4 border-brand/50">
          <h3 className="font-medium text-foreground">Edit Project</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Name</label>
              <input
                type="text"
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
                placeholder="e.g., AmSafex"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Description</label>
              <textarea
                value={editProjectDescription}
                onChange={(e) => setEditProjectDescription(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
                placeholder="Brief description of the project"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Project Photo</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="editProjectImage"
                  accept="image/*"
                  onChange={(e) => setEditProjectImage(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => document.getElementById("editProjectImage")?.click()}
                  className="w-full justify-start text-left font-normal h-10"
                >
                  <ImageIcon className="w-4 h-4 mr-2 text-muted" />
                  <span className="truncate">
                    {editProjectImage ? editProjectImage.name : editingProject.image_path ? "Replace existing image" : "Upload image (optional)"}
                  </span>
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setEditingProject(null)}>Cancel</Button>
              <Button onClick={handleUpdateProject} disabled={isSavingEdit || !editProjectName.trim()}>
                {isSavingEdit ? "Updating..." : "Update Project"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Unassigned Categories */}
          <div className="lg:col-span-1 bg-surface-muted/30 border border-border/50 rounded-xl p-4 flex flex-col min-h-[500px]">
            <h3 className="font-medium text-foreground mb-4 flex items-center justify-between">
              Unassigned Categories
              <span className="bg-surface border border-border text-xs py-0.5 px-2 rounded-full text-muted">
                {getUnassignedCategories().length}
              </span>
            </h3>
            
            <Droppable droppableId="unassigned">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 space-y-2 rounded-lg transition-colors ${
                    snapshot.isDraggingOver ? "bg-brand/5 border border-brand/20 border-dashed" : ""
                  }`}
                >
                  {getUnassignedCategories().map((category, index) => (
                    <Draggable key={category.id} draggableId={category.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-surface border rounded-lg p-3 flex items-center gap-3 shadow-sm ${
                            snapshot.isDragging ? "border-brand shadow-md" : "border-border"
                          }`}
                        >
                          <GripVertical className="w-4 h-4 text-muted/50 flex-shrink-0" />
                          <div className="w-8 h-8 rounded bg-background border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {category.image_path ? (
                              <img src={category.image_path} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-muted/50" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-foreground truncate">
                            {category.name}
                          </span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Projects List */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map(project => (
              <div key={project.id} className="bg-surface border border-border rounded-xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border/50 bg-surface-muted/10 flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
                    {project.description && (
                      <p className="text-xs text-muted mt-1 line-clamp-2">{project.description}</p>
                    )}
                  </div>
                  <Button variant="ghost" onClick={() => openEditProject(project)} className="shrink-0 p-2 h-auto text-muted hover:text-foreground">
                    Edit
                  </Button>
                </div>
                
                <div className="p-4 flex-1">
                  <Droppable droppableId={project.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[150px] space-y-2 rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? "bg-brand/5 border border-brand/20 border-dashed p-2 -m-2" : ""
                        }`}
                      >
                        {getCategoriesForProject(project.id).length === 0 && !snapshot.isDraggingOver && (
                          <div className="h-full flex items-center justify-center min-h-[120px] border border-dashed border-border/50 rounded-lg">
                            <span className="text-xs text-muted text-center px-4">Drag categories here</span>
                          </div>
                        )}
                        
                        {getCategoriesForProject(project.id).map((category, index) => (
                          <Draggable key={`${project.id}-${category.id}`} draggableId={category.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-background border rounded-lg p-2 flex items-center gap-3 shadow-sm ${
                                  snapshot.isDragging ? "border-brand shadow-md" : "border-border"
                                }`}
                              >
                                <GripVertical className="w-4 h-4 text-muted/50 flex-shrink-0" />
                                <span className="text-sm font-medium text-foreground truncate">
                                  {category.name}
                                </span>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </DragDropContext>
    </div>
  );
}
