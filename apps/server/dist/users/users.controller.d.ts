import { User as UserEntity } from "@prisma/client";
import { SelectHobbiesDto } from "./dto/select-hobbies.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";
import { UsersService } from "./users.service";
type SafeUser = Omit<UserEntity, "password">;
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMyProfile(user: SafeUser): Promise<{
        id: string;
        email: string;
        username: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateMyLocation(user: SafeUser, updateLocationDto: UpdateLocationDto): Promise<{
        success: boolean;
    }>;
    selectMyHobbies(userId: string, selectHobbiesDto: SelectHobbiesDto): Promise<{
        success: boolean;
    }>;
    initialSelectHobbies(authedUserId: string, userId: string, selectHobbiesDto: SelectHobbiesDto): Promise<{
        success: boolean;
    }> | {
        success: boolean;
        error: string;
    };
}
export {};
