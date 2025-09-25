import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import {
  CreateProcessGroupDto,
  UpdateProcessGroupDto,
  UpdateProcessGroupMembersDto,
} from '../dto/process-group.dto';
import { UserGroupAssignDto } from 'src/user_phone/dto/ecouser.dto';
import { UserService } from 'src/user_phone/user.service';
import { ExerciseService } from 'src/exercise/exercise.service';

@Injectable()
export class ProcessGroupService {
  private readonly logger = new Logger(ProcessGroupService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly userService: UserService,
    private readonly activitiesService: ExerciseService,
  ) {}

  async getProcessGroups() {
    try {
      const db = this.firebaseService.getFirestore();
      const snapshot = await db
        .collection('processGroups')
        .orderBy('createdAt', 'desc')
        .get();

      this.logger.debug('No se actualizan miembros, obteniendo existentes');

      const groupWithUsers = snapshot.docs.map(async (doc) => {
        const userGroup: UserGroupAssignDto = {
          groupId: doc.id,
          users: doc.data()?.members,
        };

        const users = await this.userService.getUsersByUid(userGroup, db);

        // obtener con el id del grupo los plans asociados
        const plans = await db
          .collection('plans')
          .where('groupId', '==', doc.id)
          .get();

        let planData: any = [];
        if (!plans.empty)
          planData = plans.docs.map((plan) => ({
            id: plan.id,
            ...plan.data(),
          }));

        // agregar al usergroup la propiedad plans
        this.logger.debug(`Plans for group ${doc.id}: ${planData}`);

        return {
          id: doc.id,
          name: doc.data().name,
          description: doc.data().description,
          color: doc.data().color,
          members: users,
          plans: planData,
        };
      });

      return Promise.all(groupWithUsers);
    } catch (error) {
      this.logger.error('Error getting process groups:', error);
      throw error;
    }
  }

  async createProcessGroup(data: CreateProcessGroupDto) {
    try {
      const db = this.firebaseService.getFirestore();
      const now = new Date().toISOString();

      const docRef = await db.collection('processGroups').add({
        ...data,
        createdAt: now,
        updatedAt: now,
      });

      return {
        id: docRef.id,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      this.logger.error('Error creating process group:', error);
      throw error;
    }
  }

  async updateProcessGroup(id: string, data: UpdateProcessGroupDto) {
    try {
      const db = this.firebaseService.getFirestore();
      const groupRef = db.collection('processGroups').doc(id);

      this.logger.debug(`Updating process group ${id} with data: ${JSON.stringify(data)}`);

      const doc = await groupRef.get();
      if (!doc.exists) {
        throw new NotFoundException('Grupo no encontrado');
      }

      // Construir updateData sin actualizar 'members' si viene vacío o no está presente
      const updateData: any = {
        name: data.name,
        description: data.description,
        color: data.color,
        updatedAt: new Date().toISOString(),
      };

      if ((data.members && data.members.length > 0) || data.members === null) {
        this.logger.debug('Updating members field si hay');
        updateData.members = data.members;
      }

      await groupRef.update(updateData);

      // Solo asignar usuarios si 'members' viene con datos
      let users = [];
      if (data.members && data.members.length > 0) {
        users = await this.assignUsersToGroup({
          groupId: id,
          users: data.members,
        });
      } else {
        // Si no se actualizan miembros, obtener los existentes del grupouwiov er cunatos miebro aay en docdata
        this.logger.debug('No se actualizan miembros, obteniendo existentes');
        const userGroup: UserGroupAssignDto = {
          groupId: id,
          users: doc.data()?.members || [],
        };
        this.logger.debug('Fetching existing members from DB');
        users = await this.userService.getUsersByUid(userGroup, db);
      }

      // obtener con el id del grupo los plans asociados
      const plans = await db
        .collection('plans')
        .where('groupId', '==', doc.id)
        .get();
      let planData: any = [];
      if (!plans.empty)
        planData = plans.docs.map((plan) => ({
          id: plan.id,
          ...plan.data(),
        }));

      return {
        id,
        name: updateData.name,
        description: updateData.description,
        color: updateData.color,
        members: users,
        plans: planData,
      };
    } catch (error) {
      this.logger.error('Error updating process group:', error);
      throw error;
    }
  }

  private async assignUsersToGroup(
    users: UserGroupAssignDto,
  ): Promise<{ id: string; name: string; email: string }[]> {
    return await this.userService.assignUserToGroup(users);
  }

  async deleteProcessGroup(id: string) {
    try {
      const db = this.firebaseService.getFirestore();
      const groupRef = db.collection('processGroups').doc(id);

      const doc = await groupRef.get();
      if (!doc.exists) {
        throw new NotFoundException('Grupo no encontrado');
      }

      await groupRef.delete();
    } catch (error) {
      this.logger.error('Error deleting process group:', error);
      throw error;
    }
  }

  async updateGroupMembers(id: string, data: UpdateProcessGroupMembersDto) {
    try {
      const db = this.firebaseService.getFirestore();
      const groupRef = db.collection('processGroups').doc(id);
      const doc = await groupRef.get();
      if (!doc.exists) {
        throw new NotFoundException('Grupo no encontrado');
      }

      // obtener con el id del grupo los plans asociados
      const plans = await db
        .collection('plans')
        .where('groupId', '==', doc.id)
        .get();
      let planData: any = [];
      if (!plans.empty)
        planData = plans.docs.map((plan) => ({ id: plan.id, ...plan.data() }));

      // agregar al usergroup la propiedad plans
      this.logger.debug(`Plans for group ${doc.id}: ${planData}`);

      const updateData = {
        members: data.members,
        updatedAt: new Date().toISOString(),
      };

      await groupRef.update(updateData);
      const users = await this.assignUsersToGroup({
        groupId: id,
        users: data.members,
      });

      return {
        id,
        name: doc.data()?.name,
        description: doc.data()?.description,
        color: doc.data()?.color,
        members: users,
        plans: planData,
      };
    } catch (error) {
      this.logger.error('Error updating group members:', error);
      throw error;
    }
  }

  async getProcessesByGroupId(groupId: string) {
    try {
      const db = this.firebaseService.getFirestore();
      // Obtener procesos cuyo updatedAt es mayor que un mes antes de hoy
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      // obtener el grupo
      const snapshot = await db
        .collection('processGroups')
        .doc(groupId)
        .get();

      if (!snapshot.exists) {
        throw new NotFoundException('Grupo no encontrado');
      }

      this.logger.debug(`Procesos para el grupo ${groupId}: ${JSON.stringify(snapshot.data())}`);

      // obtener los plans asociados a ese grupo
      const plans = await db
        .collection('plans')
        .where('groupId', '==', groupId)
        .where('estado', '==', true)
        .where('updatedAt', '>=', oneMonthAgo.toISOString())
        .get();

      let planData: any = [];
      if (!plans.empty)
        planData = plans.docs.map((plan) => ({
          id: plan.id,
          ...plan.data(),
        }));

      return {
        id: snapshot.id,
        description: snapshot.data()?.description,
        name: snapshot.data()?.name,
        color: snapshot.data()?.color,
        createdAt: snapshot.data()?.createdAt,
        updatedAt: snapshot.data()?.updatedAt,
        plans: planData,
      };
    } catch (error) {
      this.logger.error('Error getting processes by group ID:', error);
      throw error;
    }
  }

  async deleteGroupPlans(group: string, body: any) {
    try {
      this.logger.debug(`Deleting plans for group ${group}:`, body['ids']);
      if (body['ids'].length === 0) {
        this.logger.debug('No plan IDs provided for deletion.');
        return;
      }
      const db = this.firebaseService.getFirestore();
      const batch = db.batch();
      body['ids'].forEach((id: any) => {
        const planRef = db.collection('plans').doc(id);
        batch.delete(planRef);
      });
      await batch.commit();
    } catch (error) {
      this.logger.error('Error deleting group plans:', error);
      throw error;
    }
  }

  async getAllPlans() {
    try {
      const db = this.firebaseService.getFirestore();
      const plansSnapshot = await db.collection('plans').get();

      if (plansSnapshot.empty) {
        return [];
      }

      // Obtener todos los grupos para mapear id -> nombre
      const groupsSnapshot = await db.collection('processGroups').get();
      const groupMap = new Map<string, string>();
      groupsSnapshot.forEach(doc => {
        groupMap.set(doc.id, doc.data().name);
      });

      // Mapear cada plan con el nombre del grupo correspondiente
      const plans = plansSnapshot.docs.map(planDoc => {
        const planData = planDoc.data();
        const groupId = planData.groupId;
        const groupName = groupMap.get(groupId) || null;
        return {
          id: planDoc.id,
          ...planData,
          groupName,
        };
      });
      return plans;
    } catch (error) {
      this.logger.error('Error getting all plans:', error);
      throw error;
    }
  }
}
