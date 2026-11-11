# Nexodus

Nexodus es una aplicación móvil desarrollada con **React Native** y **Expo (v58)**, diseñada con un enfoque minimalista, técnico y de lujo (Stealth Luxury) conocido como **Obsidian Cyan**.

## 🛠 Stack Tecnológico

- **Framework:** React Native (0.88.1) / Expo (v58)
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

- **Corrección de Entrenamiento Activo, Series, Calculadora de Discos & Modal de Salida (`ActiveWorkoutScreen.tsx`, `SetRowItem.tsx`, `PlateCalculatorModal.tsx`, `ExitWorkoutModal.tsx`, `GymView.tsx` & Backend `Program.cs`):**
  - **Erradicación de Superposición y Alineación Pixel-Perfect en Tabla de Series (`SetRowItem.tsx` & `ActiveWorkoutScreen.tsx`):**
    - Se resolvieron los solapamientos de cajas donde los inputs de `REPS` y el botón de check (`✓`) colisionaban.
    - Se definieron columnas fijas con anchos independientes y balanceados: `SET` (26px), `TIPO` (34px), `PREV` (`flex: 1`, min 44px), `KG` (60px), `REPS` (52px), `CHECK` (32px) y `DELETE` (26px).
    - Los encabezados de la tabla (`tableHeader`) se sincronizaron al píxel con las filas de datos (`row`), eliminando márgenes flotantes y garantizando que ningún botón se sobreponga.
  - **Detección Inteligente de Ejercicios con Barra (`isBarbellExercise`):**
    - El botón de `Calculadora de Discos` ahora se oculta automáticamente para ejercicios con mancuernas, kettlebells, peso corporal, poleas o máquinas (ej. "Pirate supper piernas con kettlebell").
    - Solo se activa cuando el ejercicio involucra barras olímpicas, press de banca, sentadillas, peso muerto o variantes de barra libre / Smith machine.
  - **Explicación Fija de Series (`N, W, D, F, T`):**
    - Se incorporó una barra de leyenda fija, discreta y elegante al pie de la tabla de series con insignias en miniatura con los colores temáticos de Obsidian Cyan:
      - **N**: Normal (serie efectiva de trabajo)
      - **W**: Calentamiento (Warmup)
      - **D**: Drop Set (reducción progresiva de peso)
      - **F**: Al Fallo (Failure)
      - **T**: Tiempo (Timed)
  - **Corrección de Texto en Calculadora de Discos (`PlateCalculatorModal.tsx`):**
    - El primer botón de la barra olímpica de 20 kg ahora muestra uniformemente `"20 kg"` (sin saltos de línea ni etiquetas incómodas), manteniendo consistencia visual con `15 kg` y `10 kg`.
  - **Nuevo Modal de Salida & Doble Confirmación para Borrar de BD (`ExitWorkoutModal.tsx`):**
    - Se eliminó el diálogo nativo amontonado de 3 botones.
    - Se creó un modal dedicado en Obsidian Cyan con botón de tache (`X`) en la esquina superior derecha que cancela la acción y reanuda el entrenamiento de inmediato.
    - Muestra solo dos opciones cómodas y accesibles: `"Pausar y Salir"` (botón principal cian) y `"Descartar Sesión"` (botón de alerta roja).
    - Al pulsar `"Descartar Sesión"`, se activa un paso de doble confirmación preventiva antes de ejecutar `cancelWorkout()`, garantizando que el borrado de datos en la base de datos sea totalmente intencional.
  - **Corrección del Bug de Pausa del Temporizador:**
    - Se corrigió el problema donde el temporizador permanecía pausado al salir y volver a entrar o al presionar "Continuar Rutina".
    - `GymView.tsx` ahora invoca `resumeWorkout()` antes de navegar a `ActiveWorkoutScreen`.
    - `ActiveWorkoutScreen.tsx` incorpora un `useEffect` automático que reanuda el cronómetro si la pantalla se enfoca o monta con sesión activa pero en estado de pausa.
  - **Corrección de Error 500 al Guardar / Completar Series (Backend `Program.cs` & `gym.service.ts`):**
    - Se solucionó la causa raíz del error 500 registrado en el backend al enviar strings de enums (`"type": "Normal"`) mediante la adición de `JsonStringEnumConverter()` en la configuración de serialización JSON de ASP.NET Core (`Program.cs`).
    - Se sanitizó el servicio cliente en frontend (`gym.service.ts`) para validar y omitir `setId` cuando no sea un GUID válido existente en base de datos, previniendo excepciones en Minimal APIs.

- **Rediseño Visual de Recuperación Muscular & Alineación Anatómica (`BodyRecoveryHeatmap.tsx` & `MuscleRecoveryCard.tsx`):**
  - **Alineación Anatómica Exacta y Erradicación de Músculos Amontonados:**
    - Se identificó que las imágenes base de la anatomía correspondían a tres secciones verticales superpuestas (`upper`, `middle`, `lower`). Al montarse en una misma coordenada Y=0, los músculos quedaban amontonados y solapados erróneamente (ej. bíceps y cuádriceps sobre el pecho).
    - Se generaron capas compuestas de alta fidelidad (`composite_front_*` y `composite_back_*`) integrando los desplazamientos matemáticos exactos: cabeza y hombros superiores (`Y=0`), brazos y core abdominal (`Y=118`), y piernas/cuádriceps/gemelos (`Y=219` para frontal, `Y=320` para dorsal).
    - El resultado es una anatomía humana esbelta, limpia y proporcionada idéntica a la referencia, donde cada grupo muscular resalta con nitidez en su ubicación física real.
  - **Contención Estructural de Rectángulos Métricos:**
    - Se reemplazó el contenedor con `flexWrap` por dos filas estructuradas fijas (`badgeRow`) con distribución equitativa de ancho (`flex: 1`, `gap: 8`), eliminando desbordamientos fuera de la tarjeta y asegurando que las 6 métricas (`PECHO`, `ESPALDA`, `PIERNAS`, `HOMBROS`, `BRAZOS`, `CORE`) queden 100% contenidas dentro de la tarjeta con números completos y legibles.
  - **Eliminación de Líneas y Barras Redundantes:** Supresión total de la lista inferior de barras de progreso horizontales y textos redundantes de horas.
  - **Medidor Vertical de Batería / Nivel de Energía:** Barra vertical a la izquierda con borne superior, carril estilizado con borde tonal (`#222836`), llenado reactivo y porcentaje global en `JetBrains Mono` con código de color dinámico.
  - **Insignia y Consejo Táctico de Entrenamiento:** Píldora de estado de recuperación (`LISTO PARA ENTRENAR`, `RECUPERACIÓN ACTIVA`, `DESCANSO RECOMENDADO`) con recomendación dinámica.


- **Carrusel Horizontal Completo de 7 Vistas & Puntos Minimalistas en Header (`MainCarouselScreen.tsx`, `Header.tsx`, `carouselNavStore.ts` & `BottomNav.tsx`):**
  - **Carrusel Horizontal Unificado:** Reemplazo de la navegación aislada por un único carrusel horizontal nativo a 60 FPS (`ScrollView` con `pagingEnabled={true}`) que abarca las 7 vistas principales de la aplicación en secuencia fluida:
    `[0: Dashboard (Home) ↔ 1: Mis Ideas ↔ 2: Mi Diario ↔ 3: Tasks ↔ 4: Gym & Rutinas ↔ 5: Dieta & Macros ↔ 6: Finanzas]`.
  - **Desplazamiento Gestual Continuo y Scroll Vertical Independiente:** Deslizar horizontalmente transiciona de forma instantánea y natural entre cualquier pantalla contigua, mientras cada vista conserva su propio scroll vertical sin conflictos ni desmontajes.
  - **Puntos de Navegación Minimalistas y Alineación Pixel-Perfect en Header (`Header.tsx`, `FitScreen.tsx`, `JournalScreen.tsx`):**
    - Se eliminaron las barras de cápsulas (`SwipeCapsuleIndicator`) para adoptar un diseño limpio y minimalista.
    - Las secciones compuestas por submódulos (`Ideas ↔ Diario` y `Gym ↔ Dieta`) ahora muestran sutiles puntos indicadores (`● ○` / `○ ●`) directamente a un lado del título del encabezado con centrado vertical exacto.
    - El punto activo adopta una píldora cian neón (`#00F0FF`, 14px), mientras el inactivo permanece como círculo discreto (`#222836`, 6px), permitiendo tocar los puntos para alternar suavemente entre vistas hermanas.
    - **Alineación Geométrica Universal:** Se unificó la ubicación del `<Header />` dentro del contenedor de desplazamiento con las mismas coordenadas estructurales (`paddingHorizontal: 20`, `paddingTop: Platform.OS === 'android' ? 24 : 12`), logrando que el título y el botón de perfil queden a la misma altura exacta y alineados al píxel respecto a Dashboard, Tasks y Finanzas al deslizar horizontalmente.
  - **Sincronización y Latencia Cero en Barra Inferior (`BottomNav.tsx` & `carouselNavStore.ts`):**
    - **Eliminación del Retardo Táctil (`delayPressIn={0}`):** Se eliminó el retraso nativo de 130ms de reconocimiento de pulsaciones en las pestañas de `BottomNav`, logrando que la selección y el brillo del icono activo respondan en 0ms al tocar.
    - **Aislamiento de Render (`ConnectedBottomNav`):** Se desacopló la barra inferior en un componente memoizado independiente que no suscribe al contenedor principal del carrusel, impidiendo re-renderizados innecesarios de las 7 pantallas completas al alternar de pestaña.
    - **Memoización de Pantallas y Flags de Desplazamiento Nativo:** Se aplicó `React.memo` a las 7 vistas principales y se añadieron propiedades de aceleración en el `ScrollView` (`directionalLockEnabled={true}`, `bounces={false}`, `overScrollMode="never"`, `keyboardShouldPersistTaps="handled"`), eliminando bloqueos en el hilo de JavaScript y garantizando un desplazamiento instantáneo a 60 FPS.
    - Las tarjetas interactivas del Dashboard (`DietCard`, `WorkoutCard`, `DailyTodoCard`, `IdeasCard`, `FinanceCard`) activan el deslizamiento animado del carrusel hacia su sección destino mediante `carouselNavStore.navigateToTab(...)`.

- **Rediseño Estructural de Tarjeta de Dieta & Macros en Dashboard (`DietCard.tsx`):**
  - **Alineación Central del Círculo de Progreso:** Centrado horizontal del indicador radial de calorías con `Svg` de 68x68px, borde de fondo (`#1E2330`) y arco activo en cian eléctrico (`#00F0FF`), visualizando con claridad el porcentaje completado y la etiqueta métrica `KCAL` en `JetBrains Mono`.
  - **Prevención de Desbordamiento y Sanitización Numérica:** Redondeo estricto con `Math.round()` de todas las calorías consumidas y macronutrientes (proteína, carbohidratos y grasas), erradicando el desbordamiento horizontal provocado por decimales flotantes y por la compresión lateral previa.
  - **Estructuración Jerárquica Vertical de Textos:**
    - Resumen calórico centrado inmediatamente debajo del círculo (`consumidas / meta kcal`).
    - Desglose de macronutrientes en filas independientes de ancho completo con etiqueta (`Prot`, `Carb`, `Gras`), puntos de color tonal (`neonCyan`, `warning`, `slate400`), valores precisos en gramos y micro-barras de progreso de 2.5px que reflejan visualmente el porcentaje alcanzado sin salirse de los límites de la tarjeta.
  - **Caché y Rendimiento Reactivo:** Adición de políticas de `staleTime` (1 minuto para el resumen diario y 10 minutos para el perfil de usuario), eliminando refetches repetitivos al regresar al dashboard.

- **Optimización de Consultas, Navegación por Gestos (Swipe) & Cápsulas de Navegación (`FitScreen.tsx`, `JournalScreen.tsx`, `SwipeCapsuleIndicator.tsx` & `workoutStore.ts`):**
  - **Optimización de Caché y Eliminación de Consultas Innecesarias en Gym y Dieta:**
    - `workoutStore.ts`: Incorporación de `lastBackendSync` con guard de 2 minutos en `initFromBackend()`, impidiendo peticiones redundantes a `/api/workout-sessions/active` cada vez que el usuario ingresa a la pestaña de Gym.
    - `GymView.tsx`: Configuración de `staleTime` (10 min para perfil de usuario, 5 min para rutinas) y `gcTime` (30 min) en React Query, evitando reconsultas constantes a la base de datos.
    - `DietView.tsx`: Configuración de `staleTime` (10 min para perfil, 5 min para target nutricional).
    - **Montaje Persistente en Memoria:** Tanto `GymView` como `DietView` (así como `Ideas` y `Diario`) se conservan montados continuamente en memoria dentro de un paginador horizontal desacoplado con scroll vertical independiente, erradicando el ciclo de desmontaje y re-montaje que volvía a solicitar datos al backend.
  - **Navegación por Gestos Fluidos a 60 FPS (Swipe Horizontal):**
    - `FitScreen.tsx`: Reemplazo del switch estático por un carrusel/paginador horizontal nativo (`ScrollView` con `pagingEnabled`, `bounces={false}` y `showsHorizontalScrollIndicator={false}`). Deslizar de derecha a izquierda o de izquierda a derecha transiciona suavemente entre **Gym** y **Dieta**.
    - **Transición Perimetral entre Pestañas Vecinas:** Soporte de gestos en los extremos (`onScrollEndDrag`). Arrastrar a la derecha en Gym conduce directamente a la pestaña de **Tasks**, mientras que arrastrar a la izquierda en Dieta conduce a **Money**.
    - `JournalScreen.tsx`: Paginador horizontal por gestos idéntico entre **Mis Ideas** y **Mi Diario**, con transición perimetral hacia **Home** (Dashboard) y **Tasks**.
  - **Componente Reutilizable `SwipeCapsuleIndicator.tsx`:**
    - Indicador de cápsulas estilizado en Obsidian Cyan con bordes estructurales de 1px (`#222836`), geometría `rounded-full` y tonal layering.
    - Muestra las cápsulas centrales de la pantalla activa con indicador de punto brillante cian (`#00F0FF`), así como flechas de guía laterales (`← Tasks | [ Gym ] [ Dieta ] | Money →`) que informan al usuario hacia qué pantallas adyacentes puede desplazarse.
    - Totalmente interactivo: soporta tanto el gesto de arrastre en la pantalla como el toque directo en las cápsulas o en las flechas de guía para una navegación inmediata y accesible.

- **Fase 4: Frontend Nutrition, Nexodus Lens (AI Vision) & Balance Calórico Neto (`src/features/diet/`):**
  - **Nexodus Lens Modal (`NexodusLensModal.tsx`):**
    - Escaneo visual de comidas con soporte de cámara fotográfica y selección desde galería mediante `expo-image-picker`.
    - Comunicación en tiempo real con el backend `/api/diet/lens/analyze` impulsado por Google Gemini Multimodal Vision.
    - Estados de carga animados con skeletons estilizados en Obsidian Cyan.
    - Desglose inteligente de macronutrientes (calorías totales, proteína, carbohidratos, grasas, índice de confianza del modelo).
    - Desglose granular de ingredientes detectados con porciones estimadas en gramos.
    - Botón de acción directa para transformar los alimentos detectados en una comida y registrarla en un toque.
  - **Widget de Balance Calórico Neto (`NetCaloricBalanceCard.tsx`):**
    - Ecuación visual en vivo: `Ingesta (Consumidas) - Entreno (Quemadas) = Balance Neto`.
    - Cálculo de superávit o déficit calórico en tiempo real contra la meta diaria configurada.
    - Integrado de forma reactiva en `DietView.tsx`.
  - **Actualización de la Vista de Dieta (`DietView.tsx`):**
    - Fila de acciones principales de acceso rápido en Dieta (`DietView.tsx`): ubicación prominente de los botones "Agregar Comida" (botón sólido cyan) y "Nexodus Lens" (botón de superficie con borde reactivo y chispas) directamente por debajo de la selección del día y por encima de la tarjeta y gráfico de calorías/macronutrientes para un acceso inmediato al registrar comidas.
    - Integración de la tarjeta de balance neto debajo del resumen calórico y de macronutrientes.
    - Actualización del icono de la insignia de meta nutricional a diana/objetivo (`Target`) para mayor precisión semántica.
    - Estado de carga contextual por botón en hidratación (`HydrationCard.tsx`): visualización precisa del indicador `ActivityIndicator` exclusivamente en el botón presionado (`+250ml` o `+500ml`) con bloqueo preventivo y sincronización de volumen real.
    - Visibilidad condicional y temporizador de ayuno reactivo (`FastingCard.tsx` & `DietView.tsx`): la sección de ayuno intermitente solo se muestra si el plan nutricional contempla una meta de ayuno (ocultándose en modo tradicional), con inicio inmediato de cuenta regresiva en `JetBrains Mono`, transición automática al botón "Concluir" para prevenir reinicios accidentales, y persistencia sincronizada local/backend.
    - Optimización y caché en catálogo de alimentos (`FoodSearchModal.tsx`): separación de estados para búsqueda por nombre y código de barras con caché en memoria (`Map`) que evita reconsultas innecesarias a la base de datos al alternar entre pestañas o repetir términos.
    - **Lista Dinámica y Selección Alternable en Catálogo (`FoodSearchModal.tsx`):**
      - Carga reactiva del catálogo general de alimentos desde la base de datos con React Query (`queryKeys.diet.foods('all')`), visualizando inmediatamente todos los alimentos disponibles al abrir el modal (similar al selector de ejercicios de gimnasio).
      - Filtrado dinámico e instantáneo en memoria a 60 FPS sin retrasos de red al escribir en el buscador, con búsqueda remota complementaria debounced para términos no comunes.
      - Soporte para **marcar y desmarcar alimentos**: presionar un alimento seleccionado o su indicador con check lo desmarca inmediatamente y oculta el panel de confirmación.
    - **Resolución de Conflictos Visuales y Manejo de Teclado (`FoodSearchModal.tsx`):**
      - Corrección de corte en el último elemento: reestructuración de la lista en un contenedor flex aislado con `KeyboardAvoidingView` y paddings dinámicos seguros que previenen cualquier superposición o truncamiento.
      - Elevación de panel sobre el teclado: reubicación del footer de confirmación en el flujo flex nativo, logrando que al enfocar el input de cantidad este se eleve automáticamente por encima del teclado.
      - Teclado numérico (`decimal-pad`) con selección automática de texto al enfocar (`selectTextOnFocus`) para edición rápida e inmediata.
  - **Permisos de Cámara Globales y Validación en Modales (`App.tsx`, `camera.ts`, `BarcodeScannerModal.tsx`, `NexodusLensModal.tsx` & `FoodSearchModal.tsx`):**
    - Solicitud de permisos de cámara al abrir la aplicación junto a los permisos de notificaciones mediante el helper unificado `requestCameraPermissions` (`src/utils/camera.ts`).
    - Validación proactiva en cada modal que utiliza cámara (`BarcodeScannerModal`, `FoodSearchModal`, `NexodusLensModal`), alertando limpiamente mediante `GlobalAlert` si el usuario aún no los ha otorgado o si requiere habilitarlos en los ajustes.
  - **Escáner de Códigos de Barra con Cámara y Auto-completado Inteligente (`BarcodeScannerModal.tsx`, `FoodSearchModal.tsx`, `CreateFoodModal.tsx` & `openFoodFacts.service.ts`):**
    - Integración de escáner en tiempo real con `expo-camera` (`CameraView`) estilizado con retícula Obsidian Cyan, botón de linterna (torch) y detección automática de códigos de barra (EAN-13, EAN-8, UPC-A, UPC-E, Code 128/39).
    - Flujo de resolución inteligente y validación de macronutrientes:
      1. Búsqueda directa en la base de datos interna de alimentos por código de barras. Si cuenta con información nutricional real (calorías/macros > 0), se agrega y selecciona directamente en la comida.
      2. Si el alimento existe en la base de datos pero sus calorías y macronutrientes están en cero o incompletos (como registros automáticos de la API sin tabla nutricional, ej. Clorets), o si no existe en la base interna:
         - Se consulta Open Food Facts para consolidar nombre, marca y porción.
         - Se abre automáticamente `CreateFoodModal.tsx` precargando los datos del producto pero dejando los campos de calorías y macronutrientes listos para que el usuario ingrese los valores exactos de la etiqueta física.
         - Permite actualizar el registro existente (`updateFood` / `PUT /api/diet/foods/:id`) o crear uno nuevo, autoseleccionándolo inmediatamente tras guardar.
    - **Estabilización de Componentes Nativos y Manejo Nulo (`BarcodeScannerModal.tsx` & `CreateFoodModal.tsx`):**
      - Desacoplamiento de `<CameraView>`: En Expo SDK 58 `<CameraView>` no admite elementos hijos; se convirtió en componente auto-cerrado con el visor y controles superpuestos mediante posicionamiento absoluto (`StyleSheet.absoluteFill`).
      - Corrección de `TypeError: Cannot read property 'toString' of null`: Sanitización estricta de valores nutricionales nulos (`null`) devueltos por la base de datos o API (como `SodiumMg`, `PotassiumMg`, `ServingSize`), previniendo excepciones en tiempo de ejecución en Android/Hermes.
      - **Enfoque Estabilizado y Consenso de Lectura en Escáner (`BarcodeScannerModal.tsx`):**
        - Retardo inicial de 750ms para que la lente de la cámara estabilice su autoenfoque y balance de blancos antes de procesar fotogramas.
        - Algoritmo de consenso multi-frame que exige detectar el mismo código de barras de manera consecutiva e idéntica antes de aceptarlo, descartando falsos positivos o números incompletos generados por reflejos o desenfoque.
        - Insignia de estado interactiva en el visor ("Estabilizando enfoque...", "Centra el código en el recuadro", "Verificando...") con confirmación visual.
    - **Edición Rápida de Alimentos por Pulsación Prolongada (`FoodSearchModal.tsx` & `CreateFoodModal.tsx`):**
      - Soporte para **mantener presionado cualquier alimento de la lista** (`onLongPress` con 400ms) o tocar su botón "Editar" para abrir el modal en modo edición.
      - Permite actualizar nombre, marca, porción base (ej. cambiar 100g por una porción personalizada), calorías y macronutrientes, refrescando la lista y la porción activa de forma inmediata.
    - **Reestructuración Visual de Tarjetas de Comidas (`MealItemCard.tsx` & `MealFormModal.tsx`):**
      - Título principal semántico: el tipo de comida ("Desayuno", "Comida", "Cena", "Snack") ahora se muestra como título principal en lugar del nombre del primer ingrediente, mientras que los alimentos agregados con sus respectivas porciones se muestran claramente como subtítulo.
      - Cabecera limpia: se simplificó la cabecera superior para mostrar únicamente el indicador de estado coloreado y la hora exacta del registro (ej. `● 00:13`), logrando una jerarquía visual limpia y sin redundancias.
      - Sincronización automática de nombres en el formulario de comidas al alternar entre tipos de comida.
    - **Aviso Informativo y Recálculo Dinámico de Porciones en Catálogo (`FoodSearchModal.tsx`):**
      - Banner informativo permanente: tarjeta informativa con icono `Scale` que comunica al usuario que puede seleccionar cualquier alimento y cambiar los gramos o mililitros a consumir para recalcular automáticamente sus valores nutricionales, o mantenerlo presionado para editar su porción base.
      - Recálculo reactivo en tiempo real: al seleccionar un alimento y modificar los gramos en el panel inferior, tanto la tarjeta seleccionada en la lista como el panel de confirmación recalculan y actualizan inmediatamente las calorías y macronutrientes correspondientes a la porción elegida con insignias métricas de alta visibilidad.
    - **Catálogo Colaborativo Comunitario (`DietEndpoints.cs`, `DietService.cs` & `FoodRepository.cs`):**
      - Alta inicial pública comunitaria: cuando cualquier usuario registra un alimento nuevo por primera vez (mediante escaneo o creación manual), se almacena automáticamente como alimento base del catálogo general (`IsCustom: false`, `UserId: null`), quedando accesible de inmediato para todos los usuarios de la aplicación.
      - Personalización individual protegida: si un usuario edita un alimento público existente, se genera una copia personalizada (`IsCustom: true`, `UserId: usuario`) para ese usuario, preservando intacto el alimento base para los demás y permitiendo actualizaciones posteriores directas sobre su copia sin crear registros duplicados.
    - **Deduplicación Canónica y Prevención de Registros Duplicados (`FoodSearchModal.tsx`, `CreateFoodModal.tsx`, `DietEndpoints.cs`, `DietService.cs` & `FoodRepository.cs`):**
      - Endpoint `PUT /api/diet/foods/{id}` implementado en el backend y conectado en el frontend: actualizar un alimento personalizado modifica directamente la fila correspondiente en la base de datos en vez de duplicarla. Si se edita un alimento genérico del sistema, se asocia o actualiza una copia personalizada única para el usuario autenticado.
      - Deduplicación canónica en frontend (`getFoodKey` por código de barras o nombre normalizado + marca): evita tarjetas repetidas de un mismo alimento (como "Aguacate Hass") en el catálogo, priorizando siempre la versión personalizada y más reciente.
      - Sincronización reactiva del estado local `customAddedFoods` al guardar o editar, reemplazando instantáneamente cualquier versión previa sin generar entradas duplicadas.
    - **Categorías Oficiales del Sistema para Alimentos (`Categories`, `Food.cs`, `DietEndpoints.cs`, `CreateFoodModal.tsx` & `FoodSearchModal.tsx`):**
      - **Extensión del Modelo de Datos en BD (`Categories`):** Incorporación de la columna discriminadora `Type` (`varchar(20)`, con valor por defecto `'Money'` para las categorías financieras preexistentes y `'Food'` para las categorías de alimentos). `UserId` fue convertido a nullable (`Guid?`) para permitir categorías globales del sistema administradas de forma compartida (`UserId = NULL`).
      - **Conceptos de Alimentos Predefinidos:** Inicialización automática mediante `DataSeeder` de las categorías del sistema: *Carnes, Pescados y Mariscos, Verduras, Frutas, Lácteos y Huevos, Cereales y Granos, Legumbres, Frutos Secos y Semillas, Grasas y Aceites, Bebidas, Suplementos, Snacks y Dulces, Otros*, con migración retroactiva que catalogó los alimentos preexistentes.
      - **Asociación en Alimentos (`Food.cs` & `FoodDtos`):** Columnas `CategoryId` (clave foránea con `OnDelete: SetNull`) y `Category` (denormalización para lectura instantánea sin joins).
      - **Selector Elegante en Creación y Edición (`CreateFoodModal.tsx`):** Selector de pastillas/chips con geometría `rounded-full` y resaltado en Obsidian Cyan ubicado debajo de "Marca", permitiendo elegir exclusivamente entre las categorías del sistema sin que el usuario cree categorías dispersas.
      - **Insignia Visual en Catálogo (`FoodSearchModal.tsx`):** Badge distintivo de categoría en cada tarjeta del catálogo de alimentos junto a la marca del producto.
    - **Optimización de Entrada de Porción y Elevación Sobre el Teclado (`FoodSearchModal.tsx`):**
      - Escucha activa de eventos de teclado en tiempo real (`keyboardDidShow` / `keyboardDidHide`) para computar dinámicamente la elevación del panel inferior (`footerSheet`) por encima del teclado del software en dispositivos Android.
      - Asignación de teclado numérico (`numeric`) directo y selección automática de texto al enfocar (`selectTextOnFocus`) para escribir la porción de inmediato sin oscurecer los controles de confirmación.
    - **Aislamiento de Pestañas y Limpieza de Resultados en Código de Barras (`FoodSearchModal.tsx` & `CreateFoodModal.tsx`):**
      - Prevención de arrastre de códigos de barra entre modos: editar o crear un alimento desde la pestaña de "Buscar por Nombre" ya no contamina el input de código de barras ni altera los resultados de escaneo.
      - Validación contextual al alternar a la pestaña de "Código de Barras": solo se muestran resultados si el código en el input coincide exactamente con el alimento escaneado, impidiendo que alimentos buscados por nombre aparezcan inesperadamente bajo un código ajeno.
  - **Servicios API (`diet.service.ts`):**
    - Tipado y método `analyzeFoodImage` (`POST /api/diet/lens/analyze`).
    - Actualización de `DailySummary` con `burnedCalories` y `netCalories`.

- **Migración y Actualización a Expo SDK 58:**
  - **Actualización de Runtime y Core:** Se migró de Expo SDK 57 a **Expo SDK 58** (`expo@^58.0.23`), actualizando el runtime a **React Native 0.88.1** y **React 19.3.0** (`@types/react@~19.3.0`).
  - **Alineación de Módulos Nativos:** Todas las dependencias nativas se actualizaron a sus versiones certificadas para SDK 58 (`expo-blur`, `expo-build-properties`, `expo-constants`, `expo-dev-client`, `expo-device`, `expo-font`, `expo-image`, `expo-notifications`, `expo-secure-store`, `expo-status-bar`, `expo-updates`, `react-native-safe-area-context`, `react-native-screens`, `react-native-svg`, `@react-native-community/datetimepicker`).
  - **Config Plugins en `app.json`:** Se añadieron los plugins declarativos requeridos por SDK 58 (`@react-native-community/datetimepicker`, `expo-font`, `expo-secure-store`, `expo-status-bar`).
  - **Tipado Fuerte de `ScrollView` (`CustomTimePicker.tsx`):** Con la evolución de tipos en React Native 0.88 para componentes funcionales y referencias imperativas, se tiparon las referencias de desplazamiento usando `ScrollViewInstance` (`useRef<ScrollViewInstance>(null)`), garantizando compatibilidad total y 0 errores de compilación TypeScript.
  - **Verificación Completa:** Aprobación del 100% (20/20 comprobaciones) en `npx expo-doctor@latest` y compilación estricta limpia con `pnpm tsc --noEmit`.
  - **Auditoría de Seguridad y Resolución de Vulnerabilidades (`pnpm audit`):** Resolución completa de 22 vulnerabilidades de dependencias transitivas mediante `overrides` en `pnpm-workspace.yaml` (`brace-expansion`, `compression`, `decode-uri-component`, `glob`, `minimatch`, `node-forge`, `shell-quote`, `source-map-js`), logrando **0 vulnerabilidades detectadas** en `pnpm audit`.

- **Fase 2: HUD de Entrenamiento en Vivo & Recuperación Muscular (`src/features/gym/`):**
  - **HUD de Sesión Activa (`ActiveWorkoutScreen.tsx`):**
    - Cronómetro en vivo de entrenamiento en `JetBrains Mono` con soporte de pausa/reanudación y sincronización con el backend.
    - Carrusel de ejercicios con indicadores de avance (dots), navegación anterior/siguiente y visor colapsable de técnica en GIF (S3).
    - Grid de series con inputs para peso (kg) y repeticiones, insignia de tipo de serie (`W`, `N`, `D`, `F`, `T`), indicador de récord anterior y botón de completitud que dispara automáticamente el temporizador de descanso.
    - Botón de adición dinámica de series y botón de finalización que despliega el resumen del entrenamiento.
  - **Insignias Dinámicas de Serie (`SetTypeBadge.tsx`):**
    - Selector interactivo de tipos de serie con código de color Obsidian Cyan:
      - `W` (Calentamiento / Warmup) - Ámbar
      - `N` (Normal) - Cyan
      - `D` (Drop Set) - Púrpura
      - `F` (Al Fallo / Failure) - Coral
      - `T` (Por Tiempo / Timed) - Esmeralda
  - **Temporizador de Descanso Flotante (`RestTimerOverlay.tsx`):**
    - Overlay translúcido flotante en la parte inferior durante los descansos entre series.
    - Cuenta regresiva segundo a segundo en `JetBrains Mono`, barra de progreso y acciones rápidas (`+30s`, `Omitir`).
  - **Calculadora de Discos para Barra Olímpica (`PlateCalculatorModal.tsx`):**
    - Desglose exacto de discos por lado para barra olímpica (20kg estándar, 15kg o 10kg) utilizando discos de 25, 20, 15, 10, 5, 2.5 y 1.25 kg.
    - Ajustes rápidos de peso (+5kg, -5kg) y aviso de residuos no divisibles.
  - **Resumen y Cierre de Entrenamiento (`WorkoutSummaryModal.tsx`):**
    - Modal de consolidación post-entrenamiento: duración total, volumen neto levantado (omitiendo calentamiento), repeticiones, series completadas y cálculo de Nexodus XP (`+NXP`).
    - Campo de notas para sensaciones de la sesión y confirmación final hacia la API.
  - **Radar de Recuperación y Fatiga Muscular (`MuscleRecoveryCard.tsx`):**
    - Integrado en `GymView.tsx`: mapa visual de los 6 grupos musculares principales (Pecho, Espalda, Hombros, Piernas, Brazos, Core).
    - Barras de porcentaje de recuperación basadas en el modelo de decaimiento exponencial de 48-72h y estados semánticos (`Listo`, `Recuperando`, `Fatigado`).
  - **Store de Sesión y Servicios API (`workoutStore.ts` & `gym.service.ts`):**
    - Integración transparente con los endpoints `/api/gym/sessions/*` (`start`, `active`, `sets`, `finish`, `cancel`, `recovery/muscle-status`, `records`).
    - Reanudación automática de sesiones activas al iniciar o recargar la app (`initFromBackend`).

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


---

## RecoveryZone Anatomy & The Nexodus Protocol (Fase 5)

### 1. Mapa Anatómico de Recuperación Muscular (`BodyRecoveryHeatmap.tsx`)
Inspirado en la ingeniería inversa de Liftoff v2.17.5:
- **32 capas anatómicas modulares (256x256 PNGs transparentes)** extraídas y alojadas localmente en `assets/musclegraphics/`.
- Renderizado de alto rendimiento mediante `<Image tintColor={color} />` sobre la silueta base Obsidian `#1C2029`.
- Vistas alternables con un toque: **Vista Frontal (Anterior)** y **Vista Dorsal (Posterior)**.
- Código de calor por fatiga basado en modelo exponencial de 48-72h:
  - `#EF4444` (Rojo): Fatiga Alta / Menos de 35% de recuperación.
  - `#F59E0B` (Ámbar): En recuperación / Descansando (35% – 69%).
  - `#38BDF8` (Azul): Listo / Casi recuperado (70% – 89%).
  - `#00F0FF` (Cian Neón): 100% Óptimo para entrenar.

### 2. HUD de Rachas Inteligentes (`StreakCard.tsx`)
- Llama cian `#00F0FF` con contador numérico monoespaciado (`JetBrains Mono`).
- Matriz de consistencia semanal (L, M, X, J, V, S, D) con cápsulas visuales para días cumplidos, descansos protegidos y día en curso.
- Protección con Escudos de Racha y banner de alerta en ventana de gracia (24h).
- Modal interactivo de restauración (`StreakRestoreModal.tsx`) para recuperar rachas caídas mediante Cyphers o escudos.

### 3. Protocolo de Rangos Obsidian (`ObsidianTierCard.tsx`)
- Indicador de jerarquía Obsidian (`Initiate`, `Vanguard`, `Cyber`, `Titan`, `Apex`, `Sovereign`, `Obsidian`).
- Barra de progreso de NXP en tiempo real hacia el siguiente rango.
- Contador de Cyphers para canje en el Cyber Vault.
