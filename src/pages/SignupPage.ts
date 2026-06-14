import { Locator, Page } from "@playwright/test";
import { Basepage } from "./BasePage";
import { JsonHelper } from "../utils/JsonHelper";
import { test } from "../fixtures/pagefixtures";
export class SignupPage extends Basepage{

   private readonly enterAccountInformation:Locator;
   private readonly firstName:Locator;
   private readonly lastName:Locator
   private readonly state:Locator;
   private readonly city:Locator;
   private readonly zipcode:Locator;
   private readonly mobileNumber:Locator;
   private readonly address:Locator;
   private readonly createAccountButton:Locator;
   private readonly createdAccountValidationMessage:Locator;
   private readonly password:Locator;

    constructor(page:Page)
    {
        super(page);
        this.enterAccountInformation =  page.getByText('Enter Account Information', { exact: true });
        this.firstName = page.getByRole('textbox', { name: 'First name *' });
        this.lastName = page.locator('#last_name');
        this.state =  page.locator('#state');
        this.city = page.getByRole('textbox', { name: 'City *' });;
        this.zipcode =  page.locator('#zipcode');
        this.mobileNumber =  page.locator('#mobile_number');
        this.address = page.locator('[name="address1"]');
        this.createAccountButton = page.getByText('Create Account', { exact: true });
        this.createdAccountValidationMessage = page.getByText('Account Created!', { exact: true });
        this.password = page.getByRole('textbox', { name: 'Password *' });;

    }

    async isEnterAccountInformationVisible():Promise<boolean>{
        return this.enterAccountInformation.isVisible();        

    }

    

// call this action from test class and assert 
async fillSignupDetailsFromJson(FirstName: string, LastName: string, State: string, City: string, Zipcode: string, MobileNumber: string, Address: string, Password: string): Promise<void> {
        await this.firstName.fill(FirstName);
        await this.lastName.fill(LastName);
        await this.state.fill(State);
        await this.city.fill(City);
        await this.zipcode.fill(Zipcode);
        await this.mobileNumber.fill(MobileNumber);
        await this.address.fill(Address);
        await this.password.fill(Password);
        
    };
     async createNewAccount():Promise<boolean>{
        await  this.createAccountButton.isVisible(); 
        await  this.createAccountButton.click(); 
        await this.createdAccountValidationMessage.waitFor({state:'visible'});
        return this.createdAccountValidationMessage.isVisible();        
        
    }

};