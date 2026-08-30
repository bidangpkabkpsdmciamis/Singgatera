// ============ SPIDER CHART ============
class SpiderChart {
  constructor(canvasId) {
    this.canvasId = canvasId;
    this.canvas = document.getElementById(canvasId);
    this.chart = null;
    this.api = new ProfileDataAPI();
    
    if (!this.canvas) {
      console.error(`[SpiderChart] Canvas dengan ID "${canvasId}" tidak ditemukan!`);
    } else {
      console.log(`[SpiderChart] Canvas ditemukan`);
    }
  }

  async loadData() {
    if (!this.canvas) {
      console.error('[SpiderChart] Canvas tidak tersedia');
      const container = document.querySelector('.chart-wrapper');
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px 20px; color: var(--danger);">
            <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
            <p>Error: Canvas chart tidak ditemukan</p>
          </div>
        `;
      }
      return;
    }

    try {
      const container = this.canvas.parentElement;
      if (!container) {
        console.error('[SpiderChart] Parent container tidak ditemukan');
        return;
      }

      container.innerHTML = `
        <div class="loading" style="min-height: 300px;">
          <div class="spinner"></div>
          <p>Memuat data kompetensi...</p>
        </div>
      `;

      const data = await this.api.getChartData();
      this.render(data);
    } catch (error) {
      console.error('[SpiderChart] Error:', error);
      const container = this.canvas?.parentElement;
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; padding: 60px 20px; color: var(--gray);">
            <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; margin-bottom: 15px; color: var(--danger);"></i>
            <h3>Gagal Memuat Chart</h3>
            <p>${error.message}</p>
            <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 15px;">
              <i class="fas fa-sync"></i> Coba Lagi
            </button>
          </div>
        `;
      }
    }
  }

  render(data) {
    if (!this.canvas) {
      console.error('[SpiderChart] Canvas tidak ada saat render');
      return;
    }

    const container = this.canvas.parentElement;
    if (!container) {
      console.error('[SpiderChart] Container tidak ada saat render');
      return;
    }

    if (!data || !data.labels || data.labels.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--gray);">
          <i class="fas fa-chart-pie" style="font-size: 2.5rem; margin-bottom: 15px;"></i>
          <h3>Belum Ada Data Kompetensi</h3>
          <p>Data dimensi kompetensi belum tersedia untuk ASN ini.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    container.appendChild(this.canvas);

    if (typeof Chart === 'undefined') {
      this.loadChartJs(() => this.renderChart(data));
    } else {
      this.renderChart(data);
    }
  }

  renderChart(data) {
    if (!this.canvas) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const colors = [
      'rgba(37, 99, 235, 0.8)',
      'rgba(124, 58, 237, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(239, 68, 68, 0.8)'
    ];

    const datasets = data.datasets.map((dataset, index) => ({
      label: dataset.label || 'Kompetensi',
      data: dataset.data,
      backgroundColor: colors[index % colors.length].replace('0.8', '0.2'),
      borderColor: colors[index % colors.length],
      borderWidth: 2,
      pointBackgroundColor: colors[index % colors.length],
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7
    }));

    this.chart = new Chart(this.canvas, {
      type: 'radar',
      data: {
        labels: data.labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 12, weight: '600' },
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label || ''}: ${(context.parsed.r || 0).toFixed(1)}`;
              }
            }
          }
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { stepSize: 20, font: { size: 10 } },
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
            angleLines: { color: 'rgba(0, 0, 0, 0.1)' },
            pointLabels: {
              font: { size: 12, weight: '600' },
              color: '#1e293b'
            }
          }
        }
      }
    });
  }

  loadChartJs(callback) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    script.onload = callback;
    script.onerror = function() {
      console.error('[SpiderChart] Gagal memuat Chart.js');
      const container = this.canvas?.parentElement;
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px 20px; color: var(--danger);">
            <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
            <p>Gagal memuat library Chart.js. Periksa koneksi internet Anda.</p>
          </div>
        `;
      }
    }.bind(this);
    document.head.appendChild(script);
  }
}

window.SpiderChart = SpiderChart;
