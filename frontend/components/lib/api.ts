// Ruta: frontend/components/lib/api.ts
import { z } from "zod";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

export const TOKEN_STORAGE_KEY = "canchas.auth.token";
export const USER_STORAGE_KEY = "canchas.auth.user";

/** RF05: roles soportados por el sistema (deben coincidir con el backend). */
export const ROLES = ["ADMINISTRADOR", "EMPLEADO", "CLIENTE"] as const;
export type Rol = (typeof ROLES)[number];

/** RF07: estados posibles de una cuenta. */
export const ESTADOS = ["Activo", "Bloqueado"] as const;
export type EstadoUsuario = (typeof ESTADOS)[number];

/** Etiquetas legibles para la interfaz. */
export const rolLabels: Record<Rol, string> = {
  ADMINISTRADOR: "Administrador",
  EMPLEADO: "Empleado",
  CLIENTE: "Cliente",
};

export type Usuario = {
  id?: string | number;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  fecha_nacimiento: string;
  correo: string;
  celular: string;
  rol: Rol;
  estado?: EstadoUsuario;
  created_at?: string;
  updated_at?: string;
};

export type AuthResponse = {
  token?: string;
  usuario?: Usuario;
  message?: string;
};

export class ApiError extends Error {
  status: number;
  field?: string;
  details?: unknown;

  constructor(message: string, status = 500, field?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.field = field;
    this.details = details;
  }
}

function esMayorDeEdad(fechaISO: string): boolean {
  const nacimiento = new Date(`${fechaISO}T00:00:00`);
  if (Number.isNaN(nacimiento.getTime())) return false;

  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad -= 1;
  }
  return edad >= 18;
}

export const usuarioBaseSchema = z.object({
  nombres: z
    .string()
    .trim()
    .min(2, "Ingresa tus nombres (mínimo 2 caracteres)")
    .max(80, "Los nombres no pueden superar 80 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, "Los nombres solo pueden contener letras"),
  apellido_paterno: z
    .string()
    .trim()
    .min(2, "Ingresa tu apellido paterno")
    .max(60, "El apellido paterno no puede superar 60 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, "El apellido paterno solo puede contener letras"),
  apellido_materno: z
    .string()
    .trim()
    .min(2, "Ingresa tu apellido materno")
    .max(60, "El apellido materno no puede superar 60 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, "El apellido materno solo puede contener letras"),
  fecha_nacimiento: z
    .string()
    .min(1, "Selecciona tu fecha de nacimiento")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Usa el formato de fecha AAAA-MM-DD")
    .refine(esMayorDeEdad, "Debes ser mayor de 18 años para registrarte"),
  correo: z
    .string()
    .trim()
    .min(1, "Ingresa tu correo")
    .email("Ingresa un correo electrónico válido")
    .max(120, "El correo no puede superar 120 caracteres"),
  celular: z
    .string()
    .trim()
    .regex(/^\d{8,15}$/, "Ingresa un celular numérico válido (8 a 15 dígitos)"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(72, "La contraseña no puede superar 72 caracteres"),
});

export const registroSchema = usuarioBaseSchema
  .extend({
    confirmar_password: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmar_password, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar_password"],
  });

export const loginSchema = z.object({
  correo: z
    .string()
    .trim()
    .min(1, "Ingresa tu correo")
    .email("Ingresa un correo electrónico válido"),
  password: z.string().min(1, "Ingresa tu contraseña").min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const perfilSchema = usuarioBaseSchema.extend({
  password: z
    .string()
    .optional()
    .refine((value) => !value || value.length >= 8, {
      message: "La contraseña debe tener al menos 8 caracteres",
    }),
});

/**
 * RF07: creación de usuarios desde el panel de administración. Es el único
 * formulario donde se elige el rol (el registro público siempre es CLIENTE).
 */
export const crearUsuarioSchema = usuarioBaseSchema.extend({
  rol: z.enum(ROLES, { message: "Selecciona un rol válido" }),
});

/** RF07: edición completa desde el panel (contraseña opcional + estado). */
export const editarUsuarioSchema = usuarioBaseSchema.extend({
  password: z
    .string()
    .max(72, "La contraseña no puede superar 72 caracteres")
    .optional()
    .refine((value) => !value || value.length >= 8, {
      message: "La contraseña debe tener al menos 8 caracteres",
    }),
  rol: z.enum(ROLES, { message: "Selecciona un rol válido" }),
  estado: z.enum(ESTADOS, { message: "Selecciona un estado válido" }),
});

/**
 * RF08: el Empleado solo puede editar datos de contacto del cliente, sin rol,
 * estado, contraseña ni fecha de nacimiento.
 */
export const contactoClienteSchema = usuarioBaseSchema.pick({
  nombres: true,
  apellido_paterno: true,
  apellido_materno: true,
  correo: true,
  celular: true,
});

export type RegistroFormValues = z.infer<typeof registroSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type PerfilFormValues = z.infer<typeof perfilSchema>;
export type CrearUsuarioFormValues = z.infer<typeof crearUsuarioSchema>;
export type EditarUsuarioFormValues = z.infer<typeof editarUsuarioSchema>;
export type ContactoClienteFormValues = z.infer<typeof contactoClienteSchema>;

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (!token) {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function getStoredUser(): Usuario | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Usuario;
  } catch {
    return null;
  }
}

export function setStoredUser(usuario: Usuario | null): void {
  if (typeof window === "undefined") return;
  if (!usuario) {
    window.localStorage.removeItem(USER_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuario));
}

export function clearSession(): void {
  setStoredToken(null);
  setStoredUser(null);
}

type RequestOptions = {
  body?: unknown;
  token?: string | null;
  headers?: HeadersInit;
};

type ErrorPayload = {
  message?: string | string[];
  error?: string;
  field?: string;
  details?: unknown;
};

async function parseError(response: Response): Promise<ApiError> {
  let payload: ErrorPayload = {};

  try {
    payload = (await response.json()) as ErrorPayload;
  } catch {
    payload = {};
  }

  // class-validator devuelve `message` como arreglo: se toma el primer detalle
  // para que la interfaz siempre muestre un texto (nunca un array).
  const mensajes = Array.isArray(payload.message)
    ? payload.message
    : payload.message
      ? [payload.message]
      : [];

  const message =
    mensajes[0] ||
    payload.error ||
    (response.status === 401
      ? "Credenciales incorrectas. Verifica tu correo y contraseña."
      : response.status === 403
        ? "Tu rol no tiene permisos para realizar esta acción."
        : response.status === 409
          ? "El correo o el celular ya se encuentran registrados."
          : `Error ${response.status} al comunicarse con el servidor.`);

  return new ApiError(
    message,
    response.status,
    payload.field,
    payload.details ?? mensajes,
  );
}

export async function apiRequest<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = options.token ?? getStoredToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(
      "No se pudo conectar con el servidor. Inténtalo nuevamente cuando el backend esté disponible.",
      0,
    );
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => apiRequest<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>("PATCH", path, { ...options, body }), // <-- Agregado PATCH
  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>("DELETE", path, options),
};

export function registrarUsuario(payload: Omit<RegistroFormValues, "confirmar_password">) {
  return api.post<AuthResponse>("/auth/registro", {
    nombres: payload.nombres,
    apellido_paterno: payload.apellido_paterno,
    apellido_materno: payload.apellido_materno,
    fecha_nacimiento: payload.fecha_nacimiento,
    correo: payload.correo,
    celular: payload.celular,
    password: payload.password,
    rol: "CLIENTE" satisfies Rol,
  });
}

export function iniciarSesion(payload: LoginFormValues) {
  return api.post<AuthResponse>("/auth/login", {
    correo: payload.correo,
    password: payload.password,
  });
}

export function cerrarSesion() {
  return api.post<{ message?: string }>("/auth/logout");
}

export function obtenerPerfil() {
  return api.get<Usuario>("/auth/perfil");
}

export function actualizarPerfil(payload: PerfilFormValues) {
  const body: Record<string, unknown> = {
    nombres: payload.nombres,
    apellido_paterno: payload.apellido_paterno,
    apellido_materno: payload.apellido_materno,
    fecha_nacimiento: payload.fecha_nacimiento,
    correo: payload.correo,
    celular: payload.celular,
  };

  if (payload.password) {
    body.password = payload.password;
  }

  return api.put<Usuario>("/auth/perfil", body);
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}

// ---------------------------------------------------------------------------
// RF07: panel de administración (solo ADMINISTRADOR)
// ---------------------------------------------------------------------------

/** Lista completa de usuarios (incluye roles y estados). */
export function listarUsuarios() {
  return api.get<Usuario[]>("/users");
}

/** Alta completa de usuarios: el Administrador decide el rol. */
export function crearUsuario(payload: CrearUsuarioFormValues) {
  return api.post<Usuario>("/users", {
    nombres: payload.nombres,
    apellido_paterno: payload.apellido_paterno,
    apellido_materno: payload.apellido_materno,
    fecha_nacimiento: payload.fecha_nacimiento,
    correo: payload.correo,
    celular: payload.celular,
    password: payload.password,
    rol: payload.rol,
  });
}

/** Edición completa: datos, rol, estado y (opcionalmente) contraseña. */
export function actualizarUsuario(
  id: string | number,
  payload: EditarUsuarioFormValues,
) {
  const body: Record<string, unknown> = {
    nombres: payload.nombres,
    apellido_paterno: payload.apellido_paterno,
    apellido_materno: payload.apellido_materno,
    fecha_nacimiento: payload.fecha_nacimiento,
    correo: payload.correo,
    celular: payload.celular,
    rol: payload.rol,
    estado: payload.estado,
  };

  if (payload.password) {
    body.password = payload.password;
  }

  return api.patch<Usuario>(`/users/${id}`, body);
}

/** RF07: cambio de rol de un usuario. */
export function cambiarRol(id: string | number, rol: Rol) {
  return api.patch<Usuario>(`/users/${id}/role`, { rol });
}

/** RF07: activar o bloquear una cuenta. */
export function cambiarEstado(id: string | number, estado: EstadoUsuario) {
  return api.patch<Usuario>(`/users/${id}/status`, { estado });
}

/** RF07: eliminar un usuario. */
export function eliminarUsuario(id: string | number) {
  return api.delete<{ message: string }>(`/users/${id}`);
}

// ---------------------------------------------------------------------------
// RF08: directorio de clientes (ADMINISTRADOR y EMPLEADO)
// ---------------------------------------------------------------------------

/** Búsqueda de clientes por nombres, apellidos, correo o celular. */
export function buscarClientes(search = "") {
  const termino = search.trim();
  const query = termino ? `?search=${encodeURIComponent(termino)}` : "";
  return api.get<Usuario[]>(`/users/directory${query}`);
}

/**
 * RF08: edición LIMITADA del empleado. Solo datos de contacto del cliente.
 */
export function actualizarContactoCliente(
  id: string | number,
  payload: ContactoClienteFormValues,
) {
  return api.patch<Usuario>(`/users/${id}/contacto`, {
    nombres: payload.nombres,
    apellido_paterno: payload.apellido_paterno,
    apellido_materno: payload.apellido_materno,
    correo: payload.correo,
    celular: payload.celular,
  });
}

export function toUsuarioFromRegistro(
  values: RegistroFormValues,
  rol: Rol = "CLIENTE",
): Usuario {
  return {
    nombres: values.nombres,
    apellido_paterno: values.apellido_paterno,
    apellido_materno: values.apellido_materno,
    fecha_nacimiento: values.fecha_nacimiento,
    correo: values.correo,
    celular: values.celular,
    rol,
  };
}
