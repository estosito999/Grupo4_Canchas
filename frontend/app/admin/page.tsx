// Ruta: frontend/app/admin/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";


export const dynamic = "force-dynamic";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  ApiError,
  ESTADOS,
  ROLES,
  actualizarUsuario,
  cambiarEstado,
  cambiarRol,
  crearUsuario,
  crearUsuarioSchema,
  editarUsuarioSchema,
  eliminarUsuario,
  listarUsuarios,
  rolLabels,
  type CrearUsuarioFormValues,
  type EditarUsuarioFormValues,
  type EstadoUsuario,
  type Rol,
  type Usuario,
} from "@/components/lib/api";
import { useAuth } from "@/components/lib/Navbar";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="motion-feedback mt-1 text-xs text-red-600">{message}</p>;
}

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

const labelClass = "text-xs font-medium text-slate-700";

/** Input reutilizable con su etiqueta y mensaje de error. */
function Campo({
  id,
  label,
  registro,
  error,
  type = "text",
  inputMode,
  autoComplete,
}: {
  id: string;
  label: string;
  registro: UseFormRegisterReturn;
  error?: string;
  type?: string;
  inputMode?: "numeric";
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className={inputClass}
        {...registro}
      />
      <FieldError message={error} />
    </div>
  );
}

/** Select reutilizable con su etiqueta y mensaje de error. */
function CampoSelect({
  id,
  label,
  registro,
  error,
  opciones,
}: {
  id: string;
  label: string;
  registro: UseFormRegisterReturn;
  error?: string;
  opciones: ReadonlyArray<{ valor: string; etiqueta: string }>;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <select id={id} className={inputClass} {...registro}>
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </div>
  );
}

const OPCIONES_ROL = ROLES.map((rol) => ({
  valor: rol,
  etiqueta: rolLabels[rol],
}));

const OPCIONES_ESTADO = ESTADOS.map((estado) => ({
  valor: estado,
  etiqueta: estado,
}));

/**
 * RF07: panel de administración. El Administrador lista todos los usuarios,
 * crea cuentas completas (RF01), cambia roles (RF05) y altera el estado
 * Activo/Bloqueado. La seguridad real está en el backend (JwtAuthGuard +
 * RolesGuard); aquí solo se ocultan las acciones no permitidas.
 */
export default function AdminPage() {
  const { usuario, loading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
  const [accionEnCurso, setAccionEnCurso] = useState<string | null>(null);

  const crearForm = useForm<CrearUsuarioFormValues>({
    resolver: zodResolver(crearUsuarioSchema),
    defaultValues: {
      nombres: "",
      apellido_paterno: "",
      apellido_materno: "",
      fecha_nacimiento: "",
      correo: "",
      celular: "",
      password: "",
      rol: "CLIENTE",
    },
  });

  const editarForm = useForm<EditarUsuarioFormValues>({
    resolver: zodResolver(editarUsuarioSchema),
    defaultValues: {
      nombres: "",
      apellido_paterno: "",
      apellido_materno: "",
      fecha_nacimiento: "",
      correo: "",
      celular: "",
      password: "",
      rol: "CLIENTE",
      estado: "Activo",
    },
  });

  const cargarUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarUsuarios();
      setUsers(data);
      setErrorGlobal(null);
    } catch (error) {
      setErrorGlobal(
        error instanceof ApiError
          ? error.message
          : "No se pudo cargar la lista de usuarios.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Protección de ruta: solo ADMINISTRADOR
  useEffect(() => {
    if (!authLoading && (!usuario || usuario.rol !== "ADMINISTRADOR")) {
      router.replace(usuario ? "/perfil" : "/auth/login");
    }
  }, [usuario, authLoading, router]);

  useEffect(() => {
      const init = async () => {
        if (usuario?.rol === "ADMINISTRADOR") {
          await cargarUsuarios();
        }
      };

      init();
    }, [usuario?.rol, cargarUsuarios]);

  const esMiCuenta = (u: Usuario) =>
    Boolean(usuario?.id) && u.id === usuario?.id;

  const abrirCreacion = () => {
    crearForm.reset();
    setErrorGlobal(null);
    setIsAddingUser(true);
  };

  const abrirEdicion = (u: Usuario) => {
    editarForm.reset({
      nombres: u.nombres,
      apellido_paterno: u.apellido_paterno,
      apellido_materno: u.apellido_materno,
      fecha_nacimiento: u.fecha_nacimiento,
      correo: u.correo,
      celular: u.celular,
      password: "",
      rol: u.rol,
      estado: u.estado ?? "Activo",
    });
    setErrorGlobal(null);
    setEditingUser(u);
  };

  // RF07: alta de usuarios con todos los datos (RF01) y rol elegido por el Admin
  const handleCrear = crearForm.handleSubmit(async (values) => {
    setAccionEnCurso("crear");
    setErrorGlobal(null);
    setMensaje(null);
    try {
      const creado = await crearUsuario(values);
      setUsers((prev) => [...prev, creado]);
      setMensaje(
        `Usuario ${creado.nombres} ${creado.apellido_paterno} creado con rol ${rolLabels[creado.rol]}.`,
      );
      crearForm.reset();
      setIsAddingUser(false);
    } catch (error) {
      setErrorGlobal(
        error instanceof ApiError
          ? error.message
          : "No se pudo crear el usuario.",
      );
    } finally {
      setAccionEnCurso(null);
    }
  });

  // RF07/RF06: edición completa (datos, rol, estado y contraseña opcional)
  const handleEditar = editarForm.handleSubmit(async (values) => {
    if (!editingUser?.id) return;
    setAccionEnCurso("editar");
    setErrorGlobal(null);
    setMensaje(null);
    try {
      const actualizado = await actualizarUsuario(editingUser.id, values);
      setUsers((prev) =>
        prev.map((u) => (u.id === actualizado.id ? actualizado : u)),
      );
      setMensaje(`Datos de ${actualizado.nombres} actualizados correctamente.`);
      setEditingUser(null);
    } catch (error) {
      setErrorGlobal(
        error instanceof ApiError
          ? error.message
          : "No se pudo actualizar el usuario.",
      );
    } finally {
      setAccionEnCurso(null);
    }
  });

  // RF05/RF07: cambio de rol
  const handleRol = async (u: Usuario, rol: Rol) => {
    if (!u.id) return;
    setAccionEnCurso(`rol-${u.id}`);
    setErrorGlobal(null);
    setMensaje(null);
    try {
      const actualizado = await cambiarRol(u.id, rol);
      setUsers((prev) =>
        prev.map((item) => (item.id === actualizado.id ? actualizado : item)),
      );
      setMensaje(
        `${actualizado.nombres} ahora tiene el rol ${rolLabels[actualizado.rol]}.`,
      );
    } catch (error) {
      setErrorGlobal(
        error instanceof ApiError
          ? error.message
          : "No se pudo cambiar el rol.",
      );
      void cargarUsuarios();
    } finally {
      setAccionEnCurso(null);
    }
  };

  // RF07: activar / bloquear cuenta
  const handleEstado = async (u: Usuario) => {
    if (!u.id) return;
    const nuevoEstado: EstadoUsuario =
      u.estado === "Activo" ? "Bloqueado" : "Activo";
    setAccionEnCurso(`estado-${u.id}`);
    setErrorGlobal(null);
    setMensaje(null);
    try {
      const actualizado = await cambiarEstado(u.id, nuevoEstado);
      setUsers((prev) =>
        prev.map((item) => (item.id === actualizado.id ? actualizado : item)),
      );
      setMensaje(`${actualizado.nombres} quedó en estado ${actualizado.estado}.`);
    } catch (error) {
      setErrorGlobal(
        error instanceof ApiError
          ? error.message
          : "No se pudo cambiar el estado de la cuenta.",
      );
      void cargarUsuarios();
    } finally {
      setAccionEnCurso(null);
    }
  };

  // RF07: eliminar usuario
  const handleEliminar = async (u: Usuario) => {
    if (!u.id) return;
    const confirmado = window.confirm(
      `¿Eliminar a ${u.nombres} ${u.apellido_paterno}? Sus datos se conservarán en el sistema, pero su cuenta dejará de estar disponible.`,
    );
    if (!confirmado) return;

    setAccionEnCurso(`eliminar-${u.id}`);
    setErrorGlobal(null);
    setMensaje(null);
    try {
      await eliminarUsuario(u.id);
      setUsers((prev) => prev.filter((item) => item.id !== u.id));
      setMensaje(`Usuario ${u.nombres} ${u.apellido_paterno} eliminado.`);
    } catch (error) {
      setErrorGlobal(
        error instanceof ApiError
          ? error.message
          : "No se pudo eliminar el usuario.",
      );
    } finally {
      setAccionEnCurso(null);
    }
  };

  const usuariosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return users;
    return users.filter((u) => {
      const nombreCompleto =
        `${u.nombres} ${u.apellido_paterno} ${u.apellido_materno}`.toLowerCase();
      return (
        nombreCompleto.includes(termino) ||
        u.correo.toLowerCase().includes(termino) ||
        u.celular.includes(termino)
      );
    });
  }, [users, busqueda]);

  const ocupado = accionEnCurso !== null;

  return (
    <div className="container mx-auto max-w-7xl p-4">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Panel de Administración
          </h1>
          <p className="text-sm text-slate-600">
            RF07: alta de usuarios, roles y estados. Solo el Administrador crea
            cuentas, cambia roles, bloquea o elimina usuarios.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={abrirCreacion}
            className="motion-button rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            + Agregar Usuario
          </button>
          <button
            type="button"
            onClick={() => router.push("/empleado")}
            className="motion-button rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
          >
            Ver Directorio de Clientes
          </button>
        </div>
      </div>

      {errorGlobal && (
        <div role="alert" className="motion-feedback mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorGlobal}
        </div>
      )}
      {mensaje && (
        <div role="status" className="motion-feedback mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {mensaje}
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, correo o celular..."
          className="w-full rounded-xl border border-slate-300 bg-white p-3 shadow-sm outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-600">
          Cargando usuarios...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-700">
              <tr>
                <th className="border-b px-4 py-3">Nombre completo</th>
                <th className="border-b px-4 py-3">Correo</th>
                <th className="border-b px-4 py-3">Verificaci?n</th>
                <th className="border-b px-4 py-3">Celular</th>
                <th className="border-b px-4 py-3">Nacimiento</th>
                <th className="border-b px-4 py-3">Rol</th>
                <th className="border-b px-4 py-3">Estado</th>
                <th className="border-b px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((u) => {
                const propio = esMiCuenta(u);
                const bloqueado = u.estado === "Bloqueado";
                return (
                  <tr
                    key={String(u.id)}
                    className="border-b transition-colors last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {`${u.nombres} ${u.apellido_paterno} ${u.apellido_materno}`}
                      {propio && (
                        <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          Tú
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.correo}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${u.correo_verificado ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{u.correo_verificado ? "Verificado" : "No verificado"}</span></td>
                    <td className="px-4 py-3 text-slate-600">{u.celular}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {u.fecha_nacimiento}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.rol}
                        disabled={ocupado || propio}
                        onChange={(e) => void handleRol(u, e.target.value as Rol)}
                        className="cursor-pointer rounded-lg border bg-white p-1.5 text-xs font-medium text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {ROLES.map((rol) => (
                          <option key={rol} value={rol}>
                            {rolLabels[rol]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          bloqueado
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {u.estado ?? "Activo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => abrirEdicion(u)}
                          className="motion-button rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={ocupado || propio}
                          onClick={() => void handleEstado(u)}
                          className={`motion-button rounded-lg px-3 py-1 text-xs font-semibold text-white disabled:opacity-60 ${
                            bloqueado
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "bg-amber-600 hover:bg-amber-700"
                          }`}
                        >
                          {bloqueado ? "Activar" : "Bloquear"}
                        </button>
                        <button
                          type="button"
                          disabled={ocupado || propio}
                          onClick={() => void handleEliminar(u)}
                          className="motion-button rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {usuariosFiltrados.length === 0 && (
            <div className="p-6 text-center text-slate-500">
              No se encontraron usuarios con ese criterio.
            </div>
          )}
        </div>
      )}

      {/* RF07: modal de creación con TODOS los campos normalizados (RF01/RNF02) */}
      {isAddingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="motion-dialog max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">
              Crear Nuevo Usuario
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Nombres y apellidos separados, fecha de nacimiento (mayor de 18),
              correo, celular, contraseña y rol. El correo de confirmación se
              envía automáticamente (RF04).
            </p>

            <form
              onSubmit={handleCrear}
              className="mt-4 grid gap-3 md:grid-cols-2"
              noValidate
            >
              <div className="md:col-span-2">
                <Campo
                  id="crear-nombres"
                  label="Nombres"
                  autoComplete="given-name"
                  registro={crearForm.register("nombres")}
                  error={crearForm.formState.errors.nombres?.message}
                />
              </div>
              <Campo
                id="crear-paterno"
                label="Apellido paterno"
                autoComplete="family-name"
                registro={crearForm.register("apellido_paterno")}
                error={crearForm.formState.errors.apellido_paterno?.message}
              />
              <Campo
                id="crear-materno"
                label="Apellido materno"
                registro={crearForm.register("apellido_materno")}
                error={crearForm.formState.errors.apellido_materno?.message}
              />
              <Campo
                id="crear-nacimiento"
                label="Fecha de nacimiento"
                type="date"
                registro={crearForm.register("fecha_nacimiento")}
                error={crearForm.formState.errors.fecha_nacimiento?.message}
              />
              <Campo
                id="crear-celular"
                label="Celular"
                inputMode="numeric"
                registro={crearForm.register("celular")}
                error={crearForm.formState.errors.celular?.message}
              />
              <div className="md:col-span-2">
                <Campo
                  id="crear-correo"
                  label="Correo"
                  type="email"
                  autoComplete="email"
                  registro={crearForm.register("correo")}
                  error={crearForm.formState.errors.correo?.message}
                />
              </div>
              <Campo
                id="crear-password"
                label="Contraseña"
                type="password"
                autoComplete="new-password"
                registro={crearForm.register("password")}
                error={crearForm.formState.errors.password?.message}
              />
              <CampoSelect
                id="crear-rol"
                label="Rol (RF05)"
                opciones={OPCIONES_ROL}
                registro={crearForm.register("rol")}
                error={crearForm.formState.errors.rol?.message}
              />

              <div className="flex justify-end gap-2 pt-2 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="motion-button rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={ocupado}
                  className="motion-button rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {accionEnCurso === "crear" ? "Creando..." : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RF07: modal de edición completa (datos, rol, estado y contraseña) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="motion-dialog max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">
              Editar Usuario
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Deja la contraseña vacía para conservarla. Al guardar se aplican las
              mismas validaciones del registro (RF02/RF06).
            </p>

            <form
              onSubmit={handleEditar}
              className="mt-4 grid gap-3 md:grid-cols-2"
              noValidate
            >
              <div className="md:col-span-2">
                <Campo
                  id="editar-nombres"
                  label="Nombres"
                  registro={editarForm.register("nombres")}
                  error={editarForm.formState.errors.nombres?.message}
                />
              </div>
              <Campo
                id="editar-paterno"
                label="Apellido paterno"
                registro={editarForm.register("apellido_paterno")}
                error={editarForm.formState.errors.apellido_paterno?.message}
              />
              <Campo
                id="editar-materno"
                label="Apellido materno"
                registro={editarForm.register("apellido_materno")}
                error={editarForm.formState.errors.apellido_materno?.message}
              />
              <Campo
                id="editar-nacimiento"
                label="Fecha de nacimiento"
                type="date"
                registro={editarForm.register("fecha_nacimiento")}
                error={editarForm.formState.errors.fecha_nacimiento?.message}
              />
              <Campo
                id="editar-celular"
                label="Celular"
                inputMode="numeric"
                registro={editarForm.register("celular")}
                error={editarForm.formState.errors.celular?.message}
              />
              <div className="md:col-span-2">
                <Campo
                  id="editar-correo"
                  label="Correo"
                  type="email"
                  registro={editarForm.register("correo")}
                  error={editarForm.formState.errors.correo?.message}
                />
              </div>
              <Campo
                id="editar-password"
                label="Nueva contraseña (opcional)"
                type="password"
                autoComplete="new-password"
                registro={editarForm.register("password")}
                error={editarForm.formState.errors.password?.message}
              />
              <CampoSelect
                id="editar-rol"
                label="Rol (RF05)"
                opciones={OPCIONES_ROL}
                registro={editarForm.register("rol")}
                error={editarForm.formState.errors.rol?.message}
              />
              <CampoSelect
                id="editar-estado"
                label="Estado de la cuenta (RF07)"
                opciones={OPCIONES_ESTADO}
                registro={editarForm.register("estado")}
                error={editarForm.formState.errors.estado?.message}
              />

              <div className="flex justify-end gap-2 pt-2 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="motion-button rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={ocupado}
                  className="motion-button rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  {accionEnCurso === "editar" ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
