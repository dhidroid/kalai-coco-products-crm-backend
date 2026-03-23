const api = new ApiService();
let invoices = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!api.isAuthenticated()) {
    window.location.href = '/login';
    return;
  }

  initNavigation();
  loadInvoices();
});

function initNavigation() {
  document.querySelectorAll('.sidebar-menu a[data-page]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('/')) {
        // Let browser handle navigation
        return;
      }
      e.preventDefault();
      const page = link.dataset.page;
      window.location.href = `/${page}`;
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

async function loadInvoices() {
  const tbody = document.getElementById('invoices-table-body');

  try {
    const response = await api.get('/invoices?limit=100');
    invoices = response.data || [];
    renderInvoices();
  } catch (error) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="alert alert-error">Error loading invoices: ${error.message}</div>
        </td>
      </tr>
    `;
  }
}

function renderInvoices() {
  const tbody = document.getElementById('invoices-table-body');
  if (!tbody) return;

  if (invoices.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <h3>No invoices</h3>
          <p>Create your first invoice</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = invoices
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
        <button class="btn btn-sm btn-success" onclick="previewInvoice(${inv.invoice_id})">Preview</button>
        <button class="btn btn-sm btn-danger" onclick="deleteInvoice(${inv.invoice_id})">Delete</button>
      </td>
    </tr>
  `
    )
    .join('');
}

function openInvoiceModal() {
  const modal = document.getElementById('invoice-modal');
  modal.classList.add('active');

  document.getElementById('invoice-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('date-of-supply').value = new Date().toISOString().split('T')[0];

  generateInvoiceNumber();
  loadCustomersForSelect();
  loadProductsForItems();
}

async function generateInvoiceNumber() {
  try {
    const response = await api.get('/invoices/generate-number');
    document.getElementById('invoice-number').value = response.data.invoiceNumber;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    // Fallback: generate a simple number client-side
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    document.getElementById('invoice-number').value = `INV-${dateStr}-${Math.floor(Math.random() * 9000) + 1000}`;
  }
}

async function loadCustomersForSelect() {
  try {
    const response = await api.get('/users');
    const users = response.data || [];

    const billTo = document.getElementById('bill-to');
    const shipTo = document.getElementById('ship-to');

    // Use user_id (DB column) or fall back to id
    const options = users
      .map((u) => {
        const uid = u.user_id || u.id;
        return `<option value="${uid}">${u.firstName} ${u.lastName}${u.gstin ? ' — ' + u.gstin : ''}</option>`;
      })
      .join('');

    billTo.innerHTML = '<option value="">Select Customer</option>' + options;
    shipTo.innerHTML = '<option value="">Same as Bill To</option>' + options;
  } catch (error) {
    console.error('Error loading customers:', error);
  }
}

async function loadProductsForItems() {
  try {
    const response = await api.get('/products');
    const products = response.data || [];

    window.allProducts = products;

    document.querySelectorAll('.item-product').forEach((select) => {
      select.innerHTML =
        '<option value="">Select Product</option>' +
        products
          .map(
            (p) =>
              `<option value="${p.product_id}" data-price="${p.price}" data-unit="${p.unit}">${p.product_name} (${p.unit})</option>`
          )
          .join('');
    });

    // Attach change listener to existing first row
    document.querySelectorAll('.item-product').forEach((select) => {
      select.addEventListener('change', onProductSelect);
    });
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

function onProductSelect(e) {
  const option = e.target.selectedOptions[0];
  if (option && option.dataset.price) {
    const row = e.target.closest('.item-row');
    if (row) {
      const priceInput = row.querySelector('.item-price');
      if (priceInput) priceInput.value = option.dataset.price;
    }
  }
}

function addItem() {
  const container = document.getElementById('invoice-items');
  const row = document.createElement('div');
  row.className = 'form-row item-row';
  row.innerHTML = `
    <div class="form-group" style="flex: 2;">
      <label>Product</label>
      <select name="productId" class="item-product" required>
        <option value="">Select Product</option>
      </select>
    </div>
    <div class="form-group">
      <label>Quantity</label>
      <input type="number" name="quantity" class="item-quantity" min="1" value="1" required>
    </div>
    <div class="form-group">
      <label>Unit Price</label>
      <input type="number" name="unitPrice" class="item-price" min="0" step="0.01" required>
    </div>
    <div class="form-group">
      <label>&nbsp;</label>
      <button type="button" class="btn btn-danger btn-sm" onclick="removeItem(this)">Remove</button>
    </div>
  `;
  container.appendChild(row);

  if (window.allProducts) {
    row.querySelector('.item-product').innerHTML =
      '<option value="">Select Product</option>' +
      window.allProducts
        .map(
          (p) =>
            `<option value="${p.product_id}" data-price="${p.price}" data-unit="${p.unit}">${p.product_name} (${p.unit})</option>`
        )
        .join('');
  }

  row.querySelector('.item-product').addEventListener('change', onProductSelect);
}

function removeItem(btn) {
  const container = document.getElementById('invoice-items');
  if (container.querySelectorAll('.item-row').length > 1) {
    btn.closest('.item-row').remove();
  }
}

async function submitInvoice() {
  const form = document.getElementById('invoice-form');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const submitBtn = document.querySelector('#invoice-modal .modal-footer .btn-primary');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';
  }

  const formData = new FormData(form);
  const billToUserId = parseInt(formData.get('billToUserId'));
  const shipToUserIdRaw = formData.get('shipToUserId');

  const invoiceData = {
    invoiceNumber: formData.get('invoiceNumber'),
    invoiceDate: formData.get('invoiceDate'),
    billToUserId,
    shipToUserId: shipToUserIdRaw ? parseInt(shipToUserIdRaw) : billToUserId,
    vehicleNumber: formData.get('vehicleNumber') || undefined,
    dateOfSupply: formData.get('dateOfSupply') || undefined,
    sgstRate: parseFloat(formData.get('sgstRate')) || 9.0,
    cgstRate: parseFloat(formData.get('cgstRate')) || 9.0,
    igstRate: parseFloat(formData.get('igstRate')) || 0.0,
  };

  try {
    const response = await api.post('/invoices', invoiceData);

    if (response.success) {
      const invoiceId = response.data.invoiceId;

      const itemRows = document.querySelectorAll('.item-row');
      const itemPromises = [];

      for (const row of itemRows) {
        const productId = parseInt(row.querySelector('.item-product').value);
        const quantity = parseFloat(row.querySelector('.item-quantity').value);
        const unitPrice = parseFloat(row.querySelector('.item-price').value);

        if (productId && quantity && unitPrice) {
          itemPromises.push(
            api.post(`/invoices/${invoiceId}/items`, {
              productId,
              quantity,
              unitPrice,
            })
          );
        }
      }

      await Promise.all(itemPromises);

      closeModal('invoice-modal');
      loadInvoices();
      showToast('Invoice created successfully!', 'success');
    }
  } catch (error) {
    alert('Error creating invoice: ' + error.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Invoice';
    }
  }
}

async function viewInvoice(invoiceId) {
  try {
    const response = await api.get(`/invoices/${invoiceId}`);
    const invoice = response.data;

    const itemsList = invoice.items
      ? invoice.items
          .map((i) => `• ${i.description} — ${i.quantity} × ₹${i.unit_price} = ₹${i.item_total}`)
          .join('\n')
      : 'No items';

    alert(
      `📄 Invoice: ${invoice.invoice_number}\n📅 Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}\n👤 Customer: ${invoice.bill_to_name || 'N/A'}\n\n📦 Items:\n${itemsList}\n\n💰 Subtotal: ₹${invoice.subtotal}\n   SGST (${invoice.sgst_rate}%): ₹${invoice.sgst_amount}\n   CGST (${invoice.cgst_rate}%): ₹${invoice.cgst_amount}\n   Total: ₹${invoice.total_amount}\n\n🏷️ Status: ${invoice.invoice_status}`
    );
  } catch (error) {
    alert('Error loading invoice: ' + error.message);
  }
}

async function previewInvoice(invoiceId) {
  window.open(`/api/invoices/${invoiceId}/preview`, '_blank');
}

async function deleteInvoice(invoiceId) {
  if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
    return;
  }

  try {
    await api.delete(`/invoices/${invoiceId}`);
    loadInvoices();
    showToast('Invoice deleted successfully!', 'success');
  } catch (error) {
    alert('Error deleting invoice: ' + error.message);
  }
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `alert alert-${type}`;
  toast.style.cssText =
    'position: fixed; bottom: 24px; right: 24px; z-index: 9999; min-width: 280px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove('active');
}

function logout() {
  api.logout();
  window.location.href = '/login';
}

window.openInvoiceModal = openInvoiceModal;
window.closeModal = closeModal;
window.addItem = addItem;
window.removeItem = removeItem;
window.submitInvoice = submitInvoice;
window.viewInvoice = viewInvoice;
window.previewInvoice = previewInvoice;
window.deleteInvoice = deleteInvoice;
window.logout = logout;
