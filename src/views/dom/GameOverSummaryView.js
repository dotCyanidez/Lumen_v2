import { getAbilityInfo } from '../../core/Constants.js';
import { ABILITY_ICONS } from './DomIcons.js';

export function renderDamageBreakdown(el, info) {
  const { section, listEl, detailEl, detailsBtn } = el || {};
  if (!section || !listEl || !detailEl) return false;

  if (detailsBtn) {
    detailsBtn.textContent = 'DETAILED INFO';
    detailsBtn.setAttribute('aria-expanded', 'false');
  }
  detailEl.classList.add('hidden');

  const report = info?.damageReport;
  const entries = report?.entries || [];
  if (entries.length === 0) {
    section.classList.add('hidden');
    return false;
  }

  section.classList.remove('hidden');
  listEl.innerHTML = '';
  for (const row of entries) {
    const ab = getAbilityInfo(row.abilityId);
    const item = document.createElement('div');
    item.className = 'go-dmg-row';
    item.innerHTML = `
      <span class="go-dmg-icon">${ABILITY_ICONS[row.abilityId] || ABILITY_ICONS.resonant_volley}</span>
      <span class="go-dmg-name">${ab?.name || row.abilityId}</span>
      <div class="go-dmg-bar"><span class="go-dmg-bar-fill" style="width:${Math.max(4, Math.min(100, row.rawPct || row.pct))}%"></span></div>
      <span class="go-dmg-pct">${row.pct}%</span>
    `;
    listEl.appendChild(item);
  }

  const metaBits = [];
  if (info.difficulty) metaBits.push(`Difficulty: ${info.difficulty.label}`);
  if (info.dailyTwist) metaBits.push(`Twist: ${info.dailyTwist.name}`);
  if (info.isFirstDailyDouble) {
    metaBits.push(`First Daily 2× LUM (+${info.firstDailyBonusLum || 0})`);
  }
  if ((info.bonusLuminance || 0) > 0) {
    metaBits.push(`Shards & Events: +${info.bonusLuminance} LUM`);
  }
  const syns = info.activeSynergies || [];
  const synHtml =
    syns.length > 0
      ? `<div class="go-dmg-synergies"><strong>Synergies:</strong> ${syns.map((s) => `${s.name}`).join(' · ')}</div>`
      : '';
  const detailRows = entries
    .map((row) => {
      const ab = getAbilityInfo(row.abilityId);
      const dotStr = row.dot > 0 ? ` (${row.dot} DoT)` : '';
      return `<div class="go-dmg-detail-row"><span>${ab?.name || row.abilityId}</span><span>${row.total} DMG${dotStr} · ${row.kills} kills · ${row.pct}%</span></div>`;
    })
    .join('');
  detailEl.innerHTML = `
    <div class="go-dmg-detail-meta">Total Ability Damage: ${report.grandTotal} · ${metaBits.join(' · ')}</div>
    ${synHtml}
    <div class="go-dmg-detail-list">${detailRows}</div>
  `;
  return false;
}

export function renderRunConstellation(
  points,
  targetCtx,
  dims = { w: 360, h: 120 },
  clearOnEmpty = false
) {
  const ctx = targetCtx;
  if (!ctx) return;

  const w = dims.w;
  const h = dims.h;
  if (clearOnEmpty) ctx.clearRect(0, 0, w, h);

  if (!points || points.length < 2) {
    if (clearOnEmpty) {
      const g = ctx.createRadialGradient(w * 0.5, h * 0.5, 2, w * 0.5, h * 0.5, 42);
      g.addColorStop(0, 'rgba(95, 247, 235, 0.35)');
      g.addColorStop(1, 'rgba(95, 247, 235, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    return;
  }

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const ox = dims.x || 0;
  const oy = dims.y || 0;
  const padX = Math.max(16, w * 0.08);
  const padY = Math.max(14, h * 0.14);

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const frac = i / points.length;
    const x1 = ox + padX + a.nx * (w - padX * 2);
    const y1 = oy + padY + a.ny * (h - padY * 2);
    const x2 = ox + padX + b.nx * (w - padX * 2);
    const y2 = oy + padY + b.ny * (h - padY * 2);
    ctx.strokeStyle =
      b.gold || b.dashing
        ? `rgba(255, 229, 148, ${0.42 + frac * 0.5})`
        : `rgba(95, 247, 235, ${0.14 + frac * 0.48})`;
    ctx.lineWidth = b.gold || b.dashing ? 2.4 : 1.4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  const last = points[points.length - 1];
  const lx = ox + padX + last.nx * (w - padX * 2);
  const ly = oy + padY + last.ny * (h - padY * 2);
  const star = ctx.createRadialGradient(lx, ly, 1, lx, ly, 16);
  star.addColorStop(0, 'rgba(255, 248, 220, 0.95)');
  star.addColorStop(0.4, 'rgba(95, 247, 235, 0.5)');
  star.addColorStop(1, 'rgba(95, 247, 235, 0)');
  ctx.fillStyle = star;
  ctx.beginPath();
  ctx.arc(lx, ly, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
