'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const HORARIOS = ["11:00-12:30", "13:00-14:30", "15:00-16:30", "17:00-18:30", "19:00-20:30"];
const PISTAS = ["Pista 1", "Pista 2"];

export default function Home() {
  const [reservas, setReservas] = useState<any[]>([]);
  const [pistaSeleccionada, setPistaSeleccionada] = useState<{ pista: string; hora: string } | null>(null);
  const [nombreCliente, setNombreCliente] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  );

  const cargarReservas = async () => {
    const { data, error } = await supabase.from('reservas').select('*');
    if (error) {
      console.error("Error al cargar reservas:", error);
    } else if (data) {
      setReservas(data);
    }
  };

  useEffect(() => {
    cargarReservas();
    const channel = supabase
      .channel('cambios-cliente')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, () => {
        cargarReservas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const confirmarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pistaSeleccionada || !nombreCliente) return;

    const { error } = await supabase.from('reservas').insert([
      { 
        Pista: pistaSeleccionada.pista, 
        Hora: pistaSeleccionada.hora, 
        Cliente: nombreCliente,
        Fecha: fechaSeleccionada 
      }
    ]);

    if (error) {
      console.error("Error al insertar reserva:", error);
      alert("Error al guardar: " + error.message);
    } else {
      setPistaSeleccionada(null);
      setNombreCliente('');
      cargarReservas();
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-green-400 mb-6">🎾 Club Suboficiales</h1>
        
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <label className="text-sm font-semibold text-slate-300">Selecciona el día de reserva:</label>
          <input 
            type="date" 
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-green-500"
          />
        </div>

        {PISTAS.map((pista) => (
          <div key={pista} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-6">
            <h3 className="font-bold text-lg text-green-300 mb-3">{pista}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {HORARIOS.map((hora) => {
                const reservaEncontrada = reservas.find(
                  r => r.Pista === pista && r.Hora === hora && r.Fecha === fechaSeleccionada
                );
                const ocupada = !!reservaEncontrada;

                return (
                  <div key={hora} className="flex flex-col bg-slate-900/50 p-2 rounded-xl border border-slate-700/50">
                    <button 
                      disabled={ocupada} 
                      onClick={() => setPistaSeleccionada({ pista, hora })} 
                      className={`p-2 rounded-lg text-sm font-bold transition-all ${
                        ocupada 
                          ? "bg-red-900/40 text-red-400 cursor-not-allowed border border-red-800/50" 
                          : "bg-slate-700 hover:bg-green-500 hover:text-slate-950 cursor-pointer"
                      }`}
                    >
                      {ocupada ? "Ocupada" : hora}
                    </button>
                    {ocupada && (
                      <div className="mt-2 text-[11px] text-slate-300 space-y-0.5 text-center">
                        <p className="font-semibold text-red-300 truncate">👤 {reservaEncontrada.Cliente}</p>
                        <p className="text-slate-400">📅 {reservaEncontrada.Fecha}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        {pistaSeleccionada && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <form onSubmit={confirmarReserva} className="bg-slate-800 p-6 rounded-2xl w-full max-w-sm border border-slate-700">
              <h2 className="text-xl font-bold text-green-400 mb-2">Confirmar Reserva</h2>
              <p className="text-sm text-slate-400 mb-4">
                {pistaSeleccionada.pista} - {pistaSeleccionada.hora} <br/>
                <span className="text-green-400 font-semibold">Fecha: {fechaSeleccionada}</span>
              </p>
              <input 
                type="text" 
                required 
                value={nombreCliente} 
                onChange={(e) => setNombreCliente(e.target.value)} 
                placeholder="Tu Nombre" 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 mb-4 text-white focus:outline-none focus:border-green-500" 
                autoFocus
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setPistaSeleccionada(null)} className="flex-1 bg-slate-700 py-2 rounded-xl hover:bg-slate-600 cursor-pointer">Cancelar</button>
                <button type="submit" className="flex-1 bg-green-500 text-slate-950 font-bold py-2 rounded-xl hover:bg-green-600 cursor-pointer">Confirmar</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}