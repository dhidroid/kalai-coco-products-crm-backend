const api = new ApiService();
let productions = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!api.isAuthenticated()) {
    window.location.href = '/login';
    return;
  }

  initUserInfo();
  initNavigation();
  loadProductions();
  loadProducts();
});

function initUserInfo() {
  const user = api.getUser();
  if (user) {
    const nameEls = document.querySelectorAll('#user-name');
    const avatarEls = document.querySelectorAll('#user-avatar');
    nameEls.forEach((el) => (el.textContent = `${user.firstName} ${user.lastName}`));
    avatarEls.forEach((el) => {
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

async function loadProductions() {
  const tbody = document.getElementById('productions-table-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" class="loading"><div class="spinner"></div></td></tr>`;

  try {
    const response = await api.get('/productions?limit=100');
    productions = response.data || [];
    renderProductions();
  } catch (error) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="alert alert-error">
            <i data-lucide="alert-circle"></i>
            <span>Error loading productions: ${error.message}</span>
          </div>
        </td>
      </tr>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

function renderProductions() {
  const tbody = document.getElementById('productions-table-body');
  if (!tbody) return;

  if (productions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <i data-lucide="factory" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 12px;"></i>
          <h3>No production logs found</h3>
          <p>Start tracking your manufacture by adding a new log.</p>
        </td>
      </tr>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  tbody.innerHTML = productions
    .map(
      (p) => `
    <tr>
      <td style="font-weight: 500;">${new Date(p.production_date).toLocaleDateString('en-IN')}</td>
      <td style="font-weight: 600;">${p.batch_number}</td>
      <td style="color: var(--primary); font-weight: 500;">${p.product_name}</td>
      <td style="font-weight: 600;">${parseFloat(p.quantity).toLocaleString('en-IN')}</td>
      <td><span class="status-badge status-draft" style="font-size: 0.7rem;">${p.unit}</span></td>
      <td style="font-size: 0.75rem; color: var(--text-secondary); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.notes || '-'}</td>
      <td>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-sm btn-primary" onclick="editProduction(${p.production_id})" title="Edit entry">
            <i data-lucide="edit-3" style="width: 14px;"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteProduction(${p.production_id})" title="Delete entry">
            <i data-lucide="trash-2" style="width: 14px;"></i>
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function loadProducts() {
  try {
    const response = await api.get('/products');
    const products = response.data || [];
    const select = document.getElementById('product-id');
    if (select) {
      select.innerHTML =
        '<option value="">Select Product To Log</option>' +
        products
          .map(
            (p) =>
              `<option value="${p.product_id}" data-unit="${p.unit}">${p.product_name} (${p.unit})</option>`
          )
          .join('');

      select.addEventListener('change', (e) => {
        const option = e.target.selectedOptions[0];
        if (option && option.dataset.unit) {
          document.getElementById('production-unit').value = option.dataset.unit;
        }
      });
    }
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

function openProductionModal() {
  const modal = document.getElementById('production-modal');
  document.getElementById('production-modal-title').textContent = 'Log New Production';
  const form = document.getElementById('production-form');
  form.reset();
  document.getElementById('production-id-hidden').value = '';
  document.getElementById('production-date').value = new Date().toISOString().split('T')[0];

  // Suggest a batch number
  const year = new Date().getFullYear();
  const dayOfYear = Math.floor((new Date() - new Date(year, 0, 0)) / 1000 / 60 / 60 / 24);
  document.getElementById('batch-number').value =
    `B-${year}-${String(dayOfYear).padStart(3, '0')}-${Math.floor(Math.random() * 100)}`;

  modal.classList.add('active');
}

function editProduction(id) {
  const p = productions.find((x) => x.production_id === id);
  if (!p) return;

  const modal = document.getElementById('production-modal');
  document.getElementById('production-modal-title').textContent = 'Edit Production Log';
  document.getElementById('production-id-hidden').value = p.production_id;
  document.getElementById('production-date').value = p.production_date.split('T')[0];
  document.getElementById('batch-number').value = p.batch_number;
  document.getElementById('product-id').value = p.product_id;
  document.getElementById('production-quantity').value = p.quantity;
  document.getElementById('production-unit').value = p.unit;
  document.getElementById('production-notes').value = p.notes || '';

  modal.classList.add('active');
}

async function submitProduction() {
  const form = document.getElementById('production-form');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = new FormData(form);
  const id = document.getElementById('production-id-hidden').value;

  const productionData = {
    productId: parseInt(formData.get('productId')),
    batchNumber: formData.get('batchNumber'),
    quantity: parseFloat(formData.get('quantity')),
    unit: formData.get('unit'),
    productionDate: formData.get('productionDate'),
    notes: formData.get('notes'),
  };

  const submitBtn = document.querySelector('#production-modal .modal-footer .btn-primary');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="spinner" style="width: 14px; height: 14px; border-width: 2px; margin-right: 8px;"></span> Saving...`;

  try {
    let response;
    if (id) {
      response = await api.put(`/productions/${id}`, productionData);
    } else {
      response = await api.post('/productions', productionData);
    }

    if (response.success) {
      closeModal('production-modal');
      loadProductions();
      showToast(id ? 'Entry updated!' : 'Production entry saved!', 'success');
    }
  } catch (error) {
    alert('Error logging: ' + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

async function deleteProduction(id) {
  if (!confirm('Are you sure you want to delete this log?')) return;
  try {
    await api.delete(`/productions/${id}`);
    loadProductions();
    showToast('Entry removed', 'success');
  } catch (error) {
    alert('Error deleting: ' + error.message);
  }
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `alert alert-${type}`;
  toast.style.cssText =
    'position: fixed; bottom: 24px; right: 24px; z-index: 9999; min-width: 280px; box-shadow: var(--shadow-xl); animation: fadeIn 0.3s ease;';
  toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i> <span>${message}</span>`;
  document.body.appendChild(toast);
  if (typeof lucide !== 'undefined') lucide.createIcons();
  setTimeout(() => toast.remove(), 3000);
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function logout() {
  api.logout();
  window.location.href = '/login';
}

window.openProductionModal = openProductionModal;
window.editProduction = editProduction;
window.submitProduction = submitProduction;
window.deleteProduction = deleteProduction;
window.closeModal = closeModal;
window.logout = logout;
