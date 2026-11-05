#!/usr/bin/env python3
"""MAY Core · núcleo binario — prototipo educativo.
Idea original: Pedro Sánchez Gómez (apuntes a mano). SIMULACIÓN: sin bancos ni tarjetas reales."""
import hashlib, json, sys

# (b) binario -> intensidad -> caracter
UNIT_MA = 0.5  # peso del bit i = 0.5 * 2^i mA (reversible)
def char_to_ma(c):
    b = ord(c) & 0xFF
    return sum(UNIT_MA * (1 << i) for i in range(8) if b >> i & 1)
def ma_to_char(ma):
    return chr(int(round(ma / UNIT_MA)))
def encode(text):
    return [(c, format(ord(c) & 0xFF, "08b"), char_to_ma(c)) for c in text]
def decode(mas):
    return "".join(ma_to_char(m) for m in mas)

# (a) mosaico 3 capas: rojo=capa1, azul=capa2, amarillo=capa3
LAYERS = [("rojo", (255, 0, 0)), ("azul", (0, 0, 255)), ("amarillo", (255, 255, 0))]
def text_to_cells(text):
    bits = "".join(format(ord(c) & 0xFF, "08b") for c in text)
    bits += "0" * (-len(bits) % 3)
    return [tuple(int(x) for x in bits[i:i+3]) for i in range(0, len(bits), 3)]
def cell_color(cell):
    on = [LAYERS[i][1] for i in range(3) if cell[i]]
    if not on: return (20, 20, 20)  # "pintura electrónica negra"
    return tuple(sum(c[k] for c in on) // len(on) for k in range(3))
def camera_read(colors):
    # lector de color: deduce capas activas buscando la combinación más cercana
    table = {cell_color((a, b, c)): (a, b, c) for a in (0, 1) for b in (0, 1) for c in (0, 1)}
    out = []
    for col in colors:
        best = min(table, key=lambda t: sum((t[k]-col[k])**2 for k in range(3)))
        out.append(table[best])
    return out
def cells_to_text(cells, n):
    bits = "".join(str(b) for c in cells for b in c)[:n*8]
    return "".join(chr(int(bits[i:i+8], 2)) for i in range(0, len(bits), 8))
def write_png(text, path, cols=8, size=40):
    cells = text_to_cells(text)
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("Pillow no instalado: no se genera PNG"); return cells
    rows = -(-len(cells) // cols)
    W = cols * size
    img = Image.new("RGB", (W * 4 + 30, rows * size + 30), "white")
    d = ImageDraw.Draw(img)
    titles = ["capa 1 rojo", "capa 2 azul", "capa 3 amarillo", "mosaico"]
    for p in range(4):
        x0 = p * (W + 10); d.text((x0 + 2, 2), titles[p], fill="black")
        for i, c in enumerate(cells):
            x, y = x0 + (i % cols) * size, 15 + (i // cols) * size
            col = cell_color(c) if p == 3 else (LAYERS[p][1] if c[p] else (20, 20, 20))
            d.rectangle([x, y, x+size-2, y+size-2], fill=col)
    img.save(path); return cells

# (c) libro mayor de dinero binario (simulación)
def ledger(origins, bank="Sabadell (simulado)", tax_rate=0.0, dest="Pedro Sánchez (destino)"):
    chain, prev = [], "0" * 16
    def rec(frm, to, amt):
        nonlocal prev
        r = {"de": frm, "a": to, "importe": amt, "binario": format(int(amt * 100), "b"), "prev": prev}
        prev = hashlib.sha256(json.dumps(r, sort_keys=True).encode()).hexdigest()[:16]
        r["hash"] = prev; chain.append(r)
    for i, a in enumerate(origins, 1): rec(f"origen {i}", "beb hub", a)
    total = sum(origins); rec("beb hub", bank, total)
    tax = round(total * tax_rate, 2); rec(bank, "Hacienda (simulada)", total)
    rec("Hacienda (simulada)", dest, total - tax)
    return chain, total, tax

# (d) pago movil -> tienda (concepto)
def payment(amount, holder="TITULAR DEMO", bank="BANCO DEMO"):
    token = "tok_" + hashlib.sha256(f"{holder}{amount}".encode()).hexdigest()[:12]
    screen = {"titular": holder, "tarjeta": "**** **** **** 0000 (token)", "banco": bank, "importe": f"{amount} €"}
    return {"movil": screen | {"estado": "OK"}, "tienda": screen | {"estado": "OK"}, "token": token,
            "nota": "Concepto: real = tokenización + EMV + SCA (PSD2)"}

def demo():
    msg = "OSNEWS"
    print("== (b) Codificador binario -> mA -> letra ==")
    enc = encode(msg)
    for c, b, ma in enc: print(f"  {c}  {b}  -> {ma:6.1f} mA")
    print("  decodificado:", decode([m for _, _, m in enc]))
    print("== (a) Chip water: mosaico 3 capas ==")
    cells = write_png(msg, "mosaico_osnews.png")
    read = camera_read([cell_color(c) for c in cells])
    print(f"  {len(cells)} celdas; PNG: mosaico_osnews.png; cámara lee: {cells_to_text(read, len(msg))}")
    print("== (c) Libro mayor (simulación) ==")
    chain, total, tax = ledger([5000, 500, 1000, 20000], tax_rate=0.10)
    for r in chain: print(f"  {r['de']:>20} -> {r['a']:<24} {r['importe']:>9}  bin={r['binario']}  #{r['hash']}")
    print(f"  total={total} (la hoja anota 2650), retención ficticia 10%={tax}, a destino={total-tax}")
    print("== (d) Pago móvil -> tienda (concepto) ==")
    print(" ", json.dumps(payment(90), ensure_ascii=False))

if __name__ == "__main__":
    demo()
