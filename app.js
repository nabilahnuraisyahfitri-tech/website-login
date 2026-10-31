/* ============================================================
   PerpusKu — Sistem Informasi Perpustakaan
   Logika aplikasi: CRUD buku & anggota, peminjaman,
   pengembalian, dan perhitungan denda (LocalStorage)
   ============================================================ */
"use strict";

/* ---------- Konstanta & Kunci Penyimpanan ---------- */
const KEY = {
  books: "perpusku_books",
  members: "perpusku_members",
  loans: "perpusku_loans",
  auth: "perpusku_auth",
};
const DENDA_PER_HARI = 500;   // rupiah per buku per hari
const LAMA_PINJAM = 7;        // hari
const MAKS_PINJAM_ANGGOTA = 3;

/* ---------- State ---------- */
const state = {
  books: [],
  members: [],
  loans: [],
  view: "dashboard",
};

/* ---------- Utilitas Umum ---------- */
const $ = (sel) => document.querySelector(sel);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

const rupiah = (n) =>
  "Rp" + new Intl.NumberFormat("id-ID").format(Math.round(n || 0));

const pad = (n) => String(n).padStart(2, "0");
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => isoOf(new Date());
const parseISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return isoOf(d); };
const diffDays = (a, b) => Math.round((parseISO(a) - parseISO(b)) / 86400000);
const fmtDate = (iso) =>
  iso ? parseISO(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

/* ---------- Penyimpanan (LocalStorage) ---------- */
function loadAll() {
  try { state.books = JSON.parse(localStorage.getItem(KEY.books)) || []; } catch { state.books = []; }
  try { state.members = JSON.parse(localStorage.getItem(KEY.members)) || []; } catch { state.members = []; }
  try { state.loans = JSON.parse(localStorage.getItem(KEY.loans)) || []; } catch { state.loans = []; }
}
function saveAll() {
  localStorage.setItem(KEY.books, JSON.stringify(state.books));
  localStorage.setItem(KEY.members, JSON.stringify(state.members));
  localStorage.setItem(KEY.loans, JSON.stringify(state.loans));
}
function seedData() {
  if (localStorage.getItem(KEY.books) === null) {
    state.books = [
      { id: "BK-001", title: "Laskar Pelangi", author: "Andrea Hirata", category: "Novel", year: 2005, stock: 4, available: 4 },
      { id: "BK-002", title: "Bumi Manusia", author: "Pramoedya Ananta Toer", category: "Novel", year: 1980, stock: 3, available: 3 },
      { id: "BK-003", title: "Sejarah Indonesia Modern", author: "M.C. Ricklefs", category: "Sejarah", year: 2008, stock: 2, available: 2 },
      { id: "BK-004", title: "Matematika untuk SMA Kelas XI", author: "B.K. Noormandiri", category: "Pelajaran", year: 2017, stock: 6, available: 6 },
      { id: "BK-005", title: "Encyclopedia of Science", author: "DK Publishing", category: "Ensiklopedia", year: 2015, stock: 2, available: 1 },
      { id: "BK-006", title: "Pemrograman Web dengan HTML & CSS", author: "Julie C. Meloni", category: "Teknologi", year: 2019, stock: 3, available: 2 },
      { id: "BK-007", title: "Ayat-Ayat Cinta", author: "Habiburrahman El Shirazy", category: "Novel", year: 2004, stock: 3, available: 3 },
      { id: "BK-008", title: "Kamus Besar Bahasa Indonesia", author: "Badan Bahasa", category: "Kamus", year: 2016, stock: 4, available: 4 },
      { id: "BK-009", title: "Fisika Dasar Jilid 1", author: "Halliday & Resnick", category: "Pelajaran", year: 2014, stock: 3, available: 1 },
      { id: "BK-010", title: "Negeri 5 Menara", author: "A. Fuadi", category: "Novel", year: 2009, stock: 2, available: 2 },
    ];
    localStorage.setItem(KEY.books, JSON.stringify(state.books));
  }
  if (localStorage.getItem(KEY.members) === null) {
    state.members = [
      { id: "AGT-001", name: "Siti Nurhaliza", status: "Siswa XI IPA 1", phone: "0812-3456-7801", joinedAt: "2025-07-15" },
      { id: "AGT-002", name: "Budi Santoso", status: "Siswa XI IPS 2", phone: "0812-3456-7802", joinedAt: "2025-07-15" },
      { id: "AGT-003", name: "Dewi Lestari", status: "Siswa X IPA 3", phone: "0812-3456-7803", joinedAt: "2025-08-02" },
      { id: "AGT-004", name: "Ahmad Fauzi", status: "Siswa XII IPA 1", phone: "0812-3456-7804", joinedAt: "2025-08-20" },
      { id: "AGT-005", name: "Rina Marlina", status: "Guru Bahasa Indonesia", phone: "0812-3456-7805", joinedAt: "2025-08-25" },
    ];
    localStorage.setItem(KEY.members, JSON.stringify(state.members));
  }
  if (localStorage.getItem(KEY.loans) === null) {
    const t = todayISO();
    state.loans = [
      { id: "PNJ-001", bookId: "BK-005", memberId: "AGT-001", borrowDate: addDays(t, -12), dueDate: addDays(t, -5), returnDate: null, fine: 0 },
      { id: "PNJ-002", bookId: "BK-006", memberId: "AGT-002", borrowDate: addDays(t, -3), dueDate: addDays(t, 4), returnDate: null, fine: 0 },
      { id: "PNJ-003", bookId: "BK-009", memberId: "AGT-004", borrowDate: addDays(t, -1), dueDate: addDays(t, 6), returnDate: null, fine: 0 },
      { id: "PNJ-004", bookId: "BK-001", memberId: "AGT-003", borrowDate: addDays(t, -20), dueDate: addDays(t, -13), returnDate: addDays(t, -10), fine: 3000 },
    ];
    // Sesuaikan ketersediaan stok dengan pinjaman aktif
    state.books.forEach((b) => {
      b.available = b.stock - state.loans.filter((l) => l.bookId === b.id && !l.returnDate).length;
    });
    localStorage.setItem(KEY.loans, JSON.stringify(state.loans));
    localStorage.setItem(KEY.books, JSON.stringify(state.books));
  }
}

/* ---------- ID Berurutan ---------- */
function nextId(list, prefix) {
  let max = 0;
  list.forEach((it) => {
    const m = String(it.id).match(/(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

/* ---------- Referensi Cepat ---------- */
const bookById = (id) => state.books.find((b) => b.id === id);
const memberById = (id) => state.members.find((m) => m.id === id);
const activeLoansOf = (memberId) => state.loans.filter((l) => l.memberId === memberId && !l.returnDate);

/* Status peminjaman & denda */
function loanInfo(loan) {
  if (loan.returnDate) {
    const late = Math.max(0, diffDays(loan.returnDate, loan.dueDate));
    return { done: true, late, fine: loan.fine || late * DENDA_PER_HARI, label: "Selesai" };
  }
  const late = Math.max(0, diffDays(todayISO(), loan.dueDate));
  return {
    done: false, late,
    fine: late * DENDA_PER_HARI,
    label: late > 0 ? `Terlambat ${late} hari` : "Aktif",
  };
}

/* ---------- Toast ---------- */
function toast(msg, type = "ok") {
  const el = document.createElement("div");
  el.className = "toast" + (type === "err" ? " err" : "");
  el.textContent = msg;
  $("#toast-wrap").appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .3s"; }, 2600);
  setTimeout(() => el.remove(), 3000);
}

/* ---------- Modal ---------- */
let modalSubmit = null;
function openModal({ title, body, submitText, onSubmit, danger }) {
  $("#modal-title").textContent = title;
  $("#modal-body").innerHTML = body;
  $("#modal-foot").innerHTML = "";
  const cancel = document.createElement("button");
  cancel.className = "btn btn-outline";
  cancel.textContent = "Batal";
  cancel.onclick = closeModal;
  const ok = document.createElement("button");
  ok.className = "btn " + (danger ? "btn-danger" : "btn-gold");
  ok.textContent = submitText || "Simpan";
  ok.onclick = () => { if (modalSubmit) modalSubmit(); };
  $("#modal-foot").append(cancel, ok);
  modalSubmit = onSubmit || null;
  $("#modal-overlay").classList.remove("hidden");
}
function closeModal() {
  $("#modal-overlay").classList.add("hidden");
  modalSubmit = null;
}

/* Helper membaca nilai form modal */
const fv = (id) => ($("#" + id)?.value || "").trim();

/* ============================================================
   RENDER: NAVIGASI
   ============================================================ */
const VIEW_META = {
  dashboard: { title: "Dashboard", sub: "Ringkasan aktivitas perpustakaan" },
  buku: { title: "Katalog Buku", sub: "Kelola koleksi dan stok buku" },
  anggota: { title: "Data Anggota", sub: "Kelola keanggotaan perpustakaan" },
  pinjam: { title: "Peminjaman", sub: "Catat peminjaman buku oleh anggota" },
  kembali: { title: "Pengembalian", sub: "Proses pengembalian dan hitung denda" },
  riwayat: { title: "Riwayat & Denda", sub: "Seluruh transaksi peminjaman" },
};

function switchView(view) {
  state.view = view;
  document.querySelectorAll(".nav-item").forEach((b) =>
    b.classList.toggle("active", b.dataset.view === view));
  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  $("#view-" + view).classList.remove("hidden");
  $("#page-title").textContent = VIEW_META[view].title;
  $("#page-sub").textContent = VIEW_META[view].sub;
  renderView(view);
}
function renderView(view) {
  if (view === "dashboard") renderDashboard();
  if (view === "buku") renderBooks();
  if (view === "anggota") renderMembers();
  if (view === "pinjam") renderLoans();
  if (view === "kembali") renderReturns();
  if (view === "riwayat") renderHistory();
}

/* ============================================================
   RENDER: DASHBOARD
   ============================================================ */
function renderDashboard() {
  const totalEksemplar = state.books.reduce((s, b) => s + b.stock, 0);
  const aktif = state.loans.filter((l) => !l.returnDate).length;
  const terlambat = state.loans.filter((l) => !l.returnDate && loanInfo(l).late > 0).length;
  const dendaTotal = state.loans.reduce((s, l) => s + (loanInfo(l).fine || 0), 0);

  $("#stat-grid").innerHTML = `
    ${statCard(state.books.length, "Judul Buku")}
    ${statCard(totalEksemplar, "Total Eksemplar")}
    ${statCard(state.members.length, "Anggota Terdaftar")}
    ${statCard(aktif, "Peminjaman Aktif", aktif > 0 ? "" : "warn")}
    ${statCard(terlambat, "Melewati Jatuh Tempo", terlambat > 0 ? "warn" : "")}`;

  const recent = [...state.loans].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);
  $("#dash-recent").innerHTML = recent.length ? `
    <table><thead><tr><th>Kode</th><th>Buku</th><th>Anggota</th><th>Jatuh Tempo</th><th>Status</th></tr></thead>
    <tbody>${recent.map((l) => {
      const b = bookById(l.bookId), m = memberById(l.memberId), info = loanInfo(l);
      return `<tr><td class="kode">${l.id}</td>
        <td><span class="judul">${esc(b ? b.title : "-")}</span></td>
        <td>${esc(m ? m.name : "-")}</td>
        <td>${fmtDate(l.dueDate)}</td>
        <td>${statusBadge(info, l)}</td></tr>`;
    }).join("")}</tbody></table>` : emptyBox("Belum ada transaksi peminjaman.");

  const low = state.books.filter((b) => b.available <= 1)
    .sort((a, b) => a.available - b.available).slice(0, 5);
  $("#dash-lowstock").innerHTML = low.length ? `
    <table><thead><tr><th>Kode</th><th>Judul</th><th>Stok</th><th>Tersedia</th></tr></thead>
    <tbody>${low.map((b) => `
      <tr><td class="kode">${b.id}</td>
      <td><span class="judul">${esc(b.title)}</span><br><span class="sub">${esc(b.author)}</span></td>
      <td>${b.stock}</td>
      <td><span class="badge ${b.available === 0 ? "late" : "ok"}">${b.available} eksemplar</span></td></tr>`).join("")}
    </tbody></table>` : emptyBox("Semua stok buku dalam kondisi baik.");
}
const statCard = (num, label, extra = "") =>
  `<div class="stat-card ${extra}"><div class="stat-num">${num}</div><div class="stat-label">${label}</div></div>`;
const emptyBox = (msg) => `<div class="empty">${msg}</div>`;
function statusBadge(info, loan) {
  if (info.done) return `<span class="badge done">Selesai &middot; ${fmtDate(loan.returnDate)}</span>`;
  if (info.late > 0) return `<span class="badge late">${info.label}</span>`;
  return `<span class="badge ok">Aktif</span>`;
}

/* ============================================================
   RENDER & AKSI: KATALOG BUKU
   ============================================================ */
function populateKategori() {
  const kategori = [...new Set(state.books.map((b) => b.category))].sort();
  $("#filter-kategori").innerHTML =
    `<option value="semua">Semua kategori</option>` +
    kategori.map((k) => `<option value="${esc(k)}">${esc(k)}</option>`).join("");
}

function renderBooks() {
  populateKategori();
  const q = ($("#cari-buku").value || "").toLowerCase();
  const kat = $("#filter-kategori").value || "semua";
  const rows = state.books.filter((b) => {
    const okQ = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.id.toLowerCase().includes(q);
    const okK = kat === "semua" || b.category === kat;
    return okQ && okK;
  });

  $("#tabel-buku").innerHTML = rows.length ? `
    <table><thead><tr>
      <th>Kode</th><th>Judul &amp; Pengarang</th><th>Kategori</th><th>Tahun</th>
      <th>Stok</th><th>Tersedia</th><th>Aksi</th></tr></thead>
    <tbody>${rows.map((b) => `
      <tr>
        <td class="kode">${b.id}</td>
        <td><span class="judul">${esc(b.title)}</span><br><span class="sub">${esc(b.author)}</span></td>
        <td><span class="badge cat">${esc(b.category)}</span></td>
        <td>${b.year}</td>
        <td>${b.stock}</td>
        <td><span class="badge ${b.available === 0 ? "late" : "ok"}">${b.available}</span></td>
        <td class="td-actions">
          <button class="btn btn-outline btn-sm" data-edit-buku="${b.id}">Ubah</button>
          <button class="btn btn-danger btn-sm" data-hapus-buku="${b.id}">Hapus</button>
        </td>
      </tr>`).join("")}</tbody></table>` : emptyBox("Tidak ada buku yang cocok dengan pencarian.");

  document.querySelectorAll("[data-edit-buku]").forEach((el) =>
    el.onclick = () => openFormBuku(el.dataset.editBuku));
  document.querySelectorAll("[data-hapus-buku]").forEach((el) =>
    el.onclick = () => hapusBuku(el.dataset.hapusBuku));
}

function openFormBuku(id) {
  const b = id ? bookById(id) : null;
  const dipinjam = b ? b.stock - b.available : 0;
  openModal({
    title: b ? `Ubah Buku — ${b.id}` : "Tambah Buku Baru",
    submitText: b ? "Simpan Perubahan" : "Tambahkan",
    body: `
      ${b ? `<div class="detail-list"><li><span>Kode Buku</span><span>${b.id}</span></li></div>` : ""}
      <div class="field"><label for="f-judul">Judul Buku</label>
        <input class="input" id="f-judul" value="${b ? esc(b.title) : ""}" placeholder="Contoh: Laskar Pelangi" required></div>
      <div class="field"><label for="f-pengarang">Pengarang</label>
        <input class="input" id="f-pengarang" value="${b ? esc(b.author) : ""}" placeholder="Nama pengarang" required></div>
      <div class="field-row">
        <div class="field"><label for="f-kategori">Kategori</label>
          <input class="input" id="f-kategori" value="${b ? esc(b.category) : ""}" placeholder="Novel / Pelajaran / dll." required></div>
        <div class="field"><label for="f-tahun">Tahun Terbit</label>
          <input class="input" id="f-tahun" type="number" min="1900" max="2100" value="${b ? b.year : new Date().getFullYear()}" required></div>
      </div>
      <div class="field"><label for="f-stok">Jumlah Stok (eksemplar)</label>
        <input class="input" id="f-stok" type="number" min="1" value="${b ? b.stock : 1}" required>
        ${b && dipinjam > 0 ? `<p class="field-note">${dipinjam} eksemplar sedang dipinjam, stok tidak boleh kurang dari ${dipinjam}.</p>` : ""}
      </div>`,
    onSubmit: () => {
      const title = fv("f-judul"), author = fv("f-pengarang");
      const category = fv("f-kategori"), year = parseInt(fv("f-tahun"), 10);
      let stock = parseInt(fv("f-stok"), 10);
      if (!title || !author || !category || !year || !stock) return toast("Semua kolom wajib diisi.", "err");
      if (b && stock < dipinjam) return toast(`Stok tidak boleh kurang dari ${dipinjam} (sedang dipinjam).`, "err");
      if (b) {
        b.title = title; b.author = author; b.category = category; b.year = year;
        b.available = b.available + (stock - b.stock); b.stock = stock;
        toast(`Buku "${title}" berhasil diperbarui.`);
      } else {
        state.books.push({ id: nextId(state.books, "BK"), title, author, category, year, stock, available: stock });
        toast(`Buku "${title}" berhasil ditambahkan.`);
      }
      saveAll(); closeModal(); renderBooks();
    },
  });
}

function hapusBuku(id) {
  const b = bookById(id);
  const aktif = state.loans.filter((l) => l.bookId === id && !l.returnDate).length;
  openModal({
    title: "Hapus Buku",
    danger: true, submitText: "Ya, Hapus",
    body: `<p>Yakin ingin menghapus <b>${esc(b.title)}</b> (${b.id})?</p>
      ${aktif > 0 ? `<p class="field-note" style="color:var(--danger)">Buku ini memiliki ${aktif} transaksi peminjaman aktif dan tidak dapat dihapus.</p>` : ""}`,
    onSubmit: () => {
      if (aktif > 0) { toast("Buku tidak dapat dihapus karena masih dipinjam.", "err"); return; }
      state.books = state.books.filter((x) => x.id !== id);
      saveAll(); closeModal(); renderBooks(); toast("Buku berhasil dihapus.");
    },
  });
}

/* ============================================================
   RENDER & AKSI: ANGGOTA
   ============================================================ */
function renderMembers() {
  const q = ($("#cari-anggota").value || "").toLowerCase();
  const rows = state.members.filter((m) =>
    !q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || (m.status || "").toLowerCase().includes(q));

  $("#tabel-anggota").innerHTML = rows.length ? `
    <table><thead><tr>
      <th>Kode</th><th>Nama</th><th>Status / Kelas</th><th>No. HP</th>
      <th>Bergabung</th><th>Pinjaman Aktif</th><th>Aksi</th></tr></thead>
    <tbody>${rows.map((m) => {
      const n = activeLoansOf(m.id).length;
      return `<tr>
        <td class="kode">${m.id}</td>
        <td><span class="judul">${esc(m.name)}</span></td>
        <td>${esc(m.status)}</td>
        <td>${esc(m.phone || "-")}</td>
        <td>${fmtDate(m.joinedAt)}</td>
        <td><span class="badge ${n >= MAKS_PINJAM_ANGGOTA ? "late" : "ok"}">${n} / ${MAKS_PINJAM_ANGGOTA}</span></td>
        <td class="td-actions">
          <button class="btn btn-outline btn-sm" data-edit-anggota="${m.id}">Ubah</button>
          <button class="btn btn-danger btn-sm" data-hapus-anggota="${m.id}">Hapus</button>
        </td></tr>`;
    }).join("")}</tbody></table>` : emptyBox("Tidak ada anggota yang cocok dengan pencarian.");

  document.querySelectorAll("[data-edit-anggota]").forEach((el) =>
    el.onclick = () => openFormAnggota(el.dataset.editAnggota));
  document.querySelectorAll("[data-hapus-anggota]").forEach((el) =>
    el.onclick = () => hapusAnggota(el.dataset.hapusAnggota));
}

function openFormAnggota(id) {
  const m = id ? memberById(id) : null;
  openModal({
    title: m ? `Ubah Anggota — ${m.id}` : "Tambah Anggota Baru",
    submitText: m ? "Simpan Perubahan" : "Tambahkan",
    body: `
      ${m ? `<div class="detail-list"><li><span>Kode Anggota</span><span>${m.id}</span></li></div>` : ""}
      <div class="field"><label for="a-nama">Nama Lengkap</label>
        <input class="input" id="a-nama" value="${m ? esc(m.name) : ""}" placeholder="Nama anggota" required></div>
      <div class="field"><label for="a-status">Status / Kelas</label>
        <input class="input" id="a-status" value="${m ? esc(m.status) : ""}" placeholder="Contoh: Siswa X IPA 1 / Guru" required></div>
      <div class="field"><label for="a-hp">Nomor HP</label>
        <input class="input" id="a-hp" value="${m ? esc(m.phone) : ""}" placeholder="08xx-xxxx-xxxx"></div>`,
    onSubmit: () => {
      const name = fv("a-nama"), status = fv("a-status"), phone = fv("a-hp");
      if (!name || !status) return toast("Nama dan status wajib diisi.", "err");
      if (m) {
        m.name = name; m.status = status; m.phone = phone;
        toast(`Data anggota "${name}" berhasil diperbarui.`);
      } else {
        state.members.push({ id: nextId(state.members, "AGT"), name, status, phone, joinedAt: todayISO() });
        toast(`Anggota "${name}" berhasil didaftarkan.`);
      }
      saveAll(); closeModal(); renderMembers();
    },
  });
}

function hapusAnggota(id) {
  const m = memberById(id);
  const aktif = activeLoansOf(id).length;
  openModal({
    title: "Hapus Anggota",
    danger: true, submitText: "Ya, Hapus",
    body: `<p>Yakin ingin menghapus anggota <b>${esc(m.name)}</b> (${m.id})?</p>
      ${aktif > 0 ? `<p class="field-note" style="color:var(--danger)">Anggota masih memiliki ${aktif} pinjaman aktif dan tidak dapat dihapus.</p>` : ""}`,
    onSubmit: () => {
      if (aktif > 0) { toast("Anggota tidak dapat dihapus karena masih memiliki pinjaman.", "err"); return; }
      state.members = state.members.filter((x) => x.id !== id);
      saveAll(); closeModal(); renderMembers(); toast("Anggota berhasil dihapus.");
    },
  });
}

/* ============================================================
   RENDER & AKSI: PEMINJAMAN
   ============================================================ */
function renderLoans() {
  // Isi pilihan anggota
  $("#pinjam-anggota").innerHTML = `<option value="">-- Pilih anggota --</option>` +
    state.members.map((m) => {
      const n = activeLoansOf(m.id).length;
      return `<option value="${m.id}">${esc(m.name)} (${m.id}) — pinjam ${n}/${MAKS_PINJAM_ANGGOTA}</option>`;
    }).join("");

  // Isi pilihan buku
  $("#pinjam-buku").innerHTML = `<option value="">-- Pilih buku --</option>` +
    state.books.map((b) => {
      const teks = `${b.title} (${b.id}) — tersedia ${b.available}`;
      return `<option value="${b.id}" ${b.available === 0 ? "disabled" : ""}>${esc(teks)}</option>`;
    }).join("");

  $("#rule-hari").textContent = LAMA_PINJAM;
  $("#rule-denda").textContent = rupiah(DENDA_PER_HARI);
  $("#pinjam-note").textContent = "Jatuh tempo dihitung otomatis " + LAMA_PINJAM + " hari setelah tanggal pinjam.";

  const aktif = state.loans.filter((l) => !l.returnDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  $("#count-aktif").textContent = `${aktif.length} transaksi aktif`;
  $("#pinjam-stat").innerHTML = `Peminjaman aktif saat ini: <b>${aktif.length}</b> transaksi, dengan <b>${aktif.filter((l) => loanInfo(l).late > 0).length}</b> di antaranya melewati jatuh tempo.`;

  $("#tabel-aktif").innerHTML = aktif.length ? `
    <table><thead><tr>
      <th>Kode</th><th>Buku</th><th>Anggota</th><th>Tgl Pinjam</th><th>Jatuh Tempo</th><th>Status</th><th>Aksi</th></tr></thead>
    <tbody>${aktif.map((l) => {
      const b = bookById(l.bookId), m = memberById(l.memberId), info = loanInfo(l);
      return `<tr>
        <td class="kode">${l.id}</td>
        <td><span class="judul">${esc(b ? b.title : "-")}</span><br><span class="sub">${l.bookId}</span></td>
        <td>${esc(m ? m.name : "-")}<br><span class="sub">${l.memberId}</span></td>
        <td>${fmtDate(l.borrowDate)}</td>
        <td>${fmtDate(l.dueDate)}</td>
        <td>${statusBadge(info, l)}</td>
        <td class="td-actions"><button class="btn btn-brown btn-sm" data-kembalikan="${l.id}">Kembalikan</button></td>
      </tr>`;
    }).join("")}</tbody></table>` : emptyBox("Tidak ada peminjaman aktif saat ini.");

  document.querySelectorAll("[data-kembalikan]").forEach((el) =>
    el.onclick = () => prosesPengembalian(el.dataset.kembalikan));
}

function submitPinjam(ev) {
  ev.preventDefault();
  const memberId = fv("pinjam-anggota"), bookId = fv("pinjam-buku");
  const tgl = fv("pinjam-tanggal");
  if (!memberId || !bookId || !tgl) return toast("Lengkapi semua kolom formulir.", "err");

  const book = bookById(bookId), member = memberById(memberId);
  if (!book || book.available <= 0) return toast("Stok buku tersebut sedang habis.", "err");
  if (activeLoansOf(memberId).length >= MAKS_PINJAM_ANGGOTA)
    return toast(`Anggota sudah mencapai batas maksimal ${MAKS_PINJAM_ANGGOTA} buku.`, "err");

  const loan = {
    id: nextId(state.loans, "PNJ"),
    bookId, memberId,
    borrowDate: tgl,
    dueDate: addDays(tgl, LAMA_PINJAM),
    returnDate: null, fine: 0,
  };
  state.loans.push(loan);
  book.available -= 1;
  saveAll();
  $("#form-pinjam").reset();
  $("#pinjam-tanggal").value = todayISO();
  $("#pinjam-tempo").value = addDays(todayISO(), LAMA_PINJAM);
  renderLoans();
  toast(`Peminjaman ${loan.id} tercatat. Jatuh tempo ${fmtDate(loan.dueDate)}.`);
}

/* ============================================================
   RENDER & AKSI: PENGEMBALIAN
   ============================================================ */
function renderReturns() {
  const aktif = state.loans.filter((l) => !l.returnDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  $("#count-kembali").textContent = `${aktif.length} buku perlu diproses`;

  $("#tabel-kembali").innerHTML = aktif.length ? `
    <table><thead><tr>
      <th>Kode</th><th>Buku</th><th>Anggota</th><th>Jatuh Tempo</th>
      <th>Keterlambatan</th><th>Estimasi Denda</th><th>Aksi</th></tr></thead>
    <tbody>${aktif.map((l) => {
      const b = bookById(l.bookId), m = memberById(l.memberId), info = loanInfo(l);
      return `<tr>
        <td class="kode">${l.id}</td>
        <td><span class="judul">${esc(b ? b.title : "-")}</span><br><span class="sub">${l.bookId}</span></td>
        <td>${esc(m ? m.name : "-")}</td>
        <td>${fmtDate(l.dueDate)}</td>
        <td>${info.late > 0 ? `<span class="badge late">${info.late} hari</span>` : `<span class="badge ok">Tepat waktu</span>`}</td>
        <td>${info.fine > 0 ? `<b style="color:var(--danger)">${rupiah(info.fine)}</b>` : "—"}</td>
        <td class="td-actions"><button class="btn btn-brown btn-sm" data-kembalikan2="${l.id}">Proses Pengembalian</button></td>
      </tr>`;
    }).join("")}</tbody></table>` : emptyBox("Semua buku telah dikembalikan. Tidak ada yang perlu diproses.");

  document.querySelectorAll("[data-kembalikan2]").forEach((el) =>
    el.onclick = () => prosesPengembalian(el.dataset.kembalikan2));
}

function prosesPengembalian(loanId) {
  const loan = state.loans.find((l) => l.id === loanId);
  if (!loan || loan.returnDate) return;
  const b = bookById(loan.bookId), m = memberById(loan.memberId), info = loanInfo(loan);
  const hariIni = todayISO();

  openModal({
    title: `Pengembalian — ${loan.id}`,
    submitText: "Konfirmasi Pengembalian",
    body: `
      <ul class="detail-list">
        <li><span>Judul Buku</span><span>${esc(b ? b.title : "-")}</span></li>
        <li><span>Anggota</span><span>${esc(m ? m.name : "-")}</span></li>
        <li><span>Tanggal Pinjam</span><span>${fmtDate(loan.borrowDate)}</span></li>
        <li><span>Jatuh Tempo</span><span>${fmtDate(loan.dueDate)}</span></li>
        <li><span>Tanggal Kembali</span><span>${fmtDate(hariIni)}</span></li>
        <li><span>Keterlambatan</span><span>${info.late > 0 ? info.late + " hari" : "Tidak terlambat"}</span></li>
      </ul>
      <div class="fine-callout">${info.fine > 0 ? `Denda yang harus dibayar: ${rupiah(info.fine)} (${info.late} hari &times; ${rupiah(DENDA_PER_HARI)})` : "Tidak ada denda — pengembalian tepat waktu."}</div>`,
    onSubmit: () => {
      loan.returnDate = hariIni;
      loan.fine = info.fine;
      if (b) b.available = Math.min(b.stock, b.available + 1);
      saveAll(); closeModal();
      renderView(state.view);
      toast(`Pengembalian ${loan.id} diproses${info.fine > 0 ? ` dengan denda ${rupiah(info.fine)}.` : "."}`);
    },
  });
}

/* ============================================================
   RENDER: RIWAYAT
   ============================================================ */
function renderHistory() {
  const f = $("#filter-status").value || "semua";
  const rows = [...state.loans]
    .sort((a, b) => b.id.localeCompare(a.id))
    .filter((l) => f === "semua" || (f === "aktif" ? !l.returnDate : !!l.returnDate));
  const dendaTotal = state.loans.reduce((s, l) => s + (loanInfo(l).fine || 0), 0);
  $("#denda-total").innerHTML = `Total denda tercatat: <b>${rupiah(dendaTotal)}</b>`;

  $("#tabel-riwayat").innerHTML = rows.length ? `
    <table><thead><tr>
      <th>Kode</th><th>Buku</th><th>Anggota</th><th>Pinjam</th><th>Jatuh Tempo</th>
      <th>Kembali</th><th>Terlambat</th><th>Denda</th><th>Status</th></tr></thead>
    <tbody>${rows.map((l) => {
      const b = bookById(l.bookId), m = memberById(l.memberId), info = loanInfo(l);
      return `<tr>
        <td class="kode">${l.id}</td>
        <td><span class="judul">${esc(b ? b.title : "-")}</span></td>
        <td>${esc(m ? m.name : "-")}</td>
        <td>${fmtDate(l.borrowDate)}</td>
        <td>${fmtDate(l.dueDate)}</td>
        <td>${l.returnDate ? fmtDate(l.returnDate) : "—"}</td>
        <td>${info.late > 0 ? info.late + " hari" : "—"}</td>
        <td>${info.fine > 0 ? `<b>${rupiah(info.fine)}</b>` : "—"}</td>
        <td>${info.done ? `<span class="badge done">Selesai</span>` : (info.late > 0 ? `<span class="badge late">Terlambat</span>` : `<span class="badge ok">Aktif</span>`)}</td>
      </tr>`;
    }).join("")}</tbody></table>` : emptyBox("Belum ada data riwayat untuk filter ini.");
}

/* ============================================================
   LOGIN & INISIALISASI
   ============================================================ */
function login(user, pass) {
  if (user === "admin" && pass === "admin123") {
    sessionStorage.setItem(KEY.auth, "admin");
    masukAplikasi();
    return true;
  }
  return false;
}
function masukAplikasi() {
  loadAll();
  seedData();
  $("#login-screen").classList.add("hidden");
  $("#app").classList.remove("hidden");
  $("#user-name").textContent = sessionStorage.getItem(KEY.auth) || "admin";
  $("#user-ava").textContent = "A";
  $("#topbar-date").textContent = new Date().toLocaleDateString("id-ID",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  $("#pinjam-tanggal").value = todayISO();
  $("#pinjam-tempo").value = addDays(todayISO(), LAMA_PINJAM);
  switchView("dashboard");
}
function logout() {
  sessionStorage.removeItem(KEY.auth);
  $("#app").classList.add("hidden");
  $("#login-screen").classList.remove("hidden");
  $("#login-form").reset();
}

/* ---------- Pasang Event ---------- */
document.addEventListener("DOMContentLoaded", () => {
  $("#login-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    if (!login(fv("login-user"), fv("login-pass")))
      toast("Nama pengguna atau kata sandi salah. Coba admin / admin123.", "err");
  });

  document.querySelectorAll(".nav-item").forEach((b) =>
    b.addEventListener("click", () => switchView(b.dataset.view)));
  document.querySelectorAll("[data-goto]").forEach((b) =>
    b.addEventListener("click", () => switchView(b.dataset.goto)));

  $("#btn-logout").addEventListener("click", logout);
  $("#modal-close").addEventListener("click", closeModal);
  $("#modal-overlay").addEventListener("click", (ev) => {
    if (ev.target === $("#modal-overlay")) closeModal();
  });

  $("#btn-tambah-buku").addEventListener("click", () => openFormBuku(null));
  $("#btn-tambah-anggota").addEventListener("click", () => openFormAnggota(null));
  $("#cari-buku").addEventListener("input", renderBooks);
  $("#filter-kategori").addEventListener("change", renderBooks);
  $("#cari-anggota").addEventListener("input", renderMembers);
  $("#filter-status").addEventListener("change", renderHistory);
  $("#form-pinjam").addEventListener("submit", submitPinjam);
  $("#pinjam-tanggal").addEventListener("change", () => {
    const tgl = fv("pinjam-tanggal") || todayISO();
    $("#pinjam-tempo").value = addDays(tgl, LAMA_PINJAM);
  });

  if (sessionStorage.getItem(KEY.auth)) masukAplikasi();
});
