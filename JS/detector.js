const ACORTADORES = new Set([
  "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd",
  "buff.ly", "shorte.st", "adf.ly", "cutt.ly", "rebrand.ly", "tiny.cc"
]);

const MARCAS_COMUNES = [
  "paypal", "google", "microsoft", "apple", "amazon", "netflix",
  "facebook", "instagram", "bancolombia", "bbva", "santander",
  "whatsapp", "outlook", "dropbox", "linkedin"
];

// Palabras típicas de dominios genéricos de estafa (sin imitar marca puntual,
// pero con nombres armados para sonar "oficiales" de un sorteo/regalo)
const PALABRAS_DOMINIO_SOSPECHOSO = [
  "premio", "gana", "ganador", "sorteo", "rifa", "regalo",
  "gratis", "oferta", "cupon", "promo", "bono"
];

// Palabras genéricas de "entidad de confianza" usadas en typosquatting
// (además de las marcas específicas de MARCAS_COMUNES)
const PALABRAS_ENTIDAD_GENERICA = ["banco", "bank", "seguridad", "verificar", "login", "acceso"];

const FRASES_URGENCIA = [
  /act[uú]a\s+ahora/i, /urgente/i, /inmediat[oa]mente/i, /de\s+inmediato/i,
  /su\s+cuenta\s+ser[aá]\s+(suspendida|bloqueada|cerrada)/i,
  /[uú]ltim[oa]\s+aviso/i, /antes\s+de\s+que\s+sea\s+tarde/i,
  /verifique\s+su\s+cuenta/i, /cuenta\s+bloqueada/i, /expira\s+hoy/i,
  /acceso\s+restringido/i, /responda\s+de\s+inmediato/i,
  /\b\d{1,3}\s*(horas|hrs|minutos|min)\b/i,
  /tiempo\s+l[ií]mite/i, /plazo\s+de/i, /solo\s+hoy/i, /oferta\s+por\s+tiempo\s+limitado/i,
  /es\s+obligatorio/i, /antes\s+del?\s+(lunes|martes|mi[ée]rcoles|jueves|viernes|s[áa]bado|domingo)/i
];

const FRASES_DATOS_SENSIBLES = [
  /contrase[nñ]a/i, /n[uú]mero\s+de\s+tarjeta/i, /\bcvv\b/i,
  /clave\s+(secreta|de\s+acceso)/i, /datos\s+bancarios/i,
  /\bpin\b/i, /confirmar\s+su\s+identidad/i, /verificar\s+su\s+identidad/i,
  /actualizar\s+su\s+informaci[oó]n/i, /datos\s+de\s+pago/i, /informaci[oó]n\s+de\s+pago/i
];

const SALUDOS_GENERICOS = [
  /estimad[oa]\s+client[e]?/i, /estimad[oa]\s+usuario/i,
  /querid[oa]\s+client[e]?/i, /dear\s+customer/i, /dear\s+user/i,
  /estimad[oa]\s+colaborador[a]?/i, /estimad[oa]\s+emplead[oa]/i,
  /querid[oa]\s+colaborador[a]?/i, /dear\s+employee/i
];

const ERRORES_COMUNES = [
  /por\s+favor\s+haga\s+cl[ií]c/i, /haga\s+cl[ií]c\s*(k)?\s*aqui/i,
  /clickea/i, /de\s+cl[ií]c/i, /haga\s+click\s+aqui/i
];

// Señales de estafa de premio / lotería / sorteo no solicitado
const FRASES_PREMIO_GANADOR = [
  /\bha[s]?\s+ganado\b/i, /\bfelicidades\b/i, /\bganador[a]?\b/i,
  /\bsorteo\b/i, /\brifa\b/i, /\bpremio\s+(gratis|gratuito)\b/i,
  /\breclame?\s+su\s+premio\b/i, /\bseleccionad[oa]\s+al\s+azar\b/i,
  /\byou\s+have\s+won\b/i, /\bclaim\s+your\s+prize\b/i, /\bfelicitaciones\b/i
];

// Señales de "fraude de anticipo": piden un pago chico para liberar algo grande
const FRASES_PAGO_ANTICIPADO = [
  /costos?\s+de\s+env[ií]o/i, /cubrir\s+los?\s+costos/i,
  /tarifa\s+de\s+procesamiento/i, /peque[nñ]a\s+cantidad/i,
  /pago\s+(m[ií]nimo|simb[oó]lico)/i, /gastos\s+administrativos/i
];

function extraerDominio(remitente) {
  const match = remitente.match(/@([\w.-]+)/);
  return match ? match[1].toLowerCase() : "";
}

function extraerUrls(texto) {
  return texto.match(/https?:\/\/[^\s<>"']+/gi) || [];
}

function obtenerHost(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (e) {
    return "";
  }
}

function esTyposquatting(dominio) {
  const dominioLimpio = (dominio || "").toLowerCase();
  for (const marca of MARCAS_COMUNES) {
    if (dominioLimpio.includes(marca)) {
      const oficialAprox = `${marca}.com`;
      if (dominioLimpio !== oficialAprox && !dominioLimpio.endsWith(`.${marca}.com`)) {
        return true;
      }
    }
  }
  return false;
}

function esDominioGenericoSospechoso(dominio) {
  const d = (dominio || "").toLowerCase();
  return PALABRAS_DOMINIO_SOSPECHOSO.some((palabra) => d.includes(palabra));
}

// Convierte sustituciones típicas tipo "banc0" -> "banco", "l0gin" -> "login"
function normalizarLeet(texto) {
  return (texto || "")
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "l")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t");
}

// Detecta dominios que usan números para imitar una palabra de confianza
// (ej: "banc0-verificar.com" imita "banco")
function esDominioConSustitucionSospechosa(dominio) {
  const d = (dominio || "").toLowerCase();
  const normalizado = normalizarLeet(d);
  if (normalizado === d) return false; // no había números que sustituir
  return [...MARCAS_COMUNES, ...PALABRAS_ENTIDAD_GENERICA].some((palabra) =>
    normalizado.includes(palabra)
  );
}

// Dominios armados con muchos guiones para sonar "oficiales"
// (ej: rrhh-notificaciones-empresa.com) son un patrón típico de sitios falsos;
// una empresa real casi nunca usa 2+ guiones en su dominio principal.
function tieneMuchosGuiones(dominio) {
  const d = dominio || "";
  return (d.match(/-/g) || []).length >= 2;
}

function algunaCoincide(patrones, texto) {
  return patrones.some((p) => p.test(texto));
}

/**
 * Analiza el texto de un correo (y opcionalmente el remitente).
 * Devuelve { puntos, veredicto, etiqueta, color, razones }.
 */
function analizarCorreo(texto, remitente = "") {
  texto = texto || "";
  remitente = remitente || "";
  const textoLower = texto.toLowerCase();

  let puntos = 0;
  const razones = [];

  // 1. Remitente sospechoso: imita marca conocida O usa un dominio genérico
  //    armado para sonar a sorteo/premio/regalo
  let dominio = remitente ? extraerDominio(remitente) : "";
  if (!dominio) {
    const matchFrom = textoLower.match(/(?:de|from)\s*:\s*[^\s<]+@([\w.-]+)/);
    if (matchFrom) dominio = matchFrom[1];
  }
  if (dominio && esTyposquatting(dominio)) {
    puntos += 1;
    razones.push(`Remitente sospechoso: el dominio '${dominio}' imita una marca conocida (+1)`);
  } else if (dominio && esDominioConSustitucionSospechosa(dominio)) {
    puntos += 1;
    razones.push(`Remitente sospechoso: el dominio '${dominio}' usa números para imitar una palabra de confianza como 'banco' (+1)`);
  } else if (dominio && esDominioGenericoSospechoso(dominio)) {
    puntos += 1;
    razones.push(`Remitente sospechoso: el dominio '${dominio}' usa palabras típicas de estafas (premio, sorteo, etc.) (+1)`);
  } else if (dominio && tieneMuchosGuiones(dominio)) {
    puntos += 1;
    razones.push(`Remitente sospechoso: el dominio '${dominio}' tiene varios guiones, un patrón típico de dominios falsos armados para sonar oficiales (+1)`);
  }

  // 2. Urgencia / presión psicológica (incluye cualquier plazo en horas/minutos)
  if (algunaCoincide(FRASES_URGENCIA, textoLower)) {
    puntos += 1;
    razones.push("Lenguaje de urgencia, presión o plazo límite para actuar rápido (+1)");
  }

  // 3. Enlaces sospechosos
  const urls = extraerUrls(texto);
  let enlaceSospechoso = false;
  let enlaceRazon = "";
  for (const url of urls) {
    const host = obtenerHost(url);
    if (ACORTADORES.has(host)) {
      enlaceSospechoso = true; enlaceRazon = "acortador de enlaces"; break;
    }
    if (/^\d{1,3}(\.\d{1,3}){3}/.test(host)) {
      enlaceSospechoso = true; enlaceRazon = "dirección IP en vez de dominio"; break;
    }
    if (esTyposquatting(host)) {
      enlaceSospechoso = true; enlaceRazon = "dominio que imita una marca conocida"; break;
    }
    if (esDominioConSustitucionSospechosa(host)) {
      enlaceSospechoso = true; enlaceRazon = "dominio que usa números para imitar una palabra de confianza"; break;
    }
    if (esDominioGenericoSospechoso(host)) {
      enlaceSospechoso = true; enlaceRazon = "dominio con palabras típicas de estafas"; break;
    }
    if (tieneMuchosGuiones(host)) {
      enlaceSospechoso = true; enlaceRazon = "dominio con varios guiones, poco común en sitios oficiales"; break;
    }
  }
  if (enlaceSospechoso) {
    puntos += 1;
    razones.push(`Enlace sospechoso: ${enlaceRazon} (+1)`);
  }

  // 4. Solicitud de datos sensibles
  if (algunaCoincide(FRASES_DATOS_SENSIBLES, textoLower)) {
    puntos += 1;
    razones.push("Solicita información sensible (contraseñas, tarjetas, datos de pago, etc.) (+1)");
  }

  // 5. Saludo genérico
  if (algunaCoincide(SALUDOS_GENERICOS, textoLower)) {
    puntos += 1;
    razones.push("Saludo genérico, no personalizado con tu nombre (+1)");
  }

  // 6. Frases forzadas típicas de traducción automática
  if (algunaCoincide(ERRORES_COMUNES, textoLower)) {
    puntos += 1;
    razones.push("Frases forzadas o gramática típica de campañas automatizadas (+1)");
  }

  // 7. Exceso de mayúsculas / exclamaciones
  const exclamaciones = (texto.match(/!/g) || []).length;
  const mayusculas = (texto.match(/\b[A-ZÁÉÍÓÚÑ]{4,}\b/g) || []).length;
  if (exclamaciones >= 3 || mayusculas >= 2) {
    puntos += 1;
    razones.push("Uso excesivo de mayúsculas o signos de exclamación (+1)");
  }

  // 8. Premio / sorteo / ganancia inesperada (clásico "has ganado un iPhone")
  if (algunaCoincide(FRASES_PREMIO_GANADOR, textoLower)) {
    puntos += 1;
    razones.push("Anuncia un premio, sorteo o ganancia inesperada que no solicitaste (+1)");
  }

  // 9. Fraude de anticipo: pedir un pago pequeño para "liberar" algo grande
  if (algunaCoincide(FRASES_PAGO_ANTICIPADO, textoLower)) {
    puntos += 1;
    razones.push("Pide un pago o cuota por adelantado para recibir algo (típico de estafas de anticipo) (+1)");
  }

  // Veredicto según puntaje
  let veredicto, etiqueta, color;
  if (puntos <= 1) {
    veredicto = "no_es"; etiqueta = "No es phishing"; color = "verde";
  } else if (puntos <= 3) {
    veredicto = "es_posible"; etiqueta = "Es posible"; color = "amarillo";
  } else {
    veredicto = "es_phishing"; etiqueta = "Es phishing"; color = "rojo";
  }

  if (razones.length === 0) {
    razones.push("No se detectaron señales típicas de phishing en el texto analizado");
  }

  return { puntos, veredicto, etiqueta, color, razones };
}