import { Controller, Get, Post } from '@nestjs/common';
import { Request, Response } from 'express';


@Controller('admin/notifications')
export class NotificationController {
    // Obtener todas las notificaciones de admin
    @Get()
    static async getAllNotifications(req: Request, res: Response) {
        // Quemado: lista de notificaciones de admin
        const notifications = [
            { id: 1, title: 'Bienvenido Admin', message: 'Has iniciado sesión como administrador.' },
            { id: 2, title: 'Actualización', message: 'Se ha actualizado el sistema.' },
            { id: 3, title: 'Recordatorio', message: 'No olvides revisar los reportes mensuales.' }
        ];
        res.json(notifications);
    }

    // Crear una notificación de admin (quemado)
    @Post()
    static async createNotification(req: Request, res: Response) {
        // Quemado: simula creación
        const { title, message } = req.body;
        const newNotification = {
            id: Math.floor(Math.random() * 1000) + 4,
            title: title || 'Notificación Admin',
            message: message || 'Mensaje predeterminado para admin.'
        };
        res.status(201).json(newNotification);
    }
}