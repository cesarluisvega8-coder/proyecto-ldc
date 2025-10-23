# Manual de uso de la aplicación y Guía para Assistant (Chatbase)

Esta documentación sirve como:
- Manual para usuarios finales.
- Base de conocimiento para entrenar un asistente (Chatbase) que responda exclusivamente sobre la app.

---

## 1) Propósito y alcance

- **Objetivo**: Permitir ingresar cargas/electrodomésticos, definir sus horarios de uso, calcular energía/potencia, visualizar curvas (LDC, temporal, heatmap) y exportar resultados.
- **Audiencia**: Usuarios que simulan consumos de una vivienda; no requiere conocimientos avanzados.

---

## 2) Estructura general de la interfaz

- **Carga de datos**:
  - Botones: `Cargar archivo`, `Descargar plantilla`, `Datos de ejemplo`.
  - Archivo compatible: plantilla `LINEA BASE` con columnas `Item, Carga, Potencia (W), 0..23`.

- **Ingreso manual**:
  - Campos: `Nombre de la carga`, `Potencia (W)`.
  - Botón: `Agregar`. Al presionar, se abre el modal de franjas para definir horarios.

- **Agregar electrodomésticos rápidamente**:
  - Paneles de iconos (esenciales y gran consumo).
  - Panel de configuración (`Nombre` solo lectura, `Potencia`, `Cantidad`, `➕`). Al presionar `➕`, se abre el modal de franjas.

- **Tabla principal**:
  - Columnas: `#`, `Carga`, `Potencia (W)`, `Horarios`, `Horas encendido`, `Energía (kWh)`, `Acción`.
  - Acciones por fila: `✏️` editar rangos (abre modal), `🗑` eliminar.

- **Métricas**:
  - Panel con valores diarios/mensuales/anuales.
  - Selector de periodo y configuración de “perfil horario” más abajo (día/noche/personalizado).

- **Visualizaciones**:
  - Tabs: `Cuadro de carga LDC`, `Mapa de calor`, `Consumo temporal`.
  - Exportaciones: PDF de informe completo y exportaciones del panel de perfil.

---

## 3) Flujos principales paso a paso

### A) Agregar una carga por ingreso manual
1. En “Ingreso manual”, completa `Nombre de la carga` y `Potencia (W)`.
2. Presiona `Agregar`.
3. En el modal “Definir rangos horarios”, añade una o más franjas `inicio → fin`.
4. Guarda. La fila aparece en la tabla con `Rangos`, `Horas encendido` y `Energía (kWh)` calculados.

### B) Agregar un electrodoméstico rápidamente
1. Haz clic en un icono (ej. “AC”). Aparece el panel de configuración.
2. Ajusta `Potencia (W)` y `Cantidad`.
3. Presiona `➕`. Se abre el modal de franjas; define los horarios y guarda.
4. Se agregan 1..N filas (según `Cantidad`), con los rangos definidos.

### C) Editar rangos de una fila existente
1. En la tabla, pulsa `✏️` en la fila deseada.
2. Modifica las franjas en el modal; guarda.
3. La fila recalcula automáticamente horas y energía.

### D) Cargar datos desde archivo
1. Pulsa `Cargar archivo`, elige un `.xlsx` con hoja `LINEA BASE`.
2. Verás filas en la tabla. Puedes editar rangos por fila con `✏️`.

### E) Generar métricas y visualizar
1. Pulsa `Generar métricas y gráficas`.
2. Cambia “Periodo” (día/mes) en el selector superior de visualizaciones.
3. Ajusta el “Perfil horario” más abajo (día/noche/personalizado) si aplicable.

### F) Exportar informe PDF
1. Usa el botón de exportación del informe completo.
2. El proceso asegura que los charts se rendericen; si no, usa un fallback de captura.
3. Descarga un PDF con: Resumen ejecutivo, Tabla de cargas, LDC, Mapa de calor y Consumo temporal.

---

## 4) Componentes y funcionalidades clave

- **Modal de franjas** (`js/rangesModal.js`):
  - Abre con `rangesModal.open(initialRanges?)`.
  - Devuelve un arreglo `[{inicio, fin}, ...]` en horas 0..24.
  - Evita superposiciones y normaliza 0–24.

- **Cálculo de energía por rangos** (`js/multiRangeCarga.js`):
  - `calcularEnergiaMultiRango(potenciaW, rangos)`: suma horas de todos los rangos y aplica `kWh = (W/1000) * horas`.

- **Tabla y edición** (`js/tableHelpers.js`):
  - `actualizarTablaManual()` y `crearFilaTabla()` muestran `Rangos` como texto cuando existen.
  - Botón `✏️` llama al callback `onEditRanges()` para reabrir el modal.
  - Botón `🗑` elimina fila y refresca.

- **Métricas y gráficas** (`js/metricsAndCharts.js`):
  - `procesarYGraficar(datos, ldcChartRef, periodo)` dibuja LDC, heatmap y temporal.
  - “Perfil horario” permite métricas filtradas por franjas (día, noche, personalizado).

- **Exportaciones PDF** (bloque en `js/mainApp.js`):
  - Asegura que las gráficas estén renderizadas, cambia tab cuando hace falta y usa `html2canvas` como fallback.
  - Títulos de secciones sin símbolos/emoji para evitar caracteres raros.

---

## 5) Explicación de gráficas

- **LDC (Curva de Duración de Carga)**: Muestra potencia ordenada de mayor a menor vs porcentaje/tiempo; útil para ver perfil de demanda y picos.
- **Mapa de calor (Potencia vs Hora)**: X=hora 0–23, Y=cargas; colores indican potencia.
- **Consumo temporal**: Serie temporal de potencia/energía agregada en el tiempo (según periodo).

---

## 6) Exportación y mejores prácticas

- Antes de exportar: ten al menos una carga con rangos y pulsa “Generar métricas y gráficas”.
- Si una gráfica no aparece en el PDF: la app fuerza render y tiene fallback (html2canvas). Visita el tab si es necesario.

---

## 7) Mensajes de error comunes

- “Completa nombre y potencia.” (manual).
- “Selecciona un equipo y completa nombre, potencia y cantidad.” (rápido).
- “No se definieron rangos.” (cerraste el modal sin franjas).
- “No se pudo agregar el equipo. Revisa la consola.” (error no controlado).

---

## 8) Preguntas frecuentes (para Chatbase)

- ¿Cómo agrego una carga con varias franjas? → Usa `Agregar` (manual) o `➕` (rápido) y define las franjas en el modal.
- ¿Puedo editar los horarios después? → Sí, botón `✏️` en la fila.
- ¿Qué significa la LDC? → Potencia ordenada vs duración; identifica picos.
- ¿Por qué el mapa de calor sale vacío? → Genera métricas, revisa datos y tab.
- ¿Cómo exporto el informe? → Botón de exportación del informe PDF.
- ¿Se admite cruce de medianoche? → Sí, ej. `22 → 02`.
- ¿Cómo cargo mi archivo? → `Cargar archivo` con plantilla `LINEA BASE`.

---

## 9) Intenciones del asistente (Chatbase)

- **Intenciones**: agregar manual, agregado rápido, editar horarios, cargar archivo, explicar gráficas, exportar PDF.
- **Guardrails**: solo temas de la app; no soporte externo; no inventar datos.
- **Estilo**: breve, pasos numerados, nombres exactos de botones.

---

## 10) Mapa de elementos UI (referencia)

- Botones: `Agregar`, `➕`, `Cargar archivo`, `Descargar plantilla`, `Datos de ejemplo`, `Generar métricas y gráficas`.
- Campos: `Nombre de la carga`, `Potencia (W)`; y en rápido `Nombre` (solo lectura), `Potencia (W)`, `Cantidad`.
- Tabla: `✏️` editar rangos, `🗑` eliminar.
- Gráficas: tabs `LDC`, `Mapa de calor`, `Consumo temporal`.

---

## 11) Estructura de datos clave

- Elemento en tabla: `{ Carga, Potencia_W, Rangos:[{inicio,fin}], HorasEncendido, Energia_kWh }`.
- Cálculos: `HorasEncendido` = suma de duraciones; `Energia_kWh` = `(W/1000)*horas`.

---

## 12) Troubleshooting

- `➕` no abre modal: selecciona icono y completa `Potencia` y `Cantidad`. Ver consola si persiste.
- PDF sin gráficas: la app fuerza render y fallback; visita los tabs y reintenta.

---

## 13) Exportación y branding (opcional)

- Logo/colores del PDF: en `js/mainApp.js` (colores, header, path del logo).
- Fuentes: se puede incrustar una fuente en jsPDF.

---

## 14) Glosario

- **Rango horario**: `inicio → fin` (0..24).
- **LDC**: curva de duración de carga.
- **kWh**: kilovatio-hora.
