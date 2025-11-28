// You can edit this data anytime
const tenders = [
    { name: "Chennai AAI Tender", status: "Submitted", value: "21,57,331", deadline: "2025-01-05" },
    { name: "Railway Rajkot Tender", status: "Pending", value: "16,20,000", deadline: "2025-02-10" },
    { name: "IOCL Panipat Tender", status: "Missing Docs", value: "12,00,000", deadline: "2025-01-20" }
];

// Mapping status → color
function getStatusClass(status) {
    if (status === "Submitted") return "green";
    if (status === "Pending") return "yellow";
    if (status === "Missing Docs") return "red";
    return "";
}

function loadTable() {
    const tbody = document.getElementById("tenderBody");

    tenders.forEach(t => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${t.name}</td>
            <td><span class="status ${getStatusClass(t.status)}">${t.status}</span></td>
            <td>${t.value}</td>
            <td>${t.deadline}</td>
        `;

        tbody.appendChild(row);
    });
}

loadTable();
