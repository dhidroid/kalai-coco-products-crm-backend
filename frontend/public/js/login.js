// Login page script — handles form submit and redirect if already authenticated

document.addEventListener('DOMContentLoaded', () => {
  const api = new ApiService();

  // Already logged in → go straight to dashboard
  if (api.isAuthenticated()) {
    window.location.href = '/dashboard';
    return;
  }

  const form = document.getElementById('login-form');
  const submitBtn = document.getElementById('submit-btn');
  const alertContainer = document.getElementById('alert-container');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Logging in…</span> <i data-lucide="loader" class="spinner" style="width: 14px; height: 14px;"></i>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    alertContainer.innerHTML = '';

    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.success) {
        api.setToken(response.data.token);
        api.setUser(response.data.user);
        window.location.href = '/dashboard';
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      alertContainer.innerHTML = `<div class="alert alert-error">${error.message || 'Login failed. Please check your credentials.'}</div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Sign In</span> <i data-lucide="arrow-right" style="width: 18px;"></i>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  });
});
