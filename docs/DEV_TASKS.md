# Cairn - Development Tasks

This file contains development tasks to be executed by Claude Code agents.

**Instructions for Claude Code:**
1. Read the task marked as `[ACTIVE]`
2. Execute the steps described using TDD (Red/Green/Refactor)
3. **REQUIRED: Run code-simplifier agent review before testing**
4. Run all checks: `npm run typecheck && npm test`
5. Verify the acceptance criteria
6. Create PR and **REQUIRED: Request principal-cpp-architect review**
7. Address all `[AI-PRINCIPAL]` comments
8. Get principal approval before merging
9. Mark the task as `[DONE]` and add notes if necessary

See `docs/AGENT_WORKFLOW.md` for the complete workflow.

---

## Task Template

Use this template for all new tasks. See `docs/AGENT_WORKFLOW.md` for the complete execution workflow.

```markdown
## Task XXX: [Title] [STATUS]

### Context
[Why this task exists. What problem it solves.]

### Prerequisites
- Task NNN completed (specifically need: `functionName` from `file.ts`)

### Objective
[1-2 sentences max]

### Files to Create/Modify
| File | Action | Notes |
|------|--------|-------|
| `src/path/file.ts` | Create | Description |
| `src/__tests__/path/file.test.ts` | Create | Test coverage |

### Acceptance Criteria
- [ ] [Specific, testable criterion 1]
- [ ] [Specific, testable criterion 2]
- [ ] code-simplifier review: DONE
- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Tests pass: `npm test`
- [ ] Principal review: APPROVED

### Rollback Plan
If task fails: `git reset --hard pre-task-XXX`
```

---

## Task 001: Fix Web Build Error [DONE]

### Context
The app doesn't load on web. Shows a white screen with error in console:
```
SyntaxError: Cannot use 'import.meta' outside a module
```

The error comes from `expo-router/entry.bundle` and appears to be a Metro/Expo web configuration issue.

### Objective
Hacer que la app cargue correctamente en `http://localhost:8081` mostrando la pantalla de login.

### Relevant Files
- `package.json` - dependencias
- `metro.config.js` - configuración de Metro (recién creado)
- `app.json` - configuración de Expo
- `app/login.tsx` - pantalla de login
- `app/_layout.tsx` - layout principal

### Suggested Steps
1. Verificar compatibilidad de versiones (React 19.1 + react-native-web + expo-router)
2. Limpiar completamente: `rm -rf node_modules && rm package-lock.json`
3. Reinstalar: `npm install --legacy-peer-deps`
4. Limpiar cache de Expo: `npx expo start --web --clear`
5. Si persiste, investigar configuración específica de Metro para web
6. Probar en Chrome y verificar que no hay errores en consola

### Acceptance Criteria
- [x] `npm run web` inicia sin errores
- [x] La app carga en `http://localhost:8081`
- [x] Se muestra la pantalla de login con el botón "Continue with Google"
- [x] No hay errores de JavaScript en la consola del navegador

### Notes
- Puede requerir downgrade de alguna dependencia
- Verificar que `main` en package.json sea `expo-router/entry`
- El proyecto usa Expo SDK 54

### Solution Applied (2025-01-31)
The "import.meta outside a module" error is a known issue with Expo SDK 54 and Metro bundler when using ES modules. See: https://github.com/expo/expo/issues/36384

**Cambios realizados:**

1. **metro.config.js** - Desactivar package exports para evitar el error de import.meta:
   ```javascript
   config.resolver.unstable_enablePackageExports = false;
   ```

2. **babel.config.js** - Crear archivo con transformación de import.meta:
   ```javascript
   module.exports = function (api) {
     api.cache(true);
     return {
       presets: [
         ['babel-preset-expo', { unstable_transformImportMeta: true }],
       ],
     };
   };
   ```

3. **app.json** - Desactivar nueva arquitectura (incompatible con web):
   ```json
   "newArchEnabled": false
   ```

4. **app/_layout.tsx** - Corregir navegación prematura usando `useRootNavigationState()`:
   - Añadir verificación de que la navegación está lista antes de llamar a `router.replace()`

**Result:** The app bundles correctly and loads the login screen in Chrome without console errors.

---

## Task 002: Test Google OAuth Flow [DONE]

### Context
Una vez que la app cargue en web, necesitamos verificar que el flujo de OAuth con Google funciona correctamente.

### Objective
Completar un login exitoso con Google y ver la pantalla principal con los datos del usuario.

### Prerequisites
- Task 001 completada

### Configuración OAuth corregida
- **Client ID**: `200611301377-gn4n7u9b89v1g1i0aq0e8dbrmler57dt.apps.googleusercontent.com`
- **Usuario de prueba**: `manuel.ctabares@gmail.com`
- **Redirect URIs configurados**:
  - `https://auth.expo.io/@manuel.canedo/cairn`
  - `http://localhost:8081`

### Acceptance Criteria
- [x] El botón de Google abre la ventana de OAuth
- [x] Se puede autorizar con la cuenta de prueba
- [x] Después del login, se muestra la pantalla principal
- [x] El nombre del usuario aparece en la UI
- [x] El token se persiste (refrescar página mantiene sesión)

### Issues Found and Resolved (2025-01-31)

**1. Error "invalid_client" (Error 401)**
- **Cause**: Typo in Client ID - there was an extra "3"
- **Before**: `2006113013377-...` (13 digits)
- **After**: `200611301377-...` (12 digits)
- **Fix**: Corrected in `src/config/constants.ts`

**2. Error "redirect_uri_mismatch" (Error 400)**
- **Cause**: Only the Expo proxy redirect was configured
- **Fix**: Add `http://localhost:8081` in Google Cloud Console > OAuth Client > Authorized redirect URIs

**3. Error "Access blocked: app has not completed verification"**
- **Cause**: The test user was not added to the OAuth consent screen
- **Fix**: Google Cloud Console > Google Auth Platform > Test users > Add `manuel.ctabares@gmail.com`

### Result
✅ Google login works correctly. The app shows "Hello, Manuel!" with the user's profile photo.

---

## Task 003: Implement Google Calendar Service [DONE]

### Context
We need a service that interacts with the Google Calendar API to:
- Create a dedicated "Cairn" calendar if it doesn't exist
- List calendar events
- Create all-day events

### Objective
Create `src/services/google-calendar.ts` with CRUD functions for calendars and events.

### Prerequisites
- Task 002 completada (OAuth funcionando)
- The user must have a valid access token in the auth store

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

### Implementation requerida

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

### Files to Create/Modify
- Crear: `src/services/google-calendar.ts`
- Crear: `src/types/calendar.ts` (tipos TypeScript)

### Acceptance Criteria
- [x] El servicio se exporta correctamente
- [x] `getOrCreateCairnCalendar` crea el calendario si no existe
- [x] `getOrCreateCairnCalendar` retorna el ID si ya existe
- [x] `listEvents` retorna eventos del rango especificado
- [x] `createAllDayEvent` crea eventos correctamente
- [x] Los errores de API se manejan con try/catch
- [x] TypeScript compila sin errores

### Manual Testing
After implementing, test in the browser console:
```javascript
// Con la app abierta y logueado
import { getOrCreateCairnCalendar } from './src/services/google-calendar';
const calId = await getOrCreateCairnCalendar(accessToken);
console.log('Calendar ID:', calId);
```

### Implementation (2025-01-31)

**Files created:**

1. **src/types/calendar.ts** - TypeScript types:
   - `CalendarListEntry` - Entrada de lista de calendarios
   - `CalendarEvent` - Evento con soporte para all-day (date) y timed (dateTime)
   - `CalendarListResponse` / `EventListResponse` - Respuestas paginadas de la API
   - `Calendar` - Datos del calendario

2. **src/services/google-calendar.ts** - Servicio con 4 funciones:
   - `getOrCreateCairnCalendar(accessToken)` - Busca calendario "Cairn" en la lista, lo crea si no existe
   - `listEvents(accessToken, calendarId, timeMin, timeMax)` - Lista eventos ordenados por fecha
   - `createAllDayEvent(accessToken, calendarId, summary, date, colorId)` - Crea evento all-day con descripción "Logged via Cairn"
   - `deleteEvent(accessToken, calendarId, eventId)` - Elimina evento (maneja 204 No Content)

**Features:**
- Centralized `apiRequest<T>` helper for all calls
- `GoogleCalendarError` class with statusCode and details for debugging
- Correct URL encoding for calendarId and eventId
- Handling of 204 No Content response for DELETE

---

## Task 004: Create Calendar UI Component [DONE]

### Context
The main screen should show a monthly calendar where each day displays color indicators based on completed activities.

### Objective
Create a monthly calendar component that:
- Shows the current month with prev/next navigation
- Highlights the current day
- Shows color dots on days with activities

### Prerequisites
- Task 003 completada (Google Calendar service)

### Visual Design
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
│  28   29   30  [31]                 │  ← [31] = today highlighted
│                  ●                  │
└─────────────────────────────────────┘
```

Color dots (●) represent activities for that day.

### Files to Create
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

### Implementation
1. Usar `date-fns` para manipulación de fechas (instalar si no está)
2. Grid de 7 columnas (días de la semana)
3. Calcular días del mes actual + padding de meses anterior/siguiente
4. Mapear eventos a días por fecha
5. Mostrar hasta 3 puntos de color por día (si hay más, mostrar "+")

### Acceptance Criteria
- [x] El calendario muestra el mes actual correctamente
- [x] Las flechas ← → cambian de mes
- [x] El día actual está visualmente destacado
- [x] Los eventos se muestran como puntos de colores
- [x] El componente es responsive
- [x] No hay warnings en consola

### Implementation (2025-01-31)

**Dependencies installed:**
- `date-fns` for date manipulation

**Files created:**
1. `src/components/Calendar/colors.ts` - Mapeo de colorId de Google Calendar a hex
2. `src/components/Calendar/CalendarHeader.tsx` - Header con navegación prev/next mes
3. `src/components/Calendar/DayCell.tsx` - Celda individual con día + puntos de colores
4. `src/components/Calendar/MonthView.tsx` - Componente principal con grid 7 columnas
5. `src/components/Calendar/index.ts` - Barrel export

**Files modified:**
- `app/index.tsx` - Integrated real calendar with event loading from Google Calendar

**Features:**
- 7-column flexbox grid (Mon-Sun)
- Current day highlighted with purple circle
- Other months' days in light gray
- Color dots (max 3, then "+") for events
- Month navigation with arrows
- Automatic event loading when changing months
- Loading state and error handling with retry

---

## Task 005: Activity Templates CRUD [PENDING]

### Context
Users define "positive activities" (templates) once, then quickly select them to log that they completed them.

Examples: "Meditate 🧘", "Exercise 💪", "Read 📚", "Sleep 8h 😴"

### Objective
Create UI and logic to manage activity templates.

### Prerequisites
- Task 001 completada (app carga)

### Data Model
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

### Screens to Create
1. **Activity list** (`app/activities/index.tsx`)
   - List of existing templates
   - Button to add new
   - Swipe or button to delete

2. **Create/Edit activity** (`app/activities/edit.tsx`)
   - Name input
   - Emoji selector (grid of common emojis)
   - Color selector (11 Google Calendar colors)
   - Save button

### Available Colors (display as circles)
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

### Suggested Emojis (grid)
```
🧘 💪 📚 😴 🏃 🚴 🧠 💧
🥗 🍎 ✍️ 🎨 🎵 🌅 🌙 ⭐
```

### Acceptance Criteria
- [ ] New templates can be created
- [ ] Existing templates can be edited
- [ ] Templates can be deleted
- [ ] Templates persist (AsyncStorage via Zustand)
- [ ] Emoji selector works
- [ ] Color selector shows all 11 colors
- [ ] UI is intuitive and minimalist

---

## Task 006: Activity Registration Flow [PENDING]

### Context
The main app flow: user presses the + button and selects an activity to log it for the current day.

### Objective
Implement the complete activity registration flow.

### Prerequisites
- Task 003 completada (Google Calendar service)
- Task 004 completada (Calendar UI)
- Task 005 completada (Activity templates)

### User Flow
```
1. User on main screen (calendar)
2. Presses + button (FAB)
3. Modal/bottom sheet opens with their activity list
4. Selects an activity
5. Event is created in Google Calendar (current day)
6. Modal closes
7. Calendar updates showing the new color dot
8. Visual success feedback (toast or similar)
```

### Components to Create/Modify
1. **ActivityPicker** (`src/components/ActivityPicker.tsx`)
   - Modal or bottom sheet
   - Grid of user's activities
   - Each activity shows emoji + name + color

2. **Modify HomeScreen** (`app/index.tsx`)
   - Integrate real calendar (not placeholder)
   - FAB opens ActivityPicker
   - Load current month's events
   - Refresh after creating event

### Integration
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

### Acceptance Criteria
- [ ] FAB opens the activity selector
- [ ] User's activities are displayed correctly
- [ ] On selection, event is created in Google Calendar
- [ ] Calendar updates immediately
- [ ] Visual success feedback is shown
- [ ] Error message is shown if there's an error
- [ ] Modal can be closed without selecting

---

## Task 007: Integration & Polish [PENDING]

### Context
Once the previous tasks are completed, we need to integrate everything and polish the experience.

### Objective
Functional end-to-end app with polished UX.

### Subtasks
1. Navigation: Add access to activities screen from home
2. Empty states: Messages when there are no activities/events
3. Loading states: Spinners while data loads
4. Error handling: User-friendly error messages
5. Onboarding: Guide user to create their first activity
6. CalendarId persistence: Don't search/create on each session

### Acceptance Criteria
- [ ] Complete flow works without errors
- [ ] Loading states are clear
- [ ] Errors are shown in a friendly way
- [ ] First-time user experience is guided
- [ ] No console.logs in production
- [ ] Final commit with all changes

---

## Completed Tasks

### Task 001: Fix Web Build Error ✅
- **Date:** 2025-01-31
- **Problem:** "import.meta outside a module" error in Metro bundler
- **Solution:**
  - Disable package exports in metro.config.js
  - Create babel.config.js with import.meta transformation
  - Disable new architecture in app.json
  - Fix premature navigation in _layout.tsx

### Task 002: Test Google OAuth Flow ✅
- **Date:** 2025-01-31
- **Issues found:**
  1. Typo en Client ID (dígito extra)
  2. Redirect URI faltante para localhost
  3. Usuario de prueba no añadido en OAuth consent screen
- **Result:** Successful Google login, user authenticated correctly

### Task 003: Implement Google Calendar Service ✅
- **Date:** 2025-01-31
- **Files created:**
  - `src/types/calendar.ts` - TypeScript types for Calendar API
  - `src/services/google-calendar.ts` - Service with 4 CRUD functions
- **Functions implemented:**
  - `getOrCreateCairnCalendar()` - Finds or creates "Cairn" calendar
  - `listEvents()` - Lists events in a date range
  - `createAllDayEvent()` - Creates all-day event with colorId
  - `deleteEvent()` - Deletes event
- **Result:** TypeScript compiles without errors, service ready to use

### Task 004: Create Calendar UI Component ✅
- **Date:** 2025-01-31
- **Dependencies:** date-fns installed
- **Files created:**
  - `src/components/Calendar/colors.ts` - Google colorId → hex mapping
  - `src/components/Calendar/CalendarHeader.tsx` - Header with navigation
  - `src/components/Calendar/DayCell.tsx` - Individual cell + color dots
  - `src/components/Calendar/MonthView.tsx` - Complete monthly calendar
  - `src/components/Calendar/index.ts` - Barrel export
- **Integration:**
  - `app/index.tsx` updated with real calendar + event fetch
- **Result:** Functional calendar with navigation, current day highlighted, events as color dots
