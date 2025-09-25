export interface UserDataFireAccountDto {
  email: string;
  password: string;
}

export interface UserDataEcobreackDto {
  email: string;
  gender: string;
  phoneNumber: string;
  avatarColor: string;
  name: string;
  lastName: string;
  numActivities?: number;
  numTimeInApp?: number;
}

export interface UserGroupAssignDto {
  groupId: string;
  users: string[];
}
