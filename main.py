from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage
from agente import simulador 

# --- NUEVAS LIBRERÍAS PARA EL AUDIO ---
# Arriba de todo, cambiá la importación de gTTS por estas:
import io
import base64
import asyncio
import edge_tts
# --------------------------------------

app = FastAPI(title="Simulador de Entrevistas Técnicas")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MensajeUsuario(BaseModel):
    mensaje: str
    dificultad: str = "Trainee"
    historial: list = [] 

@app.post("/entrevista")
def charlar_con_agente(datos: MensajeUsuario):
    # 1. Traducimos el historial
    mensajes_langchain = []
    for msg in datos.historial:
        if msg["rol"] == "usuario":
            mensajes_langchain.append(HumanMessage(content=msg["texto"]))
        elif msg["rol"] == "bot":
            mensajes_langchain.append(AIMessage(content=msg["texto"]))
            
    mensajes_langchain.append(HumanMessage(content=datos.mensaje))

    # 2. Lógica del semáforo para cortar la charla
    cantidad_turnos_totales = len(mensajes_langchain)
    llegamos_al_limite = cantidad_turnos_totales >= 5 

    estado_entrada = {
        "mensajes": mensajes_langchain,
        "nivel_dificultad": datos.dificultad,
        "es_ultimo_turno": llegamos_al_limite 
    }
    
    # 3. Invocamos al cerebro de Groq
    resultado = simulador.invoke(estado_entrada)
    respuesta_bot = resultado["mensajes"][-1].content
    
    async def generar_audio_masculino(texto):
        comunicador = edge_tts.Communicate(texto, "es-AR-TomasNeural", rate="+40%")
        audio_data = b""
        async for chunk in comunicador.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
        return audio_data

    # Ejecutamos la magia y lo convertimos a Base64
    audio_bytes = asyncio.run(generar_audio_masculino(respuesta_bot))
    audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
    # -----------------------------

    return {
        "dificultad_evaluada": datos.dificultad,
        "respuesta": respuesta_bot,
        "audio": audio_base64
    }