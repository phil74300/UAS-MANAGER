// ═══════════════════════════════════════════════════════════
//  UAS Manager — Système de licences centralisé
//  © 2026 Philippe CONTE · FRAjqq48j12nfy4c
//  À inclure dans chaque module : <script src="license.js"></script>
// ═══════════════════════════════════════════════════════════

const UAS_LICENSE = (function() {

  const LICENSE_KEY = 'uas_license';

  // ─── PLANS & FONCTIONNALITÉS ─────────────────────────────
  const FEATURES = {
    free: [
      'vols',           // Carnet de vol (limité 20)
      'checklist',      // Check-liste basique
      'meteo',          // Météo sans clé API
      'adsb',           // ADS-B basique
      'zones',          // Zones OSM uniquement
      'config_basic',   // Config 1 drone / 1 pilote
      'rgpd',           // RGPD toujours accessible
    ],
    standard: [
      'vols',           // Illimité
      'checklist',
      'meteo',          // Avec CheckWX
      'adsb',
      'zones',          // + WMS IGN
      'maintenance',
      'rex',
      'notification',
      'planificateur',
      'briefing',
      'dashboard',
      'alertes',
      'bilans',
      'formations',
      'config_basic',
      'config_multi',   // Multi-drones / pilotes (3 max)
      'rgpd',
    ],
    pro: [
      'vols',
      'checklist',
      'meteo',
      'adsb',
      'zones',
      'maintenance',
      'rex',
      'notification',
      'planificateur',
      'briefing',
      'dashboard',
      'alertes',
      'bilans',
      'formations',
      'statistiques',
      'clients',
      'rapport',
      'replay',
      'dji_logs',
      'export_zip',
      'config_basic',
      'config_multi',   // Illimité
      'config_pro',
      'rgpd',
    ],
    personal: ['__all__'], // Créateur — tout débloqué
  };

  const PLANS_META = {
    free:     { label:'Gratuit',  icon:'🆓', color:'#5A6478', bg:'#F0F4FA', price:'Gratuit' },
    standard: { label:'Standard', icon:'⭐', color:'#BA7517', bg:'#FAEEDA', price:'9,99€/mois' },
    pro:      { label:'Pro',      icon:'🏆', color:'#1D6B37', bg:'#E8F5E9', price:'19,99€/mois' },
    personal: { label:'Créateur', icon:'👤', color:'#185FA5', bg:'#E6F1FB', price:'—' },
  };

  // Modules qui nécessitent Standard pour être débloqués
  const UPGRADE_INFO = {
    maintenance:  { plan:'standard', label:'Maintenance UAS' },
    rex:          { plan:'standard', label:'REX / Incidents' },
    notification: { plan:'standard', label:'Notification AlphaTango' },
    planificateur:{ plan:'standard', label:'Planificateur de missions' },
    briefing:     { plan:'standard', label:'Briefing pré-vol GO/NO-GO' },
    dashboard:    { plan:'standard', label:'Tableau de bord' },
    alertes:      { plan:'standard', label:'Alertes & Rappels' },
    bilans:       { plan:'standard', label:'Bilans' },
    formations:   { plan:'standard', label:'Formations' },
    statistiques: { plan:'pro',      label:'Statistiques avancées' },
    clients:      { plan:'pro',      label:'Clients & Devis' },
    rapport:      { plan:'pro',      label:'Rapport de mission' },
    replay:       { plan:'pro',      label:'Replay de vol DJI' },
    dji_logs:     { plan:'pro',      label:'Logs DJI' },
    export_zip:   { plan:'pro',      label:'Export ZIP complet' },
  };

  // ─── GETTERS ─────────────────────────────────────────────
  function getLicense() {
    try {
      const raw = localStorage.getItem(LICENSE_KEY);
      if (!raw) return { plan: 'free', name: 'Utilisateur', label: '🆓 Gratuit', features: FEATURES.free };
      const l = JSON.parse(raw);
      if (l.expires && new Date(l.expires) < new Date()) {
        localStorage.removeItem(LICENSE_KEY);
        return { plan: 'free', name: 'Utilisateur', label: '🆓 Gratuit', features: FEATURES.free };
      }
      return l;
    } catch {
      return { plan: 'free', name: 'Utilisateur', label: '🆓 Gratuit', features: FEATURES.free };
    }
  }

  function getPlan() { return getLicense().plan || 'free'; }

  function canAccess(feature) {
    const plan = getPlan();
    if (plan === 'personal') return true;
    const allowed = FEATURES[plan] || FEATURES.free;
    return allowed.includes(feature);
  }

  function getVolLimit() {
    const plan = getPlan();
    if (plan === 'free') return 20;
    return Infinity;
  }

  function getDroneLimit() {
    const plan = getPlan();
    if (plan === 'free' || plan === 'standard') return plan === 'standard' ? 3 : 1;
    return Infinity;
  }

  // ─── UPGRADE WALL ─────────────────────────────────────────
  function showUpgradeWall(feature, containerId) {
    const info = UPGRADE_INFO[feature] || { plan: 'standard', label: feature };
    const requiredPlan = PLANS_META[info.plan];
    const proPlan = PLANS_META.pro;
    const currentPlan = PLANS_META[getPlan()];

    const standardFeatures = [
      '✈️ Vols illimités',
      '🔧 Maintenance UAS',
      '⚠️ REX / Incidents',
      '📋 Notification AlphaTango',
      '🗓️ Planificateur de missions',
      '🌤️ Briefing GO/NO-GO',
      '📊 Tableau de bord',
      '🔔 Alertes & Rappels',
      '📅 Bilans & Formations',
    ];

    const proFeatures = [
      '📈 Statistiques avancées',
      '💼 Clients & Devis PDF',
      '📷 Rapport de mission + photos',
      '🎬 Replay de vol DJI',
      '📁 Logs DJI',
      '🗜️ Export ZIP complet',
      '🛸 Drones & pilotes illimités',
    ];

    const wall = `
    <div style="
      min-height:100vh;display:flex;flex-direction:column;
      align-items:center;justify-content:center;
      background:var(--bg,#F0F4FA);padding:24px;
      font-family:-apple-system,sans-serif;
    ">
      <div style="max-width:400px;width:100%;text-align:center;">
        <div style="font-size:56px;margin-bottom:12px;">🔒</div>
        <div style="font-size:20px;font-weight:900;color:#0C447C;margin-bottom:6px;">
          ${info.label}
        </div>
        <div style="
          display:inline-flex;align-items:center;gap:6px;
          background:${requiredPlan.bg};color:${requiredPlan.color};
          padding:5px 14px;border-radius:20px;
          font-size:12px;font-weight:700;margin-bottom:16px;
        ">
          ${requiredPlan.icon} Nécessite la licence ${requiredPlan.label}
        </div>
        <div style="font-size:13px;color:#5A6478;margin-bottom:24px;line-height:1.5;">
          Débloquez ce module et bien plus avec une licence ${requiredPlan.label}.
        </div>

        ${info.plan === 'standard' ? `
        <div style="background:#fff;border:1px solid #D0DCF0;border-radius:14px;padding:18px;margin-bottom:12px;text-align:left;">
          <div style="font-size:12px;font-weight:700;color:#5A6478;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px;">⭐ Standard — 9,99€/mois</div>
          ${standardFeatures.map(f=>`<div style="font-size:12px;color:#0D1220;padding:4px 0;border-bottom:1px solid #F0F4FA;">${f}</div>`).join('')}
        </div>` : ''}

        <div style="background:#fff;border:1px solid #D0DCF0;border-radius:14px;padding:18px;margin-bottom:20px;text-align:left;">
          <div style="font-size:12px;font-weight:700;color:#5A6478;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px;">🏆 Pro — 19,99€/mois</div>
          ${[...standardFeatures,...proFeatures].map(f=>`<div style="font-size:12px;color:#0D1220;padding:4px 0;border-bottom:1px solid #F0F4FA;">${f}</div>`).join('')}
        </div>

        <a href="activation.html" style="
          display:block;background:linear-gradient(135deg,#0C447C,#185FA5);
          color:#fff;border:none;border-radius:12px;padding:15px;
          font-size:15px;font-weight:800;text-decoration:none;
          margin-bottom:10px;
        ">🔓 Activer ma licence</a>

        <a href="index.html" style="
          display:block;background:transparent;
          border:1.5px solid #D0DCF0;border-radius:12px;padding:12px;
          font-size:13px;font-weight:600;color:#5A6478;text-decoration:none;
        ">← Retour à l'accueil</a>

        <div style="margin-top:16px;font-size:10px;color:#5A6478;">
          © 2026 Philippe CONTE · contephil74@gmail.com
        </div>
      </div>
    </div>`;

    if (containerId) {
      document.getElementById(containerId).innerHTML = wall;
    } else {
      document.body.innerHTML = wall;
    }
  }

  // ─── BADGE PLAN dans le header ────────────────────────────
  function injectPlanBadge() {
    const plan = getPlan();
    const meta = PLANS_META[plan];
    const header = document.querySelector('#header');
    if (!header) return;

    // Éviter les doublons
    if (document.getElementById('plan-badge')) return;

    const badge = document.createElement('div');
    badge.id = 'plan-badge';
    badge.style.cssText = `
      background:${meta.bg};color:${meta.color};
      padding:3px 9px;border-radius:10px;
      font-size:10px;font-weight:700;
      position:relative;z-index:1;
      flex-shrink:0;white-space:nowrap;
    `;
    badge.textContent = `${meta.icon} ${meta.label}`;
    badge.title = meta.price;

    // Insérer avant le bouton retour
    const backBtn = header.querySelector('.back-btn');
    if (backBtn) header.insertBefore(badge, backBtn);
    else header.appendChild(badge);
  }

  // ─── VÉRIFICATION & REDIRECT ──────────────────────────────
  function requireFeature(feature) {
    if (!canAccess(feature)) {
      showUpgradeWall(feature);
      return false;
    }
    return true;
  }

  // ─── AUTO-INIT ────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    injectPlanBadge();
  });

  // API publique
  return { getPlan, getLicense, canAccess, getVolLimit, getDroneLimit,
           showUpgradeWall, requireFeature, injectPlanBadge, PLANS_META, FEATURES };

})();
