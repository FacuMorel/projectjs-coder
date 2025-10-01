import { MEDICOS } from "./medico.js";

let form, selectMedico, listaTurnos, btnVaciar, fechaTurno;
let turnos = [];

// ---------- FUNCIONES DE VALIDACIÓN ----------
function configurarFechaMinima() {
  const hoy = new Date();
  const fechaMinima = hoy.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  fechaTurno.setAttribute('min', fechaMinima);
}

function validarFecha(fecha) {
  const hoy = new Date();
  const fechaSeleccionada = new Date(fecha);
  
  // Resetear horas para comparar solo fechas
  hoy.setHours(0, 0, 0, 0);
  fechaSeleccionada.setHours(0, 0, 0, 0);
  
  return fechaSeleccionada >= hoy;
}

function mostrarErrorFecha() {
  fechaTurno.setCustomValidity('No se puede seleccionar una fecha anterior a hoy');
  fechaTurno.reportValidity();
}

function limpiarErrorFecha() {
  fechaTurno.setCustomValidity('');
}
// --FUNCION PRINCIPAL --
function cargarMedicos() {
  if (!selectMedico) {
    console.error("No se encontró el elemento select con id 'medico'");
    return;
  }
  

  
  // Agregar opción por defecto
  const optionDefault = document.createElement("option");
  optionDefault.value = "";
  optionDefault.textContent = "Seleccione un médico";
  optionDefault.disabled = true;
  optionDefault.selected = true;
  selectMedico.appendChild(optionDefault);
  
  // Cargar médicos
  MEDICOS.forEach(medico => {
    const option = document.createElement("option");
    option.value = medico.nombre;
    option.textContent = `${medico.nombre} (${medico.especialidad})`;
    selectMedico.appendChild(option);
  });
}

function cargarTurnos() {
  const data = localStorage.getItem("turnos");
  turnos = data ? JSON.parse(data) : [];
  renderTurnos();
}

function guardarTurnos() {
  localStorage.setItem("turnos", JSON.stringify(turnos));
}

function agregarTurno(medicoId, fecha, hora) {
  const medicoText = selectMedico.options[selectMedico.selectedIndex].text;
  const turno = {
    id: Date.now(),
    medicoId,
    medicoText,
    fecha,
    hora
  };
  turnos.push(turno);
  guardarTurnos();
  renderTurnos();
}

function eliminarTurno(id) {
  turnos = turnos.filter(t => t.id !== id);
  guardarTurnos();
  renderTurnos();
}

function vaciarTurnos() {
  turnos = [];
  guardarTurnos();
  renderTurnos();
}

function renderTurnos() {
  listaTurnos.innerHTML = "";
  turnos.forEach(t => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${t.medicoText} Fecha del turno ${t.fecha} Hora ${t.hora}
      <button class="eliminar" data-id="${t.id}">X</button>
    `;
    listaTurnos.appendChild(li);
  });
}


function configurarEventos() {
  // Event listener para validar fecha 
  fechaTurno.addEventListener("change", () => {
    const fecha = fechaTurno.value;
    if (fecha && !validarFecha(fecha)) {
      mostrarErrorFecha();
    } else {
      limpiarErrorFecha();
    }
  });

  // Event listener para el formulario
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const medicoId = selectMedico.value;
    const fecha = fechaTurno.value;
    const hora = document.getElementById("hora").value;

    // validacion de fecha
    if (fecha && !validarFecha(fecha)) {
      mostrarErrorFecha();
      return;
    }

    if (medicoId && fecha && hora) {
      agregarTurno(medicoId, fecha, hora);
      form.reset();
      limpiarErrorFecha();
    }
  });

  listaTurnos.addEventListener("click", (e) => {
    if (e.target.classList.contains("eliminar")) {
      const id = Number(e.target.dataset.id);
      eliminarTurno(id);
    }
  });

  btnVaciar.addEventListener("click", vaciarTurnos);
}


document.addEventListener("DOMContentLoaded", () => {
  
  form = document.getElementById("form-turno");
  selectMedico = document.getElementById("medico");
  listaTurnos = document.getElementById("lista-turnos");
  btnVaciar = document.getElementById("vaciar");
  fechaTurno = document.getElementById("fecha");
  

  configurarFechaMinima();
  cargarMedicos();
  cargarTurnos();
  configurarEventos();
});
