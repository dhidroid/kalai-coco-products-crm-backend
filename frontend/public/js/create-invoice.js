const api = new ApiService();
let allProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!api.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    initUserInfo();
    initNavigation();
    
    // Set default dates
    document.getElementById('invoice-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('date-of-supply').value = new Date().toISOString().split('T')[0];
    
    // Suggest a number
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    document.getElementById('invoice-number').value = `INV-${dateStr}-${Math.floor(Math.random() * 900) + 100}`;
    
    await Promise.all([loadCustomers(), loadProducts()]);
    
    // Add first line item
    addItem();
    
    const form = document.getElementById('invoice-form');
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            submitInvoice();
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

function logout() {
    api.logout();
    window.location.href = '/login';
}

async function loadCustomers() {
    const billToSelect = document.getElementById('bill-to');
    const shipToSelect = document.getElementById('ship-to');
    try {
        const res = await api.get('/users?limit=100');
        const customers = res.data || [];
        const options = customers.map(c => `<option value="${c.id || c.user_id}">${c.firstName || c.first_name || ''} ${c.lastName || c.last_name || ''} (${c.email})</option>`).join('');
        billToSelect.innerHTML = '<option value="">Select Customer</option>' + options;
        shipToSelect.innerHTML = '<option value="">Same as Billing</option>' + options;
    } catch (err) {
        console.error('Error loading customers:', err);
    }
}

async function loadProducts() {
    try {
        const res = await api.get('/products');
        allProducts = res.data || [];
    } catch (err) {
        console.error('Error loading products:', err);
    }
}

function addItem() {
    const container = document.getElementById('invoice-items');
    const div = document.createElement('div');
    div.className = 'form-row item-row';
    div.innerHTML = `
        <div class="form-group" style="flex: 2;">
            <select class="form-control item-product" required onchange="onProductChange(this)">
                <option value="">Select Product</option>
                ${allProducts.map(p => `<option value="${p.product_id}" data-price="${p.price}">${p.product_name} (₹${p.price})</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <input type="number" class="form-control item-quantity" value="1" min="1" step="0.1" required>
        </div>
        <div class="form-group">
            <input type="number" class="form-control item-price" step="0.01" required>
        </div>
        <div class="form-group" style="flex: 0; padding-top: 12px;">
            <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.item-row').remove()">
                <i data-lucide="x"></i>
            </button>
        </div>
    `;
    container.appendChild(div);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function onProductChange(select) {
    const option = select.options[select.selectedIndex];
    const price = option.dataset.price;
    const row = select.closest('.item-row');
    if (price) {
        row.querySelector('.item-price').value = price;
    }
}

async function submitInvoice() {
    const btn = document.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Creating...';

    const items = [];
    document.querySelectorAll('.item-row').forEach(row => {
        const productId = row.querySelector('.item-product').value;
        const quantity = row.querySelector('.item-quantity').value;
        const unitPrice = row.querySelector('.item-price').value;
        if (productId) {
            items.push({ 
                productId: parseInt(productId), 
                quantity: parseFloat(quantity), 
                unitPrice: parseFloat(unitPrice), 
                rate: parseFloat(unitPrice) 
            });
        }
    });

    const data = {
        invoiceNumber: document.getElementById('invoice-number').value,
        invoiceDate: document.getElementById('invoice-date').value ? new Date(document.getElementById('invoice-date').value).toISOString() : undefined,
        billToUserId: parseInt(document.getElementById('bill-to').value),
        shipToUserId: parseInt(document.getElementById('ship-to').value) || parseInt(document.getElementById('bill-to').value),
        vehicleNumber: document.getElementById('vehicle-number').value || undefined,
        dateOfSupply: document.getElementById('date-of-supply').value ? new Date(document.getElementById('date-of-supply').value).toISOString() : undefined,
        sgstRate: parseFloat(document.getElementById('sgst-rate').value),
        cgstRate: parseFloat(document.getElementById('cgst-rate').value),
        igstRate: parseFloat(document.getElementById('igst-rate').value),
        items
    };

    try {
        const res = await api.post('/invoices', data);
        if (res.success) {
            const invoiceId = res.data.invoiceId;
            
            // Serve PDF download automatically using anchor to bypass some popup blockers
            const token = api.getToken();
            const link = document.createElement('a');
            link.href = `/api/invoices/${invoiceId}/pdf?token=${token}`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            // Navigate back to invoices list shortly after triggering download
            setTimeout(() => {
                window.location.href = '/invoices';
            }, 500);
        }
    } catch (error) {
        alert(error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

window.addItem = addItem;
window.submitInvoice = submitInvoice;
window.onProductChange = onProductChange;
window.logout = logout;
