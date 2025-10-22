// metricsCalculator.js
// Módulo para cálculo de métricas energéticas por período

export function calcularMetricas(datos, periodo = 'dia') {
    const factores = {
        dia: 1,
        mes: 30,
        anio: 365
    };

    // Calcular energía total (kWh)
    let energiaTotal = datos.reduce((total, d) => total + d.Energia_kWh, 0);
    
    // Calcular potencia media (kW)
    const totalHoras = datos.reduce((total, d) => total + d.HorasEncendido, 0);
    const potenciaMedia = totalHoras > 0 ? energiaTotal / totalHoras : 0;
    
    // Calcular potencia pico (kW)
    const potenciaPico = Math.max(...datos.map(d => d.Potencia_W / 1000));

    // Ajustar según periodo
    if (periodo !== 'dia') {
        energiaTotal *= factores[periodo];
    }

    return {
        energiaTotal: energiaTotal.toFixed(2),
        potenciaMedia: potenciaMedia.toFixed(2),
        potenciaPico: potenciaPico.toFixed(2)
    };
}

export function actualizarMetricas(datos) {
    // Actualizar métricas para todos los periodos
    const periodos = ['dia', 'mes', 'anio'];
    
    periodos.forEach(periodo => {
        const metricas = calcularMetricas(datos, periodo);
        document.getElementById(`energiaTotal_${periodo}`).textContent = metricas.energiaTotal;
        document.getElementById(`potenciaMedia_${periodo}`).textContent = metricas.potenciaMedia;
        document.getElementById(`potenciaPico_${periodo}`).textContent = metricas.potenciaPico;
    });

    // Animar cambios
    document.querySelectorAll('.solar-metric strong').forEach(el => {
        el.style.transition = 'transform 0.7s cubic-bezier(.4,1.4,.6,1)';
        el.style.transform = 'scale(1.25)';
        setTimeout(() => { el.style.transform = 'scale(1)'; }, 700);
    });
}