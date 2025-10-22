// metricsAndCharts.js
// Lógica mejorada para procesar datos y generar métricas, LDC, temporal y heatmap
import { mostrarAlerta } from './utils.js';

const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

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
                plugins: { legend: { display: false } },
                scales: {
                    x: { title: { display: true, text: 'Duración (% tiempo)' } },
                    y: { title: { display: true, text: 'Potencia (kW)' } }
                }
            }
        });
    } else {
        // LDC mensual: ordenar cargas por energía mensual estimada
        const monthlyPerCarga = datosManuales.map(d => (safeNumber(d.Energia_kWh) || (safeNumber(d.Potencia_W)/1000 * safeNumber(d.HorasEncendido))) * 30);
        const sorted = monthlyPerCarga.slice().sort((a,b)=>b-a);
        const ctx = document.getElementById('ldcChart').getContext('2d');
        if (ldcChartRef.current) ldcChartRef.current.destroy();
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
                plugins: { legend: { display: false } },
                scales: { y: { title: { display: true, text: 'kWh/mes' } } }
            }
        });
    }

    // ==== TEMPORAL ====
    // use Chart.js separate instance stored on window.temporalChartRef
    const temporalCtx = document.getElementById('temporalChart').getContext('2d');
    // check temporal mode selector (if present)
    const temporalModeEl = document.getElementById('temporalModeSelect');
    const temporalMode = temporalModeEl ? temporalModeEl.value : 'suma';
    if (periodo === 'dia') {
        const labels = Array.from({length:24},(_,i)=>i + ':00');
        if (temporalMode === 'por-carga') {
            // Top N filter
            const topNEl = document.getElementById('temporalTopNSelect');
            const topN = topNEl ? Number(topNEl.value) : 0;
            // compute metric to sort loads (use Energia_kWh or peak contribution)
            const scoreArr = datosManuales.map((d,i)=>({i, score: safeNumber(d.Energia_kWh) || Math.max(...hourlyMatrix[i])}));
            const sortedByScore = scoreArr.slice().sort((a,b)=>b.score - a.score);
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
            window.temporalChartRef = new Chart(temporalCtx, {
                type: 'line',
                data: { labels, datasets },
                options: {
                    responsive: true,
                    plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth:10 } }, tooltip: { mode: 'nearest' } },
                    interaction: { mode: 'nearest', intersect: false },
                    scales: { x: { title: { display: true, text: 'Hora' } }, y: { title: { display: true, text: 'Potencia (kW)' } } }
                },
                plugins: [legendHighlightPlugin]
            });
        } else {
            // Suma por hora (actual)
            const data = hourlyTotals.slice();
            if (window.temporalChartRef) window.temporalChartRef.destroy();
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
                    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                        x: { title: { display: true, text: 'Hora' } },
                        y: { title: { display: true, text: 'Potencia (kW)' } }
                    }
                }
            });
        }
    } else {
        const labels = monthNames;
        const data = monthlyTotals.map(v=>Number(v.toFixed(2)));
        if (window.temporalChartRef) window.temporalChartRef.destroy();
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
                plugins: { legend: { display: false } },
                scales: {
                    x: { title: { display: true, text: 'Mes' } },
                    y: { title: { display: true, text: 'Energía (kWh)' } }
                }
            }
        });
    }

    // ==== HEATMAP ====
    const yNames = cargas;
    if (periodo === 'dia') {
        const z = hourlyMatrix.map(row => row.map(v=>Number(v.toFixed(4))));
        const x = Array.from({length:24},(_,i)=>i);
        const data = [{ z, x, y: yNames, type:'heatmap', colorscale:'Jet', hovertemplate:'Hora: %{x}<br>Carga: %{y}<br>Potencia: %{z:.2f} kW<extra></extra>' }];
        const layout = { title:'Mapa de calor — Potencia vs Hora (kW)', xaxis:{title:'Hora del día'}, yaxis:{title:'Carga', automargin:true}, margin:{l:140,t:40} };
        Plotly.react('heatmapDiv', data, layout, {responsive:true});
    } else {
        // monthly heatmap: for each carga compute monthly energy vector
        const z = datosManuales.map(d => {
            const daily = safeNumber(d.Energia_kWh) || (safeNumber(d.Potencia_W)/1000 * safeNumber(d.HorasEncendido));
            return monthNames.map((_,mi)=> Number((daily * 30 * seasonal[mi]).toFixed(3)));
        });
        const data = [{ z, x: monthNames, y: yNames, type:'heatmap', colorscale:'Jet', hovertemplate:'Mes: %{x}<br>Carga: %{y}<br>Energía: %{z:.2f} kWh<extra></extra>' }];
        const layout = { title:'Mapa de calor — Energía por mes (kWh)', xaxis:{title:'Mes'}, yaxis:{title:'Carga', automargin:true}, margin:{l:140,t:40} };
        Plotly.react('heatmapDiv', data, layout, {responsive:true});
    }

    mostrarAlerta('Métricas y gráficas actualizadas.', 'success');
}

// Generar métricas y gráficas por perfil horario (dia / noche)
export async function generarMetricasPorPerfil(datosManuales, perfil = 'dia', refs = {}){
    // perfil: 'dia' -> horas 6..21 ; 'noche' -> 22..5
    if(!Array.isArray(datosManuales) || datosManuales.length===0){ mostrarAlerta('No hay datos para procesar.','error'); return; }
    const isDia = perfil === 'dia';
    const dayHours = isDia ? Array.from({length:16},(_,i)=>i+6) : [22,23,0,1,2,3,4,5];
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
            window._ldcPerfil = new Chart(ctx, {
                type: 'line',
                data: { labels: sorted.map((_,i)=>((i+1)/sorted.length*100).toFixed(0)+'%'), datasets:[{ label:'LDC perfil', data: sorted, borderColor:'#0d6efd', backgroundColor:'rgba(13,110,253,0.08)', fill:true }] },
                options: { responsive:true, plugins:{ legend:{display:false} } }
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
            window._temporalPerfil = new Chart(ctx, {
                type: 'bar',
                data: { labels, datasets:[{ label:'Potencia (kW)', data: filteredHourlyTotals, backgroundColor:'rgba(67,234,124,0.9)' }] },
                options: { responsive:true, plugins:{ legend:{display:false} }, scales:{ x:{title:{display:true,text:'Hora'}}, y:{title:{display:true,text:'Potencia (kW)'}} } }
            });
        }
    }catch(e){ console.error('Error dibujando temporal perfil',e); }

    // Heatmap perfil: rows=cargas, cols=dayHours
    try{
        const heatDiv = refs.heat || document.getElementById('heatmapPerfilDiv');
        if(heatDiv){
            const z = hourlyMatrix.map(row => dayHours.map(h => Number((row[h]||0).toFixed(4))));
            const data = [{ z, x: dayHours.map(h=>String(h).padStart(2,'0')+':00'), y: cargas, type:'heatmap', colorscale:'Jet', hovertemplate:'Hora: %{x}<br>Carga: %{y}<br>Potencia: %{z:.2f} kW<extra></extra>' }];
            const layout = { title:`Mapa de calor — ${isDia? 'Día':'Noche'}`, xaxis:{title:'Hora'}, yaxis:{title:'Carga', automargin:true}, margin:{l:140,t:40} };
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