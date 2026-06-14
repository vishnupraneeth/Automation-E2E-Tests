import { HomePage } from '../src/pages/HomePage';
import {LoginPage} from '../src/pages/LoginPage';
import { test, expect } from '@playwright/test';

let loginPage :LoginPage;
let homepage    :HomePage;
test.beforeEach(async ({ page }) => {

     loginPage = new LoginPage(page);
     await loginPage.goToLoginPage();
     homepage= new HomePage(page);

});


test('Login Page Title Validation',async({page})=>{

    let title = await loginPage.getLoginPageTitle();
    // Deliberately wrong expected value to trigger Jira bug creation
    expect(title).toBe("Automation Exercise - Signup / Login");
});

test('Sign Up Button Validation',async({page})=>{

    let isSignUpButtonVisible = await loginPage.getSignUpButtonText();
    expect(isSignUpButtonVisible).toBeTruthy();
});

// implementing soft assertions in login test case
test('Login to Application',async({page})=>{

    await loginPage.loginToApplication("vishnupraneeth96@gmail.com", "Automation@123"); 
    let title = await homepage.getHomePageTitle();
    expect.soft(title).toBe("Automation Exercise");  
    expect.soft(await homepage.isHomePageLogoVisible()).toBeTruthy();
    
});