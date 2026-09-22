// Ruta: frontend/components/lib/Navbar.tsx
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
  cerrarSesion,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
  type Rol,
  type Usuario,
} from "@/components/lib/api";

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
    setUsuario(getStoredUser());
    setToken(getStoredToken());
    setLoading(false);
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
      // El cierre de sesión local debe funcionar aunque el backend no responda.
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
      isAuthenticated: Boolean(usuario),
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
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
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
      ? [{ href: "/perfil", label: "Panel Admin" }]
      : usuario?.rol === "EMPLEADO"
        ? [{ href: "/perfil", label: "Gestión" }]
        : usuario?.rol === "CLIENTE"
          ? [{ href: "/perfil", label: "Mis Reservas" }]
          : [];

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-900/40 bg-emerald-950/95 text-white backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-400 text-emerald-950">
            C
          </span>
          <span>
            Canchas <span className="text-lime-300">Grupo 4</span>
          </span>
        </Link>

        <button
          type="button"
          className="inline-flex items-center rounded-lg border border-emerald-700 px-3 py-2 text-sm md:hidden"
          aria-expanded={open}
          aria-label="Abrir menú"
          onClick={() => setOpen((value) => !value)}
        >
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
                className="rounded-lg px-3 py-2 text-sm font-medium text-emerald-50 hover:bg-red-700 hover:text-white disabled:opacity-60"
              >
                {loggingOut ? "Cerrando..." : "Cerrar Sesión"}
              </button>
              {usuario && (
                <span className="ml-2 rounded-full bg-lime-400 px-3 py-1 text-xs font-semibold text-emerald-950">
                  {roleLabel[usuario.rol]}
                </span>
              )}
            </>
          )}
        </div>
      </nav>

      {open && (
        <div className="flex flex-col gap-1 border-t border-emerald-800 px-4 py-3 md:hidden">
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
                className="rounded-lg px-3 py-2 text-left text-sm font-medium text-emerald-50 hover:bg-red-700"
              >
                {loggingOut ? "Cerrando..." : "Cerrar Sesión"}
              </button>
              {usuario && (
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
