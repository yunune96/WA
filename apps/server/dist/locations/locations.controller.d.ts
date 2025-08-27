import { LocationsService } from "./locations.service";
export declare class LocationsController {
    private readonly locationsService;
    constructor(locationsService: LocationsService);
    findNearbyUsers(userId: string, radius?: string): Promise<{
        hobbies: string[];
        commonHobbies: string[];
        distance: string;
        latitude: number | null;
        longitude: number | null;
        location: {
            latitude: number;
            longitude: number;
        } | null;
        id: string;
        email: string;
        username: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
}
