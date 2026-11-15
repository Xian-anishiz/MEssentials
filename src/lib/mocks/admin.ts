export interface AdminUser {
  adminId: string;
  nickname: string;
  isActive: boolean;
}

export const MOCK_ADMINS: AdminUser[] = [
  { adminId: 'A001', nickname: 'Admin Lead', isActive: true },
  { adminId: 'A002', nickname: 'Ops Coordinator', isActive: true },
  { adminId: 'A003', nickname: 'Systems Admin', isActive: false },
  { adminId: 'A004', nickname: 'Volunteer Coordinator', isActive: true },
];