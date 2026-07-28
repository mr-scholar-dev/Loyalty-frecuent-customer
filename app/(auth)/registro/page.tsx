import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrandMark } from "@/components/BrandMark";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Crear cuenta" };
export const dynamic = "force-dynamic";

export default async function RegistroPage() {
  // Already signed in → straight to the app (the gate decides trial vs active).
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2 text-center">
          <BrandMark className="mx-auto h-11 w-11" />
          <CardTitle className="text-xl">Crea tu servicentro</CardTitle>
          <CardDescription>
            Registra tu negocio en Loyalty Web en un minuto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RegisterForm />
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
