
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthHeader } from "@/components/auth/AuthHeader";

const Auth = () => {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { signIn, signUp, session } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (session) {
      navigate("/");
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthHeader 
          title="ZoomFree" 
          description="Free video conferencing for everyone" 
        />
        
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
                <LoginForm 
                  onSuccess={() => navigate("/")}
                  onRegisterClick={() => setActiveTab("register")}
                  signIn={signIn}
                />
              </TabsContent>
              
              <TabsContent value="register" className="mt-0">
                <RegisterForm 
                  onSuccess={() => setActiveTab("login")}
                  onLoginClick={() => setActiveTab("login")}
                  signUp={signUp}
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
