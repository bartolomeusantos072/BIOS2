// Funções auxiliares para data e hora em tempo real formatadas em arrays numéricos
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

const defaultBiosData = {
    main: {
        title: "Standard CMOS Features",
        help: "Configurações básicas do sistema: data, hora, unidades de IDE/SATA e leitor de disquete.",
        items: [
            { label: "Date (mm/dd/yyyy)", type: "datetime", subType: "date", value: obterDataEstruturada() },
            { label: "Time (hh:mm:ss)", type: "datetime", subType: "time", value: obterHoraEstruturada() },
            { label: "IDE Primary Master", type: "select", options: ["None", "Auto", "Hard Disk"], value: "Auto" },
            { label: "IDE Primary Slave", type: "select", options: ["None", "Auto", "CDROM"], value: "CDROM" },
            { label: "Drive A", type: "select", options: ["None", "1.44M, 3.5 in."], value: "None" }
        ]
    },
    advanced: {
        title: "Advanced BIOS Features",
        help: "Parâmetros avançados de desempenho, cache, ordem de boot e recursos do sistema.",
        items: [
            { label: "Virus Warning", type: "select", options: ["Disabled", "Enabled"], value: "Disabled" },
            { label: "CPU Internal Cache", type: "select", options: ["Disabled", "Enabled"], value: "Enabled" },
            { label: "Quick Power On Self Test", type: "select", options: ["Disabled", "Enabled"], value: "Enabled" },
            { label: "First Boot Device", type: "select", options: ["Floppy", "Hard Disk", "CDROM", "USB-FDD"], value: "CDROM" },
            { label: "Second Boot Device", type: "select", options: ["Floppy", "Hard Disk", "CDROM", "Disabled"], value: "Hard Disk" },
            { label: "Third Boot Device", type: "select", options: ["Floppy", "Hard Disk", "CDROM", "Disabled"], value: "Disabled" }
        ]
    },
    peripherals: {
        title: "Integrated Peripherals",
        help: "Gerenciamento de portas de I/O integradas, controladoras USB, áudio e rede onboard.",
        items: [
            { label: "USB Controller", type: "select", options: ["Disabled", "Enabled (USB 2.0)"], value: "Enabled (USB 2.0)" },
            { label: "USB Keyboard Support", type: "select", options: ["Disabled", "Enabled"], value: "Enabled" },
            { label: "USB Mouse Support", type: "select", options: ["Disabled", "Enabled"], value: "Enabled" },
            { label: "AC97 Audio Onboard", type: "select", options: ["Disabled", "Auto"], value: "Auto" },
            { label: "Onboard LAN (Network)", type: "select", options: ["Disabled", "Enabled"], value: "Enabled" }
        ]
    },
    overclock: {
        title: "Frequency / Voltage Control (Overclock)",
        help: "Configurações de multiplicador de CPU, barramentos e ajustes manuais de tensão.",
        items: [
            { label: "CPU Host Clock (MHz)", type: "select", options: ["100 MHz", "133 MHz", "166 MHz", "200 MHz (OC)"], value: "133 MHz" },
            { label: "CPU Ratio / Multiplier", type: "select", options: ["Auto", "x10.0", "x12.5", "x15.0 (Unlocked)"], value: "Auto" },
            { label: "AGP Frequency (MHz)", type: "select", options: ["Auto", "66 MHz", "72 MHz"], value: "66 MHz" },
            { label: "CPU VCore Voltage", type: "select", options: ["Normal", "+0.05V", "+0.10V"], value: "Normal" }
        ]
    },
    power: {
        title: "Power Management Setup",
        help: "Recursos avançados de energia, suspensão e comportamento de ligar após queda de energia.",
        items: [
            { label: "ACPI Function", type: "select", options: ["Disabled", "Enabled"], value: "Enabled" },
            { label: "ACPI Suspend Type", type: "select", options: ["S1 (POS)", "S3 (STR)"], value: "S3 (STR)" },
            { label: "PWR Button < 4 Secs", type: "select", options: ["Soft-Off", "Suspend"], value: "Soft-Off" }
        ]
    },
    exit: {
        title: "Save & Exit Setup",
        help: "Grava as modificações no CMOS físico/virtual e reinicia, ou descarta as alterações.",
        items: [
            { label: "Save & Exit Setup", type: "action", action: "save" },
            { label: "Exit Without Saving", type: "action", action: "exit" },
            { label: "Load Optimized Defaults", type: "action", action: "defaults" }
        ]
    }
};

let biosData = JSON.parse(sessionStorage.getItem("cmos_bios_data")) || defaultBiosData;
let currentMenuKey = "main";
let selectedItemIndex = 0;
let inContentArea = false; 
let isHelpOpen = false;

let subFieldIndex = 0; 
let isSubEditing = false;

let memoryTarget = 65536; 
let currentMemory = 0;
let postTimer = null;

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
    // Oculta rigorosamente todas as outras telas
    document.getElementById("post-screen").style.display = "none";
    document.getElementById("bios-container").style.display = "none";
    document.getElementById("os-desktop-screen").style.display = "none";
    
    // Exibe apenas a tela de boot do Windows
    document.getElementById("windows-boot-screen").style.display = "flex";

    setTimeout(() => {
        if (currentAppState === "WIN_BOOT") {
            currentAppState = "OS_DESKTOP";
            document.getElementById("windows-boot-screen").style.display = "none";
            document.getElementById("os-desktop-screen").style.display = "flex";
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

                if (isSelected && isSubEditing) {
                    if (subFieldIndex === 0) mStr = `<span style="background:#000066; border-bottom:2px solid #fff">${mStr}</span>`;
                    if (subFieldIndex === 1) dStr = `<span style="background:#000066; border-bottom:2px solid #fff">${dStr}</span>`;
                    if (subFieldIndex === 2) yStr = `<span style="background:#000066; border-bottom:2px solid #fff">${yStr}</span>`;
                }
                displayValue = `${mStr}/${dStr}/${yStr}`;
            } else if (item.subType === "time") {
                let hStr = pad(v.hora);
                let minStr = pad(v.minuto);
                let sStr = pad(v.segundo);

                if (isSelected && isSubEditing) {
                    if (subFieldIndex === 0) hStr = `<span style="background:#000066; border-bottom:2px solid #fff">${hStr}</span>`;
                    if (subFieldIndex === 1) minStr = `<span style="background:#000066; border-bottom:2px solid #fff">${minStr}</span>`;
                    if (subFieldIndex === 2) sStr = `<span style="background:#000066; border-bottom:2px solid #fff">${sStr}</span>`;
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

window.addEventListener("keydown", (event) => {
    if (["F1", "F2", "F5", "F10", "Delete", "Del", "Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Escape"].includes(event.key)) {
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
            case "ArrowDown":
                if (!inContentArea) {
                    let currentIndex = menuKeys.indexOf(currentMenuKey);
                    if (event.key === "ArrowUp" && currentIndex > 0) {
                        currentMenuKey = menuKeys[currentIndex - 1];
                        selectedItemIndex = 0;
                    } else if (event.key === "ArrowDown" && currentIndex < menuKeys.length - 1) {
                        currentMenuKey = menuKeys[currentIndex + 1];
                        selectedItemIndex = 0;
                    }
                    isSubEditing = false;
                } else {
                    if (event.key === "ArrowUp" && selectedItemIndex > 0) {
                        selectedItemIndex--;
                        isSubEditing = false;
                    } else if (event.key === "ArrowDown" && selectedItemIndex < currentMenuObj.items.length - 1) {
                        selectedItemIndex++;
                        isSubEditing = false;
                    } else if (inContentArea && isSubEditing && activeItem.type === "datetime") {
                        let direcao = event.key === "ArrowUp" ? 1 : -1;
                        let v = activeItem.value;

                        if (activeItem.subType === "date") {
                            if (subFieldIndex === 0) { 
                                v.mes = ((v.mes - 1 + direcao + 12) % 12) + 1;
                                let maxD = diasNoMes(v.mes, v.ano);
                                if (v.dia > maxD) v.dia = maxD;
                            } else if (subFieldIndex === 1) { 
                                let maxD = diasNoMes(v.mes, v.ano);
                                v.dia = ((v.dia - 1 + direcao + maxD) % maxD) + 1;
                            } else if (subFieldIndex === 2) { 
                                v.ano += direcao;
                                if (v.ano < 1990) v.ano = 2099;
                                if (v.ano > 2099) v.ano = 1990;
                                let maxD = diasNoMes(v.mes, v.ano);
                                if (v.dia > maxD) v.dia = maxD;
                            }
                        } else if (activeItem.subType === "time") {
                            if (subFieldIndex === 0) { 
                                v.hora = (v.hora + direcao + 24) % 24;
                            } else if (subFieldIndex === 1) { 
                                v.minuto = (v.minuto + direcao + 60) % 60;
                            } else if (subFieldIndex === 2) { 
                                v.segundo = (v.segundo + direcao + 60) % 60;
                            }
                        }
                    }
                }
                break;

            case "ArrowRight":
                if (!inContentArea) {
                    inContentArea = true;
                    selectedItemIndex = 0;
                    isSubEditing = false;
                } else {
                    if (activeItem.type === "datetime" && isSubEditing) {
                        if (subFieldIndex < 2) {
                            subFieldIndex++;
                        } else {
                            isSubEditing = false;
                        }
                    } else if (activeItem.type === "select") {
                        let optIndex = activeItem.options.indexOf(activeItem.value);
                        optIndex = (optIndex + 1) % activeItem.options.length;
                        activeItem.value = activeItem.options[optIndex];
                    }
                }
                break;

            case "ArrowLeft":
                if (inContentArea) {
                    if (activeItem.type === "datetime" && isSubEditing) {
                        if (subFieldIndex > 0) {
                            subFieldIndex--;
                        } else {
                            isSubEditing = false;
                        }
                    } else {
                        inContentArea = false;
                        isSubEditing = false;
                    }
                } else {
                    inContentArea = false;
                }
                break;

            case "Enter":
                if (!inContentArea) {
                    inContentArea = true;
                    selectedItemIndex = 0;
                    isSubEditing = false;
                } else {
                    if (activeItem.type === "datetime") {
                        if (!isSubEditing) {
                            isSubEditing = true;
                            subFieldIndex = 0; 
                        } else {
                            if (subFieldIndex < 2) {
                                subFieldIndex++;
                            } else {
                                isSubEditing = false;
                            }
                        }
                    } else if (activeItem.type === "select") {
                        let optIndex = activeItem.options.indexOf(activeItem.value);
                        optIndex = (optIndex + 1) % activeItem.options.length;
                        activeItem.value = activeItem.options[optIndex];
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
                if (isSubEditing) {
                    isSubEditing = false;
                } else if (inContentArea) {
                    inContentArea = false;
                } else {
                    iniciarBootWindows();
                }
                break;
        }

        renderBIOSScreen();
    }
});

iniciarPOST();