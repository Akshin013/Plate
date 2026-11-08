// Приводит номер к единому виду, чтобы поиск находил и "77ab777", и "77-AB-777"
export const normalizePlate = (s) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
