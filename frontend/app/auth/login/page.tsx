// Ruta: frontend/app/auth/login/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ApiError,
  iniciarSesion,
  isNetworkError,
  loginSchema,
  type LoginFormValues,
  type Rol,
  type Usuario,
} from "@/components/lib/api";
import { useAuth } from "@/components/lib/Navbar";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

function demoUsuarioDesdeCorreo(correo: string): Usuario {
  const normalized = correo.toLowerCase();
  const rol: Rol = normalized.includes("admin")
    ? "ADMINISTRADOR"
    : normalized.includes("empleado")
      ? "EMPLEADO"
      : "CLIENTE";

  return {
    nombres: "Usuario",
    apellido_paterno: "Demo",
    apellido_materno: "Local",
    fecha_nacimiento: "1998-01-15",
    correo,
    celular: "999999999",
    rol,
  };
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      correo: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setGlobalError(null);
    setSuccess(null);

    try {
      const response = await iniciarSesion(values);
      const usuario = response.usuario ?? demoUsuarioDesdeCorreo(values.correo);
      login(usuario, response.token ?? "session-token");
      setSuccess("Sesión iniciada correctamente. Cargando permisos del rol...");
      router.push("/perfil");
    } catch (error) {
      if (isNetworkError(error)) {
        const usuario = demoUsuarioDesdeCorreo(values.correo);
        login(usuario, "demo-token");
        setSuccess(
          `Backend no disponible. Sesión local de demostración como ${usuario.rol}. Usa un correo con "admin" o "empleado" para simular esos roles.`,
        );
        window.setTimeout(() => router.push("/perfil"), 900);
        return;
      }

      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo iniciar sesión. Inténtalo nuevamente.";
      setGlobalError(message);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none ring-emerald-600 transition focus:border-emerald-600 focus:ring-2";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-slate-900">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-slate-600">
          Ingresa tu correo y contraseña. El sistema validará tus credenciales y
          cargará los permisos de tu rol (RF03, RF05).
        </p>

        {globalError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {globalError}
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label htmlFor="correo" className="text-sm font-medium text-slate-700">
              Correo
            </label>
            <input
              id="correo"
              type="email"
              autoComplete="email"
              className={inputClass}
              {...register("correo")}
            />
            <FieldError message={errors.correo?.message} />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className={inputClass}
              {...register("password")}
            />
            <FieldError message={errors.password?.message} />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿No tienes cuenta?{" "}
          <Link href="/auth/registro" className="font-semibold text-emerald-700 hover:underline">
            Registrarse
          </Link>
        </p>
      </div>
    </main>
  );
}
