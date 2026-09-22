// Ruta: frontend/app/auth/registro/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ApiError,
  registrarUsuario,
  registroSchema,
  toUsuarioFromRegistro,
  type RegistroFormValues,
} from "@/components/lib/api";
import { useAuth } from "@/components/lib/Navbar";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

export default function RegistroPage() {
  const { login } = useAuth();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegistroFormValues>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      nombres: "",
      apellido_paterno: "",
      apellido_materno: "",
      fecha_nacimiento: "",
      correo: "",
      celular: "",
      password: "",
      confirmar_password: "",
    },
  });

  async function onSubmit(values: RegistroFormValues) {
    setGlobalError(null);
    setSuccess(null);

    const payload = {
      nombres: values.nombres,
      apellido_paterno: values.apellido_paterno,
      apellido_materno: values.apellido_materno,
      fecha_nacimiento: values.fecha_nacimiento,
      correo: values.correo,
      celular: values.celular,
      password: values.password,
    };

    try {
      const response = await registrarUsuario(payload);
      const usuario = response.usuario ?? toUsuarioFromRegistro(values);
      if (response.token) {
        login(usuario, response.token);
      }
      setSuccess(
        response.message ?? "Cuenta creada. Revisa tu correo para verificar tu dirección.",
      );
      // Mantener visible el resultado del envío; el enlace de inicio de sesión está debajo.
    } catch (error) {
      if (error instanceof ApiError && error.field) {
        setError(error.field as keyof RegistroFormValues, { message: error.message });
      }


      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo completar el registro. Inténtalo nuevamente.";
      setGlobalError(message);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none ring-emerald-600 transition focus:border-emerald-600 focus:ring-2";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-slate-900">Crear cuenta</h1>
        <p className="mt-2 text-sm text-slate-600">
          Completa tus datos. Validamos mayoría de edad, formato de correo y celular.
          El correo y el celular deben ser únicos.
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

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="md:col-span-2">
            <label htmlFor="nombres" className="text-sm font-medium text-slate-700">
              Nombres
            </label>
            <input id="nombres" className={inputClass} autoComplete="given-name" {...register("nombres")} />
            <FieldError message={errors.nombres?.message} />
          </div>

          <div>
            <label htmlFor="apellido_paterno" className="text-sm font-medium text-slate-700">
              Apellido paterno
            </label>
            <input
              id="apellido_paterno"
              className={inputClass}
              autoComplete="family-name"
              {...register("apellido_paterno")}
            />
            <FieldError message={errors.apellido_paterno?.message} />
          </div>

          <div>
            <label htmlFor="apellido_materno" className="text-sm font-medium text-slate-700">
              Apellido materno
            </label>
            <input id="apellido_materno" className={inputClass} {...register("apellido_materno")} />
            <FieldError message={errors.apellido_materno?.message} />
          </div>

          <div>
            <label htmlFor="fecha_nacimiento" className="text-sm font-medium text-slate-700">
              Fecha de nacimiento
            </label>
            <input id="fecha_nacimiento" type="date" className={inputClass} {...register("fecha_nacimiento")} />
            <FieldError message={errors.fecha_nacimiento?.message} />
          </div>

          <div>
            <label htmlFor="celular" className="text-sm font-medium text-slate-700">
              Celular
            </label>
            <input id="celular" inputMode="numeric" className={inputClass} {...register("celular")} />
            <FieldError message={errors.celular?.message} />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="correo" className="text-sm font-medium text-slate-700">
              Correo
            </label>
            <input id="correo" type="email" autoComplete="email" className={inputClass} {...register("correo")} />
            <FieldError message={errors.correo?.message} />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className={inputClass}
              {...register("password")}
            />
            <FieldError message={errors.password?.message} />
          </div>

          <div>
            <label htmlFor="confirmar_password" className="text-sm font-medium text-slate-700">
              Confirmar contraseña
            </label>
            <input
              id="confirmar_password"
              type="password"
              autoComplete="new-password"
              className={inputClass}
              {...register("confirmar_password")}
            />
            <FieldError message={errors.confirmar_password?.message} />
          </div>

          <div className="md:col-span-2 mt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creando cuenta..." : "Registrarme"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="font-semibold text-emerald-700 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
