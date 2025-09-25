import { FirebaseService } from "@firebase/firebase.service";
import { Injectable } from "@nestjs/common";
import { CreateMotivoDto } from "./dto/motivo.create.dto";


@Injectable()
export class MotivosService {

    constructor( private readonly firebaseService: FirebaseService) {}

    async findAll() {
        const db = this.firebaseService.getFirestore();
        // Motivos
        const motivosCollection = db.collection('motivos');
        const snapshot = await motivosCollection.get();
        const motivos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return motivos;
    }

    async findActive() {
        const db = this.firebaseService.getFirestore();
        const motivosCollection = db.collection('motivos');
        const snapshot = await motivosCollection.where('estado', '==', true).get();
        const motivosActivos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return motivosActivos;
    }

    async create(createMotivoDto: CreateMotivoDto) {
        const db = this.firebaseService.getFirestore();
        const motivosCollection = db.collection('motivos');
        const docRef = await motivosCollection.add(createMotivoDto);
        return {
            id: docRef.id,
            ...createMotivoDto
        };
    }

    async update(id: string, updateMotivoDto: any) {
        const db = this.firebaseService.getFirestore();
        const motivosCollection = db.collection('motivos');
        const docRef = motivosCollection.doc(id);
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
            throw new Error('Motivo not found');
        }

        // Only update fields that are present in updateMotivoDto
        const currentData = docSnapshot.data() || {};
        const newData = { ...currentData, ...updateMotivoDto };

        await docRef.update(newData);

        return {
            id,
            ...newData
        };
    }

    async remove(id: string) {
        const db = this.firebaseService.getFirestore();
        const motivosCollection = db.collection('motivos');
        await motivosCollection.doc(id).delete();
        return {
            id
        };
    }

}
