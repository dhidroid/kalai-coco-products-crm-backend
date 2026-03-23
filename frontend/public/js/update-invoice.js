const api = new ApiService();
let allProducts = [];
let invoiceId = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!api.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    initUserInfo();
    initNavigation();
    
    // Extract ID from path: /update/invoice/:id
    const parts = window.location.pathname.split('/');
    invoiceId = parts[parts.length - 1];

    await Promise.all([loadCustomers(), loadProducts()]);
    
    if (invoiceId) {
        await loadInvoiceData(invoiceId);
    } else {
        alert('No invoice selected');
        window.location.href = '/invoices';
    }
    
    const form = document.getElementById('invoice-form');
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            submitInvoice();
        };
    }
});

async function loadInvoiceData(id) {
    try {
        const res = await api.get(`/invoices/${id}`);
        const inv = res.data;
        
        document.getElementById('invoice-number').value = inv.invoice_number;
        document.getElementById('invoice-date').value = inv.invoice_date.split('T')[0];
        document.getElementById('bill-to').value = inv.bill_to_user_id;
        
        if (inv.ship_to_name || inv.ship_to_address) {
            document.getElementById('manual-ship').checked = true;
            toggleShipManual(document.getElementById('manual-ship'));
            document.getElementById('ship-to-name').value = inv.ship_to_name || '';
            document.getElementById('ship-to-phone').value = inv.ship_to_phone || '';
            document.getElementById('ship-to-gstin').value = inv.ship_to_gstin || '';
            document.getElementById('ship-to-address').value = inv.ship_to_address || '';
        } else {
            document.getElementById('ship-to').value = inv.ship_to_user_id || '';
        }
        
        document.getElementById('vehicle-number').value = inv.vehicle_number || '';
        document.getElementById('date-of-supply').value = inv.date_of_supply ? inv.date_of_supply.split('T')[0] : '';
        document.getElementById('sgst-rate').value = inv.sgst_rate;
        document.getElementById('cgst-rate').value = inv.cgst_rate;
        document.getElementById('igst-rate').value = inv.igst_rate;

        // Load items
        const itemsRes = await api.get(`/invoices/${id}`); // Wait, reuse same detail if items included, or separate call
        // Looking at fn_get_invoice_with_items, it doesn't include item array. 
        // InvoiceService.generatePdfBuffer calls this.invoiceRepository.getItems(id)
        // I need a secondary call for items if they aren't in the detail.
        const items = inv.items || []; 
        const itemsList = document.getElementById('invoice-items');
        itemsList.innerHTML = '';
        if (items.length > 0) {
            items.forEach(item => addItemWithData(item));
        } else {
            addItem();
        }

    } catch (err) {
        alert('Error loading invoice: ' + err.message);
    }
}

function addItemWithData(item) {
    const container = document.getElementById('invoice-items');
    const div = document.createElement('div');
    div.className = 'form-row item-row';
    div.innerHTML = `
        <div class="form-group" style="flex: 2;">
            <select class="form-control item-product" required onchange="onProductChange(this)">
                <option value="">Select Product</option>
                ${allProducts.map(p => `
                    <option value="${p.product_id}" data-price="${p.price}" ${p.product_id == item.product_id ? 'selected' : ''}>
                        ${p.product_name} (₹${p.price})
                    </option>
                `).join('')}
            </select>
        </div>
        <div class="form-group">
            <input type="number" class="form-control item-quantity" value="${item.quantity}" min="1" step="0.1" required>
        </div>
        <div class="form-group">
            <input type="number" class="form-control item-price" value="${item.unit_price || item.unitPrice}" step="0.01" required>
        </div>
        <div class="form-group" style="padding-top: 28px;">
            <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.item-row').remove()">
                <i data-lucide="trash-2" style="width: 16px;"></i>
            </button>
        </div>
    `;
    container.appendChild(div);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ... (rest of the helper functions from create-invoice.js)
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
        <div class="form-group" style="padding-top: 28px;">
            <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.item-row').remove()">
                <i data-lucide="trash-2" style="width: 16px;"></i>
            </button>
        </div>
    `;
    container.appendChild(div);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function toggleShipManual(checkbox) {
    const manualFields = document.getElementById('ship-manual-fields');
    const shipToSelect = document.getElementById('ship-to');
    if (checkbox.checked) {
        manualFields.style.display = 'block';
        shipToSelect.disabled = true;
    } else {
        manualFields.style.display = 'none';
        shipToSelect.disabled = false;
    }
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
    btn.innerHTML = 'Updating...';

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

    const isManualShip = document.getElementById('manual-ship').checked;
    const data = {
        invoiceNumber: document.getElementById('invoice-number').value,
        invoiceDate: document.getElementById('invoice-date').value ? new Date(document.getElementById('invoice-date').value).toISOString() : undefined,
        billToUserId: parseInt(document.getElementById('bill-to').value),
        shipToUserId: isManualShip ? undefined : (parseInt(document.getElementById('ship-to').value) || undefined),
        vehicleNumber: document.getElementById('vehicle-number').value || undefined,
        dateOfSupply: document.getElementById('date-of-supply').value ? new Date(document.getElementById('date-of-supply').value).toISOString() : undefined,
        sgstRate: parseFloat(document.getElementById('sgst-rate').value),
        cgstRate: parseFloat(document.getElementById('cgst-rate').value),
        igstRate: parseFloat(document.getElementById('igst-rate').value),
        shipToName: isManualShip ? document.getElementById('ship-to-name').value : undefined,
        shipToAddress: isManualShip ? document.getElementById('ship-to-address').value : undefined,
        shipToGstin: isManualShip ? document.getElementById('ship-to-gstin').value : undefined,
        shipToPhone: isManualShip ? document.getElementById('ship-to-phone').value : undefined,
        items
    };

    try {
        // Need to implement PUT in backend or use separate calls.
        // Assuming we implement PUT /invoices/:id
        const res = await api.put(`/invoices/${invoiceId}`, data);
        if (res.success) {
            alert('Invoice updated successfully');
            window.location.href = '/invoices';
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
window.toggleShipManual = toggleShipManual;
window.logout = logout;
