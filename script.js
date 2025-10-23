import { MEDICOS } from "./medico.js";

// ---------- CONFIGURACIÓN Y CONSTANTES ----------
const CONFIGURACION = {
  MENSAJE_TIMEOUT: 3000,
  FECHA_MINIMA_OFFSET: 0,
  HORARIOS_DISPONIBLES: [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ]
};

// ---------- VARIABLES GLOBALES ----------
let elementos = {};
let turnos = [];
let medicos = [];

// ---------- FUNCIONES DE INICIALIZACIÓN ----------
async function inicializarSistema() {
  try {
    obtenerElementosDOM();
    await cargarDatosIniciales();
    configurarEventos();
    configurarFechaMinima();
    validarFormulario();
  } catch (error) {
    mostrarError('Error al inicializar el sistema', error);
  }
}

function obtenerElementosDOM() {
  elementos = {
    form: document.getElementById("form-turno"),
    nombrePaciente: document.getElementById("nombre"),
    apellidoPaciente: document.getElementById("apellido"),
    selectMedico: document.getElementById("medico"),
    listaTurnos: document.getElementById("lista-turnos"),
    btnVaciar: document.getElementById("vaciar"),
    fechaTurno: document.getElementById("fecha"),
    mensajeArea: document.getElementById("mensaje-area"),
    horaTurno: document.getElementById("hora")
  };

  // Validar que todos los elementos existen
  const elementosFaltantes = Object.entries(elementos)
    .filter(([nombre, elemento]) => !elemento)
    .map(([nombre]) => nombre);

  if (elementosFaltantes.length > 0) {
    throw new Error(`Elementos DOM faltantes: ${elementosFaltantes.join(', ')}`);
  }
}

async function cargarDatosIniciales() {
  try {
    // Cargar médicos de forma asíncrona
    await cargarMedicos();
    // Cargar turnos existentes
    cargarTurnos();
    // Precargar datos del formulario
    precargarDatosFormulario();
  } catch (error) {
    mostrarError('Error al cargar datos iniciales', error);
  }
}

function precargarDatosFormulario() {
  // Solo precargar si los campos están vacíos (después de un reset)
  if (!elementos.fechaTurno.value) {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const fechaManana = manana.toISOString().split('T')[0];
    elementos.fechaTurno.value = fechaManana;
  }

  if (!elementos.horaTurno.value) {
    
    elementos.horaTurno.value = CONFIGURACION.HORARIOS_DISPONIBLES[0];
  }

  if (!elementos.selectMedico.value && turnos.length > 0) {
    
    const ultimoTurno = turnos[turnos.length - 1];
    elementos.selectMedico.value = ultimoTurno.medicoId;
  }
  

}

// ---------- FUNCIONES DE VALIDACIÓN ----------
function configurarFechaMinima() {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  const fechaMinima = `${año}-${mes}-${dia}`;
  elementos.fechaTurno.setAttribute('min', fechaMinima);
}

function validarFecha(fecha) {
  const hoy = new Date();
  const fechaSeleccionada = new Date(fecha);
  
  const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const fechaSeleccionadaLocal = new Date(fechaSeleccionada.getFullYear(), fechaSeleccionada.getMonth(), fechaSeleccionada.getDate());
  
  return fechaSeleccionadaLocal >= hoyLocal;
}

function mostrarErrorFecha() {
  elementos.fechaTurno.setCustomValidity('No se puede seleccionar una fecha anterior a hoy');
  elementos.fechaTurno.reportValidity();
}

function limpiarErrorFecha() {
  elementos.fechaTurno.setCustomValidity('');
}

function validarNombre(nombre) {
  return nombre && nombre.trim().length >= 2 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre.trim());
}

function validarApellido(apellido) {
  return apellido && apellido.trim().length >= 2 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellido.trim());
}

function mostrarErrorNombre() {
  elementos.nombrePaciente.setCustomValidity('El nombre debe tener al menos 2 caracteres y solo contener letras');
  elementos.nombrePaciente.reportValidity();
}

function mostrarErrorApellido() {
  elementos.apellidoPaciente.setCustomValidity('El apellido debe tener al menos 2 caracteres y solo contener letras');
  elementos.apellidoPaciente.reportValidity();
}

function limpiarErrorNombre() {
  elementos.nombrePaciente.setCustomValidity('');
}

function limpiarErrorApellido() {
  elementos.apellidoPaciente.setCustomValidity('');
}

// ---------- FUNCIONES DE MENSAJES ----------
function mostrarMensaje(tipo, mensaje) {
  if (!elementos.mensajeArea) return;
  
  elementos.mensajeArea.className = `mensaje ${tipo}`;
  elementos.mensajeArea.textContent = mensaje;
  elementos.mensajeArea.style.display = 'block';
  
  if (tipo === 'success') {
    setTimeout(() => {
      elementos.mensajeArea.style.display = 'none';
    }, CONFIGURACION.MENSAJE_TIMEOUT);
  }
}

function limpiarMensaje() {
  if (elementos.mensajeArea) {
    elementos.mensajeArea.style.display = 'none';
  }
}

function mostrarError(titulo, error) {
  mostrarMensaje('error', `${titulo}: ${error.message || error}`);
}

function validarFormulario() {
  const nombre = elementos.nombrePaciente.value.trim();
  const apellido = elementos.apellidoPaciente.value.trim();
  const medicoId = elementos.selectMedico.value;
  const fecha = elementos.fechaTurno.value;
  const hora = elementos.horaTurno.value;
  const submitBtn = elementos.form.querySelector('button[type="submit"]');
  
  const esValido = validarNombre(nombre) && 
                  validarApellido(apellido) && 
                  medicoId && 
                  fecha && 
                  hora && 
                  validarFecha(fecha);
  
  submitBtn.disabled = !esValido;
  
  return esValido;
}
// ---------- FUNCIONES DE CARGA DE DATOS ----------
async function cargarMedicos() {
  try {
  
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Importar médicos 
    const { MEDICOS } = await import('./medico.js');
    medicos = MEDICOS;
    
    // Limpiar existentes
    elementos.selectMedico.innerHTML = '';
    
    
    const optionDefault = document.createElement("option");
    optionDefault.value = "";
    optionDefault.textContent = "Seleccione un médico";
    optionDefault.disabled = true;
    optionDefault.selected = true;
    elementos.selectMedico.appendChild(optionDefault);
    
    // Cargar médicos
    medicos.forEach(medico => {
      const option = document.createElement("option");
      option.value = medico.id;
      option.textContent = `${medico.nombre} (${medico.especialidad})`;
      elementos.selectMedico.appendChild(option);
    });
  } catch (error) {
    mostrarError('Error al cargar médicos', error);
  }
}

function cargarTurnos() {
  try {
    const data = localStorage.getItem("turnos");
    turnos = data ? JSON.parse(data) : [];
    renderizarTurnos();
  } catch (error) {
    mostrarError('Error al cargar turnos', error);
    turnos = [];
  }
}

function guardarTurnos() {
  try {
    localStorage.setItem("turnos", JSON.stringify(turnos));
  } catch (error) {
    mostrarError('Error al guardar turnos', error);
  }
}

function agregarTurno(nombre, apellido, medicoId, fecha, hora) {
  const medicoSeleccionado = medicos.find(m => m.id == medicoId);
  const especialidad = medicoSeleccionado?.especialidad;
  
  // Verificar si ya existe un turno con el mismo médico, fecha y hora
  const turnoExistenteMedico = turnos.find(turno => 
    turno.medicoId === medicoId && 
    turno.fecha === fecha && 
    turno.hora === hora
  );
  
  if (turnoExistenteMedico) {
    mostrarMensaje('error', 'Ya existe un turno para este médico en la misma fecha y hora');
    return false;
  }
  
  // Verificar si la misma persona ya tiene un turno en el mismo horario con la misma especialidad
  const turnoExistentePaciente = turnos.find(turno => 
    turno.nombrePaciente.toLowerCase() === nombre.toLowerCase() &&
    turno.apellidoPaciente.toLowerCase() === apellido.toLowerCase() &&
    turno.medicoEspecialidad === especialidad &&
    turno.fecha === fecha &&
    turno.hora === hora
  );
  
  if (turnoExistentePaciente) {
    const fechaFormateada = formatearFecha(fecha);
    const horaFormateada = formatearHora(hora);
    mostrarMensaje('error', `${nombre} ${apellido} ya tiene un turno en ${especialidad} el ${fechaFormateada} a las ${horaFormateada}`);
    return false;
  }
  
  const turno = {
    id: Date.now(),
    nombrePaciente: nombre.trim(),
    apellidoPaciente: apellido.trim(),
    medicoId: parseInt(medicoId),
    medicoNombre: medicoSeleccionado?.nombre || 'Médico desconocido',
    medicoEspecialidad: medicoSeleccionado?.especialidad || 'Especialidad desconocida',
    fecha,
    hora,
    fechaCreacion: new Date().toISOString()
  };
  
  turnos.push(turno);
  guardarTurnos();
  renderizarTurnos();
  mostrarMensaje('success', `Turno reservado exitosamente para ${nombre} ${apellido}`);
  return true;
}

function eliminarTurno(id) {
  turnos = turnos.filter(t => t.id !== id);
  guardarTurnos();
  renderizarTurnos();
  mostrarMensaje('success', 'Turno cancelado exitosamente');
}

async function vaciarTurnos() {
  if (turnos.length === 0) {
    await Swal.fire({
      icon: 'info',
      title: 'Sin turnos',
      text: 'No hay turnos para cancelar',
      confirmButtonText: 'Entendido'
    });
    return;
  }
  
  const resultado = await Swal.fire({
    title: '¿Cancelar todos los turnos?',
    text: `Está seguro de que desea cancelar todos los ${turnos.length} turnos?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, cancelar todos',
    cancelButtonText: 'No, mantener'
  });
  
  if (resultado.isConfirmed) {
    turnos = [];
    guardarTurnos();
    renderizarTurnos();
    await Swal.fire({
      icon: 'success',
      title: 'Turnos cancelados',
      text: 'Todos los turnos han sido cancelados exitosamente',
      timer: 2000,
      showConfirmButton: false
    });
  }
}


function formatearFecha(fecha) {
  const fechaObj = new Date(fecha + 'T00:00:00');
  return fechaObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatearHora(hora) {
  const [horas, minutos] = hora.split(':');
  return `${horas}:${minutos}`;
}

function renderizarTurnos() {
  elementos.listaTurnos.innerHTML = "";
  
  if (turnos.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No hay turnos reservados";
    li.className = "sin-turnos";
    elementos.listaTurnos.appendChild(li);
    return;
  }
  
  // Ordenar turnos por fecha y hora
  const turnosOrdenados = [...turnos].sort((a, b) => {
    const fechaA = new Date(a.fecha + 'T' + a.hora);
    const fechaB = new Date(b.fecha + 'T' + b.hora);
    return fechaA - fechaB;
  });
  
  turnosOrdenados.forEach(turno => {
    const li = document.createElement("li");
    li.className = "turno-item";
    
    const infoDiv = document.createElement("div");
    infoDiv.className = "turno-info";
    
    const pacienteSpan = document.createElement("span");
    pacienteSpan.textContent = `${turno.nombrePaciente} ${turno.apellidoPaciente}`;
    pacienteSpan.className = "paciente";
    
    const medicoSpan = document.createElement("span");
    medicoSpan.textContent = `${turno.medicoNombre} (${turno.medicoEspecialidad})`;
    medicoSpan.className = "medico";
    
    const fechaSpan = document.createElement("span");
    fechaSpan.textContent = formatearFecha(turno.fecha);
    fechaSpan.className = "fecha";
    
    const horaSpan = document.createElement("span");
    horaSpan.textContent = formatearHora(turno.hora);
    horaSpan.className = "hora";
    
    infoDiv.appendChild(pacienteSpan);
    infoDiv.appendChild(document.createTextNode(" - "));
    infoDiv.appendChild(medicoSpan);
    infoDiv.appendChild(document.createTextNode(" - "));
    infoDiv.appendChild(fechaSpan);
    infoDiv.appendChild(document.createTextNode(" a las "));
    infoDiv.appendChild(horaSpan);
    
    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "X";
    btnEliminar.className = "eliminar";
    btnEliminar.setAttribute("data-id", turno.id);
    btnEliminar.title = "Cancelar turno";
    
    li.appendChild(infoDiv);
    li.appendChild(btnEliminar);
    elementos.listaTurnos.appendChild(li);
  });
}


// ---------- FUNCIONES DE CONFIGURACIÓN DE EVENTOS ----------
function configurarEventos() {

  elementos.nombrePaciente.addEventListener("input", () => {
    const nombre = elementos.nombrePaciente.value.trim();
    if (nombre && !validarNombre(nombre)) {
      mostrarErrorNombre();
      mostrarMensaje('error', 'El nombre debe tener al menos 2 caracteres y solo contener letras');
    } else {
      limpiarErrorNombre();
      limpiarMensaje();
    }
    validarFormulario();
  });

  elementos.apellidoPaciente.addEventListener("input", () => {
    const apellido = elementos.apellidoPaciente.value.trim();
    if (apellido && !validarApellido(apellido)) {
      mostrarErrorApellido();
      mostrarMensaje('error', 'El apellido debe tener al menos 2 caracteres y solo contener letras');
    } else {
      limpiarErrorApellido();
      limpiarMensaje();
    }
    validarFormulario();
  });

  elementos.selectMedico.addEventListener("change", () => {
    limpiarMensaje();
    validarFormulario();
  });
  
  elementos.fechaTurno.addEventListener("change", () => {
    const fecha = elementos.fechaTurno.value;
    if (fecha && !validarFecha(fecha)) {
      mostrarErrorFecha();
      mostrarMensaje('error', 'No se puede seleccionar una fecha anterior a hoy');
    } else {
      limpiarErrorFecha();
      limpiarMensaje();
    }
    validarFormulario();
  });
  
  elementos.horaTurno.addEventListener("change", () => {
    limpiarMensaje();
    validarFormulario();
  });

  // Event listener para el formulario
  elementos.form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      mostrarMensaje('error', 'Por favor complete todos los campos correctamente');
      return;
    }
    
    const nombre = elementos.nombrePaciente.value.trim();
    const apellido = elementos.apellidoPaciente.value.trim();
    const medicoId = elementos.selectMedico.value;
    const fecha = elementos.fechaTurno.value;
    const hora = elementos.horaTurno.value;

    const exito = agregarTurno(nombre, apellido, medicoId, fecha, hora);
    if (exito) {
      // Resetear el formulario completamente
      elementos.form.reset();
      
      // Limpiar todos los errores de validación
      limpiarErrorFecha();
      limpiarErrorNombre();
      limpiarErrorApellido();
      
      
      setTimeout(() => {
        precargarDatosFormulario();
        validarFormulario();
      }, 100);
    }
  });

  elementos.listaTurnos.addEventListener("click", (e) => {
    if (e.target.classList.contains("eliminar")) {
      const id = Number(e.target.dataset.id);
      eliminarTurno(id);
    }
  });

  elementos.btnVaciar.addEventListener("click", () => {
    vaciarTurnos();
  });
}

// ---------- INICIALIZACIÓN DE LA APLICACIÓN ----------
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await inicializarSistema();
  } catch (error) {
    //  en caso de error crítico
    document.body.innerHTML = `
      <div style="text-align: center; padding: 50px; color: #d33;">
        <h1>Error del Sistema</h1>
        <p>No se pudo inicializar la aplicación. Por favor, recargue la página.</p>
        <p><small>Error: ${error.message}</small></p>
      </div>
    `;
  }
});
