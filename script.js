
// Tender Dashboard Script
const sampleData = [
  {
    tenderNo: "NFL/PT/Electrical/446/2025-26",
    organization: "NFL Panipat",
    place: "Panipat",
    estimatedValue: 2157331,
    bidDeadline: "2025-07-15",
    status: "Pending"
  },
  {
    tenderNo: "AAI/CH/2025/001",
    organization: "AAI Chennai",
    place: "Chennai",
    estimatedValue: 5000000,
    bidDeadline: "2025-08-01",
    status: "Submitted"
  },
  {
    tenderNo: "IOCL/PNP/2025/02",
    organization: "IOCL Panipat",
    place: "Panipat",
    estimatedValue: 1250000,
    bidDeadline: "2025-06-20",
    status: "Awarded"
  },
  {
    tenderNo: "GEM/2025/123",
    organization: "Powergrid",
    place: "Rajkot",
    estimatedValue: 750000,
    bidDeadline: "2025-09-12",
    status: "Rejected"
  }
];

const STORAGE_KEY = "tender_dashboard_data_v1";

let tenders = [];

const el = (sel) => document.querySelector(sel);
const elAll = (sel) => Array.from(document.querySelectorAll(sel));

function loadData(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try{
      tenders = JSON.parse(raw);
      return;
    }catch(e){}
  }
  tenders = sampleData.slice();
  saveData();
}

function saveData(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tenders));
}

function formatNumber(n){
  return n===undefined||n===null||n===""? "": Number(n).toLocaleString();
}

function renderTable(){
  const tbody = el("#tenderTable tbody");
  tbody.innerHTML = "";
  const filter = el("#statusFilter").value;
  const q = el("#searchInput").value.trim().toLowerCase();
  tenders.forEach((t,i)=>{
    if(filter !== "All" && t.status !== filter) return;
    if(q){
      const hay = (t.tenderNo+" "+t.organization+" "+t.place).toLowerCase();
      if(!hay.includes(q)) return;
    }
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.tenderNo}</td>
      <td>${t.organization}</td>
      <td>${t.place || ""}</td>
      <td>${formatNumber(t.estimatedValue)}</td>
      <td>${t.bidDeadline || ""}</td>
      <td><span class="status-chip status-${t.status}">${t.status}</span></td>
      <td class="table-actions">
        <button data-i="${i}" class="edit">Edit</button>
        <button data-i="${i}" class="delete">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  attachRowListeners();
  updateCharts();
}

function attachRowListeners(){
  elAll(".edit").forEach(btn=>{
    btn.onclick = (e)=>{
      const idx = Number(btn.dataset.i);
      openForm("edit", idx);
    }
  });
  elAll(".delete").forEach(btn=>{
    btn.onclick = (e)=>{
      const idx = Number(btn.dataset.i);
      if(confirm("Delete this tender?")){ tenders.splice(idx,1); saveData(); renderTable(); }
    }
  });
}

function openForm(mode="add", idx){
  const panel = el("#formPanel");
  panel.setAttribute("aria-hidden","false");
  el("#formTitle").textContent = mode==="add" ? "Add Tender" : "Edit Tender";
  const form = el("#tenderForm");
  if(mode==="edit"){
    const t = tenders[idx];
    form.tenderNo.value = t.tenderNo;
    form.organization.value = t.organization;
    form.place.value = t.place || "";
    form.estimatedValue.value = t.estimatedValue || "";
    form.bidDeadline.value = t.bidDeadline || "";
    form.status.value = t.status || "Pending";
    form.dataset.editIndex = idx;
  }else{
    form.reset();
    delete form.dataset.editIndex;
  }
}

function closeForm(){
  const panel = el("#formPanel");
  panel.setAttribute("aria-hidden","true");
  const form = el("#tenderForm");
  form.reset();
  delete form.dataset.editIndex;
}

function initForm(){
  const form = el("#tenderForm");
  form.onsubmit = (ev)=>{
    ev.preventDefault();
    const data = {
      tenderNo: form.tenderNo.value.trim(),
      organization: form.organization.value.trim(),
      place: form.place.value.trim(),
      estimatedValue: form.estimatedValue.value ? Number(form.estimatedValue.value) : "",
      bidDeadline: form.bidDeadline.value,
      status: form.status.value
    };
    if(form.dataset.editIndex!==undefined){
      tenders[Number(form.dataset.editIndex)] = data;
    }else{
      tenders.unshift(data);
    }
    saveData();
    renderTable();
    closeForm();
  };
  el("#cancelForm").onclick = (e)=>{ closeForm(); };
}

function setupFilters(){
  el("#statusFilter").onchange = renderTable;
  el("#searchInput").oninput = renderTable;
  el("#openForm").onclick = ()=>openForm("add");
  el("#resetSample").onclick = ()=>{ if(confirm("Reset to sample data? This will overwrite current data.")){ tenders = sampleData.slice(); saveData(); renderTable(); } };
  el("#downloadCsv").onclick = downloadCsv;
}

function downloadCsv(){
  const rows = [["Tender No","Organization","Place","Estimated Value","Bid Deadline","Status"]];
  tenders.forEach(t=> rows.push([t.tenderNo,t.organization,t.place,t.estimatedValue,t.bidDeadline,t.status]));
  const csv = rows.map(r=> r.map(cell=> \`"\${String(cell).replace(/"/g,'""')}"\`).join(",")).join("\n");
  const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "tenders.csv"; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

/* Charts */
let pieChart, barChart;
function updateCharts(){
  const counts = {Pending:0,Submitted:0,Awarded:0,Rejected:0};
  const valueByOrg = {};
  tenders.forEach(t=>{
    counts[t.status] = (counts[t.status] || 0) + 1;
    if(t.organization){
      valueByOrg[t.organization] = (valueByOrg[t.organization] || 0) + (Number(t.estimatedValue) || 0);
    }
  });
  const pieData = {
    labels: Object.keys(counts),
    datasets: [{ data: Object.values(counts) }]
  };
  if(pieChart){
    pieChart.data = pieData; pieChart.update();
  }else{
    const ctx = document.getElementById('statusPie').getContext('2d');
    pieChart = new Chart(ctx, { type: 'pie', data: pieData, options: {plugins:{legend:{position:'bottom'}}}});
  }
  const barData = {
    labels: Object.keys(valueByOrg),
    datasets: [{ label: 'Estimated Value', data: Object.values(valueByOrg) }]
  };
  if(barChart){
    barChart.data = barData; barChart.update();
  }else{
    const ctx2 = document.getElementById('valueBar').getContext('2d');
    barChart = new Chart(ctx2, { type: 'bar', data: barData, options: {plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}}}});
  }
}

/* Init */
document.addEventListener('DOMContentLoaded', ()=>{
  loadData();
  initForm();
  setupFilters();
  renderTable();
});
