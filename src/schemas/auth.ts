
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const registerSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" })
    .refine(val => /^[a-zA-Z0-9_-]+$/.test(val), {
      message: "Username can only contain letters, numbers, underscores, and hyphens",
    }),
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
