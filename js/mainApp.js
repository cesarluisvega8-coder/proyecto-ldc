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

    // ========== ELECTRODOMÉSTICOS RÁPIDOS ========== //
    // Referencias a panel y formulario
    const applianceCards = document.querySelectorAll('.appliance-card');
    const detalleElectro = document.getElementById('detalleElectrodomestico');
    const nombreElectro = document.getElementById('nombreElectro');
    const potenciaElectro = document.getElementById('potenciaElectro');
    const cantidadElectro = document.getElementById('cantidadElectro');
    const inicioElectro = document.getElementById('inicioElectro');
    const finElectro = document.getElementById('finElectro');
    const agregarElectroBtn = document.getElementById('agregarElectroBtn');

    // Llenar selects de horas en el formulario de electrodomésticos
    function llenarSelectHorasElectro() {
        inicioElectro.innerHTML = '';
        finElectro.innerHTML = '';
        for (let h = 0; h <= 24; h++) {
            const label = h.toString().padStart(2, '0') + ':00';
            const opt1 = document.createElement('option');
            opt1.value = h;
            opt1.textContent = label;
            const opt2 = opt1.cloneNode(true);
            inicioElectro.appendChild(opt1);
            finElectro.appendChild(opt2);
        }
        inicioElectro.value = '0';
        finElectro.value = '1';
    }
    llenarSelectHorasElectro();

    // Mostrar formulario al hacer clic en un electrodoméstico
    applianceCards.forEach(card => {
        card.addEventListener('click', () => {
            applianceCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            detalleElectro.classList.remove('d-none');
            nombreElectro.value = card.getAttribute('data-nombre') || '';
            potenciaElectro.value = card.getAttribute('data-potencia') || '';
            cantidadElectro.value = 1;
            inicioElectro.value = '0';
            finElectro.value = '1';
        });
    });

    // Agregar electrodoméstico a la tabla y actualizar métricas/gráficas
    agregarElectroBtn.addEventListener('click', () => {
        const nombre = nombreElectro.value.trim();
        const potencia = parseFloat(potenciaElectro.value);
        const cantidad = Math.max(1, parseInt(cantidadElectro.value));
        const hi = parseFloat(inicioElectro.value);
        const hf = parseFloat(finElectro.value);
        if (!nombre || isNaN(potencia) || isNaN(hi) || isNaN(hf) || isNaN(cantidad) || cantidad < 1) {
            mostrarAlerta('Completa todos los campos del equipo.', 'error');
            return;
        }
        let dur = hf - hi;
        if (dur < 0) dur += 24;
        if (hi === 0 && hf === 24) dur = 24;
        const energia = (potencia / 1000) * dur * cantidad;
        // Agregar tantas cargas como cantidad
        for (let i = 0; i < cantidad; i++) {
            window.datosManuales.push({
                Carga: nombre + (cantidad > 1 ? ` (${i+1})` : ''),
                Potencia_W: potencia,
                HoraInicio: hi,
                HoraFin: hf,
                HorasEncendido: dur,
                Energia_kWh: (potencia / 1000) * dur
            });
        }
        mostrarAlerta('Electrodoméstico agregado.', 'success');
        renderTabla();
        procesarYGraficar(window.datosManuales, window.ldcChartRef);
        // Ocultar formulario y deseleccionar
        detalleElectro.classList.add('d-none');
        applianceCards.forEach(c => c.classList.remove('selected'));
    });

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
    document.getElementById('loadBtn').addEventListener('click', async () => {
        const inputFile = document.getElementById('fileInput');
        await handleFileLoad(inputFile, window.datosManuales, renderTabla);
    });

    // Botón procesar métricas y gráficas
    document.getElementById('processBtn').addEventListener('click', () => {
        procesarYGraficar(window.datosManuales, window.ldcChartRef);
    });
});