const btnAnalizar = document.getElementById('btn-analizar');
const btnTexto = document.getElementById('btn-texto');
const correoTexto = document.getElementById('correoTx');
const resultadoCard = document.getElementById('resultado-card');
const resultadoPlaceholder = document.getElementById('resultado-placeholder');
const veredictoTexto = document.getElementById('veredicto-texto');
const puntosNumero = document.getElementById('puntos-numero');
const razonesLista = document.getElementById('razones-lista');
const errorMsg = document.getElementById('error-msg');
const usosContador = document.getElementById('usos-contador');

const STORAGE_KEY = 'phiscan_usos_totales';

function obtenerUsosGuardados() {
    const valor = localStorage.getItem(STORAGE_KEY);
    return valor ? parseInt(valor, 10) : 0;
}

function guardarUsos(total) {
    localStorage.setItem(STORAGE_KEY, String(total));
}

// Inicializar contador desde localStorage al cargar la página
usosContador.textContent = obtenerUsosGuardados();

function analizar() {
    const correo = correoTexto.value.trim();
    errorMsg.classList.add('hidden');

    if (!correo) {
        alert("Por favor pega el correo antes de analizar")
        return;
    }

    // Todo el análisis corre localmente en el navegador (detector.js)
    const resultado = analizarCorreo(correo);
    mostrarResultado(resultado);

    const nuevoTotal = obtenerUsosGuardados() + 1;
    guardarUsos(nuevoTotal);
    usosContador.textContent = nuevoTotal;
}

function mostrarResultado(data) {
    resultadoCard.dataset.color = data.color;
    veredictoTexto.textContent = data.etiqueta;
    puntosNumero.textContent = data.puntos;

    razonesLista.innerHTML = '';
    data.razones.forEach((razon) => {
        const li = document.createElement('li');
        li.textContent = razon;
        razonesLista.appendChild(li);
    });

    resultadoCard.classList.remove('hidden');
    resultadoPlaceholder.classList.add('hidden');
}

btnAnalizar.addEventListener('click', analizar);
