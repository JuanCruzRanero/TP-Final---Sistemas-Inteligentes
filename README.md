# TP-Final---Sistemas-Inteligentes
Trabajo Final de la materia Sistemas Inteligentes, dictada en Universidad Nacional de Luján dentro de la carrera Licenciatura en Sistemas de Información.

Alumno: Ranero, Juan Cruz.
Legajo: 187844.

# ¿Cómo correr el proyecto?

1. Requisitos previos
- Git.
- Python 3.10 o superior.
- Node.js (versión LTS).

2. Clonar el Repositorio de GitHub

git clone link_del_repo

cd carpetaDelProyecto

3. Crear un archivo .env en la carpeta principal del proyectp y pegar lo indicado por correo (la API_KEY)

4. Configurar el Backend (Python)
- En una terminal nueva (Terminal 1, de ahora en más), crear y activar el entorno virtual, y luego instalar las dependencias. Todo esto debe hacerse con los siguientes comandos:

python -m venv entorno_tp

.\entorno_tp\Scripts\activate

(con entorno_tp ya activo, instalar lo siguiente)

pip install fastapi uvicorn groq edge-tts python-dotenv pydantic langchain-core langchain-groq langgraph

5. Configurar el Frontend (React + Vite)
- En una nueva terminal (Terminal 2, de acá en más), instalar las dependencias visuales de la interfaz de React con los siguientes comandos:

cd frontend-simulador

npm install

npm install axios

6. Levantar los Servicios en Simultáneo
- Para iniciar el simulador, se necesitan las dos terminales corriendo al mismo tiempo.

Terminal 1 (Backend) -> (entorno_tp)> uvicorn main:app --reload

El sistema avisará que está escuchando en localhost.

Terminal 2 (Frontend) -> npm run dev

Vite iniciará la web. Presionar Ctrl + Clic sobre el enlace local que aparece en consola (normalmente http://localhost:5173).

7. Apagar los servicios para su finalización

Para liberar los puertos correctamente al finalizar:

- Terminal 2 (Frontend): Ctrl + C. Si pregunta "¿Desea terminar el trabajo en lote?", presionar S y Enter.
- Terminal 1 (Backend): Ctrl + C para detener el servicio y tomar el control de la consola. Para apagar el entorno virtual, ejecutar: (entorno_tp)> deactivate