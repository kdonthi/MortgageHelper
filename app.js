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
let db = "mongodb+srv://kaushikdr:1234@cluster0.32gri.mongodb.net/Landis?retryWrites=true&w=majority";
mongoose.connect(db)
    .then(_ => console.log("Connected to database."));

const winston = require("winston");
const logConfiguration = {
    'transports': [
        new winston.transports.Console()
    ]
};
const logger = winston.createLogger(logConfiguration);
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

//Creating model
const Person = mongoose.model("Person", personSchema, 'HousingInformation');

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

//Read
app.get(`/people`, (_, res) => {
    getPeople()
        .then(people => {
            console.log(people);
            let output = people.map(person => JSON.stringify(person)).join("\n");
            res.send(output);
        })
        .catch(err => winston.info(err));
});

async function getPeople() {
    return await Person.find({});
}

app.get("/people/count", (req, res) => {
    let filter = req.body.filter ? req.body.filter : {};
    getPeopleCount(res, filter);
})


function getPeopleCount(res, filter) {
    Person.countDocuments(filter, (error, documentCount) => {
        if (error) {
            winston.info(error);
            res.status(404).send(error);
        }
        else {
            res.send(documentCount.toString());
        }
    })
}

app.get(`/people/:number/:property`, (req, res) => {
    let personNumber = parseInt(req.params.number);
    let personProperty = req.params.property;
    getPersonProperty(personNumber, personProperty, res);
});

function getPersonProperty(personNumber, personProperty, res) {
    if (personNumber <= 0) {
        res.status(400).send("The person number was less than or equal to 0.");
        return;
    }
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

app.get("/visualizationData", (req, res) => {
    getVisualizationData().then(result => res.send(result));
})

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

function calculateMortgageScore(credit, balance) {
    let mortgageScore = Math.min((credit / 850) * 100 + balance / 1000, 100);
    return Math.round(mortgageScore * 100) / 100;
}

//Update
app.put(`/people/:id`, (req, res) => {
    let id = req.params.id;
    let updateRequest = req.body;
    let { error } = validateUpdateSchema(updateRequest);
    if (error) {
        res.status(400).send(error);
    }
    else {
        updatePerson(id, updateRequest, res);
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

async function updatePerson(id, updateRequest, res) {
    Person.findByIdAndUpdate(id, updateRequest, {new: true}, (err, result) => {
        if (err) {
            res.status(404).send(err);
        }
        else if (result) {
            res.send(result);
        }
        else {
            res.status(400).send(new Error("A person with that ID was not found."));
        }
    })
}

app.delete(`/people/:id`, (req, res) => {
    let id = req.params.id;
    deletePerson(id, res);
})

async function deletePerson(id, res) {
    Person.findByIdAndDelete(id, {}, (err, result) => {
        if (err) {
            res.status(404).send(err);
        }
        else if (result) {
            res.send(result);
        }
        else {
            res.status(400).send(new Error("A person with that ID was not found."));
        }
    });
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