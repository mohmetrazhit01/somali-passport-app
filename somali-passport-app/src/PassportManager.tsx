import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  Plus, 
  LogOut, 
  User, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Moon, 
  Sun,
  Menu,
  X,
  Upload,
  Download,
  Camera,
  Globe,
  CreditCard,
  Printer,
  Lock
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp,
  query, 
  orderBy 
} from 'firebase/firestore';

// --- Firebase Configuration & Initialization ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Translations (Af-Soomaali & English) ---
const translations = {
  so: {
    dashboard: "Warbixinta Guud",
    passports: "Liiska Baasaboorada",
    search: "Raadi Baasaboor...",
    addNew: "Ku Dar Cusub",
    export: "Dhoofi (CSV)",
    total: "Wadarta Guud",
    active: "Waa Shaqaynaya",
    expiring: "Wuu Dhacayaa Dhawaan",
    expired: "Wuu Dhacay",
    fullName: "Magaca Saddexan",
    passportNo: "Lambarka Baasaboorka",
    nationality: "Dhalashada",
    expiryDate: "Taariikhda Dhicitaanka",
    status: "Xaaladda",
    actions: "Falalka",
    edit: "Wax Ka Beddel",
    delete: "Tirtir",
    printID: "Daabac ID",
    loginTitle: "Ku Soo Dhowow Nidaamka Baasaboorada",
    loginSubtitle: "Fadlan geli email-kaaga iyo lambarka sirta ah",
    loginButton: "Gal Nidaamka",
    logout: "Ka Bax",
    save: "Keydi Xogta",
    cancel: "Jooji",
    photo: "Sawirka",
    gender: "Jinsiga",
    issueDate: "Taariikhda Bixinta",
    uploadText: "Guji halkan si aad sawir u soo qaaddo",
    confirmDelete: "Ma hubtaa inaad tirtirto baasaboorkan?",
    male: "Lab",
    female: "Dheddig",
    statusActive: "Shaqaynaya",
    statusInactive: "Joogsaday",
    statusLost: "Lumay/Xaday"
  },
  en: {
    dashboard: "Dashboard",
    passports: "All Passports",
    search: "Search Passports...",
    addNew: "Add New",
    export: "Export CSV",
    total: "Total Passports",
    active: "Active",
    expiring: "Expiring Soon",
    expired: "Expired",
    fullName: "Full Name",
    passportNo: "Passport No",
    nationality: "Nationality",
    expiryDate: "Expiry Date",
    status: "Status",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    printID: "Print ID",
    loginTitle: "Welcome to Passport System",
    loginSubtitle: "Please enter your credentials to access",
    loginButton: "Login to System",
    logout: "Logout",
    save: "Save Record",
    cancel: "Cancel",
    photo: "Photo",
    gender: "Gender",
    issueDate: "Issue Date",
    uploadText: "Click to upload photo",
    confirmDelete: "Are you sure you want to delete this passport?",
    male: "Male",
    female: "Female",
    statusActive: "Active",
    statusInactive: "Inactive",
    statusLost: "Lost/Stolen"
  }
};

// --- Helper Functions ---
const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return 'valid';
  const today = new Date();
  const exp = new Date(expiryDate);
  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expired';
  if (diffDays <= 7) return 'urgent';
  if (diffDays <= 30) return 'warning';
  return 'valid';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-GB');
};

// --- Components ---

const StatusBadge = ({ status, t }) => {
  const styles = {
    expired: "bg-red-100 text-red-800 border-red-200",
    urgent: "bg-orange-100 text-orange-800 border-orange-200 animate-pulse",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    valid: "bg-green-100 text-green-800 border-green-200"
  };

  const labels = {
    expired: "DHACAY (Expired)",
    urgent: "< 7 Maalmood (Days)",
    warning: "< 30 Maalmood (Days)",
    valid: "Active (Shaqaynaya)"
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.valid}`}>
      {labels[status]}
    </span>
  );
};

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm">
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto transform transition-all`}>
        <div className="flex justify-between items-center p-5 border-b dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- ID Card Component ---
const IDCard = ({ passport, t }) => {
  if (!passport) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('printable-id-card');
    const originalContents = document.body.innerHTML;
    
    // Create a temporary print window/iframe style approach for better control (simplified here)
    // For this environment, we will replace body, print, then restore.
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // Reload to restore event listeners
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div id="printable-id-card" className="w-full flex justify-center bg-white p-4">
        {/* ID Card Design */}
        <div className="w-[400px] h-[250px] bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-xl overflow-hidden relative text-white flex border border-gray-200 print:shadow-none print:border-2">
          {/* Watermark/Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          
          {/* Header */}
          <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-center z-10">
             <div className="flex items-center gap-2">
                <Globe size={24} className="text-yellow-400" />
                <div>
                   <h3 className="text-xs font-bold tracking-widest uppercase text-yellow-400">Republic of Somalia</h3>
                   <h4 className="text-[10px] tracking-wide uppercase opacity-80">National Passport ID</h4>
                </div>
             </div>
             <div className="text-right">
                <span className="block text-[10px] opacity-70">PASSPORT NO</span>
                <span className="font-mono font-bold text-lg tracking-wider">{passport.passportNumber}</span>
             </div>
          </div>

          {/* Content Body */}
          <div className="mt-14 w-full px-4 flex gap-4 z-10">
            {/* Photo Section */}
            <div className="w-24 h-32 bg-white rounded-lg p-1 shadow-md flex-shrink-0 mt-2">
               {passport.passportImage ? (
                 <img src={passport.passportImage} className="w-full h-full object-cover rounded" alt="ID Photo" />
               ) : (
                 <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                    <User size={32} />
                 </div>
               )}
            </div>

            {/* Info Section */}
            <div className="flex-1 space-y-2 mt-2">
               <div>
                  <span className="text-[8px] uppercase opacity-70 block">{t.fullName}</span>
                  <span className="font-bold text-sm block leading-tight">{passport.fullName}</span>
               </div>
               
               <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[8px] uppercase opacity-70 block">{t.nationality}</span>
                    <span className="font-bold text-xs">{passport.nationality}</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase opacity-70 block">{t.gender}</span>
                    <span className="font-bold text-xs">{passport.gender === 'Male' ? t.male : t.female}</span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[8px] uppercase opacity-70 block">{t.expiryDate}</span>
                    <span className={`font-bold text-xs ${passport.expiryStatus === 'expired' ? 'text-red-300' : 'text-white'}`}>
                      {formatDate(passport.expiryDate)}
                    </span>
                  </div>
                   <div>
                    <span className="text-[8px] uppercase opacity-70 block">{t.status}</span>
                    <span className="font-bold text-xs bg-white/20 px-1 rounded">{passport.status}</span>
                  </div>
               </div>
            </div>
          </div>
          
          {/* Footer Bar */}
          <div className="absolute bottom-0 w-full h-6 bg-yellow-400 text-blue-900 text-[10px] font-bold flex items-center justify-center tracking-widest">
             OFFICIAL DOCUMENT
          </div>
        </div>
      </div>

      <button 
        onClick={handlePrint} 
        className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-black transition shadow-lg"
      >
        <Printer size={20} />
        {t.printID} (Print)
      </button>
    </div>
  );
};

export default function PassportApp() {
  // State
  const [user, setUser] = useState(null);
  const [passports, setPassports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [lang, setLang] = useState('so'); // Default language Somali
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Simulating Login UI

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIDCardModalOpen, setIsIDCardModalOpen] = useState(false);
  const [selectedPassport, setSelectedPassport] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  // Login Form State
  const [loginCreds, setLoginCreds] = useState({ email: '', password: '' });

  const [formData, setFormData] = useState({
    fullName: '',
    passportNumber: '',
    nationality: 'Somali',
    gender: 'Male',
    dob: '',
    issueDate: '',
    expiryDate: '',
    status: 'Active',
    passportImage: ''
  });

  const t = translations[lang]; // Get current translations

  // --- Auth & Data Fetching ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'artifacts', appId, 'users', user.uid, 'passports'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiryStatus: getExpiryStatus(doc.data().expiryDate)
      }));
      setPassports(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching passports:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- Actions ---

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate login for demo purposes
    if (loginCreds.email && loginCreds.password) {
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginCreds({ email: '', password: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;

    const collectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'passports');

    try {
      if (editingId) {
        await updateDoc(doc(collectionRef, editingId), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collectionRef, {
          ...formData,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!user || !window.confirm(t.confirmDelete)) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'passports', id));
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      passportNumber: '',
      nationality: 'Somali',
      gender: 'Male',
      dob: '',
      issueDate: '',
      expiryDate: '',
      status: 'Active',
      passportImage: ''
    });
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (passport) => {
    setFormData({ ...passport });
    setEditingId(passport.id);
    setIsModalOpen(true);
  };

  const openIDCardModal = (passport) => {
    setSelectedPassport(passport);
    setIsIDCardModalOpen(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024) {
        alert("Fadlan sawirka wuu weyn yahay. Isticmaal sawir ka yar 500KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, passportImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Full Name,Passport No,Nationality,Expiry Date\n"
      + passports.map(p => `${p.fullName},${p.passportNumber},${p.nationality},${p.expiryDate}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "passports_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPassports = useMemo(() => {
    return passports.filter(p => 
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.passportNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nationality.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [passports, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: passports.length,
      expired: passports.filter(p => p.expiryStatus === 'expired').length,
      warning: passports.filter(p => p.expiryStatus === 'warning' || p.expiryStatus === 'urgent').length,
      active: passports.filter(p => p.expiryStatus === 'valid').length
    };
  }, [passports]);

  // --- Views ---

  // 1. LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={() => setLang(lang === 'so' ? 'en' : 'so')} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                {lang === 'so' ? '🇬🇧 English' : '🇸🇴 Somali'}
            </button>
             <button onClick={() => setDarkMode(!darkMode)} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-700 dark:text-gray-200">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </div>

        <div className="bg-white dark:bg-gray-800 w-full max-w-md p-8 rounded-2xl shadow-xl">
           <div className="flex justify-center mb-6">
             <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                <Lock size={32} />
             </div>
           </div>
           <h2 className="text-2xl font-bold text-center mb-2 text-gray-800 dark:text-white">{t.loginTitle}</h2>
           <p className="text-center text-gray-500 mb-8">{t.loginSubtitle}</p>
           
           <form onSubmit={handleLogin} className="space-y-4">
             <div>
               <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
               <input 
                 type="text" 
                 value={loginCreds.email}
                 onChange={(e) => setLoginCreds({...loginCreds, email: e.target.value})}
                 className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                 placeholder="admin"
               />
             </div>
             <div>
               <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Password</label>
               <input 
                 type="password" 
                 value={loginCreds.password}
                 onChange={(e) => setLoginCreds({...loginCreds, password: e.target.value})}
                 className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                 placeholder="admin"
               />
             </div>
             <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition transform hover:scale-[1.02]">
               {t.loginButton}
             </button>
           </form>
           <div className="mt-6 text-center text-sm text-gray-400">
             <p>Secured by Firebase & React</p>
           </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 text-blue-600">Loading System...</div>;

  // 2. MAIN APP DASHBOARD
  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <Globe /> SomaliPass
          </h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500">
            <X />
          </button>
        </div>
        <nav className="mt-6 px-4 space-y-2">
          <button onClick={() => {setActiveTab('dashboard'); setSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <LayoutDashboard size={20} /> {t.dashboard}
          </button>
          <button onClick={() => {setActiveTab('passports'); setSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'passports' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <FileText size={20} /> {t.passports}
          </button>
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-700 w-full">
            <LogOut size={18} /> {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen">
        {/* Top Navbar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-gray-600 dark:text-gray-300">
              <Menu />
            </button>
            <div className="hidden md:flex relative w-64 lg:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder={t.search}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={() => setLang(lang === 'so' ? 'en' : 'so')} className="hidden sm:flex px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium items-center gap-2">
                <Globe size={16} /> {lang === 'so' ? 'EN' : 'SO'}
            </button>
            <button onClick={exportData} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full" title={t.export}>
              <Download size={20} />
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <div className="p-6">
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">{t.dashboard}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t.total}</p>
                      <h3 className="text-3xl font-bold mt-2">{stats.total}</h3>
                    </div>
                    <FileText className="text-blue-500 opacity-20" size={32} />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t.active}</p>
                      <h3 className="text-3xl font-bold mt-2 text-green-600">{stats.active}</h3>
                    </div>
                    <CheckCircle className="text-green-500 opacity-20" size={32} />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t.expiring}</p>
                      <h3 className="text-3xl font-bold mt-2 text-yellow-600">{stats.warning}</h3>
                    </div>
                    <AlertTriangle className="text-yellow-500 opacity-20" size={32} />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-red-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t.expired}</p>
                      <h3 className="text-3xl font-bold mt-2 text-red-600">{stats.expired}</h3>
                    </div>
                    <XCircle className="text-red-500 opacity-20" size={32} />
                  </div>
                </div>
              </div>

              {/* Expiring Soon Table Preview */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-600">
                  <AlertTriangle size={20} /> Alerts - {t.expiring}
                </h3>
                {passports.filter(p => p.expiryStatus !== 'valid').length === 0 ? (
                  <p className="text-gray-500">Mashallah! Dhammaan waa shaqaynayaan.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b dark:border-gray-700">
                        <tr>
                          <th className="pb-3 text-gray-500">{t.fullName}</th>
                          <th className="pb-3 text-gray-500">{t.passportNo}</th>
                          <th className="pb-3 text-gray-500">{t.expiryDate}</th>
                          <th className="pb-3 text-gray-500">{t.status}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-gray-700">
                        {passports.filter(p => p.expiryStatus !== 'valid').slice(0, 5).map(p => (
                          <tr key={p.id}>
                            <td className="py-3 font-medium">{p.fullName}</td>
                            <td className="py-3">{p.passportNumber}</td>
                            <td className="py-3 text-red-500 font-bold">{formatDate(p.expiryDate)}</td>
                            <td className="py-3"><StatusBadge status={p.expiryStatus} t={t} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Passports List View */}
          {activeTab === 'passports' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold">{t.passports}</h2>
                <div className="flex gap-2 w-full md:w-auto">
                   <div className="md:hidden relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder={t.search}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                   </div>
                   <button onClick={openAddModal} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-auto">
                    <Plus size={18} /> <span className="hidden md:inline">{t.addNew}</span> <span className="md:hidden">Add</span>
                  </button>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="grid grid-cols-1 md:hidden gap-4">
                {filteredPassports.map((passport) => (
                  <div key={passport.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                          {passport.passportImage ? (
                            <img src={passport.passportImage} alt="Passport" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-full h-full p-2 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{passport.fullName}</h3>
                          <p className="text-sm text-gray-500">{passport.passportNumber}</p>
                        </div>
                      </div>
                      <StatusBadge status={passport.expiryStatus} t={t} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                      <div><span className="text-gray-400 block text-xs">{t.nationality}</span>{passport.nationality}</div>
                      <div><span className="text-gray-400 block text-xs">{t.expiryDate}</span>{formatDate(passport.expiryDate)}</div>
                    </div>
                    <div className="flex justify-end gap-3 pt-3 border-t dark:border-gray-700">
                       <button onClick={() => openIDCardModal(passport)} className="text-green-600 bg-green-50 p-2 rounded-lg font-medium text-xs flex items-center gap-1 border border-green-200">
                         <CreditCard size={14} /> ID Card
                      </button>
                      <button onClick={() => openEditModal(passport)} className="text-blue-600 font-medium text-sm">{t.edit}</button>
                      <button onClick={() => handleDelete(passport.id)} className="text-red-600 font-medium text-sm">{t.delete}</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-sm">
                    <tr>
                      <th className="px-6 py-4">{t.photo}</th>
                      <th className="px-6 py-4">{t.fullName}</th>
                      <th className="px-6 py-4">{t.passportNo}</th>
                      <th className="px-6 py-4">{t.nationality}</th>
                      <th className="px-6 py-4">{t.gender}</th>
                      <th className="px-6 py-4">{t.expiryDate}</th>
                      <th className="px-6 py-4">{t.status}</th>
                      <th className="px-6 py-4">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {filteredPassports.length === 0 ? (
                      <tr><td colSpan="8" className="p-8 text-center text-gray-500">No passports found.</td></tr>
                    ) : filteredPassports.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <td className="px-6 py-4">
                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden border dark:border-gray-600">
                             {p.passportImage ? (
                                <img src={p.passportImage} alt="" className="w-full h-full object-cover" />
                             ) : (
                                <User className="w-full h-full p-2 text-gray-400" />
                             )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">{p.fullName}</td>
                        <td className="px-6 py-4 font-mono text-sm">{p.passportNumber}</td>
                        <td className="px-6 py-4">{p.nationality}</td>
                        <td className="px-6 py-4">{p.gender === 'Male' ? t.male : t.female}</td>
                        <td className="px-6 py-4">{formatDate(p.expiryDate)}</td>
                        <td className="px-6 py-4"><StatusBadge status={p.expiryStatus} t={t} /></td>
                        <td className="px-6 py-4 flex gap-3">
                          <button onClick={() => openIDCardModal(p)} className="text-green-600 hover:text-green-800 transition" title={t.printID}>
                             <CreditCard size={18} />
                          </button>
                          <button onClick={() => openEditModal(p)} className="text-blue-600 hover:underline">{t.edit}</button>
                          <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">{t.delete}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Edit Passport" : t.addNew}
      >
        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Image Upload Section */}
          <div className="flex items-center justify-center w-full mb-4">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 relative overflow-hidden">
                {formData.passportImage ? (
                  <img src={formData.passportImage} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="Preview" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-center text-center px-4">{t.uploadText}</p>
                  </div>
                )}
                <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t.fullName}</label>
            <input 
              required
              className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t.passportNo}</label>
              <input 
                required
                className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                value={formData.passportNumber}
                onChange={e => setFormData({...formData, passportNumber: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.nationality}</label>
              <input 
                className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                value={formData.nationality}
                onChange={e => setFormData({...formData, nationality: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t.gender}</label>
              <select 
                className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value})}
              >
                <option value="Male">{t.male}</option>
                <option value="Female">{t.female}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.status}</label>
              <select 
                className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="Active">{t.statusActive}</option>
                <option value="Inactive">{t.statusInactive}</option>
                <option value="Lost/Stolen">{t.statusLost}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium mb-1">{t.issueDate}</label>
              <input 
                type="date"
                required
                className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                value={formData.issueDate}
                onChange={e => setFormData({...formData, issueDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.expiryDate}</label>
              <input 
                type="date"
                required
                className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                value={formData.expiryDate}
                onChange={e => setFormData({...formData, expiryDate: e.target.value})}
              />
            </div>
          </div>
          
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">{t.cancel}</button>
            <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t.save}</button>
          </div>
        </form>
      </Modal>

      {/* ID Card Modal */}
      <Modal
        isOpen={isIDCardModalOpen}
        onClose={() => setIsIDCardModalOpen(false)}
        title="Passport ID Card View"
        maxWidth="max-w-2xl"
      >
        <IDCard passport={selectedPassport} t={t} />
      </Modal>

    </div>
  );
}
