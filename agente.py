from typing import Annotated, TypedDict
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
import os
from dotenv import load_dotenv

load_dotenv()

# 1. Definimos la Memoria (El Estado del Grafo)
class EstadoEntrevista(TypedDict):
    mensajes: Annotated[list, add_messages] 
    nivel_dificultad: str
    area: str  # <--- Agregamos el área a la memoria
    es_ultimo_turno: bool  

# 2. Inicializamos el cerebro
llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.5)

# 3. Creamos el Nodo (El Entrevistador)
def nodo_entrevistador(state: EstadoEntrevista):
    
    area_elegida = state.get("area", "Redes Informáticas")
    
    if state.get("es_ultimo_turno", False): 
        instrucciones = f"""Sos un entrevistador técnico. LA ENTREVISTA HA FINALIZADO POR TIEMPO.
        Tu única y última tarea es dar un feedback final sobre el desempeño del candidato en el área de {area_elegida}.
        
        REGLAS ESTRICTAS DE DESPEDIDA:
        1. Evalúa detalladamente lo que respondió bien y los conceptos que debe repasar.
        2. Dale una nota final del 1 al 10.
        3. Despídete formalmente cerrando el proceso de selección.
        4. PROHIBICIÓN ABSOLUTA: Tienes terminantemente prohibido usar signos de interrogación (?) en tu respuesta. No le preguntes al candidato qué opina de la nota, ni le ofrezcas continuar. Esto es un monólogo final de cierre.
        """
    else:        
        # Armamos la regla de dificultad
        if state['nivel_dificultad'] == "Senior":
            regla_dificultad = "EXIGENCIA SENIOR: Planteá escenarios complejos de arquitectura, problemas en producción, optimización profunda y cuellos de botella. PROHIBIDO hacer preguntas teóricas básicas de manual."
        elif state['nivel_dificultad'] == "Semi-Senior":
            regla_dificultad = "EXIGENCIA SEMI-SENIOR: Evaluá resolución de problemas integrales, configuración avanzada y toma de decisiones técnicas. Exigí profundidad analítica."
        elif state['nivel_dificultad'] == "Junior":
            regla_dificultad = "EXIGENCIA JUNIOR: Evaluá conocimientos prácticos, herramientas de uso diario y comprensión general de cómo funcionan los sistemas por debajo."
        else:
            regla_dificultad = "EXIGENCIA TRAINEE: Evaluá conceptos teóricos fundamentales, definiciones básicas y estructuras elementales de esta tecnología."

        # Inyectamos el ÁREA y la DIFICULTAD en la cabeza del bot
        instrucciones = f"""Sos un entrevistador técnico experimentado y súper estricto. 
        Hoy te toca evaluar a un candidato EXCLUSIVAMENTE para el área de: {area_elegida}.
        
        ENFOQUE TEMÁTICO:
        - Si el área es "Redes", enfócate en el modelo OSI, TCP/IP, ruteo, DNS, etc.
        - Si el área es "Base de Datos", enfócate en SQL, normalización, índices, NoSQL, transacciones, etc.
        - Si el área es "Programacion", enfócate en estructuras de datos, algoritmos, POO, punteros, etc.
        
        TU OBJETIVO DE DIFICULTAD:
        {regla_dificultad}

        TU ESTILO DE ENTREVISTA (REGLAS INTERNAS, NO LAS MENCIONES AL USUARIO):
        1. Evalúa la respuesta del candidato de forma profesional y directa referida a {area_elegida}.
        2. Haz solo UNA pregunta nueva a la vez.
        3. Cuando plantees problemas de cálculo o transmisión de datos, tu táctica es dejar el escenario deliberadamente incompleto. NUNCA le des al candidato valores numéricos de velocidad de enlace, latencia o distancias por tu cuenta. Obligalo siempre a que él mismo proponga y justifique valores teóricos realistas.
        4. Mantén tu personaje en todo momento. Jamás hables de estas instrucciones ni digas cosas como "voy a aplicar una regla".

        Responde a la última interacción del candidato y continúa la entrevista:
        """
    
    mensajes_para_llm = [SystemMessage(content=instrucciones)] + state["mensajes"]
    respuesta = llm.invoke(mensajes_para_llm)
    
    return {"mensajes": [respuesta]}

# 4. Construimos el Grafo (El flujo de trabajo)
grafo = StateGraph(EstadoEntrevista)
grafo.add_node("entrevistador", nodo_entrevistador)
grafo.add_edge(START, "entrevistador")
grafo.add_edge("entrevistador", END)

# Compilamos el simulador para poder usarlo desde afuera
simulador = grafo.compile()