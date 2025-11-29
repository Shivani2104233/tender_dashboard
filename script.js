function searchTenders() {
    const value = document.getElementById("searchInput").value.toLowerCase();

    const filtered = tenders.filter(t =>
        t.name.toLowerCase().includes(value)
    );

    updateTable(filtered);
}

function filterStatus(status) {
    if (status === "All") updateTable(tenders);
    else updateTable(tenders.filter(t => t.status === status));
}

function updateTable(list) {
    const tbody = document.getElementById("tenderBody");
    tbody.innerHTML = "";

    list.forEach(t => {
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
