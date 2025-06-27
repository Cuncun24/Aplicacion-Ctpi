const URL_API_MATRICULADOS = "https://raw.githubusercontent.com/CesarMCuellarCha/apis/refs/heads/main/SENA-CTPI.matriculados.json";

// Contraseña fija para iniciar sesión
const CLAVE_VALIDA = 'adso2993013';

// Esperar a que todo el contenido de la página esté cargado
document.addEventListener('DOMContentLoaded', () => {
    const formularioLogin = document.getElementById('formulario-login');

    if (formularioLogin) {
        formularioLogin.addEventListener('submit', async function (evento) {
            evento.preventDefault();

            const nombreUsuario = document.getElementById('usuario')?.value || '';
            const claveAcceso = document.getElementById('clave')?.value || '';

            if (claveAcceso === CLAVE_VALIDA) {
                localStorage.setItem('nombreUsuario', nombreUsuario);
                await mostrarInterfazPrincipal(nombreUsuario);
            } else {
                alert('Contraseña o usuario incorrecto');
            }
        });
    }

    const botonCerrarSesion = document.getElementById('boton-salir');
    if (botonCerrarSesion) {
        botonCerrarSesion.addEventListener('click', function () {
            localStorage.clear();
            document.getElementById('contenedor-principal').style.display = 'none';
            document.getElementById('contenedor-inicio').style.display = 'block';
            alert("¿Estás seguro de cerrar sesión?");
        });
    }
});

async function mostrarInterfazPrincipal(nombreUsuario) {
    const contenedorPrincipal = document.getElementById('contenedor-principal');
    const contenedorInicio = document.getElementById('contenedor-inicio');

    if (contenedorPrincipal && contenedorInicio && document.getElementById('nombre-usuario')) {
        contenedorInicio.style.display = 'none';
        contenedorPrincipal.style.display = 'block';
        document.getElementById('nombre-usuario').textContent = nombreUsuario;

        const datos = await obtenerDatos();
        await cargarFichasDisponibles(datos);
    }
}

async function obtenerDatos() {
    try {
        const respuesta = await fetch(URL_API_MATRICULADOS);
        if (!respuesta.ok) throw new Error(`Error ${respuesta.status}`);
        const datos = await respuesta.json();
        return Array.isArray(datos) ? datos : [];
    } catch (error) {
        alert("No se pudo obtener la información. " + error.message);
        return [];
    }
}

// Activar búsqueda manual por código de ficha
document.getElementById('boton-buscar-ficha')?.addEventListener('click', () => {
    const inputFicha = document.getElementById('buscar-ficha')?.value.trim();
    const selector = document.getElementById('selector-codigo-ficha');

    if (inputFicha && selector) {
        const opciones = Array.from(selector.options).map(op => op.value);
        if (opciones.includes(inputFicha)) {
            selector.value = inputFicha;
            selector.dispatchEvent(new Event('change'));
        } else {
            alert('Ficha no encontrada');
        }
    }
});

async function cargarFichasDisponibles(datos) {
    const selectorCodigoFicha = document.getElementById('selector-codigo-ficha');
    if (!selectorCodigoFicha) return;

    selectorCodigoFicha.innerHTML = '<option value="">Seleccionar ficha</option>';

    const fichasUnicas = new Set(datos.map(dato => String(dato['FICHA'])));

    fichasUnicas.forEach(ficha => {
        const opcion = document.createElement('option');
        opcion.value = ficha;
        opcion.text = ficha;
        selectorCodigoFicha.appendChild(opcion);
    });

    selectorCodigoFicha.addEventListener('change', () => manejarCambioFicha(datos));
}

function manejarCambioFicha(datos) {
    const selectorCodigoFicha = document.getElementById('selector-codigo-ficha');
    const fichaSeleccionada = selectorCodigoFicha.value;
    const nombreDelPrograma = document.getElementById('nombre-del-programa');

    if (!fichaSeleccionada) {
        nombreDelPrograma.textContent = '';
        document.getElementById('cuerpo-tabla-estudiantes').innerHTML = '';
        return;
    }

    const datosFiltrados = datos.filter(d => String(d['FICHA']) === fichaSeleccionada);
    const programa = datosFiltrados[0]?.['PROGRAMA'] || 'No disponible';

    localStorage.setItem('codigoFicha', fichaSeleccionada);
    localStorage.setItem('nombrePrograma', programa);

    nombreDelPrograma.textContent = programa;

    renderizarTablaEstudiantes(datosFiltrados);
}

function renderizarTablaEstudiantes(datos) {
    const cuerpoTabla = document.getElementById('cuerpo-tabla-estudiantes');
    if (!cuerpoTabla) return;
    

    cuerpoTabla.innerHTML = '';

    datos.forEach(est => {
        const fila = document.createElement('tr');

        resaltarRetiroVoluntario(fila, est['ESTADO_APRENDIZ']);

        const celdas = [
            est['TIPO_DOCUMENTO'],
            est['NUMERO_DOCUMENTO'],
            est['NOMBRE'],
            est['PRIMER_APELLIDO'],
            est['SEGUNDO_APELLIDO'],
            est['ESTADO_APRENDIZ']
        ];

        celdas.forEach(valor => {
            const celda = document.createElement('td');
            celda.textContent = valor || '';
            fila.appendChild(celda);
        });

        cuerpoTabla.appendChild(fila);
    });
}

function resaltarRetiroVoluntario(fila, estado) {
    if ((estado || '').trim().toLowerCase() === 'retiro voluntario') {
        fila.classList.add('retiro-voluntario');
    }
}
