# Habits App

App móvil minimalista para visualizar y registrar tus actividades positivas usando Google Calendar como backend.

## Visión

Una app donde defines tus actividades de bienestar (templates) y las registras día a día. El calendario muestra de un vistazo, con colores, cómo te has cuidado ese mes. Sin gamificación excesiva, sin notificaciones agresivas. Solo lo esencial para crear consistencia y consciencia.

## Concepto Core

1. **Login con Google** → Acceso a tu calendario
2. **Calendario "Habits"** → Se crea automáticamente en tu Google Calendar
3. **Templates de actividades** → Defines una vez tus actividades positivas (Meditar, Ejercicio, Leer...)
4. **Registro rápido** → Botón + para añadir una actividad al día actual (evento de día completo)
5. **Vista de calendario** → Ves el mes con colores según las actividades realizadas

## Stack Técnico

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| Framework | React Native + Expo SDK 54 | Cross-platform con componentes nativos reales |
| Lenguaje | TypeScript | Type safety, mejor DX con IA |
| Navegación | Expo Router | File-based routing, simple y escalable |
| Auth | expo-auth-session + Google OAuth | Login con Google, acceso a Calendar API |
| Backend | Google Calendar API | Sin servidor propio, los datos viven en el calendario del usuario |
| Estado local | Zustand | Cache de templates, estado de UI |
| Persistencia local | AsyncStorage | Cache de templates de actividades |
| UI | React Native core | Componentes nativos, look & feel nativo |

## Arquitectura

```
habits-app/
├── app/                        # Rutas (expo-router)
│   ├── _layout.tsx             # Layout raíz + auth check
│   ├── index.tsx               # Pantalla principal (calendario)
│   ├── login.tsx               # Pantalla de login
│   └── activities/
│       ├── index.tsx           # Gestionar templates de actividades
│       └── add.tsx             # Añadir actividad al día
├── src/
│   ├── components/
│   │   ├── Calendar.tsx        # Vista de calendario mensual
│   │   ├── ActivityPicker.tsx  # Selector de actividad (botón +)
│   │   └── DayCell.tsx         # Celda del calendario con colores
│   ├── services/
│   │   ├── google-auth.ts      # Lógica de OAuth con Google
│   │   └── google-calendar.ts  # CRUD con Google Calendar API
│   ├── store/
│   │   ├── auth.ts             # Estado de autenticación
│   │   └── activities.ts       # Templates de actividades
│   └── types/
│       ├── activity.ts         # Tipos de actividades
│       └── calendar.ts         # Tipos de eventos de calendario
├── assets/
└── docs/
```

## Flujo de Usuario

```
┌─────────────────────────────────────────────────────────────┐
│  1. PRIMER USO                                               │
│  ┌─────────┐    ┌─────────────┐    ┌──────────────────────┐ │
│  │  Login  │ → │  Crear      │ → │  Definir actividades │ │
│  │  Google │    │  calendario │    │  positivas (templates)│ │
│  └─────────┘    │  "Habits"   │    └──────────────────────┘ │
│                 └─────────────┘                              │
├─────────────────────────────────────────────────────────────┤
│  2. USO DIARIO                                               │
│  ┌─────────────┐    ┌─────────┐    ┌────────────────────┐   │
│  │  Ver        │ → │  Pulsar │ → │  Seleccionar       │   │
│  │  calendario │    │    +    │    │  actividad hecha   │   │
│  └─────────────┘    └─────────┘    └────────────────────┘   │
│         │                                    │               │
│         └────────────────────────────────────┘               │
│                   Se añade al calendario                     │
└─────────────────────────────────────────────────────────────┘
```

## Decisiones Técnicas

### 2025-01-31: Stack inicial
- **Decisión**: React Native + Expo sobre Flutter o Ionic
- **Razón**: Mejor ecosistema para desarrollo con IA, componentes nativos reales

### 2025-01-31: Google Calendar como backend
- **Decisión**: Usar Google Calendar API en lugar de backend propio
- **Razón**: Sin infraestructura que mantener, datos en control del usuario, sincronización automática con otros dispositivos/apps de calendario

### 2025-01-31: Eventos de día completo
- **Decisión**: Las actividades se registran como eventos de día completo (all-day events)
- **Razón**: Simplicidad, no importa la hora exacta sino que se hizo. Permite vista de "colores" en el mes.

### 2025-01-31: Templates locales + eventos en cloud
- **Decisión**: Los templates de actividades se guardan localmente (AsyncStorage), los registros van a Google Calendar
- **Razón**: Los templates son configuración personal rápida, los registros necesitan persistencia cloud

## Setup para desarrollo

### 1. Google Cloud Console (necesario)
```
1. Crear proyecto en console.cloud.google.com
2. Habilitar Google Calendar API
3. Crear credenciales OAuth 2.0 (tipo: aplicación web/iOS/Android)
4. Configurar pantalla de consentimiento OAuth
5. Añadir scopes: calendar.events, calendar.calendars
```

### 2. Variables de entorno
```bash
# .env (no commitear)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=tu-client-id-ios.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=tu-client-id-android.apps.googleusercontent.com
```

### 3. Comandos
```bash
npm run web      # Desarrollo en navegador
npm run ios      # iOS (Expo Go o simulador)
npm run android  # Android (Expo Go o emulador)
```

## Próximos pasos

Ver `BACKLOG.md` para features pendientes.
