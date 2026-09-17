# Nexodus

Nexodus es una aplicación móvil desarrollada con **React Native** y **Expo (v57)**, diseñada con un enfoque minimalista, técnico y de lujo (Stealth Luxury) conocido como **Obsidian Cyan**.

## 🛠 Stack Tecnológico

- **Framework:** React Native / Expo (v57)
- **Lenguaje:** TypeScript
- **Navegación:** React Navigation v7 (Bottom Tabs, Native Stack)
- **Manejo de Estado:** Zustand
- **Gestor de Paquetes:** pnpm

## 🏗 Arquitectura (Feature-Sliced Design)

El proyecto sigue estrictamente los principios de **Clean Architecture** estructurando el código dentro del directorio `src/`:

- `src/assets/`: Recursos estáticos (imágenes, fuentes, etc.).
- `src/components/`: Componentes UI reutilizables y aislados.
- `src/features/`: Módulos de la aplicación agrupados por funcionalidad (ej. todo, workout, diet, finance).
- `src/hooks/`: Custom hooks de React.
- `src/services/`: Integraciones con APIs externas y servicios.
- `src/store/`: Manejo de estado global (Zustand).
- `src/utils/`: Funciones de utilidad generales.

*Referencia: [`ARCHITECTURE.md`](./ARCHITECTURE.md)*

## 🎨 Diseño Visual (Obsidian Cyan)

La aplicación implementa un sistema de diseño propio caracterizado por:
- **Modo Oscuro Estricto:** Lienzo neutral (`#0D0E11`) con superficies elevadas (`#171922`, `#1B1E28`).
- **Acento Principal:** Cian eléctrico (`#00F0FF`) para los estados activos y llamadas a la acción.
- **Tipografía:** `Geist` para cuerpos y títulos; `JetBrains Mono` para métricas, tags y números.
- **Geometría:** Uso de bordes redondeados (16px para tarjetas, píldoras para tags) sin sombras proyectadas, basando la elevación en capas de color tonal.

*Referencia: [`DESIGN.md`](./DESIGN.md)*

## 🆕 Últimos Cambios

- **Gestión de Estado de Servidor:** Integración de `@tanstack/react-query` para manejo eficiente de caché, mutaciones optimistas y estado asíncrono.
- **Autenticación y Persistencia:** Sistema de sesión utilizando Zustand y `SecureStore` (Expo) con timeout de inactividad de 48 horas para proteger la sesión.
- **Arquitectura de Servicios:** Implementación de un patrón de API en `src/services/` que maneja tokens (JWT), interceptores globales para errores `401`, y abstracciones por dominio (`UserService`, `FinanceService`, `CategoryService`).
- **Módulo de Configuración:** Creación de `SettingsScreen` conectada al backend (`/api/user/me`) permitiendo actualización del perfil y toggle de tema dinámico (claro/oscuro).
- **Dashboard Reactivo:** La tarjeta de Finanzas (`FinanceCard`) se ha conectado a la API en tiempo real para mostrar ingresos vs. gastos (Ayer/Hoy) de forma dinámica.
- **Correcciones de UI/UX:** Mitigación de "destellos blancos" en la navegación configurando el color de fondo raíz en el `SafeAreaProvider`, `NavigationContainer` y `app.json` alineados a la filosofía *Obsidian Cyan*.
- **Navegación**: Migración de Native Stack a `@react-navigation/bottom-tabs` con una barra inferior personalizada (`BottomNav`).

## 🚀 Instalación y Uso

Asegúrate de tener instalado [pnpm](https://pnpm.io/) y Node.js.

```bash
# 1. Instalar dependencias
pnpm install

# 2. Iniciar el servidor de desarrollo de Expo
pnpm start

# Opciones adicionales:
pnpm run android
pnpm run ios
```

## 📦 Generar APK (Android)

Para generar el archivo instalable `.apk` para Android utilizamos **EAS Build** (Expo Application Services). 

```bash
# 1. Instalar la herramienta EAS CLI globalmente
pnpm add -g eas-cli

# 2. Iniciar sesión en tu cuenta de Expo
eas login

# 3. Mandar a compilar la aplicación a los servidores de Expo
eas build -p android --profile preview
```

> **Nota:** La configuración ya incluye un perfil `preview` en `eas.json` parametrizado con `"buildType": "apk"` para que Expo devuelva el binario directo (APK) en lugar de un Android App Bundle (AAB). Al finalizar la compilación, se proveerá un enlace de descarga en la terminal.
