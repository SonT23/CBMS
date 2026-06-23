// Cấu hình các tài nguyên danh mục cho Admin (FN-04). Dùng chung cho API generic.
export const RESOURCES = {
  specialties: { model: 'specialty', fields: ['name'], num: [], include: undefined },
  doctors: { model: 'doctor', fields: ['fullName', 'specialtyId', 'fee', 'experience', 'rating'], num: ['specialtyId', 'fee', 'experience', 'rating'], include: { specialty: true } },
  services: { model: 'labTest', fields: ['name', 'price'], num: ['price'], include: undefined },
  medications: { model: 'medication', fields: ['name', 'unit', 'price', 'stock', 'reorderLevel'], num: ['price', 'stock', 'reorderLevel'], include: undefined },
};
