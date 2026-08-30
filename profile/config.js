// ============ KONFIGURASI ============
const CONFIG = {
  // GAS URL untuk READ (membaca data)
  GAS_URL: 'https://script.google.com/macros/s/AKfycbyxlEVw146kO39Yq3U7zPholU8JK1lLZj0RndoXt4ADBvtlLfCVrELs3lPK1FgFvvU4uw/exec',
  
  // GAS URL untuk WRITE (update identitas ke spreadsheet)
  GAS_WRITE_URL: 'https://script.google.com/macros/s/AKfycbxL071bWbt9CqjFsd0xUaxYZCR9U9itY1GVlulOYJor0f3hIoQBKmiwqRkFu2tFlP6swg/exec',
  
  NIP: '',
  USER_NAME: 'Guest',
  USER_EMAIL: ''
};

// ============ FUNGSI BACA COOKIE ============
function getCookie(name) {
  const cookies = document.cookie.split('; ');
  for (let cookie of cookies) {
    const [key, value] = cookie.split('=');
    if (key === name) {
      try {
        return JSON.parse(decodeURIComponent(value));
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

// ============ FUNGSI CEK LOGIN ============
function checkLoginStatus() {
  try {
    console.log('[Profile] ===== CHECK LOGIN STATUS =====');
    
    // ===== STEP 1: CEK URL PARAMETER =====
    const urlParams = new URLSearchParams(window.location.search);
    const loginDataParam = urlParams.get('loginData');
    
    if (loginDataParam) {
      console.log('[Profile] ✅ Login data ditemukan di URL parameter');
      try {
        const loginData = JSON.parse(decodeURIComponent(loginDataParam));
        localStorage.setItem('loginData', JSON.stringify(loginData));
        
        const cookieValue = encodeURIComponent(JSON.stringify(loginData));
        document.cookie = `loginData=${cookieValue}; path=/; domain=.singgatera.my.id; max-age=86400; SameSite=Lax; Secure`;
        
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        CONFIG.NIP = loginData.username || '';
        CONFIG.USER_NAME = loginData.name || 'Guest';
        CONFIG.USER_EMAIL = loginData.email || '';
        
        console.log('[Profile] ✅ Login valid dari URL! NIP:', CONFIG.NIP);
        return true;
      } catch (e) {
        console.error('[Profile] ❌ Gagal parse login data dari URL:', e);
      }
    }
    
    // ===== STEP 2: CEK COOKIE =====
    const cookieData = getCookie('loginData');
    
    if (cookieData) {
      console.log('[Profile] ✅ Login data ditemukan di COOKIE');
      
      const nip = cookieData.username || '';
      const name = cookieData.name || 'Guest';
      
      if (!nip) {
        console.log('[Profile] ❌ NIP tidak ditemukan di cookie');
        return false;
      }
      
      const loginTime = new Date(cookieData.loginTime);
      const currentTime = new Date();
      const isSameDay = 
        loginTime.getDate() === currentTime.getDate() &&
        loginTime.getMonth() === currentTime.getMonth() &&
        loginTime.getFullYear() === currentTime.getFullYear();
      
      if (!isSameDay) {
        console.log('[Profile] ⚠️ Cookie login sudah kadaluarsa');
        document.cookie = `loginData=; path=/; domain=.singgatera.my.id; max-age=0`;
        return false;
      }
      
      localStorage.setItem('loginData', JSON.stringify(cookieData));
      
      CONFIG.NIP = nip;
      CONFIG.USER_NAME = name;
      CONFIG.USER_EMAIL = cookieData.email || '';
      
      console.log('[Profile] ✅ Login valid dari COOKIE! NIP:', CONFIG.NIP);
      return true;
    }
    
    console.log('[Profile] ❌ Tidak ada cookie login');
    
    // ===== STEP 3: CEK LOCALSTORAGE =====
    const loginData = localStorage.getItem('loginData');
    
    if (loginData) {
      console.log('[Profile] 📦 Login data ditemukan di localStorage (fallback)');
      const userData = JSON.parse(loginData);
      const nip = userData.username || '';
      const name = userData.name || 'Guest';
      
      if (!nip) {
        console.log('[Profile] ❌ NIP tidak ditemukan di localStorage');
        return false;
      }
      
      const loginTime = new Date(userData.loginTime);
      const currentTime = new Date();
      const isSameDay = 
        loginTime.getDate() === currentTime.getDate() &&
        loginTime.getMonth() === currentTime.getMonth() &&
        loginTime.getFullYear() === currentTime.getFullYear();
      
      if (!isSameDay) {
        console.log('[Profile] ⚠️ Login di localStorage sudah kadaluarsa');
        localStorage.removeItem('loginData');
        return false;
      }
      
      const cookieValue = encodeURIComponent(JSON.stringify(userData));
      document.cookie = `loginData=${cookieValue}; path=/; domain=.singgatera.my.id; max-age=86400; SameSite=Lax; Secure`;
      
      CONFIG.NIP = nip;
      CONFIG.USER_NAME = name;
      CONFIG.USER_EMAIL = userData.email || '';
      
      console.log('[Profile] ✅ Login valid dari localStorage! NIP:', CONFIG.NIP);
      return true;
    }
    
    console.log('[Profile] ❌ Tidak ada data login ditemukan sama sekali');
    return false;
    
  } catch (error) {
    console.error('[Profile] ❌ Error checkLoginStatus:', error);
    return false;
  }
}

// ============ FUNGSI LOGOUT ============
function logout() {
  document.cookie = `loginData=; path=/; domain=.singgatera.my.id; max-age=0`;
  localStorage.removeItem('loginData');
  console.log('[Profile] ✅ Logout berhasil - semua data dihapus');
  window.location.href = 'https://www.singgatera.my.id/?logout=true';
}

// ============ EKSEKUSI ============
const IS_LOGGED_IN = checkLoginStatus();

// EXPORT ke window
window.CONFIG = CONFIG;
window.IS_LOGGED_IN = IS_LOGGED_IN;
window.logout = logout;

console.log('[Profile] ========== STATUS AKHIR ==========');
console.log('[Profile] IS_LOGGED_IN:', IS_LOGGED_IN);
console.log('[Profile] CONFIG.NIP:', CONFIG.NIP);
console.log('[Profile] CONFIG.USER_NAME:', CONFIG.USER_NAME);
console.log('[Profile] ===================================');
