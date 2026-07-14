// يحوّل رقم/أرقام الهاتف المخزّنة إلى رقم واتساب دولي صالح.
// يتعامل مع: أكتر من رقم في نفس الحقل (مفصولين أو ملزوقين)، البادئة الدولية 00،
// الصفر البادئ، و«استبعاد» أرقام معيّنة (زي رقم المحل نفسه لو اتلزق برقم العميل).
export function toWhatsAppPhone(
  raw: string | undefined | null,
  countryCode = '20',
  excludePhones: (string | undefined | null)[] = [],
): string {
  const code = (String(countryCode || '').replace(/\D/g, '')) || '20';
  const s = String(raw || '');
  const last9 = (x: string) => x.replace(/\D/g, '').slice(-9);
  const ex = excludePhones.map((p) => String(p || '').replace(/\D/g, '')).filter((p) => p.length >= 9);
  const isShop = (g: string) => ex.some((e) => last9(g) === last9(e));

  // 1) لو الحقل فيه أكتر من رقم مفصولين → استبعد رقم المحل وخذ أول رقم عميل صالح.
  const groups = s.split(/[^\d]+/).map((g) => g.replace(/\D/g, '')).filter(Boolean);
  let clean =
    groups.find((g) => g.length >= 10 && !isShop(g)) ||
    groups.find((g) => g.length >= 10) ||
    groups[0] || '';
  if (!clean) return '';

  // 2) رقمين ملزوقين بدون فاصل (طويل جداً): لو بيبدأ برقم المحل، شيله.
  if (clean.length > 13) {
    for (const e of ex) {
      const variants = [e, e.replace(/^0+/, ''), '0' + e.replace(/^0+/, '')];
      const hit = variants.find((v) => v && clean.startsWith(v) && clean.length - v.length >= 9);
      if (hit) { clean = clean.slice(hit.length); break; }
    }
    if (clean.length > 13) clean = clean.startsWith('0') ? clean.slice(0, 11) : clean.slice(0, 10);
  }

  if (clean.startsWith('00')) clean = clean.slice(2);          // بادئة دولية 00
  if (clean.startsWith('0')) clean = code + clean.slice(1);     // صفر محلي → كود الدولة
  else if (!clean.startsWith(code)) clean = code + clean;       // بدون كود → نضيفه
  return clean;
}

// يبني رابط واتساب جاهز. excludePhones = أرقام المحل (تُستبعد لو اتلزقت برقم العميل).
export function waLink(
  rawPhone: string | undefined | null,
  text: string,
  countryCode = '20',
  excludePhones: (string | undefined | null)[] = [],
): string | null {
  const phone = toWhatsAppPhone(rawPhone, countryCode, excludePhones);
  if (!phone || phone.length < 10) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
