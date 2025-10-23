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
import { calcularEnergiaMultiRango } from './multiRangeCarga.js';
import { actualizarMetricas } from './metricsCalculator.js';
import rangesModal from './rangesModal.js';
import { generarMetricasPorPerfil } from './metricsAndCharts.js';

window.addEventListener('DOMContentLoaded', () => {
    // Al mostrar la pestaña temporal, pedir al procesador que dibuje las gráficas
    const temporalTab = document.getElementById('temporal-tab');
    if (temporalTab) {
        temporalTab.addEventListener('shown.bs.tab', () => applyPeriod());
        temporalTab.addEventListener('click', () => { setTimeout(() => applyPeriod(), 60); });
    }
    // Re-dibujar al cambiar tema
    document.body.addEventListener('classChange', () => { applyPeriod(); });
    // ...existing code...
    // NUEVO: Estructura de datos para múltiples rangos por carga
    // Cada carga tendrá: { Carga, Potencia_W, Rangos: [{inicio, fin}], Energia_kWh }

    // Modificar función para agregar carga manual con múltiples rangos usando modal
    document.getElementById('addManualBtn').addEventListener('click', async () => {
        const nombre = document.getElementById('manualCarga').value.trim();
        const potencia = parseFloat(document.getElementById('manualPotencia').value);
        if (!nombre || isNaN(potencia)) {
            mostrarAlerta('Completa nombre y potencia.', 'error');
            return;
        }
        try {
            const rangos = await rangesModal.open();
            if (!Array.isArray(rangos) || rangos.length === 0) {
                mostrarAlerta('No se definieron rangos.', 'error');
                return;
            }
            const energia = calcularEnergiaMultiRango(potencia, rangos);
            window.datosManuales.push({
                Carga: nombre,
                Potencia_W: potencia,
                Rangos: rangos,
                HorasEncendido: rangos.reduce((s,r)=>{
                    let dur = r.fin - r.inicio; if(dur<0) dur+=24; if(r.inicio===0 && r.fin===24) dur=24; return s + dur;
                },0),
                Energia_kWh: energia
            });
            mostrarAlerta('Carga agregada con múltiples rangos.', 'success');
            renderTabla();
            procesarYGraficar(window.datosManuales, window.ldcChartRef);
            actualizarMetricas(window.datosManuales);
            // limpiar inputs
            document.getElementById('manualCarga').value = '';
            document.getElementById('manualPotencia').value = '';
        } catch (err) {
            console.error('Modal cancelado o error', err);
        }
    });

    // Ejemplo: para pruebas, puedes definir window.rangosCargaTemp manualmente en consola
    // window.rangosCargaTemp = [{inicio:2,fin:14},{inicio:20,fin:24}];
    // Globals
    window.datosManuales = [];
    window.ldcChartRef = { current: null };

    // Selects (manual time inputs may not exist if using popup-only flow)
    const selectInicio = document.getElementById('manualInicio');
    const selectFin = document.getElementById('manualFin');
    const totalInput = document.getElementById('manualTotal');
    if (selectInicio && selectFin && totalInput) {
        llenarSelectHoras(selectInicio, selectFin, totalInput);
        selectInicio.addEventListener('change', () => actualizarTotalInterfaz(selectInicio, selectFin, totalInput));
        selectFin.addEventListener('change', () => actualizarTotalInterfaz(selectInicio, selectFin, totalInput));
        selectInicio.addEventListener('input', () => actualizarTotalInterfaz(selectInicio, selectFin, totalInput));
        selectFin.addEventListener('input', () => actualizarTotalInterfaz(selectInicio, selectFin, totalInput));
    }

    // Tabla
    const tbody = document.querySelector('#tablaManual tbody');

    function renderTabla() {
        // pass an onEditRanges callback so rows can open the ranges modal
        actualizarTablaManual(tbody, window.datosManuales, crearFilaTabla, mostrarAlerta, async (idx) => {
            await editRangesForRow(idx);
        });
    }
    renderTabla();
    // period selector (dia/mes) afecta graficas
    const periodSelect = document.getElementById('periodSelect');
    function applyPeriod() {
        const periodo = periodSelect ? periodSelect.value : 'dia';
        procesarYGraficar(window.datosManuales, window.ldcChartRef, periodo);
        // actualizar métricas (ya se calculan por defecto como dia/mes/anio en metricsCalculator)
        actualizarMetricas(window.datosManuales);
    }
    if (periodSelect) periodSelect.addEventListener('change', applyPeriod);
    // re-render cuando cambia el modo temporal (suma / por-carga)
    const temporalModeSelect = document.getElementById('temporalModeSelect');
    if (temporalModeSelect) temporalModeSelect.addEventListener('change', applyPeriod);
    const temporalTopNSelect = document.getElementById('temporalTopNSelect');
    if (temporalTopNSelect) temporalTopNSelect.addEventListener('change', applyPeriod);
    // actualizar métricas iniciales
    actualizarMetricas(window.datosManuales);

    // Editar rangos de una fila existente
    async function editRangesForRow(index){
        const item = window.datosManuales[index];
        const initial = Array.isArray(item.Rangos) ? item.Rangos : [];
        try{
            const newRanges = await rangesModal.open(initial);
            if(Array.isArray(newRanges) && newRanges.length){
                item.Rangos = newRanges;
                // recalc horas y energia
                const potencia = Number(item.Potencia_W || 0);
                const horas = newRanges.reduce((s,r)=>{ let dur=r.fin - r.inicio; if(dur<0) dur+=24; if(r.inicio===0 && r.fin===24) dur=24; return s+dur; },0);
                item.HorasEncendido = horas;
                item.Energia_kWh = calcularEnergiaMultiRango(potencia, newRanges);
                renderTabla();
                procesarYGraficar(window.datosManuales, window.ldcChartRef);
                actualizarMetricas(window.datosManuales);
                mostrarAlerta('Rangos actualizados.', 'success');
            }
        }catch(e){ console.error('Edición de rangos cancelada', e); }
    }

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
    actualizarMetricas(window.datosManuales);
        // Ocultar formulario y deseleccionar
        detalleElectro.classList.add('d-none');
        applianceCards.forEach(c => c.classList.remove('selected'));
    });

    // Nota: el agregado manual ahora usa el modal de rangos (handler anterior eliminado)

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
        actualizarMetricas(window.datosManuales);
    });

    // Botón datos de ejemplo
    document.getElementById('generateSampleBtn').addEventListener('click', () => {
        cargarDatosEjemplo(window.datosManuales, renderTabla, mostrarAlerta);
        // actualizar métricas tras cargar ejemplos
        setTimeout(() => actualizarMetricas(window.datosManuales), 50);
        setTimeout(() => applyPeriod(), 80);
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
        procesarYGraficar(window.datosManuales, window.ldcChartRef, periodSelect ? periodSelect.value : 'dia');
        actualizarMetricas(window.datosManuales);
    });

    // Generar métricas por perfil horario
    const perfilBtn = document.getElementById('generarPerfilBtn');
    if(perfilBtn){
        perfilBtn.addEventListener('click', async () => {
            const perfilEl = document.getElementById('perfilHorarioSelect');
            const perfil = (perfilEl||{}).value || 'dia';
            const refs = { ldc: document.getElementById('ldcPerfilChart'), temporal: document.getElementById('temporalPerfilChart'), heat: document.getElementById('heatmapPerfilDiv') };
            // show spinner overlay
            showProfileSpinner(true);
            // custom hours
            let customHours = null;
            if(perfil === 'custom'){
                const start = Number(document.getElementById('customStartHour').value);
                const end = Number(document.getElementById('customEndHour').value);
                customHours = { start, end };
            }
            const summary = await generarMetricasPorPerfil(window.datosManuales, perfil, refs, customHours);
            if(summary){
                document.getElementById('resEnergiaPerfil').textContent = summary.energiaTotal.toFixed(3);
                document.getElementById('resPotenciaMediaPerfil').textContent = summary.potenciaMedia.toFixed(3);
                document.getElementById('resPotenciaPicoPerfil').textContent = summary.potenciaPico.toFixed(3);
            }
            showProfileSpinner(false);
        });
    }

    // Exportar imagen combinada de las tres visualizaciones
    const exportBtn = document.getElementById('exportPerfilBtn');
    if(exportBtn){
        exportBtn.addEventListener('click', async () => {
            try{
                const ldcCanvas = document.getElementById('ldcPerfilChart');
                const tempCanvas = document.getElementById('temporalPerfilChart');
                const heatDiv = document.getElementById('heatmapPerfilDiv');
                // obtain images
                const img1 = ldcCanvas ? ldcCanvas.toDataURL('image/png') : null;
                const img2 = tempCanvas ? tempCanvas.toDataURL('image/png') : null;
                const img3 = await Plotly.toImage(heatDiv, {format:'png', height:360, width: heatDiv.clientWidth});
                // create combined canvas
                const imgs = [img1,img2,img3].filter(Boolean);
                const tempImages = await Promise.all(imgs.map(src=>new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src;})));
                const width = Math.max(...tempImages.map(i=>i.width));
                const height = tempImages.reduce((s,i)=>s+i.height,0);
                const c = document.createElement('canvas'); c.width = width; c.height = height; const cx = c.getContext('2d');
                let y = 0; tempImages.forEach(img=>{ cx.drawImage(img, 0, y, width, img.height); y+=img.height; });
                const link = document.createElement('a'); link.download = `perfil_${Date.now()}.png`; link.href = c.toDataURL('image/png'); link.click();
            }catch(e){ console.error(e); mostrarAlerta('Error exportando imagen.','error'); }
        });
    }

    // Exportar PDF con las tres visualizaciones (ldc, temporal, heatmap)
    const exportPdfBtn = document.getElementById('exportPerfilPdfBtn');
    if(exportPdfBtn){
        exportPdfBtn.addEventListener('click', async () => {
            try{
                // ensure jsPDF is available (UMD exposes window.jspdf)
                const jspdfLib = window.jspdf || window.jsPDF || (window.jspdf && window.jspdf.jsPDF) || null;
                const jsPDFConstructor = jspdfLib && (jspdfLib.jsPDF || jspdfLib);
                if(!jsPDFConstructor){
                    mostrarAlerta('jsPDF no disponible en la página.', 'error');
                    return;
                }
                const ldcCanvas = document.getElementById('ldcPerfilChart');
                const tempCanvas = document.getElementById('temporalPerfilChart');
                const heatDiv = document.getElementById('heatmapPerfilDiv');
                const imgPromises = [];
                if(ldcCanvas) imgPromises.push(Promise.resolve(ldcCanvas.toDataURL('image/png')));
                if(tempCanvas) imgPromises.push(Promise.resolve(tempCanvas.toDataURL('image/png')));
                if(heatDiv) imgPromises.push(Plotly.toImage(heatDiv, {format:'png', height:360, width: heatDiv.clientWidth}));
                const imgs = (await Promise.all(imgPromises)).filter(Boolean);
                if(imgs.length === 0){ mostrarAlerta('No hay imágenes para exportar.', 'error'); return; }

                // Create PDF: use A4 portrait as default (210 x 297 mm)
                const pdf = new jsPDFConstructor({ unit: 'mm', format: 'a4', orientation: 'portrait' });
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();

                // For each image, add to PDF scaling to page width with aspect ratio, add page if needed
                for(let i=0;i<imgs.length;i++){
                    const dataUrl = imgs[i];
                    // create image object to get natural size
                    const imgObj = await new Promise((res,rej)=>{ const im = new Image(); im.onload=()=>res(im); im.onerror=rej; im.src=dataUrl; });
                    const imgWpx = imgObj.width; const imgHpx = imgObj.height;
                    // assume 96 dpi -> convert px to mm: mm = px * 25.4 / 96
                    const mmPerPx = 25.4 / 96;
                    const imgWmm = imgWpx * mmPerPx;
                    const imgHmm = imgHpx * mmPerPx;
                    const scale = Math.min(pageWidth * 0.95 / imgWmm, pageHeight * 0.95 / imgHmm, 1);
                    const drawW = imgWmm * scale; const drawH = imgHmm * scale;
                    const x = (pageWidth - drawW) / 2;
                    const y = (pageHeight - drawH) / 2;
                    if(i > 0) pdf.addPage();
                    pdf.addImage(dataUrl, 'PNG', x, y, drawW, drawH);
                }
                // Save with timestamp
                pdf.save(`perfil_visualizaciones_${Date.now()}.pdf`);
            }catch(err){ console.error('Error exportando PDF', err); mostrarAlerta('Error generando PDF.', 'error'); }
        });
    }

    // Guardar preferencia de perfil
    const savePrefBtn = document.getElementById('savePerfilPrefBtn');
    if(savePrefBtn){
        savePrefBtn.addEventListener('click', ()=>{
            const perfil = (document.getElementById('perfilHorarioSelect')||{}).value || 'dia';
            localStorage.setItem('perfilHorarioPref', perfil);
            mostrarAlerta('Preferencia guardada.', 'success');
        });
        // aplicar si existe preferencia
        const pref = localStorage.getItem('perfilHorarioPref');
        if(pref){ document.getElementById('perfilHorarioSelect').value = pref; }
    }

    // helper: populate hour selects for custom profile
    function populateCustomHourSelects(){
        const s = document.getElementById('customStartHour');
        const e = document.getElementById('customEndHour');
        if(!s||!e) return;
        s.innerHTML = ''; e.innerHTML = '';
        for(let h=0; h<24; h++){
            const lbl = h.toString().padStart(2,'0')+':00';
            const opt1 = document.createElement('option'); opt1.value = h; opt1.textContent = lbl; s.appendChild(opt1);
            const opt2 = opt1.cloneNode(true); e.appendChild(opt2);
        }
        s.value = '6'; e.value = '22';
    }

    populateCustomHourSelects();
    const perfilSelectEl = document.getElementById('perfilHorarioSelect');
    if(perfilSelectEl){
        perfilSelectEl.addEventListener('change', ()=>{
            const customControls = document.getElementById('customPerfilControls');
            if(perfilSelectEl.value === 'custom') customControls.classList.remove('d-none');
            else customControls.classList.add('d-none');
        });
    }

    // spinner show/hide
    function showProfileSpinner(show){
        const sp = document.getElementById('profileSpinner');
        if(!sp) return;
        if(show) sp.classList.add('show'); else sp.classList.remove('show');
    }
});