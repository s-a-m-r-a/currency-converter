const apiUrl = "https://open.er-api.com/v6/latest";
const apiKey = "3a6a2c191a9c7559152599f5";

let defCurrencies = {
    from: "RUB",
    to: "USD"
};

const checkIfOnline = () => {
    return navigator.onLine;
};

const showOfflineNotification = () => {
    if (document.querySelector(".offline-notification")) return;
    const notification = document.createElement("div");
    notification.classList.add("offline-notification");
    notification.textContent = "The site has gone offline.";

    document.body.append(notification);
};

const backOnline = () => {
    const notification = document.querySelector(".offline-notification");
    if (notification) {
        notification.remove();
    }
};

const fetchRates = async (baseCurrency) => {
    if (!checkIfOnline()) {
        showOfflineNotification();
        const cachedData = localStorage.getItem(`rates_${baseCurrency}`);
        const currentTime = new Date().getTime();
        if (cachedData) {
            const parsed = JSON.parse(cachedData);
            if (currentTime - parsed.timestamp < 3600000) {
                return parsed.data;
            }
        }
        return null;
    }
    try {
        const response = await fetch(`${apiUrl}/${baseCurrency}?apikey=${apiKey}`);
        if (!response.ok) throw new Error("Failed to fetch exchange rates");
        const data = await response.json();
        localStorage.setItem(
            `rates_${baseCurrency}`,
            JSON.stringify({ rates: data.rates, timestamp: new Date().getTime() })
        );
        return data;
    } catch (error) {
        console.error("Error fetching rates:", error);
        return null;
    }
};

const updateAmounts = (fromInputId, toInputId, rate) => {
    const initInput = document.getElementById(fromInputId).value;
    const filteredInput = initInput.replace(/,/g, '.');
    const amountFrom = parseFloat(filteredInput) || 0;
    const convertedAmount = (amountFrom * rate).toFixed(5);
    document.getElementById(toInputId).value = convertedAmount > 0 ? convertedAmount : "";
};

const updateExchangeRates = async () => {
    const { from, to } = defCurrencies;
    if (from === to) return;
    const data = await fetchRates(from);
    if (data && data.rates) {
        const exchangeRate = data.rates[to];
        console.log(data.rates);
        document.querySelector(".rate1").textContent = `1 ${from} = ${exchangeRate.toFixed(5)} ${to}`;
        document.querySelector(".rate2").textContent = `1 ${to} = ${(1 / exchangeRate).toFixed(5)} ${from}`;
        
        updateAmounts("amount-left", "amount-right", exchangeRate);
    }
};
const setDefAmount = () => {
    document.getElementById("amount-left").value = "5000";
};

const inputEvents = (fromInputId, toInputId, ratifier) => {
    document.getElementById(fromInputId).addEventListener("input", (e) => {
       
        let input = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
         if (!checkIfOnline()) return;
        const element = input.split('.');
        if (element.length > 2) {
            input = element[0] + '.' + element.slice(1).join('');
        }
        e.target.value = input;
        
        const rate = parseFloat(document.querySelector(ratifier).textContent.split("=")[1]) || 1;
        updateAmounts(fromInputId, toInputId, rate);
    });
};

const btnEvents = () => {
    document.querySelectorAll(".currency1 button").forEach(button => {
        button.addEventListener("click", () => {
            if (defCurrencies.from === button.textContent) return;
            document.querySelectorAll(".currency1 button").forEach(btn => 
                btn.classList.remove("default"));
            button.classList.add("default");
            defCurrencies.from = button.textContent;
            updateExchangeRates();
        });
    });

    document.querySelectorAll(".currency2 button").forEach(button => {
        button.addEventListener("click", () => {
            if (defCurrencies.to === button.textContent) return;
            document.querySelectorAll(".currency2 button").forEach(btn => btn.classList.remove("default"));
            button.classList.add("default");
            defCurrencies.to = button.textContent;
            updateExchangeRates();
        });
    });

    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav');
    burger.addEventListener('click', () => nav.classList.toggle('active'));
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !burger.contains(e.target)) 
            nav.classList.remove('active');
    });
};

const init = () => {
    if(!checkIfOnline()) {
        showOfflineNotification();
        return;
    }
    document.querySelector(".currency1 button.left-rub").classList.add("default");
    document.querySelector(".currency2 button.right-usd").classList.add("default");
    setDefAmount();
    updateExchangeRates();
    window.addEventListener('online', () => {
        backOnline();
        updateExchangeRates();
    });

    window.addEventListener('offline', () => {
        showOfflineNotification();
    });
    btnEvents();
       
    inputEvents("amount-left", "amount-right", ".rate1");
    inputEvents("amount-right", "amount-left", ".rate2");
};

init();