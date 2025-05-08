
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" })
    .refine(val => /^[a-zA-Z0-9_-]+$/.test(val), {
      message: "Username can only contain letters, numbers, underscores, and hyphens",
    }),
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters" }),
});

const Auth = () => {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { signIn, signUp, session } = useAuth();
  const navigate = useNavigate();
  
  // Create form instances
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      username: "",
      fullName: "",
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (session) {
      navigate("/");
    }
  }, [session, navigate]);

  const onLogin = async (values: z.infer<typeof loginSchema>) => {
    try {
      const { error } = await signIn(values.email, values.password);
      if (error) throw error;
      toast.success("Successfully logged in!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Login failed. Please try again.");
    }
  };

  const onRegister = async (values: z.infer<typeof registerSchema>) => {
    try {
      const { error } = await signUp(values.email, values.password, {
        username: values.username,
        fullName: values.fullName,
      });
      if (error) throw error;
      toast.success("Registration successful! Please verify your email.");
      setActiveTab("login");
    } catch (error: any) {
      toast.error(error.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-zoom-blue mb-2">ZoomFree</h1>
          <p className="text-gray-600">Free video conferencing for everyone</p>
        </div>
        
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <div className="mt-4">
                {activeTab === "login" ? (
                  <>
                    <CardTitle>Welcome back</CardTitle>
                    <CardDescription>Sign in to your account to continue</CardDescription>
                  </>
                ) : (
                  <>
                    <CardTitle>Create an account</CardTitle>
                    <CardDescription>Enter your details to register</CardDescription>
                  </>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <TabsContent value="login" className="mt-0">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
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
                      control={loginForm.control}
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
                    <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                      {loginForm.formState.isSubmitting ? "Signing in..." : "Sign in"}
                    </Button>
                  </form>
                </Form>
                <p className="mt-4 text-sm text-center text-gray-600">
                  Don't have an account?{" "}
                  <button
                    onClick={() => setActiveTab("register")}
                    className="text-zoom-blue hover:underline"
                  >
                    Register
                  </button>
                </p>
              </TabsContent>
              
              <TabsContent value="register" className="mt-0">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
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
                      control={registerForm.control}
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
                      control={registerForm.control}
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
                      control={registerForm.control}
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
                    <Button type="submit" className="w-full" disabled={registerForm.formState.isSubmitting}>
                      {registerForm.formState.isSubmitting ? "Registering..." : "Register"}
                    </Button>
                  </form>
                </Form>
                <p className="mt-4 text-sm text-center text-gray-600">
                  Already have an account?{" "}
                  <button
                    onClick={() => setActiveTab("login")}
                    className="text-zoom-blue hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
