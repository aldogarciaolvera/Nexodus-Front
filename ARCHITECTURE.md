# Arquitectura del Proyecto (React / React Native)

Este proyecto promueve una Clean Architecture o Feature-Sliced Design.

## Estructura Sugerida

- `src/assets/`: Recursos estáticos (imágenes, fuentes, iconos).
- `src/components/`: Componentes UI reutilizables y atómicos.
- `src/features/`: Módulos de la aplicación agrupados por funcionalidad (auth, dashboard, gym, diet, finance, tasks, journal).
- `src/hooks/`: Hooks personalizados y reutilizables.
- `src/services/`: Integración con APIs externas y clientes HTTP.
- `src/store/`: Manejo de estado global con Zustand.
- `src/utils/`: Utilidades generales, constantes y configuraciones de tema.

---

## Patrones de Arquitectura UI y Formularios

### Manejo Seguro de Teclado y Visibilidad en Formularios (Safe Keyboard Pattern)
Debido a que el proyecto opera con pantallas completas (*Edge-to-Edge*) en Expo v58 y Android moderno, los formularios y modales con entradas de texto deben garantizar que **lo que el usuario escribe permanezca siempre 100% visible por encima del teclado virtual**:

1. **Jerarquía Contenedora Obligatoria:**
   - La pantalla o modal debe envolver el contenido interactivo en un `<KeyboardAvoidingView>` (`behavior={Platform.OS === 'ios' ? 'padding' : undefined}`).
   - Inmediatamente dentro, un `<ScrollView>` con:
     - `keyboardShouldPersistTaps="handled"` (permite tocar botones o cambiar de input al primer toque).
     - `automaticallyAdjustKeyboardInsets={true}` (insets nativos dinámicos).
     - `keyboardDismissMode="on-drag"` (permite cerrar el teclado al deslizar hacia abajo).

2. **Detección Dinámica de Altura (`Keyboard.addListener`):**
   - Registrar *listeners* para `keyboardWillShow`/`keyboardDidShow` y `keyboardWillHide`/`keyboardDidHide`.
   - Cuando el teclado esté activo (`keyboardHeight > 0`), aplicar dinámicamente:
     - `paddingBottom: keyboardHeight + 80` para asegurar que el usuario pueda desplazarse más allá del final del formulario.
     - Conmutar `justifyContent` a `'flex-start'` (en lugar de `'center'`) para evitar que el contenido superior sea empujado fuera de la pantalla cuando la altura de la vista se reduce.

3. **Auto-Desplazamiento Suave al Enfocar (*Auto-Scroll on Focus*):**
   - Cada entrada de texto debe incorporar un controlador `onFocus` (`handleFocusField(offsetY)`):
     ```tsx
     const handleFocusField = (offsetY: number) => {
       setTimeout(() => {
         scrollViewRef.current?.scrollTo({
           y: offsetY,
           animated: true,
         });
       }, 120);
     };
     ```
   - El retraso de ~120ms permite sincronizar el desplazamiento con la animación nativa de apertura del teclado, dejando el input enfocado en la mitad superior libre de la pantalla.

4. **Prohibición de Elementos Absolutos en el Pie de Formularios:**
   - Textos informativos secundarios (como la versión de la app `versionText`) **NUNCA** deben posicionarse con `position: 'absolute'` fijados al fondo de la pantalla.
   - Deben ubicarse siempre al final del contenido dentro del `ScrollView` para fluir naturalmente y nunca encimarse sobre botones, enlaces interactivos o inputs.


