// sampleData.js
// Lógica para generar y cargar datos de ejemplo

export function cargarDatosEjemplo(datosManuales, actualizarTablaManual, mostrarAlerta) {
    datosManuales.length = 0;
    const ejemplos = [
        { Carga: "Demo Luz", Potencia_W: 60, HoraInicio: 18, HoraFin: 24 },
        { Carga: "Demo TV", Potencia_W: 150, HoraInicio: 20, HoraFin: 23 },
        { Carga: "Demo Fridge", Potencia_W: 300, HoraInicio: 0, HoraFin: 24 }
    ];
    ejemplos.forEach(e => {
        let d = e.HoraFin - e.HoraInicio;
        if (d < 0) d += 24;
        if (e.HoraInicio === 0 && e.HoraFin === 24) d = 24;
        datosManuales.push({
            Carga: e.Carga,
            Potencia_W: e.Potencia_W,
            HoraInicio: e.HoraInicio,
            HoraFin: e.HoraFin,
            HorasEncendido: d,
            Energia_kWh: (e.Potencia_W / 1000) * d
        });
    });
    actualizarTablaManual();
    mostrarAlerta('Datos de ejemplo cargados.', 'success');
}