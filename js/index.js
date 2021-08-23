let baseUrl = "http://localhost:3000";

async function getPeopleCount() {
    return await fetch(baseUrl + "/people/count");
}

async function getProperty(property, number) {
    try {
        let obj = await fetch(baseUrl + `/people/${number}/${property}`);
        let jsonObj = await obj.json();
        return jsonObj[0][property];
    }
    catch (err) {
        console.log(err);
    }
}

async function addPersonalInformation(divElement, number) {
    let firstName = await getProperty("name_first", number);
    let lastName = await getProperty("name_last", number);
    let emailDiv = await getDivWithHtml("email", number, "Email");
    let phoneNumberDiv = await getDivWithHtml("phone", number, "Phone");

    let nameDiv = document.createElement("div");
    nameDiv.id = "name" + number;
    nameDiv.innerHTML = `<b>Name:</b> ${firstName} ${lastName}`;
    nameDiv.classList.add("card-info")

    let imgDiv = document.createElement("img");
    imgDiv.id = "img" + number;
    imgDiv.src = await getProperty("picture", number);


    divElement.appendChild(imgDiv);
    divElement.appendChild(nameDiv);
    divElement.appendChild(emailDiv);
    divElement.appendChild(phoneNumberDiv);
}

async function calculateMortgageScore(number) {
    let balance = await getProperty("balance", number);
    balance = parseFloat(balance);
    let creditScore = await getProperty("credit", number);
    creditScore = parseInt(creditScore);
    let mortgageScore = Math.min((creditScore / 850) * 100 + balance / 10000, 100);
    return Math.round(mortgageScore * 100) / 100;
}

function barAnimation(mortgageScore, indicatorDiv) {
    let divWidth = 0;
    let timer = setInterval(() => {
        if (divWidth > mortgageScore) {
            clearInterval(timer);
            divWidth = 0;
        } else {
            divWidth += 1;
            indicatorDiv.style.width = divWidth + "%";
        }
    }, 10);
}

async function addIndicatorInformation(divElement, number) {
    let balanceDiv = await getDivWithHtml("balance", number, "Balance");
    let creditScoreDiv = await getDivWithHtml("credit", number, "Credit");
    let button = document.createElement("button");
    button.innerHTML = "Click to see how this person qualifies for a mortgage";
    button.classList.add("card-info");
    let indicatorDiv = document.createElement("div");
    indicatorDiv.id = "indicator" + number;
    indicatorDiv.style.position = "relative";
    indicatorDiv.classList.add("card-info");
    let indicatorExplainingDiv = document.createElement("div");
    indicatorExplainingDiv.id = "indicatorExplanation" + number;
    indicatorExplainingDiv.style.position = "relative";
    indicatorExplainingDiv.classList.add("card-info");


    let mortgageScore = await calculateMortgageScore(number);

    let indicatorExplainDiv;
    if (mortgageScore > 75) {
        indicatorDiv.style.backgroundColor = "green";
        indicatorExplainDiv = "This person is ready to get a mortgage!"
    }
    else if (mortgageScore > 45) {
        indicatorDiv.style.backgroundColor = "yellow";
        indicatorExplainDiv = "This person is almost ready to get a mortgage."
    }
    else {
        indicatorDiv.style.backgroundColor = "red";
        indicatorExplainDiv = "This person has a bit of work to do before getting a mortgage."
    }

    divElement.appendChild(balanceDiv);
    divElement.appendChild(creditScoreDiv);
    divElement.appendChild(button);
    divElement.appendChild(indicatorDiv);
    divElement.appendChild(indicatorExplainingDiv);

    button.addEventListener("click", () => {
        barAnimation(mortgageScore, indicatorDiv);
        indicatorDiv.innerHTML = `Mortgage Score: ${mortgageScore} / 100`;
        indicatorExplainingDiv.innerHTML = indicatorExplainDiv;
    })
}

async function getDivWithHtml(className, number, tag) {
    let div = GetPersonalInfoDiv(className, number);
    let property = await getProperty(className, number);
    if (tag !== "") {
        div.innerHTML = `<b>${tag}</b>: ${property}`;
    }
    else {
        div.innerHTML = property;
    }
    return div;
}

function GetPersonalInfoDiv(className, number) {
    let divElement = document.createElement("div");
    if (className === "frontOfCard") {
        addPersonalInformation(divElement, number);
    }
    else if (className === "backOfCard") {
        addIndicatorInformation(divElement, number);
    }
    else {
        divElement.classList.add("card-info");
    }
    divElement.id = className + number.toString();
    divElement.classList.add(className);
    return divElement;
}

function addTile(number, tileContainer) {
    return new Promise((resolve, reject) => {
        let container = GetPersonalInfoDiv("container", number);
        let card = GetPersonalInfoDiv("card", number);
        let frontOfCard = GetPersonalInfoDiv("frontOfCard", number);
        let backOfCard = GetPersonalInfoDiv("backOfCard", number);
        tileContainer.appendChild(container);
        container.appendChild(card);
        card.appendChild(frontOfCard);
        card.appendChild(backOfCard);
        resolve(1);
    });
}

function addTiles() {
    getPeopleCount()
        .then(people => {return people.json();})
        .then(count => {
            let intCount = parseInt(JSON.stringify(count));
            let tileContainer = document.getElementById("tileContainer");
            let listOfPromises = []
            for (let i = 1; i <= intCount; i++) {
                addTile(i, tileContainer).then(res => listOfPromises.push(res));
            }
            Promise.all(listOfPromises)
                .then(_ => console.log("Tiles finished adding"));
        })
        .catch(error => console.log("Error in adding tiles.", error));
}

addTiles();