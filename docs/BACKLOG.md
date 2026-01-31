# Cairn - Backlog

## En Progreso 🔨

_Ninguna tarea en progreso_

## Pendiente 📋

### Milestone 2: Integración Google Calendar
- [ ] Servicio para Google Calendar API (crear, listar, eliminar eventos)
- [ ] Crear calendario "Cairn" si no existe
- [ ] Obtener ID del calendario "Cairn"
- [ ] Listar eventos del mes actual
- [ ] Crear evento de día completo

### Milestone 3: Vista de Calendario
- [ ] Componente de calendario mensual
- [ ] Mostrar eventos como colores/indicadores en cada día
- [ ] Navegación entre meses
- [ ] Vista del día actual destacada

### Milestone 4: Gestión de Actividades
- [ ] Modelo de datos para templates de actividades (nombre, color, emoji)
- [ ] Pantalla para crear/editar/eliminar templates
- [ ] Persistir templates en AsyncStorage
- [ ] Asignar colores únicos a cada actividad

### Milestone 5: Registro de Actividades
- [ ] Botón + flotante en la pantalla principal
- [ ] Modal/sheet para seleccionar actividad
- [ ] Crear evento en Google Calendar al seleccionar
- [ ] Feedback visual de éxito
- [ ] Actualizar vista del calendario

### Ideas futuras
- [ ] Estadísticas (días consecutivos, actividad más frecuente)
- [ ] Notificaciones/recordatorios
- [ ] Widgets para iOS/Android
- [ ] Temas claro/oscuro
- [ ] Múltiples calendarios (trabajo, personal)
- [ ] Compartir progreso

## Completado ✅

### Milestone 1: Autenticación con Google (2025-01-31)
- [x] Configurar proyecto en Google Cloud Console
- [x] Implementar flujo OAuth con expo-auth-session
- [x] Crear pantalla de login
- [x] Guardar tokens de acceso de forma segura (Zustand + AsyncStorage)
- [x] Proteger rutas (redirect a login si no autenticado)

### v0.1.0 - Setup inicial (2025-01-31)
- [x] Crear proyecto Expo con TypeScript
- [x] Configurar expo-router
- [x] Configurar Zustand con persistencia
- [x] Estructura de carpetas base
- [x] Documentación del proyecto
- [x] Naming: elegido "Cairn" como nombre de la app

---

## Notas técnicas

### Google Calendar API - Endpoints clave
```
POST /calendars                     # Crear calendario
GET  /users/me/calendarList         # Listar calendarios del usuario
GET  /calendars/{id}/events         # Listar eventos
POST /calendars/{id}/events         # Crear evento
DELETE /calendars/{id}/events/{id}  # Eliminar evento
```

### Estructura de evento (día completo)
```json
{
  "summary": "Meditación 🧘",
  "start": { "date": "2025-01-31" },
  "end": { "date": "2025-01-31" },
  "colorId": "5"
}
```

### Colores disponibles en Google Calendar
1: Lavanda, 2: Salvia, 3: Uva, 4: Flamingo, 5: Banana,
6: Mandarina, 7: Pavo real, 8: Grafito, 9: Arándano, 10: Albahaca, 11: Tomate
