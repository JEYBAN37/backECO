import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateCategoryDto, Category } from './dto/category.dto';
import { FieldPath } from 'firebase-admin/firestore';
import { UpdateCategoryDto } from './dto/category.update.dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async createCategory(category: CreateCategoryDto): Promise<Category> {
    try {
      this.logger.debug('Creando nuevo plan:', category);

      // Validate activities
      if (category.activities.some((activity) => !activity.actividadId)) {
        throw new BadRequestException(
          'Todas las actividades deben tener un ID válido',
        );
      }

      const db = this.firebaseService.getFirestore();
      const categoriesRef = db.collection('categories');
      const exercisesRef = db.collection('exercises');
      const categoriesXexercisesRef = db.collection('categoriesXexercise');

      // Verify all activities exist
      const activityIds = category.activities.map((a) => a.actividadId);
      await Promise.all(
        activityIds.map((actId) => exercisesRef.doc(actId).get()),
      );

      // guardar categoría;
      const categoryDoc = await categoriesRef.add({
        nombre: category.nombre,
        descripcion: category.descripcion,
        color: category.color,
        status: category.status ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // guardar relaciones en categoriesXexercise
      await Promise.all(
        category.activities.map((activity) =>
          categoriesXexercisesRef.add({
            categoriaId: categoryDoc.id,
            actividadId: activity.actividadId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        ),
      );

      return {
        id: categoryDoc.id,
        ...category,
      } as Category;
    } catch (error) {
      this.logger.error('Error creando categoría:', error);
      throw error;
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const db = this.firebaseService.getFirestore();
      const categoriasSnap = await db
        .collection('categories')
        .orderBy('createdAt', 'desc')
        .get();

      const categoriasConActividades = [];

      for (const doc of categoriasSnap.docs) {
        const categoriaData = doc.data() as Category;

        const exercisesSnap = await db
          .collection('categoriesXexercise')
          .where('categoriaId', '==', doc.id)
          .get();

        const exercisesIds = exercisesSnap.docs.map(
          (exDoc) => exDoc.data().actividadId,
        );

        let exercises: any = [];
        if (exercisesIds.length > 0) {
          const exercisesSnap = await db
            .collection('exercises')
            .where(FieldPath.documentId(), 'in', exercisesIds)
            .get();

          exercises = exercisesSnap.docs.map((exDoc) => ({
            id: exDoc.id,
            ...exDoc.data(),
          }));
        }

        categoriasConActividades.push({
          id: doc.id,
          ...categoriaData,
          ejercicios: exercises,
        });
      }

      return categoriasConActividades;
    } catch (error) {
      this.logger.error('Error obteniendo categorías:', error);
      throw error;
    }
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    try {
      this.logger.debug('Actualizando categoría:', {
        id,
        data: updateCategoryDto,
      });

      // Validate activities
      if (!id) {
        throw new BadRequestException('El ID de la categoría es requerido');
      }

      // Validate exist category
      const db = this.firebaseService.getFirestore();
      const categoryRef = db.collection('categories').doc(id);

      const categoryDoc = await categoryRef.get();
      if (!categoryDoc.exists) {
        throw new BadRequestException('Categoría no encontrada');
      }

      const categoriaUpdate = {
        id: categoryDoc.id,
        nombre: updateCategoryDto.nombre ?? categoryDoc.data()?.nombre,
        descripcion:
          updateCategoryDto.descripcion ?? categoryDoc.data()?.descripcion,
        color: updateCategoryDto.color ?? categoryDoc.data()?.color,
        status: updateCategoryDto.estado ?? categoryDoc.data()?.status,
        updatedAt: new Date().toISOString(),
      };

      // Validar actividades
      if (
        updateCategoryDto.activities &&
        updateCategoryDto.activities.length > 0
      ) {
        if (
          updateCategoryDto.activities?.some(
            (activity) => !activity.actividadId,
          )
        ) {
          throw new BadRequestException(
            'Todas las actividades deben tener un ID válido',
          );
        }

        const categoriesXexercisesRef = db.collection('categoriesXexercise');

        // Eliminar relaciones antiguas
        const oldRelationsSnap = await categoriesXexercisesRef
          .where('categoriaId', '==', id)
          .get();

        // Eliminar relaciones antiguas
        const oldRelations = oldRelationsSnap.docs.map((doc) => doc.id);
        await Promise.all(
          oldRelations.map((relId) =>
            categoriesXexercisesRef.doc(relId).delete(),
          ),
        );

        // Agregar nuevas relaciones
        await Promise.all(
          updateCategoryDto.activities.map((activity) =>
            categoriesXexercisesRef.add({
              categoriaId: id,
              actividadId: activity.actividadId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }),
          ),
        );
      }

      // guardar la data nueva
      await categoryRef.update(categoriaUpdate);

      return {
        ...categoriaUpdate,
        activities: updateCategoryDto.activities,
      } as Category;
    } catch (error) {
      this.logger.error('Error actualizando categoría:', error);
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      this.logger.debug('Eliminando categoría:', id);
      const db = this.firebaseService.getFirestore();
      const categoryRef = db.collection('categories').doc(id);
      await categoryRef.delete();
    } catch (error) {
      this.logger.error('Error eliminando categoría:', error);
      throw error;
    }
  }

  async PausedCategories(response: any) {
    try {
      this.logger.debug('Pausando categoría:', response.id);
      const db = this.firebaseService.getFirestore();
      const categoryRef = db.collection('categories').doc(response.id);
      await categoryRef.update({ status: 'paused' });
    } catch (error) {
      this.logger.error('Error pausando categoría:', error);
      throw error;
    }
  }

  async getCategoriesWithActivitiesByIds(input: {
    ids: string[];
  }): Promise<Category[]> {
    const ids = input.ids;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return [];
    }
    try {
      this.logger.debug('Obteniendo categorías por IDs:', ids);
      const db = this.firebaseService.getFirestore();
      const categoriesSnap = await db
        .collection('categories')
        .where(FieldPath.documentId(), 'in', ids)
        .get();

      const categoriasConActividades: Category[] = [];

      for (const doc of categoriesSnap.docs) {
        const categoriaData = doc.data() as Category;

        // Obtener relaciones de actividades
        const exercisesSnap = await db
          .collection('categoriesXexercise')
          .where('categoriaId', '==', doc.id)
          .get();

        const exercisesIds = exercisesSnap.docs.map(
          (exDoc) => exDoc.data().actividadId,
        );

        let exercises: any = [];
        if (exercisesIds.length > 0) {
          const exercisesSnap = await db
            .collection('exercises')
            .where(FieldPath.documentId(), 'in', exercisesIds)
            .get();

          exercises = exercisesSnap.docs.map((exDoc) => ({
            id: exDoc.id,
            ...exDoc.data(),
          }));
        }

        categoriasConActividades.push({
          id: doc.id,
          ...categoriaData,
          ejercicios: exercises,
        } as Category);
      }

      return categoriasConActividades;
    } catch (error) {
      this.logger.error('Error obteniendo categorías por IDs:', error);
      throw error;
    }
  }

  async getCategoryRecentActivities(groupId: string): Promise<Category[]> {
    try {
      this.logger.debug(
        'Obteniendo actividades recientes para categoría:',
        groupId,
      );
      const db = this.firebaseService.getFirestore();
      // Obtener el plan cuya fechaFin sea la más próxima (mayor o igual a hoy, y más cercana)
      const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
      const plansSnap = await db
        .collection('plans')
        .where('groupId', '==', groupId)
        .where('fechaFin', '>=', today)
        .orderBy('fechaFin', 'asc')
        .limit(1)
        .get();

      if (plansSnap.empty) {
        throw new BadRequestException('No se encontró un plan con fechaFin próxima');
      }
      const planRef = plansSnap.docs[0].ref;
      const planDoc = await planRef.get();
      if (!planDoc.exists) {
        throw new BadRequestException('Plan no encontrado');
      }

      const categoryId = planDoc.data()?.categories?.[0];

      if (!categoryId) {
        throw new BadRequestException(
          'La categoría no está asociada a este plan',
        );
      }

     const categorias = await this.getCategoriesWithActivitiesByIds({
       ids: [categoryId],
     });
     return categorias;
    } catch (error) {
      this.logger.error('Error obteniendo actividades recientes:', error);
      throw error;
    }
  }
}
