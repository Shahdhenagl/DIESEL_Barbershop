import { escapeHtml } from './escapeHtml';
import { openPrintWindow } from './printWindow';

export interface QuotationPrintData {
  quotation_number: string;
  recipient_company?: string;
  recipient_phone?: string;
  intro_text?: string;
  notes?: string;
  execution_period?: string;
  items: { name: string; quantity: number; unit_price: number; total: number }[];
  subtotal: number;
  discount: number;
  total: number;
  cashier_name?: string;
  created_at?: string;
}

interface CompanyLike {
  name?: string; logo?: string; phone?: string; phone2?: string; address?: string;
  currency?: string; themeColor?: string;
}

// عرض سعر A4 بريميوم بلوجو وبيانات الشركة وQR بتفاصيل العرض.
export function printQuotation(q: QuotationPrintData, settings: CompanyLike): void {
  const cur = settings.currency || 'ج.م';
  const accent = settings.themeColor || '#4f46e5';
  const dateStr = new Date(q.created_at || Date.now()).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  const money = (n: number) => `${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;

  // محتوى الـ QR: ملخّص تفاصيل العرض (يُقرأ بأي ماسح).
  const qrText =
    `عرض سعر: ${q.quotation_number}\n` +
    `من: ${settings.name || ''}\n` +
    (q.recipient_company ? `إلى: ${q.recipient_company}\n` : '') +
    `التاريخ: ${dateStr}\n` +
    `الإجمالي: ${money(q.total)}\n` +
    `عدد البنود: ${q.items.length}\n` +
    q.items.slice(0, 12).map((it) => `• ${it.name} ×${it.quantity} = ${money(it.total)}`).join('\n') +
    (q.execution_period ? `\nمدة التنفيذ: ${q.execution_period}` : '');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(qrText)}`;

  const rows = q.items.map((it, i) => `
    <tr>
      <td class="c">${i + 1}</td>
      <td class="name">${escapeHtml(it.name)}</td>
      <td class="c">${Number(it.quantity) || 0}</td>
      <td class="c">${money(it.unit_price)}</td>
      <td class="c strong">${money(it.total)}</td>
    </tr>`).join('');

  const intro = q.intro_text || `تحية طيبة وبعد،،\nيسعد ${settings.name || 'شركتنا'} أن تتقدّم لسيادتكم بعرض السعر التالي، آملين أن ينال ثقتكم ورضاكم. نحن على أتمّ الاستعداد لتنفيذ طلبكم بأعلى جودة وفي الموعد المتفق عليه.`;

  const contact = [settings.phone, settings.phone2].filter(Boolean).join(' • ');

  const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8" />
<title>عرض سعر ${escapeHtml(q.quotation_number)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'Tajawal', sans-serif; color: #1e293b; background: #fff; }
  .page { width: 210mm; min-height: 297mm; padding: 14mm 14mm 12mm; margin: 0 auto; position: relative; display: flex; flex-direction: column; }
  .accent { color: ${accent}; }
  .bar { height: 6px; background: ${accent}; border-radius: 4px; }
  /* Header */
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 10px; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .logo { width: 74px; height: 74px; object-fit: contain; border-radius: 14px; border: 1px solid #eef; padding: 4px; background: #fff; }
  .cname { font-size: 26px; font-weight: 800; color: #0f172a; }
  .cmeta { font-size: 12px; color: #64748b; margin-top: 3px; line-height: 1.8; }
  .qbox { text-align: left; }
  .qtitle { font-size: 30px; font-weight: 800; letter-spacing: 1px; color: ${accent}; }
  .qnum { font-size: 13px; font-weight: 700; color: #334155; margin-top: 4px; }
  .qdate { font-size: 12px; color: #64748b; margin-top: 2px; }
  /* Recipient + intro */
  .to { display: flex; justify-content: space-between; gap: 16px; margin: 16px 0 10px; }
  .card { background: #f8fafc; border: 1px solid #eef2f7; border-radius: 14px; padding: 12px 16px; }
  .card .lbl { font-size: 11px; font-weight: 700; color: #94a3b8; margin-bottom: 3px; }
  .card .val { font-size: 15px; font-weight: 700; color: #0f172a; }
  .intro { white-space: pre-line; font-size: 13.5px; line-height: 2; color: #334155; background: #fff; border-right: 4px solid ${accent}; padding: 6px 14px; margin: 6px 0 14px; }
  /* Table */
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  thead th { background: ${accent}; color: #fff; font-size: 13px; font-weight: 700; padding: 11px 8px; }
  thead th:first-child { border-radius: 0 10px 0 0; } thead th:last-child { border-radius: 10px 0 0 0; }
  tbody td { padding: 10px 8px; font-size: 13px; border-bottom: 1px solid #eef2f7; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  .name { font-weight: 700; color: #0f172a; }
  .c { text-align: center; } .strong { font-weight: 800; color: ${accent}; }
  /* Totals */
  .totals { display: flex; justify-content: flex-start; margin-top: 12px; }
  .tbox { width: 46%; }
  .trow { display: flex; justify-content: space-between; padding: 7px 12px; font-size: 13px; }
  .trow.grand { background: ${accent}; color: #fff; border-radius: 12px; font-size: 17px; font-weight: 800; margin-top: 4px; padding: 12px 14px; }
  /* Meta boxes */
  .meta { display: flex; gap: 12px; margin-top: 16px; }
  .meta .card { flex: 1; }
  .meta .val.small { font-size: 13px; font-weight: 500; line-height: 1.9; white-space: pre-line; }
  /* Footer */
  .foot { margin-top: auto; padding-top: 14px; display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
  .qr { text-align: center; } .qr img { width: 96px; height: 96px; } .qr .cap { font-size: 10px; color: #94a3b8; margin-top: 3px; }
  .sign { text-align: center; font-size: 12px; color: #475569; }
  .sign .line { width: 150px; border-top: 1.5px dashed #cbd5e1; margin: 34px auto 6px; }
  .thanks { text-align: center; font-size: 12px; color: #64748b; margin-top: 12px; }
  .footbar { margin-top: 10px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #eef2f7; padding-top: 8px; }
</style></head>
<body>
  <div class="page">
    <div class="bar"></div>
    <div class="head" style="margin-top:14px">
      <div class="brand">
        ${settings.logo ? `<img class="logo" src="${escapeHtml(settings.logo)}" onerror="this.style.display='none'"/>` : ''}
        <div>
          <div class="cname">${escapeHtml(settings.name || 'شركتنا')}</div>
          <div class="cmeta">${contact ? `📞 ${escapeHtml(contact)}<br/>` : ''}${settings.address ? `📍 ${escapeHtml(settings.address)}` : ''}</div>
        </div>
      </div>
      <div class="qbox">
        <div class="qtitle">عرض سعر</div>
        <div class="qnum">رقم: ${escapeHtml(q.quotation_number)}</div>
        <div class="qdate">${escapeHtml(dateStr)}</div>
      </div>
    </div>

    <div class="to">
      <div class="card" style="flex:1">
        <div class="lbl">السادة / المرسل إليهم</div>
        <div class="val">${escapeHtml(q.recipient_company || '—')}</div>
        ${q.recipient_phone ? `<div class="cmeta" style="margin-top:4px">📞 ${escapeHtml(q.recipient_phone)}</div>` : ''}
      </div>
    </div>

    <div class="intro">${escapeHtml(intro)}</div>

    <table>
      <thead><tr><th style="width:8%">#</th><th style="width:46%">البيان</th><th style="width:12%">الكمية</th><th style="width:17%">سعر الوحدة</th><th style="width:17%">الإجمالي</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals">
      <div class="tbox">
        <div class="trow"><span>الإجمالي الفرعي</span><span>${money(q.subtotal)}</span></div>
        ${q.discount > 0 ? `<div class="trow"><span>الخصم</span><span>- ${money(q.discount)}</span></div>` : ''}
        <div class="trow grand"><span>الإجمالي النهائي</span><span>${money(q.total)}</span></div>
      </div>
    </div>

    <div class="meta">
      ${q.execution_period ? `<div class="card"><div class="lbl">مدة التنفيذ</div><div class="val small">${escapeHtml(q.execution_period)}</div></div>` : ''}
      ${q.notes ? `<div class="card"><div class="lbl">ملاحظات</div><div class="val small">${escapeHtml(q.notes)}</div></div>` : ''}
    </div>

    <div class="foot">
      <div class="qr">
        <img src="${qrUrl}" alt="QR" onerror="this.style.display='none'"/>
        <div class="cap">امسح للتفاصيل</div>
      </div>
      <div class="sign">
        <div>مع خالص الشكر والتقدير</div>
        <div class="line"></div>
        <div>التوقيع والختم</div>
      </div>
    </div>
    <div class="thanks">هذا العرض مقدّم من ${escapeHtml(settings.name || 'شركتنا')} — نتشرّف بخدمتكم</div>
    <div class="footbar">${escapeHtml(settings.name || '')}${contact ? ` • ${escapeHtml(contact)}` : ''}${settings.address ? ` • ${escapeHtml(settings.address)}` : ''}</div>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print();},400);};</script>
</body></html>`;

  openPrintWindow(html, 'width=900,height=1200');
}
