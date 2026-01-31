# Habits App

App móvil minimalista para tracking de hábitos saludables.

## Visión

Una app simple y elegante que anime al usuario a mantener hábitos positivos en su día a día. Sin gamificación excesiva, sin notificaciones agresivas. Solo lo esencial para crear consistencia.

## Stack Técnico

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| Framework | React Native + Expo SDK 54 | Cross-platform con componentes nativos reales |
| Lenguaje | TypeScript | Type safety, mejor DX con IA |
| Navegación | Expo Router | File-based routing, simple y escalable |
| Estado | Zustand | Minimal boilerplate, persiste con AsyncStorage |
| Persistencia | AsyncStorage | Local-first, sin backend necesario |
| UI | React Native core | Componentes nativos, look & feel nativo |

## Arquitectura

```
habits-app/
├── app/                    # Rutas (expo-router)
│   ├── _layout.tsx         # Layout raíz
│   └── index.tsx           # Pantalla principal
├── src/
│   ├── components/         # Componentes reutilizables
│   ├── store/              # Zustand stores
│   └── types/              # TypeScript types
├── assets/                 # Imágenes, iconos
└── docs/                   # Documentación del proyecto
```

## Decisiones Técnicas

### 2025-01-31: Stack inicial
- **Decisión**: React Native + Expo sobre Flutter o Ionic
- **Razón**: Mejor ecosistema para desarrollo con IA (JavaScript/TypeScript), componentes nativos reales, Expo simplifica deployment a stores

### 2025-01-31: Zustand sobre Redux/Context
- **Decisión**: Usar Zustand para estado global
- **Razón**: API minimalista, persiste fácilmente con AsyncStorage, sin boilerplate

### 2025-01-31: Local-first sin backend
- **Decisión**: Empezar sin backend, solo AsyncStorage
- **Razón**: MVP minimalista, los datos de hábitos son personales y no requieren sync inicialmente

## Comandos

```bash
# Desarrollo
npm run web      # Lanzar en navegador
npm run ios      # Lanzar en iOS (requiere Expo Go o simulador)
npm run android  # Lanzar en Android (requiere Expo Go o emulador)

# Build para stores (cuando esté listo)
eas build --platform ios
eas build --platform android
```

## Próximos pasos

Ver `BACKLOG.md` para features pendientes.
