import { z } from 'zod'

export const UserRoleSchema = z.enum(['member', 'mitra', 'staff', 'superadmin'])

export const UserPayloadSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter.'),
  email: z.string().email('Email tidak valid.'),
  password: z.string().min(6, 'Password minimal 6 karakter.'),
  role: UserRoleSchema,
})

export const PartnerPayloadSchema = z.object({
  ownerName: z.string().min(3, 'Nama pemilik minimal 3 karakter.'),
  propertyName: z.string().min(3, 'Nama properti minimal 3 karakter.'),
  city: z.string().min(2, 'Kota minimal 2 karakter.'),
  email: z.string().email('Email tidak valid.'),
  phone: z
    .string()
    .regex(/^[0-9+\-\s]{8,15}$/, 'Nomor HP tidak valid.')
    .optional(),
})

export const PropertyStatusSchema = z.enum(['aktif', 'nonaktif', 'pending'])

export const PropertyPayloadSchema = z.object({
  name: z.string().min(3, 'Nama properti minimal 3 karakter.'),
  city: z.string().min(2, 'Kota minimal 2 karakter.'),
  area: z.string().optional(),
  address: z.string().optional(),
  img: z.string().url('URL gambar tidak valid.').optional(),
  desc: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  status: PropertyStatusSchema.default('aktif'),
  partnerEmail: z.string().email('Email mitra tidak valid.'),
  receptionPhone: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
})

export const RoomTypePayloadSchema = z.object({
  name: z.string().min(1, 'Nama tipe kamar wajib diisi.'),
  price: z.number().int().positive('Harga harus lebih dari 0.'),
  originalPrice: z.number().int().positive().optional(),
  capacity: z.number().int().positive('Kapasitas minimal 1.'),
  qty: z.number().int().min(0).default(1),
})

export const CouponPayloadSchema = z.object({
  code: z.string().min(3, 'Kode kupon minimal 3 karakter.').toUpperCase(),
  label: z.string().min(3, 'Label minimal 3 karakter.'),
  pct: z.number().int().min(1).max(100, 'Persentase 1-100.'),
  maxDiscount: z.number().int().min(0).default(0),
  validUntil: z.string().nullable().optional(),
  status: z.enum(['aktif', 'nonaktif']).default('aktif'),
  partnerEmail: z.string().email('Email mitra tidak valid.'),
})

export const BookingPayloadSchema = z.object({
  propertyId: z.union([z.number().int().positive(), z.string().min(1)]),
  propertyName: z.string().min(1),
  propertyImg: z.string().url().optional(),
  checkIn: z.string().nullable().optional(),
  checkOut: z.string().nullable().optional(),
  nights: z.number().int().min(1),
  rooms: z.number().int().min(1),
  guests: z.number().int().min(0),
  roomTypeId: z.string().min(1),
  roomTypeName: z.string().min(1),
  roomPrice: z.number().int().positive(),
  couponCode: z.string().nullable().optional(),
  couponDiscount: z.number().min(0),
  totalPrice: z.number().min(0),
  guestName: z.string().min(3, 'Nama tamu minimal 3 karakter.'),
  email: z.string().email('Email tidak valid.'),
  phone: z.string().regex(/^[0-9+\-\s]{8,15}$/, 'Nomor HP tidak valid.'),
})

export const ReviewPayloadSchema = z.object({
  propertyId: z.union([z.number().int().positive(), z.string().min(1)]),
  name: z.string().min(3, 'Nama minimal 3 karakter.'),
  city: z.string().min(2, 'Kota minimal 2 karakter.').optional(),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(5, 'Ulasan minimal 5 karakter.').max(500, 'Ulasan maksimal 500 karakter.'),
})

export const parsePayload = (schema, payload) => {
  const result = schema.safeParse(payload)
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join('; '))
  }
  return result.data
}

export const schemaDocs = {
  UserPayload: UserPayloadSchema,
  PartnerPayload: PartnerPayloadSchema,
  PropertyPayload: PropertyPayloadSchema,
  RoomTypePayload: RoomTypePayloadSchema,
  CouponPayload: CouponPayloadSchema,
  BookingPayload: BookingPayloadSchema,
  ReviewPayload: ReviewPayloadSchema,
}
