import { test , expect } from '../src/fixtures/pagefixtures';
import { CsvHelper } from '../src/utils/CsvHelper';
import { FakerHelper } from '../src/utils/fakerUtil';
import { JsonHelper } from '../src/utils/JsonHelper';

test.beforeEach(async ({ loginPage }) => {


     await loginPage.goToLoginPage();
     await loginPage.EnterSignupandClickSignup(FakerHelper.getRandomUsername(),FakerHelper.getRandomEmail());


});


let loginJSONData = JsonHelper.readJson("src/testdata/SignupUtils.json")
  for (let row of loginJSONData) {
    test(`Fill the Signup Form and Validate the result - ${row.FirstName}`, async ({ loginPage,SignupPage }) => {
     await SignupPage.fillSignupDetailsFromJson(row.FirstName, row.LastName, row.State, row.City, row.Zipcode, row.MobileNumber, row.Address,row.Password);
     expect.soft(await SignupPage.createNewAccount()).toBe(true);
    });

  }
