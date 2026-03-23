const api = new ApiService();
let invoices = [];
let allProducts = [];
let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', () => {
    if (!api.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    initUserInfo();
    initNavigation();
    loadInvoices();

    // Event Listeners
    const addInvoiceBtn = document.getElementById('add-invoice-btn');
    if (addInvoiceBtn) addInvoiceBtn.onclick = openInvoiceModal;

    const invoiceForm = document.getElementById('invoice-form');
    if (invoiceForm) {
        invoiceForm.onsubmit = (e) => {
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

async function loadInvoices() {
    const tbody = document.getElementById('invoices-table-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" class="loading"><div class="spinner"></div></td></tr>`;

    try {
        const response = await api.get(`/invoices?page=${currentPage}&limit=${itemsPerPage}`);
        invoices = response.data || [];
        renderInvoices();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="alert alert-error"><span>${error.message}</span></div></td></tr>`;
    }
}

function renderInvoices() {
    const tbody = document.getElementById('invoices-table-body');
    if (!tbody) return;

    if (invoices.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><h3>No Invoices Found</h3></td></tr>`;
        return;
    }

    tbody.innerHTML = invoices.map(inv => {
        const customerName = inv.bill_to_name || `${inv.first_name || ''} ${inv.last_name || ''}`.trim() || 'N/A';
        return `
        <tr>
            <td><strong>${inv.invoice_number}</strong></td>
            <td>${new Date(inv.created_at).toLocaleDateString('en-IN')}</td>
            <td>${customerName}</td>
            <td><strong>₹${(parseFloat(inv.total_amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
            <td><span class="status-badge status-${inv.invoice_status}">${inv.invoice_status}</span></td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-sm btn-secondary" onclick="viewInvoice(${inv.invoice_id})"><i data-lucide="eye"></i></button>
                    <button class="btn btn-sm btn-primary" onclick="downloadPdf(${inv.invoice_id})"><i data-lucide="download"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteInvoice(${inv.invoice_id})"><i data-lucide="trash-2"></i></button>
                </div>
            </td>
        </tr>
    `}).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function openInvoiceModal() {
    const modal = document.getElementById('invoice-modal');
    modal.classList.add('active');

    // Default dates
    document.getElementById('invoice-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('date-of-supply').value = new Date().toISOString().split('T')[0];

    // Suggest a number
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    document.getElementById('invoice-number').value = `INV-${dateStr}-${Math.floor(Math.random() * 900) + 100}`;

    await Promise.all([loadCustomersSelect(), loadProductsSelect()]);
}

async function loadCustomersSelect() {
    const billToSelect = document.getElementById('bill-to');
    const shipToSelect = document.getElementById('ship-to');
    if (!billToSelect) return;

    try {
        const res = await api.get('/users');
        const customers = res.data || [];
        const options = customers.map(c => `<option value="${c.id || c.user_id}">${c.firstName || c.first_name || ''} ${c.lastName || c.last_name || ''} (${c.email})</option>`).join('');
        billToSelect.innerHTML = '<option value="">Select Customer</option>' + options;
        shipToSelect.innerHTML = '<option value="">Same as Billing</option>' + options;
    } catch (error) {
        console.error('Error loading customers:', error);
    }
}

async function loadProductsSelect() {
    try {
        const res = await api.get('/products');
        allProducts = res.data || [];
        updateAllProductSelects();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function updateAllProductSelects() {
    document.querySelectorAll('.item-product').forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select Product</option>' + 
            allProducts.map(p => `<option value="${p.product_id}" data-price="${p.price}">${p.product_name} (₹${p.price})</option>`).join('');
        select.value = currentValue;
    });
}

function onProductChange(select) {
    const option = select.options[select.selectedIndex];
    const price = option.dataset.price;
    const row = select.closest('.item-row');
    if (price) {
        row.querySelector('.item-price').value = price;
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
            <input type="number" class="form-control item-quantity" value="1" min="1" required>
        </div>
        <div class="form-group">
            <input type="number" class="form-control item-price" step="0.01" required>
        </div>
        <div class="form-group" style="flex: 0;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="this.closest('.item-row').remove()">
                <i data-lucide="x" style="width: 14px;"></i>
            </button>
        </div>
    `;
    container.appendChild(div);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function submitInvoice() {
    const btn = document.querySelector('button[form="invoice-form"]') || document.querySelector('#invoice-form button[type="submit"]');
    if (!btn) return;
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
        sgstRate: parseFloat(document.querySelector('input[name="sgstRate"]')?.value || document.getElementById('sgst-rate')?.value || 9),
        cgstRate: parseFloat(document.querySelector('input[name="cgstRate"]')?.value || document.getElementById('cgst-rate')?.value || 9),
        igstRate: parseFloat(document.querySelector('input[name="igstRate"]')?.value || document.getElementById('igst-rate')?.value || 0),
        items
    };

    try {
        const res = await api.post('/invoices', data);
        if (res.success) {
            closeModal('invoice-modal');
            const invoiceId = res.data.invoiceId;
            
            const token = api.getToken();
            const link = document.createElement('a');
            link.href = `/api/invoices/${invoiceId}/pdf?token=${token}`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            setTimeout(() => {
                loadInvoices();
                showToast('Invoice created successfully');
            }, 500);
        }
    } catch (error) {
        alert(error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function viewInvoice(id) {
    try {
        const res = await api.get(`/invoices/${id}`);
        const inv = res.data;
        const body = document.getElementById('view-invoice-body');
        
        const itemsHtml = (inv.items || []).map(i => `
            <tr>
                <td>${i.product_name}</td>
                <td>${i.quantity}</td>
                <td>₹${i.unit_price}</td>
                <td>₹${i.item_total}</td>
            </tr>
        `).join('');

        body.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                    <strong>Invoice #:</strong> ${inv.invoice_number}<br>
                    <strong>Date:</strong> ${new Date(inv.invoice_date).toLocaleDateString()}<br>
                    <strong>Status:</strong> <span class="status-badge status-${inv.invoice_status}">${inv.invoice_status}</span>
                </div>
                <div>
                    <strong>Customer:</strong> ${inv.bill_to_name || 'N/A'}<br>
                    <strong>Vehicle:</strong> ${inv.vehicle_number || '-'}<br>
                    <strong>Supply Date:</strong> ${inv.date_of_supply ? new Date(inv.date_of_supply).toLocaleDateString() : '-'}
                </div>
            </div>
            <div class="table-container">
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
                            <td><strong>₹${inv.total_amount}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
        
        const footer = document.querySelector('#view-invoice-modal .modal-footer');
        let actionButtons = '';
        
        if (inv.invoice_status === 'draft') {
            actionButtons += `<button class="btn btn-success" onclick="updateInvoiceStatus(${inv.invoice_id}, 'issued')">Mark Issued</button>`;
        } else if (inv.invoice_status === 'issued') {
            actionButtons += `<button class="btn btn-success" onclick="updateInvoiceStatus(${inv.invoice_id}, 'paid')">Mark Paid</button>`;
        }
        
        if (inv.invoice_status !== 'paid' && inv.invoice_status !== 'cancelled') {
            actionButtons += `<button class="btn btn-danger" onclick="updateInvoiceStatus(${inv.invoice_id}, 'cancelled')">Cancel</button>`;
        }

        footer.innerHTML = `
            <div style="flex-grow: 1; display: flex; gap: 8px;">${actionButtons}</div>
            <button class="btn btn-secondary" onclick="closeModal('view-invoice-modal')">Close</button>
            <button class="btn btn-primary" onclick="downloadPdf(${id})">Download PDF</button>
        `;
        
        document.getElementById('view-invoice-modal').classList.add('active');
    } catch (error) {
        alert(error.message);
    }
}

async function downloadPdf(id) {
    try {
        const token = api.getToken();
        window.open(`/api/invoices/${id}/pdf?token=${token}`, '_blank');
    } catch (error) {
        alert(error.message);
    }
}

async function deleteInvoice(id) {
    if (!confirm('Delete this invoice?')) return;
    try {
        await api.delete(`/invoices/${id}`);
        loadInvoices();
        showToast('Invoice deleted');
    } catch (error) {
        alert(error.message);
    }
}

async function updateInvoiceStatus(id, status) {
    if (!confirm(`Are you sure you want to mark this invoice as ${status}?`)) return;
    try {
        await api.patch(`/invoices/${id}/status`, { status });
        showToast(`Invoice marked as ${status}`);
        closeModal('view-invoice-modal');
        loadInvoices();
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

// Global Exports
window.openInvoiceModal = openInvoiceModal;
window.closeModal = closeModal;
window.addItem = addItem;
window.submitInvoice = submitInvoice;
window.viewInvoice = viewInvoice;
window.downloadPdf = downloadPdf;
window.deleteInvoice = deleteInvoice;
window.updateInvoiceStatus = updateInvoiceStatus;
window.onProductChange = onProductChange;
window.logout = logout;
