import {test, expect} from '@playwright/test';
import { HomePage } from '../src/pages/HomePage';
import { LoginPage } from '../src/pages/LoginPage';
let loginPage:LoginPage;
let homePage:HomePage;

test.beforeEach(async ({ page }) => {

    loginPage = new LoginPage(page);
    await loginPage.goToLoginPage();
    await  loginPage.loginToApplication("vishnupraneeth96@gmail.com", "Automation@123");
    homePage = new HomePage(page);

});

test('Home Page Title Validation',async({page})=>{

    let title = await homePage.getHomePageTitle();
    expect(title).toBe("Automation Exercise");
});
test('Home Page Logo Validation',async({page})=>{

    let isHomePageLogoVisible = await homePage.isHomePageLogoVisible();
    expect(isHomePageLogoVisible).toBeTruthy();
});
test('Logged In User Text Validation',async({page})=>{

    let loggedInUserText = await homePage.getLoggedInUserText();
    expect(loggedInUserText?.trim()).toBe("Logged in as vishnu");
});