"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
import { Project } from "@/app/generated/prisma/client";
import { format } from "date-fns";

const ProjectFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required"),
});

type ProjectFormData = z.infer<typeof ProjectFormSchema>;

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  project?: Project;
  title?: string;
}

export function ProjectModal({ isOpen, onClose, onSubmit, project, title = "Create Project" }: ProjectModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(ProjectFormSchema),
    defaultValues: project
      ? {
          name: project.name,
          description: project.description ?? "",
          status: project.status as any,
          startDate: format(new Date(project.startDate), "yyyy-MM-dd"),
          endDate: format(new Date(project.endDate), "yyyy-MM-dd"),
        }
      : {
          status: "ACTIVE",
          startDate: format(new Date(), "yyyy-MM-dd"),
          endDate: format(new Date(Date.now() + 30 * 86400000), "yyyy-MM-dd"),
        },
  });

  const handleClose = () => { reset(); onClose(); };
  const onFormSubmit = async (data: ProjectFormData) => {
    await onSubmit(data);
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <Input label="Project name *" placeholder="e.g. Mobile App Launch Q3" error={errors.name?.message} {...register("name")} />

        <Textarea label="Description" placeholder="What is this project about?" {...register("description")} />

        <Select label="Status" {...register("status")}>
          <option value="ACTIVE">Active</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Start date *" type="date" error={errors.startDate?.message} {...register("startDate")} />
          <Input label="End date *" type="date" error={errors.endDate?.message} {...register("endDate")} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>
            {project ? "Update Project" : "Create Project"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
