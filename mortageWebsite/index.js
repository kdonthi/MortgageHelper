//Getting express
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.listen(port, () => console.log(`Listening to port ${port}`));

//Getting mongoose
const mongoose = require("mongoose");

//Getting Joi
const Joi = require("joi");

//Connecting to db
async function connectToDatabase() {
    try {
        await mongoose.connect(`mongodb://localhost/Landis`);
    }
    catch (error) {
        console.log(error);
    }
}
connectToDatabase();

//Creating schema and model for schema
const personSchema = mongoose.Schema({
    id: String,
    balance: String,
    credit: Number,
    picture: String,
    name_first: String,
    name_last: String,
    employer: String,
    email: String,
    phone: Number,
    address: String,
    comments: String,
    created: Date,
    tags: [ String ]
});

personSchema.index({
    id: 1,
    balance: 1,
    credit: 1,
    picture: 1,
    name_first: 1,
    name_last: 1,
    employer: 1,
    email: 1,
    phone: 1,
    address: 1,
    comments: 1,
    created: 1,
    tags: 1}, {unique: true});

const Person = mongoose.model("Person", personSchema, 'HousingInformation');
//Person.deleteMany({name_first: "kaushik"}).then(() => console.log("All of Kaushik was deleted"));
const personSchemaValidation = Joi.object({
    id: Joi.string().required(),
    balance: Joi.string().required(),
    credit: Joi.number().required(),
    picture: Joi.string().required(),
    name_first: Joi.string().required(),
    name_last: Joi.string().required(),
    employer: Joi.string().required(),
    email: Joi.string().required(),
    phone: Joi.number().required(),
    address: Joi.string().required(),
    comments: Joi.string().required(),
    created: Joi.date().required(),
    tags: Joi.array().items(Joi.string()).required()
});

//Create
app.post(`/people`, (req, res) => {
    console.log("In the post method.");
    let result = personSchemaValidation.validate(req.body);
    if (result.error) {
        res.send(result.error);
    }
    else {
        let newPerson = new Person(req.body);
        newPerson.save()
            .then(_ => res.send(newPerson))
            .catch(err => res.status(400).send("Duplicate person sent"));
    }
});

//Read
async function getPeople() {
    return await Person.find({});
}
app.get(`/people`, (_, res) => {
    getPeople()
        .then(people => {
            console.log(people);
            let output = people.map(person => JSON.stringify(person)).join("\n");
            res.send(people);
        });
});

async function getPersonInfo(number, property) {
    try {
        console.log("here 1");
        return await Person
            .find({})
            .skip(number - 1)
            .limit(1)
            .select(`${property}`);
    }
    catch (error) {
        console.log("here 2");
        console.log("Error", error);
        return error;
    }
}
function getDocumentCount(personNumber, personProperty, res) {
    Person.countDocuments({}, (error, documentCount) => {
        if (error) {
            res.status(404).send(error);
        }
        else if (documentCount < personNumber)
        {
            res.status(400).send("The person number was greater than the number of objects.");
        }
        else {
            console.log(documentCount);
            getPersonInfo(personNumber, personProperty)
                .then(value => res.send(value))
                .catch(err => res.status(404).send(new Error(err)));
        }
    })
}

//Getting information about name
app.get(`/people/:number/:property`, (req, res) => {
    console.log("This is called.")
    let personNumber = parseInt(req.params.number);
    let personProperty = req.params.property;
    getDocumentCount(personNumber, personProperty, res);
});

const updateSchema = Joi.object({
    id: Joi.string(),
    balance: Joi.string(),
    credit: Joi.number(),
    picture: Joi.string(),
    name_first: Joi.string(),
    name_last: Joi.string(),
    employer: Joi.string(),
    email: Joi.string(),
    phone: Joi.number(),
    address: Joi.string(),
    comments: Joi.string(),
    created: Joi.date(),
    tags: Joi.array().items(Joi.string())
});
//Update
app.put(`/people/:id`, (req, res) => {
    let args = req.body;
    let validationResult = updateSchema.validate(args);
    if (validationResult.error) {
        res.send(validationResult.error);
        return;
    }
    else {
        let id = req.params.id;
        console.log(args);
        Person
            .findByIdAndUpdate(id, {
                $set: args
            }, {new: true})
            .then(updatedPerson => res.send(updatedPerson));
    }
});

async function deletePerson(id) {
    return await Person.findByIdAndDelete(id);
}
app.delete(`/people/:id`, (req, res) => {
    let id = req.params.id;
    deletePerson(id).then(deletedPerson => res.send(deletedPerson))
        .catch(err => res.status(400).send(err.message));
})
