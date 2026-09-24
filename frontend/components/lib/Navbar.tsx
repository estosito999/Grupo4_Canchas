// Ruta: frontend/app/components/lib/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearSession,
  obtenerPerfil,
  ApiError,
  cerrarSesion,
  getStoredToken,
  setStoredToken,
  setStoredUser,
  type Rol,
  type Usuario,
} from "./api";

type AuthContextValue = {
  usuario: Usuario | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (usuario: Usuario, token?: string | null) => void;
  logout: () => Promise<void>;
  updateUsuario: (usuario: Usuario) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      const storedToken = getStoredToken();
      try {
        if (!storedToken || ['demo-token', 'session-token'].includes(storedToken)) {
          clearSession();
          return;
        }
        const profile = await obtenerPerfil();
        if (active) {
          setUsuario(profile);
          setStoredUser(profile);
          setToken(storedToken);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) clearSession();
      } finally {
        if (active) setLoading(false);
      }
    };
    void restore();
    return () => { active = false; };
  }, []);

  const login = useCallback((nextUser: Usuario, nextToken?: string | null) => {
    setUsuario(nextUser);
    setStoredUser(nextUser);
    const resolvedToken = nextToken ?? getStoredToken();
    setToken(resolvedToken);
    setStoredToken(resolvedToken);
  }, []);

  const updateUsuario = useCallback((nextUser: Usuario) => {
    setUsuario(nextUser);
    setStoredUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await cerrarSesion();
    } catch {
      // Cierre de sesión local
    } finally {
      clearSession();
      setUsuario(null);
      setToken(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      token,
      loading,
      isAuthenticated: Boolean(usuario && token),
      login,
      logout,
      updateUsuario,
    }),
    [usuario, token, loading, login, logout, updateUsuario],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}

const roleLabel: Record<Rol, string> = {
  ADMINISTRADOR: "Administrador",
  EMPLEADO: "Empleado",
  CLIENTE: "Cliente",
};

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`motion-button rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-emerald-700 text-white"
          : "text-emerald-50 hover:bg-emerald-800 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const { usuario, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    setOpen(false);
    setLoggingOut(false);
    router.push("/");
  }

  const roleLinks =
    usuario?.rol === "ADMINISTRADOR"
      ? [{ href: "/admin", label: "Panel Admin" }]
      : usuario?.rol === "EMPLEADO"
        ? [{ href: "/empleado", label: "Directorio Clientes" }]
        : usuario?.rol === "CLIENTE"
          ? [{ href: "/perfil", label: "Mis Reservas" }]
          : [];

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-900/40 bg-emerald-950/95 text-white shadow-sm backdrop-blur">
      <nav aria-label="Navegación principal" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" onClick={() => setOpen(false)} className="group flex items-center gap-2 rounded-lg font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-400 text-emerald-950 transition-transform duration-300 motion-safe:group-hover:-rotate-12 motion-safe:group-hover:scale-105">
            C
          </span>
          <span>
            Canchas <span className="text-lime-300">Grupo 4</span>
          </span>
        </Link>

        <button
          type="button"
          className="motion-button inline-flex items-center gap-2 rounded-lg border border-emerald-700 px-3 py-2 text-sm md:hidden"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true" className="relative h-4 w-4">
            <span className={`absolute left-0 top-0.5 h-0.5 w-4 rounded-full bg-current transition-transform duration-200 motion-reduce:transition-none ${open ? "translate-y-1.5 rotate-45" : ""}`} />
            <span className={`absolute left-0 top-2 h-0.5 w-4 rounded-full bg-current transition-opacity duration-200 motion-reduce:transition-none ${open ? "opacity-0" : "opacity-100"}`} />
            <span className={`absolute left-0 top-3.5 h-0.5 w-4 rounded-full bg-current transition-transform duration-200 motion-reduce:transition-none ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
          </span>
          Menú
        </button>

        <div className="hidden items-center gap-1 md:flex">
          <NavLink href="/">Inicio</NavLink>
          {!loading && !isAuthenticated && (
            <>
              <NavLink href="/auth/login">Iniciar Sesión</NavLink>
              <NavLink href="/auth/registro">Registrarse</NavLink>
            </>
          )}
          {!loading && isAuthenticated && (
            <>
              {roleLinks.map((link) => (
                <NavLink key={link.label} href={link.href}>
                  {link.label}
                </NavLink>
              ))}
              <NavLink href="/perfil">Mi Perfil</NavLink>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="motion-button rounded-lg px-3 py-2 text-sm font-medium text-emerald-50 hover:bg-red-700 hover:text-white disabled:opacity-60"
              >
                {loggingOut ? "Cerrando..." : "Cerrar Sesión"}
              </button>
              {usuario?.rol && roleLabel[usuario.rol] && (
                <span className="ml-2 rounded-full bg-lime-400 px-3 py-1 text-xs font-semibold text-emerald-950">
                  {roleLabel[usuario.rol]}
                </span>
              )}
            </>
          )}
        </div>
      </nav>

      {open && (
        <div id="mobile-navigation" className="motion-menu flex flex-col gap-1 border-t border-emerald-800 px-4 py-3 md:hidden">
          <NavLink href="/" onClick={() => setOpen(false)}>
            Inicio
          </NavLink>
          {!isAuthenticated && (
            <>
              <NavLink href="/auth/login" onClick={() => setOpen(false)}>
                Iniciar Sesión
              </NavLink>
              <NavLink href="/auth/registro" onClick={() => setOpen(false)}>
                Registrarse
              </NavLink>
            </>
          )}
          {isAuthenticated && (
            <>
              {roleLinks.map((link) => (
                <NavLink key={link.label} href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </NavLink>
              ))}
              <NavLink href="/perfil" onClick={() => setOpen(false)}>
                Mi Perfil
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="motion-button rounded-lg px-3 py-2 text-left text-sm font-medium text-emerald-50 hover:bg-red-700 disabled:opacity-60"
              >
                {loggingOut ? "Cerrando..." : "Cerrar Sesión"}
              </button>
              {usuario?.rol && roleLabel[usuario.rol] && (
                <span className="mt-1 w-fit rounded-full bg-lime-400 px-3 py-1 text-xs font-semibold text-emerald-950">
                  {roleLabel[usuario.rol]}
                </span>
              )}
            </>
          )}
        </div>
      )}
    </header>
  );
}
