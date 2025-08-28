import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreatePlanDto, Plan } from '../processes/admin/dto/plan.dto';

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async createPlan(createPlanDto: CreatePlanDto): Promise<Plan> {
    try {
      this.logger.debug('Creando nuevo plan:', createPlanDto);

      // Validate activities
      if (createPlanDto.activities.some(activity => !activity.activityId)) {
        throw new BadRequestException('Todas las actividades deben tener un ID válido');
      }

      const db = this.firebaseService.getFirestore();
      const plansRef = db.collection('plans');

      // Verify all activities exist
      const activitiesRef = db.collection('activities');
      const activityIds = createPlanDto.activities.map(a => a.activityId);
      
      const activityDocs = await Promise.all(
        activityIds.map(id => activitiesRef.doc(id).get())
      );

      if (activityDocs.some(doc => !doc.exists)) {
        throw new BadRequestException('Una o más actividades no existen');
      }

      const now = new Date().toISOString();
      const planData = {
        ...createPlanDto,
        status: 'available',
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await plansRef.add(planData);
      
      return {
        id: docRef.id,
        ...planData,
      } as Plan;
    } catch (error) {
      this.logger.error('Error creando plan:', error);
      throw error;
    }
  }

  async getPlans(): Promise<Plan[]> {
    try {
      const db = this.firebaseService.getFirestore();
      const snapshot = await db.collection('plans')
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Plan));
    } catch (error) {
      this.logger.error('Error obteniendo planes:', error);
      throw error;
    }
  }

  async updatePlan(id: string, updatePlanDto: CreatePlanDto): Promise<Plan> {
    try {
      this.logger.debug('Actualizando plan:', { id, data: updatePlanDto });

      // Validate activities
      if (!id) {
        throw new BadRequestException('El ID del plan es requerido');
      }

      if (updatePlanDto.activities.some(activity => !activity.activityId)) {
        throw new BadRequestException('Todas las actividades deben tener un ID válido');
      }

      const db = this.firebaseService.getFirestore();
      const planRef = db.collection('plans').doc(id);

      // Verify plan exists
      const planDoc = await planRef.get();
      if (!planDoc.exists) {
        throw new BadRequestException('Plan no encontrado');
      }

      // Verify all activities exist
      const activitiesRef = db.collection('activities');
      const activityIds = updatePlanDto.activities.map(a => a.activityId);
      
      const activityDocs = await Promise.all(
        activityIds.map(actId => activitiesRef.doc(actId).get())
      );

      if (activityDocs.some(doc => !doc.exists)) {
        throw new BadRequestException('Una o más actividades no existen');
      }

      const now = new Date().toISOString();
      const planData = {
        ...updatePlanDto,
        updatedAt: now,
      };

      await planRef.update(planData);
      
      return {
        id,
        ...planData,
      } as Plan;
    } catch (error) {
      this.logger.error('Error actualizando plan:', error);
      throw error;
    }
  }

  async deletePlan(id: string): Promise<void> {
    try {
      this.logger.debug('Eliminando plan:', id);
      const db = this.firebaseService.getFirestore();
      const planRef = db.collection('plans').doc(id);
      await planRef.delete();
    } catch (error) {
      this.logger.error('Error eliminando plan:', error);
      throw error;
    }
  }


  async PausedPlans( response : any){
    try {
      this.logger.debug('Pausando plan:', response.id);
      const db = this.firebaseService.getFirestore();
      const planRef = db.collection('plans').doc(response.id);
      await planRef.update({ status: 'paused' });
    } catch (error) {
      this.logger.error('Error pausando plan:', error);
      throw error;
    }
  }
}
