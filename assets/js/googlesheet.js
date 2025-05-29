// =================== KONFIGURASI ===================
// GANTI DENGAN SATU URL Web App utama Anda dari Google Apps Script
const scriptURL = 'https://script.google.com/macros/s/AKfycbx2RRXKru_qYZLPclkboOXE98dQLYmECQTo8-S9aWK9sfNkkUojm_xrjxQysH7qXi0m/exec';

// Daftarkan semua ID form dan tipe form yang sesuai di sini.
// ID form harus sama persis dengan atribut 'id' pada tag <form> di HTML Anda.
// 'formType' akan dikirim ke Apps Script untuk identifikasi.
// 'uniqueFields' adalah array nama field yang akan dicek duplikasinya di Apps Script.
const formsConfig = {
    'form-pendaftaran-lomba': { // ID untuk formulir Pendaftaran Lomba (SESUAI HTML)
        formType: 'lomba',
        uniqueFields: ['nama_tim'] // Cek duplikasi berdasarkan 'nama_tim'
    },
    'form-pendaftaran-cp': { // ID untuk formulir Pendaftaran Competitive Programming (SESUAI HTML)
        formType: 'cp',
        uniqueFields: ['nama', 'no_telepon'] // Cek duplikasi berdasarkan 'nama' DAN 'no_telepon'
    },
    'form-pendaftaran-webinar': { // ID untuk formulir Pendaftaran Webinar (SESUAI HTML)
        formType: 'webinar',
        uniqueFields: ['nama', 'no_telepon'] // Cek duplikasi berdasarkan 'nama' DAN 'no_telepon'
    },
    'form-pendaftaran-seminar': { // ID untuk formulir Pendaftaran Seminar (SESUAI HTML)
        formType: 'seminar',
        uniqueFields: ['nama', 'no_telepon'] // Cek duplikasi berdasarkan 'nama' DAN 'no_telepon'
    }
    // Jika ada form lain, tambahkan di sini dengan format yang sama
};
// ===================================================

// Fungsi generik untuk menginisialisasi dan menangani pengiriman setiap formulir
const initForm = (formId, config) => {
    const form = document.getElementById(formId);

    if (!form) {
        // Jika formulir dengan ID ini tidak ada di halaman, hentikan eksekusi untuk form ini.
        return;
    }

    const submitButton = form.querySelector('input[type="submit"]');
    if (!submitButton) {
        console.error(`Tombol submit tidak ditemukan pada form dengan ID "${formId}".`);
        return;
    }

    // Buat elemen untuk menampilkan pesan status, hanya jika belum ada
    let statusMessageContainer = form.querySelector('.status-message-container');
    if (!statusMessageContainer) {
        statusMessageContainer = document.createElement('div');
        statusMessageContainer.className = 'status-message-container'; // Tambahkan kelas untuk styling jika perlu
        statusMessageContainer.style.marginTop = '15px';
        statusMessageContainer.style.fontWeight = 'bold';
        if (submitButton.parentElement) {
            submitButton.parentElement.insertAdjacentElement('afterend', statusMessageContainer);
        } else {
            form.appendChild(statusMessageContainer);
        }
    }


    form.addEventListener('submit', e => {
        e.preventDefault();

        submitButton.disabled = true;
        submitButton.value = "Memeriksa & Mengirim...";
        statusMessageContainer.style.color = 'black'; // Warna default saat loading
        statusMessageContainer.textContent = 'Sedang memproses data dan mengunggah file...';

        const formData = new FormData(form);
        formData.append('formType', config.formType);

        // Tambahkan data untuk pengecekan duplikasi ke FormData
        config.uniqueFields.forEach(fieldName => {
            const fieldElement = form.elements[fieldName];
            if (fieldElement) {
                formData.append(`check_${fieldName}`, fieldElement.value);
            }
        });


        const fileInputs = form.querySelectorAll('input[type="file"]');
        let filePromises = [];

        fileInputs.forEach(fileInput => {
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const reader = new FileReader();
                let promise = new Promise((resolve, reject) => {
                    reader.onloadend = () => {
                        resolve({ name: fileInput.name, filename: file.name, value: reader.result });
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                filePromises.push(promise);
            }
        });

        Promise.all(filePromises)
            .then(files => {
                files.forEach(fileData => {
                    formData.append(fileData.name, fileData.value);
                    formData.append(fileData.name + '_filename', fileData.filename);
                });

                return fetch(scriptURL, { method: 'POST', body: formData });
            })
            .then(response => {
                if (!response.ok) {
                    // Jika respons server tidak OK (misal: error 500), coba baca teks errornya
                    return response.text().then(text => { 
                        // Coba parse sebagai JSON jika mungkin, jika tidak, gunakan teks mentah
                        try {
                            const errData = JSON.parse(text);
                            throw new Error(errData.error || `Server error: ${response.status}`);
                        } catch (parseError) {
                            throw new Error(`Server error: ${response.status} - ${text}`);
                        }
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.result === 'success') {
                    statusMessageContainer.style.color = 'green';
                    statusMessageContainer.textContent = "Terima kasih! Formulir Anda telah berhasil dikirim.";
                    form.reset();
                } else if (data.result === 'error') {
                    if (data.isDuplicate) {
                        // "Mengabaikan" error duplikasi dengan menampilkan pesan informatif
                        // dan tetap mereset formulir.
                        statusMessageContainer.style.color = '#007bff'; // Warna biru informatif
                        // Menggunakan pesan error dari server yang menjelaskan field mana yang duplikat.
                        statusMessageContainer.textContent = data.error || "Informasi pendaftaran ini sudah ada.";
                        form.reset(); // Tetap reset formulir
                    } else {
                        // Menangani error lain yang bukan duplikasi
                        statusMessageContainer.style.color = 'red';
                        statusMessageContainer.textContent = data.error || 'Terjadi kesalahan yang tidak diketahui dari server.';
                    }
                } else {
                    // Menangani struktur respons yang tidak diharapkan
                    statusMessageContainer.style.color = 'red';
                    statusMessageContainer.textContent = 'Respons tidak dikenal dari server.';
                }
            })
            .catch(error => {
                console.error('Error pada form:', formId, error);
                statusMessageContainer.style.color = 'red';
                statusMessageContainer.textContent = `Gagal mengirim formulir: ${error.message}. Silakan coba lagi.`;
            })
            .finally(() => {
                submitButton.disabled = false;
                submitButton.value = "Kirim"; // Kembalikan teks tombol submit ke semula
            });
    });
};

// Event listener ini akan berjalan setelah seluruh halaman HTML selesai dimuat.
// Ini akan mencari dan menginisialisasi semua form yang terdaftar di formsConfig.
document.addEventListener('DOMContentLoaded', () => {
    for (const formId in formsConfig) {
        initForm(formId, formsConfig[formId]);
    }
});