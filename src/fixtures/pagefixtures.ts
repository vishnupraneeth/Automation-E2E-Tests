import {test as baseTest} from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { CsvHelper } from '../utils/CsvHelper';
import { SignupPage } from '../pages/SignupPage';

// define types for page fixtures :
type pageFixtures = {

    loginPage:LoginPage;
    homePage:HomePage;
    SignupPage:SignupPage;
    testData:Record<string, string>[];
}
;
// extend playwright base test :

export let test = baseTest.extend<pageFixtures>({

     // creating login page fixture : - We just need to create object 
     // use exposes the loginpage fixture to external  test cases
  loginPage: async ({ page }, use) => {  
    let loginPage = new LoginPage(page);
    await use(loginPage);
 },

// creating login page fixture : - We just need to create object 
     // use exposes the loginpage fixture to external  test cases
   homePage: async ({ page }, use) => {        

    let homePage = new HomePage(page);
    await use(homePage);

    },

  SignupPage: async ({ page }, use) => {        

    let signupPage = new SignupPage(page);
    await use(signupPage);

    },

    testData: async ({}, use) => {
    let testData = CsvHelper.readCsv('src/testdata/loginData.csv');
    await use(testData);
    }
});
export {expect} from '@playwright/test';