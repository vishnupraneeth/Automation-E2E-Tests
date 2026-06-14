import { Basepage } from "./BasePage";
import { Locator, Page } from "@playwright/test";
export class HomePage extends Basepage{

    private readonly HomePageLogo:Locator;
    private readonly LoggedInUser:Locator;


    constructor(page:Page){
        super(page);
        this.HomePageLogo = page.getByRole('link', { name: 'Home' });
        this.LoggedInUser = page.locator(`a:has-text("Logged in as")`);
    }

     async getHomePageTitle():Promise<string>{
        return this.page.title();
    }
    async isHomePageLogoVisible():Promise<boolean>{
        return this.HomePageLogo.isVisible();
    }

    async getLoggedInUserText():Promise<string | null>{
        return this.LoggedInUser.textContent();
    }


}