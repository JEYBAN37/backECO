import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateProcessGroupDto, UpdateProcessGroupDto, UpdateProcessGroupMembersDto } from '../dto/process-group.dto';

@Injectable()
export class ProcessGroupService {
  private readonly logger = new Logger(ProcessGroupService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async getProcessGroups() {
    try {
      const db = this.firebaseService.getFirestore();
      const snapshot = await db.collection('processGroups')
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
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

      const doc = await groupRef.get();
      if (!doc.exists) {
        throw new NotFoundException('Grupo no encontrado');
      }

      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      await groupRef.update(updateData);

      return {
        id,
        ...updateData,
      };
    } catch (error) {
      this.logger.error('Error updating process group:', error);
      throw error;
    }
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

      const updateData = {
        members: data.members,
        updatedAt: new Date().toISOString(),
      };

      await groupRef.update(updateData);

      return {
        id,
        ...doc.data(),
        ...updateData,
      };
    } catch (error) {
      this.logger.error('Error updating group members:', error);
      throw error;
    }
  }
}
