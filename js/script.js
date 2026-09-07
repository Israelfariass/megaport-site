/**
 * MEGAPORT SERVIÇOS — comportamento do site
 * ------------------------------------------------------------------
 * Seções deste arquivo:
 *  1. Cabeçalho / menu mobile
 *  2. Biblioteca de ícones (usada pelos cards de serviço)
 *  3. Carregamento de conteúdo (busca serviços e cupons no Supabase)
 *  4. Renderização dos cards de Serviços
 *  5. Renderização dos cards de Cupons/Promoções
 *  6. Popup de redes sociais
 *  7. Efeito de revelar ao rolar a página
 *
 * Depende de js/vendor/supabase.js e js/supabase-config.js, carregados
 * ANTES deste arquivo no index.html.
 */

/* ============ 1. CABEÇALHO / MENU MOBILE ============ */
const header = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 30);
});

const menuToggle = document.getElementById('menu-toggle');
const mainNav = document.getElementById('main-nav');
const iconOpen = document.getElementById('icon-open');
const iconClose = document.getElementById('icon-close');
menuToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', isOpen);
  iconOpen.style.display = isOpen ? 'none' : 'block';
  iconClose.style.display = isOpen ? 'block' : 'none';
});
mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  mainNav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', false);
  iconOpen.style.display = 'block';
  iconClose.style.display = 'none';
}));


/* ============ 2. ÍCONES ============
   A biblioteca de ícones vive em js/icons.js (compartilhada com o painel admin). */



/* ============ 3. CARREGAMENTO DE CONTEÚDO (Supabase) ============
   Busca os serviços e cupons direto do banco de dados. Qualquer
   alteração feita no painel admin fica visível aqui na hora, para
   qualquer visitante — sem precisar publicar nenhum arquivo. */
async function loadContent() {
  try {
    const [servicesRes, couponsRes] = await Promise.all([
      supabaseClient.from('services').select('*').order('sort_order', { ascending: true }),
      supabaseClient.from('coupons').select('*')
    ]);
    if (servicesRes.error) throw servicesRes.error;
    if (couponsRes.error) throw couponsRes.error;
    return { services: servicesRes.data || [], coupons: couponsRes.data || [] };
  } catch (err) {
    console.error('Não foi possível carregar os dados do Supabase:', err);
    return { services: [], coupons: [], loadError: true };
  }
}


/* ============ 4. RENDERIZAÇÃO DOS SERVIÇOS ============ */
function whatsappLink(message) {
  return 'https://wa.me/5551996597444?text=' + encodeURIComponent(message);
}

function serviceCardHTML(service) {
  const featuredClass = service.featured ? ' featured' : '';
  const badge = service.featured && service.badge
    ? `<span class="service-badge">${escapeHTML(service.badge)}</span>`
    : '';

  let href, target = '', rel = '';
  if (service.link_type === 'anchor') {
    href = service.link_value || '#servicos';
  } else if (service.link_type === 'url') {
    href = service.link_value || '#';
    target = ' target="_blank"'; rel = ' rel="noopener"';
  } else { // whatsapp (padrão)
    href = whatsappLink(service.link_value || 'Olá! Vi o site da Megaport e gostaria de pedir um orçamento.');
    target = ' target="_blank"'; rel = ' rel="noopener"';
  }
  const linkLabel = service.link_label || 'Pedir orçamento';

  return `
    <div class="service-card${featuredClass}">
      ${badge}
      <div class="service-icon">
        <svg viewBox="0 0 24 24">${iconMarkup(service.icon)}</svg>
      </div>
      <h3>${escapeHTML(service.title)}</h3>
      <p>${escapeHTML(service.description)}</p>
      <a class="service-link" href="${href}"${target}${rel}>${escapeHTML(linkLabel)} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
    </div>`;
}

function renderServices(services, loadError) {
  const grid = document.getElementById('services-grid');
  if (!grid) return;
  if (loadError) {
    grid.innerHTML = '<p style="color:var(--ink-400);">Não foi possível carregar os serviços agora. Tente recarregar a página em instantes.</p>';
    return;
  }
  if (!services || services.length === 0) {
    grid.innerHTML = '<p style="color:var(--ink-400);">Nenhum serviço cadastrado no momento.</p>';
    return;
  }
  grid.innerHTML = services.map(serviceCardHTML).join('');
}


/* ============ 5. RENDERIZAÇÃO DOS CUPONS ============ */
function isCouponValid(coupon) {
  if (!coupon.active) return false;
  if (coupon.valid_until) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const until = new Date(coupon.valid_until + 'T00:00:00');
    if (until < today) return false;
  }
  return true;
}

function formatDatePtBr(isoDate) {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

function couponCardHTML(coupon) {
  const expiry = coupon.valid_until
    ? `<span class="coupon-expiry">Válido até ${formatDatePtBr(coupon.valid_until)}</span>`
    : '';
  return `
    <div class="coupon-card">
      <div class="coupon-top">
        <h3>${escapeHTML(coupon.title)}</h3>
        ${expiry}
      </div>
      <p>${escapeHTML(coupon.description || '')}</p>
      <div class="coupon-code-row">
        <span class="coupon-code">${escapeHTML(coupon.code)}</span>
        <button class="coupon-copy-btn" type="button" data-code="${escapeHTML(coupon.code)}" aria-label="Copiar código">
          <svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/></svg>
        </button>
      </div>
    </div>`;
}

function renderCoupons(coupons) {
  const section = document.getElementById('promocoes');
  const grid = document.getElementById('coupons-grid');
  if (!section || !grid) return;

  const validCoupons = (coupons || []).filter(isCouponValid);
  if (validCoupons.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = '';
  grid.innerHTML = validCoupons.map(couponCardHTML).join('');

  grid.querySelectorAll('.coupon-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.getAttribute('data-code');
      navigator.clipboard?.writeText(code).then(() => {
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 1500);
      }).catch(() => { /* clipboard indisponível: ignora silenciosamente */ });
    });
  });
}


/* ============ Utilitário: evitar HTML injection nos textos vindos dos dados ============ */
function escapeHTML(str) {
  if (str === undefined || str === null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}


/* ============ Executa a renderização ============ */
(async () => {
  const megaportContent = await loadContent();
  renderServices(megaportContent.services, megaportContent.loadError);
  renderCoupons(megaportContent.coupons);
})();


/* ============ 6. POPUP DE REDES SOCIAIS ============
   CONFIGURAÇÃO: mude os valores abaixo para ajustar o comportamento.
   - delayMs: quanto tempo (em milissegundos) esperar antes de mostrar o popup.
   - frequency: 'session' (mostra 1x por visita/aba), 'once' (mostra só uma
     vez, para sempre, no navegador da pessoa) ou 'always' (mostra em toda
     visita — não recomendado, pode incomodar). */
const POPUP_CONFIG = {
  delayMs: 2200,
  frequency: 'session'
};

function shouldShowPopup() {
  if (POPUP_CONFIG.frequency === 'always') return true;
  const store = POPUP_CONFIG.frequency === 'once' ? localStorage : sessionStorage;
  try {
    return !store.getItem('megaport_popup_seen');
  } catch (e) {
    return false;
  }
}
function markPopupSeen() {
  const store = POPUP_CONFIG.frequency === 'once' ? localStorage : sessionStorage;
  try { store.setItem('megaport_popup_seen', '1'); } catch (e) { /* ignora */ }
}

const popupOverlay = document.getElementById('social-popup-overlay');
if (popupOverlay && shouldShowPopup()) {
  setTimeout(() => {
    popupOverlay.classList.add('visible');
  }, POPUP_CONFIG.delayMs);
}
function closePopup() {
  if (!popupOverlay) return;
  popupOverlay.classList.remove('visible');
  markPopupSeen();
}
document.getElementById('social-popup-close')?.addEventListener('click', closePopup);
document.getElementById('social-popup-dismiss')?.addEventListener('click', closePopup);
popupOverlay?.addEventListener('click', (e) => {
  if (e.target === popupOverlay) closePopup();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && popupOverlay?.classList.contains('visible')) closePopup();
});


/* ============ 7. EFEITO DE REVELAR AO ROLAR ============ */
const revealEls = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('in-view'));
}
