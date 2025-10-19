// Procesamiento de datos
function procesarDatos(datos) {
  const potencias = datos
    .map(d => parseFloat(parseFloat(d.Potencia_kW).toFixed(2)))
    .filter(v => !isNaN(v));

  if (potencias.length === 0) return null;

  const energiaTotal = potencias.reduce((a, b) => a + b, 0);
  const potenciaMedia = energiaTotal / potencias.length;
  const potenciaPico = Math.max(...potencias);

  // Orden descendente
  const potenciasOrdenadas = [...potencias].sort((a, b) => b - a);

  // Eje X como porcentaje de tiempo
  const porcentaje = potenciasOrdenadas.map((_, i) =>
    ((i + 1) / potenciasOrdenadas.length) * 100
  );

  return {
    energiaTotal,
    potenciaMedia,
    potenciaPico,
    potenciasOrdenadas,
    porcentaje
  };
}

// Genera datos sintéticos de prueba
function generarDatosPrueba() {
  const datos = [];
  const fechaBase = new Date();

  for (let d = 0; d < 7; d++) { // 7 días
    const fecha = new Date(fechaBase);
    fecha.setDate(fecha.getDate() + d);

    for (let h = 0; h < 24; h++) {
      const base = 8 + 5 * Math.sin((h / 24) * 2 * Math.PI); // patrón diario
      const ruido = Math.random() * 2 - 1;
      datos.push({
        Dia: fecha.toISOString().split("T")[0],
        Hora: h,
        Potencia_kW: (base + ruido).toFixed(2)
      });
    }
  }
  return datos;
}
