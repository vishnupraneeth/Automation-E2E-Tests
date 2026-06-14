import { faker } from '@faker-js/faker';

export class FakerHelper {
    static getRandomUsername(): string {
        return faker.internet.userName();  // e.g. "john_doe42"
    }

    static getRandomEmail(): string {
        return faker.internet.email();  // e.g. "john@example.com"
    }

    static getRandomPassword(): string {
        return faker.internet.password({ length: 10 });  // e.g. "xK9#mP2qL1"
    }

    static getRandomFullName(): string {
        return faker.person.fullName();  // e.g. "John Doe"
    }
}