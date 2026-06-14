import { test , expect } from '../src/fixtures/pagefixtures';

test.beforeEach(async ({ loginPage }) => {


     await loginPage.goToLoginPage();
     // ! is just like optional keyword in java which does null checks 
     await loginPage.loginToApplication(process.env.APP_USERNAME!, process.env.APP_PASSWORD!);


});

test('Home Page Title Validation',async({homePage})=>{

    let title = await homePage.getHomePageTitle();
    expect(title).toBe("Automation Exercise");
});
test('Home Page Logo Validation',async({homePage})=>{

    let isHomePageLogoVisible = await homePage.isHomePageLogoVisible();
    expect(isHomePageLogoVisible).toBeTruthy();
});
test('Logged In User Text Validation',async({homePage})=>{

    let loggedInUserText = await homePage.getLoggedInUserText();
    expect(loggedInUserText?.trim()).toBe("Logged in as vishnu");
});