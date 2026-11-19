const SUSTANCIAS = [
  "alcohol","cocaína","cannabis","heroína/opiáceos","fentanilo","metadona",
  "anfetaminas","MDMA","metanfetamina","benzodiacepinas","ketamina","cannabinoides sintéticos"
];

function el(id){ return document.getElementById(id); }

function montar() {
  const box = el("sustancias");
  box.innerHTML = "";
  for (const s of SUSTANCIAS) {
    const lab = document.createElement("label");
    lab.setAttribute("for", "s-" + s);
    lab.textContent = s;
    const sel = document.createElement("select");
    sel.id = "s-" + s;
    for (const v of ["no analizado","negativo","positivo"]) {
      const o = document.createElement("option");
      o.value = v; o.textContent = v;
      sel.appendChild(o);
    }
    box.appendChild(lab);
    box.appendChild(sel);
  }
  const f = el("fecha");
  if (f && !f.value) f.value = new Date().toISOString().slice(0,10);
}

function payload() {
  const resultados = {};
  for (const s of SUSTANCIAS) {
    const n = el("s-" + s);
    resultados[s] = n ? n.value : "no analizado";
  }
  return {
    formato: "may-sobria-sensor",
    version: 1,
    aviso: "concepto, sin dispositivo real. Identidad profesional no verificada criptográficamente (sin servidor).",
    origen: "profesional",
    profesional: {
      centro: el("centro").value.trim(),
      nombre: el("nombre").value.trim(),
      colegiado: el("colegiado").value.trim()
    },
    muestras: [{
      fecha: el("fecha").value || new Date().toISOString().slice(0,10),
      tipo: el("tipo").value,
      resultados,
      nota: el("nota").value.trim()
    }]
  };
}

function codigoDe(p) {
  const raw = new TextEncoder().encode(JSON.stringify(p));
  let bin = "";
  raw.forEach((b) => bin += String.fromCharCode(b));
  return "MAY1:" + btoa(bin);
}

el("generar").addEventListener("click", () => {
  if (!el("centro").value.trim() && !el("nombre").value.trim()) {
    alert("Indica al menos el centro o el nombre del profesional.");
    return;
  }
  const p = payload();
  const codigo = codigoDe(p);
  el("json").textContent = JSON.stringify(p, null, 2);
  el("codigo").value = codigo;
  el("salida").classList.remove("hide");
  const q = el("qrcode");
  q.innerHTML = "";
  if (window.QRCode) {
    try { new QRCode(q, { text: codigo, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.L }); }
    catch (e) { q.textContent = "No he podido dibujar el QR; usa el código de texto."; }
  } else {
    q.textContent = "No está disponible el generador de QR; usa el código de texto o el JSON.";
  }
  el("salida").scrollIntoView({ behavior: "smooth" });
});

el("copiar").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(el("codigo").value);
    el("copiar").textContent = "Copiado";
    setTimeout(() => el("copiar").textContent = "Copiar código", 1500);
  } catch (e) {
    el("codigo").select();
  }
});

el("descargar").addEventListener("click", () => {
  const blob = new Blob([el("json").textContent], { type: "application/json;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "may-prueba-profesional.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

el("limpiar").addEventListener("click", () => {
  ["centro","nombre","colegiado","nota"].forEach((id) => { el(id).value = ""; });
  montar();
  el("salida").classList.add("hide");
});

montar();
