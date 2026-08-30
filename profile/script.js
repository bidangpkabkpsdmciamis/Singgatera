// ============ MAIN SCRIPT ============
document.addEventListener('DOMContentLoaded', async function() {
  
  console.log('=== PROFILE PAGE START ===');
  console.log('[Profile] localStorage loginData:', localStorage.getItem('loginData'));
  console.log('[Profile] window.CONFIG:', window.CONFIG);
  console.log('[Profile] window.IS_LOGGED_IN:', window.IS_LOGGED_IN);
  
  const container = document.getElementById('profileContainer');
  if (!container) {
    console.error('[Profile] ERROR: Elemen #profileContainer tidak ditemukan!');
    document.body.innerHTML = `
      <div style="text-align: center; padding: 80px 20px; font-family: Arial, sans-serif;">
        <h2>⚠️ Error Halaman</h2>
        <p style="color: #666;">Elemen container tidak ditemukan. Pastikan file index.html sudah benar.</p>
        <a href="https://www.singgatera.my.id/" class="btn btn-primary" style="margin-top: 20px; display: inline-block; padding: 12px 30px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px;">
          Kembali ke Home
        </a>
      </div>
    `;
    return;
  }
  
  const isLoggedIn = window.IS_LOGGED_IN || false;
  
  if (!isLoggedIn) {
    console.log('[Profile] ❌ Belum login, menampilkan lock screen');
    showLockedOverlay();
    
    const urlParams = new URLSearchParams(window.location.search);
    const hasRedirect = urlParams.has('loginData');
    
    if (!hasRedirect) {
      console.log('[Profile] 🔄 Tidak ada data login, redirect ke login page');
      const returnUrl = encodeURIComponent(window.location.href);
      setTimeout(() => {
        window.location.href = `https://www.singgatera.my.id/login.html?redirect=${returnUrl}`;
      }, 3000);
    }
    return;
  }

  console.log('[Profile] ✅ Login confirmed, loading data...');

  updateUserInfo();

  try {
    await loadIdentitas();
    
    const kompetensiRenderer = new KompetensiRenderer();
    await kompetensiRenderer.renderRekap('rekapContainer');
    
    const spiderChart = new SpiderChart('spiderChart');
    await spiderChart.loadData();
    
  } catch (error) {
    console.error('[Profile] Error:', error);
    showError(error.message);
  }

  initHeader();
  initScrollTop();
  initMobileToggle();
  
  setupEditButton();
});

// ============ FUNGSI FORMAT TANGGAL ============
function formatDate(dateValue) {
  if (!dateValue || dateValue === '-' || dateValue === '') return '-';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return dateValue;
    }
    const options = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('id-ID', options);
  } catch (e) {
    return dateValue;
  }
}

// ============ UPDATE USER INFO ============
function updateUserInfo() {
  const userNameEl = document.getElementById('userName');
  const dropdownNameEl = document.getElementById('dropdownName');
  const dropdownEmailEl = document.getElementById('dropdownEmail');
  
  const name = window.CONFIG?.USER_NAME || 'Guest';
  const email = window.CONFIG?.USER_EMAIL || '-';
  
  if (userNameEl) userNameEl.textContent = name;
  if (dropdownNameEl) dropdownNameEl.textContent = name;
  if (dropdownEmailEl) dropdownEmailEl.textContent = email;
}

// ============ UPDATE HEADER DENGAN FOTO ============
function updateHeaderPhoto(photoData) {
  const headerIcon = document.getElementById('headerUserIcon');
  if (!headerIcon) return;
  
  if (photoData && (photoData.startsWith('data:image') || photoData.startsWith('http'))) {
    headerIcon.innerHTML = `<img src="${photoData}" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    headerIcon.style.background = 'none';
    headerIcon.style.padding = '0';
    console.log('[Profile] ✅ Foto header diperbarui');
  } else {
    headerIcon.innerHTML = `<i class="fas fa-user"></i>`;
    headerIcon.style.background = '';
    headerIcon.style.padding = '';
    console.log('[Profile] ℹ️ Menggunakan icon default di header');
  }
}

// ============ SHOW LOCKED OVERLAY ============
function showLockedOverlay() {
  if (document.getElementById('lockedOverlay')) return;
  
  const overlay = document.createElement('div');
  overlay.className = 'locked-overlay';
  overlay.id = 'lockedOverlay';
  overlay.innerHTML = `
    <div class="locked-content">
      <div class="lock-icon">
        <i class="fas fa-lock"></i>
      </div>
      <h2>🔒 Akses Terbatas</h2>
      <p>
        Halaman Profil hanya dapat diakses oleh ASN yang sudah login.
        Silakan login terlebih dahulu untuk melihat data profil Anda.
      </p>
      <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
        <a href="https://www.singgatera.my.id/login.html?redirect=${encodeURIComponent(window.location.href)}" class="btn btn-primary">
          <i class="fas fa-sign-in-alt"></i> Login Sekarang
        </a>
        <a href="https://www.singgatera.my.id/" class="btn btn-secondary">
          <i class="fas fa-home"></i> Kembali ke Home
        </a>
      </div>
      <p style="margin-top: 20px; font-size: 0.85rem; color: var(--gray);">
        <i class="fas fa-info-circle"></i> 
        Setelah login, Anda akan dikembalikan ke halaman ini secara otomatis.
      </p>
    </div>
  `;
  document.body.appendChild(overlay);
  
  const container = document.getElementById('profileContainer');
  if (container) {
    container.style.filter = 'blur(8px)';
    container.style.pointerEvents = 'none';
  }
}

// ============ LOAD IDENTITAS ============
async function loadIdentitas() {
  const container = document.getElementById('identitasContainer');
  if (!container) {
    console.error('[Profile] Elemen #identitasContainer tidak ditemukan');
    return;
  }

  try {
    const api = new ProfileDataAPI();
    const data = await api.getIdentitas();

    if (!data) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--gray);">
          <p>Data identitas tidak ditemukan untuk NIP: ${window.CONFIG?.NIP || '-'}</p>
        </div>
      `;
      return;
    }

    // ===== UPDATE AVATAR DI PROFILE =====
    const avatarEl = document.getElementById('profileAvatar') || document.querySelector('.profile-avatar');
    if (avatarEl) {
      const photoData = data.Foto_Profile || '';
      
      if (photoData && (photoData.startsWith('data:image') || photoData.startsWith('http'))) {
        avatarEl.innerHTML = `<img src="${photoData}" alt="Profile Photo" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-user-circle\\'></i>';">`;
        console.log('[Profile] ✅ Foto profile ditampilkan');
        
        // ===== SIMPAN FOTO KE COOKIE UNTUK SUBDOMAIN LAIN =====
        const cookieValue = encodeURIComponent(photoData);
        document.cookie = `headerPhoto=${cookieValue}; path=/; domain=.singgatera.my.id; max-age=86400; SameSite=Lax; Secure`;
        console.log('[Profile] ✅ Foto disimpan ke cookie untuk header');
      } else {
        avatarEl.innerHTML = `<i class="fas fa-user-circle"></i>`;
        // Hapus cookie jika tidak ada foto
        document.cookie = `headerPhoto=; path=/; domain=.singgatera.my.id; max-age=0`;
        console.log('[Profile] ℹ️ Tidak ada foto, cookie dihapus');
      }
    }
    
    // ===== UPDATE HEADER (POJOK KANAN) DENGAN FOTO =====
    const photoData = data.Foto_Profile || '';
    updateHeaderPhoto(photoData);
    
    // ===== UPDATE NAMA =====
    const nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = data.Nama || window.CONFIG?.USER_NAME || 'ASN';
    
    // ===== UPDATE NIP =====
    const nipEl = document.getElementById('profileNip');
    if (nipEl) nipEl.textContent = `NIP: ${data.NIP || window.CONFIG?.NIP || '-'}`;
    
    // ===== UPDATE STATUS =====
    const badgeEl = document.getElementById('profileStatus');
    if (badgeEl) {
      badgeEl.textContent = data.Status_ASN || 'ASN';
      if (data.Status_ASN === 'PNS') {
        badgeEl.classList.add('gold');
      }
    }

    const formattedTanggalLahir = formatDate(data.Tanggal_Lahir);
    const formattedTMTJabatan = formatDate(data.TMT_Jabatan);

    const fields = [
      { label: 'Nama', value: data.Nama },
      { label: 'NIP', value: data.NIP },
      { label: 'Status ASN', value: data.Status_ASN },
      { label: 'Pangkat / Golongan', value: `${data.Pangkat || ''} / ${data.Golongan_Ruang || ''}` },
      { label: 'Email', value: data.Email },
      { label: 'No HP', value: data.No_HP },
      { label: 'Tempat, Tanggal Lahir', value: `${data.Tempat_Lahir || ''}, ${formattedTanggalLahir}` },
      { label: 'Jenis Kelamin', value: data.Jenis_Kelamin },
      { label: 'Agama', value: data.Agama },
      { label: 'Alamat', value: data.Alamat },
      { label: 'Unit Kerja', value: data.Unit_Kerja },
      { label: 'Jabatan', value: data.Jabatan },
      { label: 'TMT Jabatan', value: formattedTMTJabatan },
      { label: 'Pendidikan Terakhir', value: data.Pendidikan_Terakhir },
      { label: 'Tahun Lulus', value: data.Tahun_Lulus }
    ];

    container.innerHTML = fields.map(field => `
      <div class="identitas-item">
        <span class="label">${field.label}</span>
        <span class="value">${field.value || '-'}</span>
      </div>
    `).join('');

  } catch (error) {
    console.error('[Profile] Error loadIdentitas:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 30px; color: var(--danger);">
        <p>Gagal memuat data identitas: ${error.message}</p>
        <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 15px;">
          <i class="fas fa-sync"></i> Coba Lagi
        </button>
      </div>
    `;
  }
}

// ============ SETUP TOMBOL EDIT PROFIL ============
function setupEditButton() {
  const editBtn = document.getElementById('editProfileBtn');
  if (!editBtn) {
    console.warn('[Profile] Tombol edit tidak ditemukan');
    return;
  }

  const newBtn = editBtn.cloneNode(true);
  editBtn.parentNode.replaceChild(newBtn, editBtn);
  
  const btn = document.getElementById('editProfileBtn');
  
  btn.addEventListener('click', async function(e) {
    e.preventDefault();
    
    if (this.disabled) return;
    
    this.disabled = true;
    const icon = this.querySelector('i');
    const text = document.getElementById('editBtnText');
    
    const originalIcon = icon ? icon.className : 'fas fa-edit';
    const originalText = text ? text.textContent : 'Edit Profil';
    
    if (icon) icon.className = 'fas fa-spinner fa-spin';
    if (text) text.textContent = 'Memuat...';
    
    try {
      await openEditProfile();
    } catch (error) {
      console.error('[EditButton] Error:', error);
      alert('Gagal membuka form edit: ' + error.message);
    } finally {
      this.disabled = false;
      if (icon) icon.className = originalIcon;
      if (text) text.textContent = originalText;
    }
  });
}

// ============ FUNGSI BUKA EDIT PROFIL ============
async function openEditProfile() {
  const isLoggedIn = window.IS_LOGGED_IN || false;
  
  if (!isLoggedIn) {
    alert('Silakan login terlebih dahulu untuk mengedit profil.');
    return;
  }
  
  try {
    const editProfile = new EditProfile();
    await editProfile.openEditModal();
  } catch (error) {
    console.error('[EditProfile] Error:', error);
    throw error;
  }
}

// ============ SHOW ERROR ============
function showError(message) {
  const container = document.getElementById('profileContainer');
  if (!container) {
    console.error('[Profile] Elemen #profileContainer tidak ditemukan');
    return;
  }
  
  container.innerHTML = `
    <div style="text-align: center; padding: 80px 20px;">
      <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: var(--danger); margin-bottom: 20px;"></i>
      <h2>Gagal Memuat Profil</h2>
      <p style="color: var(--gray);">${message}</p>
      <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 20px;">
        <i class="fas fa-sync"></i> Refresh
      </button>
    </div>
  `;
}

// ============ INIT HEADER ============
function initHeader() {
  const header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  const userBtn = document.getElementById('userBtn');
  const userDropdown = document.getElementById('userDropdown');
  
  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      userDropdown.classList.remove('active');
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Hapus cookie login
      document.cookie = `loginData=; path=/; domain=.singgatera.my.id; max-age=0`;
      // Hapus cookie foto header
      document.cookie = `headerPhoto=; path=/; domain=.singgatera.my.id; max-age=0`;
      // Hapus localStorage
      localStorage.removeItem('loginData');
      sessionStorage.removeItem('redirectAfterLogin');
      
      // Reset header ke default
      const headerIcon = document.getElementById('headerUserIcon');
      if (headerIcon) {
        headerIcon.innerHTML = `<i class="fas fa-user"></i>`;
        headerIcon.style.background = '';
        headerIcon.style.padding = '';
      }
      
      console.log('[Profile] ✅ Logout: Semua data login dihapus');
      
      alert('Anda telah keluar dari sistem.');
      
      window.location.href = 'https://www.singgatera.my.id/?logout=true';
    });
  }
}

// ============ INIT SCROLL TOP ============
function initScrollTop() {
  const scrollTopBtn = document.getElementById('scrollTop');
  if (!scrollTopBtn) return;
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      scrollTopBtn.classList.add('active');
    } else {
      scrollTopBtn.classList.remove('active');
    }
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ============ INIT MOBILE TOGGLE ============
function initMobileToggle() {
  const mobileToggle = document.getElementById('mobileToggle');
  const nav = document.getElementById('nav');
  
  if (!mobileToggle || !nav) return;
  
  mobileToggle.addEventListener('click', () => {
    nav.classList.toggle('active');
    mobileToggle.innerHTML = nav.classList.contains('active')
      ? '<i class="fas fa-times"></i>'
      : '<i class="fas fa-bars"></i>';
  });

  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !mobileToggle.contains(e.target)) {
      nav.classList.remove('active');
      mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
    }
  });
}

// ============ EXPORT KE GLOBAL ============
window.openEditProfile = openEditProfile;
window.loadIdentitas = loadIdentitas;
window.updateUserInfo = updateUserInfo;
window.updateHeaderPhoto = updateHeaderPhoto;
window.setupEditButton = setupEditButton;
