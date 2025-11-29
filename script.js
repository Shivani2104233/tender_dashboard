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
