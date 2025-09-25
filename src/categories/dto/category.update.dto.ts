import { ActivitiesDto } from "./category.dto";

export class UpdateCategoryDto  {
  nombre?: string;
  descripcion?: string;
  color?: string;
  estado?: string;
  activities?: ActivitiesDto[];
}


