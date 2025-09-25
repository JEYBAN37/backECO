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
    constructor(private readonly firebaseService: FirebaseService) { }

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
            this.logger.debug(`🔑 [Auth] Role del usuario: ${tokenInfo.role}`);
            return tokenInfo.role === 'admin' || tokenInfo.role === 'user';
        } catch (error : any) {
            throw new UnauthorizedException('Invalid token: ' + error.message);
        }
    }
}
