// A-IOS demo: authentication and core app features

const CREDENTIALS = {
	superadmin: { password: 'superadmin', role: 'Super Admin' },
	admin: { password: 'admin', role: 'Admin' },
	user: { password: 'user', role: 'User' }
};

// Elements
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginMsg = document.getElementById('login-msg');
const roleLabel = document.getElementById('role-label');
const chatMessagesEl = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-text');
const chatSendBtn = document.getElementById('chat-send');
const adminSidebar = document.getElementById('admin-sidebar');
const adminProfileBtn = document.getElementById('admin-profile');
const adminAchievementBtn = document.getElementById('admin-achievement');
const adminTasklistBtn = document.getElementById('admin-tasklist');
const adminUsersBtn = document.getElementById('admin-users');
const adminLogoutBtn = document.getElementById('admin-logout');
const superadminSidebar = document.getElementById('superadmin-sidebar');
const superadminProfileBtn = document.getElementById('superadmin-profile');
const superadminAchievementBtn = document.getElementById('superadmin-achievement');
const superadminTasklistBtn = document.getElementById('superadmin-tasklist');
const superadminUsersBtn = document.getElementById('superadmin-users');
const superadminDepartemenBtn = document.getElementById('superadmin-departemen');
const superadminPerusahaanBtn = document.getElementById('superadmin-perusahaan');
const superadminPjaBtn = document.getElementById('superadmin-pja');
const superadminLogoutBtn = document.getElementById('superadmin-logout');
const userSidebar = document.getElementById('user-sidebar');
const frontlineLeadershipBtn = document.getElementById('frontline-leadership-btn');
const ohsTalkBtn = document.getElementById('ohs-talk-btn');
const observasiBtn = document.getElementById('observasi-btn');
const userProfileBtn = document.getElementById('user-profile');
const userAchievementBtn = document.getElementById('user-achievement');
const userTasklistBtn = document.getElementById('user-tasklist');
const userLogoutBtn = document.getElementById('user-logout');
// User management elements
const userManagementSection = document.getElementById('user-management');
const addUserBtn = document.getElementById('add-user-btn');
const userSearch = document.getElementById('user-search');
const userListTableBody = document.querySelector('#user-list tbody');
const userForm = document.getElementById('user-form');
const userFormTitle = document.getElementById('user-form-title');
const userIdField = document.getElementById('user-id');
const fields = {
	kategori: document.getElementById('field-kategori'),
	username: document.getElementById('field-username'),
	password: document.getElementById('field-password'),
	nama: document.getElementById('field-nama'),
	tempat: document.getElementById('field-tempat'),
	tgl: document.getElementById('field-tgl'),
	hp: document.getElementById('field-hp'),
	email: document.getElementById('field-email'),
	alamat: document.getElementById('field-alamat'),
	ktp: document.getElementById('field-ktp'),
	karyawan: document.getElementById('field-karyawan'),
	mine: document.getElementById('field-mine'),
	jabatan: document.getElementById('field-jabatan'),
	kelompok: document.getElementById('field-kelompok'),
	departemen: document.getElementById('field-departemen'),
	perusahaan: document.getElementById('field-perusahaan'),
	ccow: document.getElementById('field-ccow')
};
const saveUserBtn = document.getElementById('save-user-btn');
const cancelUserBtn = document.getElementById('cancel-user-btn');
const exportUserBtn = document.getElementById('export-user-btn');

const USER_KEY = 'aios_users';
const PJA_KEY = 'aios_pja';

function isApiReady() {
	return !!(window.AIOSApi && typeof window.AIOSApi.request === 'function' && typeof window.AIOSApi.getToken === 'function' && window.AIOSApi.getToken());
}

function readUsers() {
	try {
		const raw = localStorage.getItem(USER_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch (e) {
		console.error('readUsers', e);
		return [];
	}
}

function writeUsers(list) {
	localStorage.setItem(USER_KEY, JSON.stringify(list));
}

function shouldApplyApiList(localList, apiList, label) {
	if (!Array.isArray(apiList)) return false;
	if (apiList.length === 0 && Array.isArray(localList) && localList.length > 0) {
		console.warn(label + ' sync skipped: API kosong, data lokal dipertahankan.');
		return false;
	}
	return true;
}

function getUserRole(user) {
	if (!user) return 'User';
	return (user.role || user.kategori || 'User').trim();
}

function isPrivilegedRole(role) {
	return role === 'Admin' || role === 'Super Admin';
}

function isProtectedUserForAdmin(user) {
	return !!(currentUser && currentUser.role === 'Admin' && isPrivilegedRole(getUserRole(user)));
}

async function syncUsersFromApi() {
	if (!isApiReady() || !window.AIOSApi.listUsers) return;
	try {
		const users = await window.AIOSApi.listUsers();
		const localUsers = readUsers();
		if (shouldApplyApiList(localUsers, users, 'Users')) writeUsers(users);
	} catch (e) {
		console.warn('syncUsersFromApi failed', e && e.message ? e.message : e);
	}
}

async function syncMasterDataFromApi() {
	await Promise.all([
		syncUsersFromApi(),
		syncDepartmentsFromApi(),
		syncCompaniesFromApi(),
		syncPjaFromApi()
	]);

	const deptSelected = fields && fields.departemen ? fields.departemen.value : '';
	const companySelected = fields && fields.perusahaan ? fields.perusahaan.value : '';
	populateDeptOptions(deptSelected);
	populateCompanyOptions(companySelected);

	if (userListTableBody) renderUserList(userSearch && userSearch.value);
	if (document.getElementById('dept-list')) renderDeptList();
	if (document.getElementById('company-list')) renderCompanyList();
	if (document.querySelector('#pja-list tbody')) renderPJAList();
}

function renderUserList(filter) {
	if (!userListTableBody) return;
	const users = readUsers();
	const q = (filter || '').toLowerCase();
	userListTableBody.innerHTML = '';
	users.filter(u => !q || (u.username && u.username.toLowerCase().includes(q)) || (u.nama && u.nama.toLowerCase().includes(q)) || (u.karyawan && u.karyawan.toLowerCase().includes(q))).forEach(u => {
		const tr = document.createElement('tr');
		const protectedForAdmin = isProtectedUserForAdmin(u);
		const actionHtml = protectedForAdmin
			? '-'
			: `<button class="small edit-user" data-id="${u.id}">Edit</button> <button class="small delete-user" data-id="${u.id}">Hapus</button>`;
		tr.innerHTML = `<td>${u.username||''}</td><td>${u.nama||''}</td><td>${u.karyawan||''}</td><td>${u.departemen||''}</td><td>${u.perusahaan||''}</td><td>${actionHtml}</td>`;
		userListTableBody.appendChild(tr);
	});
}

function excelSafe(value) {
	return String(value == null ? '' : value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function exportRowsToExcel(filePrefix, headers, rows) {
	if (!Array.isArray(rows) || rows.length === 0) {
		alert('Tidak ada data untuk diekspor.');
		return;
	}

	const thead = `<tr>${headers.map((h) => `<th>${excelSafe(h)}</th>`).join('')}</tr>`;
	const tbody = rows.map((row) => `<tr>${row.map((cell) => `<td>${excelSafe(cell)}</td>`).join('')}</tr>`).join('');
	const html = `
		<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
		<head><meta charset="UTF-8"></head>
		<body><table border="1">${thead}${tbody}</table></body>
		</html>
	`;

	const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	const stamp = new Date().toISOString().slice(0, 10);
	a.href = url;
	a.download = `${filePrefix}-${stamp}.xls`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

function exportUserTableToExcel() {
	const users = readUsers();
	const q = (userSearch && userSearch.value ? userSearch.value : '').toLowerCase();
	const filtered = users.filter((u) => !q || (u.username && u.username.toLowerCase().includes(q)) || (u.nama && u.nama.toLowerCase().includes(q)) || (u.karyawan && u.karyawan.toLowerCase().includes(q)));
	const rows = filtered.map((u) => [
		u.username || '',
		u.nama || '',
		u.karyawan || '',
		u.departemen || '',
		u.perusahaan || '',
		u.role || u.kategori || 'User'
	]);
	exportRowsToExcel('daftar-user', ['Username', 'Nama', 'No Karyawan', 'Departemen', 'Perusahaan', 'Role'], rows);
}

function openUserForm(user) {
	try {
		// Verify form exists
		if (!userForm) {
			console.error('Error: userForm not found');
			return alert('Terjadi kesalahan: Form tidak ditemukan.');
		}
		// populate dynamic selects first
		populateDeptOptions();
		populateCompanyOptions();
		populateCcowOptions();

		Promise.all([
			syncDepartmentsFromApi(),
			syncCompaniesFromApi()
		]).then(() => {
			const selectedDept = (user && user.departemen) ? user.departemen : (fields.departemen && fields.departemen.value ? fields.departemen.value : '');
			const selectedCompany = (user && user.perusahaan) ? user.perusahaan : (fields.perusahaan && fields.perusahaan.value ? fields.perusahaan.value : '');
			populateDeptOptions(selectedDept);
			populateCompanyOptions(selectedCompany);
		}).catch((syncErr) => {
			console.warn('openUserForm master sync failed', syncErr && syncErr.message ? syncErr.message : syncErr);
		});

		// Restrict kategori options based on current user role
		if (fields.kategori) {
			const adminOption = fields.kategori.querySelector('option[value="Admin"]');
			const superAdminOption = fields.kategori.querySelector('option[value="Super Admin"]');
			// Admin dan Super Admin dapat membuat semua kategori
			if (adminOption) {
				adminOption.disabled = false;
				adminOption.style.display = '';
			}
			if (superAdminOption) {
				superAdminOption.disabled = false;
				superAdminOption.style.display = '';
			}
		}

		userForm.classList.remove('hidden');
		if (userManagementSection) userManagementSection.scrollIntoView({behavior:'smooth'});
		if (user) {
			userFormTitle.textContent = 'Edit User';
			if (userIdField) userIdField.value = user.id;
			Object.keys(fields).forEach(k => {
				try {
					if (fields[k]) {
						if (k === 'password') {
							fields[k].value = ''; // do not prefill password
						} else {
							fields[k].value = user[k] || '';
						}
					}
				} catch(e){ console.warn('Error setting field ' + k, e); }
			});
		} else {
			userFormTitle.textContent = 'Tambah User';
			if (userIdField) userIdField.value = '';
			Object.keys(fields).forEach(k => { 
				try { 
					if (fields[k]) fields[k].value = ''; 
				} catch(e){ console.warn('Error clearing field ' + k, e); }
			});
		}
	} catch (err) {
		console.error('Error opening user form:', err);
		alert('Terjadi kesalahan membuka form: ' + (err && err.message ? err.message : String(err)));
	}
}

function closeUserForm() {
	try {
		if (userForm) userForm.classList.add('hidden');
		// Clear all fields
		Object.keys(fields).forEach(k => {
			try {
				if (fields[k]) fields[k].value = '';
			} catch(e){}
		});
	} catch (err) {
		console.error('Error closing form:', err);
	}
}

async function saveUserFromForm() {
	try {
		// ensure user-id field exists
		if (!userIdField) {
			console.error('Error: user-id field not found');
			return alert('Terjadi kesalahan: Form field tidak ditemukan. Refresh halaman dan coba lagi.');
		}
		// gather values with validation
		const id = (userIdField.value && userIdField.value.trim()) || `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
		const kategori = (fields.kategori && fields.kategori.value || '').trim();
		const username = (fields.username && fields.username.value || '').trim();
		const password = (fields.password && fields.password.value || '').trim();
		const nama = (fields.nama && fields.nama.value || '').trim();
		const tempat = (fields.tempat && fields.tempat.value || '').trim();
		const tgl = (fields.tgl && fields.tgl.value || '').trim();
		const hp = (fields.hp && fields.hp.value || '').trim();
		const email = (fields.email && fields.email.value || '').trim();
		const alamat = (fields.alamat && fields.alamat.value || '').trim();
		const ktp = (fields.ktp && fields.ktp.value || '').trim();
		const karyawan = (fields.karyawan && fields.karyawan.value || '').trim();
		const mine = (fields.mine && fields.mine.value || '').trim();
		const jabatan = (fields.jabatan && fields.jabatan.value || '').trim();
		const kelompok = (fields.kelompok && fields.kelompok.value || '').trim();
		const departemen = (fields.departemen && fields.departemen.value || '').trim();
		const perusahaan = (fields.perusahaan && fields.perusahaan.value || '').trim();
		const ccow = (fields.ccow && fields.ccow.value || '').trim();

		// SEMUA FIELD WAJIB DIISI
		if (!username) return alert('Username wajib diisi');
		if (!password) return alert('Password wajib diisi');
		if (!kategori) return alert('Kategori wajib dipilih');
		if (!nama) return alert('Nama lengkap wajib diisi');
		if (!tempat) return alert('Tempat lahir wajib diisi');
		if (!tgl) return alert('Tanggal lahir wajib diisi');
		if (!hp) return alert('No HP wajib diisi');
		if (!email) return alert('Alamat email wajib diisi');
		if (!alamat) return alert('Alamat lengkap wajib diisi');
		if (!ktp) return alert('No KTP wajib diisi');
		if (!karyawan) return alert('No Karyawan wajib diisi');
		if (!mine) return alert('No Mine Permit wajib diisi');
		if (!jabatan) return alert('Jabatan wajib diisi');
		if (!kelompok) return alert('Kelompok jabatan wajib diisi');
		if (!departemen) return alert('Departemen wajib dipilih');
		if (!perusahaan) return alert('Perusahaan wajib dipilih');
		if (!ccow) return alert('CCOW wajib dipilih');
		
		// Format validations
		if (!/^[0-9]+$/.test(hp)) return alert('No HP harus berupa angka');
		if (hp.length > 13) return alert('No HP maksimal 13 angka');
		if (!/^[0-9]+$/.test(ktp)) return alert('No KTP harus berupa angka');
		if (ktp.length < 15 || ktp.length > 17) return alert('No KTP harus antara 15 - 17 angka');
		if (!/^\S+@\S+\.\S+$/.test(email)) return alert('Format email tidak valid');
		if (password.length < 8) return alert('Password minimal 8 karakter');
		
		// check duplicate username
		const existingUsers = readUsers();
		const dupUser = existingUsers.find(u => u.username === username && u.id !== id);
		if (dupUser) return alert('Username sudah digunakan');
		if (kategori !== 'Admin' && kategori !== 'User' && kategori !== 'Super Admin') return alert('Pilih Kategori yang valid (Super Admin, Admin, atau User)');
		
		// handle password: for both new and edit users, password is now required
		const list = existingUsers;
		const idx = list.findIndex(x => x.id === id);
		if (idx >= 0 && isProtectedUserForAdmin(list[idx])) {
			return alert('Admin tidak dapat mengubah user dengan role Admin atau Super Admin');
		}
		let user = null;
		if (idx >= 0) {
			// update existing - password is now always updated
			user = Object.assign({}, list[idx]);
			user.kategori = kategori; user.nama = nama; user.tempat = tempat; user.tgl = tgl; user.hp = hp; user.email = email; user.alamat = alamat;
			user.ktp = ktp; user.karyawan = karyawan; user.mine = mine; user.jabatan = jabatan; user.kelompok = kelompok;
			user.departemen = departemen; user.perusahaan = perusahaan; user.ccow = ccow; user.username = username;
			user.password = password; // Always update password
			list[idx] = user;
		} else {
			// new user
			user = { id, username, password, kategori, nama, tempat, tgl, hp, email, alamat, ktp, karyawan, mine, jabatan, kelompok, departemen, perusahaan, ccow };
			list.push(user);
		}
		writeUsers(list);
		if (isApiReady()) {
			try {
				if (idx >= 0 && window.AIOSApi.updateUser) {
					await window.AIOSApi.updateUser(id, user);
				} else if (window.AIOSApi.createUser) {
					await window.AIOSApi.createUser(user);
				}
			} catch (apiErr) {
				console.warn('User API sync failed', apiErr && apiErr.message ? apiErr.message : apiErr);
			}
		}
		renderUserList(userSearch && userSearch.value);
		closeUserForm();
		alert('User berhasil disimpan!');
	} catch (err) {
		console.error('Error saving user:', err);
		alert('Terjadi kesalahan saat menyimpan: ' + (err && err.message ? err.message : String(err)));
	}
}

async function deleteUser(id) {
	const targetUser = readUsers().find((u) => u.id === id);
	if (isProtectedUserForAdmin(targetUser)) {
		alert('Admin tidak dapat menghapus user dengan role Admin atau Super Admin');
		return;
	}
	if (!confirm('Hapus user ini?')) return;
	const list = readUsers().filter(u => u.id !== id);
	writeUsers(list);
	if (isApiReady() && window.AIOSApi.deleteUser) {
		try {
			await window.AIOSApi.deleteUser(id);
		} catch (apiErr) {
			console.warn('Delete user API sync failed', apiErr && apiErr.message ? apiErr.message : apiErr);
		}
	}
	renderUserList(userSearch && userSearch.value);
}

// populate selects for departemen, perusahaan, ccow
function populateDeptOptions(selected) {
	const sel = document.getElementById('field-departemen');
	if (!sel) return;
	const list = readDepartments();
	sel.innerHTML = '<option value="">(Pilih Departemen)</option>';
	list.forEach(d => {
		const opt = document.createElement('option');
		opt.value = d.name || d.id || '';
		opt.textContent = d.name || d.id || '';
		if (selected && opt.value === selected) opt.selected = true;
		sel.appendChild(opt);
	});
}

function populateCompanyOptions(selected) {
	const sel = document.getElementById('field-perusahaan');
	if (!sel) return;
	const list = readCompanies();
	sel.innerHTML = '<option value="">(Pilih Perusahaan)</option>';
	list.forEach(c => {
		const opt = document.createElement('option');
		opt.value = c.name || c.id || '';
		opt.textContent = c.name || c.id || '';
		if (selected && opt.value === selected) opt.selected = true;
		sel.appendChild(opt);
	});
}

function populateCcowOptions(selected) {
	const sel = document.getElementById('field-ccow');
	if (!sel) return;
	const options = ['PT. Maruwai Coal','PT. Lahai Coal'];
	// ensure base option exists
	if (!sel.querySelector('option[value=""]')) sel.innerHTML = '<option value="">(Pilih CCOW)</option>';
	options.forEach(o => {
		if (!Array.from(sel.options).some(x => x.value === o)) {
			const opt = document.createElement('option'); opt.value = o; opt.textContent = o; sel.appendChild(opt);
		}
		if (selected) sel.value = selected;
	});
}

// Departments (Daftar Departemen) - simple CRUD saved in localStorage
const DEPT_KEY = 'aios_departments';

function readDepartments() {
	try {
		const raw = localStorage.getItem(DEPT_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch (e) {
		console.error('readDepartments', e);
		return [];
	}
}

function writeDepartments(list) {
	localStorage.setItem(DEPT_KEY, JSON.stringify(list));
}

async function syncDepartmentsFromApi() {
	if (!window.AIOSApi || typeof window.AIOSApi.listDepartments !== 'function') return;
	try {
		const rows = await window.AIOSApi.listDepartments();
		const localRows = readDepartments();
		if (shouldApplyApiList(localRows, rows, 'Departments')) writeDepartments(rows);
	} catch (e) {
		console.warn('syncDepartmentsFromApi failed', e && e.message ? e.message : e);
	}
}

function renderDeptList() {
	const tbody = document.getElementById('dept-list');
	if (!tbody) return;
	const list = readDepartments();
	tbody.innerHTML = '';
	if (list.length === 0) {
		const tr = document.createElement('tr');
		tr.innerHTML = '<td colspan="2" class="muted">Belum ada departemen</td>';
		tbody.appendChild(tr);
		return;
	}
	list.forEach(d => {
		const tr = document.createElement('tr');
		tr.innerHTML = `<td>${escapeHtml(d.name||'')}</td><td><button class="small edit-dept" data-id="${d.id}">Edit</button> <button class="small delete-dept" data-id="${d.id}">Hapus</button></td>`;
		tbody.appendChild(tr);
	});
}

function openDeptForm(dept) {
	const form = document.getElementById('dept-form');
	const title = document.getElementById('dept-form-title');
	const idField = document.getElementById('dept-id');
	const nameField = document.getElementById('dept-name');
	if (!form) return;
	form.classList.remove('hidden');
	if (dept) {
		title.textContent = 'Ubah Departemen';
		idField.value = dept.id;
		nameField.value = dept.name || '';
	} else {
		title.textContent = 'Tambah Departemen';
		idField.value = '';
		nameField.value = '';
	}
	nameField.focus();
}

function closeDeptForm() {
	const form = document.getElementById('dept-form');
	if (form) form.classList.add('hidden');
}

async function saveDeptFromForm() {
	const idField = document.getElementById('dept-id');
	const nameField = document.getElementById('dept-name');
	if (!nameField) return;
	const name = (nameField.value || '').trim();
	if (!name) return alert('Nama Departemen tidak boleh kosong');
	const id = idField.value || `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
	const list = readDepartments();
	const idx = list.findIndex(x => x.id === id);
	const obj = { id, name };
	if (idx >= 0) list[idx] = obj; else list.push(obj);
	writeDepartments(list);
	if (isApiReady()) {
		try {
			if (idx >= 0 && window.AIOSApi.updateDepartment) {
				await window.AIOSApi.updateDepartment(id, obj);
			} else if (window.AIOSApi.createDepartment) {
				await window.AIOSApi.createDepartment(obj);
			}
		} catch (apiErr) {
			console.warn('Department API sync failed', apiErr && apiErr.message ? apiErr.message : apiErr);
		}
	}
	renderDeptList();
	closeDeptForm();
}

async function deleteDept(id) {
	if (!confirm('Hapus departemen ini?')) return;
	const list = readDepartments().filter(d => d.id !== id);
	writeDepartments(list);
	if (isApiReady() && window.AIOSApi.deleteDepartment) {
		try {
			await window.AIOSApi.deleteDepartment(id);
		} catch (apiErr) {
			console.warn('Delete department API sync failed', apiErr && apiErr.message ? apiErr.message : apiErr);
		}
	}
	renderDeptList();
}

// small helper to avoid XSS when injecting names
function escapeHtml(s) {
	return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// wire department UI actions if present
document.addEventListener('click', (e) => {
	const edit = e.target.closest && e.target.closest('.edit-dept');
	const del = e.target.closest && e.target.closest('.delete-dept');
	if (edit) {
		const id = edit.getAttribute('data-id');
		const d = readDepartments().find(x => x.id === id);
		if (d) openDeptForm(d);
	}
	if (del) {
		const id = del.getAttribute('data-id');
			deleteDept(id).catch((err) => console.warn('deleteDept failed', err && err.message ? err.message : err));
	}
});

// add button & form handlers
const addDeptBtn = document.getElementById('add-dept-btn');
const saveDeptBtn = document.getElementById('save-dept-btn');
const cancelDeptBtn = document.getElementById('cancel-dept-btn');
if (addDeptBtn) addDeptBtn.addEventListener('click', () => openDeptForm());
if (saveDeptBtn) saveDeptBtn.addEventListener('click', async () => { await saveDeptFromForm(); });
if (cancelDeptBtn) cancelDeptBtn.addEventListener('click', () => closeDeptForm());

// Companies (Daftar Perusahaan) - CRUD for Super Admin
const COMPANY_KEY = 'aios_companies';

function readCompanies() {
	try {
		const raw = localStorage.getItem(COMPANY_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch (e) {
		console.error('readCompanies', e);
		return [];
	}
}

function writeCompanies(list) {
	localStorage.setItem(COMPANY_KEY, JSON.stringify(list));
}

async function syncCompaniesFromApi() {
	if (!window.AIOSApi || typeof window.AIOSApi.listCompanies !== 'function') return;
	try {
		const rows = await window.AIOSApi.listCompanies();
		const localRows = readCompanies();
		if (shouldApplyApiList(localRows, rows, 'Companies')) writeCompanies(rows);
	} catch (e) {
		console.warn('syncCompaniesFromApi failed', e && e.message ? e.message : e);
	}
}

function renderCompanyList() {
	const tbody = document.getElementById('company-list');
	if (!tbody) return;
	const list = readCompanies();
	tbody.innerHTML = '';
	if (list.length === 0) {
		const tr = document.createElement('tr');
		tr.innerHTML = '<td colspan="2" class="muted">Belum ada perusahaan</td>';
		tbody.appendChild(tr);
		return;
	}
	list.forEach(c => {
		const tr = document.createElement('tr');
		tr.innerHTML = `<td>${escapeHtml(c.name||'')}</td><td><button class="small edit-company" data-id="${c.id}">Edit</button> <button class="small delete-company" data-id="${c.id}">Hapus</button></td>`;
		tbody.appendChild(tr);
	});
}

function openCompanyForm(comp) {
	const form = document.getElementById('company-form');
	const title = document.getElementById('company-form-title');
	const idField = document.getElementById('company-id');
	const nameField = document.getElementById('company-name');
	if (!form) return;
	form.classList.remove('hidden');
	if (comp) {
		title.textContent = 'Ubah Perusahaan';
		idField.value = comp.id;
		nameField.value = comp.name || '';
	} else {
		title.textContent = 'Tambah Perusahaan';
		idField.value = '';
		nameField.value = '';
	}
	nameField.focus();
}

function closeCompanyForm() {
	const form = document.getElementById('company-form');
	if (form) form.classList.add('hidden');
}

async function saveCompanyFromForm() {
	const idField = document.getElementById('company-id');
	const nameField = document.getElementById('company-name');
	if (!nameField) return;
	const name = (nameField.value || '').trim();
	if (!name) return alert('Nama Perusahaan tidak boleh kosong');
	const id = idField.value || `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
	const list = readCompanies();
	const idx = list.findIndex(x => x.id === id);
	const obj = { id, name };
	if (idx >= 0) list[idx] = obj; else list.push(obj);
	writeCompanies(list);
	if (isApiReady()) {
		try {
			if (idx >= 0 && window.AIOSApi.updateCompany) {
				await window.AIOSApi.updateCompany(id, obj);
			} else if (window.AIOSApi.createCompany) {
				await window.AIOSApi.createCompany(obj);
			}
		} catch (apiErr) {
			console.warn('Company API sync failed', apiErr && apiErr.message ? apiErr.message : apiErr);
		}
	}
	renderCompanyList();
	closeCompanyForm();
}

async function deleteCompany(id) {
	if (!confirm('Hapus perusahaan ini?')) return;
	const list = readCompanies().filter(d => d.id !== id);
	writeCompanies(list);
	if (isApiReady() && window.AIOSApi.deleteCompany) {
		try {
			await window.AIOSApi.deleteCompany(id);
		} catch (apiErr) {
			console.warn('Delete company API sync failed', apiErr && apiErr.message ? apiErr.message : apiErr);
		}
	}
	renderCompanyList();
}

// company UI delegation
document.addEventListener('click', (e) => {
	const edit = e.target.closest && e.target.closest('.edit-company');
	const del = e.target.closest && e.target.closest('.delete-company');
	if (edit) {
		const id = edit.getAttribute('data-id');
		const c = readCompanies().find(x => x.id === id);
		if (c) openCompanyForm(c);
	}
	if (del) {
		const id = del.getAttribute('data-id');
		deleteCompany(id).catch((err) => console.warn('deleteCompany failed', err && err.message ? err.message : err));
	}
});

const addCompanyBtn = document.getElementById('add-company-btn');
const saveCompanyBtn = document.getElementById('save-company-btn');
const cancelCompanyBtn = document.getElementById('cancel-company-btn');
if (addCompanyBtn) addCompanyBtn.addEventListener('click', () => openCompanyForm());
if (saveCompanyBtn) saveCompanyBtn.addEventListener('click', async () => { await saveCompanyFromForm(); });
if (cancelCompanyBtn) cancelCompanyBtn.addEventListener('click', () => closeCompanyForm());


let currentUser = null;
const SESSION_KEY = 'aios_session';

function saveSession(user) {
	try { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch(e) { console.warn('saveSession', e); }
}

function loadSession() {
	try { const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; } catch(e){ return null; }
}

function clearSession() {
	try { localStorage.removeItem(SESSION_KEY); } catch(e) { /* ignore */ }
}

// Presence tracking (shared via localStorage)
const PRESENCE_KEY = 'aios_presence';
const PRESENCE_SIGNAL_KEY = 'aios_presence_signal';
const PRESENCE_TTL = 10000; // 10s, consider offline if no heartbeat
const PRESENCE_HEARTBEAT_MS = 5000;
const PRESENCE_REFRESH_MS = 5000;
const PRESENCE_SESSION_KEY = 'aios_presence_session_id';
const PRESENCE_CLEANUP_MAX_AGE = 24 * 60 * 60 * 1000; // 24h
let presenceHeartbeatId = null;
let presenceRefreshId = null;
let collabSocket = null;
let collabSocketReady = false;
let collabSocketLoading = null;

const presenceChannel = (() => {
	try {
		if (typeof BroadcastChannel !== 'undefined') return new BroadcastChannel('aios_presence_channel');
	} catch (_e) {
		// ignore
	}
	return null;
})();

function getPresenceSessionId() {
	try {
		let id = sessionStorage.getItem(PRESENCE_SESSION_KEY);
		if (id) return id;
		id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
		sessionStorage.setItem(PRESENCE_SESSION_KEY, id);
		return id;
	} catch (_e) {
		return `sess-fallback-${Math.random().toString(36).slice(2, 10)}`;
	}
}

// Chat (localStorage-based)
const CHAT_KEY = 'aios_chat';

function canUseCollabApi() {
	return !!(
		window.AIOSApi &&
		typeof window.AIOSApi.listPresence === 'function' &&
		typeof window.AIOSApi.heartbeatPresence === 'function' &&
		typeof window.AIOSApi.listChatMessages === 'function'
	);
}

function getCollabServerBase() {
	const fromApi = (window.AIOSApi && window.AIOSApi.baseUrl) ? String(window.AIOSApi.baseUrl) : '';
	if (fromApi) return fromApi.replace(/\/api\/?$/i, '');
	if (window.AIOS_API_BASE) return String(window.AIOS_API_BASE).replace(/\/api\/?$/i, '');
	return 'http://localhost:4000';
}

function ensureSocketClientLoaded() {
	if (typeof window.io === 'function') return Promise.resolve();
	if (collabSocketLoading) return collabSocketLoading;

	collabSocketLoading = new Promise((resolve, reject) => {
		const base = getCollabServerBase();
		const script = document.createElement('script');
		script.src = `${base}/socket.io/socket.io.js`;
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('Gagal memuat socket.io client'));
		document.head.appendChild(script);
	});

	return collabSocketLoading;
}

function upsertChatMessage(message) {
	if (!message || !message.id) return;
	const list = readChat();
	if (list.some((m) => m && m.id === message.id)) return;
	list.push(message);
	writeChat(list.slice(-500));
	renderChatMessages();
}

async function startSocketRealtime() {
	if (!currentUser || !canUseCollabApi()) return;
	try {
		await ensureSocketClientLoaded();
		if (typeof window.io !== 'function') return;

		if (!collabSocket) {
			const base = getCollabServerBase();
			const token = (window.AIOSApi && typeof window.AIOSApi.getToken === 'function') ? window.AIOSApi.getToken() : '';
			collabSocket = window.io(base, {
				transports: ['websocket', 'polling'],
				auth: {
					token,
					username: currentUser.username,
					role: currentUser.role
				}
			});

			collabSocket.on('connect', () => {
				collabSocketReady = true;
				collabSocket.emit('presence:join', {
					username: currentUser.username,
					role: currentUser.role,
					token: (window.AIOSApi && typeof window.AIOSApi.getToken === 'function') ? window.AIOSApi.getToken() : ''
				});
			});

			collabSocket.on('disconnect', () => {
				collabSocketReady = false;
			});

			collabSocket.on('presence:update', (map) => {
				if (map && typeof map === 'object') {
					writePresence(map);
					refreshPresenceUI();
				}
			});

			collabSocket.on('chat:new', (message) => {
				upsertChatMessage(message);
			});

			collabSocket.on('chat:snapshot', (rows) => {
				if (Array.isArray(rows)) {
					writeChat(rows);
					renderChatMessages();
				}
			});
		}
	} catch (e) {
		console.warn('startSocketRealtime failed', e && e.message ? e.message : e);
	}
}

function stopSocketRealtime() {
	if (!collabSocket) return;
	try {
		if (currentUser && collabSocketReady) {
			collabSocket.emit('presence:offline', {
				username: currentUser.username,
				role: currentUser.role,
				token: (window.AIOSApi && typeof window.AIOSApi.getToken === 'function') ? window.AIOSApi.getToken() : ''
			});
		}
		collabSocket.disconnect();
	} catch (_e) {
		// ignore
	}
	collabSocket = null;
	collabSocketReady = false;
}

function readChat() {
	try {
		const raw = localStorage.getItem(CHAT_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch (e) {
		console.error('readChat', e);
		return [];
	}
}

function writeChat(list) {
	localStorage.setItem(CHAT_KEY, JSON.stringify(list));
}

function addChatMessage(msg) {
	const list = readChat();
	list.push(msg);
	writeChat(list);
	renderChatMessages();
}

async function syncChatFromApi() {
	if (!canUseCollabApi() || collabSocketReady) return;
	try {
		const rows = await window.AIOSApi.listChatMessages();
		if (Array.isArray(rows)) {
			writeChat(rows);
			renderChatMessages();
		}
	} catch (e) {
		console.warn('syncChatFromApi failed', e && e.message ? e.message : e);
	}
}

async function syncPresenceFromApi() {
	if (!canUseCollabApi() || collabSocketReady) return;
	try {
		const map = await window.AIOSApi.listPresence();
		if (map && typeof map === 'object') {
			writePresence(map);
			refreshPresenceUI();
		}
	} catch (e) {
		console.warn('syncPresenceFromApi failed', e && e.message ? e.message : e);
	}
}

function renderChatMessages() {
	if (!chatMessagesEl) return;
	const list = readChat();
	chatMessagesEl.innerHTML = '';
	list.slice(-200).forEach(m => {
		const div = document.createElement('div');
		div.className = 'chat-msg' + (currentUser && m.username === currentUser.username ? ' me' : '');
		const meta = document.createElement('div');
		meta.className = 'meta';
		meta.textContent = `${m.username} • ${new Date(m.ts).toLocaleTimeString()}`;
		const bubble = document.createElement('div');
		bubble.className = 'bubble';
		bubble.textContent = m.text;
		div.appendChild(meta);
		div.appendChild(bubble);
		chatMessagesEl.appendChild(div);
	});
	chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

async function sendChat(text) {
	if (!currentUser) return alert('Silakan login terlebih dahulu untuk mengirim pesan');
	if (collabSocket && collabSocketReady) {
		collabSocket.emit('chat:send', {
			text,
			username: currentUser.username,
			role: currentUser.role,
			token: (window.AIOSApi && typeof window.AIOSApi.getToken === 'function') ? window.AIOSApi.getToken() : ''
		});
		return;
	}
	if (canUseCollabApi()) {
		try {
			await window.AIOSApi.sendChatMessage({ text, username: currentUser.username, role: currentUser.role });
			await syncChatFromApi();
			return;
		} catch (e) {
			console.warn('sendChatMessage API failed, fallback local:', e && e.message ? e.message : e);
		}
	}

	const msg = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, username: currentUser.username, role: currentUser.role, ts: Date.now(), text };
	addChatMessage(msg);
}


function readPresence() {
	try {
		const raw = localStorage.getItem(PRESENCE_KEY);
		const parsed = raw ? JSON.parse(raw) : {};
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch (e) {
		console.error('readPresence error', e);
		return {};
	}
}

function writePresence(obj) {
	localStorage.setItem(PRESENCE_KEY, JSON.stringify(obj));
}

function notifyPresenceChange() {
	try {
		localStorage.setItem(PRESENCE_SIGNAL_KEY, String(Date.now()));
	} catch (_e) {
		// ignore
	}
	if (presenceChannel) {
		try {
			presenceChannel.postMessage({ type: 'presence-updated', ts: Date.now() });
		} catch (_e) {
			// ignore
		}
	}
}

function normalizePresenceRecord(record) {
	const safe = record && typeof record === 'object' ? record : {};
	const sessions = safe.sessions && typeof safe.sessions === 'object' ? safe.sessions : {};

	if (Object.keys(sessions).length === 0 && (safe.lastSeen || safe.online)) {
		sessions.legacy = {
			lastSeen: Number(safe.lastSeen || Date.now()),
			online: !!safe.online,
			role: safe.role || 'User'
		};
	}

	return {
		username: safe.username || '',
		role: safe.role || 'User',
		sessions,
		lastSeen: Number(safe.lastSeen || 0),
		online: !!safe.online
	};
}

function upsertPresenceSession(username, role, isOnline) {
	if (!username) return;
	const now = Date.now();
	const sessionId = getPresenceSessionId();
	const p = readPresence();
	const existing = normalizePresenceRecord(p[username]);
	const sessions = existing.sessions || {};

	sessions[sessionId] = {
		lastSeen: now,
		online: !!isOnline,
		role: role || existing.role || 'User'
	};

	const hasOnlineSession = Object.values(sessions).some((s) => !!s.online && now - Number(s.lastSeen || 0) <= PRESENCE_TTL);
	p[username] = {
		username,
		role: role || existing.role || 'User',
		sessions,
		lastSeen: now,
		online: hasOnlineSession
	};

	writePresence(p);
	notifyPresenceChange();
}

function setPresenceOnline(username, role) {
	upsertPresenceSession(username, role, true);
	refreshPresenceUI();
	if (collabSocket && collabSocketReady) {
		collabSocket.emit('presence:join', {
			username,
			role,
			token: (window.AIOSApi && typeof window.AIOSApi.getToken === 'function') ? window.AIOSApi.getToken() : ''
		});
	}
	if (canUseCollabApi()) {
		window.AIOSApi.heartbeatPresence({ username, role }).then(() => syncPresenceFromApi()).catch((e) => {
			console.warn('heartbeatPresence API failed', e && e.message ? e.message : e);
		});
	}
}

function setPresenceOffline(username) {
	if (!username) return;
	const now = Date.now();
	const sessionId = getPresenceSessionId();
	const p = readPresence();
	const existing = normalizePresenceRecord(p[username]);
	const sessions = existing.sessions || {};

	if (!sessions[sessionId]) {
		sessions[sessionId] = { lastSeen: now, online: false, role: existing.role || 'User' };
	} else {
		sessions[sessionId].online = false;
		sessions[sessionId].lastSeen = now;
	}

	const hasOnlineSession = Object.values(sessions).some((s) => !!s.online && now - Number(s.lastSeen || 0) <= PRESENCE_TTL);
	p[username] = {
		username,
		role: existing.role || 'User',
		sessions,
		lastSeen: now,
		online: hasOnlineSession
	};

	writePresence(p);
	notifyPresenceChange();
	refreshPresenceUI();
	if (collabSocket && collabSocketReady) {
		collabSocket.emit('presence:offline', {
			username,
			role: existing.role || 'User',
			token: (window.AIOSApi && typeof window.AIOSApi.getToken === 'function') ? window.AIOSApi.getToken() : ''
		});
	}
	if (canUseCollabApi()) {
		window.AIOSApi.setPresenceOffline({ username, role: existing.role || 'User' }).then(() => syncPresenceFromApi()).catch((e) => {
			console.warn('setPresenceOffline API failed', e && e.message ? e.message : e);
		});
	}
}

function heartbeatPresence() {
	if (!currentUser) return;
	upsertPresenceSession(currentUser.username, currentUser.role, true);
	if (collabSocket && collabSocketReady) {
		collabSocket.emit('presence:heartbeat', {
			username: currentUser.username,
			role: currentUser.role,
			token: (window.AIOSApi && typeof window.AIOSApi.getToken === 'function') ? window.AIOSApi.getToken() : ''
		});
		return;
	}
	if (canUseCollabApi()) {
		window.AIOSApi.heartbeatPresence({ username: currentUser.username, role: currentUser.role }).catch((e) => {
			console.warn('heartbeatPresence API failed', e && e.message ? e.message : e);
		});
	}
}

function cleanupStalePresence() {
	const p = readPresence();
	const now = Date.now();
	let changed = false;
	Object.keys(p).forEach((username) => {
		const u = normalizePresenceRecord(p[username]);
		const sessions = u.sessions || {};

		Object.keys(sessions).forEach((sid) => {
			const sess = sessions[sid] || {};
			const lastSeen = Number(sess.lastSeen || 0);
			if (!!sess.online && now - lastSeen > PRESENCE_TTL) {
				sess.online = false;
				sessions[sid] = sess;
				changed = true;
			}
			if (now - lastSeen > PRESENCE_CLEANUP_MAX_AGE) {
				delete sessions[sid];
				changed = true;
			}
		});

		const hasSessions = Object.keys(sessions).length > 0;
		const hasOnlineSession = Object.values(sessions).some((s) => !!s.online && now - Number(s.lastSeen || 0) <= PRESENCE_TTL);
		if (!hasSessions) {
			delete p[username];
			changed = true;
			return;
		}

		const latestSeen = Object.values(sessions).reduce((max, s) => Math.max(max, Number(s.lastSeen || 0)), 0);
		p[username] = {
			username,
			role: u.role || 'User',
			sessions,
			lastSeen: latestSeen,
			online: hasOnlineSession
		};
	});

	if (changed) {
		writePresence(p);
		notifyPresenceChange();
	}
}

function refreshPresenceUI() {
	const p = readPresence();
	const listEl = document.getElementById('presence-list');
	const countOnlineEl = document.getElementById('count-online');
	const countOfflineEl = document.getElementById('count-offline');
	if (!listEl || !countOnlineEl || !countOfflineEl) return; // elements don't exist on this page
	const now = Date.now();

	const knownUsersMap = {};

	Object.keys(CREDENTIALS || {}).forEach((username) => {
		if (!username) return;
		const item = CREDENTIALS[username] || {};
		knownUsersMap[username] = {
			username,
			role: item.role || 'User',
			lastSeen: 0,
			online: false
		};
	});

	readUsers().forEach((u) => {
		const username = (u && u.username) ? String(u.username) : '';
		if (!username) return;
		if (!knownUsersMap[username]) {
			knownUsersMap[username] = {
				username,
				role: (u.role || u.kategori || 'User'),
				lastSeen: 0,
				online: false
			};
		} else if (!knownUsersMap[username].role || knownUsersMap[username].role === 'User') {
			knownUsersMap[username].role = (u.role || u.kategori || knownUsersMap[username].role || 'User');
		}
	});

	Object.values(p).forEach((raw) => {
		const u = normalizePresenceRecord(raw);
		const username = (u.username || '').trim();
		if (!username) return;
		const sessions = Object.values(u.sessions || {});
		const latestSeen = sessions.reduce((max, s) => Math.max(max, Number(s.lastSeen || 0)), Number(u.lastSeen || 0));
		const isOnline = sessions.some((s) => !!s.online && (now - Number(s.lastSeen || 0) <= PRESENCE_TTL));

		if (!knownUsersMap[username]) {
			knownUsersMap[username] = {
				username,
				role: u.role || 'User',
				lastSeen: latestSeen,
				online: isOnline
			};
		} else {
			knownUsersMap[username].role = knownUsersMap[username].role || u.role || 'User';
			knownUsersMap[username].lastSeen = Math.max(Number(knownUsersMap[username].lastSeen || 0), latestSeen);
			knownUsersMap[username].online = isOnline;
		}
	});

	const users = Object.values(knownUsersMap).sort((a,b) => {
		if (!!b.online !== !!a.online) return b.online ? 1 : -1;
		return (b.lastSeen || 0) - (a.lastSeen || 0);
	});

	const onlineUsers = [];
	const offlineUsers = [];

	users.forEach(u => {
		const isOnline = !!u.online;
		if (isOnline) onlineUsers.push(u);
		else offlineUsers.push(u);
	});

	countOnlineEl.textContent = String(onlineUsers.length);
	countOfflineEl.textContent = String(offlineUsers.length);

	function buildUserListHtml(rows, isOnline) {
		if (!rows.length) return '<li class="presence-empty">Tidak ada user</li>';
		return rows.map((u) => `
			<li>
				<span class="status-dot ${isOnline ? 'status-online' : 'status-offline'}"></span>
				<span>${escapeHtml(u.username || '-')} (${escapeHtml(u.role || 'User')})</span>
			</li>
		`).join('');
	}

	listEl.innerHTML = `
		<li class="presence-group">
			<details open>
				<summary>Online (${onlineUsers.length})</summary>
				<ul class="presence-sublist">${buildUserListHtml(onlineUsers, true)}</ul>
			</details>
		</li>
		<li class="presence-group">
			<details>
				<summary>Offline (${offlineUsers.length})</summary>
				<ul class="presence-sublist">${buildUserListHtml(offlineUsers, false)}</ul>
			</details>
		</li>
	`;
}

function startPresenceTracking() {
	if (presenceHeartbeatId) clearInterval(presenceHeartbeatId);
	if (presenceRefreshId) clearInterval(presenceRefreshId);

	heartbeatPresence();
	cleanupStalePresence();
	refreshPresenceUI();
	startSocketRealtime();
	syncPresenceFromApi();
	syncChatFromApi();

	presenceHeartbeatId = setInterval(() => {
		heartbeatPresence();
		cleanupStalePresence();
	}, PRESENCE_HEARTBEAT_MS);

	presenceRefreshId = setInterval(() => {
		cleanupStalePresence();
		syncPresenceFromApi();
		syncChatFromApi();
		refreshPresenceUI();
		if (typeof renderChatMessages === 'function') renderChatMessages();
	}, PRESENCE_REFRESH_MS);
}

function stopPresenceTracking() {
	if (presenceHeartbeatId) {
		clearInterval(presenceHeartbeatId);
		presenceHeartbeatId = null;
	}
	if (presenceRefreshId) {
		clearInterval(presenceRefreshId);
		presenceRefreshId = null;
	}
	stopSocketRealtime();
}

// listen for storage changes from other tabs
window.addEventListener('storage', (ev) => {
	if (!ev.key) return;
	if (ev.key === PRESENCE_KEY || ev.key === PRESENCE_SIGNAL_KEY) {
		cleanupStalePresence();
		refreshPresenceUI();
	}
	// chat updates
	if (ev.key === CHAT_KEY) {
		renderChatMessages();
	}
});

if (presenceChannel) {
	presenceChannel.addEventListener('message', (ev) => {
		if (!ev || !ev.data || ev.data.type !== 'presence-updated') return;
		cleanupStalePresence();
		refreshPresenceUI();
	});
}

document.addEventListener('visibilitychange', () => {
	if (!currentUser) return;
	if (document.visibilityState === 'visible') {
		heartbeatPresence();
		cleanupStalePresence();
		refreshPresenceUI();
	}
});


function authenticate(username, password) {
	// First check builtin superadmin credentials
	const u = CREDENTIALS[username];
	if (u && u.password === password) {
		console.log('Login via CREDENTIALS:', username, '- role:', u.role);
		return u.role;
	}
	
	// Then check registered users from aios_users (support username or email)
	const users = readUsers();
	const user = users.find(user => 
		(user.username === username || user.email === username) && user.password === password
	);
	
	if (user) {
		const role = user.kategori || user.role;
		console.log('Login via aios_users:', username, '- role:', role);
		return role;
	}
	
	console.log('Authentication failed for:', username);
	return null;
}

function showLoginError(msg) {
	if (loginMsg) {
		loginMsg.textContent = msg;
		loginMsg.classList.add('error');
		setTimeout(() => loginMsg.textContent = '', 3000);
	}
}

function updateSidePanelWidth() {
	const sidebars = [adminSidebar, superadminSidebar, userSidebar].filter((el) => el && !el.classList.contains('hidden'));
	if (!sidebars.length) return;

	let longestButtonWidth = 0;
	sidebars.forEach((sidebar) => {
		const buttons = Array.from(sidebar.querySelectorAll('.sidebar-btn'));
		buttons.forEach((btn) => {
			longestButtonWidth = Math.max(longestButtonWidth, Math.ceil(btn.scrollWidth));
		});
	});

	if (!longestButtonWidth) return;
	const panelWidth = Math.min(300, Math.max(190, longestButtonWidth + 34));
	document.documentElement.style.setProperty('--side-panel-width', panelWidth + 'px');
	const chatWidth = Math.min(360, panelWidth + 44);
	document.documentElement.style.setProperty('--chat-panel-width', chatWidth + 'px');
}

function showScreenForRole(role) {
	if (roleLabel) roleLabel.textContent = `${role}`;
	if (loginScreen) loginScreen.classList.add('hidden');
	if (mainScreen) mainScreen.classList.remove('hidden');
	// show sidebars per role
	if (adminSidebar) {
		if (role === 'Admin') adminSidebar.classList.remove('hidden'); else adminSidebar.classList.add('hidden');
	}
	if (superadminSidebar) {
		if (role === 'Super Admin') superadminSidebar.classList.remove('hidden'); else superadminSidebar.classList.add('hidden');
	}
	if (userSidebar) {
		if (role === 'User') userSidebar.classList.remove('hidden'); else userSidebar.classList.add('hidden');
	}
	setTimeout(updateSidePanelWidth, 0);
}

window.addEventListener('resize', updateSidePanelWidth);

if (loginBtn) {
loginBtn.addEventListener('click', async () => {
	const u = (usernameInput.value || '').trim();
	const p = passwordInput.value || '';

	let role = null;
	try {
		if (window.AIOSApi && typeof window.AIOSApi.login === 'function') {
			const response = await window.AIOSApi.login(u, p);
			if (response && response.user && response.user.role) {
				role = response.user.role;
			}
		}
	} catch (err) {
		console.warn('API login failed, fallback local auth:', err && err.message ? err.message : err);
	}

	if (!role) {
		role = authenticate(u, p);
	}

	if (!role) {
		showLoginError('Username atau password salah');
		return;
	}

	currentUser = { username: u, role };
	saveSession(currentUser);
	syncMasterDataFromApi();
	showScreenForRole(role);
	// mark presence online and start heartbeat
	setPresenceOnline(currentUser.username, currentUser.role);
	startPresenceTracking();
});
}

if (logoutBtn) {
logoutBtn.addEventListener('click', () => {
	if (currentUser) setPresenceOffline(currentUser.username);
	currentUser = null;
	clearSession();
	if (window.AIOSApi && typeof window.AIOSApi.clearToken === 'function') {
		window.AIOSApi.clearToken();
	}
	loginScreen.classList.remove('hidden');
	mainScreen.classList.add('hidden');
	usernameInput.value = '';
	passwordInput.value = '';
	stopPresenceTracking();
	if (adminSidebar) adminSidebar.classList.add('hidden');
	if (superadminSidebar) superadminSidebar.classList.add('hidden');
	if (userSidebar) userSidebar.classList.add('hidden');
});
}

// Admin sidebar actions (placeholders)
if (adminProfileBtn) adminProfileBtn.addEventListener('click', () => { window.location.href = 'profile.html'; });
if (adminAchievementBtn) adminAchievementBtn.addEventListener('click', () => { window.location.href = 'achievement.html'; });
if (adminTasklistBtn) adminTasklistBtn.addEventListener('click', () => { window.location.href = 'tasklist.html'; });
if (adminUsersBtn) adminUsersBtn.addEventListener('click', () => { window.location.href = 'daftar_user.html'; });
if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', () => logoutBtn.click());

// Super Admin sidebar actions
if (superadminProfileBtn) superadminProfileBtn.addEventListener('click', () => { window.location.href = 'profile.html'; });
if (superadminAchievementBtn) superadminAchievementBtn.addEventListener('click', () => { window.location.href = 'achievement.html'; });
if (superadminTasklistBtn) superadminTasklistBtn.addEventListener('click', () => { window.location.href = 'tasklist.html'; });
if (superadminUsersBtn) superadminUsersBtn.addEventListener('click', () => { window.location.href = 'daftar_user.html'; });
if (superadminDepartemenBtn) superadminDepartemenBtn.addEventListener('click', () => { window.location.href = 'daftar_departemen.html'; });
if (superadminPerusahaanBtn) superadminPerusahaanBtn.addEventListener('click', () => { window.location.href = 'daftar_perusahaan.html'; });
if (superadminPjaBtn) superadminPjaBtn.addEventListener('click', () => { window.location.href = 'daftar_pja.html'; });
if (superadminLogoutBtn) superadminLogoutBtn.addEventListener('click', () => logoutBtn.click());

// User sidebar actions (placeholders)
if (userProfileBtn) userProfileBtn.addEventListener('click', () => { window.location.href = 'profile.html'; });
if (userAchievementBtn) userAchievementBtn.addEventListener('click', () => { window.location.href = 'achievement.html'; });
if (userTasklistBtn) userTasklistBtn.addEventListener('click', () => { window.location.href = 'tasklist.html'; });
if (userLogoutBtn) userLogoutBtn.addEventListener('click', () => logoutBtn.click());
if (frontlineLeadershipBtn) frontlineLeadershipBtn.addEventListener('click', () => { window.location.href = 'frontline_leadership.html'; });
if (ohsTalkBtn) ohsTalkBtn.addEventListener('click', () => { window.location.href = 'ohs_talk.html'; });
if (observasiBtn) observasiBtn.addEventListener('click', () => { window.location.href = 'observasi.html'; });

// Admin 'Daftar User' opens separate page (handled by nav.js too)
if (adminUsersBtn) adminUsersBtn.addEventListener('click', () => { window.location.href = 'daftar_user.html'; });

// Add user button
if (addUserBtn) addUserBtn.addEventListener('click', () => {
	try {
		// If we're already on daftar_user.html, open the form inline
		const href = (window.location.href || '').toLowerCase();
		if (href.indexOf('daftar_user.html') !== -1) {
			try {
				openUserForm();
			} catch (err) {
				console.error('openUserForm error', err);
				alert('Gagal membuka form: ' + (err && err.message ? err.message : String(err)));
			}
			return;
		}
	} catch (e) { console.warn('addUserBtn click check', e); }
	// otherwise navigate to the full page and tell it to open the add form
	try {
		window.location.href = 'daftar_user.html?action=add';
	} catch (e) { console.warn('navigate to daftar_user failed', e); }
});
if (exportUserBtn) exportUserBtn.addEventListener('click', exportUserTableToExcel);
if (userSearch) userSearch.addEventListener('input', (e) => renderUserList(e.target.value));
if (saveUserBtn) {
	saveUserBtn.addEventListener('click', async () => {
		try {
			await saveUserFromForm();
		} catch (err) {
			console.error('Error in saveUserFromForm handler:', err);
			alert('Terjadi kesalahan: ' + (err.message || String(err)));
		}
	});
} else {
	console.warn('Warning: saveUserBtn not found - save button will not work');
}
if (cancelUserBtn) {
	cancelUserBtn.addEventListener('click', () => {
		try {
			closeUserForm();
		} catch (err) {
			console.error('Error closing form:', err);
		}
	});
} else {
	console.warn('Warning: cancelUserBtn not found');
}

// delegate edit/delete clicks
document.addEventListener('click', (e) => {
	const edit = e.target.closest && e.target.closest('.edit-user');
	const del = e.target.closest && e.target.closest('.delete-user');
	if (edit) {
		const id = edit.getAttribute('data-id');
		const u = readUsers().find(x => x.id === id);
		if (isProtectedUserForAdmin(u)) {
			alert('Admin tidak dapat mengubah user dengan role Admin atau Super Admin');
			return;
		}
		if (u) openUserForm(u);
	}
	if (del) {
		const id = del.getAttribute('data-id');
		deleteUser(id).catch((err) => console.warn('deleteUser failed', err && err.message ? err.message : err));
	}
});


// Initialize UI state
// restore session if present (so Back navigation preserves login)
const _session = loadSession();
if (_session) {
	currentUser = _session;
	syncMasterDataFromApi();
	if (typeof showScreenForRole === 'function') showScreenForRole(currentUser.role);
	// start presence heartbeat for restored session
	setPresenceOnline(currentUser.username, currentUser.role);
	startPresenceTracking();
}

// initialize presence UI state
cleanupStalePresence();
refreshPresenceUI();

// ensure presence set to offline on unload if needed
window.addEventListener('beforeunload', () => {
	if (currentUser) setPresenceOffline(currentUser.username);
	stopPresenceTracking();
});

// chat send handlers
if (chatSendBtn && chatInput) {
	chatSendBtn.addEventListener('click', () => {
		const t = (chatInput.value || '').trim();
		if (!t) return;
		sendChat(t);
		chatInput.value = '';
	});
	chatInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			chatSendBtn.click();
		}
	});
}

// render chat initially
renderChatMessages();

// ===== PJA Management Functions =====
function readPJA() {
	try {
		const raw = localStorage.getItem(PJA_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch (e) {
		console.error('readPJA', e);
		return [];
	}
}

function writePJA(list) {
	localStorage.setItem(PJA_KEY, JSON.stringify(list));
}

async function syncPjaFromApi() {
	if (!isApiReady() || !window.AIOSApi.listPja) return;
	try {
		const rows = await window.AIOSApi.listPja();
		const localRows = readPJA();
		if (shouldApplyApiList(localRows, rows, 'PJA')) writePJA(rows);
	} catch (e) {
		console.warn('syncPjaFromApi failed', e && e.message ? e.message : e);
	}
}

function populatePJAUserOptions() {
	const dropdown = document.getElementById('field-pja-user');
	if (!dropdown) return;
	const users = readUsers();
	const currentPjaList = readPJA();
	const pjaUserIds = currentPjaList.map(p => p.userId);
	
	// Store current selection
	const currentValue = dropdown.value;
	
	dropdown.innerHTML = '<option value="">(Pilih User)</option>';
	users.forEach(user => {
		// Allow selecting same user (for editing) but not duplicate in list
		const option = document.createElement('option');
		option.value = user.id;
		option.textContent = `${user.nama} (${user.username})`;
		dropdown.appendChild(option);
	});
	
	// Restore selection if it still exists
	if (currentValue) dropdown.value = currentValue;
}

function renderPJAList(filter) {
	const tbody = document.querySelector('#pja-list tbody');
	if (!tbody) return;
	
	const pjaList = readPJA();
	const users = readUsers();
	const q = (filter || '').toLowerCase();
	
	tbody.innerHTML = '';
	
	pjaList.filter(pja => {
		const user = users.find(u => u.id === pja.userId);
		const username = user ? user.username : '';
		const nama = user ? user.nama : '';
		return !q || username.toLowerCase().includes(q) || nama.toLowerCase().includes(q);
	}).forEach((pja, idx) => {
		const user = users.find(u => u.id === pja.userId);
		if (!user) return; // Skip if user not found
		
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td>${idx + 1}</td>
			<td>${user.nama || ''}</td>
			<td>${user.username || ''}</td>
			<td>${user.kategori || user.role || ''}</td>
			<td>
				<button class="small edit-pja" data-id="${pja.id}">Edit</button>
				<button class="small delete-pja" data-id="${pja.id}">Hapus</button>
			</td>
		`;
		tbody.appendChild(tr);
	});
}

function openPJAForm(pja) {
	const form = document.getElementById('pja-form');
	const formTitle = document.getElementById('pja-form-title');
	const pjaIdField = document.getElementById('pja-id');
	const userDropdown = document.getElementById('field-pja-user');
	
	if (!form || !formTitle || !pjaIdField || !userDropdown) {
		console.error('Error: PJA form elements not found');
		return;
	}
	
	populatePJAUserOptions();
	form.classList.remove('hidden');
	
	if (pja) {
		formTitle.textContent = 'Edit PJA';
		pjaIdField.value = pja.id;
		userDropdown.value = pja.userId;
	} else {
		formTitle.textContent = 'Tambah PJA';
		pjaIdField.value = '';
		userDropdown.value = '';
	}
}

function closePJAForm() {
	const form = document.getElementById('pja-form');
	if (form) form.classList.add('hidden');
	
	const pjaIdField = document.getElementById('pja-id');
	const userDropdown = document.getElementById('field-pja-user');
	if (pjaIdField) pjaIdField.value = '';
	if (userDropdown) userDropdown.value = '';
}

async function savePJAFromForm() {
	const pjaIdField = document.getElementById('pja-id');
	const userDropdown = document.getElementById('field-pja-user');
	
	if (!pjaIdField || !userDropdown) {
		console.error('Error: Form elements not found');
		return alert('Terjadi kesalahan: Form field tidak ditemukan.');
	}
	
	const id = pjaIdField.value.trim() || `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
	const userId = userDropdown.value.trim();
	
	// Validation
	if (!userId) return alert('User wajib dipilih');
	
	const users = readUsers();
	const selectedUser = users.find(u => u.id === userId);
	if (!selectedUser) return alert('User tidak ditemukan');
	
	// Get existing PJA list
	let pjaList = readPJA();
	
	// Check if editing or adding new
	const existingIdx = pjaList.findIndex(p => p.id === id);
	if (existingIdx >= 0) {
		// Edit existing
		pjaList[existingIdx] = { id, userId };
	} else {
		// Add new - check duplicate
		const duplicate = pjaList.find(p => p.userId === userId);
		if (duplicate) return alert('User ini sudah ada di daftar PJA');
		pjaList.push({ id, userId });
	}
	
	writePJA(pjaList);
	if (isApiReady()) {
		try {
			const payload = { id, userId };
			if (existingIdx >= 0 && window.AIOSApi.updatePja) {
				await window.AIOSApi.updatePja(id, payload);
			} else if (window.AIOSApi.createPja) {
				await window.AIOSApi.createPja(payload);
			}
		} catch (apiErr) {
			console.warn('PJA API sync failed', apiErr && apiErr.message ? apiErr.message : apiErr);
		}
	}
	closePJAForm();
	renderPJAList();
}

async function deletePJA(id) {
	if (!confirm('Hapus PJA ini?')) return;
	
	let pjaList = readPJA();
	pjaList = pjaList.filter(p => p.id !== id);
	writePJA(pjaList);
	if (isApiReady() && window.AIOSApi.deletePja) {
		try {
			await window.AIOSApi.deletePja(id);
		} catch (apiErr) {
			console.warn('Delete PJA API sync failed', apiErr && apiErr.message ? apiErr.message : apiErr);
		}
	}
	renderPJAList();
}

async function initPjaManagement() {
	const addBtn = document.getElementById('add-pja-btn');
	const saveBtn = document.getElementById('save-pja-btn');
	const cancelBtn = document.getElementById('cancel-pja-btn');
	const searchInput = document.getElementById('pja-search');
	
	if (addBtn) {
		addBtn.addEventListener('click', () => openPJAForm(null));
	}
	
	if (saveBtn) {
		saveBtn.addEventListener('click', async () => {
			try {
				await savePJAFromForm();
			} catch (err) {
				console.error('Error saving PJA:', err);
				alert('Terjadi kesalahan: ' + (err.message || String(err)));
			}
		});
	}
	
	if (cancelBtn) {
		cancelBtn.addEventListener('click', () => closePJAForm());
	}
	
	if (searchInput) {
		searchInput.addEventListener('input', (e) => renderPJAList(e.target.value));
	}
	
	// Delegate edit/delete clicks
	document.addEventListener('click', (e) => {
		const editBtn = e.target.closest('.edit-pja');
		const delBtn = e.target.closest('.delete-pja');
		
		if (editBtn) {
			const pjaId = editBtn.getAttribute('data-id');
			const pja = readPJA().find(p => p.id === pjaId);
			if (pja) openPJAForm(pja);
		}
		
		if (delBtn) {
			const pjaId = delBtn.getAttribute('data-id');
			deletePJA(pjaId).catch((err) => console.warn('deletePJA failed', err && err.message ? err.message : err));
		}
	});
	
	try {
		await syncUsersFromApi();
		await syncPjaFromApi();
	} catch (e) {
		console.warn('initPjaManagement sync failed', e && e.message ? e.message : e);
	}

	// Initial render
	renderPJAList();
}
// ===== End PJA Management =====

// Expose small helper for debugging in console
window.AIOS = {};

