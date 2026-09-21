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
- **Autenticación y Persistencia:** Sistema de sesión utilizando Zustand y `SecureStore` (Expo), implementando rotación de Refresh Tokens transparente en el backend (interceptores) y un timeout de inactividad de 48 horas. Se solucionó el bug de expiración prematura usando un mutex-style `refreshPromise`.
- **Arquitectura de Servicios:** Implementación de un patrón de API en `src/services/` que maneja tokens (JWT), interceptores globales para errores `401`, y abstracciones por dominio (`UserService`, `FinanceService`, `CategoryService`, `TodoService`).
- **Módulo de Configuración:** Creación de `SettingsScreen` conectada al backend (`/api/user/me`) permitiendo actualización del perfil y toggle de tema dinámico (claro/oscuro). Incluye pruebas para forzar el Refresco de Token en entorno de pruebas.
- **Dashboard de Finanzas Avanzado:** La tarjeta de Patrimonio Neto (`NetWorthCard`) divide automáticamente el saldo restante según el método de pago ("En Efectivo" vs "En Tarjetas") y resalta en rojo los balances negativos, calculado de forma reactiva con React Query en base al historial de transacciones (ingresos y gastos).
- **Dashboard de Tareas:** La tarjeta `DailyTodoCard` del dashboard ahora muestra datos reales de Tareas y Hábitos, integrando estados de carga dinámicos (Skeletons) e indicando la proporción de tareas completadas.
- **Gestión de Tareas y Hábitos:** Lógica avanzada en la pantalla `TasksScreen` con desmarcado (uncomplete) de tareas, soporte estricto de filtros por frecuencias (Un solo día, Diario, Semanal y Mensual), renderización priorizada de "Urgentes" y menú contextual de borrado al mantener presionado.
- **Correcciones de UI/UX:** Mitigación de "destellos blancos" en la navegación configurando el color de fondo raíz en el `SafeAreaProvider`, `NavigationContainer` y `app.json` alineados a la filosofía *Obsidian Cyan*.
- **Navegación:** Migración de Native Stack a `@react-navigation/bottom-tabs` con una barra inferior personalizada (`BottomNav`).
- **Sistema de Alertas Global:** Reemplazo total de la API nativa `Alert.alert` por un componente `<GlobalAlert />` gestionado de manera reactiva por `alertStore.ts` (Zustand), alineado con el diseño visual del proyecto.
- **Gestión Estándar del Teclado:** Implementación global del patrón de envolver modales y pantallas con entradas de texto en `<KeyboardAvoidingView>` y `<ScrollView>` para prevenir solapamiento con el teclado de software en iOS y Android.

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
- **Autenticación y Persistencia:** Sistema de sesión utilizando Zustand y `SecureStore` (Expo), implementando rotación de Refresh Tokens transparente en el backend (interceptores) y un timeout de inactividad de 48 horas. Se solucionó el bug de expiración prematura usando un mutex-style `refreshPromise`.
- **Arquitectura de Servicios:** Implementación de un patrón de API en `src/services/` que maneja tokens (JWT), interceptores globales para errores `401`, y abstracciones por dominio (`UserService`, `FinanceService`, `CategoryService`, `TodoService`).
- **Módulo de Configuración:** Creación de `SettingsScreen` conectada al backend (`/api/user/me`) permitiendo actualización del perfil y toggle de tema dinámico (claro/oscuro). Incluye pruebas para forzar el Refresco de Token en entorno de pruebas.
- **Dashboard de Finanzas Avanzado:** La tarjeta de Patrimonio Neto (`NetWorthCard`) divide automáticamente el saldo restante según el método de pago ("En Efectivo" vs "En Tarjetas") y resalta en rojo los balances negativos, calculado de forma reactiva con React Query en base al historial de transacciones (ingresos y gastos).
- **Dashboard de Tareas:** La tarjeta `DailyTodoCard` del dashboard ahora muestra datos reales de Tareas y Hábitos, integrando estados de carga dinámicos (Skeletons) e indicando la proporción de tareas completadas.
- **Gestión de Tareas y Hábitos:** Lógica avanzada en la pantalla `TasksScreen` con desmarcado (uncomplete) de tareas, soporte estricto de filtros por frecuencias (Un solo día, Diario, Semanal y Mensual), renderización priorizada de "Urgentes" y menú contextual de borrado al mantener presionado.
- **Correcciones de UI/UX:** Mitigación de "destellos blancos" en la navegación configurando el color de fondo raíz en el `SafeAreaProvider`, `NavigationContainer` y `app.json` alineados a la filosofía *Obsidian Cyan*.
- **Navegación:** Migración de Native Stack a `@react-navigation/bottom-tabs` con una barra inferior personalizada (`BottomNav`).
- **Sistema de Alertas Global:** Reemplazo total de la API nativa `Alert.alert` por un componente `<GlobalAlert />` gestionado de manera reactiva por `alertStore.ts` (Zustand), alineado con el diseño visual del proyecto.
- **Gestión Estándar del Teclado:** Implementación global del patrón de envolver modales y pantallas con entradas de texto en `<KeyboardAvoidingView>` y `<ScrollView>` para prevenir solapamiento con el teclado de software en iOS y Android.

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

## 📡 Actualizaciones OTA (Over-The-Air)

La aplicación cuenta con el motor de actualizaciones rápidas OTA (`expo-updates`) mediante EAS Update, lo que permite inyectar nuevo código sin necesidad de generar o descargar un nuevo APK. Al abrir la app (o al regresar de segundo plano), se notificará automáticamente al usuario si existe una actualización disponible para reiniciar la aplicación.

### Enviar una Actualización

Para mandar un cambio en vivo a los usuarios, el comando debe coincidir con el perfil (`--profile`) que usaste para compilar el APK. 

Si generaste tu APK con `--profile preview` (como se muestra en el ejemplo anterior), envía la actualización a esa rama:
```bash
eas update --branch preview --message "Breve descripción del cambio"
```

Si en el futuro generas tu APK final con `--profile production`, enviarás la actualización a esa rama:
```bash
eas update --branch production --message "Breve descripción del cambio"
```

> **Nota importante:** Las actualizaciones OTA solo funcionan para cambios en código Javascript/TypeScript (React Native) y assets (imágenes). Si en el futuro instalas una nueva librería que modifique código nativo (como acceso a cámara, notificaciones push, Bluetooth, etc.), entonces sí tendrás que generar un nuevo APK.
