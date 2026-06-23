import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // Estados generales
  const [mensaje, setMensaje] = useState('');
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [dificultad, setDificultad] = useState('Trainee');
  
  // NUEVO: Estado para bloquear todo al terminar
  const [entrevistaTerminada, setEntrevistaTerminada] = useState(false);

  // Referencias para el DOM y la multimedia
  const videoRef = useRef(null);
  const finalDelChatRef = useRef(null);
  const audioRef = useRef(null); // NUEVO: Guardamos el audio para poder cortarlo

  // Manejador del Enter
  const manejarTecla = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); 
      enviarMensaje(e); // Le pasamos el evento
    }
  };

  // Autoscroll
  useEffect(() => {
    finalDelChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historial]);

  // Función para callar al Míster a la fuerza
  const saltearRespuesta = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0; 
    }
  };

  const enviarMensaje = async (e) => {
    if (e) e.preventDefault(); // Por si viene del formulario
    if (!mensaje.trim()) return;

    // Si había un audio reproduciéndose, lo cortamos antes de mandar el nuevo mensaje
    saltearRespuesta();

    const nuevoHistorial = [...historial, { rol: 'usuario', texto: mensaje }];
    setHistorial(nuevoHistorial);
    setMensaje('');
    setCargando(true);

    try {
      const respuesta = await axios.post('http://localhost:8000/entrevista', {
        mensaje: mensaje,
        dificultad: dificultad,
        historial: historial 
      });

      const textoBot = respuesta.data.respuesta;
      setHistorial([...nuevoHistorial, { rol: 'bot', texto: textoBot }]);

      // Revisamos si el bot tiró la nota final (buscando un "/10")
      if (textoBot.includes('/10') || textoBot.toLowerCase().includes('nota final')) {
        setEntrevistaTerminada(true);
      }

      if (respuesta.data.audio) {
        const sonidoMagico = `data:audio/mp3;base64,${respuesta.data.audio}`;
        
        // Guardamos el audio en la referencia en vez de una variable suelta
        audioRef.current = new Audio(sonidoMagico);
        
        audioRef.current.onplay = () => {
          if (videoRef.current) {
            videoRef.current.play();
          }
        };

        audioRef.current.onended = () => {
          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0; 
          }
        };

        audioRef.current.play();
      }

    } catch (error) {
      console.error("Error al comunicarse con el bot:", error);
      setHistorial([...nuevoHistorial, { rol: 'bot', texto: 'Se cortó la conexión, fiera. Revisá el backend.' }]);
    } finally {
      setCargando(false); 
    }
  };

  return (
    <div className="contenedor-chat">
      <h1>Simulador de Entrevistas</h1>

      {/* --- SELECTOR DE DIFICULTAD --- */}
      <div style={{ marginBottom: '15px', textAlign: 'center' }}>
        <label style={{ color: 'white', marginRight: '10px' }}>Nivel del candidato:</label>
        <select 
          value={dificultad} 
          onChange={(e) => setDificultad(e.target.value)}
          disabled={historial.length > 0} // SE BLOQUEA CON EL PRIMER MENSAJE
          style={{ padding: '5px', borderRadius: '5px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
        >
          <option value="Trainee">Trainee</option>
          <option value="Junior">Junior</option>
          <option value="Semi-Senior">Semi-Senior</option>
          <option value="Senior">Senior</option>
        </select>
      </div>

      {/* --- AVATAR DEL MÍSTER --- */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <div style={{
            width: '200px', 
            height: '200px', 
            borderRadius: '50%', 
            border: '4px solid #00f0ff', 
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.5)',
            overflow: 'hidden', 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
          <video 
            ref={videoRef}
            src="/video_indio.mp4" 
            loop 
            muted 
            style={{
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              transform: 'scale(1.5)' 
            }}
          />
        </div>
      </div>

      {/* --- CAJA DE HISTORIAL --- */}
      <div className="caja-mensajes">
        {historial.length === 0 && (
          <div className="mensaje bot">
            <p>¡Hola! Soy tu entrevistador técnico. ¿Empezamos?</p>
          </div>
        )}
        
        <div className="contenedor-mensajes">
          {historial.map((msg, index) => (
            <div key={index} className={`mensaje ${msg.rol}`}>
              <p>{msg.texto}</p>
            </div>
          ))}
          <div ref={finalDelChatRef} /> 
        </div>
        
        {cargando && (
          <div className="mensaje bot pensando">
            <p>Analizando respuesta...</p>
          </div>
        )}
      </div>

      {/* --- FORMULARIO Y CAJA DE TEXTO --- */}
      <form onSubmit={enviarMensaje} className="formulario" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          onKeyDown={manejarTecla} 
          disabled={entrevistaTerminada || cargando} // Se bloquea si termina o si está pensando
          placeholder={entrevistaTerminada ? "Entrevista finalizada." : "Escribí tu respuesta acá..."}
          rows={3} 
          style={{
            width: '100%',
            minHeight: '60px',
            maxHeight: '140px', 
            resize: 'none', 
            overflowY: 'auto', 
            padding: '10px',
            borderRadius: '8px',
            fontFamily: 'inherit',
            fontSize: '16px',
          }}
        />
        
        {/* BOTONERA */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            onClick={saltearRespuesta} 
            disabled={cargando}
            style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}
          >
            Cortar Audio
          </button>
          
          <button 
            type="submit" 
            disabled={cargando || entrevistaTerminada}
            style={{ backgroundColor: '#00f0ff', color: 'black', fontWeight: 'bold', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;