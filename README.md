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

- **Simplificación y Claridad en el Onboarding de Dieta (`DietOnboardingView.tsx` & `DietHelpModal.tsx`):**
  - **Eliminación de Estimación de Peso & Alertas Intrusivas:** Se retiró la opción y lógica de "Estimar peso por altura" tanto del paso 1 como de la guía de ayuda, y se eliminó el modal/alerta de confirmación de cálculo al guardar, permitiendo una transición limpia e inmediata al completar el plan.
  - **Guía Práctica con Ejemplos en Protocolos de Alimentación (Paso 4):** Se rediseñó el bloque de ayuno intermitente (`16:8`, `18:6`, `Tradicional`) para contrastar visualmente el horario en el que **SÍ se puede comer** (ej. 12:00 PM a 08:00 PM para 16:8) y el horario de **ayuno estricto** sin calorías (ej. 08:00 PM a 12:00 PM del día siguiente), con lineamientos claros sobre hidratación permitida.
  - **Glosario Educativo de BMR & TDEE:** En la tarjeta de "Recomendación en tiempo real", debajo de la meta de agua, se incorporó una sección dedicada explicando con precisión qué es la **Tasa Metabólica Basal (BMR)** (calorías mínimas en reposo absoluto para vivir) y el **Gasto Energético Total Diario (TDEE)** (BMR + actividad física/entrenamiento, base para calcular el superávit o déficit calórico).
  - **Limpieza y Remoción Total de Autodetección:** Remoción definitiva de los botones y lógica de autodetección de rutinas de Gym tanto en el paso 2 como en la guía de ayuda (`DietHelpModal.tsx`), manteniendo la selección manual directa, limpia y uniforme.

- **Homologación de Iconografía en Dashboard y Barra de Navegación:**
  - **Rutina de Gym en Dashboard (`WorkoutCard.tsx`):** Sustitución del icono SVG por el icono `Dumbbell` de `lucide-react-native` con color de acento `#38BDF8` (`neonCyan`), coincidiendo con el icono de "Mi Equipamiento" de la pantalla de Ajustes.
  - **Dieta & Macros en Dashboard (`DietCard.tsx`):** Sustitución del icono SVG por el icono `Flame` de `lucide-react-native` con color de acento `#38BDF8` (`neonCyan`), coincidiendo con el icono de "Plan Nutricional & Metas" de la pantalla de Ajustes.
  - **Pestaña Fit en Barra de Navegación Flotante (`BottomNav.tsx`):** Actualización del icono de la pestaña `Fit` en la barra de navegación flotante inferior para usar el icono `Flame` de `lucide-react-native`, manteniendo la coherencia semántica y visual entre navegación, dashboard y configuraciones.

- **Refactorización Modular de Dieta, Integración de `user.dieta` & Cronómetro Decreciente de Ayuno:**
  - **Integración del Flag `dieta` de Usuario (`user.service.ts` & `PUT /api/user/me`):**
    - Se incorporó la propiedad booleana `dieta` en `UserProfile`.
    - La vista de Dieta (`DietView.tsx`) y la tarjeta del Dashboard (`DietCard.tsx`) evalúan reactivamente `profile?.dieta`: si se encuentra en `false`, presentan en primera instancia el onboarding (`DietOnboardingView`) para crear el plan nutricional; una vez completado, se despacha la actualización a `/api/user/me` con `dieta: true` y se despliega la pantalla principal de nutrición.
  - **Desacoplamiento Modular y Depuración Visual (Clean Architecture & FSD):**
    - Se descompuso el monolito de `DietView` (reduciendo de 1022 a menos de 400 líneas) en subcomponentes modulares e independientes en `src/features/diet/components/`:
      - `DietMacrosCard.tsx`: Resumen calórico con calibre SVG circular Obsidian Cyan y barras de macronutrientes (Proteína, Carbos, Grasas) con números monospace `JetBrains Mono`.
      - `HydrationCard.tsx`: Módulo dedicado de hidratación diaria con barra de progreso tonal y botones de suma rápida (`+ 250ml`, `+ 500ml`).
      - `MealItemCard.tsx`: Tarjeta individual de comidas con badges semánticos (`Completado` / `Planeado`), horarios, desglose de ingredientes y macros.
    - **Remoción del Botón de Metas en Dieta:** Se retiró el botón "Metas" de la cabecera de `DietView` para evitar redundancia y amontonamiento, centralizando la configuración de metas nutricionales de forma exclusiva en la sección **Ajustes** (`SettingsScreen.tsx` -> `DietSetupModal`).
  - **Cronómetro de Ayuno Intermitente con Conteo Regresivo Local (`FastingCard.tsx`):**
    - Se eliminó el sondeo periódico de red (`refetchInterval: false`), realizando una consulta única al cargar el componente o al interactuar con las mutaciones de inicio/fin.
    - Se guarda la hora de inicio (`startTime`) y se ejecuta un cálculo de conteo regresivo que disminuye segundo a segundo contra el reloj local del dispositivo (`Date.now()`), garantizando exactitud absoluta sin desfases ni saturación de peticiones al backend.
  - **Alineación Visual y Estados de la Tarjeta del Dashboard (`DietCard.tsx`):**
    - Homologación estética con `WorkoutCard`: en estado inactivo/sin plan se retiró la rueda circular recargada, mostrando únicamente el subtítulo "Sin Plan Alimenticio", la leyenda explicativa para configurar metas y el estado "Pendiente" en el pie. Una vez que el usuario activa su plan, se retira por completo el pie de estado y la tarjeta muestra únicamente la cabecera, subtítulo con calorías del día, el calibre circular de macros y el desglose de nutrientes.

- **Blindaje de Reglas de Hooks & Cómputo de Fecha Local en Dashboard:**
  - **Corrección de Orden Incondicional de Hooks (`DietCard.tsx`):** Se reubicó la invocación de `useQuery` al inicio del componente, antes de cualquier guarda o retorno temprano condicional (`if (!isConfigured) return ...`), utilizando la bandera reactiva `enabled: isConfigured`. Esto elimina de raíz la excepción en caliente `Rendered more hooks than during the previous render` que ocurría al rehidratarse el perfil nutricional desde `expo-secure-store`.
  - **Manejo Determinista de Fechas Locales:** Sustitución de `toISOString().split('T')[0]` por `getLocalDateString()` en consultas de dieta y bitácoras, previniendo desfases horarios de medianoche en zonas horarias UTC-6.

- **Fases de Dietas y Nutrición Completa (`src/features/diet/` & `src/services/diet.service.ts`):**
  - **Servicio y Contratos de Nutrición (`src/services/diet.service.ts`):**
    - Integración completa con los 16 endpoints del backend (`/api/diet/*`) para:
      - Metas nutricionales (`GET/PUT /api/diet/target`, `POST /api/diet/calculate-target`).
      - Resumen diario y bitácora de comidas (`GET /api/diet/daily?date=YYYY-MM-DD`, `POST/PUT/DELETE /api/diet/meals`).
      - Catálogo de alimentos (`GET /api/diet/foods/search`, `GET /api/diet/foods/barcode/{barcode}`, `POST /api/diet/foods`).
      - Hidratación inteligente (`GET/POST /api/diet/water`, `PUT /api/diet/water/set`).
      - Ayuno intermitente (`GET /api/diet/fasting/status`, `POST /api/diet/fasting/start`, `POST /api/diet/fasting/stop`).
  - **Catálogo de Alimentos y Código de Barras (`FoodSearchModal.tsx` & `CreateFoodModal.tsx`):**
    - Búsqueda en tiempo real con debounce por nombre o descripción de alimentos.
    - Consulta instantánea por código de barras de productos comerciales.
    - Modal de creación de alimentos personalizados con desglose de macros (proteína, carbohidratos, grasas, sodio, potasio) y porción base.
    - Selector dinámico de cantidad al agregar alimentos a la comida con recálculo proporcional en vivo de calorías y macros.
  - **Registro y Edición de Comidas (`MealFormModal.tsx`):**
    - Creación y edición de comidas clasificadas por tipo (Desayuno, Comida, Cena, Snack).
    - Asignación de hora de ingesta, estado (Completado / Planeado) y lista de alimentos agregados.
    - Tarjeta resumen con sumatoria instantánea de calorías y macronutrientes totales de la comida.
  - **Temporizador de Ayuno Intermitente en Vivo (`FastingCard.tsx`):**
    - Widget reactivo sincronizado con el backend que muestra el protocolo activo (16:8), estado (En Ayuno / Ventana de Alimentación) y cronómetro con recálculo segundo a segundo.
    - Barra de progreso porcentual hacia la meta horaria y acciones seguras para Iniciar o Concluir el ayuno con alertas confirmatorias.
  - **Dashboard Diario de Nutrición (`DietView.tsx`):**
    - Selector de fecha para navegar entre días históricos, el día de hoy y futuros.
    - Anillo de progreso calórico con calorías consumidas, objetivo y calorías restantes.
    - Registro de hidratación con sumas rápidas de agua (`+ 250ml`).
    - Lista cronológica de comidas con badges de estado, desglose de ingredientes, macros y opciones de edición y eliminación directa.
    - Integración en tiempo real con la tarjeta `DietCard` del Dashboard principal.
  - **Onboarding Biométrico, Ayudas y Modificación desde Ajustes (`DietOnboardingView.tsx`, `DietHelpModal.tsx`, `SettingsScreen.tsx`):**
    - Configuración guiada con cálculo de TDEE y BMR mediante fórmula de Mifflin-St Jeor.
    - Modal de ayuda con técnicas caseras de medición para peso y altura.
    - Auto-estimación de peso por altura (IMC 22.5) y auto-detección del nivel de actividad según la cantidad de rutinas registradas en Gym.
    - Modificación de metas en cualquier momento desde la sección de Ajustes o directamente en la pantalla de Dieta.

- **Motor de Recomendación Biomecánica de Pesos y Sistema de Equipamiento de Gym:**
  - **Motor Biomecánico Inteligente (`src/utils/weightRecommendation.ts`):**
    - Calcula recomendaciones realistas de carga de trabajo inicial según la relación peso/altura del perfil del usuario (`UserService.getProfile`) y la dificultad asignada a la rutina (`Principiante`, `Intermedio`, `Avanzado`).
    - Aplica multiplicadores según el grupo muscular primario (piernas, pecho, espalda, hombros, brazos) y reglas mecánicas estrictas: barras olímpicas (mínimo de barra 20kg o 15kg según peso y saltos de 2.5kg), mancuernas (peso por mano en múltiplos de 2kg), máquinas/poleas (saltos de 5kg) y ejercicios con peso corporal (0kg con tag explícito).
    - **Insignia Interactiva en Rutinas (`RoutineExerciseItem.tsx`):** Muestra una insignia `💡 Sugerido: X kg` con justificación contextual. Al tocarla, aplica instantáneamente el valor sugerido en el input de peso.
    - **Pre-llenado Automático (`CreateRoutineScreen.tsx`):** Al seleccionar ejercicios desde el catálogo, se calcula y asigna automáticamente la carga recomendada sin requerir tecleo manual, permitiendo modificación libre por parte del usuario.
  - **Inventario y Perfiles de Equipamiento de Gimnasio (`src/store/equipmentStore.ts` y `EquipmentModal.tsx`):**
    - Perfiles preconfigurados: *Gimnasio Comercial* (catálogo completo de barras, mancuernas, poleas, Smith, máquinas y accesorios), *Home Gym / En Casa* (mancuernas, banco, bandas y peso corporal) y *Calistenia / Viaje* (peso corporal y bandas elásticas).
    - Persistencia en almacenamiento seguro con `expo-secure-store`.
    - Modal de configuración (`EquipmentModal`) con selector de perfil, checklist interactivo por máquina con iconos dedicados de Obsidian Cyan y opción de restaurar valores por defecto.
  - **Filtro de Equipamiento en Selector de Ejercicios (`ExercisePickerModal.tsx`):**
    - Barra de equipamiento integrada en el buscador que muestra el perfil activo, acceso directo al modal de configuración y switch rápido (`✓ Mi Equipo` / `Ver Todos`), descartando ejercicios no soportados por las instalaciones del usuario.
  - **Gestión desde Ajustes y Limpieza de UI (`SettingsScreen.tsx`):**
    - Nueva sección de preferencias **ENTRENAMIENTO & GYM** con acceso directo a "Mi Equipamiento" indicando el perfil actual y conteo de equipos activos.
    - Retiro del botón de prueba de notificaciones push para mantener una interfaz depurada y orientada al usuario final, optimizando la tarjeta de búsqueda de actualizaciones del sistema.

- **Unificación de Pantallas Gym & Dieta (`FitScreen` y Barra de Navegación):**
  - **Pestaña Unificada "Fit" en la Barra de Navegación:** Se consolidaron las rutas separadas de Gym y Diet en una única pestaña denominada `Fit`, conservando el icónico glifo de mancuerna (`Gym`) en `BottomNav`, reduciendo la barra a 5 pestañas equilibradas (`Dashboard`, `Ideas`, `Tasks`, `Fit`, `Money`) con áreas de toque optimizadas (WCAG 2.2).
  - **Switch Interactivo Gym & Dieta:** Se implementó un selector de tipo píldora (`typeToggle`) en `FitScreen` con diseño idéntico al de "Ideas & Diario", permitiendo alternar fluidamente entre `Gym` (entrenamientos, racha de la semana, rutinas y botón flotante de creación) y `Dieta` (resumen calórico, desglose de macronutrientes, hidratación, comidas programadas y protocolo 16:8).
  - **Navegación Contextual Bidireccional:** Tanto `WorkoutCard` como `DietCard` en el Dashboard ahora están enlazados de forma reactiva a `FitScreen`, navegando directamente a la subpestaña correspondiente (`initialTab: 'gym'` o `'diet'`) mediante parámetros de ruta tipados (`RootTabParamList`).
  - **Arquitectura Limpia & Modularidad:** Desacoplamiento de las vistas en `GymView` (`src/features/gym/components/GymView.tsx`) y `DietView` (`src/features/diet/components/DietView.tsx`), manteniendo la cohesión por dominios y wrappers de retrocompatibilidad en `GymScreen` y `DietScreen`.

- **Actualización de Compatibilidad de Dependencias (Expo SDK 57):**
  - **Sincronización de `expo-notifications` (`~57.0.24`):** Se actualizó el paquete `expo-notifications` a la versión `57.0.24` recomendada por `npx expo install --check` para total alineación con el runtime de Expo SDK 57, asegurando el soporte continuo de notificaciones locales y push, actualizando las exclusiones de release en `pnpm-workspace.yaml`.

- **Diagnóstico y Robusteza en Actualizaciones OTA (`useOTAUpdates` y `SettingsScreen`):**
  - **Detección y Feedback Visual:** Se integró un indicador de carga (`ActivityIndicator`) dentro del botón "Buscar Actualizaciones" en `SettingsScreen` respetando las directrices de diseño, desactivando el botón mientras se consulta la API de Expo Updates.
  - **Guarda de Seguridad de Estado:** Comprobación estricta de `Updates.isEnabled` tanto en `useOTAUpdates` como en `handleCheckUpdates` para prevenir excepciones al ejecutar en builds de depuración o entornos locales donde las actualizaciones OTA no están habilitadas.
  - **Diagnóstico Transparente en UI:** Cuando el dispositivo se encuentra al día o las actualizaciones están deshabilitadas, se presenta una alerta informativa detallando el canal activo (`Updates.channel`), la versión de runtime (`Updates.runtimeVersion`) y el identificador de la actualización actual (`Updates.updateId`), permitiendo auditar inmediatamente cualquier discrepancia entre el bundle publicado y el runtime del APK nativo instalado.
  - **Estrategia Estable de Runtime Version (`0.0.10`):** Se sincronizó la versión de la aplicación a `0.0.10` en `app.json` y `package.json` utilizando la política determinista `appVersion`. Esto previene fallos de cálculo cruzado en Expo Updates ocasionados por la resolución de rutas acortadas de `pnpm` entre Windows y los workers Linux de EAS Build, garantizando builds nativas exitosas y entrega predecible de actualizaciones OTA.
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
