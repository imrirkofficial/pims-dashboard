import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import toast, { Toaster } from 'react-hot-toast';
import { Eye, EyeOff, Copy, Search, ShieldCheck, LayoutDashboard, List, Plus, X, Edit, Trash2, Lock, Download, Menu, LogOut } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({ category: '', service: '', email: '', password: '' });
  const [editFormData, setEditFormData] = useState({ id: '', category: '', service: '', email: '', password: '' });

  // 🔴 আপনার লাইভ ব্যাকএন্ড লিঙ্ক
  const API_BASE_URL = "https://pims-dashboard.onrender.com/api";

  // Token Header Setup
  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    const handleResize = () => { 
      setIsMobile(window.innerWidth < 768); 
      if (window.innerWidth >= 768) setIsSidebarOpen(false); 
    };
    window.addEventListener('resize', handleResize);
    
    if (localStorage.getItem('token')) {
        setIsAuthenticated(true);
        fetchData();
    }
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = () => {
    axios.get(`${API_BASE_URL}/accounts`, getAuthHeader())
      .then(res => {
        const data = res.data || [];
        setAccounts(data);
        const extractedCategories = [...new Set(data.map(acc => acc.category).filter(Boolean))];
        setCategories(['All', ...extractedCategories]);
      })
      .catch(err => {
          if(err.response && err.response.status === 401) handleLogout();
          else console.error("Error fetching data:", err);
      });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post(`${API_BASE_URL}/login`, { password: loginPassword });
        localStorage.setItem('token', res.data.token);
        setIsAuthenticated(true);
        fetchData(); 
        toast.success("Welcome back to your Secure Vault!"); 
    } catch (err) {
        toast.error("Incorrect Master Password!"); 
        setLoginPassword('');
    }
  };

  const handleLogout = () => {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setAccounts([]);
      toast("Vault Locked", { icon: '🔒' });
  };

  const togglePassword = (id) => setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); toast.success("Password Copied!"); };

  const handleExport = () => {
    if (accounts.length === 0) return toast.error("No data available to export!");
    const exportData = accounts.map((acc, index) => ({ 
      "No.": index + 1, 
      "Category": acc.category || 'N/A', 
      "Platform Name": acc.service || 'N/A', 
      "Email / Username": acc.email || 'N/A', 
      "Password": acc.password || 'N/A' 
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "My Passwords");
    XLSX.writeFile(workbook, "PIMS_Backup_Data.xlsx");
    toast.success("Backup downloaded successfully!");
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/accounts`, formData, getAuthHeader());
      setIsAddModalOpen(false); 
      setFormData({ category: '', service: '', email: '', password: '' });
      fetchData(); 
      toast.success("New account added (Encrypted)!");
    } catch (err) { toast.error("Failed to add account"); }
  };

  const handleEditClick = (acc) => {
    setEditFormData({ id: acc._id, category: acc.category || '', service: acc.service || '', email: acc.email || '', password: acc.password || '' });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/accounts/${editFormData.id}`, editFormData, getAuthHeader());
      setIsEditModalOpen(false); 
      fetchData(); 
      toast.success("Account updated securely!");
    } catch (err) { toast.error("Failed to update account"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      try {
        await axios.delete(`${API_BASE_URL}/accounts/${id}`, getAuthHeader());
        fetchData(); 
        toast.success("Account deleted!");
      } catch (err) { toast.error("Failed to delete account"); }
    }
  };

  const filteredAccounts = accounts.filter(acc => {
    const matchCategory = activeCategory === 'All' || acc.category === activeCategory;
    const safeSearchTerm = searchTerm ? searchTerm.trim().toLowerCase() : '';
    const matchSearch = safeSearchTerm === '' ? true : (
      (acc.service && acc.service.toLowerCase().includes(safeSearchTerm)) || 
      (acc.email && acc.email.toLowerCase().includes(safeSearchTerm)) || 
      (acc.category && acc.category.toLowerCase().includes(safeSearchTerm))
    );
    return matchCategory && matchSearch;
  });

  if (!isAuthenticated) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a', fontFamily: 'sans-serif', padding: '20px' }}>
        <Toaster position="top-right" />
        <div style={{ background: 'white', padding: isMobile ? '30px 20px' : '40px', borderRadius: '16px', width: '100%', maxWidth: '350px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}><div style={{ background: '#eff6ff', padding: '15px', borderRadius: '50%' }}><Lock size={40} color="#3b82f6" /></div></div>
          <h2 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: isMobile ? '22px' : '24px' }}>Welcome, Ri Robin</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '25px' }}>Enter your master password to access your secure vault.</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="password" placeholder="Master Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '16px', textAlign: 'center', letterSpacing: '2px' }} autoFocus />
            <button type="submit" style={{ background: '#3b82f6', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: '0.2s' }}>Unlock Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#f8fafc', overflow: 'hidden' }}>
      <Toaster position="top-right" /> 
      {isMobile && isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />}
      
      <div style={{ width: '260px', background: '#1e293b', color: 'white', display: 'flex', flexDirection: 'column', zIndex: 50, position: isMobile ? 'fixed' : 'relative', top: 0, bottom: 0, left: isMobile ? (isSidebarOpen ? '0' : '-260px') : '0', transition: 'left 0.3s ease-in-out', boxShadow: isMobile ? '4px 0 10px rgba(0,0,0,0.2)' : 'none' }}>
        <div style={{ padding: '20px', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', background: '#0f172a' }}>
          <ShieldCheck size={28} color="#3b82f6" /> PIMS Vault
          {isMobile && <X onClick={() => setIsSidebarOpen(false)} style={{ marginLeft: 'auto', cursor: 'pointer' }} size={24} />}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {categories.map((cat, index) => (
              <li key={index} onClick={() => { setActiveCategory(cat); if(isMobile) setIsSidebarOpen(false); }} style={{ padding: '12px 15px', marginBottom: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: activeCategory === cat ? '#3b82f6' : 'transparent', color: activeCategory === cat ? 'white' : '#cbd5e1', fontWeight: activeCategory === cat ? 'bold' : 'normal', transition: '0.2s' }}>
                {cat === 'All' ? <List size={18} /> : <LayoutDashboard size={18} />} {cat}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ padding: '15px', borderTop: '1px solid #334155' }}>
           <button onClick={handleLogout} style={{ width: '100%', padding: '10px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
             <LogOut size={18} /> Lock Vault
           </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: isMobile ? '15px' : '30px', overflowY: 'auto', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '25px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', gap: isMobile ? '15px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {isMobile && <Menu onClick={() => setIsSidebarOpen(true)} style={{ cursor: 'pointer', color: '#0f172a' }} size={28} />}
            <div><h1 style={{ margin: 0, color: '#0f172a', fontSize: isMobile ? '22px' : '26px' }}>{activeCategory}</h1><p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>{filteredAccounts.length} saved records</p></div>
          </div>
          <div style={{ display: 'flex', gap: '10px', width: isMobile ? '100%' : 'auto', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
            <div style={{ position: 'relative', flex: isMobile ? '1 1 100%' : 'auto' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '10px 10px 10px 35px', borderRadius: '8px', border: '1px solid #cbd5e1', width: isMobile ? '100%' : '200px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button onClick={handleExport} style={{ flex: isMobile ? '1' : 'auto', background: '#10b981', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '5px', alignItems: 'center', fontSize: '14px' }}><Download size={18} /> Backup</button>
            <button onClick={() => setIsAddModalOpen(true)} style={{ flex: isMobile ? '1' : 'auto', background: '#3b82f6', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '5px', alignItems: 'center', fontSize: '14px' }}><Plus size={18} /> Add</button>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f1f5f9', color: '#475569' }}>
              <tr>
                <th style={{ padding: '15px', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Platform</th><th style={{ padding: '15px', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Email / Username</th><th style={{ padding: '15px', fontWeight: '600', borderBottom: '2px solid #e2e8f0' }}>Password</th><th style={{ padding: '15px', fontWeight: '600', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((acc, index) => (
                <tr key={acc._id} style={{ borderBottom: '1px solid #e2e8f0', background: index % 2 === 0 ? 'white' : '#f8fafc' }}>
                  <td style={{ padding: '15px', fontWeight: '500', color: '#0f172a' }}>{acc.service || acc.category || 'N/A'}</td><td style={{ padding: '15px', color: '#475569', wordBreak: 'break-all' }}>{acc.email || '-'}</td>
                  <td style={{ padding: '15px' }}><input type={showPassword[acc._id] ? "text" : "password"} value={acc.password} readOnly style={{ border: 'none', background: 'transparent', outline: 'none', color: '#0f172a', width: '120px' }} /></td>
                  <td style={{ padding: '15px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button onClick={() => togglePassword(acc._id)} style={{ cursor: 'pointer', border: 'none', background: 'none' }} title="Show/Hide">{showPassword[acc._id] ? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#64748b" />}</button>
                    <button onClick={() => copyToClipboard(acc.password)} style={{ cursor: 'pointer', border: 'none', background: 'none' }} title="Copy"><Copy size={18} color="#3b82f6" /></button>
                    <button onClick={() => handleEditClick(acc)} style={{ cursor: 'pointer', border: 'none', background: 'none' }} title="Edit"><Edit size={18} color="#10b981" /></button>
                    <button onClick={() => handleDelete(acc._id)} style={{ cursor: 'pointer', border: 'none', background: 'none' }} title="Delete"><Trash2 size={18} color="#ef4444" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS (Add/Edit) */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '20px' }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}><h2 style={{ margin: 0, fontSize: '20px' }}>Add New Account</h2><X onClick={() => setIsAddModalOpen(false)} style={{ cursor: 'pointer' }} size={24} /></div>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Category" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <input type="text" placeholder="Platform Name" required value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <input type="text" placeholder="Email / Username" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <input type="text" placeholder="Password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <button type="submit" style={{ background: '#3b82f6', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Save Account</button>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '20px' }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}><h2 style={{ margin: 0, fontSize: '20px' }}>Edit Account</h2><X onClick={() => setIsEditModalOpen(false)} style={{ cursor: 'pointer' }} size={24} /></div>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Category" required value={editFormData.category} onChange={e => setEditFormData({...editFormData, category: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <input type="text" placeholder="Platform" required value={editFormData.service} onChange={e => setEditFormData({...editFormData, service: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <input type="text" placeholder="Email" required value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <input type="text" placeholder="Password" required value={editFormData.password} onChange={e => setEditFormData({...editFormData, password: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <button type="submit" style={{ background: '#10b981', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Update Account</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;