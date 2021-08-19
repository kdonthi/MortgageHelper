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

const personSchema = mongoose.Schema({
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
    tags: Joi.array().items(Joi.string())
});

//Create
app.post(`localhost:${port}/people`, (req, res) => {

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

