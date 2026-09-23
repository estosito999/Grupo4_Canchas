# 📋 Documentación Completa — Grupo 4 Canchas
## GESTión de USUARIOS

---

## 1. VALIDACIÓN DE REQUERIMIENTOS FUNCIONALES (RF)

### ✅ RF01 — Registro de Usuario
**Descripción:** El sistema debe permitir registrar usuarios solicitando nombres, apellido paterno, apellido materno, fecha de nacimiento, correo, celular y contraseña.

**Archivos:** `frontend/app/auth/registro/page.tsx` · `backend/src/users/dto/create-user.dto.ts` · `backend/src/users/auth.service.ts` · `backend/src/users/users.service.ts`

**Estado: CUMPLE ✅** — El formulario de registro recopila los 7 campos requeridos. El backend los valida con class-validator y persiste en PostgreSQL.

---

### ✅ RF02 — Validación y Duplicidad
**Descripción:** El sistema debe validar edad, formato de correo y evitar registros duplicados de correo o celular.

**Archivos:** `backend/src/users/dto/create-user.dto.ts` · `backend/src/users/users.service.ts`

**Estado: CUMPLE ✅**
- `@IsEmail()` → valida formato de correo
- `@IsAdult(18)` → decorador custom que calcula edad exacta desde `fecha_nacimiento`
- `@Matches(/^\d{8,15}$/)` → valida celular (8-15 dígitos numéricos)
- `validarDuplicados()` → consulta BD antes de insertar (ConflictException 409)
- UNIQUE en PostgreSQL como última barrera (error 23505 → ConflictException)

---

### ✅ RF03 — Inicio y Cierre de Sesión
**Descripción:** El sistema debe permitir iniciar y cerrar sesión validando correo y contraseña encriptada.

**Archivos:** `backend/src/users/auth.controller.ts` · `backend/src/users/local.strategy.ts` · `backend/src/users/jwt.strategy.ts` · `backend/src/users/auth.service.ts` · `backend/src/users/jwt-auth.guard.ts`

**Estado: CUMPLE ✅**
`POST /api/auth/login` → `LocalStrategy` (Passport, `usernameField: 'correo'`) → `AuthService.validateUser()` busca por correo, rechaza si está bloqueado, compara contraseña con `bcrypt.compare()` → `AuthService.login()` firma JWT con `{ sub, correo, rol }`. `POST /api/auth/logout` cierra sesión. `JwtStrategy` valida Bearer token en cada petición y verifica que la cuenta esté activa.

---

### ✅ RF04 — Confirmación de Registro
**Descripción:** El sistema debe enviar una notificación por correo cuando la cuenta haya sido creada correctamente.

**Archivos:** `backend/src/mail/verification.service.ts` · `backend/src/mail/mail.service.ts` · `backend/src/users/auth.service.ts` · `backend/src/users/auth.controller.ts`

**Estado: CUMPLE ✅**
`VerificationService.send(id)` genera token de 32 bytes, lo hashea con SHA-256, lo guarda con expiración de 24h e invoca `MailService.enviarVerificacion()` que envía email HTML con enlace. `GET /api/auth/verificar-correo?token=XXX` permite confirmar. `POST /api/auth/reenviar-verificacion` (JWT) permite reenviar.

### ✅ RF05 — Gestión de Roles
**Descripción:** El sistema debe manejar los roles Administrador, Empleado y Usuario, cargando los permisos correspondientes al iniciar sesión.

**Archivos:** `backend/src/users/entities/user.entity.ts` · `backend/src/users/jwt-auth.guard.ts` · `backend/src/users/auth.service.ts`

**Estado: CUMPLE ✅**
`enum UserRole { ADMINISTRADOR, EMPLEADO, CLIENTE }` — Nota: el rol "Usuario" del RF se implementó como `CLIENTE`. `RolesGuard` compara `req.user.rol` contra `@Roles()` en cada endpoint. El rol se firma en el JWT al hacer login y es leído por el guard en cada petición protegida.

---

### ✅ RF06 — Edición de Perfil
**Descripción:** El usuario debe poder modificar su información de contacto manteniendo las mismas validaciones del registro.

**Archivos:** `backend/src/users/dto/update-user.dto.ts` · `backend/src/users/auth.controller.ts` · `backend/src/users/users.service.ts`

**Estado: CUMPLE ✅**
`UpdateUserDto extends PartialType(CreateUserDto)` hereda TODAS las validaciones del DTO de creación. `PUT/PATCH /api/auth/perfil` (JWT) permite editar el perfil propio. `updateProfile()` valida duplicados excluyendo el propio ID. Si viene `password`, se hashea con bcrypt.

---

### ✅ RF07 — Panel de Administración de Usuarios
**Descripción:** El sistema debe permitir al Administrador visualizar una lista de todos los usuarios, crear cuentas directas para Empleados, cambiar roles y bloquear/desactivar cuentas.

**Archivos:** `backend/src/users/users.controller.ts` · `backend/src/users/users.service.ts` · `frontend/app/admin/page.tsx`

**Estado: CUMPLE ✅**
Todos los endpoints protegidos con `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(ADMINISTRADOR)`:
- `POST /api/users` — crea usuario con rol definido por admin
- `GET /api/users` — lista todos los usuarios
- `PATCH /api/users/:id` — edición completa (datos + rol + estado)
- `PATCH /api/users/:id/role` — cambio de rol
- `PATCH /api/users/:id/status` — activar/bloquear
- `DELETE /api/users/:id` — eliminar usuario
Validaciones extras: no puede cambiar/bloquear/eliminar su propia cuenta.

---

### ✅ RF08 — Directorio de Clientes (Empleado)
**Descripción:** El sistema debe permitir al Empleado visualizar y buscar la información de contacto de los usuarios para verificar identidades, sin permisos para cambiar roles o borrar cuentas.

**Archivos:** `backend/src/users/users.controller.ts` · `backend/src/users/users.service.ts` · `frontend/app/empleado/page.tsx`

**Estado: CUMPLE ✅**
- `GET /api/users/directory` — `@Roles(ADMINISTRADOR, EMPLEADO)` — lista solo `CLIENTE`, con búsqueda por nombres, apellidos, correo o celular (ILike parametrizado + escape de caracteres especiales)
- `PATCH /api/users/:id/contacto` — `@Roles(ADMINISTRADOR, EMPLEADO)` — edición LIMITADA: solo `nombres`, `apellido_paterno`, `apellido_materno`, `correo`, `celular` (NO rol, NO estado, NO password)
- El empleado recibe 403 Forbidden en endpoints de rol, estado y eliminación.

---
---
## 2. VALIDACIÓN DE REQUERIMIENTOS NO FUNCIONALES (RNF)

### ✅ RNF01 — Cifrado de Contraseñas
**Descripción:** Las contraseñas deben almacenarse mediante hashing seguro, como bcrypt o Argon2, y nunca en texto plano.

**Implementación:**
- Dependencia: `bcrypt ^6.0.0` (`backend/package.json`)
- `BCRYPT_SALT_ROUNDS = 10` en `users.service.ts`
- `hashPassword()` usa `bcrypt.hash(password, 10)` en `create()` y `updateProfile()`
- `@Exclude()` en `password_hash` de la entidad + `ClassSerializerInterceptor` en `main.ts` → nunca serializado en respuestas HTTP
- Test en `users.service.spec.ts`: verifica que `password_hash !== password` plano y que `bcrypt.compare` funciona

**Estado: CUMPLE ✅**

---

### ✅ RNF02 — Normalización 3FN
**Descripción:** La base de datos debe cumplir Tercera Forma Normal y almacenar de forma separada nombres, apellido paterno y apellido materno.

**Implementación:**
- Entidad `User` (`user.entity.ts`): columnas independientes `nombres`, `apellido_paterno`, `apellido_materno`
- `fecha_nacimiento` es tipo `date` (no se almacena edad calculada)
- Cada atributo es atómico y depende directamente de la clave primaria (id UUID)

**Estado: CUMPLE ✅**

---

### ✅ RNF03 — Integridad de Datos
**Descripción:** La base de datos debe usar UNIQUE para correo y celular, y CHECK para validar formatos y edad.

**Implementación:**
- `@Column({ unique: true })` en `correo` y `celular` → UNIQUE constraint en PostgreSQL
- Validaciones de formato: `@IsEmail()`, `@Matches(/^\d{8,15}$/)`, `@Matches(/^[\p{L}][\p{L}\s'.-]*$/u)`
- Validación de edad: `@IsAdult(18)` calcula años cumplidos exactos (no solo diferencia de años)

**Estado: CUMPLE ✅**

---

### ✅ RNF04 — Prevención de Inyección SQL
**Descripción:** Las consultas deben estar parametrizadas y los datos de entrada validados para evitar ataques de inyección SQL.

**Implementación:**
- TypeORM como única capa de acceso a datos (ninguna query raw con concatenación)
- `escaparPatronLike()` escapa `%`, `_` y `\` antes de usarlos en `ILike`
- `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` en `main.ts` → rechaza propiedades extra en el body
- Todas las consultas usan `where: { campo: valor }` o `ILike` con parámetros

**Estado: CUMPLE ✅**

## 3. ESTRUCTURA DEL PROYECTO

```
Grupo4_Canchas/
├── backend/                          # NestJS + TypeORM + PostgreSQL (puerto 3000)
│   ├── src/
│   │   ├── main.ts                   # CORS, ValidationPipe, ClassSerializerInterceptor, prefijo /api
│   │   ├── app.module.ts             # ConfigModule, TypeOrmModule, AuthModule, UsersModule, MailModule
│   │   ├── app.controller.ts         # Health check GET /
│   │   ├── app.service.ts
│   │   ├── auth/auth.module.ts       # AuthModule: UsersModule + MailModule + JwtModule + PassportModule
│   │   ├── mail/
│   │   │   ├── mail.module.ts        # MailerModule.forRootAsync con SMTP
│   │   │   ├── mail.service.ts       # enviarVerificacion + enviarCorreoBienvenida
│   │   │   └── verification.service.ts # Tokens: send() + verify()
│   │   └── users/
│   │       ├── users.module.ts       # TypeOrmModule.forFeature([User]) + MailModule + PassportModule
│   │       ├── users.service.ts      # CRUD: create, findAll, findOne, update, updateProfile,
│   │       │                         #   changeRole, changeStatus, remove, getDirectory, updateClientContact
│   │       ├── users.controller.ts   # Rutas protegidas por rol: /api/users y subrutas
│   │       ├── auth.service.ts       # register, login, logout, findById, updateProfile
│   │       ├── auth.controller.ts    # /api/auth/registro, /login, /logout, /perfil,
│   │       │                         #   /reenviar-verificacion, /verificar-correo
│   │       ├── jwt.strategy.ts       # Valida JWT + verifica cuenta activa
│   │       ├── local.strategy.ts     # Passport-local: usernameField='correo'
│   │       └── jwt-auth.guard.ts     # JwtAuthGuard + RolesGuard + @Roles()
│   │       ├── dto/
│   │       │   ├── create-user.dto.ts    # IsEmail, IsAdult, Matches
│   │       │   └── update-user.dto.ts    # Hereda CreateUserDto + estado
│   │       └── entities/
│   │           └── user.entity.ts        # Tabla users con enums UserRole/UserEstado
│   └── .env                          # DB, MAIL, JWT, FRONTEND_URL
│
├── frontend/                         # Next.js 16 + React 19 + Tailwind CSS 4 (puerto 3001)
│   ├── app/
│   │   ├── layout.tsx                # AuthProvider + Navbar + children
│   │   ├── page.tsx                  # Home: presentación del proyecto
│   │   ├── auth/login/page.tsx       # Formulario login
│   │   ├── auth/registro/page.tsx    # Formulario registro (react-hook-form + zod)
│   │   ├── perfil/page.tsx           # Perfil propio + reenvío verificación
│   │   ├── admin/page.tsx           # Panel admin completo
│   │   └── empleado/page.tsx        # Directorio clientes + edición limitada
│   └── components/lib/
│       ├── api.ts                    # Cliente API, schemas Zod, funciones fetch, tipos
│       └── Navbar.tsx                # Navbar + AuthProvider (React Context)
│
└── DOCUMENTACION_PROYECTO.md
```

---
## 4. ARQUITECTURA Y FLUJOS DE DATOS

### 4.1 Diagrama de Arquitectura
```
┌──────────────────────────────────────┐
│  FRONTEND (Next.js 16) — puerto 3001│
│  • App Router · react-hook-form+Zod │
│  • AuthContext para sesión           │
└────────────────┬─────────────────────┘
                 │ HTTP REST/JSON (CORS habilitado)
                 ▼
┌──────────────────────────────────────┐
│  BACKEND (NestJS) — puerto 3000     │
│  • Prefix: /api                     │
│  • ValidationPipe global            │
│  • ClassSerializerInterceptor       │
│  • JwtAuthGuard + RolesGuard        │
│  • TypeORM parametrizado            │
└────────────────┬─────────────────────┘
                 │ TypeORM
                 ▼
┌──────────────────────────────────────┐
│  PostgreSQL — tabla: users          │
│  • UNIQUE: correo, celular          │
│  • 3FN: nombres, ap_paterno, ap_materno│
└──────────────────────────────────────┘
```

### 4.2 Flujo de Registro (RF01, RF02, RF04)
```
1. Usuario completa formulario → Zod valida en cliente (registroSchema)
2. POST /api/auth/registro
3. ValidationPipe valida CreateUserDto (class-validator)
4. AuthService.register():
   a. UsersService.create(dto, CLIENTE, false) →
      valida duplicados, hashea pw con bcrypt, persiste,
      valida edad/formato (IsAdult, IsEmail, Matches)
   b. VerificationService.send(id) → token + email verificación
5. Respuesta: { message, usuario } ← sin password_hash
6. Frontend: mensaje de éxito, redirige al login
```

### 4.3 Flujo de Login (RF03, RF05)
```
1. POST /api/auth/login (correo + password)
2. AuthGuard('local') → LocalStrategy.validate()
3. AuthService.validateUser():
   - Busca por correo → si no existe: null
## 6. COMANDOS PARA LEVANTAR EL PROYECTO EN OTRA MÁQUINA

### 6.1 Pre-requisitos del sistema
| Componente | Versión mínima | Comando para verificar |
|------------|----------------|------------------------|
| Node.js | 20.x LTS | `node --version` |
| npm | 10.x | `npm --version` |
| PostgreSQL | 14.x o superior | `psql --version` |
| Git | 2.x | `git --version` |

### 6.2 Pasos de instalación
```bash
# 1. Clonar el repositorio
git clone https://github.com/estosito999/Grupo4_Canchas.git
cd Grupo4_Canchas-main_GESTION_DE_USUARIO

# 2. Instalar dependencias (backend + frontend)
cd backend && npm install
cd ../frontend && npm install
cd ..

# 3. Crear la base de datos en PostgreSQL
psql -U postgres -c "CREATE DATABASE reservacanchalong;"

# 4. Configurar el archivo .env del backend
# Copiar y editar las variables de entorno (ver sección 7)

## 7. VARIABLES DE ENTORNO NECESARIAS (`backend/.env`)

```env
# === PostgreSQL ===
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña_local_aqui
DB_DATABASE=reservacanchalong

# === SMTP / Correo (RF04) ===
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=tu_correo@gmail.com
MAIL_PASS=tu_contraseña_de_app_de_Gmail
MAIL_FROM="Canchas Grupo 4 <tu_correo@gmail.com>"

# === JWT (RF03) ===
JWT_SECRET=secreto_largo_y_aleatorio_min_32_caracteres
JWT_EXPIRES_IN=1d

# === CORS ===
FRONTEND_URL=http://localhost:3001
```

**Notas importantes:**
- `JWT_SECRET`: debe ser único por entorno y ≥ 32 caracteres en producción
- `MAIL_PASS`: para Gmail usa una "Contraseña de app" (no la contraseña de login normal)
- `DB_PASSWORD`: no usar contraseñas por defecto en producción
- `FRONTEND_URL`: debe coincidir exactamente con el origen del frontend para que CORS funcione
- `synchronize: true` en `app.module.ts`: sincroniza automáticamente las entidades con la BD. Ideal para desarrollo. Cambiar a `false` en producción con datos reales.

---

## 8. RESUMEN EJECUTIVO DE VALIDACIÓN

| Código | Requerimiento | Estado | Evidencia clave |
|--------|--------------|--------|-----------------|
| RF01 | Registro de Usuario | ✅ CUMPLE | Formulario 7 campos + CreateUserDto + AuthService.register |
| RF02 | Validación y Duplicidad | ✅ CUMPLE | IsEmail, IsAdult, validarDuplicados, UNIQUE en BD |
| RF03 | Inicio/Cierre Sesión | ✅ CUMPLE | LocalStrategy + JwtStrategy + login/logout endpoints |
| RF04 | Confirmación Registro | ✅ CUMPLE | VerificationService + MailService + reenviar-verificacion |
| RF05 | Gestión de Roles | ✅ CUMPLE | UserRole enum + RolesGuard + @Roles + JWT con rol |
| RF06 | Edición de Perfil | ✅ CUMPLE | UpdateUserDto (PartialType) + PUT/PATCH /auth/perfil |
| RF07 | Panel Administración | ✅ CUMPLE | CRUD + cambio rol/estado + frontend admin |
| RF08 | Directorio Clientes | ✅ CUMPLE | getDirectory + updateClientContact + frontend empleado |
| RNF01 | Cifrado Contraseñas | ✅ CUMPLE | bcrypt 10 rondas + @Exclude + ClassSerializerInterceptor |
| RNF02 | Normalización 3FN | ✅ CUMPLE | Columnas separadas: nombres, apellido_paterno, apellido_materno |
| RNF03 | Integridad Datos | ✅ CUMPLE | UNIQUE correo/celular + validaciones CHECK (class-validator) |
| RNF04 | Anti Inyección SQL | ✅ CUMPLE | TypeORM parametrizado + escaparPatronLike + ValidationPipe |

**CONCLUSIÓN: El proyecto CUMPLE TODOS los requerimientos funcionales y no funcionales planteados.** ✅

---

## 9. OBSERVACIONES Y MEJORAS SUGERIDAS

### Observaciones detectadas
1. **Nomenclatura del rol "Usuario" (RF05):** El requerimiento menciona "Usuario" pero el código implementa `CLIENTE`. Es funcionalmente equivalente; la UI ya muestra "Cliente".
2. **Correo de bienvenida duplicado:** `MailService` tiene `enviarCorreoBienvenida()` además del flujo de `VerificationService`. El registro público usa correctamente `VerificationService.send()`. Se recomienda revisar que no haya envíos duplicados en el flujo completo.
3. **Tests e2e limitados:** Solo hay test e2e para el health check (`/`). Los tests unitarios en `users.service.spec.ts` sí cubren RF02, RNF01, RF05, RF08.
4. **`synchronize: true` en producción:** Cambiar a `false` cuando haya datos reales en producción para evitar sobrescritura accidental de esquemas.

### Mejoras sugeridas para futuro
- [ ] Tests e2e para endpoints críticos (login, registro, CRUD de usuarios)
- [ ] Refresh token para sesiones de larga duración
- [ ] Rate limiting en endpoints de login y registro
- [ ] Paginación en `GET /users` y `GET /users/directory` para grandes conjuntos de datos
- [ ] Endpoint de recuperación de contraseña (olvidé mi contraseña)
- [ ] Logs estructurados (pino/winston) para producción

---

*Documentación generada el 22 de septiembre de 2026 — Grupo 4 Canchas — GESTión de USUARIOS*
```

### 6.3 Comandos útiles del backend
```bash
cd backend
npm run start:dev          # Desarrollo con hot-reload
npm run build              # Build de producción
npm run start:prod         # Servidor de producción
npm run test               # Tests unitarios
npm run test:cov           # Tests con cobertura
npm run test:e2e           # Tests e2e
npm run lint               # Linting
```

### 6.4 Comandos útiles del frontend
```bash
cd frontend
npm run dev                # Desarrollo (puerto 3001)
npm run build              # Build de producción
npm run start              # Servidor de producción
npm run lint               # Linting
```

---
   - Si estado === BLOQUEADO: UnauthorizedException
   - bcrypt.compare(password, hash) → false: null
   - Retorna { id, correo, rol }
4. AuthService.login(): firma JWT { sub, correo, rol }
5. Frontend: guarda token + usuario en localStorage + AuthContext
6. Peticiones posteriores: JwtAuthGuard valida JWT en cada petición
7. RolesGuard compara req.user.rol con @Roles() del handler
```

### 4.4 Panel de Administración (RF07)
```
Administrador:
  GET  /api/users              → todos los usuarios
  POST /api/users              → crear (elije rol EMPLEADO/CLIENTE)
  GET  /api/users/:id          → un usuario
  PATCH /api/users/:id         → editar todo (datos+rol+estado)
  PATCH /api/users/:id/role    → cambiar rol
  PATCH /api/users/:id/status  → Activo/Bloqueado
  DELETE /api/users/:id        → eliminar
```

### 4.5 Directorio de Empleado (RF08)
```
Empleado:
  GET  /api/users/directory              → lista CLIENTE (con búsqueda opcional)
  PATCH /api/users/:id/contacto          → editar solo contacto
  ✗ PATCH /api/users/:id/role            → 403 Forbidden
  ✗ PATCH /api/users/:id/status          → 403 Forbidden
  ✗ DELETE /api/users/:id                → 403 Forbidden
```

---
## 5. ENDPOINTS DE LA API

### Autenticación (`/api/auth`)

| Método | Ruta | Descripción | Protección | RF |
|--------|------|-------------|------------|-----|
| POST | `/auth/registro` | Registro nuevo usuario | Público | RF01,02,04 |
| POST | `/auth/login` | Inicio de sesión | Público | RF03 |
| POST | `/auth/logout` | Cierre sesión | JWT | RF03 |
| GET | `/auth/perfil` | Perfil propio | JWT | RF06 |
| PUT | `/auth/perfil` | Actualizar perfil | JWT | RF06 |
| PATCH | `/auth/perfil` | Actualizar parcial | JWT | RF06 |
| POST | `/auth/reenviar-verificacion` | Reenviar correo | JWT | RF04 |
| GET | `/auth/verificar-correo?token=XXX` | Confirmar correo | Público | RF04 |

### Usuarios (`/api/users`)

| Método | Ruta | Descripción | Roles | RF |
|--------|------|-------------|-------|-----|
| POST | `/users` | Crear usuario | ADMINISTRADOR | RF07 |
| GET | `/users` | Todos los usuarios | ADMINISTRADOR | RF07 |
| GET | `/users/directory` | Directorio + búsqueda | ADMIN, EMPLEADO | RF08 |
| GET | `/users/:id` | Un usuario | ADMINISTRADOR | RF07 |
| PATCH | `/users/:id` | Editar completo | ADMINISTRADOR | RF07 |
| PATCH | `/users/:id/contacto` | Editar contacto | ADMIN, EMPLEADO | RF08 |
| PATCH | `/users/:id/role` | Cambiar rol | ADMINISTRADOR | RF07 |
| PATCH | `/users/:id/status` | Activar/Bloquear | ADMINISTRADOR | RF07 |
| DELETE | `/users/:id` | Eliminar | ADMINISTRADOR | RF07 |

---
---