// metricsAndCharts.js
// Lógica mejorada para procesar datos y generar métricas, LDC, temporal y heatmap
import { mostrarAlerta } from './utils.js';

const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// Detecta modo oscuro y provee colores para ejes, ticks, grid y leyendas
function isDarkMode(){
    try{ return document.body.classList.contains('dark-mode'); }catch(_){ return false; }
}
function chartTheme(){
    const dark = isDarkMode();
    return {
        dark,
        grid: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
        ticks: dark ? '#e5e7eb' : '#374151',
        title: dark ? '#e5e7eb' : '#111827',
        legend: dark ? '#e5e7eb' : '#111827',
        paper: dark ? '#181a1b' : '#ffffff',
        plot: dark ? '#181a1b' : '#ffffff'
    };
}

function buildHourlyRow(d) {
    const row = new Array(24).fill(0);
    const potKw = Number(d.Potencia_W || 0) / 1000;
    if (Array.isArray(d.Rangos) && d.Rangos.length) {
        d.Rangos.forEach(r => {
            let hi = Number(r.inicio||0), hf = Number(r.fin||0);
            if (hi === 0 && hf === 24) {
                for (let h = 0; h < 24; h++) row[h] += potKw;
            } else if (hi <= hf) {
                for (let h = hi; h < hf; h++) row[h%24] += potKw;
            } else {
                for (let h = hi; h < 24; h++) row[h] += potKw;
                for (let h = 0; h < hf; h++) row[h] += potKw;
            }
        });
    } else if (typeof d.HoraInicio === 'number' && typeof d.HoraFin === 'number') {
        const hi = Number(d.HoraInicio||0), hf = Number(d.HoraFin||0);
        if (hi === 0 && hf === 24) {
            for (let h = 0; h < 24; h++) row[h] += potKw;
        } else if (hi <= hf) {
            for (let h = hi; h < hf; h++) row[h%24] += potKw;
        } else {
            for (let h = hi; h < 24; h++) row[h] += potKw;
            for (let h = 0; h < hf; h++) row[h] += potKw;
        }
    } else {
        // fallback: distribute over HoursEncendido from 0
        const he = Math.round(Number(d.HorasEncendido || 0));
        for (let h = 0; h < he && h < 24; h++) row[h] += potKw;
    }
    return row;
}

function safeNumber(v) { return Number(v || 0); }

function generateColor(i){
    // nice distinct colors (cycle if many)
    const palette = ['#0d6efd','#198754','#dc3545','#fd7e14','#6f42c1','#0dcaf0','#20c997','#ffc107','#6610f2','#d63384'];
    return palette[i % palette.length];
}

// Plugin to dim non-active datasets when hovering legend
const legendHighlightPlugin = {
    id: 'legendHighlight',
    afterEvent: (chart, evt) => {
        const e = evt.event;
        if (!chart.tooltip) return;
        // When hovering legend, Chart.js triggers 'legendHover' events via native interactions; we approximate by pointerover on legend items
    }
};

export function procesarYGraficar(datosManuales, ldcChartRef, periodo = 'dia') {
    if (!Array.isArray(datosManuales) || datosManuales.length === 0) {
        mostrarAlerta('No hay datos para procesar.', 'error');
        // limpiar visuales
        if (ldcChartRef.current) { ldcChartRef.current.destroy(); ldcChartRef.current = null; }
        Plotly.purge && Plotly.purge('heatmapDiv');
        return;
    }

    // ==== MATRICES BASE ====
    const cargas = datosManuales.map(d => d.Carga || 'Sin nombre');
    // hourly matrix (power kW)
    const hourlyMatrix = datosManuales.map(d => buildHourlyRow(d));
    // hourly totals (kW)
    const hourlyTotals = new Array(24).fill(0);
    hourlyMatrix.forEach(row => row.forEach((v,h)=> hourlyTotals[h]+=v));

    // daily energy total (kWh) = sum(hourlyTotals)
    const energiaDiariaTotal = hourlyTotals.reduce((a,b)=>a+b,0);

    // monthly estimation: apply light seasonality factors to create variation
    const seasonal = [0.98,0.98,1.00,1.02,1.03,1.05,1.06,1.05,1.03,1.01,0.99,0.98];
    // monthly totals per month (kWh/month)
    const monthlyTotals = monthNames.map((_,mi) => energiaDiariaTotal * 30 * seasonal[mi]);

    // ===== MÉTRICAS (por día, mes y año simplificadas) =====
    const energiaTotalDia = energiaDiariaTotal; // kWh/day
    const energiaTotalMes = energiaDiariaTotal * 30; // kWh/month (est)
    const energiaTotalAnio = energiaDiariaTotal * 365; // kWh/year (est)

    // potencia media: average of non-zero hourly totals (kW)
    const nonZero = hourlyTotals.filter(v=>v>0);
    const potenciaMedia = nonZero.length ? (nonZero.reduce((a,b)=>a+b,0)/nonZero.length) : 0;
    // potencia pico horario (kW)
    const potenciaPicoHorario = Math.max(...hourlyTotals);
    // potencia pico por carga (max single device)
    const potenciaPicoCarga = Math.max(...datosManuales.map(d=>safeNumber(d.Potencia_W)/1000));

    // escribir métricas legacy (ids used elsewhere)
    const energiaEl = document.getElementById('energiaTotal');
    if (energiaEl) energiaEl.textContent = energiaTotalDia.toFixed(2);

    // ==== LDC ====
    if (periodo === 'dia') {
        const potOrdenadas = hourlyTotals.slice().sort((a,b)=>b-a);
        const porcentaje = potOrdenadas.map((_,i)=> ((i+1)/potOrdenadas.length)*100);
        const ctx = document.getElementById('ldcChart').getContext('2d');
        if (ldcChartRef.current) ldcChartRef.current.destroy();
        const theme = chartTheme();
        ldcChartRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: porcentaje.map(v => v.toFixed(0) + '%'),
                datasets: [
                    {
                        label: 'Potencia (kW) — LDC diario',
                        data: potOrdenadas,
                        borderColor: '#0d6efd',
                        backgroundColor: 'rgba(13,110,253,0.08)',
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false, labels: { color: theme.legend } } },
                scales: {
                    x: { title: { display: true, text: 'Duración (% tiempo)', color: theme.title }, ticks:{ color: theme.ticks }, grid:{ color: theme.grid } },
                    y: { title: { display: true, text: 'Potencia (kW)', color: theme.title }, ticks:{ color: theme.ticks }, grid:{ color: theme.grid } }
                }
            }
        });
    } else {
        // LDC mensual: ordenar cargas por energía mensual estimada
        const monthlyPerCarga = datosManuales.map(d => (safeNumber(d.Energia_kWh) || (safeNumber(d.Potencia_W)/1000 * safeNumber(d.HorasEncendido))) * 30);
        const sorted = monthlyPerCarga.slice().sort((a,b)=>b-a);
        const ctx = document.getElementById('ldcChart').getContext('2d');
        if (ldcChartRef.current) ldcChartRef.current.destroy();
        const theme = chartTheme();
        ldcChartRef.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sorted.map((_, i) => `#${i+1}`),
                datasets: [
                    {
                        label: 'Energía estimada (kWh/mes)',
                        data: sorted,
                        backgroundColor: 'rgba(255,159,64,0.8)'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false, labels: { color: theme.legend } } },
                scales: {
                    x: { ticks:{ color: theme.ticks }, grid:{ color: theme.grid } },
                    y: { title: { display: true, text: 'kWh/mes', color: theme.title }, ticks:{ color: theme.ticks }, grid:{ color: theme.grid } }
                }
            }
        });
    }

    // ==== TEMPORAL ====
    // use Chart.js separate instance stored on window.temporalChartRef
    const temporalCtx = document.getElementById('temporalChart').getContext('2d');
    // check temporal mode selector (if present)
    const temporalModeEl = document.getElementById('temporalModeSelect');
    const temporalMode = temporalModeEl ? temporalModeEl.value : 'suma';
    // tipo selector
    const tipoSelEl = document.getElementById('tipoCargaSelect');
    const tipoFilter = tipoSelEl ? String(tipoSelEl.value || '') : '';
    const shareEl = document.getElementById('tipoShareText');
    if (shareEl) shareEl.textContent = '';
    // helper: indices by tipo (normalize empty)
    const tipoKey = (t)=>{ const s=String(t||'').trim(); return s || 'Sin tipo'; };
    const tiposMap = new Map();
    datosManuales.forEach((d,i)=>{
        const k = tipoKey(d.Tipo_carga);
        if(!tiposMap.has(k)) tiposMap.set(k, []);
        tiposMap.get(k).push(i);
    });
    if (periodo === 'dia') {
        const labels = Array.from({length:24},(_,i)=>i + ':00');
        if (temporalMode === 'por-carga') {
            // Top N filter
            const topNEl = document.getElementById('temporalTopNSelect');
            const topN = topNEl ? Number(topNEl.value) : 0;
            // compute metric to sort loads (use Energia_kWh or peak contribution)
            const scoreArr = datosManuales.map((d,i)=>({i, score: safeNumber(d.Energia_kWh) || Math.max(...hourlyMatrix[i])}));
            const filteredScore = tipoFilter ? scoreArr.filter(x=> tipoKey(datosManuales[x.i].Tipo_carga) === tipoKey(tipoFilter)) : scoreArr;
            const sortedByScore = filteredScore.slice().sort((a,b)=>b.score - a.score);
            const chosenIndexes = (topN>0) ? sortedByScore.slice(0, topN).map(x=>x.i) : sortedByScore.map(x=>x.i);
            const datasets = chosenIndexes.map((idx, outIdx) => ({
                label: cargas[idx] || `C${idx+1}`,
                data: hourlyMatrix[idx].slice(),
                borderColor: generateColor(outIdx),
                backgroundColor: generateColor(outIdx),
                fill: false,
                tension: 0.2,
                pointRadius: 2
            }));
            if (window.temporalChartRef) window.temporalChartRef.destroy();
            const theme = chartTheme();
            window.temporalChartRef = new Chart(temporalCtx, {
                type: 'line',
                data: { labels, datasets },
                options: {
                    responsive: true,
                    plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth:10, color: theme.legend } }, tooltip: { mode: 'nearest' } },
                    interaction: { mode: 'nearest', intersect: false },
                    scales: {
                        x: { title: { display: true, text: 'Hora', color: theme.title }, ticks:{ color: theme.ticks }, grid:{ color: theme.grid } },
                        y: { title: { display: true, text: 'Potencia (kW)', color: theme.title }, ticks:{ color: theme.ticks }, grid:{ color: theme.grid } }
                    }
                },
                plugins: [legendHighlightPlugin]
            });
            // share text for filtered tipo (optional)
            if (shareEl && tipoFilter) {
                const idxs = tiposMap.get(tipoKey(tipoFilter)) || [];
                let sum = 0; idxs.forEach(i=>{ sum += hourlyMatrix[i].reduce((a,b)=>a+b,0); });
                const pct = (energiaDiariaTotal>0)? (sum/energiaDiariaTotal*100):0;
                shareEl.textContent = `Participación de "${tipoFilter}": ${pct.toFixed(1)}% del consumo diario`;
            }
        } else if (temporalMode === 'por-tipo') {
            const datasets = [];
            let idxColor = 0;
            const orderTipos = Array.from(tiposMap.keys());
            orderTipos.forEach((k) => {
                if (tipoFilter && tipoKey(tipoFilter) !== k) return;
                const idxs = tiposMap.get(k) || [];
                const series = new Array(24).fill(0);
                idxs.forEach(i=>{ for(let h=0;h<24;h++){ series[h] += hourlyMatrix[i][h]||0; } });
                datasets.push({ label: k, data: series, borderColor: generateColor(idxColor), backgroundColor: generateColor(idxColor), fill: false, tension: 0.2, pointRadius: 2 });
                idxColor++;
            });
            if (window.temporalChartRef) window.temporalChartRef.destroy();
            const theme = chartTheme();
            window.temporalChartRef = new Chart(temporalCtx, {
                type: 'line',
                data: { labels, datasets },
                options: {
                    responsive: true,
                    plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth:10, color: theme.legend } }, tooltip: { mode: 'nearest' } },
                    interaction: { mode: 'nearest', intersect: false },
                    scales: {
                        x: { title: { display: true, text: 'Hora', color: theme.title }, ticks:{ color: theme.ticks }, grid:{ color: theme.grid } },
                        y: { title: { display: true, text: 'Potencia (kW)', color: theme.title }, ticks:{ color: theme.ticks }, grid:{ color: theme.grid } }
                    }
                },
                plugins: [legendHighlightPlugin]
            });
            // share text for all tipos
            if (shareEl) {
                const parts = [];
                orderTipos.forEach(k=>{
                    if (tipoFilter && tipoKey(tipoFilter) !== k) return;
                    const idxs = tiposMap.get(k) || [];
                    let sum = 0; idxs.forEach(i=>{ sum += hourlyMatrix[i].reduce((a,b)=>a+b,0); });
                    const pct = (energiaDiariaTotal>0)? (sum/energiaDiariaTotal*100):0;
                    parts.push(`${k}: ${pct.toFixed(1)}%`);
                });
                shareEl.textContent = parts.length? ('Participación por tipo — ' + parts.join(' · ')) : '';
            }
        } else {
            // Suma por hora (actual)
            let data = hourlyTotals.slice();
            if (tipoFilter) {
                const selectedIdxs = tiposMap.get(tipoKey(tipoFilter)) || [];
                data = new Array(24).fill(0);
                selectedIdxs.forEach(i=>{ for(let h=0;h<24;h++){ data[h] += hourlyMatrix[i][h]||0; } });
                if (shareEl) {
                    let sum = 0; selectedIdxs.forEach(i=>{ sum += hourlyMatrix[i].reduce((a,b)=>a+b,0); });
                    const pct = (energiaDiariaTotal>0)? (sum/energiaDiariaTotal*100):0;
                    shareEl.textContent = `Participación de "${tipoFilter}": ${pct.toFixed(1)}% del consumo diario`;
                }
            }
            if (window.temporalChartRef) window.temporalChartRef.destroy();
            const theme = chartTheme();
            window.temporalChartRef = new Chart(temporalCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Consumo por hora (kW) — sin ordenar',
                            data: data,
                            borderColor: '#0d6efd',
                            backgroundColor: 'rgba(13,110,253,0.08)',
                            fill: true,
                            tension: 0.3,
                            pointRadius: 3,
                            pointHoverRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false, labels: { color: theme.legend } }, tooltip: { mode: 'index', intersect: false } },
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                        x: { title: { display: true, text: 'Hora', color: theme.title }, ticks:{ color: theme.ticks }, grid:{ color: theme.grid } },
                        y: { title: { display: true, text: 'Potencia (kW)', color: theme.title }, ticks:{ color: theme.ticks }, grid:{ color: theme.grid } }
                    }
                }
            });
        }
    } else {
        const labels = monthNames;
        const data = monthlyTotals.map(v=>Number(v.toFixed(2)));
        if (window.temporalChartRef) window.temporalChartRef.destroy();
        const theme = chartTheme();
        window.temporalChartRef = new Chart(temporalCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Consumo estimado (kWh/mes)',
                        data: data,
                        backgroundColor: 'rgba(13,110,253,0.9)'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false, labels: { color: theme.legend } } },
                scales: {
                    x: { title: { display: true, text: 'Mes', color: theme.title }, ticks:{ color: theme.ticks }, grid:{ color: theme.grid } },
                    y: { title: { display: true, text: 'Energía (kWh)', color: theme.title }, ticks:{ color: theme.ticks }, grid:{ color: theme.grid } }
                }
            }
        });
    }

    // ==== HEATMAP ====
    const yNames = cargas;
    if (periodo === 'dia') {
        const z = hourlyMatrix.map(row => row.map(v=>Number(v.toFixed(4))));
        const x = Array.from({length:24},(_,i)=>i);
        const th = chartTheme();
        const data = [{ z, x, y: yNames, type:'heatmap', colorscale:'Jet', hovertemplate:'Hora: %{x}<br>Carga: %{y}<br>Potencia: %{z:.2f} kW<extra></extra>' }];
        const layout = {
            title:'Mapa de calor — Potencia vs Hora (kW)',
            xaxis:{ title:{text:'Hora del día', font:{color: th.title}}, tickfont:{color: th.ticks}, gridcolor: th.grid },
            yaxis:{ title:{text:'Carga', font:{color: th.title}}, tickfont:{color: th.ticks}, gridcolor: th.grid, automargin:true },
            margin:{l:140,t:40}, paper_bgcolor: th.paper, plot_bgcolor: th.plot, font:{color: th.title}
        };
        Plotly.react('heatmapDiv', data, layout, {responsive:true});
    } else {
        // monthly heatmap: for each carga compute monthly energy vector
        const z = datosManuales.map(d => {
            const daily = safeNumber(d.Energia_kWh) || (safeNumber(d.Potencia_W)/1000 * safeNumber(d.HorasEncendido));
            return monthNames.map((_,mi)=> Number((daily * 30 * seasonal[mi]).toFixed(3)));
        });
        const th2 = chartTheme();
        const data = [{ z, x: monthNames, y: yNames, type:'heatmap', colorscale:'Jet', hovertemplate:'Mes: %{x}<br>Carga: %{y}<br>Energía: %{z:.2f} kWh<extra></extra>' }];
        const layout = {
            title:'Mapa de calor — Energía por mes (kWh)',
            xaxis:{ title:{text:'Mes', font:{color: th2.title}}, tickfont:{color: th2.ticks}, gridcolor: th2.grid },
            yaxis:{ title:{text:'Carga', font:{color: th2.title}}, tickfont:{color: th2.ticks}, gridcolor: th2.grid, automargin:true },
            margin:{l:140,t:40}, paper_bgcolor: th2.paper, plot_bgcolor: th2.plot, font:{color: th2.title}
        };
        Plotly.react('heatmapDiv', data, layout, {responsive:true});
    }

    mostrarAlerta('Métricas y gráficas actualizadas.', 'success');
}

// Generar métricas y gráficas por perfil horario (dia / noche)
export async function generarMetricasPorPerfil(datosManuales, perfil = 'dia', refs = {}, customHours) {
    // perfil: 'dia' -> horas 06..17 ; 'noche' -> 18..05
    if(!Array.isArray(datosManuales) || datosManuales.length===0){ mostrarAlerta('No hay datos para procesar.','error'); return; }
    const isDia = perfil === 'dia';
    let dayHours;
    if (perfil === 'custom' && customHours && Number.isFinite(customHours.start) && Number.isFinite(customHours.end)) {
        const start = Math.max(0, Math.min(23, Number(customHours.start)));
        const end = Math.max(0, Math.min(23, Number(customHours.end)));
        if (start === end) {
            dayHours = Array.from({length:24}, (_,h)=>h);
        } else if (start < end) {
            dayHours = Array.from({length:end-start},(_,i)=>start+i);
        } else {
            const part1 = Array.from({length:24-start},(_,i)=>start+i);
            const part2 = Array.from({length:end},(_,i)=>i);
            dayHours = part1.concat(part2);
        }
    } else {
        dayHours = isDia ? Array.from({length:12},(_,i)=>i+6) : [18,19,20,21,22,23,0,1,2,3,4,5];
    }
    // construir matriz filtrada por hora: para cada carga tomar solo horas en dayHours
    const cargas = datosManuales.map(d=>d.Carga||'Sin nombre');
    const hourlyMatrix = datosManuales.map(d=>buildHourlyRow(d));
    // compute filtered hourly totals (kW)
    const filteredHourlyTotals = new Array(dayHours.length).fill(0);
    hourlyMatrix.forEach(row=>{
        dayHours.forEach((h,i)=> filteredHourlyTotals[i] += row[h] || 0);
    });

    // LDC: sort filteredTotals descending
    const sorted = filteredHourlyTotals.slice().sort((a,b)=>b-a);
    // draw LDC into refs.ldc (canvas id or element)
    try{
        const ldcCtx = refs.ldc || document.getElementById('ldcPerfilChart');
        if(ldcCtx){
            const ctx = (ldcCtx.getContext)? ldcCtx.getContext('2d') : document.getElementById('ldcPerfilChart').getContext('2d');
            if(window._ldcPerfil) window._ldcPerfil.destroy();
            const themeP = chartTheme();
            window._ldcPerfil = new Chart(ctx, {
                type: 'line',
                data: { labels: sorted.map((_,i)=>((i+1)/sorted.length*100).toFixed(0)+'%'), datasets:[{ label:'LDC perfil', data: sorted, borderColor:'#0d6efd', backgroundColor:'rgba(13,110,253,0.08)', fill:true }] },
                options: {
                    responsive:true,
                    plugins:{ legend:{display:false, labels:{ color: themeP.legend } } },
                    scales:{
                        x:{ ticks:{ color: themeP.ticks }, grid:{ color: themeP.grid }, title:{ display:true, text:'Duración (% tiempo)', color: themeP.title } },
                        y:{ ticks:{ color: themeP.ticks }, grid:{ color: themeP.grid }, title:{ display:true, text:'Potencia (kW)', color: themeP.title } }
                    }
                }
            });
        }
    }catch(e){ console.error('Error dibujando LDC perfil',e); }

    // Temporal perfil: show values over the selected hours
    try{
        const tempEl = refs.temporal || document.getElementById('temporalPerfilChart');
        if(tempEl){
            const ctx = (tempEl.getContext)? tempEl.getContext('2d') : document.getElementById('temporalPerfilChart').getContext('2d');
            if(window._temporalPerfil) window._temporalPerfil.destroy();
            const labels = dayHours.map(h=>String(h).padStart(2,'0')+':00');
            const themeTP = chartTheme();
            window._temporalPerfil = new Chart(ctx, {
                type: 'bar',
                data: { labels, datasets:[{ label:'Potencia (kW)', data: filteredHourlyTotals, backgroundColor:'rgba(67,234,124,0.9)' }] },
                options: {
                    responsive:true,
                    plugins:{ legend:{display:false, labels:{ color: themeTP.legend } } },
                    scales:{
                        x:{ title:{display:true,text:'Hora', color: themeTP.title}, ticks:{ color: themeTP.ticks }, grid:{ color: themeTP.grid } },
                        y:{ title:{display:true,text:'Potencia (kW)', color: themeTP.title}, ticks:{ color: themeTP.ticks }, grid:{ color: themeTP.grid } }
                    }
                }
            });
        }
    }catch(e){ console.error('Error dibujando temporal perfil',e); }

    // Heatmap perfil: rows=cargas, cols=dayHours
    try{
        const heatDiv = refs.heat || document.getElementById('heatmapPerfilDiv');
        if(heatDiv){
            const z = hourlyMatrix.map(row => dayHours.map(h => Number((row[h]||0).toFixed(4))));
            const thp = chartTheme();
            const data = [{ z, x: dayHours.map(h=>String(h).padStart(2,'0')+':00'), y: cargas, type:'heatmap', colorscale:'Jet', hovertemplate:'Hora: %{x}<br>Carga: %{y}<br>Potencia: %{z:.2f} kW<extra></extra>' }];
            const layout = {
                title:`Mapa de calor — ${isDia? 'Día':'Noche'}`,
                xaxis:{ title:{text:'Hora', font:{color: thp.title}}, tickfont:{color: thp.ticks}, gridcolor: thp.grid },
                yaxis:{ title:{text:'Carga', font:{color: thp.title}}, tickfont:{color: thp.ticks}, gridcolor: thp.grid, automargin:true },
                margin:{l:140,t:40}, paper_bgcolor: thp.paper, plot_bgcolor: thp.plot, font:{color: thp.title}
            };
            Plotly.react(heatDiv, data, layout, {responsive:true});
        }
    }catch(e){ console.error('Error dibujando heatmap perfil',e); }

    mostrarAlerta('Métricas por perfil generadas.', 'success');
    // compute simple summaries
    const energiaTotal = filteredHourlyTotals.reduce((a,b)=>a+b,0);
    const nonZero = filteredHourlyTotals.filter(v=>v>0);
    const potenciaMedia = nonZero.length ? (nonZero.reduce((a,b)=>a+b,0)/nonZero.length) : 0;
    const potenciaPico = filteredHourlyTotals.length ? Math.max(...filteredHourlyTotals) : 0;
    return { energiaTotal, potenciaMedia, potenciaPico };
}