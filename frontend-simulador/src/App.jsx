import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // Estados generales
  const [mensaje, setMensaje] = useState('');
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [dificultad, setDificultad] = useState('Trainee');
  
  // NUEVOS ESTADOS: Para controlar el área y el flujo de pantallas
  const [area, setArea] = useState('Redes');
  const [entrevistaIniciada, setEntrevistaIniciada] = useState(false);
  const [entrevistaTerminada, setEntrevistaTerminada] = useState(false);

  // Referencias para el DOM y la multimedia
  const videoRef = useRef(null);
  const finalDelChatRef = useRef(null);
  const audioRef = useRef(null);

  // Manejador del Enter
  const manejarTecla = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); 
      enviarMensaje(e);
    }
  };

  // Autoscroll
  useEffect(() => {
    if (entrevistaIniciada) {
      finalDelChatRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [historial, entrevistaIniciada]);

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

  // NUEVA FUNCIÓN: Para resetear todo y volver a elegir área
  const reiniciarEntrevista = () => {
    saltearRespuesta();
    setHistorial([]);
    setMensaje('');
    setEntrevistaTerminada(false);
    setEntrevistaIniciada(false);
  };

  const enviarMensaje = async (e) => {
    if (e) e.preventDefault();
    if (!mensaje.trim()) return;

    saltearRespuesta();

    const nuevoHistorial = [...historial, { rol: 'usuario', texto: mensaje }];
    setHistorial(nuevoHistorial);
    setMensaje('');
    setCargando(true);

    try {
      const respuesta = await axios.post('http://localhost:8000/entrevista', {
        mensaje: mensaje,
        dificultad: dificultad,
        area: area, // LE MANDAMOS EL ÁREA AL BACKEND
        historial: historial 
      });

      const textoBot = respuesta.data.respuesta;
      setHistorial([...nuevoHistorial, { rol: 'bot', texto: textoBot }]);

      if (textoBot.includes('/10') || textoBot.toLowerCase().includes('nota final')) {
        setEntrevistaTerminada(true);
      }

      if (respuesta.data.audio) {
        const sonidoMagico = `data:audio/mp3;base64,${respuesta.data.audio}`;
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

      {/* PANTALLA 1: CONFIGURACIÓN INICIAL (Si la entrevista NO inició) */}
      {!entrevistaIniciada ? (
        <div style={{ 
          backgroundColor: '#222', 
          padding: '30px', 
          borderRadius: '12px', 
          textAlign: 'center', 
          border: '1px solid #444',
          marginTop: '20px'
        }}>
          <h2 style={{ color: '#00f0ff', marginBottom: '20px' }}>Prepará tu examen</h2>
          
          {/* Selector de Nivel */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: 'white', marginRight: '10px', display: 'block', marginBottom: '8px' }}>Nivel del Candidato:</label>
            <select 
              value={dificultad} 
              onChange={(e) => setDificultad(e.target.value)}
              style={{ padding: '10px', width: '200px', borderRadius: '5px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
            >
              <option value="Trainee">Trainee</option>
              <option value="Junior">Junior</option>
              <option value="Semi-Senior">Semi-Senior</option>
              <option value="Senior">Senior</option>
            </select>
          </div>

          {/* Selector de Área */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{ color: 'white', marginRight: '10px', display: 'block', marginBottom: '8px' }}>Área Tecnológica:</label>
            <select 
              value={area} 
              onChange={(e) => setArea(e.target.value)}
              style={{ padding: '10px', width: '200px', borderRadius: '5px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
            >
              <option value="Redes">Redes Informáticas</option>
              <option value="Base de Datos">Base de Datos</option>
              <option value="Programacion">Programación</option>
            </select>
          </div>

          <button 
            onClick={() => setEntrevistaIniciada(true)}
            style={{ backgroundColor: '#00f0ff', color: 'black', fontWeight: 'bold', border: 'none', padding: '12px 30px', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}
          >
            Comenzar Entrevista
          </button>
        </div>
      ) : (
        
        /* PANTALLA 2: EL SIMULADOR DE CHAT (Si la entrevista YA inició) */
        <>
          <div style={{ textAlign: 'center', marginBottom: '15px', color: '#aaa' }}>
            <p>Evaluación de <strong>{area}</strong> - Nivel <strong>{dificultad}</strong></p>
          </div>

          {/* AVATAR DEL MÍSTER */}
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

          {/* CAJA DE HISTORIAL */}
          <div className="caja-mensajes">
            {historial.length === 0 && (
              <div className="mensaje bot">
                <p>¡Hola! Soy tu entrevistador técnico para el área de {area}. ¿Estás listo para arrancar?</p>
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

          {/* FORMULARIO Y BOTONERA */}
          <form onSubmit={enviarMensaje} className="formulario" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              onKeyDown={manejarTecla} 
              disabled={entrevistaTerminada || cargando} 
              placeholder={entrevistaTerminada ? "Entrevista finalizada." : "Escribí tu respuesta acá..."}
              rows={3} 
              style={{
                width: '100%',
                minHeight: '60px',
                maxHeight: '120px', 
                resize: 'none', 
                overflowY: 'auto', 
                padding: '10px',
                borderRadius: '8px',
                fontFamily: 'inherit'
              }}
            />
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
              
              {/* Si terminó, mostramos el botón de volver al menú. Si no, mostramos el de cortar audio */}
              {entrevistaTerminada ? (
                <button 
                  type="button" 
                  onClick={reiniciarEntrevista}
                  style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Nueva Entrevista (Volver al Inicio)
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={saltearRespuesta} 
                  disabled={cargando}
                  style={{ backgroundColor: '#ff4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}
                >
                  Cortar Audio
                </button>
              )}
              
              <button 
                type="submit" 
                disabled={cargando || entrevistaTerminada}
                style={{ backgroundColor: '#00f0ff', color: 'black', fontWeight: 'bold', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}
              >
                Enviar
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

export default App;