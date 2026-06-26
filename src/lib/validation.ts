/**
 * Validation schemas for hospital bed connect forms
 * Uses Zod for runtime schema validation
 */

import { z } from "zod";

export const allocateBedSchema = z.object({
  patient: z
    .string()
    .min(2, "Patient name must be at least 2 characters")
    .max(100, "Patient name must be less than 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Patient name can only contain letters and spaces"),

  type: z.enum(["critical", "post_op", "general", "pediatric", "maternity", "infectious"], {
    errorMap: () => ({ message: "Please select a valid patient type" }),
  }),

  bedId: z.string().min(1, "Please select a bed"),
});

export type AllocateBedFormData = z.infer<typeof allocateBedSchema>;

export const releaseBedSchema = z.object({
  bedId: z.string().min(1, "Bed ID is required"),
  reason: z
    .string()
    .min(5, "Reason must be at least 5 characters")
    .max(200, "Reason must be less than 200 characters")
    .optional(),
});

export type ReleaseBedFormData = z.infer<typeof releaseBedSchema>;

export const transferBedSchema = z.object({
  bedId: z.string().min(1, "Bed ID is required"),
  targetWard: z.string().min(2, "Target ward must be specified").max(100, "Ward name is too long"),
  reason: z
    .string()
    .min(5, "Reason must be at least 5 characters")
    .max(200, "Reason must be less than 200 characters")
    .optional(),
});

export type TransferBedFormData = z.infer<typeof transferBedSchema>;
