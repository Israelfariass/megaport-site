/**
 * MEGAPORT SERVIÇOS — painel administrativo
 * ------------------------------------------------------------------
 * Login de verdade (Supabase Auth) e CRUD de serviços/cupons direto
 * no banco de dados (Supabase/Postgres, protegido por RLS). Qualquer
 * alteração salva aqui aparece imediatamente para todos os visitantes
 * do site — não existe mais um passo separado de "publicar".
 *
 * Depende de js/vendor/supabase.js e js/supabase-config.js, carregados
 * ANTES deste arquivo no admin.html.
 */

/* ============ LOGIN / SESSÃO (Supabase Auth) ============ */
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginSubmitBtn = document.getElementById('login-submit-btn');

async function showDashboard() {
  loginScreen.style.display = 'none';
  dashboard.classList.add('visible');
  await Promise.all([refreshServices(), refreshCoupons()]);
}
function showLogin() {
  dashboard.classList.remove('visible');
  loginScreen.style.display = 'flex';
}

// O painel só funciona com o Supabase configurado (js/supabase-config.js).
// Enquanto isso não for feito, mostramos um aviso claro no lugar de deixar
// o login falhar sem explicação.
if (!supabaseClient) {
  loginError.textContent = 'O banco de dados ainda não foi configurado. Siga o passo a passo do arquivo SETUP.md para conectar o Supabase e liberar o painel.';
  loginError.classList.add('visible');
  loginSubmitBtn.disabled = true;
  loginSubmitBtn.style.opacity = '.55';
  loginSubmitBtn.style.cursor = 'not-allowed';
}

// Verifica se já existe uma sessão válida (fica conectado entre visitas,
// até fazer logout ou a sessão expirar).
(async () => {
  if (!supabaseClient) return;
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    await showDashboard();
  }
})();

// Se a sessão cair (token expirado, logout em outra aba, etc.), volta pro login.
supabaseClient?.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') showLogin();
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  loginSubmitBtn.disabled = true;
  loginSubmitBtn.textContent = 'Entrando...';
  loginError.classList.remove('visible');

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  loginSubmitBtn.disabled = false;
  loginSubmitBtn.textContent = 'Entrar';

  if (error) {
    loginError.textContent = 'E-mail ou senha incorretos.';
    loginError.classList.add('visible');
    return;
  }
  document.getElementById('login-password').value = '';
  await showDashboard();
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  showLogin();
});


/* ============ TROCA DE SENHA ============ */
document.getElementById('change-password-btn').addEventListener('click', async () => {
  const current = document.getElementById('current-password').value;
  const next = document.getElementById('new-password').value;
  const confirm = document.getElementById('confirm-password').value;
  const errEl = document.getElementById('password-error');
  errEl.classList.remove('visible');

  const { data: sessionData } = await supabaseClient.auth.getSession();
  const email = sessionData?.session?.user?.email;
  if (!email) return;

  // Confirma a senha atual tentando logar de novo com ela.
  const { error: verifyError } = await supabaseClient.auth.signInWithPassword({ email, password: current });
  if (verifyError) {
    errEl.textContent = 'Senha atual incorreta.';
    errEl.classList.add('visible');
    return;
  }
  if (next.length < 6) {
    errEl.textContent = 'A nova senha precisa ter pelo menos 6 caracteres.';
    errEl.classList.add('visible');
    return;
  }
  if (next !== confirm) {
    errEl.textContent = 'As senhas novas não coincidem.';
    errEl.classList.add('visible');
    return;
  }

  const { error: updateError } = await supabaseClient.auth.updateUser({ password: next });
  if (updateError) {
    errEl.textContent = 'Não foi possível trocar a senha: ' + updateError.message;
    errEl.classList.add('visible');
    return;
  }

  document.getElementById('current-password').value = '';
  document.getElementById('new-password').value = '';
  document.getElementById('confirm-password').value = '';
  setStatus('Senha alterada com sucesso.', true);
});


/* ============ ABAS ============ */
document.querySelectorAll('.admin-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
  });
});


/* ============ ESTADO LOCAL (espelha o banco, atualizado a cada ação) ============ */
let servicesCache = [];
let couponsCache = [];

function setStatus(msg, success, isError) {
  const el = document.getElementById('action-status');
  el.textContent = msg;
  el.classList.toggle('success', !!success && !isError);
  el.style.color = isError ? 'var(--red-500)' : '';
  if (msg) setTimeout(() => { el.textContent = ''; el.classList.remove('success'); el.style.color = ''; }, 4500);
}


/* ============ SERVIÇOS: carregar + listar ============ */
async function refreshServices() {
  const list = document.getElementById('services-list');
  list.innerHTML = '<div class="empty-state">Carregando...</div>';
  const { data, error } = await supabaseClient.from('services').select('*').order('sort_order', { ascending: true });
  if (error) {
    list.innerHTML = '<div class="empty-state">Não foi possível carregar os serviços. Confira sua conexão e as credenciais em js/supabase-config.js.</div>';
    return;
  }
  servicesCache = data || [];
  renderServicesList();
}

function renderServicesList() {
  const list = document.getElementById('services-list');
  if (servicesCache.length === 0) {
    list.innerHTML = '<div class="empty-state">Nenhum serviço cadastrado ainda. Clique em "Adicionar serviço" para criar o primeiro.</div>';
    return;
  }
  list.innerHTML = servicesCache.map(s => `
    <div class="item-row" data-id="${s.id}">
      <div class="item-icon"><svg viewBox="0 0 24 24">${iconMarkup(s.icon)}</svg></div>
      <div class="item-info">
        <strong>${escapeHTML(s.title)}</strong>
        <p>${escapeHTML(s.description)}</p>
      </div>
      <div class="item-badges">
        ${s.featured ? '<span class="item-badge badge-featured">Destaque</span>' : ''}
      </div>
      <div class="item-actions">
        <button class="icon-btn" data-action="edit-service" data-id="${s.id}" aria-label="Editar">
          <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
        </button>
        <button class="icon-btn danger" data-action="delete-service" data-id="${s.id}" aria-label="Excluir">
          <svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6"/></svg>
        </button>
      </div>
    </div>`).join('');
}

document.getElementById('services-list').addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.action === 'edit-service') openServiceModal(id);
  if (btn.dataset.action === 'delete-service') {
    if (!confirm('Excluir este serviço? Essa ação não pode ser desfeita.')) return;
    const { error } = await supabaseClient.from('services').delete().eq('id', id);
    if (error) { setStatus('Erro ao excluir: ' + error.message, false, true); return; }
    setStatus('Serviço excluído.', true);
    await refreshServices();
  }
});


/* ============ MODAL DE SERVIÇO ============ */
const serviceModal = document.getElementById('service-modal');
const serviceForm = document.getElementById('service-form');
const serviceSubmitBtn = serviceForm.querySelector('button[type="submit"]');
let selectedIcon = DEFAULT_ICON;

function buildIconPicker() {
  const picker = document.getElementById('icon-picker');
  picker.innerHTML = Object.keys(ICON_LIBRARY).map(key => `
    <button type="button" class="icon-picker-btn" data-icon="${key}" title="${ICON_LABELS[key] || key}">
      <svg viewBox="0 0 24 24">${ICON_LIBRARY[key]}</svg>
    </button>`).join('');
  picker.querySelectorAll('.icon-picker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedIcon = btn.dataset.icon;
      picker.querySelectorAll('.icon-picker-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}
buildIconPicker();

function setSelectedIcon(key) {
  selectedIcon = key;
  document.querySelectorAll('.icon-picker-btn').forEach(b => b.classList.toggle('selected', b.dataset.icon === key));
}

function updateConditionalFields() {
  const type = document.getElementById('service-link-type').value;
  document.getElementById('link-whatsapp-field').classList.toggle('visible', type === 'whatsapp');
  document.getElementById('link-anchor-field').classList.toggle('visible', type === 'anchor');
  document.getElementById('link-url-field').classList.toggle('visible', type === 'url');
}
document.getElementById('service-link-type').addEventListener('change', updateConditionalFields);

document.getElementById('service-featured').addEventListener('change', (e) => {
  document.getElementById('badge-field').classList.toggle('visible', e.target.checked);
});

function openServiceModal(id) {
  const service = id ? servicesCache.find(s => s.id === id) : null;
  document.getElementById('service-modal-title').textContent = service ? 'Editar serviço' : 'Adicionar serviço';
  document.getElementById('service-id').value = service ? service.id : '';
  document.getElementById('service-title').value = service ? service.title : '';
  document.getElementById('service-description').value = service ? service.description : '';
  document.getElementById('service-featured').checked = service ? !!service.featured : false;
  document.getElementById('service-badge').value = service && service.badge ? service.badge : 'Destaque';
  document.getElementById('badge-field').classList.toggle('visible', service ? !!service.featured : false);
  document.getElementById('service-link-type').value = service ? service.link_type : 'whatsapp';
  document.getElementById('service-link-whatsapp').value = (service && service.link_type === 'whatsapp') ? service.link_value : 'Olá! Vi o site da Megaport e gostaria de pedir um orçamento.';
  document.getElementById('service-link-anchor').value = (service && service.link_type === 'anchor') ? service.link_value : '';
  document.getElementById('service-link-url').value = (service && service.link_type === 'url') ? service.link_value : '';
  document.getElementById('service-link-label').value = service ? service.link_label : 'Pedir orçamento';
  setSelectedIcon(service ? service.icon : DEFAULT_ICON);
  updateConditionalFields();
  serviceModal.classList.add('visible');
}
document.getElementById('add-service-btn').addEventListener('click', () => openServiceModal(null));
document.getElementById('service-cancel-btn').addEventListener('click', () => serviceModal.classList.remove('visible'));
serviceModal.addEventListener('click', (e) => { if (e.target === serviceModal) serviceModal.classList.remove('visible'); });

serviceForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('service-id').value;
  const linkType = document.getElementById('service-link-type').value;
  const linkValue = linkType === 'whatsapp' ? document.getElementById('service-link-whatsapp').value
    : linkType === 'anchor' ? document.getElementById('service-link-anchor').value
    : document.getElementById('service-link-url').value;

  const payload = {
    icon: selectedIcon,
    title: document.getElementById('service-title').value.trim(),
    description: document.getElementById('service-description').value.trim(),
    featured: document.getElementById('service-featured').checked,
    badge: document.getElementById('service-badge').value.trim() || 'Destaque',
    link_type: linkType,
    link_value: linkValue.trim(),
    link_label: document.getElementById('service-link-label').value.trim() || 'Pedir orçamento'
  };

  serviceSubmitBtn.disabled = true;
  serviceSubmitBtn.textContent = 'Salvando...';

  let error;
  if (id) {
    ({ error } = await supabaseClient.from('services').update(payload).eq('id', id));
  } else {
    payload.sort_order = servicesCache.length > 0 ? Math.max(...servicesCache.map(s => s.sort_order || 0)) + 1 : 1;
    ({ error } = await supabaseClient.from('services').insert(payload));
  }

  serviceSubmitBtn.disabled = false;
  serviceSubmitBtn.textContent = 'Salvar serviço';

  if (error) { setStatus('Erro ao salvar: ' + error.message, false, true); return; }

  serviceModal.classList.remove('visible');
  setStatus('Serviço salvo e já está no ar.', true);
  await refreshServices();
});


/* ============ CUPONS: carregar + listar ============ */
function couponStatusBadge(c) {
  if (!c.active) return '<span class="item-badge badge-inactive">Inativo</span>';
  if (c.valid_until) {
    const today = new Date(); today.setHours(0,0,0,0);
    const until = new Date(c.valid_until + 'T00:00:00');
    if (until < today) return '<span class="item-badge badge-expired">Expirado</span>';
  }
  return '<span class="item-badge badge-active">Ativo no site</span>';
}

async function refreshCoupons() {
  const list = document.getElementById('coupons-list');
  list.innerHTML = '<div class="empty-state">Carregando...</div>';
  const { data, error } = await supabaseClient.from('coupons').select('*').order('created_at', { ascending: false });
  if (error) {
    list.innerHTML = '<div class="empty-state">Não foi possível carregar os cupons. Confira sua conexão e as credenciais em js/supabase-config.js.</div>';
    return;
  }
  couponsCache = data || [];
  renderCouponsList();
}

function renderCouponsList() {
  const list = document.getElementById('coupons-list');
  if (couponsCache.length === 0) {
    list.innerHTML = '<div class="empty-state">Nenhum cupom cadastrado ainda. Clique em "Adicionar cupom" para criar o primeiro.</div>';
    return;
  }
  list.innerHTML = couponsCache.map(c => `
    <div class="item-row" data-id="${c.id}">
      <div class="item-icon"><svg viewBox="0 0 24 24">${ICON_LIBRARY.etiqueta}</svg></div>
      <div class="item-info">
        <strong>${escapeHTML(c.title)} — ${escapeHTML(c.code)}</strong>
        <p>${escapeHTML(c.description || '')}</p>
      </div>
      <div class="item-badges">${couponStatusBadge(c)}</div>
      <div class="item-actions">
        <button class="icon-btn" data-action="edit-coupon" data-id="${c.id}" aria-label="Editar">
          <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
        </button>
        <button class="icon-btn danger" data-action="delete-coupon" data-id="${c.id}" aria-label="Excluir">
          <svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6"/></svg>
        </button>
      </div>
    </div>`).join('');
}

document.getElementById('coupons-list').addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.action === 'edit-coupon') openCouponModal(id);
  if (btn.dataset.action === 'delete-coupon') {
    if (!confirm('Excluir este cupom?')) return;
    const { error } = await supabaseClient.from('coupons').delete().eq('id', id);
    if (error) { setStatus('Erro ao excluir: ' + error.message, false, true); return; }
    setStatus('Cupom excluído.', true);
    await refreshCoupons();
  }
});


/* ============ MODAL DE CUPOM ============ */
const couponModal = document.getElementById('coupon-modal');
const couponForm = document.getElementById('coupon-form');
const couponSubmitBtn = couponForm.querySelector('button[type="submit"]');

function openCouponModal(id) {
  const coupon = id ? couponsCache.find(c => c.id === id) : null;
  document.getElementById('coupon-modal-title').textContent = coupon ? 'Editar cupom' : 'Adicionar cupom';
  document.getElementById('coupon-id').value = coupon ? coupon.id : '';
  document.getElementById('coupon-title').value = coupon ? coupon.title : '';
  document.getElementById('coupon-code').value = coupon ? coupon.code : '';
  document.getElementById('coupon-description').value = coupon ? coupon.description : '';
  document.getElementById('coupon-valid-until').value = coupon ? (coupon.valid_until || '') : '';
  document.getElementById('coupon-active').checked = coupon ? !!coupon.active : true;
  couponModal.classList.add('visible');
}
document.getElementById('add-coupon-btn').addEventListener('click', () => openCouponModal(null));
document.getElementById('coupon-cancel-btn').addEventListener('click', () => couponModal.classList.remove('visible'));
couponModal.addEventListener('click', (e) => { if (e.target === couponModal) couponModal.classList.remove('visible'); });

couponForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('coupon-id').value;
  const payload = {
    title: document.getElementById('coupon-title').value.trim(),
    code: document.getElementById('coupon-code').value.trim().toUpperCase(),
    description: document.getElementById('coupon-description').value.trim(),
    valid_until: document.getElementById('coupon-valid-until').value || null,
    active: document.getElementById('coupon-active').checked
  };

  couponSubmitBtn.disabled = true;
  couponSubmitBtn.textContent = 'Salvando...';

  let error;
  if (id) {
    ({ error } = await supabaseClient.from('coupons').update(payload).eq('id', id));
  } else {
    ({ error } = await supabaseClient.from('coupons').insert(payload));
  }

  couponSubmitBtn.disabled = false;
  couponSubmitBtn.textContent = 'Salvar cupom';

  if (error) { setStatus('Erro ao salvar: ' + error.message, false, true); return; }

  couponModal.classList.remove('visible');
  setStatus('Cupom salvo e já está no ar.', true);
  await refreshCoupons();
});


/* ============ Utilitário ============ */
function escapeHTML(str) {
  if (str === undefined || str === null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}
