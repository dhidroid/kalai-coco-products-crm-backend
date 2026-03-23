const api = new ApiService();

document.addEventListener('DOMContentLoaded', () => {
    if (!api.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    initUserInfo();
    initNavigation();

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

async function submitCustomer() {
    const data = {
        firstName: document.getElementById('customer-first-name').value,
        lastName: document.getElementById('customer-last-name').value,
        email: document.getElementById('customer-email').value,
        phone: document.getElementById('customer-phone').value || undefined,
        gstin: document.getElementById('customer-gstin').value || undefined,
        address: document.getElementById('customer-address').value || undefined,
        password: document.getElementById('customer-password').value || 'Password@123' 
    };

    try {
        await api.post('/users', { ...data, role: 'Employee' });
        alert('Customer registered successfully');
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
