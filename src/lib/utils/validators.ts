import { z } from "zod";
import { LIMITS, SUPPORTED_FILE_TYPES } from "./constants";

export const fileValidator = z.object({
  name: z.string().min(1),
  size: z.number().max(LIMITS.maxFileSize, "File must be less than 10MB"),
  type: z.string().refine(
    (val) => Object.keys(SUPPORTED_FILE_TYPES).includes(val),
    { message: "Only PDF files are supported" }
  ),
});

export const messageValidator = z
  .string()
  .min(1, "Message cannot be empty")
  .max(LIMITS.maxMessageLength, `Message must be under ${LIMITS.maxMessageLength} characters`);

export const uuidValidator = z.string().uuid("Invalid ID format");

export const paginationValidator = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});