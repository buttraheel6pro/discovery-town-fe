/** Login request/response schemas for API authentication. */
import { z } from "zod";

export const loginRequestSchema = z.object({
  email: z.string().trim().email("Please enter a valid email"),
  password: z
    .string()
    .min(5, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
});

export const loginResponseSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
