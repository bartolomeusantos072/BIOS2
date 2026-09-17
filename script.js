// Funções auxiliares para data e hora em tempo real formatadas em objetos
function obterDataEstruturada() {
    const hoje = new Date();
    return {
        mes: hoje.getMonth() + 1,
        dia: hoje.getDate(),
        ano: hoje.getFullYear()
    };
}

function obterHoraEstruturada() {
    const agora = new Date();
    return {
        hora: agora.getHours(),
        minuto: agora.getMinutes(),
        segundo: agora.getSeconds()
    };
}

let currentAppState = "POST";
let defaultBiosData = null;
let biosData = null;

let currentMenuKey = "main";
let selectedItemIndex = 0;
let inContentArea = false; 
let isHelpOpen = false;

let subFieldIndex = 0; // Index do campo de data/hora (0: Mês/Hora, 1: Dia/Minuto, 2: Ano/Segundo)

let memoryTarget = 65536; 
let currentMemory = 0;
let postTimer = null;

async function inicializarAplicacao() {
    try {
        const response = await fetch("./biosData.json");
        defaultBiosData = await response.json();

        // Injeta os valores dinâmicos de Data e Hora no objeto carregado
        defaultBiosData.main.items.forEach(item => {
            if (item.type === "datetime") {
                if (item.subType === "date") item.value = obterDataEstruturada();
                if (item.subType === "time") item.value = obterHoraEstruturada();
            }
        });

        biosData = JSON.parse(sessionStorage.getItem("cmos_bios_data")) || defaultBiosData;
        iniciarPOST();
    } catch (error) {
        console.error("Erro ao carregar o arquivo JSON da BIOS:", error);
    }
}

function iniciarPOST() {
    currentAppState = "POST";
    currentMemory = 0;
    
    document.getElementById("post-screen").style.display = "flex";
    document.getElementById("windows-boot-screen").style.display = "none";
    document.getElementById("os-desktop-screen").style.display = "none";
    document.getElementById("bios-container").style.display = "none";

    const memEl = document.getElementById("memory-counter");
    postTimer = setInterval(() => {
        currentMemory += 4096;
        if (currentMemory >= memoryTarget) {
            currentMemory = memoryTarget;
            clearInterval(postTimer);
            
            setTimeout(() => {
                if (currentAppState === "POST") {
                    iniciarBootWindows();
                }
            }, 3500);
        }
        if (memEl) memEl.innerText = currentMemory + "KB";
    }, 40);
}

function iniciarBootWindows() {
    currentAppState = "WIN_BOOT";
    document.getElementById("post-screen").style.display = "none";
    document.getElementById("bios-container").style.display = "none";
    document.getElementById("os-desktop-screen").style.display = "none";
    
    document.getElementById("windows-boot-screen").style.display = "flex";

    setTimeout(() => {
        if (currentAppState === "WIN_BOOT") {
            currentAppState = "OS_DESKTOP";
            document.getElementById("windows-boot-screen").style.display = "none";
            
            // Carrega o simulador do Windows XP no iframe ao finalizar o boot
            const iframe = document.getElementById("windows-xp-frame");
            if (iframe && iframe.src !== "https://pranx.com/windows-xp-simulator/") {
                iframe.src = "https://pranx.com/windows-xp-simulator/";
            }

            document.getElementById("os-desktop-screen").style.display = "block";
        }
    }, 3500);
}
function reiniciarComputador() {
    location.reload();
}

function atualizarListaMenuHTML() {
    const menuListEl = document.getElementById("menu-list");
    if (!menuListEl) return;
    
    const menuLabels = {
        main: "Standard CMOS Features",
        advanced: "Advanced BIOS Features",
        peripherals: "Integrated Peripherals",
        overclock: "Frequency / Voltage Control",
        power: "Power Management Setup",
        exit: "Save & Exit Setup"
    };

    let html = "";
    for (let key in menuLabels) {
        let activeClass = (key === currentMenuKey) ? "active" : "";
        html += `<div class="menu-item ${activeClass}" data-menu="${key}">${menuLabels[key]}</div>`;
    }
    menuListEl.innerHTML = html;
}

const helpTextEl = document.getElementById("help-text");
const helpModalEl = document.getElementById("help-modal");

function diasNoMes(mes, ano) {
    return new Date(ano, mes, 0).getDate();
}

function renderBIOSScreen() {
    atualizarListaMenuHTML();
    
    const menuItemsEl = document.querySelectorAll(".menu-item");
    menuItemsEl.forEach((el) => {
        const menuKey = el.getAttribute("data-menu");
        if (menuKey === currentMenuKey) {
            el.classList.add("active");
        } else {
            el.classList.remove("active");
        }
    });

    const currentMenu = biosData[currentMenuKey];
    let htmlContent = `<div style="color: #ffff00; margin-bottom: 8px; border-bottom: 1px solid #ffff00; font-weight: bold;">[ ${currentMenu.title} ]</div>`;
    
    currentMenu.items.forEach((item, index) => {
        let isSelected = (inContentArea && selectedItemIndex === index);
        let displayValue = "";

        if (item.type === "datetime") {
            let v = item.value;
            let pad = (n) => String(n).padStart(2, '0');
            let padYear = (n) => String(n).padStart(4, '0');

            if (item.subType === "date") {
                let mStr = pad(v.mes);
                let dStr = pad(v.dia);
                let yStr = padYear(v.ano);

                // Destaca o sub-campo ativo na linha selecionada
                if (isSelected) {
                    if (subFieldIndex === 0) mStr = `<span style="background:#000066; color:#fff; font-weight:bold;">${mStr}</span>`;
                    if (subFieldIndex === 1) dStr = `<span style="background:#000066; color:#fff; font-weight:bold;">${dStr}</span>`;
                    if (subFieldIndex === 2) yStr = `<span style="background:#000066; color:#fff; font-weight:bold;">${yStr}</span>`;
                }
                displayValue = `${mStr}/${dStr}/${yStr}`;
            } else if (item.subType === "time") {
                let hStr = pad(v.hora);
                let minStr = pad(v.minuto);
                let sStr = pad(v.segundo);

                // Destaca o sub-campo ativo na linha selecionada
                if (isSelected) {
                    if (subFieldIndex === 0) hStr = `<span style="background:#000066; color:#fff; font-weight:bold;">${hStr}</span>`;
                    if (subFieldIndex === 1) minStr = `<span style="background:#000066; color:#fff; font-weight:bold;">${minStr}</span>`;
                    if (subFieldIndex === 2) sStr = `<span style="background:#000066; color:#fff; font-weight:bold;">${sStr}</span>`;
                }
                displayValue = `${hStr}:${minStr}:${sStr}`;
            }
        } else {
            displayValue = item.value !== undefined ? item.value : '&gt;&gt;';
        }

        htmlContent += `
            <div class="setting-row ${isSelected ? 'selected' : ''}">
                <span class="setting-label">${item.label}</span>
                <span class="setting-value">${displayValue}</span>
            </div>
        `;
    });

    htmlContent += `<br><div style="font-size: 11px; color: #aaa;">${currentMenu.help}</div>`;
    helpTextEl.innerHTML = htmlContent;
}

function salvarNoCMOS() {
    sessionStorage.setItem("cmos_bios_data", JSON.stringify(biosData));
}

// Incrementa/decrementa o valor do item selecionado (+ ou -)
function alterarValorItem(activeItem, direcao) {
    if (activeItem.type === "datetime") {
        let v = activeItem.value;

        if (activeItem.subType === "date") {
            if (subFieldIndex === 0) { 
                // Mês (1-12)
                v.mes = ((v.mes - 1 + direcao + 12) % 12) + 1;
                let maxD = diasNoMes(v.mes, v.ano);
                if (v.dia > maxD) v.dia = maxD;
            } else if (subFieldIndex === 1) { 
                // Dia
                let maxD = diasNoMes(v.mes, v.ano);
                v.dia = ((v.dia - 1 + direcao + maxD) % maxD) + 1;
            } else if (subFieldIndex === 2) { 
                // Ano
                v.ano += direcao;
                if (v.ano < 1990) v.ano = 2099;
                if (v.ano > 2099) v.ano = 1990;
                let maxD = diasNoMes(v.mes, v.ano);
                if (v.dia > maxD) v.dia = maxD;
            }
        } else if (activeItem.subType === "time") {
            if (subFieldIndex === 0) { 
                // Hora (0-23)
                v.hora = (v.hora + direcao + 24) % 24;
            } else if (subFieldIndex === 1) { 
                // Minuto (0-59)
                v.minuto = (v.minuto + direcao + 60) % 60;
            } else if (subFieldIndex === 2) { 
                // Segundo (0-59)
                v.segundo = (v.segundo + direcao + 60) % 60;
            }
        }
    } else if (activeItem.type === "select") {
        let optIndex = activeItem.options.indexOf(activeItem.value);
        optIndex = (optIndex + direcao + activeItem.options.length) % activeItem.options.length;
        activeItem.value = activeItem.options[optIndex];
    }
}

// Digitação direta de números nos sub-campos de data e hora
function inserirNumeroDireto(activeItem, num) {
    if (activeItem.type !== "datetime") return;
    let v = activeItem.value;

    if (activeItem.subType === "date") {
        if (subFieldIndex === 0) { // Mês
            let novo = v.mes * 10 + num;
            v.mes = (novo >= 1 && novo <= 12) ? novo : num;
            let maxD = diasNoMes(v.mes, v.ano);
            if (v.dia > maxD) v.dia = maxD;
        } else if (subFieldIndex === 1) { // Dia
            let maxD = diasNoMes(v.mes, v.ano);
            let novo = v.dia * 10 + num;
            v.dia = (novo >= 1 && novo <= maxD) ? novo : (num <= maxD ? num : v.dia);
        } else if (subFieldIndex === 2) { // Ano
            let novo = v.ano * 10 + num;
            if (novo > 2099) novo = 2000 + num;
            v.ano = novo;
        }
    } else if (activeItem.subType === "time") {
        if (subFieldIndex === 0) { // Hora
            let novo = v.hora * 10 + num;
            v.hora = (novo >= 0 && novo <= 23) ? novo : num;
        } else if (subFieldIndex === 1) { // Minuto
            let novo = v.minuto * 10 + num;
            v.minuto = (novo >= 0 && novo <= 59) ? novo : num;
        } else if (subFieldIndex === 2) { // Segundo
            let novo = v.segundo * 10 + num;
            v.segundo = (novo >= 0 && novo <= 59) ? novo : num;
        }
    }
}

window.addEventListener("keydown", (event) => {
    const keysIgnorar = ["F1", "F2", "F5", "F10", "Delete", "Del", "Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Escape", "+", "-", "PageUp", "PageDown"];
    if (keysIgnorar.includes(event.key)) {
        event.preventDefault();
    }

    if (currentAppState === "POST") {
        if (event.key === "Delete" || event.key === "F2" || event.key === "F10") {
            clearInterval(postTimer);
            currentAppState = "BIOS";
            document.getElementById("post-screen").style.display = "none";
            document.getElementById("bios-container").style.display = "flex";
            renderBIOSScreen();
        }
        return;
    }

    if (currentAppState === "BIOS") {
        if (isHelpOpen) {
            isHelpOpen = false;
            helpModalEl.style.display = "none";
            return;
        }

        const menuKeys = Object.keys(biosData);
        let currentMenuObj = biosData[currentMenuKey];
        let activeItem = currentMenuObj.items[selectedItemIndex];

        // Se for um número de 0 a 9, digita direto no sub-campo selecionado
        if (/^[0-9]$/.test(event.key) && inContentArea) {
            inserirNumeroDireto(activeItem, parseInt(event.key, 10));
            renderBIOSScreen();
            return;
        }

        switch (event.key) {
            case "F1":
                helpModalEl.style.display = "block";
                isHelpOpen = true;
                break;

            case "F10":
                salvarNoCMOS();
                alert("Configurações salvas no CMOS! Inicializando o sistema operacional...");
                iniciarBootWindows();
                break;

            case "ArrowUp":
                if (!inContentArea) {
                    let currentIndex = menuKeys.indexOf(currentMenuKey);
                    if (currentIndex > 0) {
                        currentMenuKey = menuKeys[currentIndex - 1];
                        selectedItemIndex = 0;
                        subFieldIndex = 0;
                    }
                } else {
                    if (selectedItemIndex > 0) {
                        selectedItemIndex--;
                        subFieldIndex = 0;
                    }
                }
                break;

            case "ArrowDown":
                if (!inContentArea) {
                    let currentIndex = menuKeys.indexOf(currentMenuKey);
                    if (currentIndex < menuKeys.length - 1) {
                        currentMenuKey = menuKeys[currentIndex + 1];
                        selectedItemIndex = 0;
                        subFieldIndex = 0;
                    }
                } else {
                    if (selectedItemIndex < currentMenuObj.items.length - 1) {
                        selectedItemIndex++;
                        subFieldIndex = 0;
                    }
                }
                break;

            // Altera valor para cima (+ ou PageUp)
            case "+":
            case "PageUp":
                if (inContentArea) {
                    alterarValorItem(activeItem, 1);
                }
                break;

            // Altera valor para baixo (- ou PageDown)
            case "-":
            case "PageDown":
                if (inContentArea) {
                    alterarValorItem(activeItem, -1);
                }
                break;

            // Alterna entre os sub-campos (Mês -> Dia -> Ano) ou (Hora -> Minuto -> Segundo)
            case "Tab":
                if (inContentArea && activeItem.type === "datetime") {
                    if (event.shiftKey) {
                        subFieldIndex = (subFieldIndex - 1 + 3) % 3; // Shift + Tab volta
                    } else {
                        subFieldIndex = (subFieldIndex + 1) % 3; // Tab avança
                    }
                }
                break;

            case "ArrowRight":
                if (!inContentArea) {
                    inContentArea = true;
                    selectedItemIndex = 0;
                    subFieldIndex = 0;
                } else {
                    if (activeItem.type === "datetime") {
                        subFieldIndex = (subFieldIndex + 1) % 3;
                    } else if (activeItem.type === "select") {
                        alterarValorItem(activeItem, 1);
                    }
                }
                break;

            case "ArrowLeft":
                if (inContentArea) {
                    if (activeItem.type === "datetime") {
                        if (subFieldIndex > 0) {
                            subFieldIndex--;
                        } else {
                            inContentArea = false;
                        }
                    } else if (activeItem.type === "select") {
                        alterarValorItem(activeItem, -1);
                    } else {
                        inContentArea = false;
                    }
                } else {
                    inContentArea = false;
                }
                break;

            case "Enter":
                if (!inContentArea) {
                    inContentArea = true;
                    selectedItemIndex = 0;
                    subFieldIndex = 0;
                } else {
                    if (activeItem.type === "datetime") {
                        subFieldIndex = (subFieldIndex + 1) % 3;
                    } else if (activeItem.type === "select") {
                        alterarValorItem(activeItem, 1);
                    } else if (activeItem.type === "action") {
                        if (activeItem.action === "save") {
                            salvarNoCMOS();
                            alert("Configurações salvas no CMOS!");
                            iniciarBootWindows();
                        } else if (activeItem.action === "exit") {
                            if (confirm("Sair sem salvar as alterações?")) {
                                sessionStorage.removeItem("cmos_bios_data");
                                iniciarBootWindows();
                            }
                        } else if (activeItem.action === "defaults") {
                            sessionStorage.removeItem("cmos_bios_data");
                            biosData = JSON.parse(JSON.stringify(defaultBiosData));
                            alert("Padrões otimizados carregados.");
                            renderBIOSScreen();
                        }
                    }
                }
                break;

            case "Escape":
                if (inContentArea) {
                    inContentArea = false;
                    subFieldIndex = 0;
                } else {
                    iniciarBootWindows();
                }
                break;
        }

        renderBIOSScreen();
    }
});

inicializarAplicacao();