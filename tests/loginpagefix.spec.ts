import { test , expect } from '../src/fixtures/pagefixtures';
import { CsvHelper } from '../src/utils/CsvHelper';
import { FakerHelper } from '../src/utils/fakerUtil';

test.beforeEach(async ({ loginPage }) => {


     await loginPage.goToLoginPage();


});


test('Login Page Title Validation',async({loginPage})=>{

    let title = await loginPage.getLoginPageTitle();
    expect(title).toBe("Automationnnnn Exercise - Signup / Login");
});

test('Sign Up Button Validation',async({loginPage})=>{

    let isSignUpButtonVisible = await loginPage.getSignUpButtonText();
    expect(isSignUpButtonVisible).toBeTruthy();
});

// implementing soft assertions in login test case
test('Login to Application',async({loginPage,homePage})=>{

    await loginPage.loginToApplication(process.env.APP_USERNAME!, process.env.APP_PASSWORD!); 
    let title = await homePage.getHomePageTitle();
    expect.soft(title).toBe("Automation Exercise");  
    expect.soft(await homePage.isHomePageLogoVisible()).toBeTruthy();
    
});
//DD_1. sequence mode -- only 1 test is running with test data one by one using testData from fixture
test('Login with Invalid Credentials',async({testData,loginPage})=>{
 for (let data of testData){
   await loginPage.loginToApplication(data.APP_USERNAME,data.APP_PASSWORD);
   let isErrorMessageVisible = await loginPage.loginWithInvalidCredentials();
   expect.soft(isErrorMessageVisible).toBeTruthy();
 }
});  
//DD_2: without fixtures, parallel mode. read csv data directly and loop the test method row wise...
let testData = CsvHelper.readCsv('src/testdata/loginData.csv');
for (let row of testData) {
    test(`invalid login test with - ${row.APP_USERNAME} - ${row.APP_PASSWORD}`, async ({ loginPage }) => {
        await loginPage.loginToApplication(row.APP_USERNAME, row.APP_PASSWORD);
        let isErrorMessageVisible = await loginPage.loginWithInvalidCredentials();
        expect.soft(isErrorMessageVisible).toBeTruthy();
    });
};

test('Signup Page Functionality',async({loginPage,SignupPage})=>{
 await loginPage.goToLoginPage();
 await loginPage.EnterSignupandClickSignup(FakerHelper.getRandomUsername(),FakerHelper.getRandomEmail());
 let   Account_Information_Visible =    SignupPage.isEnterAccountInformationVisible();
 expect.soft(Account_Information_Visible).toBeTruthy();

});