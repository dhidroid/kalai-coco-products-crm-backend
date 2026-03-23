const api = new ApiService();
let currentPage = 'dashboard';
let invoices = [];
let products = [];
let customers = [];

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
    const nameEl = document.getElementById('user-name');
    const avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = `${user.firstName} ${user.lastName}`;
    if (avatarEl) {
      const initials = (user.firstName?.[0] || 'U') + (user.lastName?.[0] || '');
      avatarEl.textContent = initials.toUpperCase();
    }
  }
}

function initNavigation() {
  document.querySelectorAll('.sidebar-menu a[data-page]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      // Navigate to dedicated page URLs for non-dashboard pages
      if (page === 'invoices') {
        window.location.href = '/invoices';
      } else if (page === 'products') {
        window.location.href = '/products';
      } else if (page === 'customers') {
        window.location.href = '/customers';
      } else {
        navigateTo(page);
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

function navigateTo(page) {
  currentPage = page;

  document.querySelectorAll('.sidebar-menu a').forEach((a) => a.classList.remove('active'));
  document.querySelector(`.sidebar-menu a[data-page="${page}"]`)?.classList.add('active');

  loadPage(page);
}

function loadPage(page) {
  const contentArea = document.getElementById('content-area');
  const pageTitle = document.getElementById('page-title');

  switch (page) {
    case 'dashboard':
      if (pageTitle) pageTitle.textContent = 'Dashboard';
      loadDashboard(contentArea);
      break;
    default:
      if (pageTitle) pageTitle.textContent = 'Dashboard';
      loadDashboard(contentArea);
  }
}

async function loadDashboard(container) {
  container.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;

  try {
    // Fetch full invoice list for correct stats
    const [invoicesRes, usersRes, productsRes] = await Promise.all([
      api.get('/invoices?limit=100'),
      api.get('/users'),
      api.get('/products?limit=100'),
    ]);

    const invoiceList = invoicesRes.data || [];
    const userList = usersRes.data || [];
    const productList = productsRes.data || [];

    const totalRevenue = invoiceList
      .filter((i) => i.invoice_status === 'paid')
      .reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0);

    const pendingCount = invoiceList.filter(
      (i) => i.invoice_status === 'sent' || i.invoice_status === 'finalized'
    ).length;

    const recentInvoices = invoiceList.slice(0, 10);

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Invoices</div>
          <div class="stat-value">${invoiceList.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Revenue (Paid)</div>
          <div class="stat-value">₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pending Invoices</div>
          <div class="stat-value">${pendingCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Customers</div>
          <div class="stat-value">${userList.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Products</div>
          <div class="stat-value">${productList.length}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Recent Invoices</h3>
          <a href="/invoices" class="btn btn-primary btn-sm">View All Invoices</a>
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
              ${
                recentInvoices.length === 0
                  ? `
              <tr>
                <td colspan="6" class="empty-state">
                  <h3>No invoices yet</h3>
                  <p>Create your first invoice</p>
                </td>
              </tr>
            `
                  : recentInvoices
                      .map(
                        (inv) => `
              <tr>
                <td>${inv.invoice_number}</td>
                <td>${new Date(inv.invoice_date).toLocaleDateString('en-IN')}</td>
                <td>${inv.bill_to_name || 'N/A'}</td>
                <td>₹${(parseFloat(inv.total_amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td><span class="status-badge status-${inv.invoice_status}">${inv.invoice_status}</span></td>
                <td>
                  <button class="btn btn-sm btn-secondary" onclick="viewInvoice(${inv.invoice_id})">View</button>
                  <button class="btn btn-sm btn-primary" onclick="previewInvoice(${inv.invoice_id})">Preview</button>
                </td>
              </tr>
            `
                      )
                      .join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `<div class="alert alert-error">Error loading dashboard: ${error.message}</div>`;
  }
}

function openInvoiceModal() {
  // Navigate to invoices page where the modal lives
  window.location.href = '/invoices';
}

async function viewInvoice(invoiceId) {
  try {
    const response = await api.get(`/invoices/${invoiceId}`);
    const invoice = response.data;

    const itemsList = invoice.items
      ? invoice.items
          .map((i) => `${i.description} - ${i.quantity} x ₹${i.unit_price} = ₹${i.item_total}`)
          .join('\n')
      : 'No items';

    alert(
      `Invoice: ${invoice.invoice_number}\nDate: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}\n\nItems:\n${itemsList}\n\nTotal: ₹${invoice.total_amount}\nStatus: ${invoice.invoice_status}`
    );
  } catch (error) {
    alert('Error loading invoice: ' + error.message);
  }
}

async function previewInvoice(invoiceId) {
  window.open(`/api/invoices/${invoiceId}/preview`, '_blank');
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove('active');
}

function logout() {
  api.logout();
  window.location.href = '/login';
}

window.navigateTo = navigateTo;
window.openInvoiceModal = openInvoiceModal;
window.closeModal = closeModal;
window.viewInvoice = viewInvoice;
window.previewInvoice = previewInvoice;
window.logout = logout;
