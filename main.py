from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage
from agente import simulador 

import io
import base64
import asyncio
import edge_tts

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
    area: str
    historial: list = [] 

@app.post("/entrevista")
def charlar_con_agente(datos: MensajeUsuario):
    # Traducción del historial
    mensajes_langchain = []
    for msg in datos.historial:
        if msg["rol"] == "usuario":
            mensajes_langchain.append(HumanMessage(content=msg["texto"]))
        elif msg["rol"] == "bot":
            mensajes_langchain.append(AIMessage(content=msg["texto"]))
            
    mensajes_langchain.append(HumanMessage(content=datos.mensaje))

    # Cortar la entrevista si llegamos al límite de turnos
    cantidad_turnos_totales = len(mensajes_langchain)
    llegamos_al_limite = cantidad_turnos_totales >= 5 

    estado_entrada = {
        "mensajes": mensajes_langchain,
        "nivel_dificultad": datos.dificultad,
        "area": datos.area,
        "es_ultimo_turno": llegamos_al_limite 
    }
    
    # Invoco al cerebro de Groq
    resultado = simulador.invoke(estado_entrada)
    respuesta_bot = resultado["mensajes"][-1].content
    
    async def generar_audio_masculino(texto):
        comunicador = edge_tts.Communicate(texto, "es-AR-TomasNeural", rate="+50%")
        audio_data = b""
        async for chunk in comunicador.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
        return audio_data

    # Ejecuto y convierto a Base64
    audio_bytes = asyncio.run(generar_audio_masculino(respuesta_bot))
    audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')

    return {
        "dificultad_evaluada": datos.dificultad,
        "respuesta": respuesta_bot,
        "audio": audio_base64
    }