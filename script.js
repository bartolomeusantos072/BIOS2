// Funções auxiliares para data e hora em tempo real
function obterDataAtual() {
    const hoje = new Date();
    const mm = String(hoje.getMonth() + 1).padStart(2, '0');
    const dd = String(hoje.getDate()).padStart(2, '0');
    const yyyy = hoje.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
}

function obterHoraAtual() {
    const agora = new Date();
    const hh = String(agora.getHours()).padStart(2, '0');
    const min = String(agora.getMinutes()).padStart(2, '0');
    const ss = String(agora.getSeconds()).padStart(2, '0');
    return `${hh}:${min}:${ss}`;
}

let currentAppState = "POST";

const defaultBiosData = {
    main: {
        title: "Standard CMOS Features",
        help: "Configurações básicas do sistema: data, hora, unidades de IDE/SATA e leitor de disquete.",
        items: [
            { label: "Date (mm/dd/yyyy)", type: "text", value: obterDataAtual() },
            { label: "Time (hh:mm:ss)", type: "text", value: obterHoraAtual() },
            { label: "IDE Primary Master", type: "select", options: ["None", "Auto", "Hard Disk"], value: "Auto" },
            { label: "IDE Primary Slave", type: "select", options: ["None", "Auto", "CDROM"], value: "CDROM" },
            { label: "Drive A", type: "select", options: ["None", "1.44M, 3.5 in."], value: "1.44M, 3.5 in." }
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
let isEditingText = false; // Flag para controlar se estamos digitando livremente em um campo de texto
let isHelpOpen = false;

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
    document.getElementById("post-screen").style.display = "none";
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
        let displayValue = item.value !== undefined ? item.value : '&gt;&gt;';
        
        // Se estiver editando este campo de texto, adiciona um cursor piscante visual simulado
        if (isSelected && isEditingText && item.type === "text") {
            displayValue = `<span style="border-bottom: 2px solid #fff; background-color: #000066;">${displayValue}_</span>`;
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
    // Se estiver editando um campo de texto livremente
    if (currentAppState === "BIOS" && inContentArea && isEditingText) {
        let currentMenuObj = biosData[currentMenuKey];
        let item = currentMenuObj.items[selectedItemIndex];

        if (event.key === "Enter" || event.key === "Escape") {
            event.preventDefault();
            isEditingText = false; // Sai do modo de digitação inline
            renderBIOSScreen();
            return;
        }

        if (event.key === "Backspace") {
            event.preventDefault();
            if (item.value.length > 0) {
                item.value = item.value.slice(0, -1);
                renderBIOSScreen();
            }
            return;
        }

        // Se for um caractere legível, adiciona ao texto do campo
        if (event.key.length === 1) {
            event.preventDefault();
            item.value += event.key;
            renderBIOSScreen();
            return;
        }
    }

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
                    }
                } else {
                    if (selectedItemIndex > 0) {
                        selectedItemIndex--;
                    }
                }
                break;

            case "ArrowDown":
                if (!inContentArea) {
                    let currentIndex = menuKeys.indexOf(currentMenuKey);
                    if (currentIndex < menuKeys.length - 1) {
                        currentMenuKey = menuKeys[currentIndex + 1];
                        selectedItemIndex = 0;
                    }
                } else {
                    if (selectedItemIndex < currentMenuObj.items.length - 1) {
                        selectedItemIndex++;
                    }
                }
                break;

            case "ArrowRight":
                if (!inContentArea) {
                    inContentArea = true;
                    selectedItemIndex = 0;
                } else {
                    let item = currentMenuObj.items[selectedItemIndex];
                    if (item.type === "select") {
                        let optIndex = item.options.indexOf(item.value);
                        optIndex = (optIndex + 1) % item.options.length;
                        item.value = item.options[optIndex];
                    } else if (item.type === "text") {
                        isEditingText = true; // Ativa digitação inline
                    }
                }
                break;

            case "ArrowLeft":
                if (inContentArea) {
                    let item = currentMenuObj.items[selectedItemIndex];
                    if (item.type === "select") {
                        let optIndex = item.options.indexOf(item.value);
                        optIndex = (optIndex - 1 + item.options.length) % item.options.length;
                        item.value = item.options[optIndex];
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
                } else {
                    let item = currentMenuObj.items[selectedItemIndex];
                    if (item.type === "select") {
                        let optIndex = item.options.indexOf(item.value);
                        optIndex = (optIndex + 1) % item.options.length;
                        item.value = item.options[optIndex];
                    } else if (item.type === "text") {
                        isEditingText = true; // Ativa digitação direta na linha ao pressionar Enter
                    } else if (item.type === "action") {
                        if (item.action === "save") {
                            salvarNoCMOS();
                            alert("Configurações salvas no CMOS!");
                            iniciarBootWindows();
                        } else if (item.action === "exit") {
                            if (confirm("Sair sem salvar as alterações?")) {
                                sessionStorage.removeItem("cmos_bios_data");
                                iniciarBootWindows();
                            }
                        } else if (item.action === "defaults") {
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
                } else {
                    iniciarBootWindows();
                }
                break;
        }

        renderBIOSScreen();
    }
});

iniciarPOST();