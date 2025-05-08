
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
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { registerSchema, RegisterFormValues } from "@/schemas/auth";
import { toast } from "sonner";

interface RegisterFormProps {
  onSuccess: () => void;
  onLoginClick: () => void;
  signUp: (email: string, password: string, userData: any) => Promise<{
    error: any | null;
    data: any | null;
  }>;
}

export function RegisterForm({ onSuccess, onLoginClick, signUp }: RegisterFormProps) {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      username: "",
      fullName: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const { error } = await signUp(values.email, values.password, {
        username: values.username,
        fullName: values.fullName,
      });
      if (error) throw error;
      toast.success("Registration successful! Please verify your email.");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Registration failed. Please try again.");
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
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Username
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <span className="ml-1 text-xs text-blue-500 cursor-help">[?]</span>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <p className="text-sm">
                        Username can only contain letters, numbers, underscores, and hyphens.
                        It will be visible to other users.
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                </FormLabel>
                <FormControl>
                  <Input placeholder="johndoe" {...field} />
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
            {form.formState.isSubmitting ? "Registering..." : "Register"}
          </Button>
        </form>
      </Form>
      <p className="mt-4 text-sm text-center text-gray-600">
        Already have an account?{" "}
        <button
          onClick={onLoginClick}
          className="text-zoom-blue hover:underline"
        >
          Sign in
        </button>
      </p>
    </>
  );
}
