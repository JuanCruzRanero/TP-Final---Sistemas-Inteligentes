from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage
from agente import simulador 

app = FastAPI(title="Simulador de Entrevistas Técnicas")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Agregamos el historial al paquete de datos que esperamos recibir
class MensajeUsuario(BaseModel):
    mensaje: str
    dificultad: str = "Trainee"
    historial: list = [] # <--- Magia nueva

@app.post("/entrevista")
def charlar_con_agente(datos: MensajeUsuario):
    mensajes_langchain = []
    for msg in datos.historial:
        if msg["rol"] == "usuario":
            mensajes_langchain.append(HumanMessage(content=msg["texto"]))
        elif msg["rol"] == "bot":
            mensajes_langchain.append(AIMessage(content=msg["texto"]))
            
    mensajes_langchain.append(HumanMessage(content=datos.mensaje))

    # ---- ACÁ ESTÁ LA MAGIA ----
    # Contamos la cantidad de intercambios (cada par usuario-bot cuenta como 1 turno)
    # Por ejemplo: si el historial tiene 4 mensajes (2 tuyos, 2 del bot), y ahora mandás el 3ero tuyo, 
    # la longitud total de 'mensajes_langchain' sería 5.
    cantidad_turnos_totales = len(mensajes_langchain)
    
    # Si consideramos que la charla se tiene que cortar al 3er o 5to mensaje en total, lo definimos acá:
    llegamos_al_limite = cantidad_turnos_totales >= 5 
    # ---------------------------

    estado_entrada = {
        "mensajes": mensajes_langchain,
        "nivel_dificultad": datos.dificultad,
        "es_ultimo_turno": llegamos_al_limite # Le pasamos el semáforo al agente
    }
    
    resultado = simulador.invoke(estado_entrada)
    respuesta_bot = resultado["mensajes"][-1].content
    
    return {
        "dificultad_evaluada": datos.dificultad,
        "respuesta": respuesta_bot
    }