'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Usuario,
  actualizarContactoCliente,
  buscarClientes,
} from '../../components/lib/api';
import { useAuth } from '../../components/lib/Navbar';

export const dynamic = "force-dynamic";

const EmpleadoPage: React.FC = () => {
  const { usuario, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Estado para edición limitada
  const [editingClient, setEditingClient] = useState<Usuario | null>(null);
  const router = useRouter();

  // Protección de ruta (Solo Empleados y Administradores)
  useEffect(() => {
    if (!authLoading) {
      if (!usuario || (usuario.rol !== 'EMPLEADO' && usuario.rol !== 'ADMINISTRADOR')) {
        router.replace('/');
      }
    }
  }, [usuario, authLoading, router]);

    useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await buscarClientes(searchTerm);
        setClients(data);
      } catch (error) {
        console.error('Error al cargar clientes:', error);
      } finally {
        setLoading(false);
      }
    };

    if (usuario) {
      loadClients();
    }
  }, [searchTerm, usuario]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

    // Función para guardar solo información de contacto (Limitado)
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient?.id) return;

    try {
      await actualizarContactoCliente(editingClient.id, {
        nombres: editingClient.nombres,
        apellido_paterno: editingClient.apellido_paterno,
        apellido_materno: editingClient.apellido_materno,
        correo: editingClient.correo,
        celular: editingClient.celular,
      });
      setClients((prev) =>
        prev.map((c) => (c.id === editingClient.id ? editingClient : c))
      );
      setEditingClient(null);
    } catch (error) {
      console.error('Error al actualizar datos del cliente:', error);
    }
  };

  if (authLoading || (loading && clients.length === 0)) {
    return <div className="p-8 text-center text-slate-600">Cargando directorio...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Directorio de Clientes</h1>
          <p className="text-sm text-slate-600">Búsqueda y actualización de datos de contacto de clientes.</p>
        </div>
        
        {/* Solo el Administrador ve el botón para regresar al panel admin desde aquí */}
        {usuario?.rol === 'ADMINISTRADOR' && (
          <button
            onClick={() => router.push('/admin')}
            className="motion-button bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Volver a Panel Admin
          </button>
        )}
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar cliente por nombres, correo o celular..."
          value={searchTerm}
          onChange={handleSearch}
          className="border border-slate-300 rounded-xl p-3 w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="overflow-x-auto shadow rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-700 uppercase text-xs">
            <tr>
              <th className="py-3 px-4 border-b">Nombre Completo</th>
              <th className="py-3 px-4 border-b">Correo</th>
              <th className="py-3 px-4 border-b">Celular</th>
              <th className="py-3 px-4 border-b text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-slate-50 transition-colors border-b last:border-0">
                <td className="py-3 px-4 font-medium text-slate-900">
                  {`${client.nombres} ${client.apellido_paterno || ''}`}
                </td>
                <td className="py-3 px-4 text-slate-600">{client.correo}</td>
                <td className="py-3 px-4 text-slate-600">{client.celular || 'No registrado'}</td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => setEditingClient(client)}
                    className="motion-button px-3 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
                  >
                    Editar Info
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {clients.length === 0 && (
          <div className="p-6 text-center text-slate-500">
            No se encontraron clientes que coincidan con la búsqueda.
          </div>
        )}
      </div>

            {/* Modal de edición con permisos LIMITADOS (Sin rol, sin estado) */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="motion-dialog bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Actualizar Contacto</h2>
            <form onSubmit={handleSaveClient} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Nombres</label>
                  <input
                    type="text"
                    value={editingClient.nombres}
                    onChange={(e) => setEditingClient({ ...editingClient, nombres: e.target.value })}
                    className="w-full border rounded-lg p-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Apellido Paterno</label>
                  <input
                    type="text"
                    value={editingClient.apellido_paterno || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, apellido_paterno: e.target.value })}
                    className="w-full border rounded-lg p-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Apellido Materno</label>
                <input
                  type="text"
                  value={editingClient.apellido_materno || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, apellido_materno: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Correo</label>
                <input
                  type="email"
                  value={editingClient.correo || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, correo: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Celular</label>
                <input
                  type="text"
                  value={editingClient.celular || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, celular: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="motion-button px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="motion-button px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpleadoPage;
