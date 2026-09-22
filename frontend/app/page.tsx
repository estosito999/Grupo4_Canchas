// Ruta: frontend/app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="relative overflow-hidden bg-emerald-950 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -left-10 top-10 h-64 w-64 rounded-full bg-lime-400 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-500 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-lime-300">
              Reserva fácil · Juega ya
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Bienvenido a la plataforma de reserva de canchas
            </h1>
            <p className="mt-5 max-w-xl text-lg text-emerald-100">
              Encuentra horarios, gestiona tu perfil y accede según tu rol:
              Cliente, Empleado o Administrador. Crea tu cuenta en minutos y
              empieza a reservar.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/registro"
                className="inline-flex items-center justify-center rounded-xl bg-lime-400 px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-lime-300"
              >
                Registrarse
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-xl border border-emerald-400 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Iniciar Sesión
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-emerald-700 bg-emerald-900/60 p-8 shadow-2xl">
            <h2 className="text-xl font-semibold">¿Qué puedes hacer?</h2>
            <ul className="mt-6 space-y-4 text-emerald-100">
              <li className="rounded-2xl bg-emerald-950/70 p-4">
                <strong className="text-lime-300">RF01 · Registro</strong>
                <p className="mt-1 text-sm">Crea tu usuario con datos personales validados.</p>
              </li>
              <li className="rounded-2xl bg-emerald-950/70 p-4">
                <strong className="text-lime-300">RF03 · Sesión</strong>
                <p className="mt-1 text-sm">Inicia y cierra sesión de forma segura.</p>
              </li>
              <li className="rounded-2xl bg-emerald-950/70 p-4">
                <strong className="text-lime-300">RF06 · Perfil</strong>
                <p className="mt-1 text-sm">Edita tu información de contacto cuando lo necesites.</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-900">Roles del sistema</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Al iniciar sesión se cargan los permisos correspondientes (RF05).
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              rol: "CLIENTE",
              titulo: "Cliente",
              desc: "Reserva canchas y administra tu perfil.",
            },
            {
              rol: "EMPLEADO",
              titulo: "Empleado",
              desc: "Apoya la operación diaria y la gestión de reservas.",
            },
            {
              rol: "ADMINISTRADOR",
              titulo: "Administrador",
              desc: "Supervisa usuarios, roles y la plataforma completa.",
            },
          ].map((item) => (
            <article
              key={item.rol}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                {item.rol}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{item.titulo}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
