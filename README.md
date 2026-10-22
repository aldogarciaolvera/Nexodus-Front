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

- **Alineación de Layouts, Scroll en Ajustes, Dashboard Dinámico y Carga Completa de Ejercicios:**
  - **Alineación Pixel-Perfect de Headers entre Pestañas:** Se normalizó la jerarquía de vistas y el padding superior (`paddingTop: Platform.OS === 'android' ? 24 : 12` y `paddingHorizontal: 20`) en `GymScreen`, `JournalScreen` y `DietScreen`, eliminando el desnivel de 4px al alternar entre pestañas desde la barra inferior.
  - **Soporte de Desplazamiento en Ajustes (`SettingsScreen`):** Se integró un `ScrollView` envolvente con `keyboardShouldPersistTaps="handled"` y padding inferior seguro, garantizando acceso a todas las opciones (perfil, recordatorios, preferencias, tokens y cierre de sesión) en pantallas de cualquier tamaño.
  - **Previsualización de Ejercicios y Ajuste de Tarjetas en Dashboard:**
    - `WorkoutCard`: Ahora consulta y presenta los nombres de los ejercicios programados para la rutina de hoy aunque el entrenamiento aún no se haya iniciado (`gymService.getRoutineById`), mostrando además el número de ejercicios programados en el gauge circular.
    - **Ajuste Natural al Contenido:** Se removieron `flex: 1`, `minHeight: 180` y `justifyContent: 'space-between'` en `DailyTodoCard`, `WorkoutCard`, `DietCard`, `FinanceCard` e `IdeasCard`, eliminando los espacios vacíos y permitiendo que cada tarjeta abrace fielmente su contenido.
  - **Carga de Todos los Ejercicios al Crear Rutinas:**
    - Se implementó `gymService.getAllExercises()` con estrategia de fallback de paginación automática respetando el tope de `pageSize=100` del backend y paginando en paralelo o secuencialmente según metadata (`totalPages` / lotes de 50-100) con deduplicación por ID, garantizando que el selector cargue la totalidad de los ejercicios de la base de datos sin importar cómo divida las páginas el backend.

- **Recordatorio Global de Tareas y Corrección Integral de Notificaciones:**
  - **Recordatorio Global Diario en Ajustes:** Se implementó una nueva preferencia en `SettingsScreen` con un Switch interactivo y selector horario emergente (`CustomTimePicker`). Al activarse, permite elegir la hora deseada (ej. `20:00`) y programa una notificación local diaria persistente para alertar al usuario de revisar y completar sus tareas del día. Una vez guardado, se muestra el Switch activo y una píldora táctil con la hora configurada para permitir ajustes posteriores.
  - **Corrección de Entrega de Notificaciones en Tareas y Hábitos (`notifications.ts`):**
    - **Parsing Robusto de Horarios:** Se resolvió el error crítico donde `new Date(todo.notificationTime)` con formato `"HH:mm"` generaba `Invalid Date` y parámetros `NaN`, impidiendo la programación de alertas.
    - **Normalización de Frecuencias e Idiomas:** Se corrigió la discrepancia de nombres entre el selector de la UI (`Daily`, `Weekly`, `Monthly`) y las condiciones de scheduling, dando soporte a ambas convenciones en inglés y español.
    - **Mapeo de Días de la Semana:** Corrección del índice de días entre el estándar de la app (1=Lunes .. 7=Domingo) y la API de Expo Notifications (1=Domingo .. 7=Sábado) para hábitos semanales con `customDays`.
    - **Canal de Notificaciones en Android (`setNotificationChannelAsync`):** Creación mandatoria del canal de importancia máxima (`AndroidImportance.MAX`), sonido del sistema por defecto (omitiendo la clave `sound` para evitar la búsqueda errónea de assets de audio locales en el bundle nativo) y vinculación directa a los triggers para garantizar la presentación de banners y sonido en Android 8.0+.
    - **Inicialización Global del Handler:** Desacoplamiento de `setNotificationHandler` para ejecutarse a nivel de raíz (`notifications.ts` y `App.tsx`), garantizando que las notificaciones en primer plano y segundo plano se muestren consistentemente sin importar la pantalla activa.
    - **Sincronización en `AllTasksScreen`:** Integración de `scheduleTodoNotification` y `cancelTodoNotification` al editar o eliminar tareas desde la vista completa de tareas.

- **Buscador de Ejercicios y Localización al Español (Módulo de Gimnasio):**
  - **Buscador en Tiempo Real e Inmune a Acentos:** Implementación de una barra de búsqueda (`TextInput`) con soporte accesible en `ExercisePickerModal` y normalización de texto NFD (`normalizeSearchText`) para ignorar acentos, diacríticos y mayúsculas/minúsculas (ej. "Jalon" encuentra "Jalón", "Biceps" encuentra "Bíceps", "maquina" encuentra "Máquina"). Permite filtrar instantáneamente ejercicios por nombre si el usuario ya los conoce, o por músculo, grupo o equipamiento. Cuenta con botón de limpieza (`X`), estado vacío informativo y contador de resultados.
  - **Localización Completa al Español:** Mapeo y traducción integral de anatomía y equipamiento (`src/utils/gymTranslations.ts`), traduciendo partes del cuerpo (`chest` -> Pecho, `shoulders` -> Hombros, `back` -> Espalda, etc.), grupos musculares (`delts` -> Deltoides, `biceps` -> Bíceps, etc.), equipamiento y categorías en los filtros, badges de selección, tarjetas de creación de rutinas (`RoutineExerciseItem`) y durante la ejecución de entrenamientos (`ActiveWorkoutScreen`).
  - **Sincronización Total con Endpoints del Backend:**
    - `gymService.getExercises`: Soporte para paginación opcional (`page`, `pageSize`) y desempaquetado agnóstico de formatos de respuesta (`array`, `{ items }`, `{ data }`, `{ content }`).
    - Métodos agregados en `gymService`: `getWorkoutLogById` y `deleteWorkoutLog` (`/api/workouts/:id`).
    - Verificación y blindaje de endpoints: `/api/todos/:id/uncompleted`, `/api/notes/:id` (con `PATCH`), `/api/finances`, `/api/categories`, `/api/auth` y `/api/user/me`.

- **Auditoría Integral de Rendimiento, Accesibilidad y Tipado Estricto:**
  - **Accesibilidad Universal (WCAG 2.2):** Se dotó a todos los botones interactivos, iconos de acción, modales, controles de peso y casillas de verificación de áreas de toque mínimas de 48x48px (`hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}`), junto con roles semánticos (`accessibilityRole="button" | "checkbox"`), etiquetas descriptivas (`accessibilityLabel`) y estados de accesibilidad (`accessibilityState`).
  - **Query Key Factory & Estrategia de Caché Global:** Centralización de todas las claves de consulta en `src/services/queryKeys.ts` (`todos`, `gym`, `finance`, `journal`, `user`). Se configuró `QueryClient` en `App.tsx` con `staleTime: 2min`, `gcTime: 30min`, `retry: 1` y `refetchOnWindowFocus: false`, eliminando desincronizaciones de caché entre tarjetas y pantallas completas.
  - **Aislamiento de Re-renderizados en Entrenamientos Activos:** Desacoplamiento del cronómetro en `ActiveWorkoutScreen` en un subcomponente memoizado `<WorkoutTimer />` con selectores específicos de Zustand (`useWorkoutStore(state => state.elapsedSeconds)`), reduciendo drásticamente los re-renderizados innecesarios del árbol de ejercicios de 60 por minuto a 0.
  - **Optimización de Listas y Derivación de Datos con `useMemo`:** Se envolvieron todos los filtrados pesados, ordenamientos y cálculos de rachas/métricas en `useMemo` en `DailyTodoCard`, `IdeasCard`, `WorkoutCard`, `JournalScreen`, `TasksScreen`, `AllTasksScreen` y `AllTransactionsScreen`, además de implementar *array reference hoisting* (`EMPTY_TODOS`, `EMPTY_ROUTINES`, `EMPTY_NOTES`) para prevenir recolector de basura excesivo.
  - **Tipado Completo de Navegación y Estilos:** Definición centralizada de tipos en `src/utils/navigation.ts` con tipado global en `ReactNavigation.RootParamList` para autocompletado y validación estricta de rutas en toda la app. Tipado fuerte en `createStyles(colors, typography, metrics)` y en los selectores de `useAlertStore`.
  - **Fidelidad Tipográfica Obsidian Cyan:** Se corrigieron los nombres de fuentes en las tarjetas del Dashboard a las familias exactas cargadas por Expo (`Geist_400Regular`, `Geist_500Medium`, `JetBrainsMono_400Regular`, `JetBrainsMono_500Medium`), evitando caídas a las fuentes del sistema y garantizando números tabulares fijos en métricas sin saltos de layout.
  - **Unificación de Alertas de Confirmación:** Reemplazo de submenús redundantes por diálogos estructurados en `<GlobalAlert />` para eliminación segura de categorías y registros.

- **Refactorización de Arquitectura FSD & Modularización:**
  - Reubicación de las tarjetas del Dashboard (`DailyTodoCard`, `WorkoutCard`, `FinanceCard`, `DietCard`, `IdeasCard`) al dominio `src/features/dashboard/components/`, retirando el directorio centralizado obsoleto `src/components/cards/`.
  - Conexión real de `WorkoutCard` con el estado en vivo de las rutinas (`useWorkoutStore` y `gymService.getRoutines`), permitiendo iniciar o continuar entrenamientos asignados para el día actual desde el Dashboard principal.
  - Modularización de pantallas complejas extrayendo subcomponentes independientes y desacoplados:
    - `ExercisePickerModal` y `RoutineExerciseItem` en `src/features/gym/components/`, reduciendo la pantalla `CreateRoutineScreen` de 684 a 290 líneas.
    - `GymOnboardingModal` en `src/features/gym/components/` para el registro inicial de peso y altura.
    - `ProfileEditModal` en `src/features/settings/components/` para la edición de perfil.
    - `FrequencySelector` en `src/features/tasks/components/` para la selección de frecuencia y días de hábitos/tareas.
- **Optimización de Peticiones de Red (Caching Agresivo):**
  - Implementación de `staleTime` (10 minutos) y `gcTime` (30 minutos) en `useQueries` dentro de `GymScreen` para eliminar la tormenta de peticiones N+1 al consultar los detalles de cada rutina.
- **Barra de Navegación Flotante (Floating Detached BottomNav):**
  - Rediseño de `BottomNav` como barra flotante despegada del fondo (*floating detached*) con `borderRadius: 24`, separación vertical adaptativa por plataforma, fondo translúcido con efecto glassmorphic y borde tonal de 1px.
- **Reactividad Completa de Tema Claro / Oscuro:**
  - Migración sistemática de componentes base (`Input`, `Button`, `GlobalAlert`, `LoginScreen`, `RegisterScreen`, etc.) al hook reactivo `useTheme()`, garantizando cambios de tema fluidos e inmediatos en toda la UI sin recargas.
  - Eliminación estricta de propiedades `elevation` (sombras proyectadas) en `GlobalAlert`, `DropdownMenu` y `CreateTaskModal`, cumpliendo con el diseño Obsidian Cyan basado en contraste tonal y bordes estructurales de 1px.
  - Aplicación de tipografía monospace `JetBrains Mono` en métricas y balances numéricos (como en `NetWorthCard`) para prevenir desplazamientos tabulares.
- **Actualizaciones OTA en UI:** Implementación de un botón interactivo "Buscar Actualizaciones" en la pantalla de Configuración (`SettingsScreen`), el cual consulta programáticamente a los servidores de EAS a través de `expo-updates` y solicita el reinicio de la aplicación si se encuentra código JS nuevo.
- **Módulo de Gym (Rastreo de Entrenamiento):** 
  - Las listas de Rutinas pre-calculan de forma reactiva (`useQueries`) la cantidad de ejercicios en ellas en base al detalle, hidratando los nombres y miniaturas desde los ejercicios cacheados.
  - Implementación de eliminación de rutinas mediante la acción "Mantener presionado" (Long press), protegido por nuestro modal `GlobalAlert`.
  - El registro de pesos (+, - e input manual) en entrenamientos activos fue refactorizado para ligarse al *índice* específico de un ejercicio en la rutina, lo cual evita que la carga de un ejercicio globalice e impacte otros bloques diferentes.
  - Se corrigió el problema crítico de barras negras en el teclado en Android dentro de formularios densos configurando `KeyboardAvoidingView` con `behavior={undefined}` y abstrayendo los botones de confirmación ("Guardar", "Pausar/Siguiente") de la vista desplazable para mantenerlos siempre anclados en el fondo.
- **Diario y Notas:** CRUD completo de notas (Ideas y Diario) conectado al backend (`/api/notes`) utilizando `react-query` y listas (checklists) dinámicas interactivas.
- **Módulo de Gym (Creación de Rutina):** Creación del flujo completo para la gestión de rutinas, incluyendo un "Gate" de salud (verificación de peso y altura inicial). Pantalla `CreateRoutineScreen` con selección de ejercicios, filtros por músculo/equipamiento, selección de día (`targetDay`), pre-carga y cacheo en cliente de los ejercicios usando `react-query` y renderizado de miniaturas animadas con `expo-image`.
- **Gestión de Tareas y Hábitos:** Lógica avanzada en la pantalla `TasksScreen` con desmarcado (uncomplete) de tareas. Los hábitos recurrentes distinguen automáticamente la fecha, reiniciando su estado si se entra en un nuevo día. La "Racha" ahora muestra el total histórico de veces completadas. Soporte estricto de filtros por frecuencias, renderización priorizada de "Urgentes", y menú contextual de borrado al mantener presionado. Integración de `@react-native-community/datetimepicker` para permitir a los usuarios agendar la hora exacta de sus notificaciones en el modal de creación.
- **Gestión de Notificaciones Push:** Lógica base y UI para soporte a notificaciones locales/push en la app, incluyendo un switch en configuración (`SettingsScreen`) y soporte a notificaciones individuales por Tarea/Hábito (`notificationsEnabled`).
- **Gestión de Estado de Servidor:** Integración de `@tanstack/react-query` para manejo eficiente de caché, mutaciones optimistas y estado asíncrono.
- **Autenticación y Persistencia:** Sistema de sesión utilizando Zustand y `SecureStore` (Expo), implementando rotación de Refresh Tokens transparente en el backend (interceptores) y un timeout de inactividad de 48 horas. Se solucionó el bug de expiración prematura usando un mutex-style `refreshPromise`.
- **Arquitectura de Servicios:** Implementación de un patrón de API en `src/services/` que maneja tokens (JWT), interceptores globales para errores `401`, y abstracciones por dominio (`UserService`, `FinanceService`, `CategoryService`, `TodoService`, `JournalService`, `GymService`).
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
