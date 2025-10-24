# Solanlyze — Cuadro de Carga y Análisis Energético

Solanlyze te ayuda a construir tu Cuadro de Carga y analizar el consumo energético con gráficas claras y exportables. No necesitas instalar nada: abre la página, carga tus datos y explora.

## Contenido
- [Requisitos](#requisitos)
- [Flujo rápido](#flujo-rápido)
- [Ingreso de datos](#ingreso-de-datos)
- [Tabla de datos](#tabla-de-datos)
- [Visualizaciones](#visualizaciones)
- [Métricas por perfil horario](#métricas-por-perfil-horario)
- [Exportaciones](#exportaciones)
- [Tema claro/oscuro](#tema-clarooscuro)
- [Consejos](#consejos)
- [Solución de problemas](#solución-de-problemas)

## Requisitos
- **[Navegador]** Chrome, Edge o Firefox actualizados.
- **[Conexión]** Preferible acceder desde una dirección web (ej. GitHub Pages). Evita abrir como `file://`.

## Flujo rápido
1. **Descarga la plantilla** con “📄 Descargar plantilla”.
2. **Completa la plantilla** en Excel:
   - Carga (nombre del equipo).
   - Potencia (W).
   - Horas encendidas marcando en columnas 0–23 con 1, x u on.
3. **Carga tu archivo** y pulsa “Cargar archivo”.
4. **Genera las gráficas** con “Generar métricas y gráficas”.

Tip: Usa “✨ Datos de ejemplo” para explorar rápidamente.

## Ingreso de datos
- **Desde Excel**: la app detecta las horas marcadas y une rangos contiguos (incluye cruces de medianoche).
- **Ingreso manual**: escribe nombre y potencia, pulsa “Agregar” y define horarios en el pop‑up.
- **Electrodomésticos rápidos**: elige de la galería, ajusta potencia/cantidad y define horarios.

## Tabla de datos
- **Edición**: modifica “Carga” y “Potencia (W)” directamente.
- **Horarios**:
  - Si hay rangos: se muestra texto tipo “08:00–12:00, 18:00–21:00”.
  - Si hay inicio/fin: verás dos listas desplegables.
  - Si no hay horario: queda en blanco.
- **Acciones**: ✏️ para editar rangos; 🗑 para eliminar.

## Visualizaciones
- **Cuadro de carga (LDC)**:
  - Día: curva con potencias ordenadas por duración.
  - Mes: barras de energía estimada.
- **Mapa de calor**:
  - Día: potencia por carga a lo largo de 24 horas.
  - Mes: energía mensual estimada por carga.
- **Consumo temporal**:
  - Modo “Suma por hora”: línea del consumo por hora.
  - Modo “Series por carga”: una línea por carga (con filtro “Top N”).

Controles:
- **Periodo**: “Por día” o “Por mes”.
- **Modo y Top N**: solo se habilitan en “Consumo temporal”.

## Métricas por perfil horario
- **Perfiles**: Día (06:00–17:59), Noche (18:00–05:59) o Personalizado.
- **Generar**: pulsa “Generar métricas por perfil”.
- **Resultados**: LDC, Consumo temporal y Mapa de calor filtrados, más un resumen (energía total, potencia media y pico).

## Exportaciones
- **PNG de la gráfica visible** (en “📈 Visualizaciones”):
  - Exporta LDC, Mapa de calor o Consumo temporal, según la pestaña activa.
- **Métricas por perfil**:
  - Exportar PNG combinado (las tres gráficas del perfil).
  - Exportar PDF (las tres visualizaciones del perfil).
- **Informe PDF completo**:
  - Genera un reporte con portada, tabla de cargas y las principales gráficas.
- Todas las exportaciones usan **fondo blanco** para mejor contraste.

## Tema claro/oscuro
- Cambia de tema con el botón del encabezado (sol/luna).
- Las gráficas se redibujan automáticamente para mantener el **contraste**.

## Consejos
- **Plantilla**: marca horas con 1, x u on; respeta las columnas 0–23.
- **Sin horarios**: la celda queda en blanco (puedes definirlos luego con ✏️).
- **Antes de exportar**: asegúrate de que la pestaña de la gráfica esté activa y las visualizaciones generadas.
- **Rendimiento**: en “Series por carga”, usa “Top N” si tienes muchas cargas.

## Solución de problemas
- **No descarga la plantilla**: abre la app desde una dirección web (evita `file://`). 
- **No carga el Excel**: verifica encabezados y columnas de horas (0–23).
- **No ves la gráfica/contraste bajo**: pulsa “Generar métricas y gráficas” o cambia de pestaña y vuelve.