const api = new ApiService();
let currentPage = 'dashboard';

document.addEventListener('DOMContentLoaded', () => {
  if (!api.isAuthenticated()) {
    window.location.href = '/login';
    return;
  }

  initUserInfo();
  initNavigation();
  loadPage(currentPage);
});

function initUserInfo() {
  const user = api.getUser();
  if (user) {
    const nameEls = document.querySelectorAll('#user-name');
    const avatarEls = document.querySelectorAll('#user-avatar');
    nameEls.forEach(el => el.textContent = `${user.firstName} ${user.lastName}`);
    avatarEls.forEach(el => {
      const initials = (user.firstName?.[0] || 'U') + (user.lastName?.[0] || '');
      el.textContent = initials.toUpperCase();
    });
  }
}

function initNavigation() {
  document.querySelectorAll('.sidebar-menu a[data-page]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const page = link.dataset.page;
      if (page) {
        e.preventDefault();
        window.location.href = `/${page}`;
      }
    });
  });

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
}

function loadPage(page) {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;

  switch (page) {
    case 'dashboard':
      loadDashboard(contentArea);
      break;
    default:
      loadDashboard(contentArea);
  }
}

async function loadDashboard(container) {
  container.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;

  try {
    const summaryRes = await api.get('/invoices/summary');
    const { summary, recentInvoices, recentProductions } = summaryRes.data;

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">Total Revenue</span>
          <div class="stat-value">₹${(parseFloat(summary.total_revenue) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div class="stat-icon"><i data-lucide="indian-rupee"></i></div>
        </div>
        <div class="stat-card">
          <span class="stat-label">Total Invoices</span>
          <div class="stat-value">${summary.total_invoices || 0}</div>
          <div class="stat-icon"><i data-lucide="file-text"></i></div>
        </div>
        <div class="stat-card">
          <span class="stat-label">Pending Invoices</span>
          <div class="stat-value">${summary.pending_invoices || 0}</div>
          <div class="stat-icon"><i data-lucide="clock"></i></div>
        </div>
        <div class="stat-card">
          <span class="stat-label">Weekly Production</span>
          <div class="stat-value">${recentProductions.length} logs</div>
          <div class="stat-icon"><i data-lucide="factory"></i></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Recent Invoices</h3>
          <a href="/invoices" class="btn btn-secondary btn-sm">View All</a>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${recentInvoices.length === 0 ? `
                <tr>
                  <td colspan="6" class="empty-state">
                    <i data-lucide="file-x" style="width: 48px; height: 48px; color: var(--text-muted);"></i>
                    <h3>No invoices yet</h3>
                    <p>Start by creating your first invoice.</p>
                  </td>
                </tr>
              ` : recentInvoices.map(inv => {
                const customerName = inv.bill_to_name || `${inv.first_name || ''} ${inv.last_name || ''}`.trim() || 'N/A';
                return `
                <tr>
                  <td style="font-weight: 600;">${inv.invoice_number}</td>
                  <td>${new Date(inv.created_at).toLocaleDateString('en-IN')}</td>
                  <td>${customerName}</td>
                  <td style="font-weight: 600;">₹${(parseFloat(inv.total_amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td><span class="status-badge status-${inv.invoice_status}">${inv.invoice_status}</span></td>
                  <td>
                    <div style="display: flex; gap: 8px;">
                      <button class="btn btn-sm btn-secondary" onclick="viewInvoice(${inv.invoice_id})"><i data-lucide="eye" style="width: 14px;"></i></button>
                      <button class="btn btn-sm btn-primary" onclick="downloadPdf(${inv.invoice_id})"><i data-lucide="download" style="width: 14px;"></i></button>
                    </div>
                  </td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Recent Production Logs</h3>
          <a href="/productions" class="btn btn-secondary btn-sm">View All</a>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Batch #</th>
              </tr>
            </thead>
            <tbody>
              ${recentProductions.length === 0 ? `
                <tr>
                  <td colspan="4" class="empty-state">No recent logs</td>
                </tr>
              ` : recentProductions.map(p => `
                <tr>
                  <td>${new Date(p.production_date).toLocaleDateString('en-IN')}</td>
                  <td style="color: var(--primary); font-weight: 500;">${p.product_name}</td>
                  <td style="font-weight: 600;">${p.quantity} ${p.unit}</td>
                  <td><span class="status-badge status-draft" style="font-size: 0.7rem;">${p.batch_number}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

  } catch (error) {
    container.innerHTML = `
      <div class="alert alert-error">
        <i data-lucide="alert-circle"></i>
        <span>Error loading dashboard metrics: ${error.message}</span>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

async function viewInvoice(id) {
  try {
    const res = await api.get(`/invoices/${id}`);
    const inv = res.data;
    const body = document.getElementById('view-invoice-body');
    if (!body) {
      alert(`Invoice: ${inv.invoice_number}\nTotal: ₹${inv.total_amount}`);
      return;
    }

    const itemsHtml = (inv.items || []).map(i => `
            <tr>
                <td>${i.product_name}</td>
                <td>${i.quantity}</td>
                <td>₹${i.unit_price}</td>
                <td>₹${i.item_total}</td>
            </tr>
        `).join('');

    body.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                    <strong>Invoice #:</strong> ${inv.invoice_number}<br>
                    <strong>Date:</strong> ${new Date(inv.invoice_date).toLocaleDateString()}<br>
                    <strong>Status:</strong> <span class="status-badge status-${inv.invoice_status}">${inv.invoice_status}</span>
                </div>
                <div>
                    <strong>Customer:</strong> ${inv.bill_to_name || 'N/A'}<br>
                    <strong>Vehicle:</strong> ${inv.vehicle_number || '-'}<br>
                    <strong>Supply Date:</strong> ${inv.date_of_supply ? new Date(inv.date_of_supply).toLocaleDateString() : '-'}
                </div>
            </div>
            <div class="table-container">
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
                            <td><strong>₹${inv.total_amount}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        const footer = document.querySelector('#view-invoice-modal .modal-footer');
        let actionButtons = '';
        
        if (inv.invoice_status === 'draft') {
            actionButtons += `<button class="btn btn-success" onclick="updateInvoiceStatus(${inv.invoice_id}, 'issued')">Mark Issued</button>`;
        } else if (inv.invoice_status === 'issued') {
            actionButtons += `<button class="btn btn-success" onclick="updateInvoiceStatus(${inv.invoice_id}, 'paid')">Mark Paid</button>`;
        }
        
        if (inv.invoice_status !== 'paid' && inv.invoice_status !== 'cancelled') {
            actionButtons += `<button class="btn btn-danger" onclick="updateInvoiceStatus(${inv.invoice_id}, 'cancelled')">Cancel</button>`;
        }

        if (footer) {
            footer.innerHTML = `
                <div style="flex-grow: 1; display: flex; gap: 8px;">${actionButtons}</div>
                <button class="btn btn-secondary" onclick="closeModal('view-invoice-modal')">Close</button>
                <button class="btn btn-primary" onclick="downloadPdf(${id})">Download PDF</button>
            `;
        }
        
        document.getElementById('view-invoice-modal').classList.add('active');
  } catch (error) {
    alert('Error loading invoice: ' + error.message);
  }
}

async function downloadPdf(invoiceId) {
  try {
    const token = api.getToken();
    window.open(`/api/invoices/${invoiceId}/pdf?token=${token}`, '_blank');
  } catch (error) {
    alert('Error downloading PDF: ' + error.message);
  }
}

async function updateInvoiceStatus(id, status) {
    if (!confirm(`Are you sure you want to mark this invoice as ${status}?`)) return;
    try {
        await api.patch(`/invoices/${id}/status`, { status });
        closeModal('view-invoice-modal');
        loadDashboard(document.getElementById('content-area')); // reload dashboard
        const toast = document.createElement('div');
        toast.className = 'alert alert-success';
        toast.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:9999;';
        toast.innerHTML = `<span>Invoice marked as ${status}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    } catch (error) {
        alert(error.message);
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function logout() {
  api.logout();
  window.location.href = '/login';
}

window.viewInvoice = viewInvoice;
window.downloadPdf = downloadPdf;
window.updateInvoiceStatus = updateInvoiceStatus;
window.closeModal = closeModal;
window.logout = logout;
