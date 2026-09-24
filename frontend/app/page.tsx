import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import "./home.css";

function Arrow({ down = false }: { down?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={`h-5 w-5 ${down ? "rotate-90" : ""}`}
    >
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="home-page flex flex-1 flex-col">
      <section
        className="home-hero relative overflow-hidden text-white"
        aria-labelledby="home-title"
      >
        <div className="hero-glow" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 pb-12 pt-16 md:grid-cols-2 md:gap-10 md:py-24 lg:py-28">
          <div className="hero-copy">
            <p className="hero-eyebrow mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">
              <span className="h-px w-8 bg-lime-300" aria-hidden="true" />
              Canchas Grupo 4
            </p>
            <h1
              id="home-title"
              className="hero-title text-5xl font-bold leading-[1.06] tracking-[-0.045em] sm:text-6xl lg:text-7xl"
            >
              Menos vueltas.
              <br />
              <span className="text-lime-300">Más cancha.</span>
            </h1>
            <p className="hero-description mt-6 max-w-md text-base leading-relaxed text-emerald-100/80 sm:text-lg">
              El próximo partido empieza contigo. Crea tu cuenta, accede a tu
              espacio y mantén tus datos al día, todo en un solo lugar.
            </p>
            <div className="hero-actions mt-8 flex flex-wrap gap-3">
              <Link
                href="/auth/registro"
                className="motion-button hero-primary inline-flex items-center justify-center gap-4 rounded-xl bg-lime-300 px-6 py-3.5 text-sm font-bold text-emerald-950 hover:bg-lime-200"
              >
                Crear mi cuenta{" "}
                <span className="button-arrow">
                  <Arrow />
                </span>
              </Link>
              <Link
                href="/auth/login"
                className="motion-button inline-flex items-center justify-center rounded-xl border border-emerald-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                Iniciar sesión
              </Link>
            </div>
            <a
              href="#descubre"
              className="hero-scroll mt-10 inline-flex items-center gap-3 py-2 text-sm text-emerald-100/70 hover:text-lime-300"
            >
              <span className="scroll-icon flex h-9 w-9 items-center justify-center rounded-full border border-emerald-700">
                <Arrow down />
              </span>
              Descubre tu espacio
            </a>
          </div>
          <div className="court-scene" aria-hidden="true">
            <div className="court-halo" />
            <div className="court-board">
              <div className="court-board-top">
                <span>LA CANCHA TE ESPERA</span>
                <span>G4 / 01</span>
              </div>
              <svg className="court-svg" viewBox="0 0 400 440" fill="none">
                <defs>
                  <pattern
                    id="pitch-stripes"
                    width="350"
                    height="100"
                    patternUnits="userSpaceOnUse"
                  >
                    <rect
                      width="350"
                      height="50"
                      fill="white"
                      fillOpacity=".025"
                    />
                  </pattern>
                </defs>
                <rect
                  x="25"
                  y="25"
                  width="350"
                  height="390"
                  rx="3"
                  fill="url(#pitch-stripes)"
                />
                <g
                  className="court-lines"
                  stroke="#a7dfb4"
                  strokeOpacity=".65"
                  strokeWidth="1.6"
                >
                  <rect x="25" y="25" width="350" height="390" rx="3" />
                  <path d="M25 220h350M115 25v64h170V25M155 25v25h90V25M115 415v-64h170v64M155 415v-25h90v25" />
                  <circle cx="200" cy="220" r="48" />
                  <path d="M168 89a38 38 0 0 0 64 0M168 351a38 38 0 0 1 64 0" />
                </g>
                <circle cx="200" cy="220" r="4" fill="#c2f76a" />
                <path
                  className="court-play"
                  d="M100 310C145 300 115 245 200 220S270 140 295 120"
                  stroke="#c2f76a"
                  strokeWidth="2"
                  strokeDasharray="7 7"
                />
                <g className="court-player court-player-one">
                  <circle cx="100" cy="310" r="17" fill="#c2f76a" />
                  <text
                    x="100"
                    y="315"
                    textAnchor="middle"
                    fill="#123a2b"
                    fontSize="13"
                    fontWeight="700"
                  >
                    4
                  </text>
                </g>
                <g className="court-player court-player-two">
                  <circle cx="295" cy="120" r="17" fill="#c2f76a" />
                  <text
                    x="295"
                    y="125"
                    textAnchor="middle"
                    fill="#123a2b"
                    fontSize="13"
                    fontWeight="700"
                  >
                    7
                  </text>
                </g>
                <circle
                  className="court-ball"
                  cx="200"
                  cy="220"
                  r="10"
                  fill="white"
                  stroke="#163e2d"
                  strokeWidth="4"
                />
                <circle
                  cx="290"
                  cy="300"
                  r="12"
                  fill="#4e9d7b"
                  stroke="#a7dfb4"
                />
                <circle
                  cx="108"
                  cy="146"
                  r="12"
                  fill="#4e9d7b"
                  stroke="#a7dfb4"
                />
              </svg>
              <div className="court-board-bottom">
                <span>EL JUEGO NOS UNE.</span>
                <span className="flex gap-1">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            </div>
            <div className="court-note court-note-top">
              <span className="court-note-icon">↗</span>
              <div>
                <small>UN SOLO LUGAR</small>
                <strong>Tu equipo. Tu espacio.</strong>
              </div>
            </div>
            <div className="court-note court-note-bottom">
              <span className="court-note-icon">✓</span>
              <div>
                <small>DA EL PRIMER PASO</small>
                <strong>Nos vemos en la cancha.</strong>
              </div>
            </div>
          </div>
        </div>
        <div className="relative border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-100/65">
            <span>Conecta con el juego</span>
            <span>Tu cuenta · Tu perfil · Tu equipo</span>
          </div>
        </div>
      </section>
      <section
        id="descubre"
        className="mx-auto w-full max-w-6xl px-5 py-16 md:py-24"
        aria-labelledby="discover-title"
      >
        <Reveal>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Simple desde el inicio
              </p>
              <h2
                id="discover-title"
                className="text-3xl font-bold tracking-tight text-emerald-950 md:text-4xl"
              >
                Tu espacio, a un clic.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-slate-600">
              Menos tiempo en trámites. Más tiempo para lo que te gusta.
            </p>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              number: "01",
              title: "Crea tu cuenta",
              text: "Registra tus datos y forma parte de Canchas Grupo 4.",
              href: "/auth/registro",
              link: "Quiero registrarme",
              icon: "+",
            },
            {
              number: "02",
              title: "Entra a tu espacio",
              text: "Inicia sesión para acceder a las opciones de tu cuenta.",
              href: "/auth/login",
              link: "Iniciar sesión",
              icon: "↗",
            },
            {
              number: "03",
              title: "Mantén todo al día",
              text: "Actualiza tu información personal y tus datos de contacto.",
              href: "/perfil",
              link: "Ver mi perfil",
              icon: "☷",
            },
          ].map((item, index) => (
            <Reveal key={item.number} delay={index * 90} className="h-full">
              <article className="motion-card home-feature flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-7">
                <div className="flex items-center justify-between">
                  <span
                    className="feature-icon flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-2xl text-emerald-800"
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <span className="text-xs font-semibold tracking-widest text-slate-400">
                    {item.number}
                  </span>
                </div>
                <h3 className="mt-7 text-xl font-semibold tracking-tight text-emerald-950">
                  {item.title}
                </h3>
                <p className="mb-7 mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                  {item.text}
                </p>
                <Link
                  href={item.href}
                  className="feature-link inline-flex w-fit items-center gap-3 rounded text-sm font-semibold text-emerald-700"
                >
                  {item.link}
                  <span className="button-arrow">
                    <Arrow />
                  </span>
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
      <section
        className="mx-auto w-full max-w-6xl px-5 pb-16 md:pb-24"
        aria-labelledby="roles-title"
      >
        <Reveal>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-7 md:p-10">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <h2
                id="roles-title"
                className="text-2xl font-bold tracking-tight text-emerald-950"
              >
                Un equipo, diferentes roles.
              </h2>
              <p className="text-sm text-slate-600">
                Cada persona tiene su espacio.
              </p>
            </div>
            <div className="grid gap-7 md:grid-cols-3 md:gap-9">
              {[
                {
                  title: "Cliente",
                  desc: "Accede a tu cuenta y gestiona tu información personal.",
                },
                {
                  title: "Empleado",
                  desc: "Consulta el directorio de clientes y actualiza sus datos de contacto.",
                },
                {
                  title: "Administrador",
                  desc: "Administra usuarios, roles y estados desde tu panel.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="border-l-2 border-emerald-600/30 pl-5"
                >
                  <h3 className="font-semibold text-emerald-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>
      <footer className="border-t border-slate-200 px-5 py-7">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 text-xs text-slate-500">
          <span className="font-semibold text-emerald-900">
            Canchas Grupo 4
          </span>
          <a
            href="#home-title"
            className="inline-flex items-center gap-2 hover:text-emerald-700"
          >
            Volver arriba{" "}
            <span className="-rotate-90">
              <Arrow />
            </span>
          </a>
        </div>
      </footer>
    </main>
  );
}
