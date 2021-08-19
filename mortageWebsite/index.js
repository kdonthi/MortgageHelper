//Getting express
const express = require("express");
const app = express();
app.use(express.json());

//Getting mongoose
const mongoose = require("mongoose");

//Getting Joi
const Joi = require("joi");

//Setting port
const port = process.env.PORT ?? 5000;

//Connecting to db
async function connectToDatabase() {
    await mongoose.connect(`mongodb://localhost:${port}/Landis`);
}
connectToDatabase().then(() => "Database connected.");

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

const Person = mongoose.model("Person", personSchema, 'HousingInformation');

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
app.post(`localhost:${port}/people`, (req, res) => {
    let result = personSchemaValidation.validate(req.body);
    if (result.error) {
        res.send(result.error);
        return;
    }
    else {
        let newPerson = Person(req.body);
        newPerson.save();
    }
});

//Read
async function getPeople() {
    return await Person.find({});
}
app.get(`localhost:${port}/people`, (_, res) => {
    res.send(JSON.stringify(getPeople()));
});

async function getPersonInfo(number, property) {
    return await Person
        .find({})
        .skip(number - 1)
        .limit(1)
        .select(`${property}`);
}

//Getting information about name
app.get(`localhost:${port}/:number/:property`, (req, res) => {
    console.log(req.params);
    let number = parseInt(req.params.number);
    let property = req.params.value;
    res.send(getPersonInfo(number, property))
});

//Update

let updateSchema = Joi.object({
    id: Joi.string().required(),
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

app.put(`localhost:${port}/`, (req, res) => {
    let args = req.body;
    let validationResult = updateSchema.validate(args);
    if (validationResult.error) {
        res.send(validationResult.error);
        return;
    }
    else {
        let id = req.body.id;
        console.log(req.body);
        let updatedPerson = Person.findByIdAndUpdate(id, (person) => {
        }, {new: true});
        res.send(updatedPerson);
    }
})

app.delete(`localhost:${port}/`, (req, res) => {
    let id = req.params.id;
    let deletedPerson = Person.deleteOne({_id: id});
    res.send(deletedPerson);
})