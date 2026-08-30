// ============ KOMPETENSI RENDERER ============
class KompetensiRenderer {
  constructor() {
    this.api = new ProfileDataAPI();
    this.currentTahun = 'all';
  }

  // ===== RENDER REKAP =====
  async renderRekap(containerId, tahun = 'all') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`[KompetensiRenderer] Container ${containerId} tidak ditemukan`);
      return;
    }

    container.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Memuat data rekapitulasi...</p>
      </div>
    `;

    try {
      this.currentTahun = tahun;
      const data = await this.api.getRekapKompetensi(tahun);
      
      const statHtml = this.renderStats(data.statistik);
      const tableHtml = this.renderTable(data.data);
      const filterHtml = this.renderFilter(data.statistik.tahunTersedia || []);

      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h2>📊 Rekapitulasi Pengembangan Kompetensi</h2>
            <span class="badge-count">${data.statistik.totalPelatihan || 0} Pelatihan</span>
          </div>
          
          <div class="tahun-filter">
            ${filterHtml}
          </div>
          
          ${statHtml}
          
          <div style="overflow-x: auto;">
            ${tableHtml}
          </div>
        </div>
      `;

      // Event listener untuk filter tahun
      const filterSelect = container.querySelector('#tahunFilter');
      if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
          this.renderRekap(containerId, e.target.value);
        });
      }

      // Event listener untuk tombol lihat sertifikat
      container.querySelectorAll('.btn-sertifikat').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          const link = this.getAttribute('data-link');
          if (link && link !== '-' && link !== '') {
            window.open(link, '_blank');
          } else {
            alert('Sertifikat belum tersedia untuk pelatihan ini.');
          }
        });
      });

    } catch (error) {
      console.error('[KompetensiRenderer] Error:', error);
      container.innerHTML = `
        <div class="card" style="padding: 40px; text-align: center; color: var(--danger);">
          <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 15px;"></i>
          <h3>Gagal Memuat Data</h3>
          <p>${error.message}</p>
          <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 15px;">
            <i class="fas fa-sync"></i> Coba Lagi
          </button>
        </div>
      `;
    }
  }

  // ===== RENDER STATS =====
  renderStats(statistik) {
    if (!statistik) return '';

    const kategoriItems = Object.entries(statistik.kategori || {})
      .map(([key, value]) => `
        <div class="stat-box">
          <div class="number">${value}</div>
          <div class="label">${key}</div>
        </div>
      `).join('');

    return `
      <div class="rekap-stats">
        <div class="stat-box">
          <div class="number">${statistik.totalPelatihan || 0}</div>
          <div class="label">Total Pelatihan</div>
        </div>
        <div class="stat-box">
          <div class="number">${statistik.totalJam || 0}</div>
          <div class="label">Total Jam (JP)</div>
        </div>
        ${kategoriItems}
      </div>
    `;
  }

  // ===== RENDER TABLE (DIPERBARUI dengan kolom Sertifikat) =====
  renderTable(data) {
    if (!data || data.length === 0) {
      return `
        <div style="text-align: center; padding: 40px; color: var(--gray);">
          <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px;"></i>
          <p>Belum ada data pengembangan kompetensi</p>
        </div>
      `;
    }

    // Header tabel dengan tambahan kolom Sertifikat
    const headers = ['No', 'Nama Pelatihan', 'Jenis', 'Lembaga', 'Durasi (JP)', 'Nilai', 'Status', 'Sertifikat'];
    
    const rows = data.map((item, index) => {
      // Cek link sertifikat dari berbagai kemungkinan nama kolom
      const linkSertifikat = item.Link_Sertifikat || item.link_sertifikat || item['Link Sertifikat'] || item['link_sertifikat'] || '-';
      const hasSertifikat = linkSertifikat !== '-' && linkSertifikat !== '' && linkSertifikat !== null && linkSertifikat !== undefined;
      
      return `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${item.Nama_Pelatihan || '-'}</strong></td>
        <td>${item.Jenis_Pelatihan || '-'}</td>
        <td>${item.Lembaga_Penyelenggara || '-'}</td>
        <td>${item.Durasi_Jam || 0}</td>
        <td>${item.Nilai || '-'}</td>
        <td>
          <span style="display: inline-block; padding: 2px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; background: ${item.Status === 'Selesai' ? '#10b981' : '#f59e0b'}; color: white;">
            ${item.Status || 'Proses'}
          </span>
        </td>
        <td style="text-align: center;">
          <button 
            class="btn-sertifikat" 
            data-link="${linkSertifikat}"
            style="
              background: ${hasSertifikat ? 'var(--gradient-primary)' : 'var(--light-gray)'};
              border: none;
              border-radius: 50%;
              width: 36px;
              height: 36px;
              cursor: ${hasSertifikat ? 'pointer' : 'not-allowed'};
              color: ${hasSertifikat ? 'white' : 'var(--gray)'};
              transition: var(--transition);
              opacity: ${hasSertifikat ? '1' : '0.5'};
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 0.9rem;
            "
            ${hasSertifikat ? '' : 'disabled'}
            title="${hasSertifikat ? 'Klik untuk melihat sertifikat' : 'Sertifikat belum tersedia'}"
          >
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `}).join('');

    return `
      <table class="rekap-table">
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  // ===== RENDER FILTER =====
  renderFilter(tahunList) {
    let options = `<option value="all">📅 Semua Tahun</option>`;
    tahunList.forEach(tahun => {
      const selected = this.currentTahun === tahun ? 'selected' : '';
      options += `<option value="${tahun}" ${selected}>${tahun}</option>`;
    });

    return `
      <label style="font-weight: 600; color: var(--gray);">Filter Tahun:</label>
      <select id="tahunFilter">${options}</select>
    `;
  }
}

window.KompetensiRenderer = KompetensiRenderer;
