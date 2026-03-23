const api = new ApiService();
let products = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!api.isAuthenticated()) {
    window.location.href = '/login';
    return;
  }

  initNavigation();
  loadProducts();
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

async function loadProducts() {
  const tbody = document.getElementById('products-table-body');

  try {
    const response = await api.get('/products?limit=100');
    products = response.data || [];
    renderProducts();
  } catch (error) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">
          <div class="alert alert-error">Error loading products: ${error.message}</div>
        </td>
      </tr>
    `;
  }
}

function renderProducts() {
  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <h3>No products</h3>
          <p>Add your first product</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = products
    .map(
      (p) => `
    <tr>
      <td>${p.product_code}</td>
      <td>${p.product_name}</td>
      <td>${p.description || '-'}</td>
      <td>${p.hsn_code || '-'}</td>
      <td>${p.unit}</td>
      <td>₹${parseFloat(p.price).toFixed(2)}</td>
      <td>${parseFloat(p.tax_rate).toFixed(1)}%</td>
      <td><span class="status-badge ${p.is_active ? 'status-paid' : 'status-cancelled'}">${p.is_active ? 'Active' : 'Inactive'}</span></td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="editProduct(${p.product_id})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.product_id})">Delete</button>
      </td>
    </tr>
  `
    )
    .join('');
}

function openProductModal(productId = null) {
  const modal = document.getElementById('product-modal');
  const title = document.getElementById('product-modal-title');
  const form = document.getElementById('product-form');

  form.reset();
  document.getElementById('product-id').value = '';
  // Reset defaults
  document.getElementById('tax-rate').value = '18.00';
  document.getElementById('unit').value = 'KG';
  document.getElementById('is-active').checked = true;

  if (productId) {
    const product = products.find((p) => p.product_id === productId);
    if (product) {
      title.textContent = 'Edit Product';
      document.getElementById('product-id').value = product.product_id;
      document.getElementById('product-code').value = product.product_code;
      document.getElementById('product-name').value = product.product_name;
      document.getElementById('product-description').value = product.description || '';
      document.getElementById('hsn-code').value = product.hsn_code || '';
      document.getElementById('unit').value = product.unit || 'KG';
      document.getElementById('price').value = product.price;
      document.getElementById('tax-rate').value = product.tax_rate;
      document.getElementById('is-active').checked = product.is_active;
    }
  } else {
    title.textContent = 'Add Product';
  }

  modal.classList.add('active');
}

function editProduct(productId) {
  openProductModal(productId);
}

async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
    return;
  }

  try {
    await api.delete(`/products/${productId}`);
    loadProducts();
    showToast('Product deleted successfully!', 'success');
  } catch (error) {
    alert('Error deleting product: ' + error.message);
  }
}

async function submitProduct() {
  const form = document.getElementById('product-form');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const productId = document.getElementById('product-id').value;
  const formData = new FormData(form);

  const productData = {
    productCode: formData.get('productCode'),
    productName: formData.get('productName'),
    description: formData.get('description') || undefined,
    hsnCode: formData.get('hsnCode') || undefined,
    unit: formData.get('unit') || 'KG',
    price: parseFloat(formData.get('price')),
    taxRate: parseFloat(formData.get('taxRate')) || 18.0,
    isActive: document.getElementById('is-active').checked,
  };

  const submitBtn = document.querySelector('#product-modal .modal-footer .btn-primary');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
  }

  try {
    let response;
    if (productId) {
      response = await api.put(`/products/${productId}`, productData);
    } else {
      response = await api.post('/products', productData);
    }

    if (response.success) {
      closeModal('product-modal');
      loadProducts();
      showToast(productId ? 'Product updated successfully!' : 'Product added successfully!', 'success');
    }
  } catch (error) {
    alert('Error saving product: ' + error.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Product';
    }
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

window.openProductModal = openProductModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.submitProduct = submitProduct;
window.closeModal = closeModal;
window.logout = logout;
