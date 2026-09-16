const SERVICE_ID = "service_oj1a0g9";
const TEMPLATE_ID = "template_y7h5vx8";
const PUBLIC_KEY = "aVAnKXumdJj5kDtyu";

function log(mensaje, tipo) {
  const div = document.getElementById("log");
  const linea = document.createElement("div");
  linea.textContent = mensaje;
  linea.className = tipo || "";
  div.appendChild(linea);
  div.scrollTop = div.scrollHeight;
}

async function enviarCorreo(destinatario) {
  const parametrosTemplate = {
    to_email: destinatario.trim(),
    to_name: destinatario.split("@")[0]
  };

  try {
    const resultado = await emailjs.send(SERVICE_ID, TEMPLATE_ID, parametrosTemplate, { publicKey: PUBLIC_KEY });
    log(`[OK] Enviado a: ${destinatario} | Estado: ${resultado.status}`, "ok");
  } catch (err) {
    // Los errores solo se muestran en la consola del navegador (F12), no en pantalla
    console.error(`Error al enviar a ${destinatario}:`, err);
  }
}

async function enviarTodos() {
  const texto = document.getElementById("destinatarios").value;

  document.getElementById("log").innerHTML = "";

  const lista = texto
    .split("\n")
    .map(linea => linea.trim())
    .filter(linea => linea.length > 0 && linea.includes("@") && linea.includes("."));

  if (lista.length === 0) {
    console.error("No se encontraron correos válidos en la lista.");
    log("No se pudo iniciar el envío. Revisa la consola para más detalles.", "info");
    return;
  }

  log(`Iniciando envío para ${lista.length} destinatario(s)...`, "info");

  for (const correo of lista) {
    await enviarCorreo(correo);
  }

  log("Proceso de envío finalizado.", "ok");
}
