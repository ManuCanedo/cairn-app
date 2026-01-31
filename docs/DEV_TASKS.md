# Cairn - Development Tasks

Este archivo contiene tareas de desarrollo para ser ejecutadas por Claude Code.

**Instrucciones para Claude Code:**
1. Lee la tarea marcada como `[ACTIVE]`
2. Ejecuta los pasos descritos
3. Verifica los criterios de aceptación
4. Marca la tarea como `[DONE]` y añade notas si es necesario
5. Si hay bloqueadores, márcala como `[BLOCKED]` con explicación

---

## Task 001: Fix Web Build Error [ACTIVE]

### Contexto
La app no carga en web. Muestra pantalla blanca con error en consola:
```
SyntaxError: Cannot use 'import.meta' outside a module
```

El error viene de `expo-router/entry.bundle` y parece ser un problema de configuración de Metro/Expo para web.

### Objetivo
Hacer que la app cargue correctamente en `http://localhost:8081` mostrando la pantalla de login.

### Archivos relevantes
- `package.json` - dependencias
- `metro.config.js` - configuración de Metro (recién creado)
- `app.json` - configuración de Expo
- `app/login.tsx` - pantalla de login
- `app/_layout.tsx` - layout principal

### Pasos sugeridos
1. Verificar compatibilidad de versiones (React 19.1 + react-native-web + expo-router)
2. Limpiar completamente: `rm -rf node_modules && rm package-lock.json`
3. Reinstalar: `npm install --legacy-peer-deps`
4. Limpiar cache de Expo: `npx expo start --web --clear`
5. Si persiste, investigar configuración específica de Metro para web
6. Probar en Chrome y verificar que no hay errores en consola

### Criterios de aceptación
- [ ] `npm run web` inicia sin errores
- [ ] La app carga en `http://localhost:8081`
- [ ] Se muestra la pantalla de login con el botón "Continue with Google"
- [ ] No hay errores de JavaScript en la consola del navegador

### Notas
- Puede requerir downgrade de alguna dependencia
- Verificar que `main` en package.json sea `expo-router/entry`
- El proyecto usa Expo SDK 54

---

## Task 002: Test Google OAuth Flow [PENDING]

### Contexto
Una vez que la app cargue en web, necesitamos verificar que el flujo de OAuth con Google funciona correctamente.

### Objetivo
Completar un login exitoso con Google y ver la pantalla principal con los datos del usuario.

### Prerequisitos
- Task 001 completada

### Configuración OAuth ya existente
- **Client ID**: `2006113013377-gn4n7u9b89v1g1i0aq0e8dbrmler57dt.apps.googleusercontent.com`
- **Usuario de prueba**: `manuel.ctabares@gmail.com`
- **Redirect URI configurado**: `https://auth.expo.io/@manuel.canedo/cairn`

### Pasos
1. Abrir la app en `http://localhost:8081`
2. Click en "Continue with Google"
3. Seleccionar la cuenta de prueba
4. Autorizar los permisos de Google Calendar
5. Verificar redirect a pantalla principal
6. Verificar que se muestra el nombre y foto del usuario

### Criterios de aceptación
- [ ] El botón de Google abre la ventana de OAuth
- [ ] Se puede autorizar con la cuenta de prueba
- [ ] Después del login, se muestra la pantalla principal
- [ ] El nombre del usuario aparece en la UI
- [ ] El token se persiste (refrescar página mantiene sesión)

### Debugging
Si el OAuth falla, verificar:
- Que el Client ID en `src/config/constants.ts` es correcto
- Que el redirect URI coincide con el configurado en Google Cloud Console
- Que el usuario está añadido como tester en la pantalla de consentimiento OAuth

---

## Task 003: Implement Google Calendar Service [PENDING]

### Contexto
Necesitamos un servicio que interactúe con la Google Calendar API para:
- Crear un calendario dedicado "Cairn" si no existe
- Listar eventos del calendario
- Crear eventos de día completo (all-day events)

### Objetivo
Crear `src/services/google-calendar.ts` con funciones para CRUD de calendarios y eventos.

### Prerequisitos
- Task 002 completada (OAuth funcionando)
- El usuario debe tener un access token válido en el auth store

### API Reference
Base URL: `https://www.googleapis.com/calendar/v3`

**Endpoints necesarios:**
```
GET  /users/me/calendarList              # Listar calendarios
POST /calendars                          # Crear calendario
GET  /calendars/{calendarId}/events      # Listar eventos
POST /calendars/{calendarId}/events      # Crear evento
DELETE /calendars/{calendarId}/events/{eventId}  # Eliminar evento
```

**Estructura de evento all-day:**
```json
{
  "summary": "Meditación 🧘",
  "description": "Logged via Cairn",
  "start": { "date": "2025-01-31" },
  "end": { "date": "2025-01-31" },
  "colorId": "5"
}
```

**Colores disponibles (colorId):**
1: Lavanda, 2: Salvia, 3: Uva, 4: Flamingo, 5: Banana,
6: Mandarina, 7: Pavo real, 8: Grafito, 9: Arándano, 10: Albahaca, 11: Tomate

### Implementación requerida

```typescript
// src/services/google-calendar.ts

// Obtener o crear el calendario "Cairn"
async function getOrCreateCairnCalendar(accessToken: string): Promise<string>

// Listar eventos de un rango de fechas
async function listEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,  // ISO date
  timeMax: string   // ISO date
): Promise<CalendarEvent[]>

// Crear evento de día completo
async function createAllDayEvent(
  accessToken: string,
  calendarId: string,
  summary: string,
  date: string,     // YYYY-MM-DD
  colorId: string
): Promise<CalendarEvent>

// Eliminar evento
async function deleteEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void>
```

### Archivos a crear/modificar
- Crear: `src/services/google-calendar.ts`
- Crear: `src/types/calendar.ts` (tipos TypeScript)

### Criterios de aceptación
- [ ] El servicio se exporta correctamente
- [ ] `getOrCreateCairnCalendar` crea el calendario si no existe
- [ ] `getOrCreateCairnCalendar` retorna el ID si ya existe
- [ ] `listEvents` retorna eventos del rango especificado
- [ ] `createAllDayEvent` crea eventos correctamente
- [ ] Los errores de API se manejan con try/catch
- [ ] TypeScript compila sin errores

### Testing manual
Después de implementar, probar en la consola del navegador:
```javascript
// Con la app abierta y logueado
import { getOrCreateCairnCalendar } from './src/services/google-calendar';
const calId = await getOrCreateCairnCalendar(accessToken);
console.log('Calendar ID:', calId);
```

---

## Task 004: Create Calendar UI Component [PENDING]

### Contexto
La pantalla principal debe mostrar un calendario mensual donde cada día muestre indicadores de color según las actividades realizadas.

### Objetivo
Crear un componente de calendario mensual que:
- Muestre el mes actual con navegación prev/next
- Destaque el día actual
- Muestre puntos de colores en los días con actividades

### Prerequisitos
- Task 003 completada (Google Calendar service)

### Diseño visual
```
┌─────────────────────────────────────┐
│  ←    January 2025    →             │
├─────────────────────────────────────┤
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun  │
├─────────────────────────────────────┤
│        1    2    3    4    5    6   │
│                  ●              ●●  │
│   7    8    9   10   11   12   13   │
│   ●        ●●                       │
│  14   15   16   17   18   19   20   │
│             ●    ●                  │
│  21   22   23   24   25   26   27   │
│        ●                  ●●●       │
│  28   29   30  [31]                 │  ← [31] = hoy destacado
│                  ●                  │
└─────────────────────────────────────┘
```

Los puntos de colores (●) representan actividades de ese día.

### Archivos a crear
- `src/components/Calendar/MonthView.tsx` - Componente principal
- `src/components/Calendar/DayCell.tsx` - Celda individual del día
- `src/components/Calendar/CalendarHeader.tsx` - Header con navegación
- `src/components/Calendar/index.ts` - Export barrel

### Props del componente principal
```typescript
interface MonthViewProps {
  events: CalendarEvent[];        // Eventos del mes
  onDayPress?: (date: string) => void;  // Click en un día
  onMonthChange?: (year: number, month: number) => void;  // Cambio de mes
}
```

### Implementación
1. Usar `date-fns` para manipulación de fechas (instalar si no está)
2. Grid de 7 columnas (días de la semana)
3. Calcular días del mes actual + padding de meses anterior/siguiente
4. Mapear eventos a días por fecha
5. Mostrar hasta 3 puntos de color por día (si hay más, mostrar "+")

### Criterios de aceptación
- [ ] El calendario muestra el mes actual correctamente
- [ ] Las flechas ← → cambian de mes
- [ ] El día actual está visualmente destacado
- [ ] Los eventos se muestran como puntos de colores
- [ ] El componente es responsive
- [ ] No hay warnings en consola

---

## Task 005: Activity Templates CRUD [PENDING]

### Contexto
Los usuarios definen "actividades positivas" (templates) una vez, y luego las seleccionan rápidamente para registrar que las hicieron.

Ejemplos: "Meditar 🧘", "Ejercicio 💪", "Leer 📚", "Dormir 8h 😴"

### Objetivo
Crear la UI y lógica para gestionar templates de actividades.

### Prerequisitos
- Task 001 completada (app carga)

### Modelo de datos
```typescript
// src/types/activity.ts
interface ActivityTemplate {
  id: string;
  name: string;           // "Meditar"
  emoji: string;          // "🧘"
  colorId: string;        // "7" (color de Google Calendar)
  createdAt: number;
}
```

### Store (Zustand)
```typescript
// src/store/activities.ts
interface ActivitiesState {
  templates: ActivityTemplate[];
  addTemplate: (name: string, emoji: string, colorId: string) => void;
  updateTemplate: (id: string, updates: Partial<ActivityTemplate>) => void;
  deleteTemplate: (id: string) => void;
}
```

### Pantallas a crear
1. **Lista de actividades** (`app/activities/index.tsx`)
   - Lista de templates existentes
   - Botón para añadir nueva
   - Swipe o botón para eliminar

2. **Crear/Editar actividad** (`app/activities/edit.tsx`)
   - Input para nombre
   - Selector de emoji (grid de emojis comunes)
   - Selector de color (11 colores de Google Calendar)
   - Botón guardar

### Colores disponibles (mostrar como círculos)
```typescript
const GOOGLE_COLORS = [
  { id: '1', name: 'Lavanda', hex: '#7986cb' },
  { id: '2', name: 'Salvia', hex: '#33b679' },
  { id: '3', name: 'Uva', hex: '#8e24aa' },
  { id: '4', name: 'Flamingo', hex: '#e67c73' },
  { id: '5', name: 'Banana', hex: '#f6c026' },
  { id: '6', name: 'Mandarina', hex: '#f5511d' },
  { id: '7', name: 'Pavo real', hex: '#039be5' },
  { id: '8', name: 'Grafito', hex: '#616161' },
  { id: '9', name: 'Arándano', hex: '#3f51b5' },
  { id: '10', name: 'Albahaca', hex: '#0b8043' },
  { id: '11', name: 'Tomate', hex: '#d60000' },
];
```

### Emojis sugeridos (grid)
```
🧘 💪 📚 😴 🏃 🚴 🧠 💧
🥗 🍎 ✍️ 🎨 🎵 🌅 🌙 ⭐
```

### Criterios de aceptación
- [ ] Se pueden crear nuevos templates
- [ ] Se pueden editar templates existentes
- [ ] Se pueden eliminar templates
- [ ] Los templates persisten (AsyncStorage via Zustand)
- [ ] El selector de emoji funciona
- [ ] El selector de color muestra los 11 colores
- [ ] La UI es intuitiva y minimalista

---

## Task 006: Activity Registration Flow [PENDING]

### Contexto
El flujo principal de la app: el usuario pulsa el botón + y selecciona una actividad para registrarla en el día actual.

### Objetivo
Implementar el flujo completo de registro de actividad.

### Prerequisitos
- Task 003 completada (Google Calendar service)
- Task 004 completada (Calendar UI)
- Task 005 completada (Activity templates)

### Flujo de usuario
```
1. Usuario en pantalla principal (calendario)
2. Pulsa botón + (FAB)
3. Se abre modal/bottom sheet con lista de sus actividades
4. Selecciona una actividad
5. Se crea evento en Google Calendar (día actual)
6. Modal se cierra
7. Calendario se actualiza mostrando el nuevo punto de color
8. Feedback visual de éxito (toast o similar)
```

### Componentes a crear/modificar
1. **ActivityPicker** (`src/components/ActivityPicker.tsx`)
   - Modal o bottom sheet
   - Grid de actividades del usuario
   - Cada actividad muestra emoji + nombre + color

2. **Modificar HomeScreen** (`app/index.tsx`)
   - Integrar calendario real (no placeholder)
   - FAB abre ActivityPicker
   - Cargar eventos del mes actual
   - Refrescar al crear evento

### Integración
```typescript
// En HomeScreen
const handleActivitySelect = async (template: ActivityTemplate) => {
  const today = new Date().toISOString().split('T')[0];
  await createAllDayEvent(
    accessToken,
    calendarId,
    `${template.emoji} ${template.name}`,
    today,
    template.colorId
  );
  // Refrescar eventos
  // Cerrar modal
  // Mostrar feedback
};
```

### Criterios de aceptación
- [ ] El FAB abre el selector de actividades
- [ ] Las actividades del usuario se muestran correctamente
- [ ] Al seleccionar, se crea el evento en Google Calendar
- [ ] El calendario se actualiza inmediatamente
- [ ] Hay feedback visual de éxito
- [ ] Si hay error, se muestra mensaje apropiado
- [ ] El modal se puede cerrar sin seleccionar

---

## Task 007: Integration & Polish [PENDING]

### Contexto
Una vez completadas las tareas anteriores, necesitamos integrar todo y pulir la experiencia.

### Objetivo
App funcional end-to-end con UX pulida.

### Subtareas
1. Navegación: Añadir acceso a pantalla de actividades desde home
2. Empty states: Mensajes cuando no hay actividades/eventos
3. Loading states: Spinners mientras cargan datos
4. Error handling: Mensajes de error amigables
5. Onboarding: Guiar al usuario a crear su primera actividad
6. Persistencia del calendarId: No buscar/crear en cada sesión

### Criterios de aceptación
- [ ] Flujo completo funciona sin errores
- [ ] Estados de carga son claros
- [ ] Errores se muestran de forma amigable
- [ ] Primera experiencia de usuario es guiada
- [ ] No hay console.logs en producción
- [ ] Commit final con todos los cambios

---

## Completed Tasks

_Ninguna tarea completada aún_
