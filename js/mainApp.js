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
    // También actualizar estado al cambiar a LDC o Heatmap
    const ldcTab = document.getElementById('ldc-tab');
    if (ldcTab) {
        ldcTab.addEventListener('shown.bs.tab', () => applyPeriod());
        ldcTab.addEventListener('click', () => { setTimeout(() => applyPeriod(), 60); });
    }
    const heatmapTab = document.getElementById('heatmap-tab');
    if (heatmapTab) {
        heatmapTab.addEventListener('shown.bs.tab', () => applyPeriod());
        heatmapTab.addEventListener('click', () => { setTimeout(() => applyPeriod(), 60); });
    }

    // Re-dibujar al cambiar tema, solo si hay datos cargados
    document.body.addEventListener('classChange', () => {
        if ((window.datosManuales||[]).length > 0) {
            // Redibujar visualizaciones generales (LDC, Temporal, Heatmap)
            applyPeriod();
            // Redibujar métricas por perfil horario si el módulo está visible/configurado
            try { if (typeof generatePerfilFromUI === 'function') generatePerfilFromUI(false); } catch(_) {}
        }
    });
    // ...existing code...
    // NUEVO: Estructura de datos para múltiples rangos por carga
    // Cada carga tendrá: { Carga, Potencia_W, Rangos: [{inicio, fin}], Energia_kWh }

    // Agregar manual a la tabla (validar y abrir modal de rangos)
    const addManualBtn = document.getElementById('addManualBtn');
    if (!addManualBtn) {
        console.warn('#addManualBtn no encontrado en DOM');
    } else addManualBtn.addEventListener('click', async () => {
        const nombre = (document.getElementById('manualCarga').value || '').trim();
        const potencia = parseFloat(document.getElementById('manualPotencia').value);
        if (!nombre || isNaN(potencia)) {
            mostrarAlerta('Completa nombre y potencia.', 'error');
            return;
        }
        try {
            let rangos = null;
            try {
                rangos = await rangesModal.open();
            } catch (modalErr) {
                // Fallback: si el modal no está disponible, usar inicio/fin como un único rango
                console.warn('No se pudo abrir modal de rangos, usando fallback inicio/fin', modalErr);
                const hi = Number(document.getElementById('manualInicio')?.value ?? 0);
                const hf = Number(document.getElementById('manualFin')?.value ?? (hi+1));
                rangos = [{ inicio: hi, fin: hf }];
            }
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
        } catch (e) {
            console.warn('Error al agregar con rangos', e);
            mostrarAlerta('No se pudo agregar la carga. Revisa la consola.', 'error');
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

    const tablaTipoFilter = document.getElementById('tablaTipoFilter');
    const tipoCargaSelect = document.getElementById('tipoCargaSelect');

    function updateTiposUI(){
        try{
            const tipos = Array.from(new Set((window.datosManuales||[]).map(d=>String(d.Tipo_carga||'').trim()).filter(v=>v)));            
            // tabla filter
            if(tablaTipoFilter){
                const prev = tablaTipoFilter.value;
                tablaTipoFilter.innerHTML = '<option value="">Todos</option>' + tipos.map(t=>`<option value="${t}">${t}</option>`).join('');
                if (prev && (prev==='' || tipos.includes(prev))) tablaTipoFilter.value = prev; else tablaTipoFilter.value = '';
            }
            // charts selector
            if(tipoCargaSelect){
                const prev2 = tipoCargaSelect.value;
                tipoCargaSelect.innerHTML = '<option value="">Todos los tipos</option>' + tipos.map(t=>`<option value="${t}">${t}</option>`).join('');
                if (prev2 && (prev2==='' || tipos.includes(prev2))) tipoCargaSelect.value = prev2; else tipoCargaSelect.value = '';
            }
        }catch(_){ /* noop */ }
    }

    function renderTabla() {
        updateTiposUI();
        const filtro = (tablaTipoFilter && tablaTipoFilter.value) ? String(tablaTipoFilter.value) : '';
        const filterFn = filtro ? (d => String(d.Tipo_carga||'').trim() === filtro) : undefined;
        // pass an onEditRanges callback so rows can open the ranges modal
        actualizarTablaManual(tbody, window.datosManuales, crearFilaTabla, mostrarAlerta, async (idx) => {
            await editRangesForRow(idx);
        }, filterFn);
    }

    // Exportar informe PDF completo
    const exportFullBtn = document.getElementById('exportFullReportBtn');
    if (exportFullBtn) {
        exportFullBtn.addEventListener('click', async () => {
            try {
                // Show progress indicator
                showProfileSpinner(true);
                const spinnerTextEl = document.querySelector('#profileSpinner .profile-spinner div:nth-child(2)');
                if (spinnerTextEl) spinnerTextEl.textContent = 'Generando informe PDF...';

                // helper to ensure jsPDF loaded (local UMD or CDN fallback)
                async function ensureJsPDF(){
                    let jspdfLib = window.jspdf || window.jsPDF || (window.jspdf && window.jspdf.jsPDF) || null;
                    let Ctor = jspdfLib && (jspdfLib.jsPDF || jspdfLib);
                    if (Ctor) return Ctor;
                    // load from CDN fallback
                    await new Promise((resolve, reject) => {
                        const s = document.createElement('script');
                        s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
                        s.onload = () => resolve();
                        s.onerror = reject;
                        document.head.appendChild(s);
                    });
                    jspdfLib = window.jspdf || window.jsPDF || (window.jspdf && window.jspdf.jsPDF) || null;
                    Ctor = jspdfLib && (jspdfLib.jsPDF || jspdfLib);
                    return Ctor || null;
                }

                // jsPDF constructor from UMD (with fallback)
                const jsPDFConstructor = await ensureJsPDF();
                if(!jsPDFConstructor){
                    mostrarAlerta('jsPDF no disponible en la página.', 'error');
                    showProfileSpinner(false);
                    return;
                }

                // Utilities for ensuring charts are rendered
                const sleep = (ms) => new Promise(r => setTimeout(r, ms));
                const isHeatmapDrawn = () => {
                    const hd = document.getElementById('heatmapDiv');
                    if (!hd) return false;
                    // Plotly draws SVG inside the target div
                    return !!hd.querySelector('svg, canvas');
                };
                const ensureChartsRendered = async () => {
                    try {
                        // ensure data processed and charts drawn
                        const periodSelect = document.getElementById('periodSelect');
                        const periodo = periodSelect ? periodSelect.value : 'dia';
                        if (typeof procesarYGraficar === 'function') {
                            procesarYGraficar(window.datosManuales || [], window.ldcChartRef || {current:null}, periodo);
                        }
                        await sleep(150);
                    } catch (e) { console.warn('ensureChartsRendered warn', e); }
                };
                const showTabAndWait = async (tabId) => {
                    const tabBtn = document.getElementById(tabId);
                    if (!tabBtn) return;
                    try {
                        const tab = new bootstrap.Tab(tabBtn);
                        tab.show();
                        await sleep(200);
                    } catch(e) { console.warn('showTab warn', e); }
                };
                // Remember current active chart tab
                const activeTab = document.querySelector('#chartTabs .nav-link.active');
                const activeTabId = activeTab ? activeTab.id : null;

                // Pre-render charts
                if (spinnerTextEl) spinnerTextEl.textContent = 'Preparando visualizaciones...';
                await ensureChartsRendered();

                // Build PDF using Sunalyze template structure
                async function buildSunalyzeReport(jsPDFConstructor){
                    const pdf = new jsPDFConstructor({ unit: 'mm', format: 'a4', orientation: 'portrait' });
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    const margin = 15;
                    const contentWidth = pageWidth - (margin * 2);
                    let currentPage = 1;
                    let yPos = margin;

                    const colors = {
                        primary: [255,165,0],
                        secondary: [30,58,95],
                        text: [51,51,51],
                        lightGray: [240,240,240],
                        background: [250,246,240]
                    };

                    // Load logo as DataURL to avoid CORS/path issues in addImage
                    async function loadImageAsDataURL(path){
                        try{
                            // Try fetch -> blob -> dataURL
                            const res = await fetch(path, { cache: 'no-cache' });
                            if(!res.ok) throw new Error('fetch failed');
                            const blob = await res.blob();
                            return await new Promise((resolve)=>{
                                const reader = new FileReader();
                                reader.onload = () => resolve(reader.result);
                                reader.readAsDataURL(blob);
                            });
                        }catch(e){
                            try{
                                // Fallback via Image element
                                const img = await new Promise((res,rej)=>{ const im=new Image(); im.crossOrigin='anonymous'; im.onload=()=>res(im); im.onerror=rej; im.src=path+'?t='+(Date.now()); });
                                const canvas=document.createElement('canvas'); canvas.width=img.width; canvas.height=img.height; const cx=canvas.getContext('2d'); cx.drawImage(img,0,0);
                                return canvas.toDataURL('image/png');
                            }catch(e2){ return null; }
                        }
                    }
                    const logoPath = 'assets/icons/sunalyze_logo.png';
                    const DISABLE_LOGO = false; // re-enable logo embedding
                    const logoDataUrl = DISABLE_LOGO ? null : await loadImageAsDataURL(logoPath);

                    // Safe addImage wrapper
                    function safeAddImage(imgDataUrl, x, y, w, h, format='PNG'){
                        try{
                            if(typeof imgDataUrl === 'string' && imgDataUrl.startsWith('data:image/')){
                                pdf.addImage(imgDataUrl, format, x, y, w, h);
                                return true;
                            }
                        }catch(e){ console.warn('addImage failed', e); }
                        return false;
                    }

                    function agregarEncabezado(numeroPagina){
                        pdf.setPage(numeroPagina);
                        // Header logo: smaller and slightly higher to avoid overlapping the separator line
                        const logoW = 18, logoH = 18;
                        const logoX = pageWidth - margin - logoW;
                        const logoY = margin - 8; // raise logo a bit
                        try { if(logoDataUrl){ if(!safeAddImage(logoDataUrl, logoX, logoY, logoW, logoH)) throw new Error('no-logo'); } else { throw new Error('no-logo'); } }
                        catch(e){ pdf.setFillColor(...colors.primary); pdf.circle(pageWidth - margin - (logoW/2), margin + 3, 6, 'F'); }
                        pdf.setFontSize(11); pdf.setFont(undefined,'bold'); pdf.setTextColor(...colors.secondary);
                        pdf.text('INFORME DE ANÁLISIS ENERGÉTICO', margin, margin + 5);
                        const fecha = new Date().toLocaleDateString('es-ES', {year:'numeric',month:'long',day:'numeric'});
                        pdf.setFontSize(9); pdf.setFont(undefined,'normal'); pdf.setTextColor(...colors.text);
                        pdf.text(fecha, margin, margin + 10);
                        pdf.setDrawColor(...colors.primary); pdf.setLineWidth(0.5);
                        pdf.line(margin, margin + 13, pageWidth - margin, margin + 13);
                    }

                    function agregarPieDePagina(numeroPagina, totalPaginas){
                        pdf.setPage(numeroPagina);
                        pdf.setFontSize(8); pdf.setTextColor(180,180,180); pdf.setFont(undefined,'italic');
                        const dev = 'Desarrollado por: Oquendo, Vega y Viloria';
                        pdf.text(dev, pageWidth/2, pageHeight - 5, {align:'center'});
                        pdf.setFontSize(9); pdf.setTextColor(...colors.text); pdf.setFont(undefined,'normal');
                        pdf.text(`Página ${numeroPagina} de ${totalPaginas}`, pageWidth - margin, pageHeight - 10, {align:'right'});
                        try { if(logoDataUrl){ if(!safeAddImage(logoDataUrl, margin, pageHeight - 15, 12, 12)) throw new Error('no-logo'); } else { throw new Error('no-logo'); } }
                        catch(e){ pdf.setFillColor(...colors.primary); pdf.circle(margin + 6, pageHeight - 9, 4, 'F'); }
                    }

                    // P1: Resumen ejecutivo y métricas
                    agregarEncabezado(currentPage);
                    yPos = margin + 20;
                    pdf.setFontSize(14); pdf.setFont(undefined,'bold'); pdf.setTextColor(...colors.secondary);
                    pdf.text('Resumen Ejecutivo', margin, yPos); yPos += 12;

                    const energiaTotal = (document.getElementById('energiaTotal_dia')||document.getElementById('energiaTotal')||{}).textContent || '-';
                    const potenciaMedia = (document.getElementById('potenciaMedia_dia')||document.getElementById('potenciaMedia')||{}).textContent || '-';
                    const potenciaPico = (document.getElementById('potenciaPico_dia')||document.getElementById('potenciaPico')||{}).textContent || '-';
                    const numCargas = (window.datosManuales||[]).length;
                    const metricas=[
                        { titulo:'Energía Total Diaria', valor:`${energiaTotal} kWh`, icono:'⚡' },
                        { titulo:'Potencia Media', valor:`${potenciaMedia} kW`, icono:'📈' },
                        { titulo:'Potencia Pico', valor:`${potenciaPico} kW`, icono:'🔝' },
                        { titulo:'Número de Cargas', valor:String(numCargas), icono:'🔌' }
                    ];
                    const cardWidth=(contentWidth-10)/2, cardHeight=25; let xPos=margin, cardY=yPos;
                    metricas.forEach((m,idx)=>{
                        if(idx===2){ xPos=margin; cardY+=cardHeight+5; }
                        pdf.setFillColor(...colors.lightGray); pdf.roundedRect(xPos, cardY, cardWidth, cardHeight, 2, 2, 'F');
                        pdf.setFontSize(10); pdf.setFont(undefined,'bold'); pdf.setTextColor(...colors.text);
                        pdf.text(m.titulo, xPos+4, cardY+7);
                        pdf.setFontSize(18); pdf.setTextColor(...colors.primary); pdf.text(String(m.valor), xPos+4, cardY+18);
                        xPos+=cardWidth+5;
                    });
                    yPos = cardY + cardHeight + 15;

                    // Tabla de cargas
                    pdf.setFontSize(14); pdf.setFont(undefined,'bold'); pdf.setTextColor(...colors.secondary);
                    pdf.text('Detalle de Cargas', margin, yPos); yPos+=10;
                    pdf.setFontSize(9);
                    const colWidths=[12,55,28,22,28,35];
                    const headers=['#','Carga','Potencia (W)','Horas','Energía (kWh)','Horarios'];
                    const rowHeight=7;
                    function dibujarEncabezadoTabla(y){
                        // Mejor legibilidad: encabezado claro con texto negro
                        pdf.setFillColor(...colors.lightGray); pdf.rect(margin, y, contentWidth, rowHeight, 'F');
                        pdf.setTextColor(...colors.text); pdf.setFont(undefined,'bold'); let x=margin+2;
                        headers.forEach((h,i)=>{ pdf.text(h, x, y+5); x+=colWidths[i]; });
                        return y+rowHeight;
                    }

                    // Render filas (limitado a 50 registros para PDF)
                    yPos = dibujarEncabezadoTabla(yPos);
                    const allRows = (window.datosManuales||[]);
                    const totalRows = allRows.length;
                    const rows = allRows.slice(0, 50);
                    if(totalRows > 50){
                        pdf.setFontSize(8); pdf.setFont(undefined,'normal'); pdf.setTextColor(120,120,120);
                        pdf.text(`Mostrando 50 de ${totalRows} registros.`, margin, yPos + 5);
                        yPos += 10; // dar espacio a la nota
                        pdf.setFontSize(9); pdf.setTextColor(...colors.text); pdf.setFont(undefined,'normal');
                    }
                    rows.forEach((d,i)=>{
                        let x=margin+2;
                        const rangosTexto = Array.isArray(d.Rangos) && d.Rangos.length>0 ? d.Rangos.map(r=>`${r.inicio}-${r.fin}h`).join(', ') : (d.HoraInicio!=null?`${d.HoraInicio}-${d.HoraFin}h`:'-');
                        const fila=[ String(i+1), d.Carga||'-', Number(d.Potencia_W||0).toFixed(0), parseInt(d.HorasEncendido||0), Number(d.Energia_kWh||0).toFixed(2), rangosTexto ];
                        fila.forEach((cell,idx)=>{ const text=String(cell); const maxW=colWidths[idx]-3; const lines=pdf.splitTextToSize(text, maxW); pdf.text(lines[0], x, yPos+5); x+=colWidths[idx]; });
                        yPos += rowHeight;
                    });

                    // Nueva página: LDC
                    currentPage++; pdf.addPage(); agregarEncabezado(currentPage); yPos = margin + 20;
                    pdf.setFontSize(14); pdf.setFont(undefined,'bold'); pdf.setTextColor(...colors.secondary);
                    pdf.text('Curva de Duración de Carga (LDC)', margin, yPos); yPos+=5;
                    pdf.setFontSize(9); pdf.setFont(undefined,'normal'); pdf.setTextColor(...colors.text);
                    const descLDC = 'La curva LDC muestra la potencia demandada ordenada de mayor a menor y el porcentaje del tiempo que se mantiene cada nivel de potencia.';
                    pdf.text(pdf.splitTextToSize(descLDC, contentWidth), margin, yPos+5); yPos+=15;
                    try{
                        const ldcCanvas = document.getElementById('ldcChart');
                        if (ldcCanvas && ldcCanvas.width && ldcCanvas.height){
                            const img = ldcCanvas.toDataURL('image/png',1.0);
                            const imgH = Math.min((contentWidth * ldcCanvas.height)/Math.max(ldcCanvas.width,1), 120);
                            safeAddImage(img, margin, yPos, contentWidth, imgH) && (yPos+=imgH+10);
                        } else {
                            pdf.text('(LDC no disponible para exportación)', margin, yPos); yPos+=10;
                        }
                    }catch(e){ console.warn('LDC capture failed', e); pdf.text('(LDC no disponible para exportación)', margin, yPos); yPos+=10; }

                    // Nueva página: Heatmap
                    currentPage++; pdf.addPage(); agregarEncabezado(currentPage); yPos = margin + 20;
                    pdf.setFontSize(14); pdf.setFont(undefined,'bold'); pdf.setTextColor(...colors.secondary);
                    pdf.text('Mapa de Calor - Distribución Horaria', margin, yPos); yPos+=5;
                    pdf.setFontSize(9); pdf.setFont(undefined,'normal'); pdf.setTextColor(...colors.text);
                    const descHeat = 'El mapa de calor visualiza la potencia demandada por hora del día. Colores cálidos indican mayor consumo; fríos, menor consumo.';
                    pdf.text(pdf.splitTextToSize(descHeat, contentWidth), margin, yPos+5); yPos+=15;
                    const heatDiv = document.getElementById('heatmapDiv');
                    let heatImg = null;
                    if (heatDiv){
                        try{
                            if (window.Plotly && typeof Plotly.toImage==='function'){
                                const w=Math.max(heatDiv.clientWidth||600,600); const h=Math.max(heatDiv.clientHeight||360,360);
                                heatImg = await Plotly.toImage(heatDiv,{format:'png',width:w,height:h,scale:2});
                            }
                        }catch(e){ /* fallback below */ }
                        if (!heatImg){
                            try{ const canvas = await html2canvas(heatDiv,{scale:2,useCORS:true,logging:false,backgroundColor:'#FFFFFF'}); heatImg = canvas.toDataURL('image/png',1.0);} catch(e){ heatImg=null; }
                        }
                    }
                    if (heatImg){ const img = new Image(); await new Promise((res,rej)=>{ img.onload=res; img.onerror=rej; img.src=heatImg;}); const imgH = Math.min((contentWidth * img.height)/Math.max(img.width,1), 120); safeAddImage(heatImg, margin, yPos, contentWidth, imgH) && (yPos+=imgH+10); }
                    else { pdf.text('(No se pudo generar la imagen del mapa de calor)', margin, yPos); yPos+=10; }

                    // Nueva página: Consumo temporal
                    currentPage++; pdf.addPage(); agregarEncabezado(currentPage); yPos = margin + 20;
                    pdf.setFontSize(14); pdf.setFont(undefined,'bold'); pdf.setTextColor(...colors.secondary);
                    pdf.text('Análisis de Consumo Temporal', margin, yPos); yPos+=5;
                    pdf.setFontSize(9); pdf.setFont(undefined,'normal'); pdf.setTextColor(...colors.text);
                    const descTmp='Esta gráfica muestra la evolución del consumo eléctrico a lo largo del tiempo, permitiendo identificar tendencias y patrones de uso.';
                    pdf.text(pdf.splitTextToSize(descTmp, contentWidth), margin, yPos+5); yPos+=15;
                    try{
                        // Asegurar que la pestaña temporal está visible antes de capturar
                        await showTabAndWait('temporal-tab');
                        await ensureChartsRendered();
                        const tempCanvas = document.getElementById('temporalChart');
                        let added = false;
                        if (tempCanvas) {
                            // Si Chart.js no definió dimensiones aún, forzamos layout
                            if (!tempCanvas.width || !tempCanvas.height) {
                                tempCanvas.getContext('2d');
                            }
                            if (tempCanvas.width && tempCanvas.height){
                                const img=tempCanvas.toDataURL('image/png',1.0);
                                const imgH=Math.min((contentWidth * tempCanvas.height)/Math.max(tempCanvas.width,1),120);
                                added = safeAddImage(img, margin, yPos, contentWidth, imgH);
                                if(added) yPos += imgH + 10;
                            }
                        }
                        if (!added) {
                            // Fallback: rasterizar el contenedor con html2canvas
                            const container = tempCanvas ? tempCanvas.parentElement : document.getElementById('temporalPanel');
                            if (container && window.html2canvas) {
                                const canvasCap = await html2canvas(container,{scale:2,useCORS:true,logging:false,backgroundColor:'#FFFFFF'});
                                const img = canvasCap.toDataURL('image/png',1.0);
                                const ratio = canvasCap.height/Math.max(canvasCap.width,1);
                                const h = Math.min(contentWidth * ratio, 120);
                                safeAddImage(img, margin, yPos, contentWidth, h) && (yPos+=h+10);
                            } else {
                                pdf.text('(Gráfica temporal no disponible para exportación)', margin, yPos); yPos+=10;
                            }
                        }
                    }catch(e){ console.warn('Temporal capture failed', e); pdf.text('(Gráfica temporal no disponible para exportación)', margin, yPos); yPos+=10; }

                    // Pie de página y guardar
                    const totalPages = pdf.internal.pages.length - 1;
                    for (let i=1;i<=totalPages;i++){ agregarPieDePagina(i,totalPages); }
                    const fecha = new Date();
                    const nombreArchivo = `Informe_Sunalyze_${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,'0')}-${String(fecha.getDate()).padStart(2,'0')}.pdf`;
                    pdf.save(nombreArchivo);
                }

                // Run template builder
                await buildSunalyzeReport(jsPDFConstructor);
                mostrarAlerta('Informe PDF exportado.', 'success');
            } catch (err) {
                console.error('Error generando informe PDF', err);
                mostrarAlerta('Error generando informe PDF.', 'error');
            } finally {
                showProfileSpinner(false);
            }
        });
    }
    renderTabla();
    // period selector (dia/mes) afecta graficas
    const periodSelect = document.getElementById('periodSelect');
    function applyPeriod() {
        const periodo = periodSelect ? periodSelect.value : 'dia';
        // Habilitar selects solo en la pestaña de Consumo temporal
        const temporalModeSelect = document.getElementById('temporalModeSelect');
        const temporalTopNSelect = document.getElementById('temporalTopNSelect');
        const activeTab = document.querySelector('#chartTabs .nav-link.active');
        const isTemporalActive = !!(activeTab && activeTab.id === 'temporal-tab');
        if (temporalModeSelect) {
            temporalModeSelect.disabled = !isTemporalActive;
            temporalModeSelect.style.opacity = isTemporalActive ? '1' : '0.55';
            temporalModeSelect.title = isTemporalActive ? '' : 'Disponible solo en "Consumo temporal"';
        }
        // Mostrar selector de tipo solo en temporal
        if (tipoCargaSelect) {
            tipoCargaSelect.disabled = !isTemporalActive;
            tipoCargaSelect.style.opacity = isTemporalActive ? '1' : '0.55';
            tipoCargaSelect.title = isTemporalActive ? '' : 'Disponible solo en "Consumo temporal"';
        }
        if (temporalTopNSelect) {
            const showTopN = isTemporalActive && temporalModeSelect && temporalModeSelect.value === 'por-carga';
            temporalTopNSelect.disabled = !showTopN;
            temporalTopNSelect.style.opacity = showTopN ? '1' : '0.55';
            temporalTopNSelect.title = showTopN ? '' : 'Disponible solo en "Series por carga" del gráfico temporal';
        }
        // Evitar alertas si no hay datos
        if (!window.datosManuales || window.datosManuales.length === 0) {
            return; // no procesar ni recalcular métricas
        }
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
    if (tipoCargaSelect) tipoCargaSelect.addEventListener('change', applyPeriod);
    if (tablaTipoFilter) tablaTipoFilter.addEventListener('change', renderTabla);
    // Inicial: set visibility state for TopN
    applyPeriod();

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
        if (!inicioElectro || !finElectro) return;
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
    if (inicioElectro && finElectro) {
        llenarSelectHorasElectro();
    }

    // Handler: botón ➕ (agregado rápido con modal de rangos)
    if (agregarElectroBtn) {
        window.USE_MAINAPP_QUICKADD = true;
        agregarElectroBtn.addEventListener('click', async () => {
            const nombre = (nombreElectro?.value || '').trim();
            const potencia = parseFloat(potenciaElectro?.value);
            const cantidad = Math.max(1, parseInt(cantidadElectro?.value));
            if (!nombre || isNaN(potencia) || isNaN(cantidad) || cantidad < 1) {
                mostrarAlerta('Selecciona un equipo y completa nombre, potencia y cantidad.', 'error');
                return;
            }
            try {
                let rangos = null;
                try {
                    rangos = await rangesModal.open();
                } catch (modalErr) {
                    // Fallback: si el modal no está disponible, usar inicio/fin como un único rango
                    console.warn('No se pudo abrir modal de rangos, usando fallback inicio/fin', modalErr);
                    const hi = Number(inicioElectro?.value ?? 0);
                    const hf = Number(finElectro?.value ?? (hi+1));
                    rangos = [{ inicio: hi, fin: hf }];
                }
                if (!Array.isArray(rangos) || rangos.length === 0) {
                    mostrarAlerta('No se definieron rangos.', 'error');
                    return;
                }
                const energiaUnaUnidad = calcularEnergiaMultiRango(potencia, rangos);
                const horasUnaUnidad = rangos.reduce((s,r)=>{ let d=r.fin-r.inicio; if(d<0) d+=24; if(r.inicio===0 && r.fin===24) d=24; return s+d; },0);
                for (let i = 0; i < cantidad; i++) {
                    window.datosManuales.push({
                        Carga: nombre + (cantidad > 1 ? ` (${i+1})` : ''),
                        Potencia_W: potencia,
                        Rangos: rangos,
                        HorasEncendido: horasUnaUnidad,
                        Energia_kWh: energiaUnaUnidad
                    });
                }
                mostrarAlerta('Electrodoméstico agregado con rangos.', 'success');
                renderTabla();
                procesarYGraficar(window.datosManuales, window.ldcChartRef);
                actualizarMetricas(window.datosManuales);
                // Ocultar formulario y deseleccionar
                detalleElectro.classList.add('d-none');
                applianceCards.forEach(c => c.classList.remove('selected'));
            } catch (e) {
                console.warn('Error al agregar con rangos (rápido)', e);
                mostrarAlerta('No se pudo agregar el equipo. Revisa la consola.', 'error');
            }
        });
    } else {
        console.warn('#agregarElectroBtn no encontrado en DOM');
    }

    // Mostrar formulario al hacer clic en un electrodoméstico
    applianceCards.forEach(card => {
        card.addEventListener('click', () => {
            applianceCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            detalleElectro.classList.remove('d-none');
            nombreElectro.value = card.getAttribute('data-nombre') || '';
            potenciaElectro.value = card.getAttribute('data-potencia') || '';
            cantidadElectro.value = 1;
            // Set default hours for quick config form
            if (inicioElectro) inicioElectro.value = '0';
            if (finElectro) finElectro.value = '1';
        });
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
    const perfilEl = document.getElementById('perfilHorarioSelect');
    const customControls = document.getElementById('customPerfilControls');
    const customStartHour = document.getElementById('customStartHour');
    const customEndHour = document.getElementById('customEndHour');

    // Rellenar selects de horas personalizadas si existen
    function fillCustomHourSelects(){
        if(!customStartHour || !customEndHour) return;
        if(customStartHour.options.length === 0){
            for(let h=0; h<24; h++){
                const label = String(h).padStart(2,'0')+':00';
                const o1 = document.createElement('option'); o1.value = h; o1.textContent = label; customStartHour.appendChild(o1);
                const o2 = document.createElement('option'); o2.value = h; o2.textContent = label; customEndHour.appendChild(o2);
            }
            customStartHour.value = '6';
            customEndHour.value = '18';
        }
    }
    fillCustomHourSelects();

    async function generatePerfilFromUI(showSpinner=false){
        if(!Array.isArray(window.datosManuales) || window.datosManuales.length===0){ return; }
        const perfil = (perfilEl||{}).value || 'dia';
        const refs = { ldc: document.getElementById('ldcPerfilChart'), temporal: document.getElementById('temporalPerfilChart'), heat: document.getElementById('heatmapPerfilDiv') };
        if(showSpinner) showProfileSpinner(true);
        let customHours = null;
        if(perfil === 'custom' && customStartHour && customEndHour){
            const start = Number(customStartHour.value);
            const end = Number(customEndHour.value);
            customHours = { start, end };
        }
        const summary = await generarMetricasPorPerfil(window.datosManuales, perfil, refs, customHours);
        if(summary){
            document.getElementById('resEnergiaPerfil').textContent = summary.energiaTotal.toFixed(3);
            document.getElementById('resPotenciaMediaPerfil').textContent = summary.potenciaMedia.toFixed(3);
            document.getElementById('resPotenciaPicoPerfil').textContent = summary.potenciaPico.toFixed(3);
        }
        if(showSpinner) showProfileSpinner(false);
    }

    // Botón: con spinner
    if(perfilBtn){ perfilBtn.addEventListener('click', () => generatePerfilFromUI(true)); }

    // Cambio de perfil: actualizar automáticamente y mostrar/ocultar controles custom
    if(perfilEl){
        perfilEl.addEventListener('change', () => {
            if(customControls){ customControls.classList.toggle('d-none', perfilEl.value !== 'custom'); }
            generatePerfilFromUI(false);
        });
    }

    // Cambio de horas personalizadas: actualizar automáticamente
    if(customStartHour){ customStartHour.addEventListener('change', () => generatePerfilFromUI(false)); }
    if(customEndHour){ customEndHour.addEventListener('change', () => generatePerfilFromUI(false)); }

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
                // create combined canvas with white background for better contrast
                const imgs = [img1,img2,img3].filter(Boolean);
                const tempImages = await Promise.all(imgs.map(src=>new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src;})));
                const width = Math.max(...tempImages.map(i=>i.width));
                const height = tempImages.reduce((s,i)=>s+i.height,0);
                const c = document.createElement('canvas'); c.width = width; c.height = height; const cx = c.getContext('2d');
                // paint white background
                cx.fillStyle = '#ffffff'; cx.fillRect(0,0,width,height);
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

    // Exportar PNG de la gráfica visible (Visualizaciones)
    const exportGeneralPngBtn = document.getElementById('exportGeneralPngBtn');
    if (exportGeneralPngBtn) {
        exportGeneralPngBtn.addEventListener('click', async () => {
            try {
                const activeBtn = document.querySelector('#chartTabs .nav-link.active');
                const activeId = activeBtn ? activeBtn.id : null;
                if (!activeId) { mostrarAlerta('No hay una pestaña activa.', 'error'); return; }
                if (activeId === 'ldc-tab' || activeId === 'temporal-tab') {
                    const canvas = (activeId === 'ldc-tab') ? document.getElementById('ldcChart') : document.getElementById('temporalChart');
                    if (!canvas) { mostrarAlerta('Gráfica no disponible.', 'error'); return; }
                    if (!canvas.width || !canvas.height) { canvas.getContext('2d'); }
                    const w = canvas.width || canvas.clientWidth || 800;
                    const h = canvas.height || canvas.clientHeight || 400;
                    const out = document.createElement('canvas'); out.width = w; out.height = h; const ctx = out.getContext('2d');
                    ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,w,h);
                    ctx.drawImage(canvas, 0, 0, w, h);
                    const a = document.createElement('a'); a.download = `${activeId==='ldc-tab'?'ldc':'temporal'}_${Date.now()}.png`; a.href = out.toDataURL('image/png'); a.click();
                    return;
                }
                if (activeId === 'heatmap-tab') {
                    const heatDiv = document.getElementById('heatmapDiv');
                    if (!heatDiv) { mostrarAlerta('Mapa de calor no disponible.', 'error'); return; }
                    const dims = { w: Math.max(heatDiv.clientWidth||600,600), h: Math.max(heatDiv.clientHeight||360,360) };
                    try {
                        if (window.Plotly && typeof Plotly.toImage === 'function') {
                            const dataUrl = await Plotly.toImage(heatDiv, { format: 'png', width: dims.w, height: dims.h });
                            const a = document.createElement('a'); a.download = `heatmap_${Date.now()}.png`; a.href = dataUrl; a.click();
                            return;
                        }
                    } catch(_) { /* fallback */ }
                    if (window.html2canvas) {
                        const cap = await html2canvas(heatDiv, { scale: 2, backgroundColor: '#FFFFFF' });
                        const a = document.createElement('a'); a.download = `heatmap_${Date.now()}.png`; a.href = cap.toDataURL('image/png'); a.click();
                        return;
                    }
                    mostrarAlerta('No se pudo capturar el mapa de calor.', 'error');
                }
            } catch (e) { console.error('Export PNG (visible) failed', e); mostrarAlerta('Error exportando PNG.', 'error'); }
        });
    }
});