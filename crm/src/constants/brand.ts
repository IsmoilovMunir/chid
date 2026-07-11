export const CHID_BRAND = {
  name: 'CHID',
  tagline: 'Ипотека и недвижимость',
  phone: import.meta.env.VITE_CHID_PHONE ?? '+7 (000) 000-00-00',
  phoneHref: import.meta.env.VITE_CHID_PHONE_HREF ?? '+70000000000',
  website: import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '') ?? 'chid.ru',
  email: import.meta.env.VITE_CHID_EMAIL ?? 'info@chid.ru',
}
