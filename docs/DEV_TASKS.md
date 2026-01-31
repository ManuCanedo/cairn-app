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
- Usuario de prueba añadido en Google Cloud Console: `manuel.ctabares@gmail.com`

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

---

## Backlog

### Task 003: Implement Google Calendar Service [PENDING]
Crear servicio para interactuar con Google Calendar API.

### Task 004: Create Calendar UI Component [PENDING]
Componente de calendario mensual con indicadores de colores.

### Task 005: Activity Templates CRUD [PENDING]
Pantalla para crear/editar/eliminar templates de actividades.

---

## Completed Tasks

_Ninguna tarea completada aún_
