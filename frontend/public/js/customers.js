const api = new ApiService();
let customers = [];
let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
    if (!api.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    initUserInfo();
    initNavigation();
    loadCustomers();

    const addCustomerBtn = document.getElementById('add-customer-btn');
    if (addCustomerBtn) addCustomerBtn.onclick = () => openCustomerModal();

    const customerForm = document.getElementById('customer-form');
    if (customerForm) {
        customerForm.onsubmit = (e) => {
            e.preventDefault();
            submitCustomer();
        };
    }
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
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            logout();
        };
    }
}

async function loadCustomers() {
    const tbody = document.getElementById('customers-table-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" class="loading"><div class="spinner"></div></td></tr>`;

    try {
        const response = await api.get(`/users?page=${currentPage}&limit=50`);
        customers = response.data || [];
        renderCustomers();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7">Error loading customers: ${error.message}</td></tr>`;
    }
}

function renderCustomers() {
    const tbody = document.getElementById('customers-table-body');
    if (!tbody) return;

    if (customers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No customers found.</td></tr>`;
        return;
    }

    tbody.innerHTML = customers.map(c => {
        const id = c.id || c.user_id;
        return `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="user-avatar" style="width: 32px; height: 32px; flex-shrink: 0; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: 500;">
                        ${(c.first_name?.[0] || 'U') + (c.last_name?.[0] || '')}
                    </div>
                    <div>
                        <strong>${c.first_name || ''} ${c.last_name || ''}</strong>
                    </div>
                </div>
            </td>
            <td>${c.email}</td>
            <td>${c.role_name || '-'}</td>
            <td><span class="status-badge status-${c.is_active ? 'paid' : 'draft'}">${c.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>${new Date(c.created_at).toLocaleDateString('en-IN')}</td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-sm btn-secondary" onclick="viewCustomer(${id})"><i data-lucide="eye"></i></button>
                    <button class="btn btn-sm btn-primary" onclick="editCustomer(${id})"><i data-lucide="user-cog"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCustomer(${id})"><i data-lucide="user-minus"></i></button>
                </div>
            </td>
        </tr>
    `}).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function openCustomerModal(customerId = null) {
    const modal = document.getElementById('customer-modal');
    const title = document.getElementById('customer-modal-title');
    const form = document.getElementById('customer-form');

    form.reset();
    document.getElementById('customer-id').value = '';

    if (customerId) {
        const c = customers.find(x => x.id === customerId);
        if (c) {
            title.textContent = 'Edit Customer';
            document.getElementById('customer-id').value = c.id || c.user_id;
            document.getElementById('customer-first-name').value = c.firstName || '';
            document.getElementById('customer-last-name').value = c.lastName || '';
            document.getElementById('customer-email').value = c.email || '';
            document.getElementById('customer-phone').value = c.phone || '';
            document.getElementById('customer-gstin').value = c.gstin || '';
            document.getElementById('customer-address').value = c.address || '';
        }
    } else {
        title.textContent = 'New Customer';
    }

    modal.classList.add('active');
}

function editCustomer(id) {
    openCustomerModal(id);
}

async function deleteCustomer(id) {
    if (!confirm('Delete customer?')) return;
    try {
        await api.delete(`/users/${id}`);
        loadCustomers();
        showToast('Customer deleted');
    } catch (error) {
        alert(error.message);
    }
}

async function viewCustomer(id) {
    try {
        const response = await api.get(`/users/${id}`);
        const c = response.data;
        const body = document.getElementById('view-customer-body');
        body.innerHTML = `
            <h3>${c.firstName} ${c.lastName || ''}</h3>
            <p>Email: ${c.email}</p>
            <p>Phone: ${c.phone || 'N/A'}</p>
            <p>GSTIN: ${c.gstin || 'N/A'}</p>
            <p>Address: ${c.address || 'N/A'}</p>
        `;
        document.getElementById('view-customer-modal').classList.add('active');
    } catch (error) {
        alert(error.message);
    }
}

async function submitCustomer() {
    const id = document.getElementById('customer-id').value;
    const data = {
        firstName: document.getElementById('customer-first-name').value,
        lastName: document.getElementById('customer-last-name').value,
        email: document.getElementById('customer-email').value,
        phone: document.getElementById('customer-phone').value || undefined,
        gstin: document.getElementById('customer-gstin').value || undefined,
        address: document.getElementById('customer-address').value || undefined,
        password: id ? undefined : 'Password@123' 
    };

    try {
        if (id) {
            await api.put(`/users/${id}`, data);
            showToast('Customer updated');
        } else {
            await api.post('/users', { ...data, role: 'Employee' }); // Default role for new added
            showToast('Customer registered');
        }
        closeModal('customer-modal');
        loadCustomers();
    } catch (error) {
        alert(error.message);
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'alert alert-success';
    toast.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:9999;';
    toast.innerHTML = `<span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function logout() {
    api.logout();
    window.location.href = '/login';
}

window.openCustomerModal = openCustomerModal;
window.editCustomer = editCustomer;
window.viewCustomer = viewCustomer;
window.deleteCustomer = deleteCustomer;
window.submitCustomer = submitCustomer;
window.closeModal = closeModal;
window.logout = logout;
