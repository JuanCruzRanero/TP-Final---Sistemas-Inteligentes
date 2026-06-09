import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  // Estados para manejar el texto del input, el historial de la charla y si el bot está pensando
  const [mensaje, setMensaje] = useState('')
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(false)

  const enviarMensaje = async (e) => {
    e.preventDefault() // Evita que la página se recargue al mandar el formulario
    if (!mensaje.trim()) return

    // 1. Agregamos lo que escribió el usuario al chat
    const nuevoHistorial = [...historial, { rol: 'usuario', texto: mensaje }]
    setHistorial(nuevoHistorial)
    setMensaje('')
    setCargando(true)

    try {
      // Le pegamos a tu servidor mandándole también el historial!
      const respuesta = await axios.post('http://localhost:8000/entrevista', {
        mensaje: mensaje,
        dificultad: "Trainee",
        historial: historial // <--- Mandamos la memoria por el caño
      })

      setHistorial([...nuevoHistorial, { rol: 'bot', texto: respuesta.data.respuesta }])
    } catch (error) {
      console.error("Error al conectar con el backend", error)
      setHistorial([...nuevoHistorial, { rol: 'bot', texto: "Error: No me pude conectar con el backend, fijate si Uvicorn está corriendo." }])
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="contenedor-chat">
      <h1>Simulador de Entrevistas</h1>
      
      <div className="caja-mensajes">
        {historial.length === 0 && (
          <div className="mensaje bot">
            <p>¡Hola! Soy tu entrevistador técnico. ¿Empezamos?</p>
          </div>
        )}
        
        {historial.map((msg, index) => (
          <div key={index} className={`mensaje ${msg.rol}`}>
            <p>{msg.texto}</p>
          </div>
        ))}
        
        {cargando && (
          <div className="mensaje bot pensando">
            <p>Analizando respuesta...</p>
          </div>
        )}
      </div>

      <form onSubmit={enviarMensaje} className="formulario">
        <input
          type="text"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Escribí tu respuesta acá..."
          disabled={cargando}
        />
        <button type="submit" disabled={cargando}>Enviar</button>
      </form>
    </div>
  )
}

export default App