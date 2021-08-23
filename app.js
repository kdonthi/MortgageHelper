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

//Getting path
const path = require("path");
//Connecting to db
let db = "mongodb+srv://kaushikdr:Howareyou1!@cluster0.32gri.mongodb.net/myFirstDatabase?retryWrites=true&w=majority?authSource=admin"
mongoose.connect(db)
    .then(_ => console.log("Connected to database."));

const winston = require("winston");
//Creating schema
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

//Preventing dups
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
    tags: 1}, {unique: true}
);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
    next();
});

//Creating model
const Person = mongoose.model("Person", personSchema, 'HousingInformation');

function validateSchema(schema) {
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
        tags: Joi.array().items(Joi.string()).required(),
    });

    return personSchemaValidation.validate(schema);
}
//Create
app.post(`/people`, (req, res) => {
    console.log("In the post method.");
    let result = validateSchema(req.body);
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
            res.send(output);
        });
});

app.get("/people/count", (req, res) => {
    let filter = req.body.filter ? req.body.filter : {};
    getPeopleCount(res, filter);
})

function getPeopleCount(res, filter) {
    Person.countDocuments(filter, (error, documentCount) => {
        if (error) {
            res.status(404).send(error);
        }
        else {
            res.send(documentCount.toString());
        }
    })
}

app.get(`/people/:number/:property`, (req, res) => {
    //console.log("This is called.")
    let personNumber = parseInt(req.params.number);
    let personProperty = req.params.property;
    getPersonProperty(personNumber, personProperty, res);
});

function getPersonProperty(personNumber, personProperty, res) {
    Person.countDocuments({}, (error, documentCount) => {
        if (error) {
            res.status(404).send(error);
        }
        else if (documentCount < personNumber)
        {
            res.status(400).send("The person number was greater than the number of objects.");
        }
        else {
            getPersonInfo(personNumber, personProperty)
                .then(value => res.send(value))
                .catch(err => res.status(404).send(err));
        }
    })
}

function calculateMortgageScore(credit, balance) {
    let mortgageScore = Math.min((credit / 850) * 100 + balance / 1000, 100);
    console.log(credit, balance, mortgageScore);
    return Math.round(mortgageScore * 100) / 100;
}

async function getVisualizationData() {
    let mortgageGroups = {
        "good": 0,
        "okay": 0,
        "bad": 0
    };

    let creditScoreGroups = {
        "Poor": 0,
        "Fair": 0,
        "Good": 0,
        "Very Good": 0,
        "Exceptional": 0
    }
    let people;

    try {
        people = await Person
            .find({})
            .select("credit balance");
    }
    catch (error) {
        return error;
    }
    for (let i = 0; i < people.length; i++) {
        //console.log(people);
        let credit = people[i].credit;
        let balance = people[i].balance;
        let mortgageScore = calculateMortgageScore(parseInt(credit), balance);

        if (mortgageScore > 75) mortgageGroups["good"] += 1;
        else if (mortgageScore > 45) mortgageGroups["okay"] += 1;
        else mortgageGroups["bad"] += 1;

        if (credit <= 579) creditScoreGroups["Poor"] += 1;
        else if (credit >= 580 && credit <= 669) creditScoreGroups["Fair"] += 1;
        else if (credit >= 670 && credit <= 739) creditScoreGroups["Good"] += 1;
        else if (credit >= 740 && credit <= 799) creditScoreGroups["Very Good"] += 1;
        else creditScoreGroups["Exceptional"] += 1;

    }
    return [mortgageGroups, creditScoreGroups];
}

app.get("/visualizationData", (req, res) => {
    getVisualizationData().then(result => res.send(result));
})

async function getPersonInfo(number, property) {
    try {
        return await Person
            .find({})
            .skip(number - 1)
            .limit(1)
            .select(`${property}`);
    }
    catch (error) {
        return error;
    }
}


//Update
app.put(`/people/:id`, (req, res) => {
    let id = req.params.id;
    let updateRequest = req.body;
    console.log(updateRequest);
    let { error } = validateUpdateSchema(updateRequest);
    if (error) {
        res.status(400).send(error);
    }
    else {
        Person
            .findByIdAndUpdate(id, {$set: updateRequest}, {new: true})
            .then(updatedPerson => res.send(updatedPerson))
            .catch(err => res.status(404).send(err));
    }
});

function validateUpdateSchema(schema) {
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
        tags: Joi.array().items(Joi.string()),
    });

    return updateSchema.validate(schema);
}

app.delete(`/people/:id`, (req, res) => {
    let id = req.params.id;
    deletePerson(id)
        .then(deletedPerson => res.send(deletedPerson))
        .catch(err => res.status(400).send(err));
})

async function deletePerson(id) {
    return await Person.findByIdAndDelete(id);
}

module.exports.Person = Person;
module.exports.port = port;

//Sending webpages
app.get("/", (req, res) => {
    try {
        res.sendFile(path.join(__dirname, "/webpages/index.html"));
    }
    catch (err) {
        winston.info(err);
    }
})

app.get("/statistics", (req, res) => {
    res.sendFile(path.join(__dirname, "/webpages/statistics.html"));
})