"""Recordatorios proactivos al arrancar, según el estado emocional y los hábitos."""
import emociones
import eva
import may_memory

def al_arrancar():
    """Texto sereno para mostrar al inicio, o cadena vacía si no hace falta."""
    partes = []
    recents = emociones.recientes(24)
    if recents:
        negativas = [e for e in recents if e.get("emocion") in emociones.NEGATIVAS]
        alta = [e for e in recents if e.get("intensidad", 0) >= 3 and e.get("emocion") in emociones.NEGATIVAS]
        dominan = len(negativas) >= max(1, (len(recents) + 1) // 2)
        if dominan or alta:
            nombres = ", ".join(e.get("nombre", e.get("emocion", "")) for e in negativas[-3:])
            partes.append(
                f"Hoy te quiero acompañar con calma: en las últimas horas anotaste {nombres}. "
                "Estoy aquí contigo, sin prisa."
            )
            if any(
                e.get("intensidad") == 3 and e.get("emocion") in {"tristeza", "miedo"}
                for e in recents
            ):
                partes.append(emociones.AVISO_AYUDA)

    historia = may_memory.cargar()
    tiene_historia = bool(
        historia.get("habitos") or historia.get("emociones") or historia.get("notas")
    )
    if eva.hay_habito_hoy():
        lista = ", ".join(h["habito"] for h in eva.habitos_de_hoy())
        partes.append(f"Hoy ya has apuntado: {lista}.")
    elif tiene_historia:
        partes.append(
            "Todavía no hay ningún hábito anotado hoy. Cuando puedas, lo apuntamos juntos: habito …"
        )

    # Cierre en tono sereno y, si hubo algo difícil, un gesto en positivo.
    if recents and any(e.get("emocion") in emociones.NEGATIVAS for e in recents):
        partes.append("Si quieres, podemos charlar, anotar cómo te sientes o jugar un rato suave.")
    return "\n".join(partes)
