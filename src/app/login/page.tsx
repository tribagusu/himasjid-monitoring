"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Shield } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Redirecting to dashboard..." : "Access Dashboard"}
    </Button>
  );
}

export default function LoginPage() {
  const [error, setError] = useState<string>("");

  async function handleSubmit(formData: FormData) {
    setError("");
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">hiMasjid Monitoring</CardTitle>
          <CardDescription>
            Authorized access only. Enter your credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-md">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@himasjid.app"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret">Monitoring Secret</Label>
              <Input
                id="secret"
                name="secret"
                type="password"
                placeholder="••••••••••••"
                required
              />
            </div>

            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
