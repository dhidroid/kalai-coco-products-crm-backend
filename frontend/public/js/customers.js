const api = new ApiService();
let customers = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!api.isAuthenticated()) {
    window.location.href = '/login';
    return;
  }

  initUserInfo();
  initNavigation();
  loadCustomers();
});

function initUserInfo() {
  const user = api.getUser();
  if (user) {
    document.getElementById('user-name').textContent = `${user.firstName} ${user.lastName}`;
    const initials = (user.firstName?.[0] || 'U') + (user.lastName?.[0] || '');
    document.getElementById('user-avatar').textContent = initials.toUpperCase();
  }
}

function initNavigation() {
  document.querySelectorAll('.sidebar-menu a[data-page]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('/')) {
        // Let the browser navigate normally to the page
        return;
      }
      e.preventDefault();
    });
  });

  document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
}

async function loadCustomers() {
  const tbody = document.getElementById('customers-table-body');

  try {
    const response = await api.get('/users');
    customers = response.data || [];
    renderCustomers();
  } catch (error) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="alert alert-error">Error loading customers: ${error.message}</div>
        </td>
      </tr>
    `;
  }
}

function renderCustomers() {
  const tbody = document.getElementById('customers-table-body');

  if (customers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <h3>No customers yet</h3>
          <p>Add your first customer</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = customers
    .map(
      (cust) => `
    <tr>
      <td>${cust.firstName || ''} ${cust.lastName || ''}</td>
      <td>${cust.email || 'N/A'}</td>
      <td>${cust.phone || 'N/A'}</td>
      <td>${cust.gstin || 'N/A'}</td>
      <td>${cust.address || 'N/A'}</td>
      <td><span class="status-badge status-finalized">${cust.role || 'user'}</span></td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="viewCustomer(${cust.user_id || cust.id})">View</button>
        <button class="btn btn-sm btn-primary" onclick="editCustomer(${cust.user_id || cust.id})">Edit</button>
      </td>
    </tr>
  `
    )
    .join('');
}

function openCustomerModal(customerId = null) {
  const modal = document.getElementById('customer-modal');
  const title = document.getElementById('customer-modal-title');
  const form = document.getElementById('customer-form');
  const passwordGroup = document.getElementById('password-group');
  const passwordInput = document.getElementById('customer-password');

  form.reset();
  document.getElementById('customer-id').value = '';

  if (customerId) {
    const customer = customers.find((c) => (c.user_id || c.id) === customerId);
    if (customer) {
      title.textContent = 'Edit Customer';
      document.getElementById('customer-id').value = customerId;
      document.getElementById('customer-first-name').value = customer.firstName || '';
      document.getElementById('customer-last-name').value = customer.lastName || '';
      document.getElementById('customer-email').value = customer.email || '';
      document.getElementById('customer-phone').value = customer.phone || '';
      document.getElementById('customer-gstin').value = customer.gstin || '';
      document.getElementById('customer-address').value = customer.address || '';
      // Password not required for edits
      passwordInput.removeAttribute('required');
      passwordGroup.querySelector('label span').textContent = '(leave blank to keep current)';
    }
  } else {
    title.textContent = 'Add Customer';
    passwordInput.setAttribute('required', 'required');
    passwordGroup.querySelector('label span').textContent = '(required for new customers)';
  }

  modal.classList.add('active');
}

function editCustomer(customerId) {
  openCustomerModal(customerId);
}

async function viewCustomer(customerId) {
  try {
    const response = await api.get(`/users/${customerId}`);
    const c = response.data;

    document.getElementById('view-customer-body').innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div><strong>Name:</strong> ${c.firstName} ${c.lastName}</div>
        <div><strong>Email:</strong> ${c.email}</div>
        <div><strong>Phone:</strong> ${c.phone || 'N/A'}</div>
        <div><strong>GSTIN:</strong> ${c.gstin || 'N/A'}</div>
        <div style="grid-column: 1/-1;"><strong>Address:</strong> ${c.address || 'N/A'}</div>
        <div><strong>Role:</strong> ${c.role}</div>
        <div><strong>Created:</strong> ${c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : 'N/A'}</div>
      </div>
    `;
    document.getElementById('view-customer-modal').classList.add('active');
  } catch (error) {
    alert('Error loading customer details: ' + error.message);
  }
}

async function submitCustomer() {
  const form = document.getElementById('customer-form');
  const customerId = document.getElementById('customer-id').value;

  const passwordInput = document.getElementById('customer-password');
  const isNew = !customerId;

  if (isNew && !passwordInput.value) {
    alert('Password is required for new customers.');
    return;
  }

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = new FormData(form);

  const customerData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    gstin: formData.get('gstin') || undefined,
    address: formData.get('address') || undefined,
  };

  if (isNew) {
    customerData.password = formData.get('password');
    customerData.role = 'employee'; // default role for new customers
  } else if (passwordInput.value) {
    customerData.password = passwordInput.value;
  }

  try {
    let response;
    if (customerId) {
      response = await api.put(`/users/${customerId}`, customerData);
    } else {
      response = await api.post('/users', customerData);
    }

    if (response.success) {
      closeModal('customer-modal');
      loadCustomers();
      showToast(customerId ? 'Customer updated successfully!' : 'Customer added successfully!', 'success');
    }
  } catch (error) {
    alert('Error saving customer: ' + error.message);
  }
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `alert alert-${type}`;
  toast.style.cssText =
    'position: fixed; bottom: 24px; right: 24px; z-index: 9999; min-width: 280px; animation: fadeIn 0.3s ease;';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function logout() {
  api.logout();
  window.location.href = '/login';
}

window.openCustomerModal = openCustomerModal;
window.editCustomer = editCustomer;
window.viewCustomer = viewCustomer;
window.submitCustomer = submitCustomer;
window.closeModal = closeModal;
window.logout = logout;
