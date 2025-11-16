const usuariosPorCentro = {
  "LAVANDERIA": { usuario: "BETSABE", aprueba: "BETSABE" },
  "LOGISTICA": { usuario: "JUAN", aprueba: "JUAN" },
  "UDP": { usuario: "MARIA", aprueba: "MARIA" },
  "COMERCIAL": { usuario: "PEDRO", aprueba: "PEDRO" },
  "ESTAMPADO": { usuario: "LUISA", aprueba: "LUISA" }
};

//cambio

let kilometraje_inicio = 7500;
let kilometraje_actual = kilometraje_inicio;

const rutasPredefinidas = {
  "TEXTIMAX|LANDEO": {
    "IDA": { peaje: 0, ruta: 18, km: 8 },
    "IDA Y VUELTA": { peaje: 6, ruta: 36, km: 16 }
  }
};

const lugaresComunes = [
  "TEXTIMAX",
  "LANDEO",
  "SANTA ANITA",
  "SURCO",
  "MIRAFLORES",
  "CHORRILLOS",
  "SAN ISIDRO",
  "LA MOLINA",
  "SAN MIGUEL"
];

const centros = Object.keys(usuariosPorCentro);
const contenedorTabs = document.getElementById("myTabContent");

function getTarifa(origen, destino, tipo) {
  const ori = (origen || "").trim().toUpperCase();
  const des = (destino || "").trim().toUpperCase();

  const key1 = `${ori}|${des}`;
  const key2 = `${des}|${ori}`;

  const tabla = rutasPredefinidas[key1] || rutasPredefinidas[key2];
  if (!tabla) return null;

  // Si no hay exactamente ese tipo, intenta con "IDA" como fallback
  const t = tabla[tipo] || tabla["IDA"];
  if (!t) return null;

  return { peaje: Number(t.peaje || 0), ruta: Number(t.ruta || 0), km: Number(t.km || 0) };
}

function incrementarVale(str) {
  if (!str) return "";
  const m = str.trim().match(/^(.*?)(\d+)(\s*)$/);
  if (!m) return str;
  const prefix = m[1], digits = m[2], suffixSpace = m[3] || "";
  const next = (parseInt(digits, 10) + 1).toString().padStart(digits.length, "0");
  return prefix + next + suffixSpace;
}

// =======================================
// CREAR TABS Y FORMULARIOS
// =======================================
centros.forEach((centro, idx) => {
  const activo = idx === 0 ? "show active" : "";
  contenedorTabs.innerHTML += `
    <div class="tab-pane fade ${activo}" id="${centro}">
      <h4>${centro}</h4>
      <form class="formulario card p-3 mb-3 shadow-sm" data-centro="${centro}">
        <div class="row g-3">
          <div class="col-md-2">
            <label class="form-label">N° Vale</label>
            <input type="text" class="form-control" name="n_vale" required>
          </div>
          <div class="col-md-2">
            <label class="form-label">Fecha Servicio</label>
            <input type="date" class="form-control" name="fecha_servicio" required>
          </div>
          <div class="col-md-2">
            <label class="form-label">Hora Inicio</label>
            <input type="time" class="form-control" name="hora_inicio">
          </div>
          <div class="col-md-2">
            <label class="form-label">Hora Final</label>
            <input type="time" class="form-control" name="hora_final">
          </div>
          <div class="col-md-2">
            <label class="form-label">T. Espera</label>
            <input type="text" class="form-control" name="tiempo_espera" placeholder="Ej. 30 min">
          </div>
          <div class="col-md-2">
            <label class="form-label">T. Total</label>
            <input type="text" class="form-control" name="tiempo_total_ruta" placeholder="Ej. 1 H 20 min">
          </div>
          <div class="col-md-2">
            <label class="form-label">Lugar Origen</label>
            <input list="lugaresComunes" type="text" class="form-control origen" name="origen" placeholder="Ej. TEXTIMAX">
          </div>
          <div class="col-md-2">
            <label class="form-label">Lugar Destino</label>
            <input list="lugaresComunes" type="text" class="form-control destino" name="destino" placeholder="Ej. LANDEO">
          </div>
          <div class="col-md-2">
            <label class="form-label">Tipo</label>
            <select class="form-select" name="tipo" required>
              <option value="">Seleccione</option>
              <option value="IDA">IDA</option>
              <option value="IDA Y VUELTA">IDA Y VUELTA</option>
              <option value="VUELTA">VUELTA</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label">Peaje (S/.)</label>
            <input type="number" step="0.01" class="form-control" name="peaje">
          </div>
          <div class="col-md-2">
            <label class="form-label">Ruta (S/.)</label>
            <input type="number" step="0.01" class="form-control" name="ruta">
          </div>
          <div class="col-md-2">
            <label class="form-label">Kilometraje (km)</label>
            <input type="number" step="0.1" class="form-control" name="km"> 
          </div>
        </div>
        <div class="mt-3 d-flex justify-content-end align-items-center gap-3">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" name="registrar_vuelta" id="registrar_vuelta_${centro}">
            <label class="form-check-label" for="registrar_vuelta_${centro}">
              Registrar también vuelta
            </label>
          </div>
          <button type="submit" class="btn btn-success">Agregar</button>
        </div>
      </form>

      <!-- Tabla -->
      <table class="table table-bordered table-striped mt-3 tabla" data-centro="${centro}">
        <thead class="table-dark">
          <tr>
            <th>N° Vale</th>
            <th>Fecha</th>
            <th>Usuario</th>
            <th>Aprueba</th>
            <th>Hora Inicio</th>
            <th>T. Espera</th>
            <th>T. Total</th>
            <th>Hora Final</th>
            <th>Origen</th>
            <th>Destino</th>
            <th>Tipo</th>
            <th>Peaje</th>
            <th>Ruta</th>
            <th>Total</th>
            <th>Km</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;
});

// =======================================
// CÁLCULOS AUTOMÁTICOS DE TIEMPO
// =======================================

function calcularHoraFinal(horaInicio, tiempoTotal) {
  if (!horaInicio || !tiempoTotal) return "";

  const [hora, minuto] = horaInicio.split(":").map(Number);
  const tiempo = tiempoTotal.match(/(\d+)\s*H/i);
  const minutos = tiempoTotal.match(/(\d+)\s*MIN/i);

  const totalMin = (tiempo ? parseInt(tiempo[1]) * 60 : 0) + (minutos ? parseInt(minutos[1]) : 0);
  const fecha = new Date();
  fecha.setHours(hora);
  fecha.setMinutes(minuto + totalMin);

  const hFinal = fecha.getHours().toString().padStart(2, "0");
  const mFinal = fecha.getMinutes().toString().padStart(2, "0");
  return `${hFinal}:${mFinal}`;
}

function calcularTiempoTotal(horaInicio, horaFinal) {
  if (!horaInicio || !horaFinal) return "";

  const [h1, m1] = horaInicio.split(":").map(Number);
  const [h2, m2] = horaFinal.split(":").map(Number);
  let diffMin = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (diffMin < 0) diffMin += 24 * 60;

  const horas = Math.floor(diffMin / 60);
  const minutos = diffMin % 60;
  if (horas === 0) return `${minutos} min`;
  if (minutos === 0) return `${horas} H`;
  return `${horas} H ${minutos} min`;
}

document.addEventListener("change", (e) => {
  const form = e.target.closest(".formulario");
  if (!form) return;

  const origen  = form.querySelector("[name='origen']")?.value || "";
  const destino = form.querySelector("[name='destino']")?.value || "";
  const tipo    = form.querySelector("[name='tipo']")?.value || "";

  const tarifa = getTarifa(origen, destino, tipo);
  if (tarifa) {
    form.querySelector("[name='peaje']").value = tarifa.peaje;
    form.querySelector("[name='ruta']").value  = tarifa.ruta;
    form.querySelector("[name='km']").value    = tarifa.km;
    // (El km se usa en memoria / Excel, no se muestra en el formulario)
  }
});

// Escuchar cambios en los campos de tiempo
document.addEventListener("change", (e) => {
  const form = e.target.closest(".formulario");
  if (!form) return;

  const horaInicio = form.querySelector("[name='hora_inicio']").value;
  const horaFinal = form.querySelector("[name='hora_final']").value;
  const tiempoTotal = form.querySelector("[name='tiempo_total_ruta']").value;

  // Si se llenan hora inicio y total → calcular hora final
  if (horaInicio && tiempoTotal && !horaFinal) {
    form.querySelector("[name='hora_final']").value = calcularHoraFinal(horaInicio, tiempoTotal);
  }

  // Si se llenan hora inicio y final → calcular tiempo total
  if (horaInicio && horaFinal) {
    form.querySelector("[name='tiempo_total_ruta']").value = calcularTiempoTotal(horaInicio, horaFinal);
  }
});

// =======================================
// MANEJO DE FORMULARIOS Y EXPORTACIÓN
// =======================================

document.addEventListener("submit", (e) => {
  if (!e.target.matches(".formulario")) return;
  e.preventDefault();

  const form = e.target;
  const centro = form.dataset.centro;
  const { usuario, aprueba } = usuariosPorCentro[centro];

  const datos = new FormData(form);

  const valeBase = (datos.get("n_vale") || "").toUpperCase();
  const origen   = (datos.get("origen")  || "").trim().toUpperCase();
  const destino  = (datos.get("destino") || "").trim().toUpperCase();
  const tipoSel  = datos.get("tipo"); // "IDA" o "IDA Y VUELTA"
  const registrarVuelta = form.querySelector("[name='registrar_vuelta']")?.checked === true;

  // ⬅️ Mantenemos la declaración de kmManual aquí, al inicio
  const kmManual = Number(datos.get("km") || 0);
  // Intentamos obtener tarifa desde la tabla (en cualquiera de los sentidos).
  // Si no hay, usamos lo que el usuario escribió.
  let tarifa = getTarifa(origen, destino, tipoSel);
  let peaje = tarifa ? tarifa.peaje : Number(datos.get("peaje") || 0);
  let ruta  = tarifa ? tarifa.ruta  : Number(datos.get("ruta")  || 0);
  let km    = tarifa ? tarifa.km    : kmManual;

  // Si el tipo es "IDA Y VUELTA" y además se quiere registrar la vuelta automática:
  // dividimos peaje/ruta/km entre los dos tramos para no duplicar costos.
  let peajeIda = peaje, rutaIda = ruta, kmIda = km;
  let peajeVta = peaje, rutaVta = ruta, kmVta = km;
/*
  if (registrarVuelta && tipoSel === "IDA Y VUELTA") {
    peajeIda = peaje / 2; rutaIda = ruta / 2; kmIda = km / 2;
    peajeVta = peaje / 2; rutaVta = ruta / 2; kmVta = km / 2;
  }
*/
  const totalIda = peajeIda + rutaIda;
  const totalVta = peajeVta + rutaVta;

  // Inserta fila y acumula km (usa tu variable global kilometraje_actual)
  const insertarFila = (vale, ori, des, tipoViaje, p, r, t, kmVal) => {
    kilometraje_actual += (kmVal || 0);
    const fila = document.createElement("tr");
    fila.setAttribute("data-km", kilometraje_actual.toFixed(1));

    fila.innerHTML = `
      <td>${vale}</td>
      <td>${datos.get("fecha_servicio") || ""}</td>
      <td>${usuario}</td>
      <td>${aprueba}</td>
      <td>${datos.get("hora_inicio") || ""}</td>
      <td>${datos.get("tiempo_espera") || ""}</td>
      <td>${datos.get("tiempo_total_ruta") || ""}</td>
      <td>${datos.get("hora_final") || ""}</td>
      <td>${ori}</td>
      <td>${des}</td>
      <td>${tipoViaje}</td>
      <td>S/ ${Number(p||0).toFixed(2)}</td>
      <td>S/ ${Number(r||0).toFixed(2)}</td>
      <td>S/ ${Number(t||0).toFixed(2)}</td> <td>${Number(kmVal || 0).toFixed(1)}</td> `;
    document.querySelector(`.tabla[data-centro="${centro}"] tbody`).appendChild(fila);
  };

  // Caso A: SIN check de vuelta
  if (!registrarVuelta) {
    // Si el usuario eligió "IDA Y VUELTA", queda como tal (una sola fila con totales)
    insertarFila(valeBase, origen, destino, tipoSel, peaje, ruta, peaje + ruta, km);
  } else {
    // Caso B: CON check de vuelta -> insertamos 2 filas
    // 1) IDA (si seleccionó "IDA Y VUELTA" la etiquetamos como "IDA")
    const tipoIda = (tipoSel === "IDA Y VUELTA") ? "IDA" : "IDA";
    insertarFila(valeBase, origen, destino, tipoIda, peajeIda, rutaIda, totalIda, kmIda);

    // 2) VUELTA (vale + 1)
    const valeVuelta = incrementarVale(valeBase);
    insertarFila(valeVuelta, destino, origen, "VUELTA", peajeVta, rutaVta, totalVta, kmVta);
  }

  form.reset();
});

// Crear lista de sugerencias <datalist>
const datalist = document.createElement("datalist");
datalist.id = "lugaresComunes";
lugaresComunes.forEach(lugar => {
  const opt = document.createElement("option");
  opt.value = lugar;
  datalist.appendChild(opt);
});
document.body.appendChild(datalist);

// Mayúsculas automáticas
document.addEventListener("input", (e) => {
  if (e.target.name === "origen" || e.target.name === "destino") {
    e.target.value = e.target.value.toUpperCase();
  }
});

// Exportar Excel
document.getElementById("btnExportar").addEventListener("click", () => {
  const wb = XLSX.utils.book_new();

  document.querySelectorAll(".tabla").forEach(tabla => {
    const centro = tabla.dataset.centro;
    const filas = tabla.querySelectorAll("tbody tr");

    // 1. Definir los nuevos encabezados en el orden solicitado (28 columnas)
    const data = [[
      "N°",                      // (Nuevo)
      "N° VALE",
      "Fecha",
      "Usuario",
      "Centro de costo",
      "Aprueba",
      "Tiempo de espera Origen", // (Nuevo)
      "Hora Inicio",
      "T. Espera",               // (Original, se mantiene aquí)
      "Origen",
      "Direccion origen",        // (Nuevo)
      "Distrito origen",         // (Nuevo)
      "Kilometraje Origen",      // (Nuevo)
      "Hora Final",
      "Tiempo espera Destino",   // (Nuevo)
      "Destino",
      "Dirección destino",       // (Nuevo)
      "Distrito Destino",        // (Nuevo)
      "Kilometraje acumulado",   // (KM Final)
      "Distancia (kilometraje)", // (KM del viaje)
      "Tiempo total ruta",       // (Nuevo)
      "Tiempo total espera",     // (Nuevo)
      "Tiempo Total",
      "Tipo de servicio",        // (Renombrado)
      "Descripción Servicio",    // (Nuevo)
      "Peaje",
      "Ruta",
      "Total",
    ]];

    // Variables para la lógica secuencial POR PESTAÑA
    let contadorFila = 1;
    let kmOrigenSiguiente = kilometraje_inicio; // Usa el valor global inicial

    filas.forEach(tr => {
      // Obtenemos todos los <td> (15 columnas en la tabla HTML)
      const celdas = Array.from(tr.querySelectorAll("td")).map(td => td.textContent.trim());

      // --- Limpieza de valores ---
      const peajeSinUnidad = celdas[11].replace('S/', '').trim();
      const rutaSinUnidad = celdas[12].replace('S/', '').trim();
      const totalSoles = celdas[13].replace('S/', '').trim();
      const kmSinUnidad = celdas[14].trim(); // Distancia (kilometraje)

      // --- Lógica de N° y Kilometraje ---
      
      // 1. N°: Usamos el contador de fila
      const nFila = contadorFila++;
      
      // 2. Kilometraje:
      //    kmAcumulado = KM Final de esta fila
      //    kmOrigenActual = KM Origen de esta fila (que fue el final de la anterior)
      const kmAcumulado = tr.getAttribute("data-km") || "0";
      const kmOrigenActual = kmOrigenSiguiente;
      
      // Preparamos el 'kmOrigenSiguiente' para la *próxima* iteración
      // Será el KM Final (acumulado) de la fila actual
      kmOrigenSiguiente = parseFloat(kmAcumulado) || kmOrigenActual;

      // 2. Reconstruir la fila en el nuevo orden solicitado (28 columnas)
      const celdasFinal = [
        nFila,                            // 1. N°
        celdas[0],                        // 2. N° VALE
        celdas[1],                        // 3. Fecha
        celdas[2],                        // 4. Usuario
        centro,                           // 5. Centro de costo
        celdas[3],                        // 6. Aprueba
        "",                               // 7. Tiempo de espera Origen (Vacio)
        celdas[4],                        // 8. Hora Inicio
        celdas[5],                        // 9. T. Espera
        celdas[8],                        // 10. Origen
        "SANTA ANITA",                    // 11. Direccion origen (Valor fijo)
        "SANTA ANITA",                    // 12. Distrito origen (Valor fijo)
        kmOrigenActual.toFixed(1),        // 13. Kilometraje Origen (Lógica)
        celdas[7],                        // 14. Hora Final
        "",                               // 15. Tiempo espera Destino (Vacio)
        celdas[9],                        // 16. Destino
        "",                               // 17. Dirección destino (Vacio)
        "",                               // 18. Distrito Destino (Vacio)
        kmAcumulado,                      // 19. Kilometraje acumulado (KM Final)
        kmSinUnidad,                      // 20. Distancia (kilometraje)
        celdas[6],                        // 21. Tiempo total ruta (Igual a T. Total)
        celdas[5],                        // 22. Tiempo total espera (Valor de T. Espera)
        celdas[6],                        // 23. Tiempo Total
        celdas[10],                       // 24. Tipo de servicio (era "Tipo")
        "MERCADERIA",                     // 25. Descripción Servicio (Valor fijo)
        peajeSinUnidad,                   // 26. Peaje
        rutaSinUnidad,                    // 27. Ruta
        totalSoles                        // 28. Total
      ];

      data.push(celdasFinal);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, centro);
  });

  XLSX.writeFile(wb, "facturas.xlsx");
});

