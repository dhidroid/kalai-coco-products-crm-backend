const api = new ApiService();

document.addEventListener('DOMContentLoaded', () => {
  if (!api.isAuthenticated()) {
    window.location.href = '/login';
    return;
  }

  initUserInfo();
  initNavigation();
  loadProfile();

  const form = document.getElementById('profile-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitProfile();
    });
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
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
}

async function loadProfile() {
  const user = api.getUser();
  if (!user) return;

  try {
    // Fetch fresh user data from server
    const response = await api.get(`/users/${user.id}`);
    const u = response.data;
    const initials = (u.firstName?.[0] || 'U') + (u.lastName?.[0] || '');

    // Header info
    document.getElementById('profile-full-name').textContent = `${u.firstName} ${u.lastName}`;
    document.getElementById('profile-role').textContent = u.role;
    document.getElementById('profile-avatar').textContent = initials.toUpperCase();

    // Form inputs
    document.getElementById('profile-first-name').value = u.firstName || '';
    document.getElementById('profile-last-name').value = u.lastName || '';
    document.getElementById('profile-email').value = u.email || '';
    document.getElementById('profile-phone').value = u.phone || '';
    document.getElementById('profile-gstin').value = u.gstin || '';
    document.getElementById('profile-address').value = u.address || '';

  } catch (error) {
    console.error('Error loading profile:', error);
    showToast('Failed to load profile details', 'error');
  }
}

async function submitProfile() {
  const user = api.getUser();
  if (!user) return;

  const form = document.getElementById('profile-form');
  const formData = new FormData(form);
  const password = formData.get('password');

  const profileData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    gstin: formData.get('gstin') || undefined,
    address: formData.get('address') || undefined,
  };

  if (password) {
    profileData.password = password;
  }

  const submitBtn = document.getElementById('save-btn');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="spinner" style="width: 14px; height: 14px; border-width: 2px; margin-right: 8px;"></span> Saving Changes...`;

  try {
    const response = await api.put(`/users/${user.id}`, profileData);
    if (response.success) {
      // Update local storage user data
      const updatedUser = { ...user, ...response.data };
      api.setUser(updatedUser);
      
      // Refresh UI
      initUserInfo();
      loadProfile();
      showToast('Profile updated successfully!', 'success');
    }
  } catch (error) {
    alert('Error updating profile: ' + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `alert alert-${type}`;
  toast.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 9999; min-width: 280px; box-shadow: var(--shadow-xl); animation: fadeIn 0.3s ease;';
  toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i> <span>${message}</span>`;
  document.body.appendChild(toast);
  if (typeof lucide !== 'undefined') lucide.createIcons();
  setTimeout(() => toast.remove(), 3000);
}

function logout() {
  api.logout();
  window.location.href = '/login';
}

window.logout = logout;
