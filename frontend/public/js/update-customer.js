const api = new ApiService();
let customerId = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!api.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    initUserInfo();
    initNavigation();

    // Extract ID from path: /update/customer/:id
    const parts = window.location.pathname.split('/');
    customerId = parts[parts.length - 1];

    if (customerId) {
        await loadCustomerData(customerId);
    } else {
        alert('No customer selected');
        window.location.href = '/customers';
    }

    const customerForm = document.getElementById('customer-form');
    if (customerForm) {
        customerForm.onsubmit = (e) => {
            e.preventDefault();
            submitCustomer();
        };
    }
});

async function loadCustomerData(id) {
    try {
        const res = await api.get(`/users/${id}`);
        const c = res.data;
        document.getElementById('customer-id').value = id;
        document.getElementById('customer-first-name').value = c.firstName || c.first_name || '';
        document.getElementById('customer-last-name').value = c.lastName || c.last_name || '';
        document.getElementById('customer-email').value = c.email || '';
        document.getElementById('customer-phone').value = c.phone || '';
        document.getElementById('customer-gstin').value = c.gstin || '';
        document.getElementById('customer-address').value = c.address || '';
    } catch (err) {
        alert('Error loading customer: ' + err.message);
    }
}

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

async function submitCustomer() {
    const data = {
        firstName: document.getElementById('customer-first-name').value,
        lastName: document.getElementById('customer-last-name').value,
        email: document.getElementById('customer-email').value,
        phone: document.getElementById('customer-phone').value || undefined,
        gstin: document.getElementById('customer-gstin').value || undefined,
        address: document.getElementById('customer-address').value || undefined
    };

    try {
        await api.put(`/users/${customerId}`, data);
        alert('Customer updated successfully');
        window.location.href = '/customers';
    } catch (error) {
        alert(error.message);
    }
}

function logout() {
    api.logout();
    window.location.href = '/login';
}

window.submitCustomer = submitCustomer;
window.logout = logout;
