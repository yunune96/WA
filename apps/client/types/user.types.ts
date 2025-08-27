export interface UserWithoutPassword {
  id: string;
  email: string;
  username: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchedUser {
  id: string;
  username: string | null;
  hobbies: string[];
  commonHobbies: string[];
  distance: string;
  latitude: number | null;
  longitude: number | null;
}
