export interface UserResponseDto {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    disabled: boolean;
    metadata: {
        creationTime: string;
        lastSignInTime: string;
    };
    // Nuevos campos opcionales para mantener compatibilidad
    creationTime?: string;
    lastSignInTime?: string;
    status?: string;
}

