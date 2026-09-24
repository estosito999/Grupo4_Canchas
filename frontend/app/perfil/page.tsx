// Ruta: frontend/app/perfil/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export const dynamic = "force-dynamic";

import {
  ApiError,
  api,             // <-- Agregado de su código para llamar a /auth/reenviar-verificacion
  obtenerPerfil,   // <-- Agregado para refrescar el perfil
  actualizarPerfil,
  isNetworkError,
  perfilSchema,
  type PerfilFormValues,
} from "@/components/lib/api";
import { useAuth } from "@/components/lib/Navbar";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

export default function PerfilPage() {
  const router = useRouter();
  const { usuario, loading, isAuthenticated, updateUsuario, logout } = useAuth(); // <-- Agregado logout
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nombres: "",
      apellido_paterno: "",
      apellido_materno: "",
      fecha_nacimiento: "",
      correo: "",
      celular: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!usuario) return;
    reset({
      nombres: usuario.nombres,
      apellido_paterno: usuario.apellido_paterno,
      apellido_materno: usuario.apellido_materno,
      fecha_nacimiento: usuario.fecha_nacimiento,
      correo: usuario.correo,
      celular: usuario.celular,
      password: "",
    });
  }, [usuario, reset]);

  // -----------------------------------------------------------------------
  // LÓGICA DE VERIFICACIÓN DE CORREO (Agregada de su código)
  // -----------------------------------------------------------------------

  // Refresca el perfil al regresar a la pestaña por si verificó el correo en otra ventana
  useEffect(() => {
    if (!isAuthenticated) return;
    const refresh = () => {
      obtenerPerfil()
        .then(updateUsuario)
        .catch((error) => {
          if (error instanceof ApiError && error.status === 401) {
            void logout();
            router.replace('/auth/login');
          }
        });
    };
    refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [isAuthenticated, updateUsuario, logout, router]);

  // Función para reenviar el correo de verificación
  async function sendVerification() {
    setSendingVerification(true);
    setGlobalError(null);
    setSuccess(null);
    try {
      const result = await api.post<{ message: string }>('/auth/reenviar-verificacion');
      setSuccess(result.message);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await logout();
        router.replace('/auth/login');
        return;
      }
      setGlobalError(error instanceof Error ? error.message : 'No se pudo enviar el correo.');
    } finally {
      setSendingVerification(false);
    }
  }

  // -----------------------------------------------------------------------
  // TU LÓGICA ORIGINAL
  // -----------------------------------------------------------------------

  async function onSubmit(values: PerfilFormValues) {
    setGlobalError(null);
    setSuccess(null);

    // 1. Clonar valores y eliminar 'password' si está vacío
    const payload = { ...values };
    if (!payload.password || payload.password.trim() === "") {
      delete payload.password;
    }

    try {
      const actualizado = await actualizarPerfil(payload);
      updateUsuario({
        ...usuario!,
        ...actualizado,
        nombres: actualizado.nombres ?? values.nombres,
        apellido_paterno: actualizado.apellido_paterno ?? values.apellido_paterno,
        apellido_materno: actualizado.apellido_materno ?? values.apellido_materno,
        fecha_nacimiento: actualizado.fecha_nacimiento ?? values.fecha_nacimiento,
        correo: actualizado.correo ?? values.correo,
        celular: actualizado.celular ?? values.celular,
      });
      setSuccess("Perfil actualizado correctamente.");
      reset({ ...values, password: "" }); // Limpiar campo de contraseña
    } catch (error) {
      if (error instanceof ApiError && error.field) {
        setError(error.field as keyof PerfilFormValues, { message: error.message });
      }

      if (isNetworkError(error) && usuario) {
        updateUsuario({
          ...usuario,
          nombres: values.nombres,
          apellido_paterno: values.apellido_paterno,
          apellido_materno: values.apellido_materno,
          fecha_nacimiento: values.fecha_nacimiento,
          correo: values.correo,
          celular: values.celular,
        });
        setSuccess("Cambios guardados localmente.");
        return;
      }

      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo actualizar el perfil. Inténtalo nuevamente.";
      setGlobalError(message);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none ring-emerald-600 transition focus:border-emerald-600 focus:ring-2";

  if (loading || !usuario) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-slate-600">Cargando perfil...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mi perfil</h1>

            {/* COMPONENTE VISUAL DE VERIFICACIÓN (Agregado de su código) */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className={usuario.correo_verificado ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                {usuario.correo_verificado ? 'Correo verificado' : 'Correo no verificado'}
              </span>
              {!usuario.correo_verificado && (
                <button
                  type="button"
                  onClick={sendVerification}
                  disabled={sendingVerification}
                  className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-50"
                >
                  {sendingVerification ? 'Enviando...' : 'Verificar correo'}
                </button>
              )}
            </div>

            <p className="mt-2 text-sm text-slate-600">
              Actualiza tu información de contacto. Se aplican las mismas validaciones
              del registro.
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            Rol: {usuario.rol}
          </span>
        </div>

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
            <input id="nombres" className={inputClass} {...register("nombres")} />
            <FieldError message={errors.nombres?.message} />
          </div>

          <div>
            <label htmlFor="apellido_paterno" className="text-sm font-medium text-slate-700">
              Apellido paterno
            </label>
            <input id="apellido_paterno" className={inputClass} {...register("apellido_paterno")} />
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
            <input id="correo" type="email" className={inputClass} {...register("correo")} />
            <FieldError message={errors.correo?.message} />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Nueva contraseña (opcional)
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className={inputClass}
              placeholder="Déjalo vacío para no cambiarla"
              {...register("password")}
            />
            <FieldError message={errors.password?.message} />
          </div>

          <div className="md:col-span-2 mt-2 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </button>
            <Link
              href="/"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Volver al inicio
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
