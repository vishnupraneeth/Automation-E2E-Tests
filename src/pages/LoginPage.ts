import { Locator, Page } from "@playwright/test";
import { Basepage } from "./BasePage";
export class LoginPage extends Basepage{

    private readonly EmailId:Locator;
    private readonly Password:Locator;
    private readonly LoginButton:Locator;
    private readonly signUp:Locator;
    private readonly loginErrorMessage:Locator;

    // signup functionality
    private readonly SignupName:Locator;
    private readonly SignupEmail:Locator;
    private readonly SignupButton:Locator;
     // Constructor to initialize the locators
    constructor(page:Page){
        super(page);
        this.EmailId =   page.locator(`(//input[@name='email'])[1]`);
        this.Password =  page.locator(`//input[@name='password'][1]`);
        this.LoginButton = page.getByRole('button', { name: 'Login' })
        this.signUp    =      page.getByRole('button', { name: 'Signup' });
        this.loginErrorMessage = page.getByText('Your email or password is incorrect!', { exact: true });
        // signup functionality 
        this.SignupName = page.getByRole('textbox', { name: 'Name' });
        this.SignupEmail = page.locator(`(//input[@name='email'])[2]`);
        this.SignupButton = page.getByRole('button', { name: 'Signup' });
    }
   
   // Method to navigate to the login page
   
    async goToLoginPage():Promise<void>{
        await this.page.goto('/login');
    }

    async getLoginPageTitle(){
        return this.page.title();
    }

    async getSignUpButtonText():Promise<boolean>{

        return this.signUp.isVisible();
    }
 
   
    async loginToApplication(email:string,password:string):Promise<void>{
        await this.EmailId.fill(email);
        await this.Password.fill(password);
        await this.LoginButton.click();
    }

    async loginWithInvalidCredentials():Promise<boolean>{
        await this.loginErrorMessage.waitFor({state:'visible'});
        return this.loginErrorMessage.isVisible();

    }

     async EnterSignupandClickSignup(email:string,password:string):Promise<void>{
        await this.SignupName.fill(email);
        await this.SignupEmail.fill(password);
        await this.SignupButton.click();
    }

}