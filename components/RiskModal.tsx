"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";
import { Risk } from "@/app/generated/prisma/client";

const RiskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  probability: z.enum(["LOW", "MEDIUM", "HIGH"]),
  impact: z.enum(["LOW", "MEDIUM", "HIGH"]),
  mitigation: z.string().optional(),
  status: z.enum(["OPEN", "MITIGATING", "RESOLVED", "ACCEPTED"]),
});

type RiskFormData = z.infer<typeof RiskFormSchema>;

interface RiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RiskFormData) => Promise<void>;
  risk?: Risk;
  title?: string;
}

export function RiskModal({ isOpen, onClose, onSubmit, risk, title = "Log Risk" }: RiskModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RiskFormData>({
    resolver: zodResolver(RiskFormSchema),
    defaultValues: risk
      ? {
          title: risk.title,
          description: risk.description ?? "",
          probability: risk.probability as any,
          impact: risk.impact as any,
          mitigation: risk.mitigation ?? "",
          status: risk.status as any,
        }
      : {
          probability: "MEDIUM",
          impact: "MEDIUM",
          status: "OPEN",
        },
  });

  const handleClose = () => { reset(); onClose(); };
  const onFormSubmit = async (data: RiskFormData) => {
    await onSubmit(data);
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <Input label="Risk title *" placeholder="e.g. API rate limiting causing failures" error={errors.title?.message} {...register("title")} />

        <Textarea label="Description" placeholder="Describe the risk in detail..." {...register("description")} />

        <div className="grid grid-cols-2 gap-4">
          <Select label="Probability *" {...register("probability")}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </Select>

          <Select label="Impact *" {...register("impact")}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </Select>
        </div>

        <Select label="Status *" {...register("status")}>
          <option value="OPEN">Open</option>
          <option value="MITIGATING">Mitigating</option>
          <option value="RESOLVED">Resolved</option>
          <option value="ACCEPTED">Accepted</option>
        </Select>

        <Textarea
          label="Mitigation plan"
          placeholder="How will you reduce or manage this risk?"
          rows={3}
          {...register("mitigation")}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>
            {risk ? "Update Risk" : "Log Risk"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
