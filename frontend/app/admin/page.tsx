// Ruta: frontend/app/admin/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Usuario } from '../../components/lib/api';
import { useAuth } from '../../components/lib/Navbar';

const AdminPage: React.FC = () => {
  const { usuario, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para modales
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ nombres: '', correo: '', password: '', rol: 'EMPLEADO' });
  const router = useRouter();

  // Proteger la ruta solo para ADMINISTRADOR
  useEffect(() => {
    if (!authLoading) {
      if (!usuario || usuario.rol !== 'ADMINISTRADOR') {
        router.replace('/');
      }
    }
  }, [usuario, authLoading, router]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await api.get<Usuario[]>('/users');
        setUsers(data);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      } finally {
        setLoading(false);
      }
    };

    if (usuario?.rol === 'ADMINISTRADOR') {
      loadUsers();
    }
  }, [usuario]);

  // Cambiar Rol
  const handleRoleChange = async (userId: string | number, newRole: string) => {
    try {
      await api.patch(`/users/${userId}/role`, { rol: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, rol: newRole as Usuario['rol'] } : u)));
    } catch (error) {
      console.error('Error al cambiar el rol:', error);
    }
  };

  // Cambiar Estado (Bloquear/Activar)
  const handleStatusChange = async (userId: string | number, currentStatus?: string) => {
    const newStatus = currentStatus === 'Activo' ? 'Bloqueado' : 'Activo';
    try {
      await api.patch(`/users/${userId}/status`, { estado: newStatus });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, estado: newStatus } : u)));
    } catch (error) {
      console.error('Error al cambiar el estado:', error);
    }
  };

  // Guardar edición de usuario
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?.id) return;
    try {
      await api.patch(`/users/${editingUser.id}`, {
        nombres: editingUser.nombres,
        apellido_paterno: editingUser.apellido_paterno,
        apellido_materno: editingUser.apellido_materno,
        celular: editingUser.celular,
      });
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? editingUser : u)));
      setEditingUser(null);
    } catch (error) {
      console.error('Error al actualizar datos del usuario:', error);
    }
  };

  // Crear nuevo usuario (Empleado/Cliente)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Ajusta la ruta '/auth/registro' o '/users' según tu backend para creación admin
      const createdUser = await api.post<Usuario>('/auth/registro', newUser);
      setUsers((prev) => [...prev, createdUser]);
      setIsAddingUser(false);
      setNewUser({ nombres: '', correo: '', password: '', rol: 'EMPLEADO' });
    } catch (error) {
      console.error('Error al crear usuario:', error);
    }
  };

  if (authLoading || loading) {
    return <div className="p-8 text-center text-slate-600">Cargando panel de administración...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
          <p className="text-sm text-slate-600">Gestión total: usuarios, roles, estados y creación.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddingUser(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Agregar Usuario
          </button>
          <button
            onClick={() => router.push('/empleado')}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Ver Vista Clientes
          </button>
        </div>
      </div>

      {/* Tabla de Administración */}
      <div className="overflow-x-auto shadow rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-700 uppercase text-xs">
            <tr>
              <th className="py-3 px-4 border-b">Nombre Completo</th>
              <th className="py-3 px-4 border-b">Correo</th>
              <th className="py-3 px-4 border-b">Celular</th>
              <th className="py-3 px-4 border-b">Rol</th>
              <th className="py-3 px-4 border-b text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 border-b last:border-0">
                <td className="py-3 px-4 font-medium text-slate-900">{`${u.nombres} ${u.apellido_paterno || ''}`}</td>
                <td className="py-3 px-4 text-slate-600">{u.correo}</td>
                <td className="py-3 px-4 text-slate-600">{u.celular}</td>
                <td className="py-3 px-4">
                  <select
                    value={u.rol}
                    onChange={(e) => u.id && handleRoleChange(u.id, e.target.value)}
                    className="border rounded-lg p-1.5 cursor-pointer bg-white text-slate-800 text-xs font-medium"
                  >
                    <option value="ADMINISTRADOR">Administrador</option>
                    <option value="EMPLEADO">Empleado</option>
                    <option value="CLIENTE">Cliente</option>
                  </select>
                </td>
                <td className="py-3 px-4 text-center space-x-2">
                  <button onClick={() => setEditingUser(u)} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold">Editar</button>
                  <button
                    onClick={() => u.id && handleStatusChange(u.id, u.estado)}
                    className={`px-3 py-1 rounded-lg text-white text-xs font-semibold ${u.estado === 'Activo' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                  >
                    {u.estado === 'Activo' ? 'Bloquear' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para CREAR Usuario */}
      {isAddingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Crear Nuevo Usuario</h2>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Nombres</label>
                <input type="text" value={newUser.nombres} onChange={(e) => setNewUser({...newUser, nombres: e.target.value})} className="w-full border rounded-lg p-2 text-sm" required />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Correo</label>
                <input type="email" value={newUser.correo} onChange={(e) => setNewUser({...newUser, correo: e.target.value})} className="w-full border rounded-lg p-2 text-sm" required />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Contraseña (Temporal)</label>
                <input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="w-full border rounded-lg p-2 text-sm" required />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Rol</label>
                <select value={newUser.rol} onChange={(e) => setNewUser({...newUser, rol: e.target.value})} className="w-full border rounded-lg p-2 text-sm">
                  <option value="EMPLEADO">Empleado</option>
                  <option value="CLIENTE">Cliente</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsAddingUser(false)} className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">Crear Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para EDITAR Usuario */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Editar Datos del Usuario</h2>
            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Nombres</label>
                <input type="text" value={editingUser.nombres} onChange={(e) => setEditingUser({ ...editingUser, nombres: e.target.value })} className="w-full border rounded-lg p-2 text-sm" required />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Apellido Paterno</label>
                <input type="text" value={editingUser.apellido_paterno || ''} onChange={(e) => setEditingUser({ ...editingUser, apellido_paterno: e.target.value })} className="w-full border rounded-lg p-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Celular</label>
                <input type="text" value={editingUser.celular || ''} onChange={(e) => setEditingUser({ ...editingUser, celular: e.target.value })} className="w-full border rounded-lg p-2 text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;