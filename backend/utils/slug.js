export default function toSlug(str='') {
  return String(str)
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'') // retire accents
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'');
}
