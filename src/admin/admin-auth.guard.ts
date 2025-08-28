import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

interface DecodedTokenWithEmail {
    uid: string;
    email: string;
    role: string;
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
    private readonly logger = new Logger(AdminAuthGuard.name);
    constructor(private firebaseService: FirebaseService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = request.headers.authorization;

        if (!token) {
            throw new UnauthorizedException('No authorization header found');
        }

        try {
            const tokenInfo: DecodedTokenWithEmail = await this.firebaseService.verifyToken(token);
            request.user = tokenInfo;
            this.logger.debug(`✅ [Auth] Usuario autenticado: ${tokenInfo.email}`);
            return tokenInfo.role === 'admin';
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}
