import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import api from "../../utils/api";
import { BASE_URL } from "../../utils/config";
import "../../styles/admin/AdminUsers.css";
import { FaEdit, FaTrash, FaUser } from "react-icons/fa";
import EditUserModal from "../../components/Admin/EditUserModal";

const AdminUsers = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);


  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const fetchUsers = async (p = page) => {
    try {
      const res = await api.get(`${BASE_URL}/api/users?page=${p}`);
      if (res.data.success) 
        setUsers(res.data.users);
        setPage(res.data.page);
        setPages(res.data.pages);
    } catch {
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await api.delete(`${BASE_URL}/api/users/${id}`);
      alert("User deleted");
      fetchUsers();
    } catch {
      alert("Failed to delete user");
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="admin-main">
        <AdminNavbar toggleSidebar={toggleSidebar} />
        <div className="admin-content">
          <h2>Registered Customers</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th><FaUser /> Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Date Joined</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.phone}</td>
                      <td>{u.role}</td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className="edit-btn" onClick={() =>{setSelectedUser(u); setShowEdit(true) }}><FaEdit /></button>
                        <button className="delete-btn" onClick={() => deleteUser(u._id)}><FaTrash /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {showEdit && selectedUser && (
                <EditUserModal
                   user={selectedUser}
                   onClose={() => setShowEdit(false)}
                   onSuccess={() => fetchUsers()}
                
                />
              )}

              <div className="pager">
  <button 
    disabled={page <= 1} 
    onClick={() => fetchUsers(page - 1)}
  >
    Prev
  </button>

  <span>{page} / {pages}</span>

  <button 
    disabled={page >= pages} 
    onClick={() => fetchUsers(page + 1)}
  >
    Next
  </button>
</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
