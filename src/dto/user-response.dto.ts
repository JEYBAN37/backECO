export interface UserResponseDto {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  disabled: boolean;  // Añadida propiedad disabled
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
  creationTime?: string;
  lastSignInTime?: string;
  status?: string;
  // Campos adicionales específicos
  name?: string | null;
  lastName?: string | null;
  gender?: string | null;
  avatarColor?: number | null;
  createdAt?: string | null;
}
