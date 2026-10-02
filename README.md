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

- **Diario y Notas:** CRUD completo de notas (Ideas y Diario) conectado al backend (`/api/notes`) utilizando `react-query` y listas (checklists) dinámicas interactivas.
- **Gestión de Notificaciones Push:** Lógica base y UI para soporte a notificaciones locales/push en la app, incluyendo un switch en configuración (`SettingsScreen`) y soporte a notificaciones individuales por Tarea/Hábito (`notificationsEnabled`).
- **Gestión de Estado de Servidor:** Integración de `@tanstack/react-query` para manejo eficiente de caché, mutaciones optimistas y estado asíncrono.
- **Autenticación y Persistencia:** Sistema de sesión utilizando Zustand y `SecureStore` (Expo), implementando rotación de Refresh Tokens transparente en el backend (interceptores) y un timeout de inactividad de 48 horas. Se solucionó el bug de expiración prematura usando un mutex-style `refreshPromise`.
- **Arquitectura de Servicios:** Implementación de un patrón de API en `src/services/` que maneja tokens (JWT), interceptores globales para errores `401`, y abstracciones por dominio (`UserService`, `FinanceService`, `CategoryService`, `TodoService`, `JournalService`).
- **Arquitectura de Entornos (Dual-App):** Configuración de variables dinámicas (`APP_VARIANT`) en `app.config.js` y `eas.json` para permitir la coexistencia de dos versiones independientes de la app en el mismo dispositivo ("Nexodus_Develop" y "Nexodus").
- **Módulo de Configuración:** Creación de `SettingsScreen` conectada al backend (`/api/user/me`) permitiendo actualización del perfil y toggle de tema dinámico (claro/oscuro). Incluye pruebas para forzar el Refresco de Token en entorno de pruebas.
- **Dashboard de Finanzas Avanzado:** La tarjeta de Patrimonio Neto (`NetWorthCard`) divide automáticamente el saldo restante según el método de pago ("En Efectivo" vs "En Tarjetas") y resalta en rojo los balances negativos, calculado de forma reactiva con React Query en base al historial de transacciones (ingresos y gastos).
- **Dashboard Mejorado:** Las tarjetas de `FinanceCard` y `DailyTodoCard` ahora son botones interactivos que navegan a sus respectivas secciones. La sección de finanzas se auto-reinicia para mostrar únicamente los gastos del **mes en curso**. Se agregó una nueva tarjeta dinámica (`IdeasCard`) para visualizar hasta 3 ideas activas.
- **Finanzas (Límites Mensuales):** La tarjeta de "Restricciones de Mes" (`OperatingTargetsCard`) ahora muestra el cálculo del flujo neto por categoría (Total Ingresos - Total Gastos), coloreando dinámicamente el resultado en verde (`success`) o rojo (`error`).
- **Dashboard de Tareas:** La tarjeta `DailyTodoCard` del dashboard ahora muestra datos reales de Tareas y Hábitos, integrando estados de carga dinámicos (Skeletons) e indicando la proporción de tareas completadas.
- **Gestión de Tareas y Hábitos:** Lógica avanzada en la pantalla `TasksScreen` con desmarcado (uncomplete) de tareas, soporte estricto de filtros por frecuencias (Un solo día, Diario, Semanal y Mensual), renderización priorizada de "Urgentes" y menú contextual de borrado al mantener presionado. Integración de `@react-native-community/datetimepicker` para permitir a los usuarios agendar la hora exacta (`notificationTime`) de sus notificaciones en el modal de creación.
- **Componentes UI y UX (Obsidian Cyan):** 
  - Refinamiento masivo de interfaces eliminando _drop shadows_ y aplicando bordes tonales sólidos estrictamente a través de variables de `theme.colors` (`GlobalAlert`, `DropdownMenu`, `CreateTaskModal`).
  - Mitigación de "destellos blancos" en la navegación configurando el color de fondo raíz en el `SafeAreaProvider`, `NavigationContainer` y `app.json` alineados a la filosofía *Obsidian Cyan*.
  - Navegación: Migración de Native Stack a `@react-navigation/bottom-tabs` con una barra inferior personalizada (`BottomNav`).
  - Reemplazo total de la API nativa `Alert.alert` por un componente `<GlobalAlert />` centralizado con Zustand.
  - Utilización de estado de carga fluido con componentes genéricos `Skeleton` para evitar renderizados bruscos durante la carga de APIs.
  - Implementación global del patrón de envolver modales y pantallas con entradas de texto en `<KeyboardAvoidingView>` y `<ScrollView>` para prevenir solapamiento con el teclado de software en iOS y Android.
  - Incorporación del componente contextual `<ActionSheet />` tipo menú inferior para acciones de edición o borrado rápido.

## 🚀 Instalación y Uso Local

Asegúrate de tener instalado [pnpm](https://pnpm.io/) y Node.js. Al ya no soportar Expo Go para notificaciones push, la aplicación requiere compilar un "Development Client".

```bash
# 1. Instalar dependencias
pnpm install

# 2. Iniciar el servidor de desarrollo de Expo
pnpm start
```
*Una vez iniciado, abre la aplicación "Nexodus_Develop" instalada previamente en tu teléfono (ver sección Generar APK) para conectarla al servidor local.*

## 📦 Generar APKs (Android)

La arquitectura de la aplicación permite tener **dos versiones instaladas simultáneamente** en tu teléfono sin que choquen:
1. **Nexodus_Develop** (`com.garciaolveraaldo.Nexodus.dev`): Usada exclusivamente para desarrollo local con el bundler de Metro. Permite probar notificaciones push sin enviar a tiendas.
2. **Nexodus** (`com.garciaolveraaldo.Nexodus`): Versión `preview` o `production` lista para demostraciones reales o entrega.

Para compilar las APKs, utiliza **EAS Build**:

```bash
# Generar la APK de Desarrollo (Nexodus_Develop)
eas build --profile development --platform android

# Generar la APK de Pruebas o Producción (Nexodus)
eas build --profile preview --platform android
```

> **Nota:** `eas.json` está preconfigurado para que ambas perfiles devuelvan un instalable `.apk` listo para arrastrar e instalar en tu celular.

## 📡 Actualizaciones OTA (Over-The-Air)

La aplicación cuenta con actualizaciones rápidas OTA (`expo-updates`) mediante EAS Update. Te permite inyectar cambios de Javascript y diseño al instante sin tener que reinstalar la APK. 

### Comandos de Actualización (OTA)

Si quieres mandar un cambio en vivo, ejecuta el comando hacia la "rama" deseada. Siempre recomendamos usar el flag `--clear-cache` si recientemente instalaste dependencias para evitar errores del empaquetador.

**Para actualizar la app de Desarrollo (Nexodus_Develop):**
*(Normalmente se prueba todo en local, pero si necesitas mandar OTA a un equipo remoto):*
```bash
eas update --branch development --message "Actualización a rama dev" --clear-cache
```

**Para actualizar la app de Pruebas (Nexodus):**
```bash
eas update --branch preview --message "Actualización a rama preview" --clear-cache
```

> **Regla de oro:** Las actualizaciones OTA solo aplican para cambios en JS/TS o diseño. Si agregas una librería con dependencias nativas (ej. nuevo módulo de cámara o permisos del sistema), debes **forzosamente** volver a compilar una nueva APK.
