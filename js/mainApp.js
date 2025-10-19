// mainApp.js
// Archivo principal para inicializar y conectar todos los módulos JS
import { mostrarAlerta } from './utils.js';
import { llenarSelectHoras, actualizarTotalInterfaz } from './hourSelects.js';
import { crearFilaTabla, actualizarTablaManual } from './tableHelpers.js';
import { addManualEntry } from './manualEntry.js';
import { handleFileLoad } from './fileLoader.js';
import { procesarYGraficar } from './metricsAndCharts.js';
import { cargarDatosEjemplo } from './sampleData.js';
import { descargarPlantilla } from './templateDownload.js';

window.addEventListener('DOMContentLoaded', () => {
    // Globals
    window.datosManuales = [];
    window.ldcChartRef = { current: null };

    // Selects
    const selectInicio = document.getElementById('manualInicio');
    const selectFin = document.getElementById('manualFin');
    const totalInput = document.getElementById('manualTotal');
    llenarSelectHoras(selectInicio, selectFin, totalInput);
    selectInicio.addEventListener('change', () => actualizarTotalInterfaz(selectInicio, selectFin, totalInput));
    selectFin.addEventListener('change', () => actualizarTotalInterfaz(selectInicio, selectFin, totalInput));
    selectInicio.addEventListener('input', () => actualizarTotalInterfaz(selectInicio, selectFin, totalInput));
    selectFin.addEventListener('input', () => actualizarTotalInterfaz(selectInicio, selectFin, totalInput));

    // Tabla
    const tbody = document.querySelector('#tablaManual tbody');

    function renderTabla() {
        actualizarTablaManual(tbody, window.datosManuales, crearFilaTabla, mostrarAlerta);
    }
    renderTabla();

    // Botón agregar manual
    document.getElementById('addManualBtn').addEventListener('click', () => {
        const nombre = document.getElementById('manualCarga').value.trim();
        const potencia = parseFloat(document.getElementById('manualPotencia').value);
        const hi = parseFloat(document.getElementById('manualInicio').value);
        const hf = parseFloat(document.getElementById('manualFin').value);
        if (addManualEntry(window.datosManuales, nombre, potencia, hi, hf, renderTabla, mostrarAlerta)) {
            document.getElementById('manualCarga').value = '';
            document.getElementById('manualPotencia').value = '';
            document.getElementById('manualInicio').value = '0';
            document.getElementById('manualFin').value = '1';
            actualizarTotalInterfaz(selectInicio, selectFin, totalInput);
        }
    });

    // Botón limpiar tabla
    document.getElementById('clearTableBtn').addEventListener('click', () => {
        if (!confirm('¿Deseas limpiar la tabla y métricas?')) return;
        window.datosManuales.length = 0;
        renderTabla();
        document.getElementById('energiaTotal').textContent = '-';
        document.getElementById('potenciaMedia').textContent = '-';
        document.getElementById('potenciaPico').textContent = '-';
        if (window.ldcChartRef.current) {
            window.ldcChartRef.current.destroy();
            window.ldcChartRef.current = null;
        }
        Plotly.purge('heatmapDiv');
        mostrarAlerta('Tabla y métricas limpiadas.', 'info');
    });

    // Botón datos de ejemplo
    document.getElementById('generateSampleBtn').addEventListener('click', () => {
        cargarDatosEjemplo(window.datosManuales, renderTabla, mostrarAlerta);
    });

    // Botón descargar plantilla
    document.getElementById('downloadTemplateBtn').addEventListener('click', () => {
        descargarPlantilla();
    });

    // Botón cargar archivo
    document.getElementById('loadBtn').addEventListener('click', async() => {
        const inputFile = document.getElementById('fileInput');
        await handleFileLoad(inputFile, window.datosManuales, renderTabla);
    });

    // Botón procesar métricas y gráficas
    document.getElementById('processBtn').addEventListener('click', () => {
        procesarYGraficar(window.datosManuales, window.ldcChartRef);
    });
});