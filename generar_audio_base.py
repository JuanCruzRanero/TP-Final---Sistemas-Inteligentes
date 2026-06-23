import asyncio
import edge_tts

# El mismo texto de prueba para que la IA le dibuje bien los labios
texto_base = "Bueno, contame un poco más sobre tu experiencia. Mmm, me parece interesante lo que decís. Contame más, por favor. Sí, seguí."
voz_argentina = "es-AR-TomasNeural"
archivo_salida = "audio_base.mp3"

async def generar_audio_masculino():
    print("Invocando a Tomás para grabar el audio base...")
    comunicador = edge_tts.Communicate(texto_base, voz_argentina)
    await comunicador.save(archivo_salida)

# Ejecutamos la magia
if __name__ == "__main__":
    asyncio.run(generar_audio_masculino())