// sampleData.js
// Lógica para generar y cargar datos de ejemplo

export function cargarDatosEjemplo(datosManuales, actualizarTablaManual, mostrarAlerta) {
    datosManuales.length = 0;
    // 40 cargas variadas, con diferentes horarios y potencias
    const ejemplos = [
        { Carga: "Luz Sala", Potencia_W: 60, Rangos: [{inicio:6, fin:7},{inicio:18, fin:23}] },
        { Carga: "Luz Cocina", Potencia_W: 40, Rangos: [{inicio:5, fin:7},{inicio:19, fin:22}] },
        { Carga: "Luz Habitación 1", Potencia_W: 30, Rangos: [{inicio:6, fin:7},{inicio:20, fin:23}] },
        { Carga: "Luz Habitación 2", Potencia_W: 30, Rangos: [{inicio:6, fin:7},{inicio:21, fin:24}] },
        { Carga: "Refrigerador", Potencia_W: 300, Rangos: [{inicio:0, fin:24}] },
        { Carga: "TV Sala", Potencia_W: 120, Rangos: [{inicio:19, fin:23}] },
        { Carga: "TV Habitación", Potencia_W: 80, Rangos: [{inicio:20, fin:23}] },
        { Carga: "Ventilador Sala", Potencia_W: 90, Rangos: [{inicio:8, fin:10},{inicio:15, fin:17},{inicio:21, fin:23}] },
        { Carga: "Ventilador Habitación", Potencia_W: 70, Rangos: [{inicio:2, fin:6},{inicio:14, fin:16}] },
        { Carga: "Computador Escritorio", Potencia_W: 200, Rangos: [{inicio:8, fin:12},{inicio:14, fin:18}] },
        { Carga: "Laptop", Potencia_W: 60, Rangos: [{inicio:9, fin:12},{inicio:20, fin:22}] },
        { Carga: "Router", Potencia_W: 15, Rangos: [{inicio:0, fin:24}] },
        { Carga: "Microondas", Potencia_W: 1200, Rangos: [{inicio:7, fin:8},{inicio:13, fin:14},{inicio:19, fin:20}] },
        { Carga: "Horno Eléctrico", Potencia_W: 1800, Rangos: [{inicio:12, fin:13}] },
        { Carga: "Cafetera", Potencia_W: 900, Rangos: [{inicio:6, fin:7}] },
        { Carga: "Lavadora", Potencia_W: 500, Rangos: [{inicio:10, fin:12}] },
        { Carga: "Secadora", Potencia_W: 1500, Rangos: [{inicio:12, fin:13}] },
        { Carga: "Plancha", Potencia_W: 1000, Rangos: [{inicio:8, fin:9},{inicio:20, fin:21}] },
        { Carga: "Aire Acondicionado", Potencia_W: 1200, Rangos: [{inicio:14, fin:17},{inicio:22, fin:24}] },
        { Carga: "Calentador Agua", Potencia_W: 1500, Rangos: [{inicio:5, fin:6},{inicio:21, fin:22}] },
        { Carga: "Bomba Agua", Potencia_W: 800, Rangos: [{inicio:6, fin:7},{inicio:18, fin:19}] },
        { Carga: "Licuadora", Potencia_W: 400, Rangos: [{inicio:7, fin:8},{inicio:13, fin:14}] },
        { Carga: "Tostadora", Potencia_W: 800, Rangos: [{inicio:6, fin:7}] },
        { Carga: "Impresora", Potencia_W: 50, Rangos: [{inicio:10, fin:11}] },
        { Carga: "Cargador Celular 1", Potencia_W: 10, Rangos: [{inicio:22, fin:24}] },
        { Carga: "Cargador Celular 2", Potencia_W: 10, Rangos: [{inicio:21, fin:23}] },
        { Carga: "Cargador Tablet", Potencia_W: 15, Rangos: [{inicio:20, fin:22}] },
        { Carga: "Extractor Cocina", Potencia_W: 100, Rangos: [{inicio:12, fin:13},{inicio:19, fin:20}] },
        { Carga: "Despertador", Potencia_W: 5, Rangos: [{inicio:0, fin:24}] },
        { Carga: "Luz Baño", Potencia_W: 20, Rangos: [{inicio:6, fin:7},{inicio:21, fin:22}] },
        { Carga: "Luz Patio", Potencia_W: 25, Rangos: [{inicio:18, fin:23}] },
        { Carga: "Luz Garaje", Potencia_W: 30, Rangos: [{inicio:19, fin:23}] },
        { Carga: "Luz Pasillo", Potencia_W: 15, Rangos: [{inicio:6, fin:7},{inicio:19, fin:22}] },
        { Carga: "Luz Escalera", Potencia_W: 10, Rangos: [{inicio:6, fin:7},{inicio:20, fin:22}] },
        { Carga: "Ventilador Oficina", Potencia_W: 60, Rangos: [{inicio:9, fin:12},{inicio:15, fin:17}] },
        { Carga: "Monitor", Potencia_W: 40, Rangos: [{inicio:8, fin:12},{inicio:14, fin:18}] },
        { Carga: "Consola Juegos", Potencia_W: 120, Rangos: [{inicio:17, fin:19}] },
        { Carga: "Bocinas", Potencia_W: 30, Rangos: [{inicio:18, fin:22}] },
        { Carga: "Lámpara Escritorio", Potencia_W: 12, Rangos: [{inicio:20, fin:23}] },
        { Carga: "Luz Balcón", Potencia_W: 18, Rangos: [{inicio:19, fin:23}] },
        { Carga: "Luz Sótano", Potencia_W: 20, Rangos: [{inicio:19, fin:22}] },
        { Carga: "Luz Terraza", Potencia_W: 25, Rangos: [{inicio:18, fin:23}] }
    ];
    ejemplos.forEach(e => {
        // Calcular horas totales y energía
        let totalHoras = 0;
        e.Rangos.forEach(r => {
            let h = r.fin - r.inicio;
            if (h < 0) h += 24;
            totalHoras += h;
        });
        datosManuales.push({
            Carga: e.Carga,
            Potencia_W: e.Potencia_W,
            Rangos: e.Rangos,
            HorasEncendido: totalHoras,
            Energia_kWh: (e.Potencia_W / 1000) * totalHoras
        });
    });
    actualizarTablaManual();
    mostrarAlerta('Datos de ejemplo cargados.', 'success');
}