# Solanlyze — Cuadro de Carga y Análisis Energético

Solanlyze te ayuda a construir tu Cuadro de Carga y analizar el consumo energético con gráficas claras y exportables. No necesitas instalar nada: abre la página, carga tus datos y explora.

# Enlance de acceso: https://cesarluisvega8-coder.github.io/proyecto-ldc/

## Contenido
- [Requisitos](#requisitos)
- [Tema claro/oscuro](#tema-clarooscuro)
- [Chatbot](#chatbot)
- [Ingreso de datos](#ingreso-de-datos)
- [Flujo de ejemplo](#flujo-de-ejemplo)
- [Tabla de datos](#tabla-de-datos)
- [Visualizaciones](#visualizaciones)
- [Métricas por perfil horario](#métricas-por-perfil-horario)
- [Exportaciones](#exportaciones)
- [Consejos](#consejos)
- [Solución de problemas](#solución-de-problemas)

## Requisitos
- **[Navegador]** Chrome, Edge o Firefox actualizados.
- **[Conexión]** Preferible acceder desde una dirección web. Evita abrirlo en local si no se descargan todas las dependencias.

## Tema claro/oscuro
- Cambia de tema con el botón del encabezado (sol/luna).
- Las gráficas se redibujan automáticamente para mantener el **contraste**.

## Chatbot
- Puedes usar el chatbot desarrollado con IA en la esquina inferior derecha para obtener ayuda con el funcionamiento de la app.

## Ingreso de datos
Puedes usar cualquiera de estos métodos, no son dependientes entre sí.
- **Datos de ejemplo**: Presiona el botón "✨ Datos de ejemplo" para cargar datos rápidos y comrpobar el funcionamiento.
- **Desde Excel**: Puedes usar la plantilla para cargar tus datos. Cambia las celdas de las columnas 0–23 con 1 (cuando esté encendido) y con 0 (cuando esté apagado) y luego sube el archivo. La app detecta las horas marcadas y une rangos contiguos (incluye cruces de medianoche).
- **Ingreso manual**: Escribe nombre y potencia, pulsa “Agregar” y define horarios en el pop‑up.
- **Electrodomésticos rápidos**: Elige de la galería, ajusta potencia/cantidad y define horarios.

## Flujo de ejemplo
1. **Descarga la plantilla** con “📄 Descargar plantilla”.
2. **Completa la plantilla** en Excel:
   - Carga (nombre del equipo).
   - Potencia (W).
   - Horas encendidas marcando en columnas 0–23 con 1, cuando esté apagado pones 0.
3. **Carga tu archivo** y pulsa “Cargar archivo”.
4. **Genera las gráficas** con “Generar métricas y gráficas”.


## Tabla de datos
- **Edición**: modifica “Carga” y “Potencia (W)” directamente.
- **Horarios**:
  - Si hay rangos: se muestra texto tipo “08:00–12:00, 18:00–21:00”.
  - Si hay inicio/fin: verás dos listas desplegables.
  - Si no hay horario: queda en blanco.
- **Acciones**: ✏️ para editar rangos; 🗑 para eliminar.

## Visualizaciones
Una vez tengas tus datos cargados presiona "Generar métricas y gráficas".
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


## Consejos
- **Plantilla**: marca horas con 1, x u on; respeta las columnas 0–23.
- **Sin horarios**: la celda queda en blanco (puedes definirlos luego con ✏️).
- **Antes de exportar**: asegúrate de que la pestaña de la gráfica esté activa y las visualizaciones generadas.
- **Rendimiento**: en “Series por carga”, usa “Top N” si tienes muchas cargas.

## Solución de problemas
- **No descarga la plantilla**: abre la app desde una dirección web (evita `file://`). 
- **No carga el Excel**: verifica encabezados y columnas de horas (0–23).
- **No ves la gráfica/contraste bajo**: pulsa “Generar métricas y gráficas” o cambia de pestaña y vuelve.