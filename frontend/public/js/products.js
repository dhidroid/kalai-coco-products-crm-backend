const api = new ApiService();
let products = [];
let currentPage = 1;
const itemsPerPage = 50;

document.addEventListener('DOMContentLoaded', () => {
    if (!api.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    initUserInfo();
    initNavigation();
    loadProducts();

    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) addProductBtn.onclick = () => openProductModal();

    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.onsubmit = (e) => {
            e.preventDefault();
            submitProduct();
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

async function loadProducts() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="9" class="loading"><div class="spinner"></div></td></tr>`;

    try {
        const response = await api.get(`/products?page=${currentPage}&limit=${itemsPerPage}`);
        products = response.data || [];
        renderProducts();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="9">Error loading products: ${error.message}</td></tr>`;
    }
}

function renderProducts() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="empty-state">No products found.</td></tr>`;
        return;
    }

    tbody.innerHTML = products.map(p => `
        <tr>
            <td><strong>${p.product_code}</strong></td>
            <td><strong>${p.product_name}</strong></td>
            <td>${p.description || '-'}</td>
            <td>${p.hsn_code || '-'}</td>
            <td><span class="status-badge status-draft">${p.unit}</span></td>
            <td><strong>₹${parseFloat(p.price).toFixed(2)}</strong></td>
            <td>${parseFloat(p.tax_rate).toFixed(1)}%</td>
            <td><span class="status-badge ${p.is_active ? 'status-paid' : 'status-cancelled'}">${p.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-sm btn-secondary" onclick="editProduct(${p.product_id})"><i data-lucide="edit-3"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.product_id})"><i data-lucide="trash-2"></i></button>
                </div>
            </td>
        </tr>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');

    form.reset();
    document.getElementById('product-id').value = '';
    document.getElementById('tax-rate').value = '18.00';
    document.getElementById('is-active').checked = true;

    if (productId) {
        const product = products.find(p => p.product_id === productId);
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
        title.textContent = 'Add New Product';
    }

    modal.classList.add('active');
}

function editProduct(id) {
    openProductModal(id);
}

async function submitProduct() {
    const id = document.getElementById('product-id').value;
    const data = {
        productCode: document.getElementById('product-code').value,
        productName: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value || undefined,
        hsnCode: document.getElementById('hsn-code').value || undefined,
        unit: document.getElementById('unit').value || 'KG',
        price: parseFloat(document.getElementById('price').value),
        taxRate: parseFloat(document.getElementById('tax-rate').value) || 18,
        isActive: document.getElementById('is-active').checked
    };

    try {
        if (id) {
            await api.put(`/products/${id}`, data);
            showToast('Product updated');
        } else {
            await api.post('/products', data);
            showToast('Product created');
        }
        closeModal('product-modal');
        loadProducts();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    try {
        await api.delete(`/products/${id}`);
        loadProducts();
        showToast('Product deleted');
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

window.openProductModal = openProductModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.submitProduct = submitProduct;
window.closeModal = closeModal;
window.logout = logout;
