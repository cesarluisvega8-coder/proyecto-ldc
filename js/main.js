/* main.js — versión corregida y compatible
   - mantiene compatibilidad con la tabla original (#tablaManual tbody)
   - sincroniza datosManuales con la nueva vista día/semana en #contenedorTabla
   - respeta funciones externas si ya existen (procesarDatos, graficarLDC, graficarHeatmap, graficarConsumo)
*/
// ------------------------
// Estado global
// ------------------------
let datosManuales = window.datosManuales || []; // array unificado
// cada elemento: { Carga, Potencia_W, HorasEncendido, Energia_kWh, Dia, HoraInicio, HoraFin, Duracion_h, index }

// Asegurar indices consistentes
function rebuildIndices() {
  datosManuales.forEach((d, i) => d.index = i);
}

// ------------------------
// UTIL: asegurar tabla principal
// ------------------------
function ensureMainTableExists() {
  const container = document.getElementById("tablaManual");
  if (!container) {
    console.warn("No existe #tablaManual en DOM");
    return null;
  }

  // si ya es <table> con tbody, retornarla
  if (container.tagName && container.tagName.toLowerCase() === "table") {
    // si el usuario puso directamente la table en el HTML
    return container;
  }

  // si es div (nuevo diseño), buscar inside si ya existe una table creada
  let tabla = container.querySelector("table#tablaManualTable");
  if (tabla) return tabla;

  // crear la tabla compatible (id tablaManualTable), y dejarla dentro del container
  tabla = document.createElement("table");
  tabla.id = "tablaManualTable";
  tabla.className = "table table-bordered text-center table-sm align-middle";
  tabla.innerHTML = `
    <thead class="table-light position-sticky top-0">
      <tr>
        <th>#</th>
        <th>Carga</th>
        <th>Potencia (W)</th>
        <th>Horas encendido</th>
        <th>Energía (kWh)</th>
        <th>Acción</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  // envolver en div responsivo para mantener comportamiento original
  const wrapper = document.createElement("div");
  wrapper.className = "table-responsive";
  wrapper.style.maxHeight = "300px";
  wrapper.style.overflowY = "auto";
  wrapper.appendChild(tabla);
  // limpiar y añadir
  container.innerHTML = "";
  container.appendChild(wrapper);

  return tabla;
}

// ------------------------
// RENDER: tabla clásica (la que se usaba antes)
// ------------------------
function actualizarTablaClasica() {
  const tabla = ensureMainTableExists();
  if (!tabla) return;
  const tbody = tabla.querySelector("tbody");
  tbody.innerHTML = "";

  if (!datosManuales || datosManuales.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-muted">Sin registros — agrega desde los iconos o manualmente</td></tr>`;
    return;
  }

  datosManuales.forEach((d, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td class="text-start">${escapeHtml(d.Carga || "-")}</td>
      <td>
        <input type="number" class="form-control form-control-sm text-center" value="${Number(d.Potencia_W||0)}"
               onchange="window.__editarPotenciaTabla(${idx}, this.value)">
      </td>
      <td>
        <input type="number" class="form-control form-control-sm text-center" value="${Number(d.HorasEncendido||0)}"
               onchange="window.__editarHorasTabla(${idx}, this.value)">
      </td>
      <td>${(Number(d.Energia_kWh||0)).toFixed(3)}</td>
      <td><button class="btn btn-sm btn-danger" onclick="window.__eliminarDatoTabla(${idx})">🗑️</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// ------------------------
// HELPERS globales usados por inputs (para evitar onclick en scope local)
// ------------------------
window.__editarPotenciaTabla = function(idx, valor) {
  const val = parseFloat(valor);
  if (isNaN(val) || val < 0) { alert("Introduce una potencia válida"); return; }
  datosManuales[idx].Potencia_W = val;
  // recalcular energía si hay horas
  const h = Number(datosManuales[idx].HorasEncendido||0);
  datosManuales[idx].Energia_kWh = (val/1000)*h;
  rebuildIndices();
  actualizarTablaClasica();
  actualizarVistasDiaSemana();
};

window.__editarHorasTabla = function(idx, valor) {
  const val = parseFloat(valor);
  if (isNaN(val) || val < 0 || val > 24) { alert("Horas entre 0 y 24"); return; }
  datosManuales[idx].HorasEncendido = val;
  const p = Number(datosManuales[idx].Potencia_W||0);
  datosManuales[idx].Energia_kWh = (p/1000)*val;
  rebuildIndices();
  actualizarTablaClasica();
  actualizarVistasDiaSemana();
};

window.__eliminarDatoTabla = function(idx) {
  if (!confirm("¿Eliminar esta carga?")) return;
  datosManuales.splice(idx,1);
  rebuildIndices();
  actualizarTablaClasica();
  actualizarVistasDiaSemana();
  // actualizar contadores si tienes función
  if (typeof actualizarContadores === "function") actualizarContadores();
};

// ------------------------
// ESCAPAR HTML
// ------------------------
function escapeHtml(str) {
  return String(str||"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

// ------------------------
// VISTA DÍA / SEMANA (contenedorTabla)
// ------------------------
const contenedorTabla = document.getElementById("contenedorTabla");
const diasSemana = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

function renderizarVistaDiaSemana(modo) {
  if (!contenedorTabla) return;
  contenedorTabla.innerHTML = "";
  if (modo === "dia") {
    diasSemana.forEach(dia => {
      const card = document.createElement("div");
      card.className = "card mb-3";
      const header = document.createElement("div");
      header.className = "card-header fw-semibold bg-light";
      header.textContent = dia;
      card.appendChild(header);
      const body = document.createElement("div");
      body.className = "card-body p-2";
      // tabla por día
      const tabla = document.createElement("table");
      tabla.className = "table table-bordered table-sm align-middle text-center";
      tabla.dataset.dia = dia;
      tabla.innerHTML = `
        <thead class="table-light">
          <tr>
            <th>#</th><th>Electrodoméstico</th><th>Potencia (W)</th><th>Hora inicio</th><th>Hora fin</th><th>Duración (h)</th><th>Energía (kWh)</th><th>Acción</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;
      body.appendChild(tabla);
      card.appendChild(body);
      contenedorTabla.appendChild(card);
    });
  } else {
    const card = document.createElement("div"); card.className = "card";
    const header = document.createElement("div"); header.className = "card-header fw-semibold bg-light"; header.textContent = "Semana completa";
    card.appendChild(header);
    const body = document.createElement("div"); body.className = "card-body p-2";
    const tabla = document.createElement("table");
    tabla.className = "table table-bordered table-sm align-middle text-center";
    tabla.dataset.tipo = "semana";
    tabla.innerHTML = `
      <thead class="table-light">
        <tr>
          <th>#</th><th>Día</th><th>Electrodoméstico</th><th>Potencia (W)</th><th>Hora inicio</th><th>Hora fin</th><th>Duración (h)</th><th>Energía (kWh)</th><th>Acción</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    body.appendChild(tabla);
    card.appendChild(body);
    contenedorTabla.appendChild(card);
  }
  actualizarVistasDiaSemana();
}

// Actualizar el contenido de las tablas día/semana basado en datosManuales
function actualizarVistasDiaSemana() {
  if (!contenedorTabla) return;
  // si modo dia: actualizar cada tabla
  const modo = document.querySelector('input[name="modoRegistro"]:checked')?.value || "dia";
  if (modo === "dia") {
    diasSemana.forEach(dia => {
      const tbody = contenedorTabla.querySelector(`table[data-dia="${dia}"] tbody`);
      if (!tbody) return;
      const filas = datosManuales.filter(el => (el.Dia||"Lunes") === dia);
      if (filas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-muted">Sin registros — agrega desde los iconos o manualmente</td></tr>`;
      } else {
        tbody.innerHTML = "";
        filas.forEach((d, i) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${i+1}</td>
            <td class="text-start">${escapeHtml(d.Carga)}</td>
            <td><input type="number" class="form-control form-control-sm text-center" value="${Number(d.Potencia_W||0)}" onchange="window.__editarPotenciaTabla(${d.index}, this.value)"></td>
            <td><input type="number" min="0" max="24" class="form-control form-control-sm text-center" value="${Number(d.HoraInicio||0)}" onchange="window.__editarHoraInicioVista(${d.index}, this.value)"></td>
            <td><input type="number" min="0" max="24" class="form-control form-control-sm text-center" value="${Number(d.HoraFin||0)}" onchange="window.__editarHoraFinVista(${d.index}, this.value)"></td>
            <td>${(Number(d.Duracion_h||0)).toFixed(2)}</td>
            <td>${(Number(d.Energia_kWh||0)).toFixed(3)}</td>
            <td><button class="btn btn-sm btn-danger" onclick="window.__eliminarDatoTabla(${d.index})">🗑️</button></td>
          `;
          tbody.appendChild(tr);
        });
      }
    });
  } else {
    const tbody = contenedorTabla.querySelector("table[data-tipo='semana'] tbody");
    if (!tbody) return;
    if (datosManuales.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-muted">Sin registros — agrega desde los iconos o manualmente</td></tr>`;
    } else {
      tbody.innerHTML = "";
      datosManuales.forEach((d, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${idx+1}</td>
          <td>${d.Dia||"Lunes"}</td>
          <td class="text-start">${escapeHtml(d.Carga)}</td>
          <td><input type="number" class="form-control form-control-sm text-center" value="${Number(d.Potencia_W||0)}" onchange="window.__editarPotenciaTabla(${d.index}, this.value)"></td>
          <td><input type="number" min="0" max="24" class="form-control form-control-sm text-center" value="${Number(d.HoraInicio||0)}" onchange="window.__editarHoraInicioVista(${d.index}, this.value)"></td>
          <td><input type="number" min="0" max="24" class="form-control form-control-sm text-center" value="${Number(d.HoraFin||0)}" onchange="window.__editarHoraFinVista(${d.index}, this.value)"></td>
          <td>${(Number(d.Duracion_h||0)).toFixed(2)}</td>
          <td>${(Number(d.Energia_kWh||0)).toFixed(3)}</td>
          <td><button class="btn btn-sm btn-danger" onclick="window.__eliminarDatoTabla(${d.index})">🗑️</button></td>
        `;
        tbody.appendChild(tr);
      });
    }
  }
}

// handlers para inputs en vistas
window.__editarHoraInicioVista = function(idx, val) {
  const v = parseFloat(val);
  if (isNaN(v) || v < 0 || v > 24) return;
  datosManuales[idx].HoraInicio = v;
  recalcularIdx(idx);
  actualizarTablaClasica();
  actualizarVistasDiaSemana();
};
window.__editarHoraFinVista = function(idx, val) {
  const v = parseFloat(val);
  if (isNaN(v) || v < 0 || v > 24) return;
  datosManuales[idx].HoraFin = v;
  recalcularIdx(idx);
  actualizarTablaClasica();
  actualizarVistasDiaSemana();
};
function recalcularIdx(idx) {
  const it = datosManuales[idx];
  const dur = Math.max(0, (Number(it.HoraFin||0) - Number(it.HoraInicio||0)));
  it.Duracion_h = dur;
  it.HorasEncendido = dur; // mantener compatibilidad
  it.Energia_kWh = (Number(it.Potencia_W||0)/1000)*dur;
}

// ------------------------
// Añadir manual (formulario)
// ------------------------
const addManualBtn = document.getElementById("addManualBtn");
// Solo activar este handler legacy si existen los campos horaInicio/horaFin del flujo antiguo
if (addManualBtn && document.getElementById("horaInicio") && document.getElementById("horaFin")) {
  addManualBtn.addEventListener("click", () => {
    const nombre = document.getElementById("manualCarga")?.value?.trim();
    const potencia = parseFloat(document.getElementById("manualPotencia")?.value || NaN);
    const diaSel = document.getElementById("diaSelect")?.value || "Lunes";
    // horaInicio/Fin desde selects globales si existen, si no usar 0/0
    const horaInicio = parseFloat(document.getElementById("horaInicio")?.value || 0);
    const horaFin = parseFloat(document.getElementById("horaFin")?.value || horaInicio+1);
    if (!nombre || isNaN(potencia) || isNaN(horaInicio) || isNaN(horaFin) || horaFin <= horaInicio) {
      alert("Verifica los campos: nombre, potencia y un intervalo válido (fin > inicio).");
      return;
    }
    const dur = Math.max(0, horaFin - horaInicio);
    const energia = (potencia/1000)*dur;
    const nuevo = {
      index: datosManuales.length,
      Dia: diaSel,
      Carga: nombre,
      Potencia_W: potencia,
      HoraInicio: horaInicio,
      HoraFin: horaFin,
      Duracion_h: dur,
      HorasEncendido: dur,
      Energia_kWh: energia
    };
    datosManuales.push(nuevo);
    rebuildIndices();
    actualizarTablaClasica();
    actualizarVistasDiaSemana();
    if (typeof actualizarContadores === "function") actualizarContadores();
    // limpiar inputs
    document.getElementById("manualCarga").value = "";
    document.getElementById("manualPotencia").value = "";
  });
}

// ------------------------
// Agregar desde iconos rápidos (si usas panelEsenciales / panelGranConsumo)
// ------------------------
function setupPanelElectrodomesticos(panelId, items) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  panel.innerHTML = "";
  items.forEach(it => {
    const btn = document.createElement("button");
    btn.className = "btn btn-light border rounded text-center p-2 position-relative";
    btn.style.width = "84px";
    btn.style.height = "84px";
    btn.innerHTML = `
      <div style="font-size:28px;line-height:1">${it.icono || "🔌"}</div>
      <small class="d-block mt-1">${it.nombre}</small>
      <span class="badge bg-primary" style="position:absolute;top:4px;right:6px;font-size:0.7rem" data-count="0">0</span>
    `;
    btn.addEventListener("click", (ev) => {
      // contador visual
      const badge = btn.querySelector("span[data-count]");
      let c = parseInt(badge.getAttribute("data-count")||"0");
      c++; badge.setAttribute("data-count", c); badge.textContent = c;
      // agregar la carga
      const repetidos = datosManuales.filter(d=>d.Carga?.startsWith(it.nombre)).length;
      const nombreFinal = `${it.nombre} ${repetidos+1}`;
      const nuevo = {
        index: datosManuales.length,
        Dia: "Lunes",
        Carga: nombreFinal,
        Potencia_W: it.potencia || 0,
        HoraInicio: 0,
        HoraFin: 0,
        Duracion_h: 0,
        HorasEncendido: 0,
        Energia_kWh: 0
      };
      datosManuales.push(nuevo);
      rebuildIndices();
      actualizarTablaClasica();
      actualizarVistasDiaSemana();
      if (typeof animarMasUno === "function") animarMasUno(ev);
      if (typeof actualizarContadores === "function") actualizarContadores();
    });
    panel.appendChild(btn);
  });
}

// Si quieres cargar paneles por defecto, define arrays (o usa los tuyos)
const esencialesDefault = [
  { nombre:"Luz", icono:"💡", potencia:60 },
  { nombre:"TV", icono:"📺", potencia:150 },
  { nombre:"Refrigerador", icono:"🧊", potencia:300 },
  { nombre:"PC", icono:"💻", potencia:500 },
  { nombre:"Lavadora", icono:"🧺", potencia:1500 },
  { nombre:"Ventilador", icono:"🌀", potencia:75 }
];
const granConsumoDefault = [
  { nombre:"Aire acondicionado", icono:"❄️", potencia:1000 },
  { nombre:"Horno eléctrico", icono:"🔥", potencia:2000 },
  { nombre:"Microondas", icono:"🍲", potencia:900 }
];
setupPanelElectrodomesticos("panelEsenciales", esencialesDefault);
setupPanelElectrodomesticos("panelGranConsumo", granConsumoDefault);

// ------------------------
// Cargar archivo (si ya tienes tu parser en dataProcessor.js, lo usaremos)
// ------------------------
document.getElementById("loadBtn")?.addEventListener("click", () => {
  const input = document.getElementById("fileInput");
  if (!input || !input.files || !input.files[0]) { alert("Selecciona un archivo"); return; }
  const file = input.files[0];
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) {
    Papa.parse(file, {
      header: true, skipEmptyLines: true, dynamicTyping: true,
      complete: (res) => {
        // Intentaremos mapear filas tipo cuadro de cargas o formato Fecha,Hora,Potencia_kW
        procesarDatosCargadosDesdeParser(res.data);
      }
    });
  } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: null });
      procesarDatosCargadosDesdeParser(json);
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert("Formato no soportado. Usa CSV o XLSX.");
  }
});

// función que intenta interpretar los datos cargados de forma flexible
function procesarDatosCargadosDesdeParser(rows) {
  if (!rows || !rows.length) { alert("Archivo vacío o formato inválido"); return; }

  // Caso 1: formato horario simple: columnas Fecha, Hora, Potencia_kW
  if (rows[0].hasOwnProperty("Fecha") && (rows[0].hasOwnProperty("Hora") || rows[0].hasOwnProperty("hora"))) {
    // convertimos a estructura horaria (no lo necesitamos para cuadro de cargas)
    // pero guardamos en datosManuales como registros directos (Fecha,Hora,Potencia_kW)
    // Para compatibilidad con tablas de cargas, aquí convertimos a entradas por fecha-hora
    const parsed = rows.map(r => {
      const fecha = r.Fecha || r.fecha;
      const hora = Number(r.Hora ?? r.hora);
      const potkW = Number(r.Potencia_kW ?? r.Potencia_kW ?? r.potencia ?? r.Potencia);
      return {
        index: datosManuales.length,
        Dia: fecha, // mantengo fecha en Dia para poder identificar
        Carga: `Registro ${fecha} ${hora}:00`,
        Potencia_W: potkW*1000,
        HoraInicio: hora,
        HoraFin: hora+1,
        Duracion_h: 1,
        HorasEncendido: 1,
        Energia_kWh: potkW
      };
    });
    datosManuales = datosManuales.concat(parsed);
    rebuildIndices();
    actualizarTablaClasica();
    actualizarVistasDiaSemana();
    alert(`Cargados ${parsed.length} registros horarios.`);
    return;
  }

  // Caso 2: formato cuadro de cargas (Item, Carga, Potencia (W), columnas 0..23)
  // detectemos encabezados
  const head = Object.keys(rows[0]).map(h=>String(h).trim());
  const hasCarga = head.find(h => /carga/i.test(h));
  const hasPot = head.find(h => /potencia/i.test(h));
  const hourCols = head.filter(h => /^[0-9]{1,2}$/.test(h) && Number(h)>=0 && Number(h)<=23);
  if (hasCarga && hasPot && hourCols.length>0) {
    const nuevas = [];
    rows.forEach(r => {
      const nombre = r[hasCarga];
      const potenciaW = Number(r[hasPot]) || 0;
      let horasEncendido = 0;
      let horaInicio = null;
      let horaFin = null;
      // sumar 1s y detectar primer y ultimo 1 para intervalo aproximado
      hourCols.forEach(hc => {
        const val = Number(r[hc]) || 0;
        if (val === 1) {
          horasEncendido++;
          const hnum = Number(hc);
          if (horaInicio === null) horaInicio = hnum;
          horaFin = hnum+1;
        }
      });
      const energia = (potenciaW/1000) * horasEncendido;
      if (!nombre) return;
      const obj = {
        index: datosManuales.length + nuevas.length,
        Dia: "Lunes", // por defecto; usuario podrá editar
        Carga: nombre,
        Potencia_W: potenciaW,
        HoraInicio: horaInicio ?? 0,
        HoraFin: horaFin ?? 0,
        Duracion_h: horasEncendido,
        HorasEncendido: horasEncendido,
        Energia_kWh: energia
      };
      nuevas.push(obj);
    });
    datosManuales = datosManuales.concat(nuevas);
    rebuildIndices();
    actualizarTablaClasica();
    actualizarVistasDiaSemana();
    alert(`Procesadas ${nuevas.length} cargas desde cuadro de cargas.`);
    return;
  }

  alert("No se reconoció el formato del archivo. Revisa los encabezados (Fecha,Hora,Potencia_kW) o formato cuadro de cargas (Carga, Potencia (W), horas 0..23).");
}

// ------------------------
// BOTONES auxiliares: limpiar, generar prueba, process
// ------------------------
document.getElementById("clearBtn")?.addEventListener("click", () => {
  if (!confirm("¿Limpiar todos los datos?")) return;
  datosManuales = [];
  rebuildIndices();
  actualizarTablaClasica();
  renderizarVistaDiaSemana(document.querySelector('input[name="modoRegistro"]:checked')?.value || "dia");
  // reset icon counters
  document.querySelectorAll("#panelEsenciales [data-count], #panelGranConsumo [data-count]").forEach(b => {
    b.setAttribute("data-count","0"); b.textContent = "0";
  });
  if (typeof actualizarContadores === "function") actualizarContadores();
});

document.getElementById("generateBtn")?.addEventListener("click", () => {
  // ejemplo simple: generar 6 cargas de prueba
  const demo = [
    { Carga:"Demo Luz", Potencia_W:60, HoraInicio:18, HoraFin:22, Dia:"Lunes"},
    { Carga:"Demo TV", Potencia_W:150, HoraInicio:19, HoraFin:23, Dia:"Lunes"},
    { Carga:"Demo Fridge", Potencia_W:300, HoraInicio:0, HoraFin:24, Dia:"Lunes"}
  ];
  demo.forEach(d => {
    const dur = Math.max(0, (d.HoraFin||0)-(d.HoraInicio||0));
    datosManuales.push({
      index: datosManuales.length,
      Dia: d.Dia||"Lunes",
      Carga: d.Carga,
      Potencia_W: d.Potencia_W,
      HoraInicio: d.HoraInicio,
      HoraFin: d.HoraFin,
      Duracion_h: dur,
      HorasEncendido: dur,
      Energia_kWh: (d.Potencia_W/1000)*dur
    });
  });
  rebuildIndices();
  actualizarTablaClasica();
  actualizarVistasDiaSemana();
  alert("Datos de prueba generados.");
});

// processBtn → llama a funciones de procesamiento/visualización (si existen)
document.getElementById("processBtn")?.addEventListener("click", () => {
  if (!datosManuales || datosManuales.length === 0) { alert("No hay datos para procesar."); return; }
  // Si tienes una función procesarYMostrar definida en tu archivo original, úsala
  if (typeof procesarYMostrar === "function") {
    procesarYMostrar(datosManuales);
    return;
  }
  // si tienes procesarDatos en dataProcessor.js, úsala para métricas
  if (typeof procesarDatos === "function") {
    try {
      const res = procesarDatos(datosManuales);
      if (res && typeof graficarLDC === "function") graficarLDC(res);
      if (typeof graficarHeatmap === "function") graficarHeatmap(datosManuales);
      if (typeof graficarConsumo === "function") graficarConsumo(datosManuales);
      // actualizar métricas en DOM si existen IDs
      if (res) {
        document.getElementById("energiaTotal") && (document.getElementById("energiaTotal").textContent = (res.energiaTotal||0).toFixed(2));
        document.getElementById("potenciaMedia") && (document.getElementById("potenciaMedia").textContent = (res.potenciaMedia||0).toFixed(2));
        document.getElementById("potenciaPico") && (document.getElementById("potenciaPico").textContent = (res.potenciaPico||0).toFixed(2));
      }
    } catch(err) {
      console.error(err);
      alert("Error procesando datos: " + err.message);
    }
    return;
  }
  alert("No se encontró la función de procesamiento (procesarYMostrar o procesarDatos). Revisa dataProcessor.js");
});

// ------------------------
// On load: inicializar vistas
// ------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Asegurar tabla clásica
  ensureMainTableExists();
  actualizarTablaClasica();
  // Renderizar día/semana según selector actual
  const modo = document.querySelector('input[name="modoRegistro"]:checked')?.value || "dia";
  renderizarVistaDiaSemana(modo);
  // si no hay paneles (porque se cargó otro HTML), no pasa nada
});

// ------------------------
// Evita errores si alguna función global esperaba otros nombres
// ------------------------
console.log("main.js cargado — tabla asegurada y lógica día/semana integrada.");

// ============================
// INGRESO MANUAL CON INTERVALOS
// ============================

// Cargar opciones de hora (0–23)
const selectInicio = document.getElementById("manualInicio");
const selectFin = document.getElementById("manualFin");
if (selectInicio && selectFin) {
  for (let h = 0; h <= 23; h++) {
    const label = h.toString().padStart(2, "0") + ":00";
    selectInicio.add(new Option(label, h));
    selectFin.add(new Option(label, h));
  }
}

// Actualizar duración automáticamente
function actualizarDuracionManual() {
  const inicio = parseInt(selectInicio.value);
  const fin = parseInt(selectFin.value);
  const totalInput = document.getElementById("manualTotal");
  if (!isNaN(inicio) && !isNaN(fin)) {
    let duracion = fin - inicio;
    if (duracion < 0) duracion += 24; // caso de paso por medianoche
    totalInput.value = duracion;
  } else {
    totalInput.value = "";
  }
}

selectInicio?.addEventListener("change", actualizarDuracionManual);
selectFin?.addEventListener("change", actualizarDuracionManual);

// Al presionar “Agregar” (solo si existen los campos manualInicio/manualFin/manualTotal del flujo antiguo)
if (document.getElementById("manualInicio") && document.getElementById("manualFin") && document.getElementById("manualTotal")) {
document.getElementById("addManualBtn")?.addEventListener("click", () => {
  const carga = document.getElementById("manualCarga").value.trim();
  const potencia = parseFloat(document.getElementById("manualPotencia").value);
  const horaInicio = parseInt(document.getElementById("manualInicio").value);
  const horaFin = parseInt(document.getElementById("manualFin").value);
  const duracion = parseFloat(document.getElementById("manualTotal").value);

  if (!carga || isNaN(potencia) || isNaN(horaInicio) || isNaN(horaFin) || isNaN(duracion)) {
    alert("⚠️ Completa todos los campos antes de agregar.");
    return;
  }

  const energia = (potencia * duracion) / 1000;
  const tabla = document.querySelector("#tablaManual tbody");
  const fila = document.createElement("tr");

  const index = tabla.rows.length + 1;
  fila.innerHTML = `
    <td>${index}</td>
    <td contenteditable="true">${carga}</td>
    <td contenteditable="true">${potencia}</td>
    <td>${horaInicio}:00</td>
    <td>${horaFin}:00</td>
    <td>${duracion}</td>
    <td>${energia.toFixed(2)}</td>
    <td><button class="btn btn-sm btn-danger eliminarFila">🗑</button></td>
  `;

  tabla.appendChild(fila);

  fila.querySelector(".eliminarFila").addEventListener("click", () => fila.remove());

  // limpiar inputs
  document.getElementById("manualCarga").value = "";
  document.getElementById("manualPotencia").value = "";
  selectInicio.value = "";
  selectFin.value = "";
  document.getElementById("manualTotal").value = "";
});
}




//MI CODIGO


  if(!window.datosManuales) window.datosManuales = [];

  // Si no existe actualizarTablaManual, definimos una mínima
  if(typeof window.actualizarTablaManual !== "function"){
    window.actualizarTablaManual = function(){
      const tbody=document.querySelector("#tablaManual tbody");
      if(!tbody) return;
      tbody.innerHTML="";
      if(window.datosManuales.length===0){
        tbody.innerHTML="<tr><td colspan='8' class='text-muted'>Sin registros</td></tr>";
        return;
      }
      window.datosManuales.forEach((d,i)=>{
        const tr=document.createElement("tr");
        tr.innerHTML=`
          <td>${i+1}</td>
          <td>${d.Carga}</td>
          <td>${d.Potencia_W}</td>
          <td>${d.HoraInicio}</td>
          <td>${d.HoraFin}</td>
          <td>${d.HorasEncendido.toFixed(2)}</td>
          <td>${d.Energia_kWh.toFixed(2)}</td>
          <td><button class="btn btn-danger btn-sm" onclick="window.datosManuales.splice(${i},1);window.actualizarTablaManual()">🗑</button></td>`;
        tbody.appendChild(tr);
      });
    };
  }

  // Llenar horas
  const inicioSel=document.getElementById("inicioElectro");
  const finSel=document.getElementById("finElectro");
  for(let h=0;h<=24;h++){
    const label=h.toString().padStart(2,"0")+":00";
    inicioSel?.append(new Option(label,h));
    finSel?.append(new Option(label,h));
  }

  // Selección de tarjetas
  const detalle=document.getElementById("detalleElectrodomestico");
  let seleccionado=null;
  document.querySelectorAll(".appliance-card").forEach(card=>{
    card.addEventListener("click",()=>{
      document.querySelectorAll(".appliance-card").forEach(c=>c.classList.remove("selected"));
      card.classList.add("selected");
      seleccionado={nombre:card.dataset.nombre,potencia:parseFloat(card.dataset.potencia)};
      document.getElementById("nombreElectro").value=seleccionado.nombre;
      document.getElementById("potenciaElectro").value=seleccionado.potencia;
      detalle.classList.remove("d-none");
      if(typeof mostrarAlerta==="function") mostrarAlerta(`Configurando ${seleccionado.nombre}`,"info");
    });
  });

  // Agregar a tabla (legacy) — desactivar si mainApp gestiona el quick-add
  if (!(window.USE_MAINAPP_QUICKADD === true)) document.getElementById("agregarElectroBtn").addEventListener("click",()=>{
    if(!seleccionado){mostrarAlerta("Selecciona un electrodoméstico.","error");return;}
    const nombre=document.getElementById("nombreElectro").value.trim();
    const potencia=parseFloat(document.getElementById("potenciaElectro").value);
    const cantidad=parseInt(document.getElementById("cantidadElectro").value);
    const hi=parseFloat(document.getElementById("inicioElectro").value);
    const hf=parseFloat(document.getElementById("finElectro").value);
    if(!nombre||isNaN(potencia)||isNaN(cantidad)||isNaN(hi)||isNaN(hf)){
      mostrarAlerta("Completa todos los campos.","error");return;
    }
    let dur=hf-hi;if(dur<0)dur+=24;
    const energia=(potencia*dur)/1000;

    for(let i=1;i<=cantidad;i++){
      window.datosManuales.push({
        Carga:cantidad>1?`${nombre} ${i}`:nombre,
        Potencia_W:potencia,
        HoraInicio:hi,
        HoraFin:hf,
        HorasEncendido:dur,
        Energia_kWh:energia
      });
    }

        rebuildIndices();
    actualizarTablaClasica();
    actualizarVistasDiaSemana();
    window.actualizarTablaManual();
   

    // Efecto de flash visual
    const filas=document.querySelectorAll("#tablaManual tbody tr");
    for(let i=filas.length-cantidad;i<filas.length;i++){
      filas[i]?.classList.add("row-flash");
      setTimeout(()=>filas[i]?.classList.remove("row-flash"),1500);
    }

    mostrarAlerta(`${cantidad} ${nombre}${cantidad>1?"s":""} agregado${cantidad>1?"s":""}.`,"success");
    document.querySelectorAll(".appliance-card").forEach(c=>c.classList.remove("selected"));
    detalle.classList.add("d-none");
  });

