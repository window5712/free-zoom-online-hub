
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { loginSchema, LoginFormValues } from "@/schemas/auth";
import { toast } from "sonner";

interface LoginFormProps {
  onSuccess: () => void;
  onRegisterClick: () => void;
  signIn: (email: string, password: string) => Promise<{
    error: any | null;
    data: any | null;
  }>;
}

export function LoginForm({ onSuccess, onRegisterClick, signIn }: LoginFormProps) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const { error } = await signIn(values.email, values.password);
      if (error) throw error;
      toast.success("Successfully logged in!");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Login failed. Please try again.");
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Form>
      <p className="mt-4 text-sm text-center text-gray-600">
        Don't have an account?{" "}
        <button
          onClick={onRegisterClick}
          className="text-zoom-blue hover:underline"
        >
          Register
        </button>
      </p>
    </>
  );
}
