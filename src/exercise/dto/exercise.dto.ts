import { CreateExerciseDto } from "./create-exercise.dto";

export interface Exercise extends CreateExerciseDto {
  id?: string;
  createdAt: string;
  updatedAt: string;
}