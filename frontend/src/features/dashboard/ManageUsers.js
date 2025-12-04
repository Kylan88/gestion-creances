import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import { usersAPI } from '../../services/api';
import Button from '../../components/common/Button';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    usersAPI.getAll().then((res) => setUsers(res.data.users));
  }, []);

  const handleRoleChange = (userId, newRole) => {
    usersAPI.updateRole({ user_id: userId, role: newRole }).then(() => {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    });
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center">
        <Link to="/dashboard">
          <Button variant="secondary" className="mr-4">← Retour au Dashboard</Button>
        </Link>
        <h1 className="text-2xl font-bold">Gérer Utilisateurs</h1>
      </div>
      
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Username</th>
            <th className="py-2 px-4 border-b">Nom</th>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Rôle</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="py-2 px-4 border-b">{user.username}</td>
              <td className="py-2 px-4 border-b">{user.fullname}</td>
              <td className="py-2 px-4 border-b">{user.email}</td>
              <td className="py-2 px-4 border-b">{user.role}</td>
              <td className="py-2 px-4 border-b">
                <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)} className="p-1 border rounded">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageUsers;