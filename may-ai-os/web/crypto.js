/* Cifrado local: PBKDF2-SHA256 (200000) + AES-GCM. El PIN no se guarda. */
const MAY_CRYPTO = (() => {
  const ITER = 200000;
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  function b64(buf) {
    const bytes = new Uint8Array(buf);
    let s = "";
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }
  function unb64(str) {
    const s = atob(str);
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
    return bytes;
  }
  async function derivar(pin, salt) {
    const material = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }
  async function cifrar(pin, objeto, saltPrev) {
    const salt = saltPrev || crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await derivar(pin, salt);
    const cifrado = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode(JSON.stringify(objeto))
    );
    return {
      v: 1,
      alg: "PBKDF2-SHA256-AES-GCM",
      iter: ITER,
      salt: b64(salt),
      iv: b64(iv),
      data: b64(cifrado),
    };
  }
  async function descifrar(pin, paquete) {
    if (!paquete || !paquete.salt || !paquete.iv || !paquete.data) {
      throw new Error("archivo no reconocido");
    }
    const salt = unb64(paquete.salt);
    const iv = unb64(paquete.iv);
    const key = await derivar(pin, salt);
    try {
      const plano = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, unb64(paquete.data));
      return { datos: JSON.parse(dec.decode(plano)), salt };
    } catch (e) {
      const err = new Error("PIN incorrecto");
      err.codigo = "PIN";
      throw err;
    }
  }
  return { cifrar, descifrar, b64, unb64 };
})();
