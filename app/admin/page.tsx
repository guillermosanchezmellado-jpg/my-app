'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminPanel() {
  const [reservas, setReservas] = useState<any[]>([]);

  const cargarReservas = async () => {
    const { data } = await supabase.from('reservas').select('*');
    if (data) setReservas(data);
  };

  useEffect(() => {
    cargarReservas();

    // Canal en tiempo real para el admin
    const channel = supabase
      .channel('cambios-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, () => {
        cargarReservas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const eliminarReserva = async (id: number) => {
    await supabase.from('reservas').delete().eq('id', id);
    // El cambio se reflejará al instante solo gracias al canal de tiempo real
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-green-400 mb-8">🛠️ Panel Administrador</h1>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Reservas en curso</h2>
            <span className="text-xs bg-slate-700 px-3 py-1 rounded-full text-slate-300">Total: {reservas.length}</span>
          </div>

          {reservas.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No hay reservas activas.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs">
                  <th className="py-3">Pista</th>
                  <th className="py-3">Hora</th>
                  <th className="py-3">Cliente</th>
                  <th className="py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {reservas.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="py-4 text-green-300 font-bold">{r.Pista}</td>
                    <td className="py-4">{r.Hora}</td>
                    <td className="py-4">{r.Cliente}</td>
                    <td className="py-4 text-right">
                      <button 
                        onClick={() => eliminarReserva(r.id)} 
                        className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                      >
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}