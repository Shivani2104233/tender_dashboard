// script.js - advanced dashboard behavior
(() => {
  // Utilities
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const formatCurrency = v => v?.toLocaleString('en-IN');

  // Elements
  const body = document.body;
  const tenderBody = $('#tenderBody');
  const searchInput = $('#searchInput');
  const clearSearch = $('#clearSearch');
  const statusFilter = $('#statusFilter');
  const sortSelect = $('#sortSelect');
  const pageSizeSel = $('#pageSize');
  const pagination = $('#pagination');
  const newTenderBtn = $('#newTenderBtn');
  const modal = $('#modal');
  const modalTitle = $('#modalTitle');
  const tenderForm = $('#tenderForm');
  const cancelBtn = $('#cancelBtn');
  const chartToggle = $('#chartToggle');
  const chartsSection = $('#charts');
  const exportBtn = $('#exportBtn');
  const importBtn = $('#importBtn');
  const csvFile = $('#csvFile');
  const darkModeToggle = $('#darkModeToggle');
  const buildTime = $('#buildTime');

  // Chart
  let statusChart;

  // State
  let data = [];
  let filtered = [];
  let currentPage = 1;

  // Init: load from localStorage or from data.js default
  function loadData() {
    const raw = localStorage.getItem('tenders_v1');
    if (raw) {
      try { data = JSON.parse(raw); } catch { data = tenders.slice(); }
    } else {
      data = (typeof tenders !== 'undefined') ? JSON.parse(JSON.stringify(tenders)) : [];
      saveData();
    }
  }

  function saveData() {
    localStorage.setItem('tenders_v1', JSON.stringify(data));
    refreshStats();
  }

  // Helpers
  function getStatusClass(s) {
    if (!s) return 'gray';
    const map = {
      'Submitted':'green', 'Pending':'yellow', 'Missing Docs':'red', 'Draft':'gray', 'Awarded':'green'
    };
    return map[s] || 'gray';
  }

  function renderRow(t) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${t.name}</strong><div class="muted" style="font-size:12px;margin-top:6px;color:#6b7280">${t.id}</div></td>
      <td><span class="status ${getStatusClass(t.status)}">${t.status}</span></td>
      <td>₹ ${formatCurrency(t.value)}</td>
      <td>${t.deadline || '-'}</td>
      <td>${t.org || '-'}</td>
      <td>${t.qty ?? '-'}</td>
      <td>${t.dept1 || '-'}${t.dept2 ? ' / ' + t.dept2 : ''}</td>
      <td>
        <button class="action-btn" data-edit="${t.id}" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="action-btn" data-copy="${t.id}" title="Clone"><i class="fa-solid fa-copy"></i></button>
        <button class="action-btn" data-delete="${t.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    return tr;
  }

  // Pagination helpers
  function paginate(list) {
    const pageSize = Number(pageSizeSel.value) || 10;
    const pages = Math.max(1, Math.ceil(list.length / pageSize));
    currentPage = Math.min(currentPage, pages);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    renderPagination(pages);
    return list.slice(start, end);
  }

  function renderPagination(totalPages) {
    pagination.innerHTML = '';
    if (totalPages <= 1) return;
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = 'page-btn';
      if (i === currentPage) btn.style.fontWeight = '700';
      btn.addEventListener('click', () => { currentPage = i; updateTable(); });
      pagination.appendChild(btn);
    }
  }

  // Filters & sorts
  function applyFiltersAndSort() {
    const q = (searchInput.value || '').trim().toLowerCase();
    const status = statusFilter.value;
    filtered = data.filter(t => {
      const matchesQ = !q || [t.name, t.id, t.org, t.note].join(' ').toLowerCase().includes(q);
      const matchesStatus = (status === 'All') || (t.status === status);
      return matchesQ && matchesStatus;
    });

    // Sorting
    const sort = sortSelect.value;
    const [key, dir] = sort.split('-');
    filtered.sort((a,b) => {
      if (key === 'deadline') {
        const da = a.deadline ? new Date(a.deadline) : new Date(8640000000000000);
        const db = b.deadline ? new Date(b.deadline) : new Date(8640000000000000);
        return dir === 'asc' ? da - db : db - da;
      }
      if (key === 'value') {
        return dir === 'asc' ? a.value - b.value : b.value - a.value;
      }
      if (key === 'name') {
        return dir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      return 0;
    });
  }

  // Render table
  function updateTable() {
    applyFiltersAndSort();
    tenderBody.innerHTML = '';
    const page = paginate(filtered);
    page.forEach(t => tenderBody.appendChild(renderRow(t)));
    attachRowEvents();
    updateChart();
    refreshStats();
  }

  // Attach edit/delete/clone listeners
  function attachRowEvents() {
    $$('[data-delete]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.delete;
        if (confirm('Delete tender ' + id + ' ?')) {
          data = data.filter(x => x.id !== id);
          saveData();
          updateTable();
        }
      };
    });

    $$('[data-edit]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.edit;
        openModal('Edit Tender', data.find(x => x.id === id));
      };
    });

    $$('[data-copy]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.copy;
        const item = data.find(x => x.id === id);
        const clone = JSON.parse(JSON.stringify(item));
        clone.id = generateId();
        clone.name = clone.name + ' (clone)';
        data.unshift(clone);
        saveData();
        updateTable();
      };
    });
  }

  // Modal
  function openModal(title = 'Add Tender', item = null) {
    modalTitle.textContent = title;
    modal.classList.remove('hidden');
    body.style.overflow = 'hidden';

    tenderForm.id.value = item?.id ?? generateId();
    tenderForm.name.value = item?.name ?? '';
    tenderForm.org.value = item?.org ?? '';
    tenderForm.status.value = item?.status ?? 'Submitted';
    tenderForm.value.value = item?.value ?? '';
    tenderForm.qty.value = item?.qty ?? '';
    tenderForm.deadline.value = item?.deadline ?? '';
    tenderForm.dept1.value = item?.dept1 ?? '';
    tenderForm.dept2.value = item?.dept2 ?? '';
    tenderForm.note.value = item?.note ?? '';

    tenderForm.querySelector('[name="id"]').readOnly = !!item;
  }

  function closeModal() {
    modal.classList.add('hidden');
    body.style.overflow = '';
    tenderForm.reset();
    tenderForm.querySelector('[name="id"]').readOnly = false;
  }

  // Form submit
  tenderForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const form = Object.fromEntries(new FormData(tenderForm).entries());
    // normalize
    form.value = Number(form.value) || 0;
    form.qty = Number(form.qty) || 0;
    // if exists update else add
    const existing = data.find(x => x.id === form.id);
    if (existing) {
      Object.assign(existing, form);
    } else {
      data.unshift(form);
    }
    saveData();
    closeModal();
    updateTable();
  });

  cancelBtn.addEventListener('click', closeModal);
  newTenderBtn.addEventListener('click', () => openModal('Add Tender'));

  // Search & filter controls
  searchInput.addEventListener('input', () => { currentPage = 1; updateTable(); });
  clearSearch.addEventListener('click', () => { searchInput.value=''; updateTable(); });

  statusFilter.addEventListener('change', () => { currentPage = 1; updateTable(); });
  sortSelect.addEventListener('change', () => { updateTable(); });
  pageSizeSel.addEventListener('change', () => { currentPage = 1; updateTable(); });

  // CSV export/import
  exportBtn.addEventListener('click', () => {
    const csv = toCSV(filtered.length ? filtered : data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tenders_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener('click', () => csvFile.click());
  csvFile.addEventListener('change', handleCSVImport);

  function toCSV(list) {
    const cols = ['id','name','status','value','deadline','org','qty','dept1','dept2','note'];
    const header = cols.join(',') + '\n';
    const rows = list.map(r => cols.map(c => `"${(r[c] ?? '').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
    return header + rows;
  }

  function handleCSVImport(e) {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      parseCSV(text).forEach(row => {
        // require id and name
        if (!row.id || !row.name) return;
        // avoid id duplicates
        if (data.some(x => x.id === row.id)) row.id = generateId();
        row.value = Number(row.value) || 0;
        row.qty = Number(row.qty) || 0;
        data.unshift(row);
      });
      saveData();
      updateTable();
      csvFile.value = '';
    };
    reader.readAsText(f);
  }

  // very simple CSV parser (handles quoted values)
  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    const cols = lines.shift().split(',').map(c => c.trim().replace(/^"|"$/g,''));
    return lines.map(line => {
      const values = [];
      let cur = '', inQ = false;
      for (let i=0;i<line.length;i++){
        const ch = line[i];
        if (ch === '"' && line[i+1] === '"') { cur += '"'; i++; continue; }
        if (ch === '"') { inQ = !inQ; continue; }
        if (ch === ',' && !inQ) { values.push(cur); cur=''; continue; }
        cur += ch;
      }
      values.push(cur);
      const obj = {};
      cols.forEach((c,i)=> obj[c] = (values[i] ?? '').trim().replace(/^"|"$/g,''));
      return obj;
    });
  }

  // Chart
  function updateChart() {
    if (!statusChart) {
      const ctx = $('#statusChart').getContext('2d');
      statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: [], datasets: [{ data: [], backgroundColor: ['#2ebf7f','#ffb020','#ef4444','#6b7280'] }] },
        options: { responsive:true, plugins:{legend:{position:'bottom'}}}
      });
    }
    const counts = { Submitted:0, Pending:0, 'Missing Docs':0, Draft:0, Awarded:0 };
    (filtered.length?filtered:data).forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; else counts.Draft++ });
    const labels = Object.keys(counts);
    const values = Object.values(counts);
    statusChart.data.labels = labels;
    statusChart.data.datasets[0].data = values;
    statusChart.update();
  }

  // Quick stats
  function refreshStats() {
    $('#totalTenders').textContent = data.length;
    $('#submittedCount').textContent = data.filter(x=>x.status==='Submitted').length;
    $('#pendingCount').textContent = data.filter(x=>x.status==='Pending').length;
    $('#awardCount').textContent = data.filter(x=>x.status==='Awarded').length;
  }

  // Dark mode
  function setDarkMode(on){
    if(on) {
      document.documentElement.style.setProperty('--bg','#051923');
      document.documentElement.style.setProperty('--card','#071426');
      body.classList.add('dark');
      localStorage.setItem('tender_dark','1');
    } else {
      document.documentElement.style.removeProperty('--bg');
      document.documentElement.style.removeProperty('--card');
      body.classList.remove('dark');
      localStorage.removeItem('tender_dark');
    }
  }
  darkModeToggle.addEventListener('click', () => setDarkMode(!body.classList.contains('dark')));
  if (localStorage.getItem('tender_dark')) setDarkMode(true);

  // Chart toggle
  chartToggle.addEventListener('click', () => chartsSection.classList.toggle('hidden'));

  // small helpers
  function generateId(){
    return 'T' + Math.random().toString(36).slice(2,8).toUpperCase();
  }

  // Build timestamp
  buildTime.textContent = new Date().toLocaleString();

  // Initialize
  function init(){
    loadData();
    applyFiltersAndSort();
    updateTable();
    // global row click handlers
    document.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // init
  init();

  // Expose some debug to window for console tinkering
  window.tenderApp = { data, refresh: updateTable, reset: () => { localStorage.removeItem('tenders_v1'); location.reload(); } };
})();
