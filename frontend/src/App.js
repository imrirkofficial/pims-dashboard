import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import toast, { Toaster } from 'react-hot-toast';
import { Eye, EyeOff, Copy, Search, ShieldCheck, LayoutDashboard, List, Plus, X, Edit, Trash2, Lock, Download, Menu, LogOut, Upload } from 'lucide-react';

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

  const API_BASE_URL = "https://pims-dashboard.onrender.com/api";

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
      });
  };

  // 📥 Excel Import Logic
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.json_to_row_object_array(ws);

        toast.loading("Importing data...");
        
        // সব ডেটা একে একে ব্যাকএন্ডে পাঠানো
        for (let row of data) {
          const newAcc = {
            category: row.Category || row.category || "Uncategorized",
            service: row.Platform || row.PlatformName || row.service || "Unknown",
            email: row.Email || row.Username || row.email || "",
            password: String(row.Password || row.password || "")
          };
          await axios.post(`${API_BASE_URL}/accounts`, newAcc, getAuthHeader());
        }
        
        toast.dismiss();
        toast.success("All data imported successfully!");
        fetchData();
      } catch (err) {
        toast.dismiss();
        toast.error("Failed to import. Check Excel format.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post(`${API_BASE_URL}/login`, { password: loginPassword });
        localStorage.setItem('token', res.data.token);
        setIsAuthenticated(true);
        fetchData(); 
        toast.success("Welcome back!"); 
    } catch (err) {
        toast.error("Incorrect Password!"); 
    }
  };

  const handleLogout = () => {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setAccounts([]);
      toast("Vault Locked", { icon: '🔒' });
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };

  const handleExport = () => {
    if (accounts.length === 0) return toast.error("No data!");
    const exportData = accounts.map((acc, index) => ({ "No.": index + 1, "Category": acc.category, "Platform": acc.service, "Email": acc.email, "Password": acc.password }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "My Passwords");
    XLSX.writeFile(workbook, "PIMS_Backup.xlsx");
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/accounts`, formData, getAuthHeader());
      setIsAddModalOpen(false); setFormData({ category: '', service: '', email: '', password: '' });
      fetchData(); toast.success("Added!");
    } catch (err) { toast.error("Error!"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this?")) {
      try { await axios.delete(`${API_BASE_URL}/accounts/${id}`, getAuthHeader()); fetchData(); toast.success("Deleted!"); }
      catch (err) { toast.error("Error!"); }
    }
  };

  const filteredAccounts = accounts.filter(acc => {
    const matchCategory = activeCategory === 'All' || acc.category === activeCategory;
    const matchSearch = searchTerm === '' || (acc.service?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCategory && matchSearch;
  });

  if (!isAuthenticated) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a' }}>
        <Toaster />
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', textAlign: 'center' }}>
          <Lock size={40} color="#3b82f6" />
          <h2>Ri Robin's Vault</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="password" placeholder="Password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={{ padding: '12px', textAlign: 'center' }} autoFocus />
            <button type="submit" style={{ background: '#3b82f6', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Unlock</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: 'sans-serif' }}>
      <Toaster />
      {/* Sidebar (Simple version) */}
      <div style={{ width: '250px', background: '#1e293b', color: 'white', padding: '20px' }}>
        <h3>PIMS Vault</h3>
        {categories.map(cat => (
          <div key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: '10px', cursor: 'pointer', background: activeCategory === cat ? '#3b82f6' : 'transparent', borderRadius: '5px' }}>{cat}</div>
        ))}
        <button onClick={handleLogout} style={{ marginTop: '20px', color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>Lock</button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', background: 'white', padding: '20px', borderRadius: '10px' }}>
          <h2>{activeCategory} Accounts</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" placeholder="Search..." onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '8px' }} />
            
            {/* 🆕 Import Button */}
            <label style={{ background: '#8b5cf6', color: 'white', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
              <Upload size={18} /> Import Excel
              <input type="file" accept=".xlsx, .xls" onChange={handleImport} style={{ display: 'none' }} />
            </label>

            <button onClick={handleExport} style={{ background: '#10b981', color: 'white', padding: '8px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Backup</button>
            <button onClick={() => setIsAddModalOpen(true)} style={{ background: '#3b82f6', color: 'white', padding: '8px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>+ Add</button>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f1f5f9' }}>
              <tr><th style={{ padding: '15px' }}>Platform</th><th>Email</th><th>Password</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredAccounts.map(acc => (
                <tr key={acc._id} style={{ borderBottom: '1px solid #eee', textAlign: 'center' }}>
                  <td style={{ padding: '15px' }}>{acc.service}</td>
                  <td>{acc.email}</td>
                  <td>••••••••</td>
                  <td>
                    <button onClick={() => copyToClipboard(acc.password)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><Copy size={18} color="#3b82f6" /></button>
                    <button onClick={() => handleDelete(acc._id)} style={{ border: 'none', background: 'none', cursor: 'pointer', marginLeft: '10px' }}><Trash2 size={18} color="#ef4444" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '350px' }}>
            <h3>Add New</h3>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input placeholder="Category" required onChange={e => setFormData({...formData, category: e.target.value})} style={{ padding: '10px' }} />
              <input placeholder="Platform" required onChange={e => setFormData({...formData, service: e.target.value})} style={{ padding: '10px' }} />
              <input placeholder="Email" required onChange={e => setFormData({...formData, email: e.target.value})} style={{ padding: '10px' }} />
              <input placeholder="Password" required onChange={e => setFormData({...formData, password: e.target.value})} style={{ padding: '10px' }} />
              <button type="submit" style={{ background: '#3b82f6', color: 'white', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Save</button>
              <button onClick={() => setIsAddModalOpen(false)} type="button" style={{ background: '#eee', padding: '10px', borderRadius: '8px', border: 'none' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;