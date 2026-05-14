import { z } from 'zod';

export const uploadSchema = z.object({
  title: z.string().min(1),
  file: z.any(), // should be validated as File in actual logic
});

export const chatSchema = z.object({
  message: z.string().min(1),
  documentId: z.string().uuid().optional(),
});
