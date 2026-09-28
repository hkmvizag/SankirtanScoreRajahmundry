// 🗓 Show today's date in the badge immediately on page load
function setTodayBadge() {
  const el = document.getElementById("dateBadge");
  if (!el) return;
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  el.textContent = `${dd}/${mm}/${yyyy}`;
}
setTodayBadge();

function formatDisplayTimestamp(dateObj) {
  const pad = (num) => String(num).padStart(2, "0");
  const dd = pad(dateObj.getDate());
  const mm = pad(dateObj.getMonth() + 1);
  const yyyy = dateObj.getFullYear();
  let hours = dateObj.getHours();
  const minutes = pad(dateObj.getMinutes());
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours === 0 ? 12 : hours;
  return `${dd}/${mm}/${yyyy}, ${hours}:${minutes} ${ampm}`;
}

function updateTimestamp() {
  const stampEl = document.getElementById("downloadTimestamp");
  if (!stampEl) return;
  stampEl.textContent = `Last Updated: ${formatDisplayTimestamp(new Date())}`;
}

function setLoading(isLoading) {
  const output = document.getElementById("output");
  if (!output) return;
  if (isLoading) {
    output.innerHTML = `
      <div class="loading-wrap">
        <div class="spinner" aria-hidden="true"></div>
        <div class="loading-text">Loading data...</div>
      </div>`;
  }
}


// 🔐 Airtable Config
const API_KEY = "pat2S4Xi8qzIJieHT.617470335bb46cef0b40c143955f620d61ffae47e40391610ba4a943b2a20441";
const BASE_ID = "app8eDDB6dLb2zYBu";
const LLP_TABLE = "tblACfMsAiaAthCzI";
const BM_TABLE = "tbluv0sbdAXERUVpP";

const AIRTABLE_LLP_URL = `https://api.airtable.com/v0/${BASE_ID}/${LLP_TABLE}?view=viwkT0wO9GWKCH5Kq`;
const AIRTABLE_BM_URL = `https://api.airtable.com/v0/${BASE_ID}/${BM_TABLE}?view=viw78MpUWkySbCpSi`;

async function fetchAllRecords(url) {
  let records = [];
  let offset = null;
  do {
    const separator = url.includes("?") ? "&" : "?";
    const fetchUrl = offset ? `${url}${separator}offset=${offset}` : url;
    const res = await fetch(fetchUrl, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data = await res.json();
    if (!res.ok || !data.records) {
      throw new Error(data.error?.message || "Failed to fetch table.");
    }
    records = records.concat(data.records);
    offset = data.offset;
  } while (offset);
  return records;
}

function getVal(val) {
  if (Array.isArray(val)) return val[0] !== undefined ? val[0] : "";
  return val !== undefined && val !== null ? val : "";
}

// 🔹 Fetch Airtable Data
async function fetchData() {
  try {
    setLoading(true);

    const [llpRecords, bmRecords] = await Promise.all([
      fetchAllRecords(AIRTABLE_LLP_URL),
      fetchAllRecords(AIRTABLE_BM_URL)
    ]);

    renderTables(llpRecords, bmRecords);
    updateTimestamp();
  } catch (err) {
    document.getElementById("output").innerHTML = "Error loading data: " + err.message;
    console.error(err);
  }
}

// 🔹 Helper: extract & format date from records
function getTableDate(records) {
  const rec = records.find(r => r.fields["Date"]);
  if (!rec) return "";
  const raw = Array.isArray(rec.fields["Date"]) ? rec.fields["Date"][0] : rec.fields["Date"];
  if (!raw) return "";
  // raw is YYYY-MM-DD
  const [yyyy, mm, dd] = raw.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

// 🔹 Render UI
function renderTables(llpRecords, bmRecords) {
  let html = "";

  const llpDate = getTableDate(llpRecords);
  const bmDate = getTableDate(bmRecords);

  // Render LLP Table
  html += `
    <h3 class="table-title">LLP Report</h3>
    <div class="results-card" style="margin-bottom: 40px;">
      <table class="results-table llp-table">
        <thead>
          <tr>
            <th>Devotee</th>
            <th>Contacts</th>
            <th>Laxmi Points</th>
          </tr>
        </thead>
        <tbody>
  `;

  let llpContactsTotal = 0;
  let llpLaxmiTotal = 0;

  llpRecords.forEach(r => {
    const devotee = getVal(r.fields["Devotee"]);
    const contacts = Number(r.fields["Contacts"]) || 0;
    const laxmi = Number(r.fields["Laxmi Points"]) || 0;

    llpContactsTotal += contacts;
    llpLaxmiTotal += laxmi;

    html += `
      <tr>
        <td>${devotee}</td>
        <td>${contacts}</td>
        <td>${laxmi}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td>Total</td>
            <td>${llpContactsTotal}</td>
            <td>${llpLaxmiTotal}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  // Render BM Table
  html += `
    <h3 class="table-title">Book Distribution Report</h3>
    <div class="results-card">
      <table class="results-table">
        <thead>
          <tr>
            <th>Devotee</th>
            <th>Book Points</th>
            <th>Sales Points</th>
          </tr>
        </thead>
        <tbody>
  `;

  let bmBookTotal = 0;
  let bmSalesTotal = 0;

  bmRecords.forEach(r => {
    const devotee = getVal(r.fields["Devotee"]);
    const bookPoints = Number(r.fields["Book Points"]) || 0;
    const salesPoints = Number(r.fields["Sales Points"]) || 0;

    bmBookTotal += bookPoints;
    bmSalesTotal += salesPoints;

    html += `
      <tr>
        <td>${devotee}</td>
        <td>${bookPoints}</td>
        <td>${salesPoints}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td>Total</td>
            <td>${bmBookTotal}</td>
            <td>${bmSalesTotal}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;

  document.getElementById("output").innerHTML = html;
}

// 🔹 Events
const refreshBtn = document.getElementById("refreshData");
if (refreshBtn) refreshBtn.addEventListener("click", fetchData);

// 🔹 Init
fetchData();
updateTimestamp();
setInterval(updateTimestamp, 60000);
