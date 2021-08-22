//Test only work when index.js is running
let indexModule = require("./index.js");
let { Person } = indexModule;
let { port } = indexModule;
let baseUrl = `localhost:${port}`;

test("Should be sum of inputs", () => {
    expect(add(1, 2)).toBe(3);
    }
)

async function getCount(model, body) {
    let count = await model.find(body).count();
    return count;
}
test("Should delete added person", async () => {
    let postUrl = baseUrl + "/people";
    let body = {
        "id": "2",
        "balance": "2000",
        "credit": 35,
        "picture": "picture of cate",
        "name_first": "kaushik",
        "name_last": "donthi",
        "employer": "nethermind",
        "email": "kaushikdr@gamil.com",
        "phone": 5107714914,
        "address": "34344 Portia Terrace",
        "comments": "hola chicas",
        "created": "2017-11-01T00:00:00",
        "tags": [ "cool", "ginger ale"]
    };

    let params = {
        headers: {
            "content-type": "application/json; charset UTF-8"
        },
        body: body,
        method: "POST"
    }

    let bodyCount = await Person.find(body).count();
    expect(bodyCount).toBe(0);

    await fetch(postUrl, params);
    bodyCount = await Person.find(body).count();
    expect(bodyCount).toBe(1);

    let personId = Person.find(body).select({id: 1});
    let deleteUrl = baseUrl + personId;

    await fetch(deleteUrl);
    expect(await Person.find(body).count()).toBe(0);
        //do we have to include the rest of the body inside the first fetch?
    //do all the async methods get completed before the program finishes?
})