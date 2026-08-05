var marcaAbierta = null;

function mostrarPista(marca) {
    if (marcaAbierta === marca) {
        marca.classList.remove("activa");
        marcaAbierta = null;
        return;
    }

    // Si había otra marca abierta, la cerramos primero
    if (marcaAbierta !== null) {
        marcaAbierta.classList.remove("activa");
    }

    // Abrimos la marca nueva
    marca.classList.add("activa");
    marcaAbierta = marca;
}



