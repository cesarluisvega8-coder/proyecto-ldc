// metricsAndCharts.js
// Lógica para procesar datos y generar métricas, LDC y heatmap
import { mostrarAlerta } from './utils.js';

export function procesarYGraficar(datosManuales, ldcChartRef) {
    if (datosManuales.length === 0) {
        mostrarAlerta('No hay datos para procesar.', 'error');
        return;
    }
    // compute hourly matrix: rows = loads, cols = 0..23 (1 if on)
    const matrix = datosManuales.map(d => {
        const row = new Array(24).fill(0);
        const hi = Number(d.HoraInicio || 0);
        const hf = Number(d.HoraFin || 0);
        if (typeof d.HoraInicio === 'number' && typeof d.HoraFin === 'number' && (d.HoraInicio !== 0 || d.HoraFin !== 0)) {
            if (d.HoraInicio === 0 && d.HoraFin === 24) {
                for (let h = 0; h < 24; h++) row[h] = 1;
            } else if (hi <= hf) {
                for (let h = hi; h < hf; h++) row[h % 24] = 1;
            } else {
                for (let h = hi; h < 24; h++) row[h] = 1;
                for (let h = 0; h < hf; h++) row[h] = 1;
            }
        } else {
            const he = Math.round(Number(d.HorasEncendido || 0));
            for (let h = 0; h < he && h < 24; h++) row[h] = 1;
        }
        return row;
    });
    // hourlyTotals (kW)
    const hourlyTotals = new Array(24).fill(0);
    matrix.forEach((row, idx) => {
        const potKw = (Number(datosManuales[idx].Potencia_W || 0) / 1000);
        for (let h = 0; h < 24; h++) {
            if (row[h]) hourlyTotals[h] += potKw;
        }
    });
    // energy total (kWh)
    const energiaTotal = hourlyTotals.reduce((a, b) => a + b, 0);
    const potencias_kW = datosManuales.map(d => (Number(d.Potencia_W || 0) / 1000));
    const potenciaMedia = potencias_kW.length ? (potencias_kW.reduce((a, b) => a + b, 0) / potencias_kW.length) : 0;
    const potenciaPico = potencias_kW.length ? Math.max(...potencias_kW) : 0;
    document.getElementById('energiaTotal').textContent = energiaTotal.toFixed(2);
    document.getElementById('potenciaMedia').textContent = potenciaMedia.toFixed(2);
    document.getElementById('potenciaPico').textContent = potenciaPico.toFixed(2);
    // LDC: sort hourlyTotals descending
    const potOrdenadas = hourlyTotals.slice().sort((a, b) => b - a);
    const porcentaje = potOrdenadas.map((_, i) => (i / potOrdenadas.length) * 100);
    // Chart LDC (Chart.js)
    const ctx = document.getElementById('ldcChart').getContext('2d');
    if (ldcChartRef.current) ldcChartRef.current.destroy();
    ldcChartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
            labels: porcentaje.map(v => v.toFixed(2)),
            datasets: [{
                label: 'Potencia (kW) — LDC',
                data: potOrdenadas,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13,110,253,0.08)',
                fill: true,
                tension: 0.2,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Duración (% del tiempo)' } },
                y: { title: { display: true, text: 'Potencia (kW)' } }
            },
            plugins: { legend: { display: false } }
        }
    });
    // Heatmap
    const z = matrix.map((row, idx) => row.map(v => v ? (Number(datosManuales[idx].Potencia_W || 0) / 1000) : 0));
    const xHours = Array.from({ length: 24 }, (_, i) => i);
    const yNames = datosManuales.map(d => d.Carga);
    Plotly.newPlot('heatmapDiv', [{
        z: z,
        x: xHours,
        y: yNames,
        type: 'heatmap',
        colorscale: 'YlOrRd',
        hovertemplate: '%{y} - %{x}:00<br>%{z:.3f} kW<extra></extra>'
    }], {
        title: 'Mapa de calor — Potencia por hora (kW)',
        xaxis: { title: 'Hora' },
        yaxis: { automargin: true }
    }, { responsive: true });
    mostrarAlerta('Métricas y gráficas generadas.', 'success');
}