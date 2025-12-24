declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      role: 'USER' | 'ADMIN';
      isProfessional: boolean;
      professionalStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
    };
  }
}
