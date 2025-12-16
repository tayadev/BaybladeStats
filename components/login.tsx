"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";

export default function Login() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.target as HTMLFormElement);
    
    // Check password confirmation for sign up
    if (flow === "signUp") {
      const password = formData.get("password");
      const confirmPassword = formData.get("confirm-password");
      
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }
    }
    
    formData.set("flow", flow);
    
    try {
      await signIn("password", formData);
      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Logo />
          </div>
          <h3 className="mt-2 text-center text-lg font-bold text-foreground dark:text-foreground">
            {flow === "signUp" ? "Create new account" : "Sign in to your account"}
          </h3>
        </div>

        <Card className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {flow === "signUp" && (
                <div>
                  <Label
                    htmlFor="name-login-05"
                    className="text-sm font-medium text-foreground dark:text-foreground"
                  >
                    Name
                  </Label>
                  <Input
                    type="text"
                    id="name-login-05"
                    name="name"
                    autoComplete="name"
                    placeholder="Name"
                    className="mt-2"
                    required
                  />
                </div>
              )}

              <div>
                <Label
                  htmlFor="email-login-05"
                  className="text-sm font-medium text-foreground dark:text-foreground"
                >
                  Email
                </Label>
                <Input
                  type="email"
                  id="email-login-05"
                  name="email"
                  autoComplete="email"
                  placeholder="email@example.com"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor="password-login-05"
                  className="text-sm font-medium text-foreground dark:text-foreground"
                >
                  Password
                </Label>
                <Input
                  type="password"
                  id="password-login-05"
                  name="password"
                  autoComplete={flow === "signUp" ? "new-password" : "current-password"}
                  placeholder="Password"
                  className="mt-2"
                  minLength={8}
                  required
                />
                {flow === "signUp" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Password must be at least 8 characters
                  </p>
                )}
              </div>

              {flow === "signUp" && (
                <div>
                  <Label
                    htmlFor="confirm-password-login-05"
                    className="text-sm font-medium text-foreground dark:text-foreground"
                  >
                    Confirm password
                  </Label>
                  <Input
                    type="password"
                    id="confirm-password-login-05"
                    name="confirm-password"
                    autoComplete="new-password"
                    placeholder="Password"
                    className="mt-2"
                    minLength={8}
                    required
                  />
                </div>
              )}

              {error && (
                <div className="rounded-md bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="mt-4 w-full py-2 font-medium"
                disabled={loading}
              >
                {loading ? "Loading..." : flow === "signUp" ? "Create account" : "Sign in"}
              </Button>

              {/* {flow === "signUp" && (
                <p className="text-center text-xs text-muted-foreground dark:text-muted-foreground">
                  By signing in, you agree to our{" "}
                  <a
                    href="#"
                    className="capitalize text-primary hover:text-primary/90 dark:text-primary hover:dark:text-primary/90"
                  >
                    Terms of use
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="capitalize text-primary hover:text-primary/90 dark:text-primary hover:dark:text-primary/90"
                  >
                    Privacy policy
                  </a>
                </p>
              )} */}
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground dark:text-muted-foreground">
          {flow === "signUp" ? "Already have an account?" : "Don't have an account?"}{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setFlow(flow === "signUp" ? "signIn" : "signUp");
              setError(null);
            }}
            className="font-medium text-primary hover:text-primary/90 dark:text-primary hover:dark:text-primary/90 cursor-pointer"
          >
            {flow === "signUp" ? "Sign in" : "Sign up"}
          </a>
        </p>
      </div>
    </div>
  );
}
