
import { test, expect } from '@playwright/test';

let AUTH_TOKEN = { Authorization: 'Bearer d0bf1714ac04c10dd2982e009d2dffe694a8e0b53af518cb7370e41e046a72f6' };


test('get user test', async ({ request }) => {

    let response = await request.get('https://gorest.co.in/public/v2/users', {
        headers: AUTH_TOKEN
    });

    //console.log(response);
    let jsonBody = await response.json();
    console.log(jsonBody);

    console.log(response.status());
    console.log(response.statusText());

    expect(response.status()).toBe(200);

});


test('create a user test', async ({ request }) => {

    //JS Object
    let userData = {
        name: 'uday',
        email: `automation_${Date.now()}@open.com`,
        gender: 'male',
        status: 'active'
    };

    //JS Object to JSON: Serialization
    let response = await request.post('https://gorest.co.in/public/v2/users', {
        headers: AUTH_TOKEN,
        data: userData
    });

    //console.log(response);
    let jsonBody = await response.json();
    console.log(jsonBody);

    console.log(response.status());//201
    console.log(response.statusText()); //Created
});


test('Update a user test', async ({ request }) => {

    //JS Object
    let userData = {
        name: 'uday101',
        email: `automation_${Date.now()}@open.com`,
        gender: 'male',
        status: 'inactive'
    };

    //JS Object to JSON: Serialization
    let response = await request.put('https://gorest.co.in/public/v2/users/8501947', {
        headers: AUTH_TOKEN,
        data: userData
    });

    //console.log(response);
    let jsonBody = await response.json();
    console.log(jsonBody);

    console.log(response.status());//200
    console.log(response.statusText()); //OK
});


test('Delete a user test', async ({ request }) => {


    //JS Object to JSON: Serialization
    let response = await request.delete('https://gorest.co.in/public/v2/users/8501947', {
        headers: AUTH_TOKEN,
    });

    console.log(response.status());//204
    console.log(response.statusText()); //No Content
});