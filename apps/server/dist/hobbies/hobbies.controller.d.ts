import { HobbiesService } from "./hobbies.service";
export declare class HobbiesController {
    private readonly hobbiesService;
    constructor(hobbiesService: HobbiesService);
    findAll(): Promise<{
        name: string;
        id: number;
    }[]>;
}
